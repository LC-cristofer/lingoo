import type { Lesson, Step } from "./content-schema";

export type LessonState = {
  lessonId: string;
  stepIndex: number;
  finished: boolean;
  stickerId: string | null;
};

export type LessonEvent = { type: "stepDone"; stepId: string };

export function startLesson(lesson: Lesson): LessonState {
  return { lessonId: lesson.id, stepIndex: 0, finished: false, stickerId: null };
}

export function currentStep(lesson: Lesson, s: LessonState): Step | null {
  if (s.finished) return null;
  return lesson.steps[s.stepIndex] ?? null;
}

export function lessonReducer(lesson: Lesson, s: LessonState, e: LessonEvent): LessonState {
  if (s.finished) return s;
  const step = lesson.steps[s.stepIndex];
  if (!step || e.stepId !== step.id) return s;
  const next = s.stepIndex + 1;
  if (step.kind === "sticker" || next >= lesson.steps.length) {
    return {
      ...s,
      stepIndex: next,
      finished: true,
      stickerId: step.kind === "sticker" ? step.stickerId : null,
    };
  }
  return { ...s, stepIndex: next };
}
