import type { Stop } from "@/domain/trail/schema";
import { LEAF, LOCKED, Padlock, SKY, SUN, WHITE } from "./shared";

// The map's stop icons, ported from the approved map (arte-fonte.html, functions stop and icons).
// The label is not part of the icon: the map screen writes it in HTML, where it can be narrated.

export type StopState = "done" | "current" | "locked";

const CORAL = "#FF7A6B";
const LILAC = "#B57EDC";

const COLORS: Record<Stop["kind"], string> = { song: CORAL, lesson: SUN, story: SKY, challenge: LILAC };

export function Glyph({ kind }: { kind: Stop["kind"] }) {
  switch (kind) {
    case "song":
      return (
        <>
          <ellipse cx="-9" cy="10" rx="7" ry="5.5" fill={WHITE} />
          <ellipse cx="10" cy="6" rx="7" ry="5.5" fill={WHITE} />
          <path d="M-3 10 V-12 L16 -16 V6" stroke={WHITE} strokeWidth="3.5" fill="none" strokeLinejoin="round" />
          <path d="M-3 -12 L16 -16 V-10 L-3 -6Z" fill={WHITE} />
        </>
      );
    case "lesson":
      return <path d="M0 -17 l5 10 l11 1.6 l-8 7.8 l1.9 11 l-9.9 -5.2 l-9.9 5.2 l1.9 -11 l-8 -7.8 l11 -1.6z" fill={WHITE} />;
    case "story":
      return (
        <>
          <path d="M-17 -12 q9 -4 17 2 q8 -6 17 -2 v24 q-9 -4 -17 2 q-8 -6 -17 -2z" fill={WHITE} />
          <path d="M0 -10 v24" stroke={SKY} strokeWidth="2" />
        </>
      );
    case "challenge":
      return (
        <>
          <path d="M-11 -14 h22 v8 q0 12 -11 14 q-11 -2 -11 -14z M-4 8 h8 v6 h6 v4 h-20 v-4 h6z" fill={WHITE} />
          <path d="M-11 -10 h-6 q0 10 7 10 M11 -10 h6 q0 10 -7 10" stroke={WHITE} strokeWidth="3" fill="none" />
        </>
      );
  }
}

/** The disc is 84 units across (as approved); `size` is its rendered diameter in px. */
const VIEW = 128;

export function StopIcon({ kind, state, size = 84 }: { kind: Stop["kind"]; state: StopState; size?: number }) {
  const px = Math.round((size * VIEW) / 84);
  return (
    <svg
      viewBox={`${-VIEW / 2} ${-VIEW / 2} ${VIEW} ${VIEW}`}
      width={px}
      height={px}
      aria-hidden="true"
      focusable="false"
      data-kind={kind}
      data-state={state}
      className="art-stop"
    >
      {state === "current" ? (
        <g className="art-stop-ring">
          <circle r="52" fill="none" stroke={WHITE} strokeWidth="6" opacity=".9" />
          <g className="art-stop-dash">
            <circle r="60" fill="none" stroke={SUN} strokeWidth="4" strokeDasharray="6 8" />
          </g>
        </g>
      ) : null}
      <ellipse cx="0" cy="40" rx="38" ry="8" fill="rgba(0,0,0,.12)" />
      <circle data-disc="" r="42" fill={state === "locked" ? LOCKED : COLORS[kind]} stroke={WHITE} strokeWidth="6" />
      <path d="M-39 0 A39 39 0 0 0 39 0 Z" fill="#000" opacity=".06" />
      <g transform="scale(1.3)">{state === "locked" ? <Padlock /> : <Glyph kind={kind} />}</g>
      {state === "done" ? (
        <g data-badge="done" transform="translate(30 -30)">
          <circle r="16" fill={LEAF} stroke={WHITE} strokeWidth="4" />
          <path d="M-7 0 l5 5 l9 -10" stroke={WHITE} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : null}
    </svg>
  );
}
