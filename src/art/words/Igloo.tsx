import { GroundShadow } from "../shared";
import { Gloss } from "./parts";

// Ice-blue blocks on white snow: darker than the card so the dome reads at 96 px, with a dark door in a short tunnel.
const ICE = "#A9D3F0";
const ICE_DARK = "#6FA8D6";
const ICE_LINE = "#4F86B8";
const DOOR = "#34506B";
const SNOW = "#FFFFFF";

export function Igloo() {
  return (
    <g>
      <GroundShadow rx={92} />
      <ellipse cx="100" cy="196" rx="94" ry="12" fill={SNOW} />
      <path d="M10 194 A90 94 0 0 1 190 194Z" fill={ICE_DARK} />
      <path d="M10 194 A90 94 0 0 1 172 140 Q150 74 70 64 A90 94 0 0 0 10 194Z" fill={ICE} />
      <path d="M16 168 H184 M26 142 H174 M48 116 H152 M72 92 H128" stroke={ICE_LINE} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M42 168 V194 M158 168 V194 M64 142 V168 M100 142 V168 M136 142 V168 M82 116 V142 M118 116 V142 M100 92 V116 M60 116 V142" stroke={ICE_LINE} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M56 196 V170 A44 40 0 0 1 144 170 V196Z" fill={ICE} />
      <path d="M56 196 V170 A44 40 0 0 1 100 130 V196Z" fill={ICE_DARK} opacity=".55" />
      <path d="M70 196 V172 A30 28 0 0 1 130 172 V196Z" fill={DOOR} />
      <path d="M70 172 A30 28 0 0 1 100 144 V196 H70Z" fill="#243B52" />
      <Gloss cx={52} cy={104} rx={20} ry={8} rot={-55} o={0.6} />
    </g>
  );
}
