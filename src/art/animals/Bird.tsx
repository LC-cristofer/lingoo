import { Cheeks, Eyes, GroundShadow, SKY, SUN } from "../shared";

const FEATHER = SKY;
const FEATHER_DARK = "#2F8FDB";
const BELLY = "#D3ECFF";
const BEAK = SUN;
const BEAK_DARK = "#F2A71B";

/** A wing of three rounded feathers fanning out and down; drawn for the left, mirrored for the right. */
function Wing() {
  return (
    <g fill={FEATHER_DARK}>
      <ellipse cx="40" cy="140" rx="14" ry="28" transform="rotate(22 40 140)" />
      <ellipse cx="34" cy="148" rx="11" ry="25" transform="rotate(40 34 148)" />
      <ellipse cx="32" cy="154" rx="9" ry="20" transform="rotate(58 32 154)" />
    </g>
  );
}

export function Bird() {
  return (
    <g>
      <GroundShadow rx={52} />
      {/* feet */}
      <path
        d="M84 182 v12 M84 194 l-8 5 M84 194 v7 M84 194 l8 5 M116 182 v12 M116 194 l-8 5 M116 194 v7 M116 194 l8 5"
        fill="none"
        stroke={BEAK_DARK}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* crest */}
      <path d="M100 54 C92 40 94 26 104 20 C106 32 106 44 100 54Z" fill={FEATHER_DARK} />
      <path d="M100 54 C104 42 114 36 124 36 C118 46 110 52 100 54Z" fill={FEATHER_DARK} />
      {/* round body-head */}
      <ellipse cx="100" cy="120" rx="68" ry="70" fill={FEATHER} />
      <ellipse cx="100" cy="158" rx="38" ry="28" fill={BELLY} />
      <Wing />
      <g transform="translate(200 0) scale(-1 1)">
        <Wing />
      </g>
      <Eyes dx={26} cy={98} r={12} delay="0.6s" />
      <Cheeks dx={42} cy={116} rx={11} cool />
      {/* beak: a rounded triangle pointing down, darker underneath */}
      <path d="M84 110 Q100 102 116 110 Q110 122 100 130 Q90 122 84 110Z" fill={BEAK} stroke={BEAK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M91 121 Q100 125 109 121 Q105 127 100 130 Q95 127 91 121Z" fill={BEAK_DARK} stroke={BEAK_DARK} strokeWidth="3" strokeLinejoin="round" />
    </g>
  );
}
