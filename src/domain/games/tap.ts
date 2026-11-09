import type { TapStep } from "../content-schema";
import type { GameResult } from "./types";

export type TapState = { round: number; locked: boolean; finished: boolean };

export function createTap(): TapState {
  return { round: 0, locked: false, finished: false };
}

export function tapOption(
  step: TapStep,
  s: TapState,
  optionId: string,
): { state: TapState; result: GameResult | null } {
  if (s.locked || s.finished) return { state: s, result: null };
  const round = step.rounds[s.round];
  if (!round) return { state: s, result: null };
  if (optionId === round.answerId) {
    return { state: { ...s, locked: true }, result: "acerto" };
  }
  return { state: s, result: "erro" };
}

export function releaseTap(step: TapStep, s: TapState): TapState {
  if (!s.locked || s.finished) return s;
  const next = s.round + 1;
  if (next >= step.rounds.length) return { round: s.round, locked: false, finished: true };
  return { round: next, locked: false, finished: false };
}
