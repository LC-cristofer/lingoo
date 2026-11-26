import { GroundShadow } from "../shared";
import { CORAL, CORAL_DARK, Gloss, SUN_BASE, WOOD } from "./parts";

export function Umbrella() {
  return (
    <g>
      <GroundShadow rx={44} />
      <path d="M100 100 V176 Q100 198 124 196 Q148 192 146 172" stroke={WOOD.deep} strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M100 18 V30" stroke={WOOD.deep} strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M10 108 A90 84 0 0 1 190 108 Q172 92 154 108 Q136 92 118 108 Q100 92 82 108 Q64 92 46 108 Q28 92 10 108Z" fill={CORAL_DARK} />
      <path d="M10 108 A90 84 0 0 1 100 24 Q70 52 82 108 Q64 92 46 108 Q28 92 10 108Z" fill={CORAL} />
      <path d="M100 24 Q130 52 118 108 Q100 92 82 108 Q70 52 100 24Z" fill={SUN_BASE} />
      <path d="M100 24 A90 84 0 0 1 190 108 Q172 92 154 108 Q136 92 118 108 Q130 52 100 24Z" fill={CORAL_DARK} />
      <Gloss cx={52} cy={70} rx={18} ry={6} rot={-45} o={0.5} />
    </g>
  );
}
