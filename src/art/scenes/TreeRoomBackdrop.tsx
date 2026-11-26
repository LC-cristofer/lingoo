import { useId } from "react";

// The inside of the Árvore das Letras, behind a letras story page: the warm trunk wall, a round
// window onto the leaves and the wooden floor, all softly out of focus so the figures stay readable.
// Colours from the bible: trunk #9A6A43 / #7A5232, leaves #5DB55A / #3F8F45 / #86CF6B.

const TRUNK = "#9A6A43";
const TRUNK_DARK = "#7A5232";
const LEAF = "#5DB55A";
const LEAF_DARK = "#3F8F45";
const LEAF_LIGHT = "#86CF6B";

export function TreeRoomBackdrop() {
  const blurId = `tree-room-blur-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 1000 625"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
      data-variant="tree-room"
      className="art-backdrop"
      style={{ display: "block", position: "absolute", inset: 0 }}
    >
      <defs>
        <filter id={blurId} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <rect width="1000" height="625" fill={TRUNK} />
      <g filter={`url(#${blurId})`}>
        {/* Wood rings on the wall. */}
        <g fill="none" stroke={TRUNK_DARK} strokeWidth="14" opacity=".35">
          <ellipse cx="180" cy="250" rx="120" ry="170" />
          <ellipse cx="180" cy="250" rx="60" ry="96" />
          <ellipse cx="560" cy="200" rx="90" ry="140" />
        </g>
        {/* The round window and the leaves outside. */}
        <circle cx="800" cy="170" r="112" fill={TRUNK_DARK} />
        <circle cx="800" cy="170" r="92" fill={LEAF_LIGHT} />
        <circle cx="760" cy="200" r="46" fill={LEAF} />
        <circle cx="840" cy="140" r="40" fill={LEAF_DARK} />
        <circle cx="830" cy="215" r="34" fill={LEAF} />
        {/* The floor. */}
        <path d="M0 470 Q500 430 1000 470 V625 H0Z" fill={TRUNK_DARK} />
        <path d="M0 520 Q500 488 1000 520 V625 H0Z" fill={TRUNK_DARK} opacity=".6" />
      </g>
    </svg>
  );
}
