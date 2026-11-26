import type { Exercise, StopExercise } from "@/domain/trail/schema";
import type { Level } from "./profile";

/** The adaptive level inside one stop: it moves with the child's first tries and is never shown. */
export type LevelRun = { level: Level; streakOk: number; streakMiss: number };

export function startRun(level: Level): LevelRun {
  return { level, streakOk: 0, streakMiss: 0 };
}

/** 3 first-try answers in a row: one level up (max 3). 2 misses in a row: one down (min 1). A change resets both streaks. */
export function nextLevel(r: LevelRun, firstTry: boolean): LevelRun {
  if (firstTry) {
    const streakOk = r.streakOk + 1;
    if (streakOk >= 3 && r.level < 3) return startRun((r.level + 1) as Level);
    return { level: r.level, streakOk, streakMiss: 0 };
  }
  const streakMiss = r.streakMiss + 1;
  if (streakMiss >= 2 && r.level > 1) return startRun((r.level - 1) as Level);
  return { level: r.level, streakOk: 0, streakMiss };
}

/** The exercise to show at this level: an adaptive slot gives its variant, any other exercise is itself. */
export function resolve(ex: StopExercise, level: Level): Exercise {
  return ex.kind === "adaptive" ? ex.levels[level - 1] : ex;
}
