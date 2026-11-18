import { dueCards } from "@/domain/trail/memory";
import { stopStatus, type Progress } from "@/domain/trail/progress";
import type { Unit } from "@/domain/trail/schema";
import type { IslandStates } from "@/world/island";

export const LAUNCH_STATES: IslandStates = { letras: "obra", numeros: "futuro", cores: "futuro", lago: "futuro" };

type Level = 1 | 2 | 3 | 4;

function levelFor(done: number, total: number): Level {
  if (done >= total && total > 0) return 4;
  if (done >= 3) return 3;
  if (done >= 1) return 2;
  return 1;
}

function doneCount(p: Progress, unit: Unit, except?: string): number {
  return unit.stops.filter((s) => s.id !== except && Object.hasOwn(p.completedStops, s.id)).length;
}

export function farolLevel(p: Progress, unit: Unit): Level {
  return levelFor(doneCount(p, unit), unit.stops.length);
}

/** The level the farol had before `stopId` was completed. */
export function levelBefore(p: Progress, unit: Unit, stopId: string): Level {
  return levelFor(doneCount(p, unit, stopId), unit.stops.length);
}

/** The Línguas thread appears with the first finished stop. */
export function nestThreads(p: Progress, unit: Unit): number {
  return doneCount(p, unit) > 0 ? 1 : 0;
}

export function suggestedPlace(p: Progress, unit: Unit, today: string): "farol" | "ninho" {
  const farolHasStop = unit.stops.some((s) => stopStatus(unit, p, s.id) === "current");
  return dueCards(p.memory, today).length > 0 && !farolHasStop ? "ninho" : "farol";
}
