import { music } from "./music";

export type AmbienceKind = "day" | "night";

export interface Ambience {
  play(kind: AmbienceKind): void;
  stop(): void;
  current(): AmbienceKind | null;
}

type Deps = {
  createAudio?: (src: string) => HTMLAudioElement;
  isEnabled?: () => boolean;
  /** Where the first touch and the visibility changes come from (the page's document by default). */
  doc?: Pick<Document, "addEventListener" | "visibilityState"> | null;
};
const GESTURES = ["touchend", "click", "keydown"] as const;

const VOLUME = 0.35;
const FADE_MS = 1500;
const STEP_MS = 50;

export function createAmbience(deps: Deps = {}): Ambience {
  const createAudio = deps.createAudio ?? ((src: string) => new Audio(src));
  const isEnabled = deps.isEnabled ?? (() => music.isEnabled());

  const doc = deps.doc === undefined ? (typeof document === "undefined" ? null : document) : deps.doc;

  /** `blocked`: the loop is wanted but is not playing (autoplay refused, or the app is in the background). */
  type Voice = { audio: HTMLAudioElement; kind: AmbienceKind; blocked: boolean; timer?: ReturnType<typeof setInterval> };
  let active: Voice | null = null;
  let listening = false;

  const hidden = () => doc?.visibilityState === "hidden";

  /** Tries to start the loop; a refusal leaves it wanted (the next gesture or return to the foreground retries). */
  function start(v: Voice): void {
    if (hidden()) {
      v.blocked = true;
      return;
    }
    try {
      void Promise.resolve(v.audio.play()).then(
        () => { if (v.blocked && active === v) v.blocked = false; },
        () => { v.blocked = true; },
      );
      v.blocked = false;
    } catch {
      v.blocked = true;
    }
  }

  function onGesture(): void {
    if (active?.blocked) start(active);
  }

  function onVisibility(): void {
    if (!active) return;
    if (hidden()) {
      try {
        active.audio.pause();
      } catch {
        /* ignore */
      }
      active.blocked = true;
    } else start(active);
  }

  function listen(): void {
    if (listening || !doc) return;
    listening = true;
    GESTURES.forEach((t) => doc.addEventListener(t, onGesture, true));
    doc.addEventListener("visibilitychange", onVisibility);
  }

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
      listen();
      if (active?.kind === kind) {
        if (active.blocked) start(active);
        return;
      }
      try {
        const audio = createAudio(`/audio/ambient/${kind}.mp3`);
        audio.loop = true;
        audio.volume = 0;
        const previous = active;
        const voice: Voice = { audio, kind, blocked: false };
        start(voice);
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
