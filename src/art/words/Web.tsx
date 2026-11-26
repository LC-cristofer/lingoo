import { GroundShadow, INK } from "../shared";
import { WATER } from "./parts";

const CX = 100;
const CY = 104;
const RING = [24, 46, 68, 90];
const N = 8;

function pt(i: number, r: number) {
  const a = ((i / N) * 360 - 90) * (Math.PI / 180);
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
}

export function Web() {
  const rings = RING.map((r) => Array.from({ length: N }, (_, i) => pt(i, r)).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("") + "Z");
  return (
    <g>
      <GroundShadow rx={50} />
      <path d={Array.from({ length: N }, (_, i) => { const [x, y] = pt(i, 90); return `M${CX} ${CY} L${x.toFixed(1)} ${y.toFixed(1)}`; }).join("")} stroke={"#8E9BB0"} strokeWidth="4" strokeLinecap="round" fill="none" />
      {rings.map((d, i) => (
        <path key={i} d={d} stroke={"#8E9BB0"} strokeWidth="4" strokeLinejoin="round" fill="none" />
      ))}
      <circle cx="100" cy="14" r="5" fill={WATER.dark} />
      <circle cx="146" cy="40" r="5" fill={WATER.base} />
      <circle cx="54" cy="150" r="5" fill={WATER.base} />
      <path d="M156 100 V150" stroke={"#8E9BB0"} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M150 168 l-10 -8 M150 168 l-12 2 M150 172 l-10 8 M162 168 l10 -8 M162 168 l12 2 M162 172 l10 8" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="156" cy="172" r="15" fill={INK} />
      <circle cx="156" cy="156" r="10" fill={INK} />
      <circle cx="152" cy="154" r="3" fill="#fff" />
      <circle cx="160" cy="154" r="3" fill="#fff" />
      <circle cx="152.6" cy="154.6" r="1.4" fill={INK} />
      <circle cx="160.6" cy="154.6" r="1.4" fill={INK} />
    </g>
  );
}
