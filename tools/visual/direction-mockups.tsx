// The chosen direction for the app-wide look ("Fundo único do Lingoo + cor de cada unidade"): one light
// background with Lingoo's own doodles, a rounded "island" under each unit in the unit's colour, a coloured
// banner instead of the wood sign, and themed stickers beside the trail. Pictures for approval only.
//   npx tsx tools/visual/direction-mockups.tsx
//   node tools/visual/frames.cjs tools/visual/.out/direction-mockups.html tools/visual/.out/direction-mockups 2
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CSSProperties, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Animal } from "@/art/Animal";
import { Cat } from "@/art/Cat";
import { Sticker as AlbumSticker } from "@/art/scenes/Sticker";
import type { ArtId } from "@/domain/trail/schema";
import {
  artCss,
  Bubble,
  CloseButton,
  css as baseCss,
  fontsLink,
  Glyph,
  outDir,
  PH,
  PW,
  SpeakerButton,
  StarIcon,
  TH,
  Tile,
  TW,
  type Kind,
} from "./mockups";

/* ================================================================== */
/* helpers                                                             */
/* ================================================================== */

type P = [number, number];
type State = "done" | "current" | "locked";
const f = (n: number) => Math.round(n * 10) / 10;
const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
};

/** A gently rolling edge, sampled so a polyline reads as a smooth hill. */
function ridge(w: number, y0: number, a: number, ph: number, step = 8): P[] {
  const pts: P[] = [];
  for (let x = -8; x <= w + 8; x += step) pts.push([x, y0 + a * Math.sin(x / 58 + ph) + a * 0.45 * Math.sin(x / 21 + ph * 2)]);
  return pts;
}
const topPath = (pts: P[], dy = 0) => pts.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y + dy)}`).join(" ");
const hillD = (pts: P[], h: number, dy = 0) => `${topPath(pts, dy)} L${pts[pts.length - 1][0]} ${h} L${pts[0][0]} ${h}Z`;

/* ================================================================== */
/* the units and their colours                                         */
/* ================================================================== */

type UnitDef = { n: number; title: string; short: string; art: string; c: string; d: string; t: string; m: string };
const UNITS: UnitDef[] = [
  { n: 1, title: "Animais da floresta", short: "Floresta", art: "tree", c: "#46B25E", d: "#2B8A45", t: "#E2F6E5", m: "#B9E6C2" },
  { n: 2, title: "Cores", short: "Cores", art: "palette", c: "#9B6CE3", d: "#7344C2", t: "#EFE6FC", m: "#D4BFF6" },
  { n: 3, title: "Números", short: "Números", art: "blocks", c: "#F58A24", d: "#C9620D", t: "#FFEAD2", m: "#FFD1A0" },
  { n: 4, title: "Hello!", short: "Hello", art: "hello", c: "#3B9CEB", d: "#1F78C4", t: "#DDF0FF", m: "#B3DAFA" },
  { n: 5, title: "Família", short: "Família", art: "family", c: "#F27AA3", d: "#CF4F7B", t: "#FFE4EE", m: "#FFC5D8" },
  { n: 6, title: "Casa", short: "Casa", art: "house", c: "#22B3A4", d: "#14897C", t: "#D8F5F1", m: "#A8E5DE" },
  { n: 7, title: "Comida", short: "Comida", art: "apple", c: "#F25F55", d: "#CB3B32", t: "#FFE2DE", m: "#FFC0BA" },
];
const [U1, U2] = UNITS;
const RAINBOW = ["#FF6B6B", "#FFA94D", "#FFD43B", "#5CC46B", "#4AA8F0", "#9B6CE3"];

/* ================================================================== */
/* sticker and icon art (all hand-drawn SVG, flat colours)             */
/* ================================================================== */

const WOOD = "#B27A4A";

function Blk({ n, c, d, x = 0, y = 0, s = 1, r = 0 }: { n: number; c: string; d: string; x?: number; y?: number; s?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r} 32 34) scale(${s})`}>
      <rect x="4" y="9" width="56" height="54" rx="12" fill={d} />
      <rect x="4" y="4" width="56" height="54" rx="12" fill={c} />
      <rect x="10" y="10" width="44" height="6" rx="3" fill="#fff" opacity=".28" />
      <text x="32" y="46" textAnchor="middle" fontFamily="Baloo 2" fontWeight="800" fontSize="40" fill="#fff">
        {n}
      </text>
    </g>
  );
}

const Face = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx="-4.5" cy="0" r="1.8" fill="#2B2D42" />
    <circle cx="4.5" cy="0" r="1.8" fill="#2B2D42" />
    <path d="M-3.5 4 q3.5 3.5 7 0" stroke="#2B2D42" strokeWidth="1.6" fill="none" strokeLinecap="round" />
  </g>
);

