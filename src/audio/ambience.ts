import { music } from "./music";

export type AmbienceKind = "day" | "night";

export interface Ambience {
  play(kind: AmbienceKind): void;
  stop(): void;
  current(): AmbienceKind | null;
}

type Deps = { createAudio?: (src: string) => HTMLAudioElement; isEnabled?: () => boolean };

const VOLUME = 0.35;
const FADE_MS = 1500;
const STEP_MS = 50;

export function createAmbience(deps: Deps = {}): Ambience {
  const createAudio = deps.createAudio ?? ((src: string) => new Audio(src));
  const isEnabled = deps.isEnabled ?? (() => music.isEnabled());

  type Voice = { audio: HTMLAudioElement; kind: AmbienceKind; timer?: ReturnType<typeof setInterval> };
  let active: Voice | null = null;

  /** One ramp per voice: starting a new one cancels the previous (a fast toggle never leaves two ramps fighting). */
  function ramp(v: Voice, from: number, to: number, done?: () => void): void {
    if (v.timer !== undefined) clearInterval(v.timer);
    const start = Date.now();
    try {
      v.audio.volume = from;
    } catch {
      /* ignore */
    }
    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / FADE_MS);
      try {
        v.audio.volume = from + (to - from) * t;
      } catch {
        /* ignore */
      }
      if (t >= 1) {
        clearInterval(timer);
        if (v.timer === timer) v.timer = undefined;
        done?.();
      }
    }, STEP_MS);
    v.timer = timer;
  }

  function fadeOut(v: Voice): void {
    ramp(v, v.audio.volume, 0, () => {
      try {
        v.audio.pause();
      } catch {
        /* ignore */
      }
    });
  }

  return {
    play(kind) {
      if (!isEnabled()) return;
      if (active?.kind === kind) return;
      try {
        const audio = createAudio(`/audio/ambient/${kind}.mp3`);
        audio.loop = true;
        audio.volume = 0;
        void Promise.resolve(audio.play()).catch(() => {});
        const previous = active;
        const voice: Voice = { audio, kind };
        active = voice;
        ramp(voice, 0, VOLUME);
        if (previous) fadeOut(previous);
      } catch {
        /* no audio: stay silent */
      }
    },
    stop() {
      if (active) fadeOut(active);
      active = null;
    },
    current: () => active?.kind ?? null,
  };
}

export const ambience: Ambience = createAmbience();
