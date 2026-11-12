import type { Stop } from "@/domain/trail/schema";
import { Glyph } from "@/art/StopIcon";

export type StopButtonState = "done" | "current" | "locked";

type StopButtonProps = {
  kind: Stop["kind"];
  state: StopButtonState;
  label: string;
  labelSide: "left" | "right";
  onPress: () => void;
  /** Diameter of the disc in px (the current stop is drawn 14 px larger). */
  size?: number;
};

const COLORS: Record<Stop["kind"], [string, string]> = {
  song: ["#FF7A6B", "#D9544A"],
  lesson: ["#FFC93C", "#DE9F12"],
  story: ["#4AA8F0", "#2C82CC"],
  challenge: ["#B57EDC", "#8F57BF"],
};
const LOCKED: [string, string] = ["#D5D9E0", "#AEB4BF"];

/** A chunky, pressable stop: a disc on a darker edge, its name beside it. */
export function StopButton({ kind, state, label, labelSide, onPress, size = 76 }: StopButtonProps) {
  const locked = state === "locked";
  const [fill, edge] = locked ? LOCKED : COLORS[kind];
  const s = state === "current" ? size + 14 : size;
  return (
    <button
      type="button"
      data-kind={kind}
      data-state={state}
      aria-label={label}
      aria-disabled={locked ? "true" : undefined}
      onClick={() => {
        if (!locked) onPress();
      }}
      className="k-stop"
      style={{ width: s, height: s }}
    >
      {state === "current" ? <span className="k-stop-ring" /> : null}
      <span className="k-stop-disc" style={{ background: fill, boxShadow: `0 9px 0 ${edge}, 0 15px 0 rgba(31,60,40,.18)` }}>
        <svg viewBox="-24 -24 48 48" width={s * 0.62} height={s * 0.62} aria-hidden="true">
          {locked ? (
            <g>
              <rect x="-11" y="-3" width="22" height="17" rx="5" fill="#fff" />
              <path d="M-6.5 -3 v-5 a6.5 6.5 0 0 1 13 0 v5" stroke="#fff" strokeWidth="4.5" fill="none" />
            </g>
          ) : (
            <Glyph kind={kind} />
          )}
        </svg>
      </span>
      {state === "done" ? (
        <span className="k-stop-check" aria-hidden="true">
          <svg viewBox="-10 -10 20 20" width="18" height="18">
            <path d="M-5 0 l4 4 l7 -8" stroke="#fff" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : null}
      {state !== "current" ? (
        <span aria-hidden="true" className={`k-stop-label is-${labelSide} ${locked ? "is-locked" : ""}`}>
          {label}
        </span>
      ) : null}
    </button>
  );
}
