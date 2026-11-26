import { Cheeks, Eyes, GroundShadow } from "../shared";

const FUR = "#AEB9CE";
const FUR_DARK = "#929EB8";
const BELLY = "#F2EEE6";
const PINK_EAR = "#FF8FA3";
const NOSE = "#FF8FA3";

export function Cat() {
  return (
    <g>
      <GroundShadow rx={58} />
      <path d="M140 176 Q190 170 184 120 Q182 100 168 104" stroke={FUR_DARK} strokeWidth="18" strokeLinecap="round" fill="none" />
      <ellipse cx="100" cy="156" rx="48" ry="42" fill={FUR_DARK} />
      <ellipse cx="100" cy="162" rx="28" ry="28" fill={BELLY} />
      <ellipse cx="76" cy="197" rx="19" ry="9" fill={FUR_DARK} />
      <ellipse cx="124" cy="197" rx="19" ry="9" fill={FUR_DARK} />
      <path d="M34 62 L42 12 Q44 8 50 12 L84 34Z" fill={FUR_DARK} />
      <path d="M166 62 L158 12 Q156 8 150 12 L116 34Z" fill={FUR_DARK} />
      <path d="M46 52 L50 26 L72 40Z" fill={PINK_EAR} />
      <path d="M154 52 L150 26 L128 40Z" fill={PINK_EAR} />
      <ellipse cx="100" cy="86" rx="68" ry="56" fill={FUR} />
      <path d="M92 38 v14 M100 36 v16 M108 38 v14" stroke={FUR_DARK} strokeWidth="5" strokeLinecap="round" fill="none" />
      <ellipse cx="100" cy="104" rx="26" ry="19" fill={BELLY} />
      <path d="M92 94 h16 q-8 10 -16 0Z" fill={NOSE} />
      <path d="M100 100 v6 M100 106 q-7 7 -13 1 M100 106 q7 7 13 1" stroke="#3A2A22" strokeWidth="3" strokeLinecap="round" fill="none" />
      <Eyes dx={30} cy={80} r={9} />
      <Cheeks dx={46} cy={102} rx={9} ry={6} cool />
      <path d="M52 100 h-30 M54 108 l-28 6 M148 100 h30 M146 108 l28 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".9" />
    </g>
  );
}
