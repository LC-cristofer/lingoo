import { Eyes, GroundShadow } from "../shared";
import { Gloss, SUN_BASE, SUN_DARK } from "./parts";

const FEATHER = "#E4A55A";
const FEATHER_DARK = "#C98A3E";
const BELLY = "#F8DDB0";
const COMB = "#F0524C";

export function Hen() {
  return (
    <g>
      <GroundShadow rx={64} />
      <path d="M150 150 Q196 138 186 96 Q176 112 164 112 Q172 128 150 132Z" fill={FEATHER_DARK} />
      <path d="M78 190 V198 M70 198 h18 M122 190 V198 M114 198 h18" stroke={SUN_DARK} strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx="100" cy="146" rx="62" ry="52" fill={FEATHER_DARK} />
      <ellipse cx="96" cy="142" rx="60" ry="50" fill={FEATHER} />
      <ellipse cx="94" cy="160" rx="34" ry="28" fill={BELLY} />
      <path d="M120 130 Q158 126 150 160 Q128 164 112 150Z" fill={FEATHER_DARK} />
      <circle cx="76" cy="38" r="12" fill={COMB} />
      <circle cx="98" cy="30" r="14" fill={COMB} />
      <circle cx="120" cy="38" r="12" fill={COMB} />
      <circle cx="100" cy="76" r="44" fill={FEATHER} />
      <path d="M88 108 Q100 138 112 108 Q100 118 88 108Z" fill={COMB} />
      <path d="M90 84 H110 Q100 108 90 84Z" fill={SUN_DARK} />
      <path d="M88 82 Q100 70 112 82 Q100 96 88 82Z" fill={SUN_BASE} />
      <Eyes dx={22} cy={66} r={7.5} />
      <ellipse cx="64" cy="84" rx="8" ry="5" fill="#FF7A6B" opacity=".4" />
      <ellipse cx="136" cy="84" rx="8" ry="5" fill="#FF7A6B" opacity=".4" />
      <Gloss cx={80} cy={52} rx={12} ry={5} rot={-40} o={0.45} />
    </g>
  );
}
