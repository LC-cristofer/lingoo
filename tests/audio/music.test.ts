import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMusic, loopPoints, MUSIC_KEY, TRACKS, type MusicDeps } from "@/audio/music";

// ---- a fake Web Audio ----------------------------------------------------------------------------------------

class FakeParam {
  value = 0;
  /** Every automation call, in order. */
  calls: { type: "set" | "ramp"; value: number; at: number }[] = [];
  constructor(private ctx: FakeContext) {}
  cancelScheduledValues() {}
  setValueAtTime(v: number, at: number) {
    this.value = v;
    this.calls.push({ type: "set", value: v, at });
  }
  linearRampToValueAtTime(v: number, at: number) {
    this.calls.push({ type: "ramp", value: v, at });
    this.value = v; // as if the ramp had finished
  }
  /** The last ramp: where it goes and how long it takes. */
  get ramp() {
    const last = [...this.calls].reverse().find((c) => c.type === "ramp");
    return last ? { to: last.value, seconds: +(last.at - this.ctx.currentTime).toFixed(3) } : null;
  }
}
class FakeGain {
  gain: FakeParam;
  connected: unknown[] = [];
  constructor(ctx: FakeContext) {
    this.gain = new FakeParam(ctx);
  }
  connect(n: unknown) {
    this.connected.push(n);
  }
  disconnect() {}
}
class FakeSource {
  buffer: unknown = null;
  loop = false;
  loopStart = 0;
  loopEnd = 0;
  started: { when: number; offset: number }[] = [];
  stopped: number[] = [];
  onended: (() => void) | null = null;
  connected: unknown[] = [];
  connect(n: unknown) {
    this.connected.push(n);
  }
  disconnect() {}
  start(when = 0, offset = 0) {
    this.started.push({ when, offset });
  }
  stop(when = 0) {
    this.stopped.push(when);
  }
}
class FakeContext {
  currentTime = 10;
  state: "running" | "suspended" = "running";
  destination = { dest: true };
  gains: FakeGain[] = [];
  sources: FakeSource[] = [];
  decoded: unknown[] = [];
  decodeBuffer: () => unknown = () => makeBuffer();
  resume = vi.fn(() => {
    this.state = "running";
    return Promise.resolve();
  });
  suspend = vi.fn(() => {
    this.state = "suspended";
    return Promise.resolve();
  });
  createGain() {
    const g = new FakeGain(this);
    this.gains.push(g);
    return g;
  }
  createBufferSource() {
    const s = new FakeSource();
    this.sources.push(s);
    return s;
  }
  decodeAudioData = vi.fn((bytes: ArrayBuffer) => {
    this.decoded.push(bytes);
    return Promise.resolve(this.decodeBuffer());
  });
}

/** A synthetic decoded buffer: `padding` silent samples, then signal. */
function makeBuffer({ sampleRate = 1000, seconds = 100, padding = 0, level = 0.5 } = {}) {
  const length = sampleRate * seconds;
  const data = new Float32Array(length);
  for (let i = padding; i < length; i++) data[i] = level;
  return { sampleRate, length, duration: seconds, numberOfChannels: 1, getChannelData: () => data };
}

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: vi.fn((k: string) => map.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => void map.set(k, v)),
  };
}

function fakeNarrator(unlocked = true) {
  const listeners = new Set<(s: boolean) => void>();
  const n = {
    unlocked,
    speaking: false,
    isUnlocked: () => n.unlocked,
    isSpeaking: () => n.speaking,
    onSpeakingChange: (l: (s: boolean) => void) => {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
    say(s: boolean) {
      n.speaking = s;
      listeners.forEach((l) => l(s));
    },
  };
  return n;
}

const flush = async () => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
  await vi.advanceTimersByTimeAsync(0);
};

