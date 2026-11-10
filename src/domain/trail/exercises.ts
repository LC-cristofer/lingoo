import type { ArtId, Exercise } from "./schema";

type Side = "art" | "word";

export type MatchState = { selected: { side: Side; id: ArtId } | null; matched: ArtId[] };
export type MatchOutcome = "pending" | "pair" | "mismatch" | "complete";

export function matchSelect(
  ex: Extract<Exercise, { kind: "matchPairs" }>,
  s: MatchState,
  side: Side,
  id: ArtId,
): { state: MatchState; outcome: MatchOutcome } {
  if (s.matched.includes(id)) return { state: s, outcome: "pending" };
  if (!s.selected || s.selected.side === side) {
    return { state: { ...s, selected: { side, id } }, outcome: "pending" };
  }
  if (s.selected.id !== id) {
    return { state: { ...s, selected: null }, outcome: "mismatch" };
  }
  const matched = [...s.matched, id];
  const complete = ex.wordIds.every((w) => matched.includes(w));
  return { state: { selected: null, matched }, outcome: complete ? "complete" : "pair" };
}

export type RepeatState = { tapped: ArtId[] };

export function repeatTap(
  s: RepeatState,
  id: ArtId,
  all: ArtId[],
): { state: RepeatState; complete: boolean } {
  if (s.tapped.includes(id)) return { state: s, complete: false };
  const tapped = [...s.tapped, id];
  return { state: { tapped }, complete: all.every((a) => tapped.includes(a)) };
}

export function whatsMissingCheck(ex: Extract<Exercise, { kind: "whatsMissing" }>, chosenId: ArtId): boolean {
  return chosenId === ex.missingId;
}
