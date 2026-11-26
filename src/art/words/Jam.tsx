import { GroundShadow } from "../shared";
import { CORAL, CORAL_DARK, CREAM, Gloss } from "./parts";

const JAM = "#C8365A";
const JAM_DARK = "#A52A4A";
const GLASS = "#DDF2F8";

export function Jam() {
  return (
    <g>
      <GroundShadow rx={64} />
      <rect x="30" y="58" width="140" height="142" rx="38" fill="#B9DCE8" />
      <rect x="26" y="54" width="140" height="142" rx="38" fill={GLASS} />
      <rect x="34" y="84" width="124" height="104" rx="30" fill={JAM_DARK} />
      <rect x="32" y="82" width="124" height="104" rx="30" fill={JAM} />
      <rect x="46" y="112" width="100" height="56" rx="20" fill={CREAM} />
      <circle cx="96" cy="140" r="15" fill={CORAL} />
      <circle cx="96" cy="140" r="7" fill={CORAL_DARK} />
      <rect x="34" y="28" width="132" height="34" rx="14" fill={CORAL_DARK} />
      <rect x="30" y="24" width="132" height="34" rx="14" fill={CORAL} />
      <path d="M36 62 q10 14 20 0 q10 14 20 0 q10 14 20 0 q10 14 20 0 q10 14 20 0 v-6 h-80Z" fill={CREAM} opacity=".95" />
      <Gloss cx={44} cy={104} rx={9} ry={20} rot={0} o={0.5} />
    </g>
  );
}
