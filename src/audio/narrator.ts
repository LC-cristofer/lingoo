import { audioSrc } from "@/domain/trail/audio-id";
import type { Narration, Segment } from "@/domain/trail/schema";

export type SfxName = "correct" | "retry" | "star" | "chest" | "tap";

export interface Narrator {
  /** Call from a user gesture (tap or click): audio stays silent until then. */
  unlock(): void;
  /**
   * Plays each segment in order. A newer playNarration or stop() cancels the rest.
   * With `ifIdle`, it is dropped instead when another narration is still going (it never interrupts one).
   */
  playNarration(narration: Narration, options?: { ifIdle?: boolean }): Promise<void>;
  /** Fire-and-forget sound effect on top of the voice; a no-op before unlock. */
  playSfx(name: SfxName): void;
  /** Silences the voice and any sound effect that is still playing. */
  stop(): void;
  isUnlocked(): boolean;
  /** True while a narration is going (sound effects do not count). The background music ducks on it. */
  isSpeaking(): boolean;
  /** Calls `listener` whenever isSpeaking() changes; returns the unsubscribe. */
  onSpeakingChange(listener: (speaking: boolean) => void): () => void;
}

export interface NarratorDeps {
  speech?: SpeechSynthesis | null;
  createAudio?: (src: string) => HTMLAudioElement;
  /** Speech only: after this, the narration resolves (the UI moves on) but the speech is not cut off. */
  timeoutMs?: number;
}

function defaultSpeech(): SpeechSynthesis | null {
  return typeof window !== "undefined" ? (window.speechSynthesis ?? null) : null;
}

/** An exact voice for the language first, then any voice with the same language prefix. */
function pickVoice(speech: SpeechSynthesis, wanted: string): SpeechSynthesisVoice | undefined {
  const voices = speech.getVoices?.() ?? [];
  const norm = (l: string) => l.replace("_", "-").toLowerCase();
  const exact = norm(wanted);
  const prefix = exact.split("-")[0];
  return (
    voices.find((v) => norm(v.lang) === exact) ??
    voices.find((v) => norm(v.lang).split("-")[0] === prefix)
  );
}

/** Fallback past a src file's own duration, once its metadata is known. */
const AUDIO_MARGIN_MS = 2_000;
/** Fallback for a src file whose duration is unknown. */
const AUDIO_CAP_MS = 120_000;
/** A narration segment whose audio shows no sign of life by now is treated as failed. */
const AUDIO_LOAD_TIMEOUT_MS = 3_000;

