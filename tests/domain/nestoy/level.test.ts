import { describe, expect, it } from "vitest";
import { nextLevel, resolve, startRun, type LevelRun } from "@/domain/nestoy/level";
import type { Exercise, StopExercise } from "@/domain/trail/schema";

const run = (level: 1 | 2 | 3): LevelRun => ({ level, streakOk: 0, streakMiss: 0 });
const play = (r: LevelRun, answers: boolean[]) => answers.reduce(nextLevel, r);

describe("nextLevel", () => {
  it("starts with empty streaks", () => {
    expect(startRun(2)).toEqual({ level: 2, streakOk: 0, streakMiss: 0 });
  });

  it("three first-try answers in a row go up one level and reset the streaks", () => {
    expect(play(run(1), [true, true])).toEqual({ level: 1, streakOk: 2, streakMiss: 0 });
    expect(play(run(1), [true, true, true])).toEqual({ level: 2, streakOk: 0, streakMiss: 0 });
    expect(play(run(1), [true, true, true, true, true, true]).level).toBe(3);
  });

  it("never goes above 3", () => {
    expect(play(run(3), [true, true, true, true]).level).toBe(3);
  });

  it("two misses in a row go down one level and reset the streaks", () => {
    expect(play(run(3), [false])).toEqual({ level: 3, streakOk: 0, streakMiss: 1 });
    expect(play(run(3), [false, false])).toEqual({ level: 2, streakOk: 0, streakMiss: 0 });
    expect(play(run(3), [false, false, false, false]).level).toBe(1);
  });

  it("never goes below 1", () => {
    expect(play(run(1), [false, false, false]).level).toBe(1);
  });

  it("a miss breaks the right streak and a right answer breaks the miss streak", () => {
    expect(play(run(1), [true, true, false, true, true]).level).toBe(1);
    expect(play(run(2), [false, true, false]).level).toBe(2);
  });
});

describe("resolve", () => {
  const a: Exercise = { kind: "listenTap", prompt: [{ lang: "en-US", text: "A" }], optionIds: ["letter-a", "letter-b"], answerId: "letter-a" };
  const b: Exercise = { ...a, optionIds: ["letter-a", "letter-b", "letter-c"] };
  const c: Exercise = { ...a, optionIds: ["letter-a", "letter-b", "letter-c", "letter-d"] };
  const adaptive: StopExercise = { kind: "adaptive", levels: [a, b, c] };

  it("picks the level's variant", () => {
    expect(resolve(adaptive, 1)).toBe(a);
    expect(resolve(adaptive, 2)).toBe(b);
    expect(resolve(adaptive, 3)).toBe(c);
  });

  it("passes other exercises through", () => {
    expect(resolve(a, 3)).toBe(a);
  });
});
