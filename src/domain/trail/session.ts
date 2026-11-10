import type { Exercise } from "./schema";

export type Phase = "answering" | "correct" | "retry" | "hint";
export type SessionItem = { exercise: Exercise; key: string; isReview: boolean };
export type Session = {
  items: SessionItem[];
  index: number;
  wrongCount: number;
  phase: Phase;
  reviewedKeys: string[];
  finished: boolean;
};

export function startSession(exercises: Exercise[], stopId: string): Session {
  return {
    items: exercises.map((exercise, i) => ({ exercise, key: `${stopId}#${i}`, isReview: false })),
    index: 0,
    wrongCount: 0,
    phase: "answering",
    reviewedKeys: [],
    finished: false,
  };
}

export function answer(s: Session, correct: boolean): Session {
  if (s.finished) return s;
  if (s.phase === "answering") {
    if (correct) return { ...s, phase: "correct" };
    if (s.wrongCount === 0) return { ...s, phase: "retry", wrongCount: 1 };
    const item = s.items[s.index];
    const queue = item !== undefined && !s.reviewedKeys.includes(item.key);
    return {
      ...s,
      phase: "hint",
      wrongCount: s.wrongCount + 1,
      items: queue ? [...s.items, { ...item, isReview: true }] : s.items,
      reviewedKeys: queue ? [...s.reviewedKeys, item.key] : s.reviewedKeys,
    };
  }
  if (s.phase === "hint" && correct) return { ...s, phase: "correct" };
  return s;
}

export function resume(s: Session): Session {
  if (s.finished || s.phase !== "retry") return s;
  return { ...s, phase: "answering" };
}

export function next(s: Session): Session {
  if (s.finished || s.phase !== "correct") return s;
  const index = s.index + 1;
  if (index >= s.items.length) return { ...s, index, wrongCount: 0, finished: true };
  return { ...s, index, wrongCount: 0, phase: "answering" };
}

export function progressRatio(s: Session): number {
  if (s.items.length === 0) return 1;
  return Math.min(1, s.index / s.items.length);
}