const ART: Record<string, { vb: [number, number]; draw: () => ReactNode }> = {
  tree: {
    vb: [70, 92],
    draw: () => (
      <>
        <rect x="29" y="52" width="12" height="36" rx="5" fill={WOOD} />
        <circle cx="35" cy="30" r="27" fill="#44B05D" />
        <circle cx="19" cy="44" r="18" fill="#44B05D" />
        <circle cx="51" cy="44" r="18" fill="#44B05D" />
        <circle cx="27" cy="22" r="11" fill="#6ED07F" />
        <circle cx="52" cy="40" r="5" fill="#6ED07F" />
      </>
    ),
  },
  pine: {
    vb: [64, 96],
    draw: () => (
      <>
        <rect x="27" y="70" width="10" height="22" rx="4" fill={WOOD} />
        <path d="M32 9 L49 33 H15Z" fill="#4DB864" stroke="#4DB864" strokeWidth="7" strokeLinejoin="round" />
        <path d="M32 29 L52 56 H12Z" fill="#3FA85A" stroke="#3FA85A" strokeWidth="7" strokeLinejoin="round" />
        <path d="M32 49 L55 78 H9Z" fill="#339A4F" stroke="#339A4F" strokeWidth="7" strokeLinejoin="round" />
      </>
    ),
  },
  shroom: {
    vb: [50, 46],
    draw: () => (
      <>
        <path d="M18 22 h14 l2 20 q0 3 -3 3 h-12 q-3 0 -3 -3z" fill="#FFF3E2" />
        <path d="M4 27 q0 -23 21 -23 q21 0 21 23z" fill="#FF6B5E" />
        <circle cx="15" cy="17" r="4" fill="#fff" />
        <circle cx="30" cy="12" r="3.4" fill="#fff" />
        <circle cx="37" cy="21" r="3" fill="#fff" />
      </>
    ),
  },
  pot: {
    vb: [70, 84],
    draw: () => (
      <>
        <path d="M13 22 q22 -30 44 0" fill="none" stroke="#8A93A8" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M10 30 h50 l-4 42 q-1 8 -9 8 h-24 q-8 0 -9 -8z" fill="#E9EEF7" />
        <rect x="13" y="52" width="44" height="14" rx="5" fill="#9B6CE3" />
        <ellipse cx="35" cy="30" rx="25" ry="8" fill="#C9D3E2" />
        <ellipse cx="35" cy="30" rx="21" ry="6" fill="#FF6B8B" />
        <path d="M15 31 v14 q0 5 5 5 q5 0 5 -5 v-12z" fill="#FF6B8B" />
      </>
    ),
  },
  brush: {
    vb: [34, 96],
    draw: () => (
      <>
        <path d="M13 3 h8 q3 0 3 4 l-1 40 h-12 l-1 -40 q0 -4 3 -4z" fill="#FFB84D" />
        <rect x="9" y="46" width="16" height="18" rx="3" fill="#C9D3E2" />
        <rect x="9" y="52" width="16" height="3" fill="#A9B4C8" />
        <path d="M9 64 h16 q3 16 -8 30 q-11 -14 -8 -30z" fill="#4AA8F0" />
      </>
    ),
  },
  rainbow: {
    vb: [130, 74],
    draw: () => (
      <>
        {RAINBOW.map((c, i) => {
          const r = 58 - i * 8;
          return <path key={c} d={`M${65 - r} 66 A${r} ${r} 0 0 1 ${65 + r} 66`} fill="none" stroke={c} strokeWidth="8.5" />;
        })}
        <g fill="#fff">
          <ellipse cx="14" cy="64" rx="14" ry="9" />
          <ellipse cx="28" cy="60" rx="10" ry="9" />
          <ellipse cx="116" cy="64" rx="14" ry="9" />
          <ellipse cx="102" cy="60" rx="10" ry="9" />
        </g>
      </>
    ),
  },
  palette: {
    vb: [96, 76],
    draw: () => (
      <>
        <path d="M48 6 C76 4 94 24 90 44 C86 62 64 60 62 50 C60 42 50 44 50 52 C50 68 34 72 20 66 C2 58 0 26 20 12 C28 7 38 6 48 6Z" fill="#F2C27E" />
        <circle cx="30" cy="24" r="7.5" fill="#FF6B6B" />
        <circle cx="49" cy="16" r="7.5" fill="#FFD43B" />
        <circle cx="68" cy="22" r="7.5" fill="#5CC46B" />
        <circle cx="77" cy="38" r="7" fill="#4AA8F0" />
        <circle cx="21" cy="44" r="7" fill="#9B6CE3" />
        <ellipse cx="38" cy="52" rx="6" ry="5" fill="#FFF8EC" />
      </>
    ),
  },
  blocks: {
    vb: [118, 112],
    draw: () => (
      <>
        <Blk n={1} c="#FFC93C" d="#DE9F12" x={0} y={44} s={0.92} r={-4} />
        <Blk n={2} c="#FF7A6B" d="#D9544A" x={58} y={44} s={0.92} r={3} />
        <Blk n={3} c="#4AA8F0" d="#2C82CC" x={29} y={0} s={0.92} r={-2} />
      </>
    ),
  },
  abacus: {
    vb: [110, 84],
    draw: () => (
      <>
        <rect x="14" y="70" width="10" height="12" rx="3" fill="#B9733F" />
        <rect x="86" y="70" width="10" height="12" rx="3" fill="#B9733F" />
        <rect x="8" y="6" width="94" height="68" rx="12" fill="#FFF3DA" stroke="#C98548" strokeWidth="6" />
        {[24, 40, 56].map((y) => (
          <line key={y} x1="14" y1={y} x2="96" y2={y} stroke="#B9733F" strokeWidth="3" />
        ))}
        {[22, 35, 48].map((x) => (
          <circle key={`a${x}`} cx={x} cy="24" r="6.5" fill="#FF7A6B" />
        ))}
        {[82, 95 - 1].map((x) => (
          <circle key={`b${x}`} cx={x - 2} cy="24" r="6.5" fill="#FF7A6B" />
        ))}
        {[22, 35].map((x) => (
          <circle key={`c${x}`} cx={x} cy="40" r="6.5" fill="#FFC93C" />
        ))}
        {[62, 75, 88].map((x) => (
          <circle key={`d${x}`} cx={x} cy="40" r="6.5" fill="#FFC93C" />
        ))}
        {[22, 35, 48, 61].map((x) => (
          <circle key={`e${x}`} cx={x} cy="56" r="6.5" fill="#4AA8F0" />
        ))}
        <circle cx="88" cy="56" r="6.5" fill="#4AA8F0" />
      </>
    ),
  },
  blk: {
    vb: [64, 68],
    draw: () => <Blk n={4} c="#5CC46B" d="#2F9E5B" />,
  },
  hello: {
    vb: [96, 72],
    draw: () => (
      <>
        <path d="M14 4 h68 q10 0 10 10 v28 q0 10 -10 10 h-38 l-14 14 v-14 h-16 q-10 0 -10 -10 v-28 q0 -10 10 -10z" fill="#3B9CEB" />
        <text x="48" y="38" textAnchor="middle" fontFamily="Baloo 2" fontWeight="800" fontSize="24" fill="#fff">
          Hello!
        </text>
      </>
    ),
  },
  hi: {
    vb: [74, 62],
    draw: () => (
      <>
        <path d="M12 4 h50 q10 0 10 10 v22 q0 10 -10 10 h-8 v12 l-14 -12 h-28 q-10 0 -10 -10 v-22 q0 -10 10 -10z" fill="#FFC93C" />
        <text x="37" y="34" textAnchor="middle" fontFamily="Baloo 2" fontWeight="800" fontSize="24" fill="#2B2D42">
          Hi!
        </text>
      </>
    ),
  },
  sun: {
    vb: [76, 76],
    draw: () => (
      <>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="35" y="2" width="6" height="12" rx="3" fill="#FFB400" transform={`rotate(${i * 45} 38 38)`} />
        ))}
        <circle cx="38" cy="38" r="21" fill="#FFC93C" />
        <circle cx="29" cy="43" r="4" fill="#FF9C8F" opacity=".7" />
        <circle cx="47" cy="43" r="4" fill="#FF9C8F" opacity=".7" />
        <Face x={38} y={36} s={1.1} />
      </>
    ),
  },
  heart: {
    vb: [64, 58],
    draw: () => (
      <>
        <path d="M32 54 C6 36 2 18 14 8 C22 2 30 6 32 14 C34 6 42 2 50 8 C62 18 58 36 32 54Z" fill="#F27AA3" />
        <path d="M14 18 q2 -6 8 -6" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".6" />
      </>
    ),
  },
  family: {
    vb: [116, 90],
    draw: () => (
      <>
        <path d="M14 46 q0 -8 12 -8 q12 0 12 8 v36 h-24z" fill="#FF7A6B" />
        <circle cx="26" cy="24" r="13" fill="#FFD9B8" />
        <path d="M13 22 q2 -14 14 -13 q11 1 12 14 q-8 -8 -26 -1z" fill="#8A5A3C" />
        <Face x={26} y={26} />
        <path d="M76 46 q0 -8 12 -8 q12 0 12 8 v36 h-24z" fill="#4AA8F0" />
        <circle cx="88" cy="24" r="13" fill="#FFD9B8" />
        <path d="M75 20 q4 -13 14 -12 q11 1 12 12 q-12 -4 -26 0z" fill="#2B2D42" />
        <Face x={88} y={26} />
        <path d="M44 66 q0 -7 12 -7 q12 0 12 7 v16 h-24z" fill="#FFC93C" />
        <circle cx="56" cy="50" r="10.5" fill="#FFD9B8" />
        <Face x={56} y={52} s={0.85} />
      </>
    ),
  },
  balloon: {
    vb: [50, 90],
    draw: () => (
      <>
        <path d="M25 54 q-7 12 1 20 q6 8 -1 14" fill="none" stroke="#8A93A8" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M25 52 l-5 7 h10z" fill="#E0577F" />
        <ellipse cx="25" cy="27" rx="21" ry="26" fill="#F27AA3" />
        <ellipse cx="17" cy="16" rx="5" ry="8" fill="#fff" opacity=".4" transform="rotate(20 17 16)" />
      </>
    ),
  },
  house: {
    vb: [84, 80],
    draw: () => (
      <>
        <rect x="58" y="6" width="10" height="22" rx="2" fill="#14897C" />
        <rect x="10" y="36" width="64" height="40" rx="7" fill="#7FDCD0" />
        <path d="M4 40 L42 8 L80 40Z" fill="#1FA394" stroke="#1FA394" strokeWidth="6" strokeLinejoin="round" />
        <path d="M35 76 v-16 q7 -9 14 0 v16z" fill="#fff" />
        <rect x="16" y="46" width="14" height="14" rx="3" fill="#FFF8EC" />
        <rect x="54" y="46" width="14" height="14" rx="3" fill="#FFF8EC" />
        <path d="M23 46 v14 M16 53 h14 M61 46 v14 M54 53 h14" stroke="#7FDCD0" strokeWidth="2" />
      </>
    ),
  },
  sofa: {
    vb: [104, 64],
    draw: () => (
      <>
        <rect x="9" y="4" width="86" height="36" rx="15" fill="#2FB8A8" />
        <rect x="14" y="10" width="36" height="26" rx="9" fill="#5FD3C6" />
        <rect x="54" y="10" width="36" height="26" rx="9" fill="#5FD3C6" />
        <rect x="2" y="26" width="100" height="26" rx="12" fill="#1FA394" />
        <rect x="2" y="22" width="20" height="30" rx="10" fill="#22B3A4" />
        <rect x="82" y="22" width="20" height="30" rx="10" fill="#22B3A4" />
        <rect x="14" y="52" width="9" height="10" rx="3" fill="#8A5A3C" />
        <rect x="81" y="52" width="9" height="10" rx="3" fill="#8A5A3C" />
      </>
    ),
  },
  lamp: {
    vb: [50, 88],
    draw: () => (
      <>
        <rect x="23" y="34" width="4" height="40" rx="2" fill="#8A93A8" />
        <ellipse cx="25" cy="76" rx="15" ry="6" fill="#8A93A8" />
        <path d="M11 6 h28 l9 30 h-46z" fill="#FFC93C" />
        <path d="M17 8 l-5 26" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".5" />
      </>
    ),
  },
  apple: {
    vb: [64, 72],
    draw: () => (
      <>
        <path d="M32 24 C14 12 0 26 6 46 C10 60 22 68 32 62 C42 68 54 60 58 46 C64 26 50 12 32 24Z" fill="#F25F55" />
        <rect x="30" y="8" width="4" height="16" rx="2" fill="#8A5A3C" />
        <path d="M35 18 q4 -14 19 -14 q0 13 -19 14z" fill="#46B25E" />
        <ellipse cx="17" cy="36" rx="4" ry="8" fill="#fff" opacity=".35" transform="rotate(20 17 36)" />
      </>
    ),
  },
  banana: {
    vb: [88, 62],
    draw: () => (
      <>
        <path d="M6 16 C18 54 62 60 82 22 C84 17 77 13 74 18 C58 44 30 40 16 8 C13 3 4 10 6 16Z" fill="#FFD43B" />
        <path d="M10 8 q-4 -4 -8 0 l5 10z" fill="#8A5A3C" />
        <path d="M16 14 C30 42 56 44 72 22" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".45" />
      </>
    ),
  },
  cupcake: {
    vb: [62, 76],
    draw: () => (
      <>
        <path d="M10 40 h42 l-6 32 h-30z" fill="#F27AA3" />
        <path d="M22 42 l2 28 M31 42 v28 M40 42 l-2 28" stroke="#fff" strokeWidth="2.4" opacity=".5" />
        <path d="M6 42 q-5 -14 9 -17 q-1 -15 16 -15 q17 0 16 15 q14 3 9 17z" fill="#FFE9C6" />
        <path d="M14 34 q16 5 34 0" stroke="#F2C27E" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="31" cy="8" r="6" fill="#F25F55" />
      </>
    ),
  },
};

