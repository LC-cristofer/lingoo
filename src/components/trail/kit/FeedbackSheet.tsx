import type { ReactNode } from "react";
import { ChunkyButton } from "./ChunkyButton";

export type SheetKind = "correct" | "retry" | "hint";

type FeedbackSheetProps = {
  kind: SheetKind;
  line: ReactNode;
  onContinue?: () => void;
  /** The slot for Nino (his reaction pose): shown on the left of the line instead of the round icon. */
  who?: ReactNode;
};

function Icon({ kind }: { kind: SheetKind }) {
  return (
    <span className="k-sheet-icon" aria-hidden="true">
      <svg viewBox="-12 -12 24 24" width="26" height="26">
        {kind === "correct" ? (
          <path d="M-6 0 l4.5 4.5 l8.5 -9.5" stroke="currentColor" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M0 -9 l2.6 5.6 l6 .8 l-4.4 4.2 l1.1 6 l-5.3 -2.9 l-5.3 2.9 l1.1 -6 l-4.4 -4.2 l6 -.8z" fill="currentColor" />
        )}
      </svg>
    </span>
  );
}

/** Bottom sheet: green (--success-bg) for a right answer, warm (--retry-bg) otherwise, never red; `who` is the slot for Nino. */
export function FeedbackSheet({ kind, line, onContinue, who }: FeedbackSheetProps) {
  return (
    <div data-kind={kind} role="status" className={`k-sheet is-${kind === "correct" ? "correct" : "retry"}`}>
      <div className="k-sheet-head">
        {who ? (
          <span className="k-sheet-who" aria-hidden="true">
            {who}
          </span>
        ) : (
          <Icon kind={kind} />
        )}
        <p className={`k-sheet-text ${kind === "correct" ? "text-success" : "text-retry"}`}>{line}</p>
      </div>
      {kind === "correct" ? (
        <ChunkyButton label="Continuar" tone="ok" className="k-sheet-btn" onPress={() => onContinue?.()}>
          Continuar
        </ChunkyButton>
      ) : null}
    </div>
  );
}
