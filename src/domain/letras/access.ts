/* Which branches of the Árvore das Letras are open, and where the child is sent next.
   The branches have their own rule (not `unitStatus`, which only orders the units of one area in sequence). */
import { startBranch, type Profile } from "@/domain/nestoy/profile";
import { getUnit } from "@/domain/trail/content";
import type { Progress } from "@/domain/trail/progress";

export type Branch = 1 | 2 | 3 | 4;
export const BRANCHES: readonly Branch[] = [1, 2, 3, 4];

export const branchUnitId = (n: Branch): string => `letras-${n}`;

const isDone = (p: Progress, stopId: string) => Object.hasOwn(p.completedStops, stopId);

/**
 * A branch is open from branch 1 up to the one the child starts on, and each next branch opens when the Desafio of
 * the one before is done. A branch with a finished stop is always open: changing the answers in the cadastro never closes progress.
 */
export function unitOpen(p: Progress, profile: Profile, n: Branch): boolean {
  if (n <= startBranch(profile)) return true;
  if (isDone(p, `letras-${n - 1}/challenge`)) return true;
  const unit = getUnit(branchUnitId(n));
  return unit !== null && unit.stops.some((s) => isDone(p, s.id));
}

/** The stop the tree suggests: the first unfinished one from the start branch up, then any earlier open branch; null when everything is done. */
export function suggestedStop(p: Progress, profile: Profile): { unit: Branch; stop: number } | null {
  const start = startBranch(profile);
  const order = [...BRANCHES.filter((n) => n >= start), ...BRANCHES.filter((n) => n < start)];
  for (const n of order) {
    if (!unitOpen(p, profile, n)) continue;
    const unit = getUnit(branchUnitId(n));
    const stop = unit ? unit.stops.findIndex((s) => !isDone(p, s.id)) : -1;
    if (stop >= 0) return { unit: n, stop };
  }
  return null;
}