/** A sticker beside the trail: the art, a white cut-out edge and a soft shadow. */
function Stk({ id, x, y, w, r = 0, flip }: { id: string; x: number; y: number; w: number; r?: number; flip?: boolean }) {
  const a = ART[id];
  const [vw, vh] = a.vb;
  return (
    <svg className="stk" viewBox={`0 0 ${vw} ${vh}`} style={{ left: x, top: y, width: w, height: (w * vh) / vw, transform: `rotate(${r}deg)${flip ? " scaleX(-1)" : ""}` }} aria-hidden="true">
      {a.draw()}
    </svg>
  );
}

function StkAnimal({ id, x, y, w, r = 0 }: { id: ArtId; x: number; y: number; w: number; r?: number }) {
  return (
    <span className="stk" style={{ left: x, top: y, width: w, height: w, transform: `rotate(${r}deg)` }}>
      <Animal id={id} size={w} />
    </span>
  );
}

function Ic({ id, size = 46 }: { id: string; size?: number }) {
  const [vw, vh] = ART[id].vb;
  const k = size / Math.max(vw, vh);
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width={vw * k} height={vh * k} aria-hidden="true">
      {ART[id].draw()}
    </svg>
  );
}

/* ================================================================== */
/* background: gradient, clouds, islands, doodles                      */
/* ================================================================== */

const star5 = (R: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const k = i % 2 ? r : R;
    return `${i ? "L" : "M"}${f(Math.cos(a) * k)} ${f(Math.sin(a) * k)}`;
  }).join(" ") + "Z";
const spark = (s: number) => `M0 ${-s} Q1.2 -1.2 ${s} 0 Q1.2 1.2 0 ${s} Q-1.2 1.2 ${-s} 0 Q-1.2 -1.2 0 ${-s}Z`;

/** The Lingoo doodles: a 230 px tile of stars, clouds, letters and hearts, drawn big enough to read yet faint. */
function DoodleTile({ id, ty = 0 }: { id: string; ty?: number }) {
  const T = { star: "#F5B800", cloud: "#6FB4EC", a: "#FF8D7E", b: "#58AEF0", c: "#5CBB6D", heart: "#FF7E9A", spark: "#F5B800", dot: "#6FB4EC" };
  const letter = (ch: string, x: number, y: number, r: number, c: string) => (
    <text x={x} y={y} transform={`rotate(${r} ${x} ${y})`} fontFamily="Baloo 2" fontWeight="800" fontSize="27" fill={c} textAnchor="middle">
      {ch}
    </text>
  );
  return (
    <pattern id={id} width="230" height="230" patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${ty})`}>
      <g opacity=".42">
        <path transform="translate(34 36) rotate(14)" d={star5(11, 4.8)} fill="none" stroke={T.star} strokeWidth="3" strokeLinejoin="round" />
        <path transform="translate(132 32)" d="M-19 10 h34 a9 9 0 0 0 0 -18 a11 11 0 0 0 -20 -3 a10 10 0 0 0 -14 21z" fill="none" stroke={T.cloud} strokeWidth="3" strokeLinejoin="round" />
        {letter("A", 196, 66, -12, T.a)}
        <path transform="translate(80 104) rotate(-8)" d="M0 8 C-14 -3 -11 -14 -4 -12 C-1 -11 0 -8 0 -7 C0 -8 1 -11 4 -12 C11 -14 14 -3 0 8z" fill="none" stroke={T.heart} strokeWidth="3" strokeLinejoin="round" />
        <path transform="translate(168 130)" d={spark(9)} fill={T.spark} />
        {letter("B", 30, 168, 9, T.b)}
        <g fill={T.dot}>
          <circle cx="118" cy="174" r="2.6" />
          <circle cx="130" cy="166" r="2" />
          <circle cx="141" cy="177" r="2.6" />
        </g>
        {letter("C", 202, 202, -6, T.c)}
        <path transform="translate(88 214) rotate(-10)" d={star5(7, 3)} fill={T.star} />
        <path transform="translate(14 96)" d={spark(5.5)} fill={T.cloud} />
      </g>
    </pattern>
  );
}

type Isl = { x: number; y: number; w: number; h: number; u: UnitDef; rx?: number };

function Bg({ w, h, uid, grad, islands = [], clouds = true, tail }: { w: number; h: number; uid: string; grad: "top" | "mid" | "plain"; islands?: Isl[]; clouds?: boolean; tail?: ReactNode }) {
  const stops: [number, string][] =
    grad === "top"
      ? [[0, "#B6DFFB"], [0.28, "#DCF0FF"], [0.62, "#FFF8EC"], [1, "#FFF3DF"]]
      : grad === "mid"
        ? [[0, "#D6EDFF"], [0.5, "#FFF8EC"], [1, "#FFF3DF"]]
        : [[0, "#C4E5FC"], [0.45, "#F4FAFF"], [1, "#FFF8EC"]];
  return (
    <svg className="layer" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <defs>
        <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="0" y2="1">
          {stops.map(([o, c]) => (
            <stop key={o} offset={o} stopColor={c} />
          ))}
        </linearGradient>
        <DoodleTile id={`d-${uid}`} />
      </defs>
      <rect width={w} height={h} fill={`url(#g-${uid})`} />
      {clouds && grad !== "mid" && (
        <g fill="#fff" opacity=".85">
          <g transform={`translate(${w * 0.14} 40)`}>
            <ellipse rx="44" ry="13" />
            <ellipse cx="14" cy="-10" rx="22" ry="15" />
            <ellipse cx="-16" cy="-5" rx="16" ry="10" />
          </g>
          <g transform={`translate(${w * 0.8} 100)`}>
            <ellipse rx="36" ry="11" />
            <ellipse cx="10" cy="-9" rx="18" ry="13" />
          </g>
        </g>
      )}
      {islands.map((s, i) => (
        <g key={i}>
          <rect x={s.x} y={s.y + 9} width={s.w} height={s.h} rx={s.rx ?? 48} fill={mix(s.u.t, s.u.c, 0.3)} />
          <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx ?? 48} fill={s.u.t} />
        </g>
      ))}
      <rect width={w} height={h} fill={`url(#d-${uid})`} />
      {tail}
    </svg>
  );
}

