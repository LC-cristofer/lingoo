import { Cheeks, Eyes, GroundShadow, INK } from "../shared";

const FUR = "#AEB3BF";
const FUR_DARK = "#9AA0AD";
const LIGHT = "#E8EAEF";
const EAR_PINK = "#FFA3B5";
const NOSE = "#FF7A93";
const WHISKER = "#7D8391";

export function Mouse() {
  return (
    <g>
      <GroundShadow rx={56} />
      {/* long tail curling behind */}
      <path d="M134 188 C172 194 192 168 178 150 C170 140 156 148 162 158" fill="none" stroke={EAR_PINK} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="100" cy="164" rx="46" ry="38" fill={FUR_DARK} />
      <ellipse cx="100" cy="172" rx="28" ry="26" fill={LIGHT} />
      <ellipse cx="76" cy="198" rx="16" ry="8" fill={EAR_PINK} />
      <ellipse cx="124" cy="198" rx="16" ry="8" fill={EAR_PINK} />
      {/* big round ears */}
      <circle cx="44" cy="54" r="38" fill={FUR_DARK} />
      <circle cx="44" cy="54" r="26" fill={EAR_PINK} />
      <circle cx="156" cy="54" r="38" fill={FUR_DARK} />
      <circle cx="156" cy="54" r="26" fill={EAR_PINK} />
      <ellipse cx="100" cy="102" rx="64" ry="54" fill={FUR} />
      <ellipse cx="100" cy="126" rx="28" ry="20" fill={LIGHT} />
      <Eyes dx={26} cy={94} r={11} delay="1.8s" />
      <ellipse cx="100" cy="114" rx="8" ry="6" fill={NOSE} />
      <circle cx="97" cy="112" r="2.2" fill="#fff" opacity=".7" />
      <path d="M100 120 q-6 8 -12 3 M100 120 q6 8 12 3 M100 117 v3" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M70 122 l-26 -6 M70 130 l-26 2 M130 122 l26 -6 M130 130 l26 2" fill="none" stroke={WHISKER} strokeWidth="3" strokeLinecap="round" />
      <Cheeks dx={42} cy={112} rx={10} cool />
    </g>
  );
}
