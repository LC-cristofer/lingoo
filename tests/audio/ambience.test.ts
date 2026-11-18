import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createAmbience } from "@/audio/ambience";

function make(enabled = true) {
  const made: { src: string; volume: number; paused: boolean; loop: boolean; play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> }[] = [];
  const createAudio = (src: string) => {
    const a = { src, volume: 0, paused: true, loop: false, play: vi.fn(), pause: vi.fn() };
    a.play.mockImplementation(() => { a.paused = false; return Promise.resolve(); });
    a.pause.mockImplementation(() => { a.paused = true; });
    made.push(a);
    return a as unknown as HTMLAudioElement;
  };
  const amb = createAmbience({ createAudio, isEnabled: () => enabled });
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
});
