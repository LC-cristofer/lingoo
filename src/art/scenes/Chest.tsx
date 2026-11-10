import { GroundShadow, INK, SUN, Sparkle } from "../shared";

// The challenge's treasure chest: wood with gold bands and a gold lock. When open, the lid swings
// up on its left hinge (a CSS transition, see art.css) and light pours out.

const WOOD = "#B9773F";
const WOOD_LIGHT = "#C98549";
const WOOD_DARK = "#9A5F2E";
const INSIDE = "#5A3820";
const GOLD = SUN;
const GOLD_DARK = "#F2A71B";

const HINGE = "40px 112px";
const OPEN_LID = "translate(0px, -8px) rotate(-28deg)";

const RAYS = [-146, -123, -101, -79, -57, -34];

function Rays() {
  return (
    <g className="art-chest-rays" aria-hidden="true">
      {RAYS.map((deg) => {
        const a = (deg * Math.PI) / 180;
        const w = 0.13;
        const p = (r: number, t: number) => `${(120 + r * Math.cos(t)).toFixed(1)} ${(112 + r * Math.sin(t)).toFixed(1)}`;
        return <path key={deg} d={`M${p(20, a)} L${p(118, a - w)} L${p(118, a + w)} Z`} fill={SUN} opacity=".45" />;
      })}
      <ellipse cx="120" cy="108" rx="70" ry="18" fill="#FFE27A" opacity=".7" />
      <Sparkle x={58} y={40} r={11} />
      <Sparkle x={190} y={34} r={14} />
      <Sparkle x={128} y={14} r={9} />
    </g>
  );
}

export function Chest({ open, size = 220 }: { open: boolean; size?: number }) {
  return (
    <svg
      viewBox="0 -40 240 260"
      width={size}
      height={Math.round((size * 260) / 240)}
      role="img"
      aria-label="Baú do tesouro"
      data-open={open ? "true" : "false"}
      className="art-chest"
    >
      <GroundShadow cx={120} cy={200} rx={92} ry={8} />
      {/* Inside of the chest, seen when the lid is up. */}
      <rect x="44" y="106" width="152" height="16" rx="6" fill={INSIDE} />
      {open ? <Rays /> : null}
      {open ? (
        // Gold coins heaped up to the rim.
        <g aria-hidden="true">
          {[
            [78, 110, 11],
            [100, 104, 12],
            [124, 106, 13],
            [148, 103, 12],
            [168, 110, 11],
            [112, 96, 10],
            [138, 95, 10],
          ].map(([cx, cy, r]) => (
            <g key={`${cx}-${cy}`}>
              <circle cx={cx} cy={cy} r={r} fill={GOLD_DARK} />
              <circle cx={cx - 1.5} cy={cy - 1.5} r={r - 3} fill={GOLD} />
            </g>
          ))}
        </g>
      ) : null}
      {/* Body */}
      <rect x="40" y="112" width="160" height="86" rx="14" fill={WOOD} />
      <rect x="40" y="150" width="160" height="6" fill={WOOD_DARK} />
      <rect x="40" y="176" width="160" height="6" fill={WOOD_DARK} />
      <path d="M40 170 H200 V184 Q200 198 186 198 H54 Q40 198 40 184 Z" fill="#000" opacity=".06" />
      <rect x="62" y="112" width="16" height="86" fill={GOLD} />
      <rect x="162" y="112" width="16" height="86" fill={GOLD} />
      <rect x="62" y="112" width="16" height="8" fill={GOLD_DARK} />
      <rect x="162" y="112" width="16" height="8" fill={GOLD_DARK} />
      {/* Lock */}
      <rect x="102" y="116" width="36" height="40" rx="8" fill={GOLD} />
      <rect x="102" y="146" width="36" height="10" rx="5" fill={GOLD_DARK} />
      <circle cx="120" cy="131" r="5.5" fill={INK} />
      <path d="M120 134 v10" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      {/* Lid: hinged on the left; the transform is inline so the drawing is right without CSS. */}
      <g className="art-chest-lid" style={{ transformOrigin: HINGE, transform: open ? OPEN_LID : "rotate(0deg)" }}>
        <path d="M36 114 V92 Q36 62 120 62 Q204 62 204 92 V114 Z" fill={WOOD_LIGHT} />
        <path d="M36 92 Q36 62 120 62 Q160 62 182 70 Q120 66 80 76 Q46 84 36 100 Z" fill="#fff" opacity=".12" />
        <rect x="34" y="104" width="172" height="12" rx="6" fill={WOOD_DARK} />
        <path d="M62 66 Q66 64 78 63 V116 H62 Z" fill={GOLD} />
        <path d="M162 63 Q174 64 178 66 V116 H162 Z" fill={GOLD} />
        <path d="M106 104 h28 v8 q0 6 -6 6 h-16 q-6 0 -6 -6 z" fill={GOLD_DARK} />
      </g>
    </svg>
  );
}
