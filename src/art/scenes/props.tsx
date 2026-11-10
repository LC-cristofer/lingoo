import { SUN, WHITE } from "../shared";

// Scene props for the story pages: flat fills, no outlines, like the rest of the forest.

const WATER = "#6CC3F5";
const WATER_LIGHT = "#A8DEFF";
const BANK = "#4DBA6C";
const PAD = "#3DB56B";
const PAD_DARK = "#2F9E5B";
const REED = "#3B9F57";
const CATTAIL = "#8B5A3C";

/** A round pond seen from the front, with lily pads and reeds. Drawn in 400 × 150. */
export function Pond() {
  return (
    <svg viewBox="0 0 400 150" width="100%" style={{ display: "block" }}>
      <ellipse cx="200" cy="84" rx="196" ry="62" fill={BANK} />
      <ellipse cx="200" cy="80" rx="182" ry="52" fill={WATER} />
      <ellipse cx="200" cy="92" rx="150" ry="36" fill="#000" opacity=".06" />
      <path d="M96 66 q30 -8 60 0" stroke={WATER_LIGHT} strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M230 104 q24 -6 48 0" stroke={WATER_LIGHT} strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M262 60 q16 -5 32 0" stroke={WATER_LIGHT} strokeWidth="5" strokeLinecap="round" fill="none" />
      {[
        [150, 96, 1],
        [312, 82, 0.8],
      ].map(([x, y, s]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
          <ellipse rx="30" ry="11" fill={PAD_DARK} />
          <path d="M0 0 L-30 -1 A30 11 0 1 1 -16 -9.4 Z" fill={PAD} />
        </g>
      ))}
      <g transform="translate(176 92)">
        <circle cx="0" cy="-4" r="5" fill={WHITE} />
        <circle cx="0" cy="-4" r="2.2" fill={SUN} />
      </g>
      {[
        [24, 84, 46],
        [38, 88, 34],
        [368, 84, 52],
        [382, 88, 38],
      ].map(([x, y, h]) => (
        <g key={x}>
          <path d={`M${x} ${y} v${-h}`} stroke={REED} strokeWidth="5" strokeLinecap="round" />
          <rect x={x - 5} y={y - h - 4} width="10" height="22" rx="5" fill={CATTAIL} />
        </g>
      ))}
    </svg>
  );
}

const SPOKES = 8;
const RINGS = [22, 44, 66, 88];

function ring(r: number) {
  let d = `M${point(r, 0)}`;
  for (let i = 0; i < SPOKES; i++) d += ` Q${point(r * 0.84, i + 0.5)} ${point(r, i + 1)}`;
  return d;
}

function point(r: number, i: number) {
  const a = (i / SPOKES) * Math.PI * 2 - Math.PI / 2;
  return `${(100 + r * Math.cos(a)).toFixed(1)} ${(110 + r * Math.sin(a)).toFixed(1)}`;
}

/** Web drawing: 200 wide; the web is centred on (100, 110) and its thread climbs to y = -260. */
export const WEB_VIEW = { top: -260, height: 480, centre: 110 };

/** A spider web hanging from a long thread that runs off the top of the scene. */
export function Web() {
  return (
    <svg viewBox={`0 ${WEB_VIEW.top} 200 ${WEB_VIEW.height}`} width="100%" style={{ display: "block" }}>
      <g stroke={WHITE} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".9">
        <path d={`M100 ${WEB_VIEW.top} V22`} strokeWidth="3" />
        {Array.from({ length: SPOKES }, (_, i) => (
          <path key={i} d={`M100 110 L${point(96, i)}`} strokeWidth="3" />
        ))}
        {RINGS.map((r) => (
          <path key={r} d={ring(r)} strokeWidth="2.5" opacity=".85" />
        ))}
      </g>
    </svg>
  );
}

const CHEESE = "#FFC93C";
const CHEESE_DARK = "#F2A71B";
const HOLE = "#E8961A";

/** A wedge of cheese with holes. Drawn in 120 × 90, resting on y = 82. */
export function Cheese() {
  return (
    <svg viewBox="0 0 120 90" width="100%" style={{ display: "block" }}>
      <ellipse cx="60" cy="84" rx="52" ry="6" fill="rgba(43,45,66,.12)" />
      <path d="M10 46 L104 22 Q112 22 112 30 V76 Q112 82 106 82 H16 Q10 82 10 76 Z" fill={CHEESE} />
      <path d="M10 46 L104 22 Q112 22 112 30 V38 L10 52 Z" fill={CHEESE_DARK} />
      <circle cx="40" cy="64" r="8" fill={HOLE} />
      <circle cx="74" cy="58" r="5" fill={HOLE} />
      <circle cx="92" cy="72" r="4" fill={HOLE} />
      <circle cx="24" cy="76" r="3.5" fill={HOLE} />
      <circle cx="62" cy="76" r="3" fill={HOLE} />
    </svg>
  );
}

const BARK = "#8B5A3C";
const BARK_DARK = "#7A4D32";
const LEAVES = "#4DBA6C";
const LEAVES_LIGHT = "#5CC46B";

/**
 * A branch reaching in from the right edge, for a bird to perch on. Drawn in 400 × 120; the
 * perch (the top of the branch, where the feet go) is at (60, 64).
 */
export function Branch() {
  return (
    <svg viewBox="0 0 400 120" width="100%" style={{ display: "block" }}>
      <path d="M400 52 Q220 56 40 64 Q30 66 34 72 Q40 78 60 77 Q230 78 400 92 Z" fill={BARK} />
      <path d="M400 80 Q230 72 60 77 Q230 82 400 92 Z" fill={BARK_DARK} />
      <path d="M210 60 Q236 36 262 26" stroke={BARK} strokeWidth="9" strokeLinecap="round" fill="none" />
      <circle cx="268" cy="22" r="20" fill={LEAVES} />
      <circle cx="292" cy="30" r="17" fill={LEAVES_LIGHT} />
      <circle cx="150" cy="58" r="15" fill={LEAVES} />
      <circle cx="166" cy="52" r="12" fill={LEAVES_LIGHT} />
      <circle cx="356" cy="46" r="24" fill={LEAVES} />
      <circle cx="380" cy="56" r="20" fill={LEAVES_LIGHT} />
      <circle cx="280" cy="14" r="6" fill={WHITE} opacity=".18" />
    </svg>
  );
}
