import type { Media } from "@/domain/content-schema";

export interface Narrator {
  unlock(): void;
  play(media: Media): Promise<void>;
  stop(): void;
  isUnlocked(): boolean;
}

export interface NarratorDeps {
  speech?: SpeechSynthesis | null;
  createAudio?: (src: string) => HTMLAudioElement;
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
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (stopCurrent === halt) stopCurrent = null;
        resolve();
      };
      // Called when interrupted: silence the output and resolve.
      const halt = () => {
        try {
          cleanup();
        } catch {
          // ignore
        }
        settle();
      };
      stopCurrent = halt;

      const words = media.text.trim().split(/\s+/).filter(Boolean).length;
      const timeoutMs = deps.timeoutMs ?? Math.max(4000, 400 * words);
      const timer = setTimeout(halt, timeoutMs);

      try {
        if (media.src) {
          const audio = createAudio(media.src);
          cleanup = () => audio.pause();
          audio.onended = settle;
          audio.onerror = settle;
          Promise.resolve(audio.play()).catch(settle);
          return;
        }
        const speech = getSpeech();
        if (!speech || typeof SpeechSynthesisUtterance === "undefined") {
          settle();
          return;
        }
        const utterance = new SpeechSynthesisUtterance(media.text);
        utterance.lang = "en-US";
        utterance.rate = 0.85;
        const voice = pickVoice(speech);
        if (voice) utterance.voice = voice;
        utterance.onend = settle;
        utterance.onerror = settle;
        // Chrome and Safari drop an utterance spoken right after cancel(): speak in a later task,
        // and only if this play has not been interrupted meanwhile.
        const deferred = setTimeout(() => {
          if (settled || stopCurrent !== halt) return;
          try {
            speech.speak(utterance);
          } catch {
            settle();
          }
        }, 0);
        cleanup = () => {
          clearTimeout(deferred);
          if (speech.speaking || speech.pending) speech.cancel();
        };
      } catch {
        settle();
      }
    });
  }

  return {
    unlock() {
      unlocked = true;
    },
    play,
    stop,
    isUnlocked: () => unlocked,
  };
}

export const narrator: Narrator = createNarrator();
