import { GroundShadow } from "../shared";
import { CORAL, CORAL_DARK, Gloss, WOOD } from "./parts";

export function Hat() {
  return (
    <g>
      <GroundShadow rx={86} />
      <ellipse cx="100" cy="164" rx="92" ry="34" fill={WOOD.dark} />
      <ellipse cx="100" cy="156" rx="92" ry="32" fill={WOOD.light} />
      <path d="M46 152 C42 96 62 60 100 60 C138 60 158 96 154 152 C140 176 60 176 46 152Z" fill={WOOD.dark} />
      <path d="M42 142 C40 92 60 54 96 54 C134 54 156 90 152 142 C136 168 56 168 42 142Z" fill={WOOD.base} />
      <path d="M44 128 C84 150 112 150 152 124 L154 142 C120 170 76 170 44 148Z" fill={CORAL_DARK} />
      <path d="M42 122 C84 144 112 144 152 118 L152 136 C116 160 78 160 42 140Z" fill={CORAL} />
      <circle cx="146" cy="138" r="13" fill="#FFC93C" />
      <circle cx="146" cy="138" r="6" fill="#F2B220" />
      <Gloss cx={72} cy={82} rx={20} ry={9} rot={-50} o={0.45} />
      <path d="M20 150 q40 22 90 22 M22 160 q40 18 80 18" stroke={WOOD.dark} strokeWidth="3" strokeLinecap="round" fill="none" opacity=".5" />
    </g>
  );
}
