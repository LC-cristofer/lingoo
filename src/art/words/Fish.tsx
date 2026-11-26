import { GroundShadow } from "../shared";
import { Gloss, SUN_BASE, SUN_DARK, WATER } from "./parts";

const BODY = "#4AA8F0";
const BODY_DARK = "#3A8CD0";
const BELLY = "#CFEAFB";

export function Fish() {
  return (
    <g>
      <GroundShadow rx={50} />
      <path d="M138 114 Q150 96 160 62 Q172 56 190 52 Q202 100 190 148 Q172 156 160 160 Q150 130 138 118Z" fill={SUN_DARK} />
      <path d="M134 114 Q146 96 154 66 Q168 60 184 58 Q196 104 184 142 Q168 150 154 156 Q146 130 134 118Z" fill={SUN_BASE} />
      <path d="M70 70 Q96 30 128 72Z" fill={SUN_DARK} />
      <ellipse cx="96" cy="112" rx="68" ry="54" fill={BODY_DARK} />
      <ellipse cx="92" cy="106" rx="66" ry="50" fill={BODY} />
      <path d="M34 124 Q92 172 150 120 Q144 154 92 158 Q52 156 34 124Z" fill={BELLY} />
      <path d="M112 74 q10 36 0 68 M128 80 q8 28 0 56" stroke={BODY_DARK} strokeWidth="5" strokeLinecap="round" fill="none" opacity=".6" />
      <circle cx="54" cy="96" r="11" fill="#2B2D42" />
      <circle cx="58" cy="92" r="4.2" fill="#fff" />
      <circle cx="51" cy="100" r="1.9" fill="#fff" />
      <path d="M26 118 q8 6 16 0" stroke="#2B2D42" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <ellipse cx="66" cy="116" rx="8" ry="5" fill="#FF7A6B" opacity=".35" />
      <Gloss cx={78} cy={72} rx={22} ry={8} o={0.45} />
      <circle cx="18" cy="60" r="8" fill={WATER.light} opacity=".8" />
      <circle cx="30" cy="38" r="5" fill={WATER.light} opacity=".8" />
      <circle cx="14" cy="28" r="3.5" fill={WATER.light} opacity=".8" />
    </g>
  );
}