/** A soft hill of the unit's colour for the quiet bottom of the lesson screens. */
function Hill({ w, h, y, u, uid }: { w: number; h: number; y: number; u: UnitDef; uid: string }) {
  const r = ridge(w, y, 12, 0.6);
  return (
    <svg className="layer" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true" data-hill={uid}>
      <path d={hillD(r, h, 14)} fill={mix(u.t, u.c, 0.3)} />
      <path d={hillD(r, h)} fill={u.t} />
    </svg>
  );
}

/* ================================================================== */
/* foreground pieces (copied from mockups.tsx where not exported)      */
/* ================================================================== */

const KIND_COLOR: Record<Kind, [string, string]> = {
  song: ["#FF7A6B", "#D9544A"],
  lesson: ["#FFC93C", "#DE9F12"],
  story: ["#4AA8F0", "#2C82CC"],
  challenge: ["#B57EDC", "#8F57BF"],
};
const LOCKED: [string, string] = ["#D5D9E0", "#AEB4BF"];

function TrailNode({ x, y, kind, state, size = 76, label, side }: { x: number; y: number; kind: Kind; state: State; size?: number; label?: string; side?: "left" | "right" }) {
  const [fill, edge] = state === "locked" ? LOCKED : KIND_COLOR[kind];
  const s = state === "current" ? size + 14 : size;
  return (
    <div className="node" style={{ left: x - s / 2, top: y - s / 2, width: s, height: s }}>
      {state === "current" && <span className="node-ring" />}
      <span className="node-disc" style={{ background: fill, boxShadow: `0 9px 0 ${edge}, 0 15px 0 rgba(43,45,66,.10)` }}>
        <svg viewBox="-24 -24 48 48" width={s * 0.62} height={s * 0.62} aria-hidden="true">
          <Glyph kind={kind} locked={state === "locked"} />
        </svg>
      </span>
      {state === "done" && (
        <span className="node-check">
          <svg viewBox="-10 -10 20 20" width="18" height="18" aria-hidden="true">
            <path d="M-5 0 l4 4 l7 -8" stroke="#fff" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      {label && <span className={`node-label ${side === "left" ? "is-left" : "is-right"} ${state === "locked" ? "is-locked" : ""}`}>{label}</span>}
    </div>
  );
}

function trailPath(points: P[], extendTo?: number): string {
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const dy = (y1 - y0) / 2;
    d += ` C${x0} ${y0 + dy} ${x1} ${y1 - dy} ${x1} ${y1}`;
  }
  if (extendTo !== undefined) {
    const [x, y] = points[points.length - 1];
    d += ` C${x} ${y + 50} ${x + 30} ${extendTo - 40} ${x + 30} ${extendTo}`;
  }
  return d;
}

/** The trail takes the unit's colour: a wide band in its mid tone, a white road on top, dashes in the strong tone. */
function Trail({ points, from, extendTo, w, h, u }: { points: P[]; from?: P; extendTo?: number; w: number; h: number; u: UnitDef }) {
  const d = trailPath(from ? [from, ...points] : points, extendTo);
  return (
    <svg className="layer" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <path d={d} fill="none" stroke={mix(u.m, u.c, 0.25)} strokeWidth="58" strokeLinecap="round" />
      <path d={d} fill="none" stroke={u.m} strokeWidth="52" strokeLinecap="round" />
      <path d={d} fill="none" stroke="#fff" strokeWidth="40" strokeLinecap="round" opacity=".9" />
      <path d={d} fill="none" stroke={u.c} strokeWidth="5" strokeLinecap="round" strokeDasharray="2 20" opacity=".55" />
    </svg>
  );
}

function MusicBtn() {
  return (
    <span className="mbtn" aria-label="Música ligada">
      <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
        <path d="M9 17.5V5.5l10-2v12" fill="none" stroke="#3B9CEB" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="6.8" cy="17.6" rx="3.1" ry="2.5" fill="#3B9CEB" />
        <ellipse cx="16.8" cy="15.6" rx="3.1" ry="2.5" fill="#3B9CEB" />
      </svg>
    </span>
  );
}

function TopBar({ stars = 2, days = 3 }: { stars?: number; days?: number }) {
  return (
    <div className="topbar">
      <span className="chip">
        <StarIcon />
        <b>{stars}</b>
      </span>
      <span className="topbar-r">
        <span className="chip chip-days">
          {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
            <span key={i} className={`day ${i < days ? "is-on" : ""}`}>
              <i />
              <em>{d}</em>
            </span>
          ))}
        </span>
        <MusicBtn />
      </span>
    </div>
  );
}

function Nav3({ active, ready, wide }: { active: "trail" | "memory" | "album"; ready?: number; wide?: boolean }) {
  return (
    <nav className={`nav ${wide ? "is-wide is-3" : "is-3"}`}>
      <span className={`tab ${active === "trail" ? "is-active" : ""}`}>
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
          <path d="M9 28 C9 20 23 22 23 14 C23 8 14 9 14 4" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="9" cy="28" r="3.5" fill="currentColor" />
          <circle cx="14" cy="4" r="3.5" fill="currentColor" />
        </svg>
        Trilha
      </span>
      <span className={`tab ${active === "memory" ? "is-active is-sky" : ""}`}>
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
          <rect x="9" y="3" width="18" height="23" rx="4" fill="none" stroke="currentColor" strokeWidth="3.4" transform="rotate(10 18 14)" />
          <rect x="4" y="7" width="18" height="23" rx="4" fill="currentColor" />
          <path d="M10 15 a3 3 0 1 1 4 3 v2" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </svg>
        Memória
        {ready ? <span className="tab-badge">{ready}</span> : null}
      </span>
      <span className={`tab ${active === "album" ? "is-active is-gold" : ""}`}>
        <svg viewBox="-20 -18 40 36" width="28" height="25" aria-hidden="true">
          <path d="M-17 -12 q9 -4 17 2 q8 -6 17 -2 v24 q-9 -4 -17 2 q-8 -6 -17 -2z" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M0 -10 v24" stroke="currentColor" strokeWidth="3" />
        </svg>
        Álbum
      </span>
    </nav>
  );
}

