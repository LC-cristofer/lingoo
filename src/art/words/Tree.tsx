import { GroundShadow } from "../shared";
import { Gloss, LEAVES, TRUNK } from "./parts";

export function Tree() {
  return (
    <g>
      <GroundShadow rx={64} />
      <path d="M82 200 Q86 150 84 118 L116 118 Q114 150 120 200Z" fill={TRUNK.dark} />
      <path d="M80 200 Q84 150 82 118 L106 118 Q104 150 106 200Z" fill={TRUNK.base} />
      <path d="M84 150 Q60 142 52 118" stroke={TRUNK.base} strokeWidth="9" strokeLinecap="round" fill="none" />
      <circle cx="58" cy="104" r="40" fill={LEAVES.dark} />
      <circle cx="144" cy="104" r="40" fill={LEAVES.dark} />
      <circle cx="100" cy="62" r="52" fill={LEAVES.dark} />
      <ellipse cx="100" cy="112" rx="68" ry="34" fill={LEAVES.dark} />
      <circle cx="54" cy="98" r="38" fill={LEAVES.base} />
      <circle cx="140" cy="98" r="38" fill={LEAVES.base} />
      <circle cx="96" cy="58" r="50" fill={LEAVES.base} />
      <ellipse cx="96" cy="104" rx="62" ry="30" fill={LEAVES.base} />
      <circle cx="74" cy="46" r="20" fill={LEAVES.light} opacity=".7" />
      <circle cx="38" cy="92" r="14" fill={LEAVES.light} opacity=".6" />
      <Gloss cx={70} cy={36} rx={14} ry={7} o={0.35} />
    </g>
  );
}
