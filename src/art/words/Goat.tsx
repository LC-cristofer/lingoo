import { Cheeks, Eyes, GroundShadow } from "../shared";

const WOLL = { base: "#F6E7CF", dark: "#E0CBA6", light: "#FFF8EC" };
const HORN = { dark: "#C99E66" };
const HOOF = "#7A4A26";

export function Goat() {
  return (
    <g>
      <GroundShadow rx={60} />
      <ellipse cx="100" cy="160" rx="50" ry="42" fill={WOLL.dark} />
      <ellipse cx="100" cy="166" rx="30" ry="28" fill={WOLL.light} />
      <ellipse cx="74" cy="196" rx="18" ry="9" fill={HOOF} />
      <ellipse cx="126" cy="196" rx="18" ry="9" fill={HOOF} />
      <path d="M60 28 Q40 0 28 8 Q34 36 54 52Z" fill={HORN.dark} />
      <path d="M140 28 Q160 0 172 8 Q166 36 146 52Z" fill={HORN.dark} />
      <ellipse cx="32" cy="76" rx="26" ry="12" fill={WOLL.dark} transform="rotate(24 32 76)" />
      <ellipse cx="168" cy="76" rx="26" ry="12" fill={WOLL.dark} transform="rotate(-24 168 76)" />
      <ellipse cx="100" cy="82" rx="54" ry="52" fill={WOLL.base} />
      <ellipse cx="100" cy="112" rx="32" ry="24" fill={WOLL.light} />
      <ellipse cx="90" cy="108" rx="4.5" ry="3.5" fill="#3A2A22" />
      <ellipse cx="110" cy="108" rx="4.5" ry="3.5" fill="#3A2A22" />
      <path d="M100 120 q-6 6 -12 2 M100 120 q6 6 12 2" stroke="#3A2A22" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M88 130 Q100 168 112 130 Q100 140 88 130Z" fill={WOLL.base} />
      <Eyes dx={26} cy={76} r={8} />
      <Cheeks dx={40} cy={98} rx={8} ry={5} />
    </g>
  );
}