/** The unit banner: a big rounded tag in the unit's colour, with its illustration, title and progress. */
function Banner({ u, done = 0, total = 6, locked, compact, style }: { u: UnitDef; done?: number; total?: number; locked?: boolean; compact?: boolean; style?: CSSProperties }) {
  return (
    <div className={`ban ${compact ? "is-compact" : ""}`} style={{ ...style, ["--u" as string]: u.c, ["--ud" as string]: u.d }}>
      <span className="ban-deco">
        <svg viewBox="0 0 350 110" width="100%" height="100%" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
          <circle cx="300" cy="10" r="64" fill="#fff" opacity=".1" />
          <circle cx="352" cy="96" r="44" fill="#fff" opacity=".09" />
          <path transform="translate(190 20)" d={spark(7)} fill="#fff" opacity=".5" />
          <path transform="translate(212 92)" d={spark(5)} fill="#fff" opacity=".4" />
        </svg>
        {u.n === 2 && <span className="ban-rb">{RAINBOW.map((c) => <i key={c} style={{ background: c }} />)}</span>}
      </span>
      <span className="ban-ic">
        <Ic id={u.art} size={compact ? 38 : 46} />
      </span>
      <span className="ban-text">
        <small>Unidade {u.n}</small>
        <strong>{u.title}</strong>
      </span>
      {locked ? (
        <span className="ban-lock">
          <svg viewBox="-24 -24 48 48" width="30" height="30" aria-hidden="true">
            <Glyph kind="lesson" locked />
          </svg>
        </span>
      ) : (
        <span className="ban-prog">
          <span className="ban-bar">
            <i style={{ width: `${(done / total) * 100}%` }} />
          </span>
          <em>
            {done} de {total}
          </em>
        </span>
      )}
    </div>
  );
}

const STOPS: { kind: Kind; label: string }[] = [
  { kind: "song", label: "Música" },
  { kind: "lesson", label: "Lição 1" },
  { kind: "lesson", label: "Lição 2" },
  { kind: "lesson", label: "Lição 3" },
  { kind: "story", label: "História" },
  { kind: "challenge", label: "Desafio" },
];
const stateOf = (i: number, done: number): State => (i < done ? "done" : i === done ? "current" : "locked");
const P_POINTS: P[] = [[118, 236], [214, 324], [278, 412], [206, 500], [118, 588], [196, 676]];
const P_SIDES: ("left" | "right")[] = ["right", "left", "left", "right", "right", "right"];
const T_POINTS: P[] = [[540, 150], [680, 248], [774, 346], [670, 444], [540, 542], [650, 640]];
const T_SIDES: ("left" | "right")[] = ["right", "right", "right", "right", "left", "left"];

function Guide({ x, y, size, text }: { x: number; y: number; size: number; text: ReactNode }) {
  return (
    <div className="guide" style={{ left: x, top: y }}>
      <Bubble tail="down">{text}</Bubble>
      <Cat expression="pointing" size={size} />
    </div>
  );
}

/* ================================================================== */
/* map screens                                                         */
/* ================================================================== */

function PhoneMapTop() {
  const banner = { position: "absolute", left: 20, top: 78, width: 350 } as const;
  return (
    <>
      <Bg w={PW} h={PH} uid="pt" grad="top" islands={[{ x: 10, y: 56, w: 370, h: 780, u: U1 }]} />
      <Trail points={P_POINTS} w={PW} h={PH} extendTo={PH + 20} u={U1} />
      <StkAnimal id="bird" x={298} y={186} w={52} r={6} />
      <Stk id="pine" x={16} y={298} w={46} r={-3} />
      <Stk id="tree" x={326} y={332} w={54} r={4} />
      <Stk id="shroom" x={344} y={452} w={30} r={-6} />
      <StkAnimal id="bear" x={306} y={546} w={62} r={-4} />
      <Stk id="shroom" x={340} y={626} w={30} r={8} />
      <Stk id="pine" x={20} y={684} w={50} r={2} />
      <Stk id="tree" x={316} y={690} w={50} r={-3} />
      {STOPS.map((s, i) => {
        const [x, y] = P_POINTS[i];
        const st = stateOf(i, 2);
        return <TrailNode key={i} x={x} y={y} kind={s.kind} state={st} label={st === "current" ? undefined : s.label} side={P_SIDES[i]} />;
      })}
      <Guide x={8} y={384} size={92} text={<><b>Lição 2</b> Vamos!</>} />
      <Banner u={U1} done={2} total={6} style={banner} />
      <TopBar />
      <Nav3 active="trail" ready={5} />
    </>
  );
}

function PhoneMapBoundary() {
  const pts1: P[] = [[206, 98], [118, 184], [200, 270]];
  const pts2: P[] = [[118, 578], [214, 664], [278, 750], [212, 836]];
  const ban = { position: "absolute", left: 20, top: 392, width: 350 } as const;
  return (
    <>
      <Bg
        w={PW}
        h={PH}
        uid="pb"
        grad="mid"
        islands={[
          { x: 10, y: -90, w: 370, h: 434, u: U1 },
          { x: 10, y: 372, w: 370, h: 520, u: U2 },
        ]}
      />
      <Trail points={[...pts1, [196, 410]]} from={[278, 10]} w={PW} h={PH} u={U1} />
      <Trail points={pts2} from={[196, 470]} w={PW} h={PH} extendTo={PH + 40} u={U2} />
      <Stk id="pine" x={326} y={92} w={50} r={3} />
      <Stk id="tree" x={16} y={118} w={50} r={-4} />
      <StkAnimal id="bear" x={298} y={170} w={60} r={-4} />
      <Stk id="shroom" x={26} y={252} w={30} r={6} />
      <span className="peek" style={{ left: 256, top: 236 }}>
        <svg viewBox="0 0 80 70" width="84" height="74" aria-hidden="true">
          <ellipse cx="40" cy="64" rx="34" ry="5" fill="rgba(43,45,66,.14)" />
          <rect x="8" y="26" width="64" height="36" rx="6" fill="#B9733F" />
          <path d="M8 30 q0 -22 32 -22 q32 0 32 22z" fill="#C98548" />
          <rect x="8" y="27" width="64" height="7" fill="#8B5A3C" />
          <rect x="18" y="8" width="8" height="54" fill="#FFC93C" />
          <rect x="54" y="8" width="8" height="54" fill="#FFC93C" />
          <rect x="33" y="24" width="14" height="16" rx="3" fill="#FFC93C" />
          <circle cx="40" cy="31" r="2.6" fill="#2B2D42" />
        </svg>
      </span>
      <TrailNode x={206} y={98} kind="lesson" state="locked" label="Lição 3" side="left" />
      <TrailNode x={118} y={184} kind="story" state="locked" label="História" side="right" />
      <TrailNode x={200} y={270} kind="challenge" state="locked" label="Desafio" side="left" />
      <Banner u={U2} locked style={ban} />
      {pts2.map(([x, y], i) => (
        <TrailNode key={i} x={x} y={y} kind={i === 0 ? "song" : "lesson"} state="locked" label={i < 3 ? ["Música", "Lição 1", "Lição 2"][i] : undefined} side={i === 0 ? "right" : "left"} />
      ))}
      <Stk id="rainbow" x={270} y={510} w={104} r={0} />
      <Stk id="pot" x={18} y={634} w={50} r={-6} />
      <Stk id="brush" x={318} y={640} w={32} r={28} />
      <Stk id="palette" x={16} y={712} w={72} r={-8} />
      <TopBar />
      <Nav3 active="trail" ready={5} />
    </>
  );
}