function setup(over: Partial<MusicDeps> & { unlocked?: boolean } = {}) {
  const ctx = new FakeContext();
  const narrator = fakeNarrator(over.unlocked ?? true);
  const storage = fakeStorage();
  const fetchBytes = vi.fn((src: string) => Promise.resolve(new TextEncoder().encode(src).buffer as ArrayBuffer));
  const music = createMusic({
    createContext: () => ctx as unknown as AudioContext,
    fetchBytes,
    storage: storage as unknown as Storage,
    narrator,
    ...over,
  });
  /** Master gain is created first (index 0); each track's own gain follows. */
  const master = () => ctx.gains[0];
  return { ctx, narrator, storage, fetchBytes, music, master };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// ---- loop points ---------------------------------------------------------------------------------------------

describe("loopPoints", () => {
  it("starts the loop at the first audible sample, after the encoder padding", () => {
    const buf = makeBuffer({ sampleRate: 44100, seconds: 50, padding: 1105 });
    const { loopStart, loopEnd } = loopPoints(buf as unknown as AudioBuffer, 36.923077);
    expect(loopStart).toBeCloseTo(1105 / 44100, 9);
    expect(loopEnd).toBeCloseTo(1105 / 44100 + 36.923077, 6);
  });

  it("without padding the loop is the exact length from 0", () => {
    const { loopStart, loopEnd } = loopPoints(makeBuffer({ sampleRate: 1000, seconds: 50 }) as unknown as AudioBuffer, 34.285714);
    expect(loopStart).toBe(0);
    expect(loopEnd).toBeCloseTo(34.285714, 6);
  });

  it("ignores samples below 1e-4 and looks only at the first 0.2 s", () => {
    const buf = makeBuffer({ sampleRate: 1000, seconds: 50, padding: 300, level: 0.5 });
    const data = buf.getChannelData();
    data[100] = 5e-5; // noise under the threshold
    data.fill(0, 0, 300);
    data[100] = 5e-5;
    // signal only starts at 300 samples = 0.3 s, past the search window: loopStart stays 0
    expect(loopPoints(buf as unknown as AudioBuffer, 10).loopStart).toBe(0);
    const early = makeBuffer({ sampleRate: 1000, seconds: 50, padding: 150 });
    early.getChannelData()[20] = 5e-5;
    expect(loopPoints(early as unknown as AudioBuffer, 10).loopStart).toBeCloseTo(0.15, 9);
  });

  it("clamps the end to the buffer", () => {
    const { loopEnd } = loopPoints(makeBuffer({ sampleRate: 1000, seconds: 20, padding: 100 }) as unknown as AudioBuffer, 36.9);
    expect(loopEnd).toBe(20);
  });

  it("the two tracks have the exact loop lengths of the brief", () => {
    expect(TRACKS.trail).toEqual({ src: "/audio/music/trail.mp3", seconds: (64 * 60) / 104 });
    expect(TRACKS.album).toEqual({ src: "/audio/music/album.mp3", seconds: (64 * 60) / 112 });
  });
});

// ---- playing -------------------------------------------------------------------------------------------------

describe("music.play", () => {
  it("fetches, decodes and loops the track seamlessly at base gain 0.45 with a ~1 s fade-in", async () => {
    const { ctx, music, fetchBytes, master } = setup();
    ctx.decodeBuffer = () => makeBuffer({ sampleRate: 1000, seconds: 50, padding: 120 });
    music.play("trail");
    await flush();
    expect(fetchBytes).toHaveBeenCalledWith("/audio/music/trail.mp3");
    expect(ctx.sources).toHaveLength(1);
    const src = ctx.sources[0];
    expect(src.loop).toBe(true);
    expect(src.loopStart).toBeCloseTo(0.12, 9);
    expect(src.loopEnd).toBeCloseTo(0.12 + (64 * 60) / 104, 6);
    // starts at the first audible sample, so no silent gap before the first note
    expect(src.started).toEqual([{ when: 0, offset: src.loopStart }]);
    expect(master().gain.value).toBeCloseTo(0.45, 9);
    const track = ctx.gains[1];
    expect(track.gain.calls[0]).toMatchObject({ type: "set", value: 0 });
    expect(track.gain.ramp).toEqual({ to: 1, seconds: 1 });
    // source -> track gain -> master -> destination
    expect(src.connected).toEqual([track]);
    expect(track.connected).toEqual([master()]);
    expect(master().connected).toEqual([ctx.destination]);
  });

  it("uses one shared AudioContext and caches the decoded track", async () => {
    const created = vi.fn();
    const ctx = new FakeContext();
    const { music, fetchBytes } = setup({ createContext: () => (created(), ctx as unknown as AudioContext) });
    music.play("trail");
    await flush();
    music.stop();
    await vi.advanceTimersByTimeAsync(1000);
    music.play("trail");
    await flush();
    expect(created).toHaveBeenCalledTimes(1);
    expect(fetchBytes).toHaveBeenCalledTimes(1);
    expect(ctx.sources).toHaveLength(2);
  });

  it("the same track again keeps playing (album to Memória)", async () => {
    const { ctx, music } = setup();
    music.play("album");
    await flush();
    music.stop(); // the old page leaves ...
    music.play("album"); // ... and the new one asks for the same track in the same tick
    await vi.advanceTimersByTimeAsync(1000);
    await flush();
    expect(ctx.sources).toHaveLength(1);
    expect(ctx.sources[0].stopped).toEqual([]);
    expect(ctx.gains[1].gain.ramp).toEqual({ to: 1, seconds: 1 });
  });

  it("another track crossfades in ~600 ms", async () => {
    const { ctx, music } = setup();
    music.play("trail");
    await flush();
    music.play("album");
    await flush();
    expect(ctx.sources).toHaveLength(2);
    const [oldTrack, newTrack] = [ctx.gains[1], ctx.gains[2]];
    expect(oldTrack.gain.ramp).toEqual({ to: 0, seconds: 0.6 });
    expect(newTrack.gain.ramp).toEqual({ to: 1, seconds: 0.6 });
    expect(ctx.sources[0].stopped[0]).toBeGreaterThanOrEqual(ctx.currentTime + 0.6);
    expect(ctx.sources[1].started).toHaveLength(1);
  });

  it("the old track keeps playing until the new one is decoded (no hole in the music)", async () => {
    let release: () => void = () => {};
    const slow = new Promise<void>((r) => (release = r));
    const fetchBytes = vi.fn((src: string) => (src.includes("album") ? slow.then(() => new ArrayBuffer(1)) : Promise.resolve(new ArrayBuffer(1))));
    const { ctx, music } = setup({ fetchBytes });
    music.play("trail");
    await flush();
    music.play("album");
    await flush();
    expect(ctx.sources).toHaveLength(1);
    expect(ctx.sources[0].stopped).toEqual([]);
    expect(ctx.gains[1].gain.ramp).toEqual({ to: 1, seconds: 1 });
    release();
    await flush();
    expect(ctx.sources).toHaveLength(2);
    expect(ctx.sources[0].stopped).toHaveLength(1);
  });

  it("leaving every music screen fades out in ~400 ms and stops the source", async () => {
    const { ctx, music } = setup();
    music.play("trail");
    await flush();
    music.stop();
    await vi.advanceTimersByTimeAsync(500);
    expect(ctx.gains[1].gain.ramp).toEqual({ to: 0, seconds: 0.4 });
    expect(ctx.sources[0].stopped[0]).toBeGreaterThanOrEqual(ctx.currentTime + 0.4);
  });

  it("play(null) is stop()", async () => {
    const { ctx, music } = setup();
    music.play("album");
    await flush();
    music.play(null);
    await vi.advanceTimersByTimeAsync(500);
    expect(ctx.sources[0].stopped).toHaveLength(1);
  });

  it("is silent before the first user gesture, then starts on the first tap anywhere", async () => {
    const { ctx, music, fetchBytes, narrator } = setup({ unlocked: false });
    music.play("trail");
    await flush();
    expect(fetchBytes).not.toHaveBeenCalled();
    expect(ctx.sources).toHaveLength(0);
    narrator.unlocked = true;
    document.body.dispatchEvent(new Event("click", { bubbles: true }));
    await flush();
    expect(ctx.sources).toHaveLength(1);
    expect(ctx.resume).not.toHaveBeenCalled(); // already running
  });

  it("starts on the first tap even if the narrator has not flagged itself yet, and resumes a suspended context", async () => {
    const { ctx, music } = setup({ unlocked: false });
    ctx.state = "suspended";
    music.play("album");
    document.body.dispatchEvent(new Event("touchend", { bubbles: true }));
    await flush();
    expect(ctx.resume).toHaveBeenCalled();
    expect(ctx.sources).toHaveLength(1);
  });

  it("prepare() (called inside the unlock gesture) creates and resumes the context without fetching", async () => {
    const { ctx, music, fetchBytes } = setup();
    ctx.state = "suspended";
    music.prepare();
    expect(ctx.resume).toHaveBeenCalled();
    expect(fetchBytes).not.toHaveBeenCalled();
  });

  it("a play() that is stale by the time the file arrives is dropped", async () => {
    const { ctx, music } = setup();
    music.play("trail");
    music.stop();
    await vi.advanceTimersByTimeAsync(500);
    await flush();
    expect(ctx.sources).toHaveLength(0);
  });
});

// ---- ducking -------------------------------------------------------------------------------------------------

describe("ducking under the narrator", () => {
  it("drops to 30 % in ~250 ms while narrating and comes back in ~400 ms", async () => {
    const { music, narrator, master } = setup();
    music.play("trail");
    await flush();
    narrator.say(true);
    expect(master().gain.ramp?.to).toBeCloseTo(0.45 * 0.3, 9);
    expect(master().gain.ramp?.seconds).toBe(0.25);
    narrator.say(false);
    expect(master().gain.ramp?.to).toBeCloseTo(0.45, 9);
    expect(master().gain.ramp?.seconds).toBe(0.4);
  });

  it("a track that starts while the narrator talks starts already ducked", async () => {
    const { music, narrator, master } = setup();
    narrator.speaking = true;
    music.play("trail");
    await flush();
    expect(master().gain.value).toBeCloseTo(0.45 * 0.3, 9);
  });

  it("the track fades keep working while ducked (they act on their own gain)", async () => {
    const { ctx, music, narrator, master } = setup();
    music.play("trail");
    await flush();
    narrator.say(true);
    music.stop();
    await vi.advanceTimersByTimeAsync(500);
    expect(ctx.gains[1].gain.ramp?.to).toBe(0);
    expect(master().gain.value).toBeCloseTo(0.45 * 0.3, 9);
  });
});

// ---- the parent switch ---------------------------------------------------------------------------------------

describe("music switch", () => {
  it("is on by default and reads the saved choice", () => {
    expect(setup().music.isEnabled()).toBe(true);
    const storage = fakeStorage({ [MUSIC_KEY]: "off" });
    const { music } = setup({ storage: storage as unknown as Storage });
    expect(music.isEnabled()).toBe(false);
    expect(storage.getItem).toHaveBeenCalledWith("lingoo:music");
    const on = fakeStorage({ [MUSIC_KEY]: "on" });
    expect(setup({ storage: on as unknown as Storage }).music.isEnabled()).toBe(true);
  });

  it("setEnabled(false) saves 'off', stops the music and tells subscribers; true brings it back", async () => {
    const { ctx, music, storage } = setup();
    const seen = vi.fn();
    music.subscribe(seen);
    music.play("trail");
    await flush();
    music.setEnabled(false);
    expect(storage.map.get(MUSIC_KEY)).toBe("off");
    expect(music.isEnabled()).toBe(false);
    expect(seen).toHaveBeenCalledTimes(1);
    expect(ctx.gains[1].gain.ramp).toEqual({ to: 0, seconds: 0.4 });
    expect(ctx.sources[0].stopped).toHaveLength(1);
    music.setEnabled(true);
    await flush();
    expect(storage.map.get(MUSIC_KEY)).toBe("on");
    expect(ctx.sources).toHaveLength(2);
    expect(seen).toHaveBeenCalledTimes(2);
  });

  it("while off, play() stays silent and never fetches", async () => {
    const storage = fakeStorage({ [MUSIC_KEY]: "off" });
    const { ctx, music, fetchBytes } = setup({ storage: storage as unknown as Storage });
    music.play("trail");
    await flush();
    expect(fetchBytes).not.toHaveBeenCalled();
    expect(ctx.sources).toHaveLength(0);
  });

  it("unsubscribes", () => {
    const { music } = setup();
    const seen = vi.fn();
    const off = music.subscribe(seen);
    off();
    music.setEnabled(false);
    expect(seen).not.toHaveBeenCalled();
  });

  it("survives a storage that throws (private mode)", () => {
    const boom = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    const { music } = setup({ storage: boom as unknown as Storage });
    expect(music.isEnabled()).toBe(true);
    expect(() => music.setEnabled(false)).not.toThrow();
    expect(music.isEnabled()).toBe(false);
  });
});

// ---- the tab ---------------------------------------------------------------------------------------------------

describe("tab visibility", () => {
  const setHidden = (hidden: boolean) => {
    Object.defineProperty(document, "visibilityState", { value: hidden ? "hidden" : "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  };
  afterEach(() => setHidden(false));

  it("suspends the context when the tab is hidden and resumes when it is visible again", async () => {
    const { ctx, music } = setup();
    music.play("trail");
    await flush();
    setHidden(true);
    expect(ctx.suspend).toHaveBeenCalled();
    setHidden(false);
    expect(ctx.resume).toHaveBeenCalled();
  });

  it("does not resume when no music screen is showing any more", async () => {
    const { ctx, music } = setup();
    music.play("trail");
    await flush();
    setHidden(true);
    music.stop();
    await vi.advanceTimersByTimeAsync(500);
    setHidden(false);
    expect(ctx.resume).not.toHaveBeenCalled();
  });
});

// ---- never break the app -----------------------------------------------------------------------------------------

describe("failures are silent", () => {
  it("no Web Audio: nothing throws and nothing is fetched", async () => {
    const { music, fetchBytes } = setup({ createContext: () => null });
    expect(() => music.play("trail")).not.toThrow();
    expect(() => music.prepare()).not.toThrow();
    expect(() => music.setEnabled(false)).not.toThrow();
    expect(() => music.stop()).not.toThrow();
    await flush();
    expect(fetchBytes).not.toHaveBeenCalled();
  });

  it("a context constructor that throws is the same as no Web Audio", async () => {
    const { music } = setup({
      createContext: () => {
        throw new Error("nope");
      },
    });
    expect(() => music.play("trail")).not.toThrow();
    await flush();
  });

  it("jsdom (no AudioContext at all) with the default context factory", async () => {
    const music = createMusic({ narrator: fakeNarrator(), storage: fakeStorage() as unknown as Storage });
    expect(() => music.play("trail")).not.toThrow();
    await flush();
  });

  it("a failed fetch or decode leaves the music off and is not retried in a loop", async () => {
    const fetchBytes = vi.fn(() => Promise.reject(new Error("404")));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { ctx, music } = setup({ fetchBytes });
    music.play("trail");
    await flush();
    music.play("trail");
    music.stop();
    music.play("trail");
    await flush();
    expect(fetchBytes).toHaveBeenCalledTimes(1);
    expect(ctx.sources).toHaveLength(0);
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });

  it("an HTTP error status is a failure too", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false, status: 404, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) })));
    const ctx = new FakeContext();
    const music = createMusic({ createContext: () => ctx as unknown as AudioContext, narrator: fakeNarrator(), storage: fakeStorage() as unknown as Storage });
    music.play("album");
    await flush();
    expect(ctx.sources).toHaveLength(0);
    expect(ctx.decodeAudioData).not.toHaveBeenCalled();
  });

  it("a rejecting decodeAudioData is swallowed", async () => {
    const { ctx, music } = setup();
    ctx.decodeAudioData.mockImplementation(() => Promise.reject(new Error("bad data")));
    music.play("trail");
    await flush();
    expect(ctx.sources).toHaveLength(0);
  });

  it("a narrator without the speaking hooks (old mock) does not break it", async () => {
    const { ctx, music } = setup({ narrator: { isUnlocked: () => true } as unknown as MusicDeps["narrator"] });
    music.play("trail");
    await flush();
    expect(ctx.sources).toHaveLength(1);
  });
});
