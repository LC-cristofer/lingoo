import { GroundShadow } from "../shared";
import { Gloss, WOOD } from "./parts";

const SHELL = "#FFF1D6";
const SHELL_DARK = "#EBD5AE";

export function Egg() {
  return (
    <g>
      <GroundShadow rx={50} />
      <path d="M100 18 C148 18 168 100 168 140 C168 180 138 200 100 200 C62 200 32 180 32 140 C32 100 52 18 100 18Z" fill={SHELL_DARK} />
      <path d="M96 18 C140 18 160 98 158 136 C156 176 130 190 96 190 C60 190 36 172 36 136 C36 98 52 18 96 18Z" fill={SHELL} />
      <circle cx="116" cy="70" r="5" fill={WOOD.light} />
      <circle cx="130" cy="112" r="6" fill={WOOD.light} />
      <circle cx="86" cy="150" r="5" fill={WOOD.light} />
      <circle cx="112" cy="164" r="4" fill={WOOD.light} />
      <circle cx="58" cy="124" r="4" fill={WOOD.light} />
      <Gloss cx={70} cy={72} rx={18} ry={32} rot={20} o={0.7} />
    </g>
  );
}
