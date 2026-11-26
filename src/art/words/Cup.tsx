import { GroundShadow } from "../shared";
import { CREAM, Gloss, STONE, WATER } from "./parts";

const MUG = "#4AA8F0";
const MUG_DARK = "#3A8CD0";
const TEA = "#9C6631";

export function Cup() {
  return (
    <g>
      <GroundShadow rx={78} />
      <ellipse cx="100" cy="190" rx="78" ry="12" fill={STONE.dark} />
      <ellipse cx="100" cy="186" rx="78" ry="12" fill={STONE.light} />
      <path d="M150 100 Q196 92 188 132 Q180 166 146 160" stroke={MUG_DARK} strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M32 84 H168 V138 Q168 188 100 188 Q32 188 32 138Z" fill={MUG_DARK} />
      <path d="M28 84 H164 V136 Q164 184 96 184 Q28 184 28 136Z" fill={MUG} />
      <ellipse cx="96" cy="84" rx="68" ry="16" fill="#F4FAFF" />
      <ellipse cx="96" cy="86" rx="58" ry="11" fill={TEA} />
      <circle cx="96" cy="134" r="18" fill={CREAM} />
      <circle cx="90" cy="130" r="5" fill="#FF8FA3" />
      <circle cx="102" cy="130" r="5" fill="#FF8FA3" />
      <path d="M84 134 L96 148 L108 134Z" fill="#FF8FA3" />
      <path d="M72 62 q-12 -14 0 -28 q10 -12 0 -22 M110 58 q-12 -14 0 -28 q10 -12 0 -22" stroke={WATER.light} strokeWidth="7" strokeLinecap="round" fill="none" />
      <Gloss cx={46} cy={124} rx={7} ry={22} rot={-5} o={0.5} />
    </g>
  );
}
