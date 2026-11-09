import type { RepeatStep } from "../content-schema";
import type { GameResult } from "./types";

export type RepeatState = { index: number; finished: boolean };

export function createRepeat(): RepeatState {
  return { index: 0, finished: false };
}

export function nextRepeat(
  step: RepeatStep,
  s: RepeatState,
): { state: RepeatState; result: GameResult } {
  if (s.finished) return { state: s, result: "concluido" };
  const index = s.index + 1;
  return { state: { index, finished: index >= step.cardIds.length }, result: "concluido" };
}
