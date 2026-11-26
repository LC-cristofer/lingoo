import { GroundShadow } from "../shared";
import { CORAL, CORAL_DARK, Gloss, WOOD } from "./parts";

// A straw hat seen from the front and a little above: a wide curled brim and a low, dented crown with a coral band.
// Wide and flat on purpose, so it never reads as a mushroom.
export function Hat() {
  return (
    <g>
      <GroundShadow rx={92} />
      <path d="M6 150 C10 130 40 124 100 124 C160 124 190 130 194 150 C196 170 160 184 100 184 C40 184 4 170 6 150Z" fill={WOOD.dark} />
      <path d="M6 142 C10 122 40 116 100 116 C160 116 190 122 194 142 C196 162 160 176 100 176 C40 176 4 162 6 142Z" fill={WOOD.light} />
      <path d="M46 138 C42 104 52 76 78 70 C90 78 110 78 122 70 C148 76 158 104 154 138 C136 150 64 150 46 138Z" fill={WOOD.dark} />
      <path d="M44 132 C40 98 50 70 76 62 C90 72 110 72 124 62 C150 70 160 98 156 132 C138 144 62 144 44 132Z" fill={WOOD.base} />
      <path d="M76 62 C90 72 110 72 124 62 C112 58 88 58 76 62Z" fill={WOOD.deep} opacity=".55" />
      <path d="M44 124 C62 136 138 136 156 124 L156 136 C138 148 62 148 44 136Z" fill={CORAL_DARK} />
      <path d="M44 120 C62 132 138 132 156 120 L156 132 C138 144 62 144 44 132Z" fill={CORAL} />
      <path d="M22 148 q40 20 78 20 M30 158 q34 14 70 14" stroke={WOOD.dark} strokeWidth="3" strokeLinecap="round" fill="none" opacity=".45" />
      <Gloss cx={66} cy={90} rx={14} ry={7} rot={-60} o={0.45} />
    </g>
  );
}
