import type { ReactNode } from "react";
import { ChunkyButton } from "./ChunkyButton";

export type SheetKind = "correct" | "retry" | "hint";

type FeedbackSheetProps = {
  kind: SheetKind;
  line: ReactNode;
  onContinue?: () => void;
};

/** Bottom sheet: deep green with white text for a right answer, orange with navy text otherwise. */
export function FeedbackSheet({ kind, line, onContinue }: FeedbackSheetProps) {
  return (
    <div data-kind={kind} role="status" className={`k-sheet is-${kind === "correct" ? "correct" : "retry"}`}>
      <p className={`k-sheet-text ${kind === "correct" ? "text-white" : "text-ink"}`}>{line}</p>
      {kind === "correct" ? (
        <ChunkyButton label="Continuar" tone="sun" className="k-sheet-btn" onPress={() => onContinue?.()}>
          Continuar
        </ChunkyButton>
      ) : null}
    </div>
  );
}
