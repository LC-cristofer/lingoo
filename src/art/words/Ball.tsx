import { GroundShadow } from "../shared";
import { CORAL, Gloss, SUN_BASE } from "./parts";

const CX = 100;
const CY = 130;
const R = 66;
const COLORS = ["#4AA8F0", "#FFF8EC", CORAL, "#4AA8F0", "#FFF8EC", SUN_BASE];

function slice(i: number) {
  const a0 = (-90 + i * 60) * (Math.PI / 180);
  const a1 = (-90 + (i + 1) * 60) * (Math.PI / 180);
  const p = (a: number) => `${(CX + R * Math.cos(a)).toFixed(1)} ${(CY + R * Math.sin(a)).toFixed(1)}`;
  return `M${CX} ${CY} L${p(a0)} A${R} ${R} 0 0 1 ${p(a1)}Z`;
}

export function Ball() {
  return (
    <g>
      <GroundShadow rx={56} />
      <circle cx={CX} cy={CY} r={R} fill="#3A86C8" />
      {COLORS.map((c, i) => (
        <path key={i} d={slice(i)} fill={c} />
      ))}
      <circle cx={CX} cy={CY} r="13" fill="#FFF8EC" />
      <circle cx={CX} cy={CY} r="7" fill="#3A86C8" opacity=".5" />
      <path d="M100 130 m-66 0 a66 66 0 0 0 132 0 a70 70 0 0 1 -132 0Z" fill="#3A2618" opacity=".08" />
      <Gloss cx={70} cy={86} rx={16} ry={9} o={0.55} />
    </g>
  );
}
