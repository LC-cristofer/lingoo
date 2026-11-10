import { Cheeks, Eyes, GroundShadow, MOUTH, PINK } from "../shared";

const BODY = "#9467D8";
const LEGS = "#7648C4";
const BELLY = "#C9B0F2";
const TOES = "#D9C6F7";

// Four short, bent legs per side (the right side is the mirror image): knee up, toe down,
// each ending in a soft round toe. Big eyes and an open smile; no fangs.
const LEFT_LEGS = [
  { d: "M52 100 Q24 70 12 98", toe: [12, 98] },
  { d: "M44 122 Q12 102 6 130", toe: [6, 130] },
  { d: "M46 144 Q14 132 12 162", toe: [12, 162] },
  { d: "M58 166 Q30 164 28 192", toe: [28, 192] },
] as const;

function Legs() {
  return (
    <>
      {LEFT_LEGS.map(({ d, toe }) => (
        <g key={d}>
          <path d={d} fill="none" stroke={LEGS} strokeWidth="11" strokeLinecap="round" />
          <circle cx={toe[0]} cy={toe[1]} r="6.5" fill={TOES} />
        </g>
      ))}
    </>
  );
}

export function Spider() {
  return (
    <g>
      <GroundShadow rx={84} />
      {/* drawn 10% larger than its coordinates, standing on the ground line, so it weighs as
          much as the bear on a card */}
      <g transform="translate(100 200) scale(1.1) translate(-100 -200)">
        <Legs />
        <g transform="translate(200 0) scale(-1 1)">
          <Legs />
        </g>
        <circle cx="100" cy="124" r="64" fill={BODY} />
        <ellipse cx="100" cy="168" rx="30" ry="16" fill={BELLY} />
        <Eyes dx={24} cy={110} r={17} delay="3s" />
        <path d="M86 136 q14 20 28 0 z" fill={MOUTH} />
        <path d="M93 144 q7 6 14 0 q-7 -5 -14 0z" fill={PINK} />
        <Cheeks dx={46} cy={134} rx={12} ry={8} cool />
      </g>
    </g>
  );
}
