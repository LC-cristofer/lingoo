import type { World } from "./content-schema";

export type Progress = {
  completedLessons: Record<string, string>; // lessonId -> ISO date
  stickers: Record<string, string>; // stickerId -> ISO date
};

export interface ProgressStore {
  load(): Progress;
  save(p: Progress): void;
}

export function emptyProgress(): Progress {
  return { completedLessons: {}, stickers: {} };
}

/** Idempotent: keeps the first completion date; returns same reference if nothing changes. */
export function completeLesson(p: Progress, lessonId: string, stickerId: string, now: Date): Progress {
  const hasLesson = Object.hasOwn(p.completedLessons, lessonId);
  const hasSticker = Object.hasOwn(p.stickers, stickerId);
  if (hasLesson && hasSticker) return p;
  const iso = now.toISOString();
  return {
    completedLessons: hasLesson ? p.completedLessons : { ...p.completedLessons, [lessonId]: iso },
    stickers: hasSticker ? p.stickers : { ...p.stickers, [stickerId]: iso },
  };
}

export function placeStatus(
  world: World,
  p: Progress,
  lessonId: string,
): "done" | "open" | "locked" | "soon" {
  const index = world.places.findIndex((pl) => pl.lessonId === lessonId);
  if (index < 0) return "locked";
  if (!world.places[index].hasContent) return "soon";
  if (Object.hasOwn(p.completedLessons, lessonId)) return "done";
  for (let i = index - 1; i >= 0; i--) {
    const prev = world.places[i];
    if (!prev.hasContent) continue;
    return Object.hasOwn(p.completedLessons, prev.lessonId) ? "open" : "locked";
  }
  return "open";
}
