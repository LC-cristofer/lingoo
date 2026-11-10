import { Cheeks, Eyes, GroundShadow, INK, PINK, SUN } from "../shared";

const SKIN = "#3DB57F";

// The body is one thick round stroke lying in a wave on the ground; the yellow spots are a
// dotted stroke along the same path. The tail is a filled shape that tapers to a round tip and
// curls up; it starts exactly where the 32-wide body stroke ends, at (170, 184).
const BODY = "M78 112 C80 150 52 184 90 186 C124 188 122 152 146 152 C162 152 158 184 170 184";
const TAIL = "M168 168 C182 170 190 166 193 157 Q196 151 199 157 C202 178 188 200 168 200 Z";

export function Snake() {
  return (
    <g>
      <GroundShadow cx={120} rx={80} />
      <path d={TAIL} fill={SKIN} />
      <path d={BODY} fill="none" stroke={SKIN} strokeWidth="32" strokeLinecap="round" />
      <path d={BODY} fill="none" stroke={SUN} strokeWidth="10" strokeLinecap="round" strokeDasharray="0.1 24" strokeDashoffset="-30" />
      {/* head */}
      <ellipse cx="78" cy="86" rx="56" ry="46" fill={SKIN} />
      <circle cx="62" cy="50" r="5" fill={SUN} />
      <circle cx="80" cy="45" r="6.5" fill={SUN} />
      <circle cx="98" cy="50" r="4.5" fill={SUN} />
      <g transform="translate(-22 0)">
        <Eyes dx={23} cy={82} r={12} delay="2.4s" />
        <circle cx="94" cy="101" r="2.4" fill={INK} opacity=".5" />
        <circle cx="106" cy="101" r="2.4" fill={INK} opacity=".5" />
        {/* a little forked tongue, peeking out of the smile */}
        <path d="M97.5 114 h5 v7 l4.5 6 l-4 0.5 l-3 -4.5 l-3 4.5 l-4 -0.5 l4.5 -6z" fill={PINK} stroke={PINK} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M80 108 Q100 124 120 108" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
        <Cheeks dx={40} cy={104} rx={11} cool />
      </g>
    </g>
  );
}
