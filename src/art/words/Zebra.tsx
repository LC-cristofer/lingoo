import { Cheeks, Eyes, GroundShadow, INK } from "../shared";

const COAT = "#FFFFFF";
const COAT_DARK = "#E4E8EE";
const NOSE = "#8A93A4";

function Stripe({ x, y, rx, ry, rot }: { x: number; y: number; rx: number; ry: number; rot: number }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={INK} transform={`rotate(${rot} ${x} ${y})`} />;
}

export function Zebra() {
  return (
    <g>
      <GroundShadow rx={56} />
      <path d="M58 198 Q48 160 62 130 H138 Q152 160 142 198Z" fill={COAT_DARK} />
      <Stripe x={74} y={166} rx={5} ry={13} rot={-14} />
      <Stripe x={126} y={166} rx={5} ry={13} rot={14} />
      <Stripe x={100} y={180} rx={5} ry={14} rot={0} />
      <ellipse cx="54" cy="40" rx="15" ry="26" fill={COAT_DARK} transform="rotate(-16 54 40)" />
      <ellipse cx="146" cy="40" rx="15" ry="26" fill={COAT_DARK} transform="rotate(16 146 40)" />
      <ellipse cx="55" cy="44" rx="7" ry="15" fill={INK} transform="rotate(-16 55 44)" />
      <ellipse cx="145" cy="44" rx="7" ry="15" fill={INK} transform="rotate(16 145 44)" />
      <ellipse cx="100" cy="86" rx="54" ry="62" fill={COAT_DARK} />
      <ellipse cx="98" cy="82" rx="52" ry="60" fill={COAT} />
      <path d="M72 30 Q100 8 128 30 Q124 44 116 46 Q100 36 84 46 Q76 44 72 30Z" fill={INK} />
      <path d="M92 48 Q100 70 108 48Z" fill={INK} />
      <Stripe x={60} y={76} rx={5} ry={14} rot={-30} />
      <Stripe x={140} y={76} rx={5} ry={14} rot={30} />
      <Stripe x={58} y={104} rx={4.5} ry={11} rot={-16} />
      <Stripe x={142} y={104} rx={4.5} ry={11} rot={16} />
      <ellipse cx="100" cy="134" rx="34" ry="28" fill={NOSE} />
      <ellipse cx="97" cy="131" rx="31" ry="25" fill="#A8B0BF" />
      <ellipse cx="88" cy="130" rx="4.5" ry="5.5" fill={INK} />
      <ellipse cx="108" cy="130" rx="4.5" ry="5.5" fill={INK} />
      <path d="M98 142 q-8 8 -14 2 M98 142 q8 8 14 2" stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" />
      <Eyes dx={26} cy={86} r={9} />
      <Cheeks dx={44} cy={108} rx={8} ry={5} />
    </g>
  );
}
