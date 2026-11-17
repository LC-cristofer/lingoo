import type { Stop } from "@/domain/trail/schema";
import { Glyph } from "@/art/StopIcon";

export type StopButtonState = "done" | "current" | "locked";

type StopButtonProps = {
  kind: Stop["kind"];
  state: StopButtonState;
  label: string;
  labelSide: "left" | "right";
  onPress: () => void;
  /** Called instead of onPress when the stop is locked (the map shakes it and says why). */
  onLockedPress?: () => void;
  /** Draws the name beside the disc (default). A ghost stop keeps its aria-label but shows none. */
  showLabel?: boolean;
  /** Diameter of the disc in px (the current stop is drawn 14 px larger). */
  size?: number;
};

/** A round, pressable stop: green when done, amber with a ring of light when current, navy when locked. */
export function StopButton({ kind, state, label, labelSide, onPress, onLockedPress, showLabel = true, size = 76 }: StopButtonProps) {
  const locked = state === "locked";
  const s = state === "current" ? size + 14 : size;
  return (
    <button
      type="button"
      data-kind={kind}
      data-state={state}
      aria-label={label}
      aria-disabled={locked ? "true" : undefined}
      onClick={() => {
        if (locked) onLockedPress?.();
        else onPress();
      }}
      className="k-stop"
      style={{ width: s, height: s }}
    >
      {state === "current" ? <span className="k-stop-ring" /> : null}
      <span className="k-stop-disc">
        <svg className="k-stop-glyph" viewBox="-24 -24 48 48" width={s * 0.54} height={s * 0.54} aria-hidden="true">
          {locked ? (
            <g>
              <rect x="-11" y="-3" width="22" height="17" rx="5" fill="currentColor" />
              <path d="M-6.5 -3 v-5 a6.5 6.5 0 0 1 13 0 v5" stroke="currentColor" strokeWidth="4.5" fill="none" />
            </g>
          ) : (
            <Glyph kind={kind} />
          )}
        </svg>
      </span>
      {state === "done" ? (
        <span className="k-stop-check" aria-hidden="true">
          <svg viewBox="-10 -10 20 20" width="16" height="16">
            <path d="M-5 0 l4 4 l7 -8" stroke="currentColor" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : null}
      {state !== "current" && showLabel ? (
        <span aria-hidden="true" className={`k-stop-label is-${labelSide} ${locked ? "is-locked" : ""}`}>
          {label}
        </span>
      ) : null}
    </button>
  );
}
