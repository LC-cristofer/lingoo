import { GroundShadow } from "../shared";
import { Gloss, LEAVES, TRUNK } from "./parts";

const RED = "#EF5B4F";
const RED_DARK = "#D6453F";

export function Apple() {
  return (
    <g>
      <GroundShadow rx={62} />
      <circle cx="68" cy="124" r="56" fill={RED_DARK} />
      <circle cx="132" cy="124" r="56" fill={RED_DARK} />
      <ellipse cx="100" cy="142" rx="64" ry="52" fill={RED_DARK} />
      <circle cx="64" cy="118" r="54" fill={RED} />
      <circle cx="128" cy="118" r="54" fill={RED} />
      <ellipse cx="96" cy="136" rx="58" ry="52" fill={RED} />
      <path d="M92 70 Q100 82 108 70 Q100 64 92 70Z" fill={RED_DARK} />
      <path d="M100 74 Q98 52 108 36" stroke={TRUNK.dark} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M108 50 Q130 24 160 38 Q146 66 108 50Z" fill={LEAVES.base} />
      <path d="M112 50 Q132 40 152 42 Q140 56 112 50Z" fill={LEAVES.light} opacity=".7" />
      <Gloss cx={62} cy={96} rx={16} ry={10} o={0.5} />
    </g>
  );
}
