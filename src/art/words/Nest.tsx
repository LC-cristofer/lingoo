import { GroundShadow } from "../shared";
import { Gloss, WOOD } from "./parts";

export function Nest() {
  return (
    <g>
      <GroundShadow rx={78} />
      <ellipse cx="100" cy="150" rx="86" ry="48" fill={WOOD.deep} />
      <ellipse cx="68" cy="108" rx="26" ry="32" fill="#CDE9F2" transform="rotate(-12 68 108)" />
      <ellipse cx="104" cy="98" rx="26" ry="32" fill="#CDE9F2" />
      <ellipse cx="138" cy="110" rx="26" ry="32" fill="#CDE9F2" transform="rotate(12 138 110)" />
      <circle cx="60" cy="100" r="3.5" fill="#7FB6C9" />
      <circle cx="76" cy="118" r="3" fill="#7FB6C9" />
      <circle cx="100" cy="88" r="3.5" fill="#7FB6C9" />
      <circle cx="112" cy="110" r="3" fill="#7FB6C9" />
      <circle cx="132" cy="102" r="3.5" fill="#7FB6C9" />
      <circle cx="144" cy="122" r="3" fill="#7FB6C9" />
      <Gloss cx={56} cy={92} rx={7} ry={11} rot={-10} o={0.6} />
      <Gloss cx={92} cy={80} rx={7} ry={11} rot={0} o={0.6} />
      <Gloss cx={126} cy={92} rx={7} ry={11} rot={10} o={0.6} />
      <path d="M14 134 C14 176 56 198 100 198 C144 198 186 176 186 134 C160 150 126 156 100 156 C74 156 40 150 14 134Z" fill={WOOD.base} />
      <path d="M22 150 C44 178 150 178 178 150 C150 190 50 190 22 150Z" fill={WOOD.dark} />
      <path d="M26 142 q30 14 60 8 M92 154 q36 4 76 -14 M40 164 q40 14 90 6 M58 184 q36 6 76 -8" stroke={WOOD.light} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M30 156 q24 20 60 22 M110 180 q36 -2 62 -22" stroke={WOOD.deep} strokeWidth="4" strokeLinecap="round" fill="none" opacity=".7" />
    </g>
  );
}