export function createNarrator(deps: NarratorDeps = {}): Narrator {
  const createAudio = deps.createAudio ?? ((src: string) => new Audio(src));
  let unlocked = false;
  let stopCurrent: (() => void) | null = null;

  const listeners = new Set<(speaking: boolean) => void>();
  let lastSpeaking = false;
  /** Tells the listeners when "a narration is going" flipped. Called after the state settled, so a narration
   * replacing another one never reports a silence in between. */
  function notifySpeaking() {
    const now = stopCurrent !== null;
    if (now === lastSpeaking) return;
    lastSpeaking = now;
    for (const listener of [...listeners]) {
      try {
        listener(now);
      } catch {
        // a listener must never break the narrator
      }
    }
  }

  const getSpeech = () => (deps.speech !== undefined ? deps.speech : defaultSpeech());

  /** Sound effects still sounding, so stop() can cut them. */
  const sfxPlaying = new Set<HTMLAudioElement>();

  /** Silences the voice only. A new narration calls this, so the effect played just before it keeps sounding. */
  function stopVoice() {
    const fn = stopCurrent;
    stopCurrent = null;
    fn?.();
  }

  /** Silences the voice and every sound effect (leaving a screen). */
  function stop() {
    stopVoice();
    notifySpeaking();
    for (const audio of sfxPlaying) {
      try {
        audio.pause();
      } catch {
        // best-effort
      }
    }
    sfxPlaying.clear();
  }

  interface Item {
    text: string;
    src?: string;
    lang: string;
    /** On audio failure, speak the text instead (narration segments). */
    speechFallback: boolean;
  }
  /** How a running item registers its halt: a narration registers its halt in its own slot. */
  interface Slot {
    arm(halt: () => void): void;
    disarm(halt: () => void): void;
    armed(halt: () => void): boolean;
  }

  function run(item: Item, slot: Slot): Promise<void> {
    return new Promise<void>((resolve) => {
      let cleanup: () => void = () => {};
      let released = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let loadTimer: ReturnType<typeof setTimeout> | undefined;
      // Unblocks whoever awaits. On the safety timeout the output keeps going:
      // the halt stays armed, so a later stop() or narration still silences it.
      const release = () => {
        clearTimeout(timer);
        clearTimeout(loadTimer);
        if (released) return;
        released = true;
        resolve();
      };
      // The output is over: ended, failed or never started.
      const finish = () => {
        slot.disarm(halt);
        release();
      };
      // Interrupted by stop() or a newer narration: silence the output, then finish.
      const halt = () => {
        try {
          cleanup();
        } catch {
          // ignore
        }
        finish();
      };
      const safety = (ms: number) => {
        clearTimeout(timer);
        timer = setTimeout(release, ms);
      };
      slot.arm(halt);

      const startSpeech = () => {
        const speech = getSpeech();
        if (!speech || typeof SpeechSynthesisUtterance === "undefined") {
          finish();
          return;
        }
        const words = item.text.trim().split(/\s+/).filter(Boolean).length;
        safety(deps.timeoutMs ?? Math.max(4000, 400 * words));
        const utterance = new SpeechSynthesisUtterance(item.text);
        utterance.lang = item.lang;
        utterance.rate = 0.85;
        const voice = pickVoice(speech, item.lang);
        if (voice) utterance.voice = voice;
        utterance.onend = finish;
        utterance.onerror = finish;
        // Chrome and Safari drop an utterance spoken right after cancel(): speak in a later task,
        // and only if this run is still the current one.
        const deferred = setTimeout(() => {
          if (!slot.armed(halt)) return;
          try {
            speech.speak(utterance);
          } catch {
            finish();
          }
        }, 0);
        cleanup = () => {
          clearTimeout(deferred);
          if (speech.speaking || speech.pending) speech.cancel();
        };
      };

      try {
        if (item.src) {
          const audio = createAudio(item.src);
          let failed = false;
          const failure = () => {
            // A failed load fires error AND rejects play(): only the first one counts.
            if (failed) return;
            if (released || !slot.armed(halt)) return finish();
            failed = true;
            clearTimeout(loadTimer);
            if (!item.speechFallback) return finish();
            try {
              audio.pause();
            } catch {
              // ignore
            }
            audio.onended = null;
            audio.onerror = null;
            audio.onloadedmetadata = null;
            audio.onplaying = null;
            try {
              startSpeech();
            } catch {
              finish();
            }
          };
          cleanup = () => audio.pause();
          audio.onended = finish;
          audio.onerror = failure;
          // A song file can be long: wait for its real length, never the word-based guess.
          const alive = () => clearTimeout(loadTimer);
          audio.onplaying = alive;
          audio.onloadedmetadata = () => {
            alive();
            if (!released && Number.isFinite(audio.duration) && audio.duration > 0) {
              safety(audio.duration * 1000 + AUDIO_MARGIN_MS);
            }
          };
          safety(AUDIO_CAP_MS);
          if (item.speechFallback) loadTimer = setTimeout(failure, AUDIO_LOAD_TIMEOUT_MS);
          try {
            Promise.resolve(audio.play()).catch(failure);
          } catch {
            failure();
          }
          return;
        }
        startSpeech();
      } catch {
        finish();
      }
    });
  }

  async function playNarration(narration: Narration, options?: { ifIdle?: boolean }): Promise<void> {
    if (!unlocked) {
      stopVoice();
      notifySpeaking();
      return;
    }
    if (options?.ifIdle && stopCurrent) return;
    stopVoice();
    let cancelled = false;
    let inner: (() => void) | null = null;
    const halt = () => {
      cancelled = true;
      const fn = inner;
      inner = null;
      fn?.();
    };
    stopCurrent = halt;
    notifySpeaking();
    const slot: Slot = {
      arm: (h) => {
        inner = h;
      },
      disarm: (h) => {
        if (inner === h) inner = null;
      },
      armed: (h) => !cancelled && inner === h,
    };
    try {
      for (const seg of narration as Segment[]) {
        if (cancelled) return;
        // A segment that hit its safety timeout may still be sounding: silence it first.
        const lingering = inner as (() => void) | null;
        if (lingering) lingering();
        await run({ text: seg.text, src: audioSrc(seg), lang: seg.lang, speechFallback: true }, slot);
      }
    } finally {
      if (stopCurrent === halt && !inner) stopCurrent = null;
      notifySpeaking();
    }
  }

  function playSfx(name: SfxName): void {
    if (!unlocked) return;
    try {
      const audio = createAudio(`/audio/sfx/${name}.mp3`);
      sfxPlaying.add(audio);
      const done = () => void sfxPlaying.delete(audio);
      audio.onended = done;
      audio.onerror = done;
      Promise.resolve(audio.play()).catch(done);
    } catch {
      // sound effects are best-effort
    }
  }

  return {
    unlock() {
      if (unlocked) return;
      unlocked = true;
      // iOS Safari only lets speechSynthesis start inside a user gesture: speak a silent,
      // empty utterance now, so later narration (after navigation or a timer) is allowed.
      try {
        const speech = getSpeech();
        if (!speech || typeof SpeechSynthesisUtterance === "undefined") return;
        const primer = new SpeechSynthesisUtterance("");
        primer.volume = 0;
        speech.speak(primer);
      } catch {
        // priming is best-effort
      }
    },
    playNarration,
    playSfx,
    stop,
    isUnlocked: () => unlocked,
    isSpeaking: () => stopCurrent !== null,
    onSpeakingChange(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

export const narrator: Narrator = createNarrator();
