import { describe, expect, it } from "vitest";
import { getLesson } from "@/domain/content";
import type { TapStep } from "@/domain/content-schema";
import { createTap, releaseTap, tapOption } from "@/domain/games/tap";

const step = getLesson("forest-animals")!.steps.find((s) => s.kind === "tap") as TapStep;
const wrongOf = (r: number) => step.rounds[r].optionIds.find((o) => o !== step.rounds[r].answerId)!;

describe("tap", () => {
  it("correct option gives acerto and locks", () => {
    const { state, result } = tapOption(step, createTap(), step.rounds[0].answerId);
    expect(result).toBe("acerto");
    expect(state).toEqual({ round: 0, locked: true, finished: false });
  });
  it("wrong option gives erro, keeps round, does not lock", () => {
    const { state, result } = tapOption(step, createTap(), wrongOf(0));
    expect(result).toBe("erro");
    expect(state).toEqual({ round: 0, locked: false, finished: false });
  });
  it("ignores taps while locked", () => {
    const locked = tapOption(step, createTap(), step.rounds[0].answerId).state;
    const out = tapOption(step, locked, step.rounds[0].answerId);
    expect(out.result).toBeNull();
    expect(out.state).toBe(locked);
  });
  it("release advances round and unlocks; last round finishes", () => {
    let s = createTap();
    for (let r = 0; r < step.rounds.length; r++) {
      s = tapOption(step, s, step.rounds[r].answerId).state;
      s = releaseTap(step, s);
      if (r < step.rounds.length - 1) expect(s).toEqual({ round: r + 1, locked: false, finished: false });
    }
    expect(s.finished).toBe(true);
    expect(tapOption(step, s, step.rounds[0].answerId).result).toBeNull();
  });
  it("release on unlocked state is a no-op", () => {
    const s = createTap();
    expect(releaseTap(step, s)).toBe(s);
  });
  it("does not mutate input", () => {
    const s = Object.freeze(createTap());
    tapOption(step, s, step.rounds[0].answerId);
    expect(s).toEqual({ round: 0, locked: false, finished: false });
  });
});
