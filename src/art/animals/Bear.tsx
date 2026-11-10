import { GroundShadow, INK } from "../shared";

// Ported as approved from docs/arte/amostras-aprovadas/arte-fonte.html (function bear).
const FUR = "#B47A4C";
const FUR_DARK = "#A06A42";
const TAN = "#E9C49B";
const MUZZLE = "#F1D5B2";
const NOSE = "#3A2A22";

export function Bear() {
  return (
    <g>
      <GroundShadow rx={56} />
      <ellipse cx="100" cy="160" rx="54" ry="44" fill={FUR_DARK} />
      <ellipse cx="100" cy="168" rx="32" ry="30" fill={TAN} />
      <ellipse cx="66" cy="196" rx="20" ry="11" fill={FUR_DARK} />
      <ellipse cx="134" cy="196" rx="20" ry="11" fill={FUR_DARK} />
      <circle cx="48" cy="48" r="24" fill={FUR_DARK} />
      <circle cx="48" cy="48" r="13" fill={TAN} />
      <circle cx="152" cy="48" r="24" fill={FUR_DARK} />
      <circle cx="152" cy="48" r="13" fill={TAN} />
      <ellipse cx="100" cy="92" rx="70" ry="60" fill={FUR} />
      <ellipse cx="100" cy="118" rx="32" ry="24" fill={MUZZLE} />
      <ellipse cx="100" cy="105" rx="12" ry="9" fill={NOSE} />
      <circle cx="96" cy="102" r="3" fill="#fff" opacity=".7" />
      <path
        d="M100 114 v6 M100 120 q-8 8 -14 2 M100 120 q8 8 14 2"
        stroke={NOSE}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <g className="blink">
        <circle cx="72" cy="84" r="8" fill={INK} />
        <circle cx="128" cy="84" r="8" fill={INK} />
        <circle cx="75" cy="81" r="3" fill="#fff" />
        <circle cx="131" cy="81" r="3" fill="#fff" />
      </g>
      <ellipse cx="58" cy="108" rx="10" ry="6" fill="#FF7A6B" opacity=".3" />
      <ellipse cx="142" cy="108" rx="10" ry="6" fill="#FF7A6B" opacity=".3" />
    </g>
  );
}
