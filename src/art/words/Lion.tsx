import { Cheeks, Eyes, GroundShadow } from "../shared";

const MANE = "#C9822E";
const MANE_DARK = "#B06D22";
const FUR = "#F2C26B";
const FUR_DARK = "#E0AA4E";
const MUZZLE = "#FBE7BD";

export function Lion() {
  return (
    <g>
      <GroundShadow rx={60} />
      <ellipse cx="100" cy="160" rx="48" ry="42" fill={FUR_DARK} />
      <ellipse cx="100" cy="168" rx="28" ry="28" fill={MUZZLE} />
      <ellipse cx="74" cy="197" rx="19" ry="9" fill={FUR_DARK} />
      <ellipse cx="126" cy="197" rx="19" ry="9" fill={FUR_DARK} />
      <path d="M148 176 Q186 170 180 138" stroke={FUR_DARK} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="178" cy="132" r="13" fill={MANE_DARK} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
        const a = (i / 10) * Math.PI * 2;
        return <circle key={i} cx={100 + 62 * Math.cos(a)} cy={90 + 58 * Math.sin(a)} r="26" fill={i % 2 ? MANE : MANE_DARK} />;
      })}
      <ellipse cx="100" cy="90" rx="62" ry="56" fill={MANE} />
      <circle cx="54" cy="52" r="15" fill={FUR_DARK} />
      <circle cx="146" cy="52" r="15" fill={FUR_DARK} />
      <circle cx="54" cy="52" r="8" fill={MUZZLE} />
      <circle cx="146" cy="52" r="8" fill={MUZZLE} />
      <ellipse cx="100" cy="94" rx="48" ry="44" fill={FUR} />
      <ellipse cx="100" cy="110" rx="28" ry="21" fill={MUZZLE} />
      <path d="M90 98 h20 q-10 12 -20 0Z" fill="#7A4A26" />
      <path d="M100 106 v6 M100 112 q-7 7 -13 1 M100 112 q7 7 13 1" stroke="#3A2A22" strokeWidth="3" strokeLinecap="round" fill="none" />
      <Eyes dx={22} cy={82} r={8.5} />
      <Cheeks dx={36} cy={104} rx={8} ry={5} />
    </g>
  );
}
