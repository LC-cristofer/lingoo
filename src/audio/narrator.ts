import type { Media } from "@/domain/content-schema";

export interface Narrator {
  /** Call from a user gesture (tap or click): audio stays silent until then. */
  unlock(): void;
  play(media: Media): Promise<void>;
  stop(): void;
  isUnlocked(): boolean;
}

export interface NarratorDeps {
  speech?: SpeechSynthesis | null;
  createAudio?: (src: string) => HTMLAudioElement;
  /** Speech only: after this, play() resolves (the UI moves on) but the speech is not cut off. */
  timeoutMs?: number;
}

function defaultSpeech(): SpeechSynthesis | null {
  return typeof window !== "undefined" ? (window.speechSynthesis ?? null) : null;
}

/** An exact en-US voice first, then any English one. */
function pickVoice(speech: SpeechSynthesis): SpeechSynthesisVoice | undefined {
  const voices = speech.getVoices?.() ?? [];
  const lang = (v: SpeechSynthesisVoice) => v.lang.replace("_", "-").toLowerCase();
  return voices.find((v) => lang(v) === "en-us") ?? voices.find((v) => lang(v).startsWith("en"));
}

/** Fallback past a src file's own duration, once its metadata is known. */
const AUDIO_MARGIN_MS = 2_000;
/** Fallback for a src file whose duration is unknown. */
const AUDIO_CAP_MS = 120_000;

export function createNarrator(deps: NarratorDeps = {}): Narrator {
  const createAudio = deps.createAudio ?? ((src: string) => new Audio(src));
  let unlocked = false;
  let stopCurrent: (() => void) | null = null;

  const getSpeech = () => (deps.speech !== undefined ? deps.speech : defaultSpeech());

  function stop() {
    const fn = stopCurrent;
    stopCurrent = null;
    fn?.();
  }

  function play(media: Media): Promise<void> {
    stop();
    if (!unlocked) return Promise.resolve();

    return new Promise<void>((resolve) => {
      let cleanup: () => void = () => {};
      let released = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      // Unblocks whoever awaits play(). On the safety timeout the output keeps going:
      // stopCurrent stays armed, so a later stop() or play() still silences it.
      const release = () => {
        clearTimeout(timer);
        if (released) return;
        released = true;
        resolve();
      };
      // The output is over: ended, failed or never started.
      const finish = () => {
        if (stopCurrent === halt) stopCurrent = null;
        release();
      };
      // Interrupted by stop() or a newer play(): silence the output, then finish.
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
      stopCurrent = halt;

      try {
        if (media.src) {
          const audio = createAudio(media.src);
          cleanup = () => audio.pause();
          audio.onended = finish;
          audio.onerror = finish;
          // A song file can be long: wait for its real length, never the word-based guess.
          audio.onloadedmetadata = () => {
            if (!released && Number.isFinite(audio.duration) && audio.duration > 0) {
              safety(audio.duration * 1000 + AUDIO_MARGIN_MS);
            }
          };
          safety(AUDIO_CAP_MS);
          Promise.resolve(audio.play()).catch(finish);
          return;
        }
        const speech = getSpeech();
        if (!speech || typeof SpeechSynthesisUtterance === "undefined") {
          finish();
          return;
        }
        const words = media.text.trim().split(/\s+/).filter(Boolean).length;
        safety(deps.timeoutMs ?? Math.max(4000, 400 * words));
        const utterance = new SpeechSynthesisUtterance(media.text);
        utterance.lang = "en-US";
        utterance.rate = 0.85;
        const voice = pickVoice(speech);
        if (voice) utterance.voice = voice;
        utterance.onend = finish;
        utterance.onerror = finish;
        // Chrome and Safari drop an utterance spoken right after cancel(): speak in a later task,
        // and only if this play is still the current one.
        const deferred = setTimeout(() => {
          if (stopCurrent !== halt) return;
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
      } catch {
        finish();
      }
    });
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
    play,
    stop,
    isUnlocked: () => unlocked,
  };
}

export const narrator: Narrator = createNarrator();
