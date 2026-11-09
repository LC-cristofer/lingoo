import { describe, expect, it } from "vitest";
import { getLesson } from "@/domain/content";
import type { RepeatStep } from "@/domain/content-schema";
import { createRepeat, nextRepeat } from "@/domain/games/repeat";

const step = getLesson("forest-animals")!.steps.find((s) => s.kind === "repeat") as RepeatStep;

describe("repeat", () => {
  it("advances index, always concluido, finished after 5 calls", () => {
    let s = createRepeat();
    for (let i = 1; i <= step.cardIds.length; i++) {
      const out = nextRepeat(step, s);
      expect(out.result).toBe("concluido");
      expect(out.state.index).toBe(i);
      expect(out.state.finished).toBe(i === step.cardIds.length);
      s = out.state;
    }
    expect(step.cardIds).toHaveLength(5);
  });
  it("does not mutate input", () => {
    const s = Object.freeze(createRepeat());
    nextRepeat(step, s);
    expect(s).toEqual({ index: 0, finished: false });
  });
});
