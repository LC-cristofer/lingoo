import type { MemoryState } from "./memory";
import type { PathUnit, Unit } from "./schema";

/** What the phase 1 app saved (`lingoo:progress:v1`), carried as it was: it grants no trail stop. */
export type LegacyV1 = {
  completedLessons: Record<string, string>;
  stickers: Record<string, string>;
};

export type Progress = {
  version: 3;
  /** stopId -> ISO date of the first completion */
  completedStops: Record<string, string>;
  /** stickerId -> ISO date it was earned */
  stickers: Record<string, string>;
  /** Local dates "YYYY-MM-DD", ascending, last 60 only */
  daysPlayed: string[];
  /** The memory-training cards. A stored payload without it loads as {}. */
  memory: MemoryState;
  /** The phase 1 progress found on this device, kept for its stickers; null when there was none. */
  legacy: LegacyV1 | null;
};

export type StopStatus = "done" | "current" | "locked";
export type UnitStatus = "done" | "current" | "locked" | "soon";

const MAX_DAYS = 60;

export function emptyProgress(): Progress {
  return { version: 3, completedStops: {}, stickers: {}, daysPlayed: [], memory: {}, legacy: null };
}

export function completeStop(p: Progress, stopId: string, now: Date, stickerId?: string): Progress {
  const stopDone = Object.hasOwn(p.completedStops, stopId);
  const stickerDone = stickerId === undefined || Object.hasOwn(p.stickers, stickerId);
  if (stopDone && stickerDone) return p;
  const iso = now.toISOString();
  return {
    ...p,
    completedStops: stopDone ? p.completedStops : { ...p.completedStops, [stopId]: iso },
    stickers: stickerDone || stickerId === undefined ? p.stickers : { ...p.stickers, [stickerId]: iso },
  };
}

/** A local date as "YYYY-MM-DD". */
export function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function markDay(p: Progress, now: Date): Progress {
  const key = dateKey(now);
  if (p.daysPlayed.includes(key)) return p;
  const days = [...p.daysPlayed, key].sort().slice(-MAX_DAYS);
  return { ...p, daysPlayed: days };
}

function isDone(p: Progress, stopId: string): boolean {
  return Object.hasOwn(p.completedStops, stopId);
}

export function stopStatus(unit: Unit, p: Progress, stopId: string): StopStatus {
  if (isDone(p, stopId)) return "done";
  const firstOpen = unit.stops.find((s) => !isDone(p, s.id));
  return firstOpen && firstOpen.id === stopId ? "current" : "locked";
}

function unitDone(unit: Unit, p: Progress): boolean {
  return unit.stops.every((s) => isDone(p, s.id));
}

export function unitStatus(
  path: PathUnit[],
  units: Record<string, Unit>,
  p: Progress,
  unitId: string,
): UnitStatus {
  const entry = path.find((u) => u.unitId === unitId);
  const unit = Object.hasOwn(units, unitId) ? units[unitId] : undefined;
  if (!entry || !entry.hasContent || !unit) return "soon";
  if (unitDone(unit, p)) return "done";
  // Each area of the island is its own sequence: an unfinished farol never locks the tree (whose branches open by `unitOpen`).
  for (const u of path) {
    if (u.unitId === unitId) return "current";
    if (!u.hasContent || u.area !== entry.area) continue;
    const other = Object.hasOwn(units, u.unitId) ? units[u.unitId] : undefined;
    if (other && !unitDone(other, p)) return "locked";
  }
  return "locked";
}

export function weekDays(p: Progress, now: Date): { date: string; played: boolean; isToday: boolean }[] {
  const today = dateKey(now);
  const sinceMonday = (now.getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - sinceMonday + i);
    const date = dateKey(d);
    return { date, played: p.daysPlayed.includes(date), isToday: date === today };
  });
}
