import { describe, expect, it } from "vitest";
import { getLesson } from "@/domain/content";
import type { DragStep } from "@/domain/content-schema";
import { createDrag, drop } from "@/domain/games/drag";

const step = getLesson("forest-animals")!.steps.find((s) => s.kind === "drag") as DragStep;
const [a, b] = step.cardIds;

describe("drag", () => {
  it("same target gives acerto", () => {
    const { state, result } = drop(step, createDrag(), a, a);
    expect(result).toBe("acerto");
    expect(state.matched).toEqual([a]);
  });
  it("different target gives erro, no change", () => {
    const s = createDrag();
    const out = drop(step, s, a, b);
    expect(out.result).toBe("erro");
    expect(out.state).toEqual({ matched: [], finished: false });
  });
  it("unknown target counts as erro", () => {
    expect(drop(step, createDrag(), a, "nope").result).toBe("erro");
  });
  it("null target returns null without change", () => {
    const s = createDrag();
    const out = drop(step, s, a, null);
    expect(out.result).toBeNull();
    expect(out.state).toBe(s);
  });
  it("already matched card returns null", () => {
    const s = drop(step, createDrag(), a, a).state;
    const out = drop(step, s, a, a);
    expect(out.result).toBeNull();
    expect(out.state).toBe(s);
  });
  it("finishes after all matched; later calls null", () => {
    let s = createDrag();
    for (const id of step.cardIds) s = drop(step, s, id, id).state;
    expect(s.finished).toBe(true);
    expect(s.matched).toHaveLength(5);
    const out = drop(step, s, a, a);
    expect(out.result).toBeNull();
    expect(out.state).toBe(s);
  });
});
