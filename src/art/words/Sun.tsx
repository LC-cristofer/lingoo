import { Cheeks, Eyes, GroundShadow } from "../shared";
import { Gloss, SUN_BASE, SUN_DARK } from "./parts";

export function Sun() {
  return (
    <g>
      <GroundShadow rx={50} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x1 = 100 + 78 * Math.cos(a);
        const y1 = 104 + 78 * Math.sin(a);
        const x2 = 100 + 96 * Math.cos(a);
        const y2 = 104 + 96 * Math.sin(a);
        return <path key={i} d={`M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`} stroke={i % 2 ? SUN_DARK : SUN_BASE} strokeWidth="14" strokeLinecap="round" fill="none" />;
      })}
      <circle cx="100" cy="104" r="68" fill={SUN_DARK} />
      <circle cx="96" cy="100" r="66" fill={SUN_BASE} />
      <Eyes dx={24} cy={92} r={9} />
      <Cheeks dx={40} cy={112} rx={9} ry={6} />
      <path d="M80 114 q16 20 32 0" stroke="#B23A48" strokeWidth="4" strokeLinecap="round" fill="none" />
      <Gloss cx={64} cy={64} rx={16} ry={7} rot={-45} o={0.5} />
    </g>
  );
}
