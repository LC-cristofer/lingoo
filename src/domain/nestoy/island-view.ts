import type { Area } from "@/domain/letras/area";
import { getUnit } from "@/domain/trail/content";
import { dueCards } from "@/domain/trail/memory";
import { stopStatus, type Progress } from "@/domain/trail/progress";
import type { Unit } from "@/domain/trail/schema";
import type { IslandStates } from "@/world/island";

export const LAUNCH_STATES: IslandStates = { letras: "pronto", numeros: "futuro", cores: "futuro", lago: "futuro" };

type Level = 1 | 2 | 3 | 4;
/** The areas of the island that have content: the farol's unit and the four branches of the Árvore das Letras. */
export type AreaUnits = { farol: Unit; letras: Unit[] };
export type { Area };
/** Where each area's thread sits in the nest (0 the Línguas blue, 1 the Letras coral). */
export const THREAD_INDEX: Record<Area, number> = { farol: 0, letras: 1 };

function levelFor(done: number, total: number): Level {
  if (done >= total && total > 0) return 4;
  if (done >= 3) return 3;
  if (done >= 1) return 2;
  return 1;
}

const isDone = (p: Progress, id: string) => Object.hasOwn(p.completedStops, id);

function doneCount(p: Progress, unit: Unit, except?: string): number {
  return unit.stops.filter((s) => s.id !== except && isDone(p, s.id)).length;
}

export function farolLevel(p: Progress, unit: Unit): Level {
  return levelFor(doneCount(p, unit), unit.stops.length);
}

/** The level the farol had before `stopId` was completed. */
export function levelBefore(p: Progress, unit: Unit, stopId: string): Level {
  return levelFor(doneCount(p, unit, stopId), unit.stops.length);
}

function treeLevelFor(done: number): Level {
  if (done >= 18) return 4;
  if (done >= 9) return 3;
  if (done >= 3) return 2;
  return 1;
}

/** The tree grows with the stops finished over all its branches: 3 for letter-fruits, 9 for birds and lanterns, 18 for flowers. */
export function arvoreLevel(p: Progress, units: Unit[]): Level {
  return treeLevelFor(units.reduce((n, u) => n + doneCount(p, u), 0));
}

/** The level the tree had before `stopId` was completed. */
export function arvoreLevelBefore(p: Progress, units: Unit[], stopId: string): Level {
  return treeLevelFor(units.reduce((n, u) => n + doneCount(p, u, stopId), 0));
}

const areaUnits = (areas: AreaUnits, area: Area): Unit[] => (area === "farol" ? [areas.farol] : areas.letras);

/** Which threads are woven in the nest: one per area with any stop finished, at the area's own place. */
export function wovenThreads(p: Progress, areas: AreaUnits): boolean[] {
  const woven = [false, false];
  for (const area of ["farol", "letras"] as const) {
    woven[THREAD_INDEX[area]] = areaUnits(areas, area).some((u) => doneCount(p, u) > 0);
  }
  return woven;
}

/** How many threads the nest has: one per area with any stop finished. */
export function nestThreads(p: Progress, areas: AreaUnits): number {
  return wovenThreads(p, areas).filter(Boolean).length;
}

/** When each area was last played: its latest finished stop (ISO). An area never played is missing. */
export function lastPlayedByArea(p: Progress, areas: AreaUnits): Partial<Record<Area, string>> {
  const out: Partial<Record<Area, string>> = {};
  for (const area of ["farol", "letras"] as const) {
    for (const u of areaUnits(areas, area)) {
      for (const s of u.stops) {
        const at = isDone(p, s.id) ? p.completedStops[s.id] : undefined;
        if (at && (!out[area] || at > out[area]!)) out[area] = at;
      }
    }
  }
  return out;
}

/**
 * The place that glows on the island. Among the areas with a stop still to play, the least recently played one
 * (never played counts as the oldest; a tie keeps the farol). Only finished stops move `lastPlayed`, so within a day
 * the suggestion changes only once a stop is completed. With nothing left to play: the nest when cards are due.
 */
export function suggestedPlace(
  p: Progress,
  areas: AreaUnits,
  today: string,
  lastPlayed: Partial<Record<Area, string>>,
): "farol" | "arvore" | "ninho" {
  const farolOpen = areas.farol.stops.some((s) => stopStatus(areas.farol, p, s.id) === "current");
  // Branch 1 is always open and each branch opens with the one before done: an unfinished stop means an open one.
  const letrasOpen = areas.letras.some((u) => u.stops.some((s) => !isDone(p, s.id)));
  if (farolOpen && letrasOpen) {
    const f = lastPlayed.farol ?? "", l = lastPlayed.letras ?? "";
    return l < f ? "arvore" : "farol";
  }
  if (farolOpen) return "farol";
  if (letrasOpen) return "arvore";
  return dueCards(p.memory, today).length > 0 ? "ninho" : "farol";
}

/** The island's areas from the content: the farol's unit and the tree's four branches (null if the farol's unit is missing). */
export function getAreaUnits(): AreaUnits | null {
  const farol = getUnit("forest-animals");
  if (!farol) return null;
  const letras = [1, 2, 3, 4].flatMap((n) => {
    const u = getUnit(`letras-${n}`);
    return u ? [u] : [];
  });
  return { farol, letras };
}
