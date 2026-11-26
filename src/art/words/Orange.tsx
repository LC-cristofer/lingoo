import { GroundShadow } from "../shared";
import { Gloss, LEAVES, TRUNK } from "./parts";

const FRUIT = "#F6A12E";
const FRUIT_DARK = "#DE8A1E";

export function Orange() {
  return (
    <g>
      <GroundShadow rx={62} />
      <circle cx="100" cy="132" r="68" fill={FRUIT_DARK} />
      <circle cx="96" cy="128" r="66" fill={FRUIT} />
      {[[70, 150], [100, 168], [128, 146], [118, 112], [74, 112], [96, 140], [58, 132], [140, 124]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill={FRUIT_DARK} opacity=".7" />
      ))}
      <circle cx="98" cy="70" r="7" fill={TRUNK.dark} />
      <path d="M100 68 Q124 36 158 46 Q146 82 100 68Z" fill={LEAVES.base} />
      <path d="M104 66 Q126 50 150 50 Q138 68 104 66Z" fill={LEAVES.light} opacity=".7" />
      <path d="M98 68 Q80 44 56 50 Q64 72 98 68Z" fill={LEAVES.dark} />
      <Gloss cx={62} cy={102} rx={18} ry={10} o={0.5} />
    </g>
  );
}
