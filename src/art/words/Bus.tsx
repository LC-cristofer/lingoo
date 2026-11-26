import { GroundShadow } from "../shared";
import { Gloss, STONE, SUN_BASE, SUN_DARK } from "./parts";

const GLASS = "#CDEFF8";

function Wheel({ cx }: { cx: number }) {
  return (
    <g>
      <circle cx={cx} cy="170" r="22" fill="#3A2618" />
      <circle cx={cx} cy="170" r="10" fill={STONE.base} />
      <circle cx={cx} cy="170" r="4" fill={STONE.dark} />
    </g>
  );
}

export function Bus() {
  return (
    <g>
      <GroundShadow rx={92} />
      <rect x="6" y="52" width="188" height="134" rx="26" fill={SUN_DARK} />
      <rect x="6" y="46" width="188" height="130" rx="26" fill={SUN_BASE} />
      <rect x="6" y="126" width="188" height="12" fill="#3A2618" opacity=".7" />
      {[18, 56, 94, 132].map((x) => (
        <rect key={x} x={x} y="62" width="30" height="40" rx="9" fill={GLASS} />
      ))}
      <path d="M164 62 H180 Q186 62 186 68 V112 H164Z" fill={GLASS} />
      <rect x="18" y="62" width="30" height="12" rx="6" fill="#fff" opacity=".5" />
      <circle cx="182" cy="152" r="7" fill="#FFF8EC" />
      <rect x="170" y="116" width="20" height="8" rx="4" fill={SUN_DARK} />
      <Wheel cx={46} />
      <Wheel cx={148} />
      <Gloss cx={30} cy={52} rx={16} ry={3.5} rot={0} o={0.5} />
    </g>
  );
}
