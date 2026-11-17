import { narrator as appNarrator } from "./narrator";

/**
 * Background music: two original loops played through one shared Web Audio context.
 * - the map plays `trail`; the album and the Memória home play `album`; nowhere else;
 * - it never starts before the first user gesture and ducks under the narrator;
 * - a missing Web Audio, a failed fetch or a failed decode simply leaves the music off.
 * Nothing here runs at import time, so the module is safe to render on the server.
 */

export type Track = "trail" | "album";

/** `seconds` is the exact loop length (64 beats), see tools/audio/music.py. */
export const TRACKS: Record<Track, { src: string; seconds: number }> = {
  trail: { src: "/audio/music/trail.mp3", seconds: (64 * 60) / 104 },
  album: { src: "/audio/music/album.mp3", seconds: (64 * 60) / 112 },
};

/** localStorage key of the parent switch: "off" or "on" (default on). */
export const MUSIC_KEY = "lingoo:music";

const BASE_GAIN = 0.45;
const DUCK_FACTOR = 0.3;
const DUCK_DOWN_S = 0.25;
const DUCK_UP_S = 0.4;
const FADE_IN_S = 1;
const CROSSFADE_S = 0.6;
const FADE_OUT_S = 0.4;
/** A page that leaves and the next one that asks for music are one tick apart: do not stop in between. */
const STOP_GRACE_MS = 100;
/** MP3 decoders may leave encoder padding at the start: look for the first audible sample in this window. */
const PADDING_SEARCH_S = 0.2;
const AUDIBLE = 1e-4;

type DecodedBuffer = Pick<AudioBuffer, "sampleRate" | "duration" | "numberOfChannels" | "getChannelData">;

/** Loop from the first audible sample (past any encoder padding) for exactly `seconds`, clamped to the buffer. */
export function loopPoints(buffer: DecodedBuffer, seconds: number): { loopStart: number; loopEnd: number } {
  let loopStart = 0;
  search: for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    const limit = Math.min(data.length, Math.floor(PADDING_SEARCH_S * buffer.sampleRate));
    for (let i = 0; i < limit; i++) {
      if (Math.abs(data[i]) > AUDIBLE) {
        loopStart = i / buffer.sampleRate;
        break search;
      }
    }
  }
  return { loopStart, loopEnd: Math.min(loopStart + seconds, buffer.duration) };
}

export interface MusicDeps {
  /** Returns the shared context, or null when the browser has no Web Audio. */
  createContext?: () => AudioContext | null;
  fetchBytes?: (src: string) => Promise<ArrayBuffer>;
  storage?: Storage | null;
  narrator?: {
    isUnlocked(): boolean;
    isSpeaking?(): boolean;
    onSpeakingChange?(listener: (speaking: boolean) => void): () => void;
  };
  graceMs?: number;
}

export interface Music {
  /** The screen the child is on wants this track (null: none). Seamless when it is already playing. */
  play(track: Track | null): void;
  /** A music screen is leaving: fades out unless another one asks for music right away. */
  stop(): void;
  /** Creates and resumes the audio context. Call it inside a user gesture (iOS only lets it start there). */
  prepare(): void;
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
  /** For useSyncExternalStore: told whenever the switch flips. Returns the unsubscribe. */
  subscribe(listener: () => void): () => void;
}

function defaultContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

async function defaultFetch(src: string): Promise<ArrayBuffer> {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`music ${src}: ${res.status}`);
  return res.arrayBuffer();
}

function defaultStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Ramps from the current value to `target` over `seconds`. */
function ramp(param: AudioParam, target: number, seconds: number, now: number) {
  try {
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(target, now + seconds);
  } catch {
    // best-effort
  }
}

interface Playing {
  track: Track;
  source: AudioBufferSourceNode;
  gain: GainNode;
}