function TabletMapTop() {
  return (
    <>
      <Bg w={TW} h={TH} uid="tt" grad="top" islands={[{ x: 12, y: 60, w: 1000, h: 670, u: U1, rx: 60 }]} />
      <Trail points={T_POINTS} w={TW} h={TH} extendTo={TH + 20} u={U1} />
      <Stk id="pine" x={44} y={300} w={74} r={-3} />
      <Stk id="tree" x={140} y={330} w={92} r={3} />
      <StkAnimal id="bear" x={96} y={450} w={150} r={-3} />
      <Stk id="shroom" x={284} y={560} w={52} r={-6} />
      <StkAnimal id="bird" x={330} y={230} w={84} r={6} />
      <Stk id="pine" x={44} y={560} w={70} r={2} />
      <Stk id="tree" x={930} y={430} w={84} r={4} />
      <Stk id="shroom" x={870} y={590} w={44} r={8} />
      <Stk id="pine" x={940} y={560} w={64} r={-2} />
      {STOPS.map((s, i) => {
        const [x, y] = T_POINTS[i];
        const st = stateOf(i, 2);
        return <TrailNode key={i} x={x} y={y} size={84} kind={s.kind} state={st} label={st === "current" ? undefined : s.label} side={T_SIDES[i]} />;
      })}
      <Guide x={836} y={236} size={120} text={<><b>Lição 2</b> Vamos!</>} />
      <Banner u={U1} done={2} total={6} style={{ position: "absolute", left: 36, top: 92, width: 390 }} />
      <TopBar />
      <Nav3 active="trail" ready={5} wide />
    </>
  );
}

/* ================================================================== */
/* lesson and other screens                                            */
/* ================================================================== */

function LessonBar({ u, ratio }: { u: UnitDef; ratio: number }) {
  return (
    <div className="lesson-top">
      <CloseButton />
      <span className="bar">
        <i style={{ width: `${ratio * 100}%`, background: u.c, boxShadow: `inset 0 5px 0 ${mix(u.c, "#fff", 0.35)}` }} />
      </span>
      <span className="ubadge" style={{ background: "#fff", boxShadow: `0 4px 0 ${mix(u.m, u.c, 0.5)}, inset 0 0 0 4px ${u.c}` }}>
        <Ic id={u.art} size={24} />
      </span>
    </div>
  );
}

function PhoneExercise() {
  const tiles: ArtId[] = ["bird", "bear", "frog", "mouse"];
  return (
    <>
      <Bg w={PW} h={PH} uid="pe" grad="plain" />
      <Hill w={PW} h={PH} y={712} u={U1} uid="pe" />
      <Stk id="shroom" x={34} y={742} w={38} r={-6} />
      <Stk id="tree" x={300} y={690} w={56} r={3} />
      <Stk id="pine" x={346} y={736} w={34} r={-2} />
      <div className="lesson">
        <LessonBar u={U1} ratio={0.3} />
        <div className="ask">
          <Cat expression="pointing" size={116} />
          <Bubble>
            <span className="bubble-text">
              Qual é o <b lang="en">bear</b>? Toque nele!
            </span>
            <SpeakerButton />
          </Bubble>
        </div>
        <div className="tiles is-2">
          {tiles.map((id) => (
            <Tile key={id} id={id} size={166} />
          ))}
        </div>
      </div>
    </>
  );
}

const Play = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
    <path d="M7 4 L20 12 L7 20Z" fill="currentColor" />
  </svg>
);

function PhoneOpening() {
  const words: ArtId[] = ["bear", "bird", "frog"];
  return (
    <>
      <Bg w={PW} h={PH} uid="po" grad="plain" />
      <Hill w={PW} h={PH} y={744} u={U1} uid="po" />
      <Stk id="pine" x={22} y={756} w={34} r={-2} />
      <Stk id="shroom" x={330} y={764} w={32} r={6} />
      <div className="lesson">
        <div className="lesson-top">
          <CloseButton />
          <span className="pill upill" style={{ background: U1.c, boxShadow: `0 4px 0 ${U1.d}` }}>
            Lição 1
          </span>
        </div>
        <div className="hello">
          <Bubble tail="down">Oi! Hoje nós vamos aprender três animais da floresta!</Bubble>
          <Cat expression="happy" size={170} />
        </div>
        <div className="words">
          {words.map((id) => (
            <div key={id} className="word">
              <Tile id={id} size={104} />
              <b lang="en">{id}</b>
            </div>
          ))}
        </div>
        <span className="btn is-sun is-big">
          Começar
          <Play />
        </span>
      </div>
    </>
  );
}

