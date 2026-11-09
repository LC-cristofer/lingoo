import { describe, expect, it } from "vitest";
import { getLesson } from "@/domain/content";
import { currentStep, lessonReducer, startLesson } from "@/domain/lesson-engine";

const lesson = getLesson("forest-animals")!;

describe("lesson engine", () => {
  it("starts at step 0", () => {
    const s = startLesson(lesson);
    expect(s).toEqual({ lessonId: lesson.id, stepIndex: 0, finished: false, stickerId: null });
    expect(currentStep(lesson, s)).toBe(lesson.steps[0]);
  });

  it("advances on stepDone for the current step", () => {
    const s = lessonReducer(lesson, startLesson(lesson), { type: "stepDone", stepId: lesson.steps[0].id });
    expect(s.stepIndex).toBe(1);
  });

  it("ignores stale or duplicate stepDone events", () => {
    const s0 = startLesson(lesson);
    const s1 = lessonReducer(lesson, s0, { type: "stepDone", stepId: lesson.steps[0].id });
    expect(lessonReducer(lesson, s1, { type: "stepDone", stepId: lesson.steps[0].id })).toBe(s1);
    expect(lessonReducer(lesson, s1, { type: "stepDone", stepId: "nope" })).toBe(s1);
  });

  it("finishes with the sticker after the last step", () => {
    let s = startLesson(lesson);
    for (const step of lesson.steps) s = lessonReducer(lesson, s, { type: "stepDone", stepId: step.id });
    expect(s.finished).toBe(true);
    expect(s.stickerId).toBe("sticker-fox");
    expect(currentStep(lesson, s)).toBeNull();
  });

  it("ignores events after finished", () => {
    let s = startLesson(lesson);
    for (const step of lesson.steps) s = lessonReducer(lesson, s, { type: "stepDone", stepId: step.id });
    const last = lesson.steps[lesson.steps.length - 1];
    expect(lessonReducer(lesson, s, { type: "stepDone", stepId: last.id })).toBe(s);
  });
});
