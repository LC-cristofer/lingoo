import { GroundShadow } from "../shared";
import { CORAL, CORAL_DARK, Gloss, SUN_BASE, TRUNK } from "./parts";

export function Yoyo() {
  return (
    <g>
      <GroundShadow rx={50} />
      <path d="M100 12 V92" stroke={TRUNK.dark} strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="100" cy="12" r="9" fill="none" stroke={TRUNK.dark} strokeWidth="4" />
      <circle cx="104" cy="150" r="54" fill={CORAL_DARK} />
      <circle cx="100" cy="146" r="54" fill={CORAL} />
      <circle cx="100" cy="146" r="38" fill={SUN_BASE} />
      <circle cx="100" cy="146" r="38" fill="#fff" opacity=".18" />
      <circle cx="100" cy="146" r="22" fill={CORAL_DARK} />
      <circle cx="100" cy="146" r="12" fill={SUN_BASE} />
      <path d="M100 92 V134" stroke={TRUNK.dark} strokeWidth="4" strokeLinecap="round" fill="none" />
      <Gloss cx={68} cy={110} rx={16} ry={7} rot={-45} o={0.5} />
    </g>
  );
}
