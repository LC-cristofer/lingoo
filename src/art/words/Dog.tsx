import { Cheeks, Eyes, GroundShadow } from "../shared";
import { CORAL, WOOD } from "./parts";

const FUR = "#D9A066";
const FUR_DARK = "#BE8450";
const MUZZLE = "#FBEBD3";

export function Dog() {
  return (
    <g>
      <GroundShadow rx={60} />
      <ellipse cx="100" cy="160" rx="48" ry="42" fill={FUR_DARK} />
      <ellipse cx="100" cy="168" rx="28" ry="28" fill={MUZZLE} />
      <ellipse cx="74" cy="197" rx="19" ry="9" fill={FUR_DARK} />
      <ellipse cx="126" cy="197" rx="19" ry="9" fill={FUR_DARK} />
      <path d="M150 170 Q184 160 178 128" stroke={FUR_DARK} strokeWidth="14" strokeLinecap="round" fill="none" />
      <ellipse cx="42" cy="82" rx="22" ry="40" fill={WOOD.deep} transform="rotate(14 42 82)" />
      <ellipse cx="158" cy="82" rx="22" ry="40" fill={WOOD.deep} transform="rotate(-14 158 82)" />
      <ellipse cx="100" cy="86" rx="62" ry="54" fill={FUR} />
      <ellipse cx="100" cy="106" rx="34" ry="26" fill={MUZZLE} />
      <ellipse cx="100" cy="94" rx="14" ry="10" fill="#3A2A22" />
      <circle cx="96" cy="91" r="3" fill="#fff" opacity=".7" />
      <path d="M100 102 v7 M100 109 q-8 8 -15 2 M100 109 q8 8 15 2" stroke="#3A2A22" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M92 114 q8 18 16 0Z" fill={CORAL} />
      <Eyes dx={26} cy={76} r={9} />
      <Cheeks dx={44} cy={100} rx={9} ry={6} />
    </g>
  );
}
