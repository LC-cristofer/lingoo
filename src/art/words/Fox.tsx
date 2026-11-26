import { Cheeks, Eyes, GroundShadow } from "../shared";

const FUR = "#E9792F";
const FUR_DARK = "#CC5F1E";
const WHITE = "#FFF3E0";

export function Fox() {
  return (
    <g>
      <GroundShadow rx={64} />
      <path d="M146 180 Q200 176 194 112 Q190 92 172 96 Q170 140 140 150Z" fill={FUR_DARK} />
      <path d="M194 112 Q190 92 172 96 Q168 108 170 120 Q190 124 194 112Z" fill={WHITE} />
      <ellipse cx="100" cy="160" rx="48" ry="42" fill={FUR_DARK} />
      <ellipse cx="100" cy="168" rx="28" ry="28" fill={WHITE} />
      <ellipse cx="74" cy="197" rx="19" ry="9" fill="#5A3A2A" />
      <ellipse cx="126" cy="197" rx="19" ry="9" fill="#5A3A2A" />
      <path d="M30 72 L36 10 Q38 6 44 10 L86 36Z" fill={FUR_DARK} />
      <path d="M170 72 L164 10 Q162 6 156 10 L114 36Z" fill={FUR_DARK} />
      <path d="M42 56 L44 28 L68 42Z" fill="#5A3A2A" />
      <path d="M158 56 L156 28 L132 42Z" fill="#5A3A2A" />
      <path d="M100 38 C150 38 176 60 170 96 C164 120 130 138 100 138 C70 138 36 120 30 96 C24 60 50 38 100 38Z" fill={FUR} />
      <path d="M30 96 C36 120 70 138 100 138 C130 138 164 120 170 96 C150 108 130 106 100 124 C70 106 50 108 30 96Z" fill={WHITE} />
      <ellipse cx="100" cy="108" rx="9" ry="7" fill="#3A2A22" />
      <circle cx="97" cy="105" r="2.5" fill="#fff" opacity=".7" />
      <path d="M100 114 v6 M100 120 q-7 7 -13 1 M100 120 q7 7 13 1" stroke="#3A2A22" strokeWidth="3" strokeLinecap="round" fill="none" />
      <Eyes dx={30} cy={84} r={8.5} />
      <Cheeks dx={48} cy={104} rx={8} ry={5} />
    </g>
  );
}