export function createMusic(deps: MusicDeps = {}): Music {
  const narrator = deps.narrator ?? appNarrator;
  const createContext = deps.createContext ?? defaultContext;
  const fetchBytes = deps.fetchBytes ?? defaultFetch;
  const graceMs = deps.graceMs ?? STOP_GRACE_MS;

  let ctx: AudioContext | null = null;
  let ctxFailed = false;
  let master: GainNode | null = null;
  let desired: Track | null = null;
  let enabled: boolean | null = null;
  let gestured = false;
  let ducked = false;
  let current: Playing | null = null;
  let initialised = false;
  let stopTimer: ReturnType<typeof setTimeout> | undefined;
  const buffers = new Map<Track, Promise<AudioBuffer | null>>();
  const switchListeners = new Set<() => void>();

  function storage(): Storage | null {
    return deps.storage !== undefined ? deps.storage : defaultStorage();
  }

  function isEnabled(): boolean {
    if (enabled === null) {
      let saved: string | null = null;
      try {
        saved = storage()?.getItem(MUSIC_KEY) ?? null;
      } catch {
        // unreadable storage: the default stays
      }
      enabled = saved !== "off";
    }
    return enabled;
  }

  const masterTarget = () => BASE_GAIN * (ducked ? DUCK_FACTOR : 1);

  function getContext(): AudioContext | null {
    if (ctx || ctxFailed) return ctx;
    try {
      ctx = createContext();
      if (ctx) {
        master = ctx.createGain();
        master.gain.value = masterTarget();
        master.connect(ctx.destination);
      } else ctxFailed = true;
    } catch {
      ctx = null;
      master = null;
      ctxFailed = true;
    }
    return ctx;
  }

  function resume() {
    try {
      if (ctx && ctx.state !== "running") void Promise.resolve(ctx.resume()).catch(() => {});
    } catch {
      // best-effort
    }
  }

  function prepare() {
    if (!getContext()) return;
    resume();
  }

  const wanted = (): Track | null => (desired && isEnabled() && (gestured || narrator.isUnlocked()) ? desired : null);

  function load(track: Track): Promise<AudioBuffer | null> {
    const cached = buffers.get(track);
    if (cached) return cached;
    const context = getContext();
    const promise = context
      ? (async () => {
          const bytes = await fetchBytes(TRACKS[track].src);
          return await new Promise<AudioBuffer>((resolve, reject) => {
            const p = context.decodeAudioData(bytes, resolve, reject);
            // Old Safari only takes callbacks; newer browsers return a promise.
            if (p && typeof p.then === "function") p.then(resolve, reject);
          });
        })().catch(() => null) // a failed track stays off: never retried in a loop
      : Promise.resolve(null);
    buffers.set(track, promise);
    return promise;
  }

  function retire(playing: Playing, seconds: number) {
    const context = ctx;
    if (!context) return;
    const now = context.currentTime;
    ramp(playing.gain.gain, 0, seconds, now);
    try {
      playing.source.stop(now + seconds + 0.05);
    } catch {
      // already stopped
    }
    playing.source.onended = () => {
      try {
        playing.source.disconnect();
        playing.gain.disconnect();
      } catch {
        // best-effort
      }
    };
  }

  async function start(track: Track) {
    const buffer = await load(track);
    const context = ctx;
    if (!buffer || !context || !master) return;
    // Things moved on while the file was loading.
    if (wanted() !== track || current?.track === track) return;
    try {
      const fade = current ? CROSSFADE_S : FADE_IN_S;
      if (current) retire(current, CROSSFADE_S);
      const { loopStart, loopEnd } = loopPoints(buffer, TRACKS[track].seconds);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = loopStart;
      source.loopEnd = loopEnd;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, context.currentTime);
      ramp(gain.gain, 1, fade, context.currentTime);
      source.connect(gain);
      gain.connect(master);
      source.start(0, loopStart);
      current = { track, source, gain };
      resume();
    } catch {
      // a broken context leaves the music off
    }
  }

  function reconcile() {
    const want = wanted();
    if (!want) {
      if (current) {
        retire(current, FADE_OUT_S);
        current = null;
      }
      return;
    }
    if (current?.track === want) return;
    if (!getContext()) return;
    void start(want);
  }

  function onGesture() {
    gestured = true;
    removeGesture();
    prepare();
    reconcile();
  }
  const GESTURES = ["touchend", "click", "keydown"] as const;
  function removeGesture() {
    if (typeof document === "undefined") return;
    GESTURES.forEach((t) => document.removeEventListener(t, onGesture, true));
  }

  function onVisibility() {
    if (!ctx) return;
    try {
      if (document.visibilityState === "hidden") void Promise.resolve(ctx.suspend()).catch(() => {});
      else if (wanted()) resume();
    } catch {
      // best-effort
    }
  }

  function onSpeaking(speaking: boolean) {
    ducked = speaking;
    if (ctx && master) ramp(master.gain, masterTarget(), speaking ? DUCK_DOWN_S : DUCK_UP_S, ctx.currentTime);
  }

  /** Lazy, on the first play(): nothing touches the page at import time. */
  function init() {
    if (initialised) return;
    initialised = true;
    if (typeof document !== "undefined") {
      GESTURES.forEach((t) => document.addEventListener(t, onGesture, true));
      document.addEventListener("visibilitychange", onVisibility);
    }
    try {
      ducked = narrator.isSpeaking?.() ?? false;
      narrator.onSpeakingChange?.(onSpeaking);
    } catch {
      // no ducking without the narrator hooks
    }
  }

  function stop() {
    desired = null;
    clearTimeout(stopTimer);
    stopTimer = setTimeout(reconcile, graceMs);
  }

  return {
    play(track) {
      if (track === null) return stop();
      init();
      clearTimeout(stopTimer);
      desired = track;
      reconcile();
    },
    stop,
    prepare,
    setEnabled(value) {
      enabled = value;
      try {
        storage()?.setItem(MUSIC_KEY, value ? "on" : "off");
      } catch {
        // the choice lasts for this visit only
      }
      if (value) prepare(); // a tap: the right moment to start the context
      reconcile();
      for (const l of [...switchListeners]) l();
    },
    isEnabled,
    subscribe(listener) {
      switchListeners.add(listener);
      return () => void switchListeners.delete(listener);
    },
  };
}

/** The app's one music controller. */
export const music: Music = createMusic();
