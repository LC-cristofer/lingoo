import { GroundShadow, Sparkle } from "../shared";
import { Gloss, SUN_BASE, SUN_DARK } from "./parts";

// Crescent: the big circle minus a second circle, between their two crossing points.
const C1 = { x: 92, y: 108, r: 82 };
const C2 = { x: 138, y: 90, r: 66 };
const d = Math.hypot(C2.x - C1.x, C2.y - C1.y);
const a = (C1.r ** 2 - C2.r ** 2 + d ** 2) / (2 * d);
const h = Math.sqrt(C1.r ** 2 - a ** 2);
const mx = C1.x + (a * (C2.x - C1.x)) / d;
const my = C1.y + (a * (C2.y - C1.y)) / d;
const P1 = { x: mx + (h * (C2.y - C1.y)) / d, y: my - (h * (C2.x - C1.x)) / d };
const P2 = { x: mx - (h * (C2.y - C1.y)) / d, y: my + (h * (C2.x - C1.x)) / d };
const f = (n: number) => n.toFixed(1);
const CRESCENT = `M${f(P1.x)} ${f(P1.y)} A${C1.r} ${C1.r} 0 1 0 ${f(P2.x)} ${f(P2.y)} A${C2.r} ${C2.r} 0 0 1 ${f(P1.x)} ${f(P1.y)}Z`;

export function Moon() {
  return (
    <g>
      <GroundShadow rx={44} />
      <g transform="translate(5 6)">
        <path d={CRESCENT} fill={SUN_DARK} />
      </g>
      <path d={CRESCENT} fill={SUN_BASE} />
      <path d="M46 122 q10 8 20 0" stroke="#2B2D42" strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="52" cy="140" rx="10" ry="6" fill="#FF7A6B" opacity=".35" />
      <circle cx="36" cy="82" r="9" fill={SUN_DARK} opacity=".5" />
      <circle cx="58" cy="168" r="7" fill={SUN_DARK} opacity=".5" />
      <Gloss cx={44} cy={80} rx={14} ry={6} rot={-60} o={0.5} />
      <Sparkle x={170} y={44} r={16} />
      <Sparkle x={150} y={150} r={11} />
      <Sparkle x={184} y={110} r={8} />
    </g>
  );
}
