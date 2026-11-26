import { GroundShadow } from "../shared";
import { CREAM, Gloss, STONE, SUN_BASE } from "./parts";

const BODY = "#2EB8A4";
const BODY_DARK = "#249A8A";
const GLASS = "#CDEFF8";

function Wheel({ cx }: { cx: number }) {
  return (
    <g>
      <circle cx={cx} cy="176" r="21" fill="#3A2618" />
      <circle cx={cx} cy="176" r="10" fill={STONE.base} />
      <circle cx={cx} cy="176" r="4" fill={STONE.dark} />
    </g>
  );
}

export function Van() {
  return (
    <g>
      <GroundShadow rx={88} />
      <path d="M8 170 V84 Q8 62 30 62 H122 Q136 62 146 78 L184 118 Q194 126 194 142 V170 Q194 184 180 184 H20 Q8 184 8 170Z" fill={BODY_DARK} />
      <path d="M8 164 V80 Q8 58 30 58 H120 Q134 58 144 74 L182 114 Q192 122 192 138 V160 Q192 176 178 176 H22 Q8 176 8 164Z" fill={BODY} />
      <path d="M10 126 H192 V142 H10Z" fill={SUN_BASE} />
      <path d="M26 74 H68 V112 H26Z M80 74 H122 V112 H80Z" fill={GLASS} />
      <path d="M134 76 L136 112 H170 L142 82 Q140 76 134 76Z" fill={GLASS} />
      <path d="M26 74 H68 V84 H26Z" fill="#fff" opacity=".5" />
      <rect x="182" y="144" width="12" height="14" rx="6" fill={CREAM} />
      <Wheel cx={52} />
      <Wheel cx={150} />
      <Gloss cx={34} cy={66} rx={16} ry={4} rot={0} o={0.5} />
    </g>
  );
}
