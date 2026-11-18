import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createAmbience } from "@/audio/ambience";

function fakeDoc() {
  const handlers = new Map<string, () => void>();
  const doc = {
    visibilityState: "visible" as DocumentVisibilityState,
    addEventListener: (t: string, h: () => void) => { handlers.set(t, h); },
  };
  return { doc: doc as unknown as Pick<Document, "addEventListener" | "visibilityState">, raw: doc, fire: (t: string) => handlers.get(t)?.() };
}

function make(enabled = true, doc: Pick<Document, "addEventListener" | "visibilityState"> | null = null) {
  const made: { src: string; volume: number; paused: boolean; loop: boolean; play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> }[] = [];
  const createAudio = (src: string) => {
    const a = { src, volume: 0, paused: true, loop: false, play: vi.fn(), pause: vi.fn() };
    a.play.mockImplementation(() => { a.paused = false; return Promise.resolve(); });
    a.pause.mockImplementation(() => { a.paused = true; });
    made.push(a);
    return a as unknown as HTMLAudioElement;
  };
  const amb = createAmbience({ createAudio, isEnabled: () => enabled, doc });
  return { amb, made };
}

describe("ambience", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("loops the day track at 0.35", () => {
    const { amb, made } = make();
    amb.play("day");
    vi.advanceTimersByTime(2000);
    expect(made).toHaveLength(1);
    expect(made[0].src).toBe("/audio/ambient/day.mp3");
    expect(made[0].loop).toBe(true);
    expect(made[0].volume).toBeCloseTo(0.35);
    expect(amb.current()).toBe("day");
  });

  it("crossfades day to night and stops the old one", () => {
    const { amb, made } = make();
    amb.play("day");
    vi.advanceTimersByTime(2000);
    amb.play("night");
    vi.advanceTimersByTime(750);
    expect(made[0].volume).toBeGreaterThan(0);
    expect(made[0].volume).toBeLessThan(0.35);
    expect(made[1].volume).toBeGreaterThan(0);
    expect(made[1].volume).toBeLessThan(0.35);
    vi.advanceTimersByTime(1000);
    expect(made[0].pause).toHaveBeenCalled();
    expect(made[1].volume).toBeCloseTo(0.35);
    expect(amb.current()).toBe("night");
  });

  it("same kind twice does nothing new", () => {
    const { amb, made } = make();
    amb.play("day");
    amb.play("day");
    expect(made).toHaveLength(1);
  });

  it("stop silences everything", () => {
    const { amb, made } = make();
    amb.play("day");
    vi.advanceTimersByTime(2000);
    amb.stop();
    vi.advanceTimersByTime(2000);
    expect(made[0].pause).toHaveBeenCalled();
    expect(amb.current()).toBeNull();
  });

  it("plays nothing when music is off", () => {
    const { amb, made } = make(false);
    amb.play("day");
    expect(made).toHaveLength(0);
    expect(amb.current()).toBeNull();
  });

  it("a stop in the middle of the fade-in fades from where it was and ends silent", () => {
    const { amb, made } = make();
    amb.play("day");
    vi.advanceTimersByTime(500);
    amb.stop();
    vi.advanceTimersByTime(2000);
    expect(made[0].volume).toBe(0);
    expect(made[0].pause).toHaveBeenCalled();
  });

  it("a fast day-night-day toggle never leaves the new voice dragged down by an old ramp", () => {
    const { amb, made } = make();
    amb.play("day");
    vi.advanceTimersByTime(300);
    amb.play("night");
    vi.advanceTimersByTime(300);
    amb.stop();
    amb.play("day");
    vi.advanceTimersByTime(3000);
    expect(made[2].volume).toBeCloseTo(0.35);
    expect(made[1].volume).toBe(0);
  });

  it("a rejected play() is retried by the next play() of the same kind and by a gesture", async () => {
    const d = fakeDoc();
    const made: { play: ReturnType<typeof vi.fn> }[] = [];
    let refuse = true;
    const createAudio = () => {
      const a = { volume: 0, loop: false, pause: vi.fn(), play: vi.fn(() => (refuse ? Promise.reject(new Error("NotAllowedError")) : Promise.resolve())) };
      made.push(a);
      return a as unknown as HTMLAudioElement;
    };
    const amb = createAmbience({ createAudio, isEnabled: () => true, doc: d.doc });
    amb.play("night");
    await Promise.resolve();
    await Promise.resolve();
    expect(made[0].play).toHaveBeenCalledTimes(1);
    amb.play("night"); // same kind again: retried, not ignored
    await Promise.resolve();
    await Promise.resolve();
    expect(made[0].play).toHaveBeenCalledTimes(2);
    refuse = false;
    d.fire("click"); // the first touch
    await Promise.resolve();
    await Promise.resolve();
    expect(made[0].play).toHaveBeenCalledTimes(3);
    d.fire("click"); // playing now: nothing more to retry
    expect(made[0].play).toHaveBeenCalledTimes(3);
    expect(made).toHaveLength(1);
  });

  it("hidden pauses the loop, visible resumes it, and play() while hidden waits for the foreground", () => {
    const d = fakeDoc();
    const { amb, made } = make(true, d.doc);
    amb.play("day");
    vi.advanceTimersByTime(2000);
    d.raw.visibilityState = "hidden";
    d.fire("visibilitychange");
    expect(made[0].pause).toHaveBeenCalled();
    d.raw.visibilityState = "visible";
    d.fire("visibilitychange");
    expect(made[0].play).toHaveBeenCalledTimes(2);

    amb.stop();
    d.raw.visibilityState = "hidden";
    amb.play("night");
    expect(made[1].play).not.toHaveBeenCalled();
    d.raw.visibilityState = "visible";
    d.fire("visibilitychange");
    expect(made[1].play).toHaveBeenCalledTimes(1);
  });
});
