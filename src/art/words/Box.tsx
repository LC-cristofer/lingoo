import { GroundShadow } from "../shared";
import { Gloss, WOOD } from "./parts";

export function Box() {
  return (
    <g>
      <GroundShadow rx={84} />
      <path d="M26 74 L8 38 Q6 32 14 32 L68 40 L84 76Z" fill={WOOD.light} />
      <path d="M174 74 L192 38 Q194 32 186 32 L132 40 L116 76Z" fill={WOOD.base} />
      <rect x="22" y="68" width="156" height="132" rx="16" fill={WOOD.dark} />
      <rect x="20" y="64" width="156" height="130" rx="16" fill={WOOD.base} />
      <rect x="20" y="64" width="156" height="30" rx="14" fill={WOOD.deep} opacity=".35" />
      <rect x="72" y="64" width="52" height="68" rx="8" fill={WOOD.light} />
      <path d="M72 132 L98 118 L124 132Z" fill={WOOD.light} />
      <path d="M32 156 h30 M32 170 h20" stroke={WOOD.dark} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M134 150 h28" stroke={WOOD.dark} strokeWidth="4" strokeLinecap="round" fill="none" />
      <Gloss cx={42} cy={110} rx={14} ry={6} rot={-45} o={0.35} />
    </g>
  );
}
