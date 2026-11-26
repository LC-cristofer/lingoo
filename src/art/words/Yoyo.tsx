import { GroundShadow } from "../shared";
import { CORAL, CORAL_DARK, Gloss, SUN_BASE, TRUNK } from "./parts";

// A yoyo seen from the side: two fat discs on a short axle, the string wound between them and up to a finger loop.
// (From the front it looked like a dartboard.)
export function Yoyo() {
  return (
    <g>
      <GroundShadow rx={56} />
      <path d="M100 40 V96" stroke={TRUNK.dark} strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="100" cy="26" r="15" fill="none" stroke={TRUNK.dark} strokeWidth="5" />
      <ellipse cx="68" cy="146" rx="22" ry="52" fill={CORAL_DARK} />
      <ellipse cx="132" cy="146" rx="22" ry="52" fill={CORAL_DARK} />
      <rect x="66" y="118" width="68" height="56" rx="8" fill={SUN_BASE} />
      <rect x="66" y="118" width="68" height="14" rx="7" fill="#fff" opacity=".28" />
      <path d="M72 128 H128 M72 138 H128 M72 148 H128 M72 158 H128 M72 168 H128" stroke={TRUNK.base} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".55" />
      <ellipse cx="64" cy="142" rx="22" ry="52" fill={CORAL} />
      <ellipse cx="136" cy="142" rx="22" ry="52" fill={CORAL} />
      <ellipse cx="64" cy="142" rx="10" ry="30" fill={SUN_BASE} />
      <ellipse cx="136" cy="142" rx="10" ry="30" fill={SUN_BASE} />
      <Gloss cx={56} cy={108} rx={9} ry={4} rot={-70} o={0.55} />
      <Gloss cx={128} cy={108} rx={9} ry={4} rot={-70} o={0.55} />
    </g>
  );
}
