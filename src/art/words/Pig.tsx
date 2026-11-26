import { Cheeks, Eyes, GroundShadow, PINK } from "../shared";

const SKIN = "#FFA3B4";
const SKIN_DARK = "#F2859A";
const SNOUT = "#FF8FA3";

export function Pig() {
  return (
    <g>
      <GroundShadow rx={62} />
      <path d="M148 168 q24 -2 22 -18 q-2 -14 -16 -8 q-10 6 2 12" stroke={SKIN_DARK} strokeWidth="7" strokeLinecap="round" fill="none" />
      <ellipse cx="100" cy="160" rx="52" ry="42" fill={SKIN_DARK} />
      <ellipse cx="100" cy="168" rx="30" ry="28" fill="#FFD0D9" />
      <ellipse cx="72" cy="197" rx="19" ry="9" fill={SKIN_DARK} />
      <ellipse cx="128" cy="197" rx="19" ry="9" fill={SKIN_DARK} />
      <path d="M38 70 L34 22 Q36 16 44 20 L84 44Z" fill={SKIN_DARK} />
      <path d="M162 70 L166 22 Q164 16 156 20 L116 44Z" fill={SKIN_DARK} />
      <path d="M46 62 L44 36 L68 50Z" fill={PINK} />
      <path d="M154 62 L156 36 L132 50Z" fill={PINK} />
      <ellipse cx="100" cy="88" rx="66" ry="56" fill={SKIN} />
      <ellipse cx="100" cy="106" rx="30" ry="22" fill={SNOUT} />
      <ellipse cx="90" cy="106" rx="5" ry="8" fill="#C95A72" />
      <ellipse cx="110" cy="106" rx="5" ry="8" fill="#C95A72" />
      <Eyes dx={34} cy={76} r={9} />
      <Cheeks dx={52} cy={100} rx={9} ry={6} />
    </g>
  );
}
