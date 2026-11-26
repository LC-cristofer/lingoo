import { GroundShadow, INK } from "../shared";

// A whole zebra in profile, facing right: body, four legs, long neck, head with ears, mane and tail.
const COAT = "#FFFFFF";
const COAT_DARK = "#DCE2EA";
const NOSE = "#A8B0BF";

function Stripe({ x, y, rx, ry, rot }: { x: number; y: number; rx: number; ry: number; rot: number }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={INK} transform={`rotate(${rot} ${x} ${y})`} />;
}

export function Zebra() {
  return (
    <g>
      <GroundShadow rx={76} />
      {/* far legs */}
      <rect x="62" y="140" width="14" height="52" rx="6" fill={COAT_DARK} />
      <rect x="130" y="140" width="14" height="52" rx="6" fill={COAT_DARK} />
      {/* tail */}
      <path d="M32 112 Q16 124 20 154" stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none" />
      {/* body */}
      <ellipse cx="94" cy="124" rx="62" ry="36" fill={COAT_DARK} />
      <ellipse cx="92" cy="120" rx="60" ry="34" fill={COAT} />
      {/* near legs */}
      <rect x="44" y="140" width="15" height="54" rx="6" fill={COAT} />
      <rect x="116" y="140" width="15" height="54" rx="6" fill={COAT} />
      <rect x="44" y="184" width="15" height="10" rx="4" fill={INK} />
      <rect x="116" y="184" width="15" height="10" rx="4" fill={INK} />
      <rect x="62" y="184" width="14" height="10" rx="4" fill={INK} />
      <rect x="130" y="184" width="14" height="10" rx="4" fill={INK} />
      <Stripe x={52} y={158} rx={7} ry={3} rot={0} />
      <Stripe x={124} y={158} rx={7} ry={3} rot={0} />
      {/* neck */}
      <path d="M120 112 C128 80 134 60 146 46 L170 62 C164 84 164 104 156 130Z" fill={COAT} />
      {/* head */}
      <ellipse cx="164" cy="58" rx="22" ry="20" fill={COAT} transform="rotate(24 164 58)" />
      <ellipse cx="182" cy="74" rx="15" ry="12" fill={NOSE} transform="rotate(24 182 74)" />
      <circle cx="185" cy="72" r="2.6" fill={INK} />
      <circle cx="162" cy="54" r="5" fill={INK} />
      <circle cx="160.5" cy="52.5" r="1.8" fill="#fff" />
      {/* ears */}
      <path d="M142 46 L136 22 L156 38Z" fill={COAT_DARK} />
      <path d="M144 44 L140 28 L152 38Z" fill={INK} />
      <path d="M156 38 L164 18 L172 40Z" fill={COAT} />
      <path d="M160 38 L164 25 L168 40Z" fill={INK} />
      {/* mane */}
      <path d="M126 100 C132 76 138 58 148 40 L156 40 C150 62 146 82 140 104Z" fill={INK} />
      <path d="M150 36 C158 28 170 30 172 42 C164 38 158 40 150 36Z" fill={INK} />
      {/* stripes: body, neck, head */}
      <Stripe x={52} y={108} rx={5} ry={17} rot={-12} />
      <Stripe x={72} y={104} rx={5} ry={19} rot={-6} />
      <Stripe x={92} y={102} rx={5} ry={19} rot={0} />
      <Stripe x={112} y={106} rx={5} ry={17} rot={8} />
      <Stripe x={80} y={138} rx={4.5} ry={9} rot={-6} />
      <Stripe x={104} y={138} rx={4.5} ry={9} rot={6} />
      <Stripe x={138} y={90} rx={4} ry={10} rot={-24} />
      <Stripe x={150} y={72} rx={3.5} ry={9} rot={-24} />
      <Stripe x={170} y={50} rx={3} ry={7} rot={24} />
    </g>
  );
}