function PhoneStart() {
  const hills = [ridge(PW, 640, 14, 0.4), ridge(PW, 690, 12, 2.1), ridge(PW, 740, 10, 3.3)];
  const letters: [string, string][] = [["L", "#FF7A6B"], ["i", "#FFB400"], ["n", "#5CC46B"], ["g", "#3B9CEB"], ["o", "#B57EDC"], ["o", "#FF7A6B"]];
  return (
    <>
      <Bg w={PW} h={PH} uid="ps" grad="top" clouds />
      <svg className="layer" viewBox={`0 0 ${PW} ${PH}`} width={PW} height={PH} aria-hidden="true">
        <defs>
          <radialGradient id="sunglow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFE27A" stopOpacity=".85" />
            <stop offset="0.55" stopColor="#FFE9A8" stopOpacity=".5" />
            <stop offset="1" stopColor="#FFF3C8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="195" cy="450" r="230" fill="url(#sunglow)" />
        {hills.map((r, i) => (
          <path key={i} d={hillD(r, PH)} fill={["#C6EBCC", "#A2DDAB", "#7FCF8B"][i]} />
        ))}
      </svg>
      <Stk id="tree" x={14} y={600} w={64} r={-3} />
      <Stk id="pine" x={322} y={594} w={54} r={3} />
      <Stk id="shroom" x={90} y={738} w={34} r={-6} />
      <Stk id="rainbow" x={248} y={272} w={124} r={0} />
      <div className="start">
        <h1 className="logo">
          {letters.map(([ch, c], i) => (
            <span key={i} style={{ color: c }}>
              {ch}
            </span>
          ))}
        </h1>
        <p className="tagline">Inglês para brincar</p>
        <div className="start-cast">
          <span className="cast cast-l">
            <Animal id="bear" size={96} />
          </span>
          <Cat expression="happy" size={230} />
          <span className="cast cast-r">
            <Animal id="bird" size={84} />
          </span>
        </div>
        <span className="btn is-sun is-big">
          Jogar
          <Play />
        </span>
      </div>
    </>
  );
}

function PhoneAlbum() {
  return (
    <>
      <Bg w={PW} h={PH} uid="pa" grad="plain" islands={[{ x: 70, y: 196, w: 250, h: 244, u: U1, rx: 56 }]} />
      <div className="album">
        <Banner u={U1} done={1} total={1} style={{ position: "absolute", left: 20, top: 74, width: 350 }} />
        <span className="album-st">
          <AlbumSticker art="bear" earned size={196} />
        </span>
        {UNITS.slice(1, 4).map((u, i) => (
          <Banner key={u.n} u={u} locked compact style={{ position: "absolute", left: 20, top: 468 + i * 112, width: 350 }} />
        ))}
      </div>
      <TopBar />
      <Nav3 active="album" ready={5} />
    </>
  );
}

function CardPile({ ids, size }: { ids: ArtId[]; size: number }) {
  const rot = [-12, 8, -2];
  return (
    <div className="pile" style={{ width: size * 1.7, height: size * 1.25 }}>
      {ids.map((id, i) => (
        <span key={id} className="pile-card" style={{ width: size, height: size * 1.2, left: `${i * 30}%`, transform: `translateX(-${i * 18}%) rotate(${rot[i]}deg)`, zIndex: i }}>
          <Animal id={id} size={size * 0.78} />
        </span>
      ))}
    </div>
  );
}

function PhoneMemory() {
  const sky: UnitDef = { ...UNITS[3] };
  return (
    <>
      <Bg w={PW} h={PH} uid="pm" grad="plain" islands={[{ x: 22, y: 128, w: 346, h: 540, u: sky, rx: 56 }]} />
      <TopBar />
      <div className="mtab">
        <h1 className="mtab-title">Treino de memória</h1>
        <div className="guide-row">
          <Cat expression="pointing" size={104} />
          <Bubble>
            <span className="bubble-text">Tem cartões para treinar!</span>
            <SpeakerButton />
          </Bubble>
        </div>
        <CardPile ids={["frog", "bird", "bear"]} size={120} />
        <p className="mtab-count">
          <b>5</b> cartões prontos hoje
        </p>
        <span className="btn is-sun is-big">
          Treinar
          <Play />
        </span>
      </div>
      <Nav3 active="memory" ready={5} />
    </>
  );
}

function TabletExercise() {
  const tiles: ArtId[] = ["bird", "bear", "frog", "mouse"];
  return (
    <>
      <Bg w={TW} h={TH} uid="te" grad="plain" />
      <Hill w={TW} h={TH} y={668} u={U1} uid="te" />
      <Stk id="tree" x={80} y={634} w={84} r={-3} />
      <Stk id="shroom" x={190} y={700} w={50} r={5} />
      <Stk id="pine" x={880} y={632} w={74} r={2} />
      <Stk id="shroom" x={800} y={706} w={46} r={-6} />
      <div className="lesson is-tablet">
        <LessonBar u={U1} ratio={0.3} />
        <div className="ask">
          <Cat expression="pointing" size={150} />
          <Bubble>
            <span className="bubble-text">
              Qual é o <b lang="en">bear</b>? Toque nele!
            </span>
            <SpeakerButton />
          </Bubble>
        </div>
        <div className="tiles is-4">
          {tiles.map((id) => (
            <Tile key={id} id={id} size={214} />
          ))}
        </div>
      </div>
    </>
  );
}

/* ================================================================== */
/* the seven units                                                     */
/* ================================================================== */

type Placed = [string, number, number?];
/** Three stickers per unit: left of the trail, and two on the right. [art, width, rotation] */
const KITS: Record<number, Placed[]> = {
  1: [["pine", 54, -4], ["tree", 62, 3], ["shroom", 44, 6]],
  2: [["pot", 56, -6], ["brush", 34, 24], ["rainbow", 112, 0]],
  3: [["blocks", 86, 0], ["abacus", 98, 3], ["blk", 56, -6]],
  4: [["hello", 92, -4], ["hi", 64, 5], ["sun", 70, 0]],
  5: [["heart", 54, -8], ["balloon", 42, 6], ["family", 108, 0]],
  6: [["house", 78, -3], ["lamp", 40, 4], ["sofa", 104, 0]],
  7: [["apple", 56, -5], ["banana", 80, 8], ["cupcake", 52, 4]],
};
const SLOTS = [54, 450, 548];

function UnitRow({ u }: { u: UnitDef }) {
  const X = 380;
  const nodes: [Kind, State, number, number][] =
    u.n === 1
      ? [["song", "done", X + 160, 100], ["lesson", "current", X + 252, 76], ["story", "locked", X + 344, 100]]
      : [["song", "current", X + 160, 100], ["lesson", "locked", X + 252, 76], ["story", "locked", X + 344, 100]];
  return (
    <div className="urow">
      <Bg w={1000} h={176} uid={`u${u.n}`} grad="plain" clouds={false} islands={[{ x: X, y: 10, w: 610, h: 142, u, rx: 44 }]} />
      <Trail points={[[X + 252, 76], [X + 344, 100]]} from={[X + 160, 100]} w={1000} h={176} u={{ ...u }} />
      <div className="urow-kit">
        {KITS[u.n].map(([id, w, r], i) => {
          const [vw, vh] = ART[id].vb;
          const h = (w * vh) / vw;
          return <Stk key={i} id={id} x={X + SLOTS[i] - w / 2 + (i === 0 ? 0 : 0)} y={88 - h / 2} w={w} r={r} />;
        })}
      </div>
      <Banner u={u} done={u.n === 1 ? 2 : 0} total={6} style={{ position: "absolute", left: 20, top: 30, width: 340 }} />
      <span className="urow-chip">
        <i style={{ background: u.c }} />
        {u.c.toUpperCase()}
      </span>
      <div className="urow-nodes">
        {nodes.map(([k, s, x, y], i) => (
          <TrailNode key={i} x={x + 0} y={y} size={52} kind={k} state={s} />
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/* page                                                                */
/* ================================================================== */

function Fig({ kind, name, note, children }: { kind: "phone" | "tablet"; name: string; note: string; children: ReactNode }) {
  return (
    <figure className={`device is-${kind}`}>
      <div className="screen">{children}</div>
      <figcaption className="cap">
        <b>{name}</b>
        <small>{note}</small>
      </figcaption>
    </figure>
  );
}

function Page() {
  return (
    <main>
      <section data-sheet="12-caminho2-celular-mapa">
        <h2>Fundo único do Lingoo + cor de cada unidade: o mapa (celular em pé)</h2>
        <div className="row">
          <Fig kind="phone" name="Topo da Unidade 1" note="Um só fundo claro, com rabiscos de estrelas, nuvens, letras e corações. A ilha verde é da Unidade 1 e a faixa verde substitui a placa de madeira. No app, as nuvens passam devagar e os rabiscos flutuam poucos pixels.">
            <PhoneMapTop />
          </Fig>
          <Fig kind="phone" name="Rolando até a Unidade 2" note="O fundo continua o mesmo; muda a cor: a ilha, a trilha, a faixa e as figurinhas (tintas, pincel, arco-íris). A faixa roxa tem listras de arco-íris. Unidade ainda bloqueada.">
            <PhoneMapBoundary />
          </Fig>
        </div>
      </section>
      <section data-sheet="13-caminho2-celular-telas">
        <h2>As outras telas do celular</h2>
        <div className="row">
          <Fig kind="phone" name="Lição: exercício" note="Calma: o mesmo fundo, sem cena. A cor da unidade aparece só na barra de progresso, no selo ao lado e numa colina baixa.">
            <PhoneExercise />
          </Fig>
          <Fig kind="phone" name="Lição: abertura" note="A etiqueta da lição leva a cor da unidade. O gatinho acena e as três palavras aparecem em cartões.">
            <PhoneOpening />
          </Fig>
          <Fig kind="phone" name="Tela inicial" note="Logo colorido, sol atrás do gatinho e colinas claras. O arco-íris brilha e as nuvens passam.">
            <PhoneStart />
          </Fig>
          <Fig kind="phone" name="Álbum" note="Cada unidade mostra sua faixa; as próximas já aparecem nas cores delas, bloqueadas. A figurinha ganha fica numa ilha da unidade.">
            <PhoneAlbum />
          </Fig>
          <Fig kind="phone" name="Memória: início" note="Mesmo fundo; a aba usa o azul. Os cartões prontos balançam de leve para chamar o toque em Treinar.">
            <PhoneMemory />
          </Fig>
        </div>
      </section>
      <section data-sheet="14-caminho2-tablet">
        <h2>Tablet deitado</h2>
        <div className="row">
          <Fig kind="tablet" name="Mapa, topo da Unidade 1" note="A ilha ocupa a tela e a coluna da esquerda abre espaço para as figurinhas grandes. A faixa mostra número, nome e progresso.">
            <TabletMapTop />
          </Fig>
          <Fig kind="tablet" name="Lição: exercício" note="Quatro cartões em fila, fundo calmo e a colina da unidade embaixo.">
            <TabletExercise />
          </Fig>
        </div>
      </section>
      <section data-sheet="15-caminho2-cores-das-unidades" className="is-units">
        <h2>As sete unidades: cor, faixa, ícone e figurinhas</h2>
        <div className="stack">
          {UNITS.map((u) => (
            <UnitRow key={u.n} u={u} />
          ))}
        </div>
      </section>
    </main>
  );
}

const css = `
.device figcaption.cap{text-align:left;font-weight:400;margin-top:14px}
.device figcaption.cap b{display:block;font-family:"Baloo 2";font-weight:800;font-size:21px;line-height:1.15}
.device figcaption.cap small{display:block;font-family:Nunito;font-weight:700;font-size:15px;line-height:1.4;color:#4A4F66;margin-top:6px}
.device.is-phone{width:410px}
.device.is-tablet{width:1044px}
.device .screen{background:#F4FAFF}
.stk{position:absolute;display:block;overflow:visible;filter:drop-shadow(2.5px 0 0 #fff) drop-shadow(-2.5px 0 0 #fff) drop-shadow(0 2.5px 0 #fff) drop-shadow(0 -2.5px 0 #fff) drop-shadow(0 4px 3px rgba(43,45,66,.16))}

.chip,.bubble,.pill,.node-label{box-shadow:0 4px 0 rgba(43,45,66,.12)}
.bubble{box-shadow:0 5px 0 rgba(43,45,66,.12)}
.bar{box-shadow:inset 0 0 0 3px #fff,0 4px 0 rgba(43,45,66,.12)}
.node-label.is-locked{background:rgba(255,255,255,.8)}
.tile{box-shadow:0 9px 0 #C5CFDC}
.nav{box-shadow:0 -5px 0 rgba(43,45,66,.07)}
.nav.is-wide{box-shadow:0 6px 0 rgba(43,45,66,.12)}

.topbar{position:absolute;left:14px;right:14px;top:12px;display:flex;justify-content:space-between;align-items:center;gap:8px;z-index:6}
.topbar-r{display:flex;align-items:center;gap:8px}
.mbtn{width:46px;height:46px;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:0 4px 0 rgba(43,45,66,.12)}

.nav.is-3{padding:0 10px;justify-content:space-between}
.nav.is-3 .tab{font-size:18px;gap:6px;padding:9px 12px;position:relative}
.nav.is-3.is-wide{width:520px;padding:0 14px}
.tab.is-sky{background:#4AA8F0;box-shadow:0 5px 0 #2C82CC}
.tab.is-gold{background:#FFC93C;color:#2B2D42;box-shadow:0 5px 0 #DE9F12}
.tab-badge{position:absolute;top:-8px;right:-6px;min-width:26px;height:26px;border-radius:13px;background:#FF7A6B;color:#fff;font-family:Nunito;font-weight:900;font-size:15px;line-height:22px;text-align:center;border:3px solid #FFF8EC}

/* the unit banner */
.ban{position:relative;display:flex;align-items:center;gap:12px;min-height:106px;padding:12px 16px 14px 14px;border-radius:30px;background:var(--u);box-shadow:0 8px 0 var(--ud),0 14px 0 rgba(43,45,66,.10);color:#fff;z-index:3}
.ban::before{content:"";position:absolute;left:22px;right:22px;top:7px;height:6px;border-radius:6px;background:rgba(255,255,255,.3)}
.ban-deco{position:absolute;inset:0;border-radius:inherit;overflow:hidden;pointer-events:none}
.ban-rb{position:absolute;left:0;right:0;bottom:0;height:7px;display:flex}
.ban-rb i{flex:1}
.ban-ic{position:relative;flex:none;width:64px;height:64px;border-radius:22px;background:#fff;display:grid;place-items:center;box-shadow:0 4px 0 rgba(0,0,0,.14)}
.ban-text{position:relative;flex:1;min-width:0}
.ban-text small{display:block;font-family:Nunito;font-weight:900;font-size:14px;line-height:1.1;color:rgba(255,255,255,.9)}
.ban-text strong{display:block;font-family:"Baloo 2";font-weight:800;font-size:25px;line-height:1.02;color:#fff;text-shadow:0 2px 0 var(--ud)}
.ban-prog{position:relative;flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.ban-bar{display:block;width:70px;height:14px;border-radius:8px;background:rgba(0,0,0,.22);overflow:hidden}
.ban-bar i{display:block;height:100%;border-radius:8px;background:#fff}
.ban-prog em{font-style:normal;font-family:Nunito;font-weight:900;font-size:13px;color:#fff}
.ban-lock{position:relative;flex:none;width:48px;height:48px;border-radius:50%;background:rgba(0,0,0,.2);display:grid;place-items:center}
.ban.is-compact{min-height:86px;padding-top:10px;padding-bottom:12px}
.ban.is-compact .ban-ic{width:54px;height:54px;border-radius:18px}
.ban.is-compact .ban-text strong{font-size:23px}

/* lesson */
.ubadge{flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center}
.upill{color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.18)}
.lesson.is-tablet .ubadge{width:50px;height:50px}

/* start */
.logo{font-size:96px;letter-spacing:0;text-shadow:0 6px 0 rgba(43,45,66,.16)}
.logo span{-webkit-text-stroke:11px #fff;paint-order:stroke fill}
.tagline{color:#2B2D42;font-size:24px}

/* album */
.album{position:absolute;inset:0}
.album-st{position:absolute;left:0;right:0;top:206px;display:flex;justify-content:center;filter:drop-shadow(0 6px 0 rgba(43,45,66,.12))}

/* memory */
.mtab{position:absolute;inset:0;padding:74px 20px 100px;display:flex;flex-direction:column;align-items:center;gap:14px}
.mtab-title{margin:0;font-family:"Baloo 2";font-weight:800;font-size:38px;line-height:1;color:#2B2D42}
.guide-row{display:flex;align-items:center;gap:10px;width:100%}
.guide-row .bubble{flex:1}
.pile{position:relative;margin-top:8px}
.pile-card{position:absolute;top:0;background:#fff;border-radius:26px;border:5px solid #E1E7EF;box-shadow:0 8px 0 #C5CFDC;display:grid;place-items:center}
.mtab-count{margin:6px 0 0;font-family:"Baloo 2";font-weight:800;font-size:24px;background:#fff;border-radius:18px;padding:8px 18px 6px;box-shadow:0 4px 0 rgba(43,45,66,.12)}
.mtab-count b{color:#2C82CC;font-size:30px}
.mtab > .btn{width:100%;margin-top:auto}

/* the seven units sheet */
section.is-units{padding-bottom:36px}
.stack{display:flex;flex-direction:column;gap:30px}
.urow{position:relative;width:1000px;height:176px;border-radius:40px;overflow:hidden;background:#F4FAFF;box-shadow:0 6px 0 #D5DBE6}
.urow-kit,.urow-nodes{position:absolute;inset:0}
.urow-chip{position:absolute;left:24px;bottom:10px;display:inline-flex;align-items:center;gap:7px;font-family:Nunito;font-weight:900;font-size:13px;color:#4A4F66;z-index:5}
.urow-chip i{display:block;width:14px;height:14px;border-radius:50%}
`;

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
${fontsLink}
<style>${artCss}</style><style>${baseCss}${css}</style></head>
<body>${renderToStaticMarkup(<Page />)}</body></html>`;

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "direction-mockups.html"), html);
console.log(`wrote ${resolve(outDir, "direction-mockups.html")}`);
void PH;
