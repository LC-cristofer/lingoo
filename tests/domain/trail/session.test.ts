import { describe, expect, it } from "vitest";
import { getUnit } from "@/domain/trail/content";
import { answer, next, progressRatio, resume, startSession } from "@/domain/trail/session";

const unit = getUnit("forest-animals")!;
const stop = unit.stops[1];
const exercises = (stop as { exercises: Parameters<typeof startSession>[0] }).exercises;

describe("session", () => {
  it("starts at the first item with keys from original indexes", () => {
    const s = startSession(exercises, "lesson-1");
    expect(s.items).toHaveLength(exercises.length);
    expect(s.items[3].key).toBe("lesson-1#3");
    expect(s.items.every((i) => !i.isReview)).toBe(true);
    expect(s).toMatchObject({ index: 0, wrongCount: 0, phase: "answering", finished: false });
    expect(progressRatio(s)).toBe(0);
  });

  it("correct straight away moves forward and progress grows", () => {
    let s = startSession(exercises, "lesson-1");
    s = answer(s, true);
    expect(s.phase).toBe("correct");
    s = next(s);
    expect(s).toMatchObject({ index: 1, phase: "answering", wrongCount: 0 });
    expect(progressRatio(s)).toBeCloseTo(1 / exercises.length);
  });

  it("wrong then resume then correct queues nothing", () => {
    let s = startSession(exercises, "lesson-1");
    s = answer(s, false);
    expect(s).toMatchObject({ phase: "retry", wrongCount: 1 });
    s = resume(s);
    expect(s.phase).toBe("answering");
    s = answer(s, true);
    expect(s.phase).toBe("correct");
    expect(s.items).toHaveLength(exercises.length);
  });

  it("wrong twice gives hint, queues review at the end, then correct", () => {
    let s = startSession(exercises, "lesson-1");
    s = startSession(exercises, "lesson-1");
    s = answer(s, false);
    s = resume(s);
    s = answer(s, false);
    expect(s.phase).toBe("hint");
    expect(s.items).toHaveLength(exercises.length + 1);
    const last = s.items[s.items.length - 1];
    expect(last).toMatchObject({ key: "lesson-1#0", isReview: true });
    expect(last.exercise).toBe(exercises[0]);
    expect(s.reviewedKeys).toEqual(["lesson-1#0"]);
    const same = answer(s, false);
    expect(same).toBe(s);
    s = answer(s, true);
    expect(s.phase).toBe("correct");
  });

  it("does not queue the same key twice when the review also reaches hint", () => {
    const two = exercises.slice(0, 1);
    let s = startSession(two, "x");
    s = answer(resume(answer(s, false)), false); // hint, queued
    s = next(answer(s, true));
    expect(s.items).toHaveLength(2);
    expect(s.items[1].isReview).toBe(true);
    s = answer(resume(answer(s, false)), false); // hint again in review
    expect(s.phase).toBe("hint");
    expect(s.items).toHaveLength(2);
    expect(s.reviewedKeys).toEqual(["x#0"]);
  });

  it("ignores answers during correct and retry (same reference)", () => {
    const s0 = startSession(exercises, "lesson-1");
    const c = answer(s0, true);
    expect(answer(c, true)).toBe(c);
    expect(answer(c, false)).toBe(c);
    const r = answer(s0, false);
    expect(answer(r, true)).toBe(r);
    expect(answer(r, false)).toBe(r);
  });

  it("resume and next are no-ops outside their phases", () => {
    const s0 = startSession(exercises, "lesson-1");
    expect(resume(s0)).toBe(s0);
    expect(next(s0)).toBe(s0);
    const r = answer(s0, false);
    expect(next(r)).toBe(r);
  });

  it("next after the last item finishes; later input is ignored", () => {
    let s = startSession(exercises.slice(0, 1), "y");
    s = next(answer(s, true));
    expect(s.finished).toBe(true);
    expect(progressRatio(s)).toBe(1);
    expect(answer(s, true)).toBe(s);
    expect(next(s)).toBe(s);
    expect(resume(s)).toBe(s);
  });

  it("progress counts queued review items in the total", () => {
    let s = startSession(exercises.slice(0, 2), "z");
    s = answer(resume(answer(s, false)), false);
    s = next(answer(s, true));
    expect(progressRatio(s)).toBeCloseTo(1 / 3);
  });
});
