import { GroundShadow } from "../shared";
import { CORAL, LEAVES, STONE } from "./parts";

const PAPER = "#F6E2B8";
const PAPER_DARK = "#E3C58C";
const PAPER_LIGHT = "#FBEED0";

export function MapWord() {
  return (
    <g>
      <GroundShadow rx={84} />
      <rect x="18" y="38" width="170" height="156" rx="18" fill={PAPER_DARK} transform="rotate(-3 100 116)" />
      <g transform="rotate(-3 100 116)">
        <rect x="14" y="30" width="170" height="156" rx="18" fill={PAPER} />
        <rect x="14" y="30" width="57" height="156" rx="14" fill={PAPER_LIGHT} opacity=".7" />
        <rect x="128" y="30" width="56" height="156" rx="14" fill={PAPER_DARK} opacity=".35" />
        <path d="M34 150 L56 112 L78 150Z" fill={STONE.dark} />
        <path d="M56 112 L66 128 L58 128 L52 136 Z" fill={STONE.light} />
        <circle cx="146" cy="66" r="14" fill={LEAVES.base} />
        <circle cx="130" cy="80" r="10" fill={LEAVES.dark} />
        <path d="M36 70 q20 -22 40 -4 q18 14 38 -4 q16 -10 22 14 q6 28 -18 36 q-24 8 -40 30 q-14 18 -36 0" stroke={CORAL} strokeWidth="5" strokeLinecap="round" strokeDasharray="2 11" fill="none" />
        <path d="M110 134 L138 162 M138 134 L110 162" stroke={CORAL} strokeWidth="11" strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
}
