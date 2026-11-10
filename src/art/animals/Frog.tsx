import { Cheeks, Eyes, GroundShadow, INK, LEAF } from "../shared";

const SKIN = LEAF;
const SKIN_DARK = "#43AD57";
const BELLY = "#E4F6CF";

export function Frog() {
  return (
    <g>
      <GroundShadow rx={70} />
      {/* folded back legs and big feet */}
      <ellipse cx="46" cy="174" rx="30" ry="24" fill={SKIN_DARK} />
      <ellipse cx="154" cy="174" rx="30" ry="24" fill={SKIN_DARK} />
      <circle cx="34" cy="166" r="5" fill={SKIN} />
      <circle cx="44" cy="156" r="3.5" fill={SKIN} />
      <circle cx="166" cy="166" r="5" fill={SKIN} />
      <circle cx="156" cy="156" r="3.5" fill={SKIN} />
      <ellipse cx="38" cy="197" rx="24" ry="9" fill={SKIN_DARK} />
      <ellipse cx="162" cy="197" rx="24" ry="9" fill={SKIN_DARK} />
      {/* body and belly */}
      <ellipse cx="100" cy="160" rx="52" ry="42" fill={SKIN} />
      <ellipse cx="100" cy="168" rx="32" ry="28" fill={BELLY} />
      {/* front feet */}
      <ellipse cx="76" cy="196" rx="15" ry="9" fill={SKIN} />
      <ellipse cx="124" cy="196" rx="15" ry="9" fill={SKIN} />
      {/* head with the two eye bumps on top */}
      <circle cx="62" cy="62" r="30" fill={SKIN} />
      <circle cx="138" cy="62" r="30" fill={SKIN} />
      <ellipse cx="100" cy="102" rx="78" ry="50" fill={SKIN} />
      <Eyes dx={38} cy={62} r={14} delay="1.2s" />
      <circle cx="93" cy="100" r="2.6" fill={INK} opacity=".55" />
      <circle cx="107" cy="100" r="2.6" fill={INK} opacity=".55" />
      <path d="M66 112 Q100 140 134 112" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <Cheeks dx={58} cy={112} rx={12} cool />
    </g>
  );
}
