import { GroundShadow } from "../shared";
import { CORAL, CORAL_DARK, Gloss, SUN_BASE } from "./parts";

const SKY = "#4AA8F0";
const STICK = "#9C6631";

export function Kite() {
  return (
    <g>
      <GroundShadow rx={34} />
      <path d="M100 152 Q70 164 100 174 Q130 184 100 196" stroke={STICK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M100 8 L156 78 L100 152Z" fill={CORAL_DARK} />
      <path d="M100 8 L44 78 L100 152Z" fill={CORAL} />
      <path d="M100 78 L156 78 L100 152Z" fill="#E8B21E" />
      <path d="M100 78 L44 78 L100 152Z" fill={SUN_BASE} />
      <path d="M100 8 L100 78 L44 78Z" fill="#FFF8EC" />
      <path d="M100 8 L100 78 L156 78Z" fill="#E9DDC6" />
      <path d="M100 8 V152 M44 78 H156" stroke={STICK} strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="100" cy="78" r="6" fill={STICK} />
      <path d="M84 160 L100 166 L88 176Z M116 160 L100 166 L112 176Z" fill={SKY} />
      <path d="M86 182 L100 188 L90 198Z M114 182 L100 188 L110 198Z" fill={CORAL} />
      <Gloss cx={78} cy={50} rx={14} ry={6} rot={-55} o={0.5} />
    </g>
  );
}
