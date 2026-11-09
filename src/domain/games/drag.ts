import type { DragStep } from "../content-schema";
import type { GameResult } from "./types";

export type DragState = { matched: string[]; finished: boolean };

export function createDrag(): DragState {
  return { matched: [], finished: false };
}

export function drop(
  step: DragStep,
  s: DragState,
  cardId: string,
  targetId: string | null,
): { state: DragState; result: GameResult | null } {
  if (s.finished || targetId === null || s.matched.includes(cardId)) {
    return { state: s, result: null };
  }
  if (targetId !== cardId || !step.cardIds.includes(cardId)) {
    return { state: s, result: "erro" };
  }
  const matched = [...s.matched, cardId];
  return {
    state: { matched, finished: matched.length === step.cardIds.length },
    result: "acerto",
  };
}
