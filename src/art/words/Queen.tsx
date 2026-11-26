import { GroundShadow } from "../shared";
import { CORAL, Gloss, SUN_BASE, SUN_DARK } from "./parts";

const CUSHION = "#A57BEA";
const CUSHION_DARK = "#8A60D0";

export function Queen() {
  return (
    <g>
      <GroundShadow rx={84} />
      <path d="M16 192 Q6 168 22 148 Q100 126 178 148 Q194 168 184 192 Q100 212 16 192Z" fill={CUSHION_DARK} />
      <path d="M18 184 Q8 164 24 144 Q100 122 176 144 Q192 164 182 184 Q100 204 18 184Z" fill={CUSHION} />
      <circle cx="14" cy="190" r="9" fill={SUN_BASE} />
      <circle cx="186" cy="190" r="9" fill={SUN_BASE} />
      <path d="M40 150 Q100 134 160 150" stroke="#C4A3F2" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M36 142 L24 62 Q22 54 30 58 L66 92 L94 38 Q100 30 106 38 L134 92 L170 58 Q178 54 176 62 L164 142 Q100 162 36 142Z" fill={SUN_DARK} />
      <path d="M32 138 L20 58 Q18 50 26 54 L62 88 L90 34 Q96 26 102 34 L130 88 L166 54 Q174 50 172 58 L160 138 Q96 158 32 138Z" fill={SUN_BASE} />
      <path d="M34 112 Q96 132 158 112 L160 138 Q96 158 32 138Z" fill="#E8B21E" />
      <circle cx="22" cy="52" r="9" fill={CORAL} />
      <circle cx="96" cy="28" r="10" fill="#4AA8F0" />
      <circle cx="172" cy="52" r="9" fill="#5DB55A" />
      <circle cx="64" cy="126" r="7" fill="#4AA8F0" />
      <circle cx="96" cy="130" r="8" fill={CORAL} />
      <circle cx="128" cy="126" r="7" fill="#5DB55A" />
      <Gloss cx={52} cy={90} rx={12} ry={5} rot={-60} o={0.55} />
    </g>
  );
}
