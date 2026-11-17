// Static mockups of three richer BACKGROUND styles for the trail map and the lesson screen, for the
// product owner to choose from. The foreground (trail, stops, sign, chips, cat, bubble, tiles, nav) is the
// approved one; only the backdrop changes. Everything is hand-drawn SVG, no images. Pictures for review only:
// no app screen imports this file.
//   npx tsx tools/visual/background-mockups.tsx
//   node tools/visual/frames.cjs tools/visual/.out/background-mockups.html tools/visual/.out/background-mockups 2
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Animal } from "@/art/Animal";
import { Cat } from "@/art/Cat";
import {
  artCss,
  Bubble,
  css as baseCss,
  fontsLink,
  Glyph,
  LessonTop,
  outDir,
  PH,
  PW,
  SpeakerButton,
  Tile,
  TopChips,
  TrailScene,
  Trees,
  TH,
  TW,
  WoodSign,
  type Kind,
} from "./mockups";

/* ================================================================== */
/* foreground: copied from mockups.tsx (not exported there)            */
/* ================================================================== */

type State = "done" | "current" | "locked";
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
    <div className="node" style={{ left: x - s / 2, top: y - s / 2, width: s, height: s }} data-state={state}>
      {state === "current" && <span className="node-ring" />}
      <span className="node-disc" style={{ background: fill, boxShadow: `0 9px 0 ${edge}, 0 15px 0 rgba(31,60,40,.18)` }}>
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

type P = [number, number];

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

/** Points sampled along the same curve the trail uses, for scattering pebbles. */
function trailSamples(points: P[], extendTo: number, perSeg = 14): P[] {
  const segs: [P, P, P, P][] = [];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const dy = (y1 - y0) / 2;
    segs.push([[x0, y0], [x0, y0 + dy], [x1, y1 - dy], [x1, y1]]);
  }
  const [lx, ly] = points[points.length - 1];
  segs.push([[lx, ly], [lx, ly + 50], [lx + 30, extendTo - 40], [lx + 30, extendTo]]);
  const out: P[] = [];
  for (const [a, b, c, d] of segs)
    for (let k = 0; k < perSeg; k++) {
      const t = k / perSeg;
      const m = 1 - t;
      out.push([m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0], m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1]]);
    }
  return out;
}

function Trail({ points, w, h, extendTo }: { points: P[]; w: number; h: number; extendTo?: number }) {
  const d = trailPath(points, extendTo);
  return (
    <svg className="layer" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <path d={d} fill="none" stroke="#D9B873" strokeWidth="54" strokeLinecap="round" />
      <path d={d} fill="none" stroke="#F6DDA6" strokeWidth="46" strokeLinecap="round" />
      <path d={d} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 20" opacity=".85" />
    </svg>
  );
}

function BottomNav({ wide }: { wide?: boolean }) {
  return (
    <nav className={`nav ${wide ? "is-wide" : ""}`}>
      <span className="tab is-active">
        <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
          <path d="M9 28 C9 20 23 22 23 14 C23 8 14 9 14 4" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="9" cy="28" r="3.5" fill="currentColor" />
          <circle cx="14" cy="4" r="3.5" fill="currentColor" />
        </svg>
        Trilha
      </span>
      <span className="tab">
        <svg viewBox="-20 -18 40 36" width="30" height="27" aria-hidden="true">
          <path d="M-17 -12 q9 -4 17 2 q8 -6 17 -2 v24 q-9 -4 -17 2 q-8 -6 -17 -2z" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M0 -10 v24" stroke="currentColor" strokeWidth="3" />
        </svg>
        Álbum
      </span>
    </nav>
  );
}

const P_POINTS: P[] = [[118, 236], [214, 324], [278, 412], [206, 500], [118, 588], [196, 676]];
const T_POINTS: P[] = [[540, 128], [680, 226], [774, 324], [670, 422], [540, 520], [650, 618]];
const P_SIDES: ("left" | "right")[] = ["right", "left", "left", "right", "right", "right"];
const T_SIDES: ("left" | "right")[] = ["right", "right", "right", "right", "left", "left"];
const UNIT_STOPS: { kind: Kind; label: string }[] = [
  { kind: "song", label: "Música" },
  { kind: "lesson", label: "Lição 1" },
  { kind: "lesson", label: "Lição 2" },
  { kind: "lesson", label: "Lição 3" },
  { kind: "story", label: "História" },
  { kind: "challenge", label: "Desafio" },
];
const stateOf = (i: number, done: number): State => (i < done ? "done" : i === done ? "current" : "locked");

/** Everything above the backdrop on the map: trail, stops, cat, sign, chips, nav. Identical for all styles. */
function MapFg({ device }: { device: "phone" | "tablet" }) {
  const tab = device === "tablet";
  const pts = tab ? T_POINTS : P_POINTS;
  const [w, h] = tab ? [TW, TH] : [PW, PH];
  return (
    <>
      <Trail points={pts} w={w} h={h} extendTo={h} />
      {UNIT_STOPS.map((s, i) => {
        const [x, y] = pts[i];
        const state = stateOf(i, 2);
        return <TrailNode key={i} x={x} y={y} size={tab ? 84 : 76} kind={s.kind} state={state} label={state === "current" ? undefined : s.label} side={(tab ? T_SIDES : P_SIDES)[i]} />;
      })}
      {tab ? (
        <>
          <div className="guide" style={{ left: 836, top: 232 }}>
            <Bubble tail="down">
              <b>Lição 2</b> Vamos!
            </Bubble>
            <Cat expression="pointing" size={120} />
          </div>
          <span className="peek" style={{ left: 178, top: 486 }}>
            <Animal id="frog" size={76} />
          </span>
          <span className="peek" style={{ left: 296, top: 360 }}>
            <Animal id="bear" size={96} />
          </span>
          <span className="peek" style={{ left: 380, top: 236 }}>
            <Animal id="bird" size={60} />
          </span>
          <WoodSign unit="Unidade 1" title="Animais da floresta" done={2} total={6} style={{ left: 28, top: 84, width: 380 }} />
          <WoodSign unit="Unidade 2" title="Cores" locked compact style={{ left: 724, top: 664, width: 270 }} />
        </>
      ) : (
        <>
          <div className="guide" style={{ left: 8, top: 384 }}>
            <Bubble tail="down">
              <b>Lição 2</b> Vamos!
            </Bubble>
            <Cat expression="pointing" size={92} />
          </div>
          <span className="peek" style={{ left: 306, top: 232 }}>
            <Animal id="bird" size={54} />
          </span>
          <WoodSign unit="Unidade 1" title="Animais da floresta" done={2} total={6} style={{ left: 20, top: 66, width: 350 }} />
        </>
      )}
      <TopChips stars={2} days={3} />
      <BottomNav wide={tab} />
    </>
  );
}

/** The lesson exercise on top of the backdrop (phone). */
function LessonFg() {
  const tiles = ["bird", "bear", "frog", "mouse"] as const;
  return (
    <div className="lesson">
      <LessonTop ratio={0.3} />
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
  );
}

/* ================================================================== */
/* drawing helpers                                                     */
/* ================================================================== */

const f = (n: number) => Math.round(n * 10) / 10;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Catmull-Rom through the points, as cubic beziers. `first` lets a path continue from the previous one. */
function smooth(p: P[], first = "M"): string {
  let d = `${first}${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

function smoothClosed(p: P[]): string {
  const n = p.length;
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + "Z";
}

function ridge(w: number, y0: number, amp: number, n: number, seed: number, rough = 0.8): P[] {
  const r = rng(seed);
  const pts: P[] = [];
  for (let i = 0; i <= n; i++) pts.push([-40 + (i * (w + 80)) / n, y0 + amp * (Math.sin(i * 1.7 + seed) * 0.6 + (r() - 0.5) * rough)]);
  return pts;
}

function ridgeY(pts: P[], x: number): number {
  for (let i = 0; i < pts.length - 1; i++) {
    if (x >= pts[i][0] && x <= pts[i + 1][0]) {
      const t = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
      return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
    }
  }
  return pts[pts.length - 1][1];
}

const hillPath = (pts: P[], w: number, h: number) => `${smooth(pts)} L${w + 40} ${h} L-40 ${h} Z`;

function blobPts(cx: number, cy: number, rx: number, ry: number, seed: number, wob = 0.1, n = 10): P[] {
  const r = rng(seed);
  const out: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * 2 * wob;
    out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return out;
}
const blob = (cx: number, cy: number, rx: number, ry: number, seed: number, wob = 0.1, n = 10) => smoothClosed(blobPts(cx, cy, rx, ry, seed, wob, n));

/** Small tree silhouettes standing on a ridge, as one path. */
function treeline(pts: P[], x0: number, x1: number, step: number, hMin: number, hMax: number, seed: number, yOff = 3): string {
  const r = rng(seed);
  let d = "";
  for (let x = x0; x < x1; x += step * (0.7 + r() * 0.6)) {
    const y = ridgeY(pts, x) + yOff;
    const hh = hMin + r() * (hMax - hMin);
    if (r() < 0.55) {
      const hw = hh * 0.3;
      d += `M${f(x - hw)} ${f(y)}L${f(x)} ${f(y - hh)}L${f(x + hw)} ${f(y)}Z`;
    } else {
      const rr = hh * 0.38;
      d += `M${f(x - rr)} ${f(y)}a${f(rr)} ${f(rr)} 0 1 1 ${f(rr * 2)} 0Z`;
    }
  }
  return d;
}

type Cfg = { w: number; h: number; uid: string; mode: "map" | "lesson"; device: "phone" | "tablet" };

/* ---------- little objects shared by A and C ---------- */

type Pal = { dark: string; mid: string; light: string };
const GREEN: Pal = { dark: "#2F9A55", mid: "#4DB868", light: "#9BE8A4" };
const LIME: Pal = { dark: "#6DB83F", mid: "#8ED04F", light: "#D4F58A" };
const GOLD: Pal = { dark: "#D9A62B", mid: "#F2C23F", light: "#FFE98F" };

type TreeKind = "pine" | "round" | "birch" | "cypress" | "bush";

function TreeA({ k, x, y, s = 1, pal = GREEN, shadow = true }: { k: TreeKind; x: number; y: number; s?: number; pal?: Pal; shadow?: boolean }) {
  return (
    <g transform={`translate(${f(x)} ${f(y)}) scale(${s})`}>
      {shadow && <ellipse cx="9" cy="3" rx={k === "pine" ? 38 : 34} ry="8" fill="#1B6B45" opacity=".24" />}
      {k === "pine" && (
        <>
          <rect x="-5" y="-26" width="10" height="26" rx="3" fill="#8B5A3C" />
          <rect x="0" y="-26" width="5" height="26" rx="2" fill="#A87049" />
          {[
            [40, -12, -70],
            [33, -40, -96],
            [25, -66, -122],
          ].map(([hw, base, top], i) => (
            <g key={i}>
              <path d={`M${-hw} ${base} Q0 ${base + 7} ${hw} ${base} L0 ${top}Z`} fill="#2F9A55" />
              <path d={`M0 ${top} L${hw} ${base} Q${hw / 2} ${base + 5} 0 ${base + 4}Z`} fill="#4DB868" />
              <path d={`M0 ${top + 6} L${hw * 0.82} ${base - 4}`} stroke="#9BE8A4" strokeWidth="2.6" strokeLinecap="round" opacity=".55" fill="none" />
            </g>
          ))}
        </>
      )}
      {k === "round" && (
        <>
          <path d="M-5 0 L-4 -34 Q-4 -40 -13 -50 L-9 -53 Q0 -45 0 -40 Q2 -47 10 -57 L14 -54 Q4 -45 5 -34 L7 0Z" fill="#8B5A3C" />
          <path d="M1 0 L1 -38 Q3 -45 10 -57 L14 -54 Q4 -45 5 -34 L7 0Z" fill="#A87049" />
          <g fill={pal.dark}>
            <circle cx="0" cy="-72" r="34" />
            <circle cx="-26" cy="-56" r="22" />
            <circle cx="27" cy="-54" r="24" />
          </g>
          <g fill={pal.mid}>
            <circle cx="4" cy="-78" r="29" />
            <circle cx="-24" cy="-62" r="17" />
            <circle cx="28" cy="-60" r="19" />
          </g>
          <g fill={pal.light} opacity=".85">
            <circle cx="13" cy="-88" r="14" />
            <circle cx="31" cy="-68" r="6" />
            <circle cx="-18" cy="-74" r="6" />
          </g>
        </>
      )}
      {k === "birch" && (
        <>
          <rect x="-4" y="-84" width="8" height="84" rx="2" fill="#F3EEE2" />
          <rect x="1" y="-84" width="3" height="84" fill="#DCD3BE" />
          {[-14, -30, -44, -62, -74].map((yy, i) => (
            <rect key={i} x={i % 2 ? -4 : -1} y={yy} width="5" height="3" rx="1" fill="#5B4B3C" />
          ))}
          <ellipse cx="0" cy="-96" rx="27" ry="30" fill="#6FBF52" />
          <ellipse cx="-17" cy="-76" rx="15" ry="17" fill="#6FBF52" />
          <ellipse cx="19" cy="-72" rx="16" ry="18" fill="#6FBF52" />
          <ellipse cx="4" cy="-101" rx="21" ry="25" fill="#9EDB6B" />
          <ellipse cx="-16" cy="-80" rx="10" ry="12" fill="#9EDB6B" />
          <ellipse cx="11" cy="-110" rx="9" ry="11" fill="#D8F8A0" opacity=".9" />
        </>
      )}
      {k === "cypress" && (
        <>
          <rect x="-3" y="-14" width="6" height="14" fill="#8B5A3C" />
          <path d="M0 -124 C23 -94 25 -44 15 -12 L-15 -12 C-25 -44 -23 -94 0 -124Z" fill="#2A8F58" />
          <path d="M0 -124 C23 -94 25 -44 15 -12 L0 -12Z" fill="#45B06A" />
          <path d="M5 -106 C14 -84 15 -52 11 -26" stroke="#9BE8A4" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".5" />
        </>
      )}
      {k === "bush" && (
        <>
          <g fill={pal.dark}>
            <circle cx="-14" cy="-14" r="15" />
            <circle cx="12" cy="-16" r="17" />
            <circle cx="0" cy="-24" r="15" />
          </g>
          <g fill={pal.mid}>
            <circle cx="-12" cy="-18" r="11" />
            <circle cx="14" cy="-20" r="12" />
            <circle cx="2" cy="-28" r="11" />
          </g>
          <circle cx="8" cy="-31" r="5" fill={pal.light} opacity=".8" />
        </>
      )}
    </g>
  );
}

function FlowerA({ x, y, c = "#fff", s = 1 }: { x: number; y: number; c?: string; s?: number }) {
  return (
    <g transform={`translate(${f(x)} ${f(y)}) scale(${s})`}>
      <path d="M0 0 Q2 -6 0 -12" stroke="#2F9A55" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={Math.cos((i / 5) * 6.283) * 4.6} cy={-14 + Math.sin((i / 5) * 6.283) * 4.6} r="3.7" fill={c} />
      ))}
      <circle cx="0" cy="-14" r="2.8" fill="#FFC93C" />
    </g>
  );
}

function Tuft({ x, y, s = 1, c = "#3FA85A", c2 = "#7BD98A" }: { x: number; y: number; s?: number; c?: string; c2?: string }) {
  return (
    <g transform={`translate(${f(x)} ${f(y)}) scale(${s})`}>
      <path d="M-7 0 Q-6 -9 -12 -16 Q-2 -10 -1 0Z M3 0 Q6 -9 13 -13 Q8 -6 9 0Z" fill={c} />
      <path d="M-2 0 Q0 -12 -3 -20 Q5 -12 4 0Z" fill={c2} />
    </g>
  );
}

function Rock({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${f(x)} ${f(y)}) scale(${s})`}>
      <ellipse cx="3" cy="1" rx="20" ry="4" fill="#1B6B45" opacity=".25" />
      <path d="M-16 0 Q-18 -10 -8 -15 Q2 -20 12 -13 Q19 -8 17 0Z" fill="#9CA6B8" />
      <path d="M-16 0 Q-18 -4 -17 -6 L17 -4 Q19 -2 17 0Z" fill="#7A8499" />
      <path d="M-8 -15 Q2 -20 12 -13 Q14 -11 14 -9 Q2 -12 -9 -9Z" fill="#D2D9E6" />
    </g>
  );
}

function Shroom({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${f(x)} ${f(y)}) scale(${s})`}>
      <path d="M-3 0 Q-4 -9 -3 -12 L3 -12 Q4 -9 3 0Z" fill="#FFF3DF" />
      <path d="M-12 -11 Q-11 -25 0 -25 Q11 -25 12 -11Z" fill="#FF7A6B" />
      <path d="M0 -25 Q11 -25 12 -11 L6 -11 Q7 -20 0 -25Z" fill="#E65A4B" />
      <circle cx="-5" cy="-17" r="2.3" fill="#fff" />
      <circle cx="3" cy="-20" r="1.8" fill="#fff" />
    </g>
  );
}

function Cloud({ x, y, s = 1, id }: { x: number; y: number; s?: number; id: string }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M-44 0 C-62 0 -60 -26 -36 -24 C-34 -48 -2 -52 6 -32 C16 -52 52 -46 50 -22 C70 -22 68 0 48 0 Z" fill={`url(#${id})`} />;
}

function Pond({ cx, cy, rx, ry, uid, seed = 5 }: { cx: number; cy: number; rx: number; ry: number; uid: string; seed?: number }) {
  return (
    <g>
      <path d={blob(cx, cy + 6, rx + 12, ry + 9, seed, 0.06, 12)} fill="#8FD97A" opacity=".55" />
      <path d={blob(cx, cy + 8, rx + 4, ry + 4, seed, 0.06, 12)} fill="#2D8F57" opacity=".35" />
      <path d={blob(cx, cy, rx, ry, seed, 0.06, 12)} fill={`url(#${uid}-water)`} />
      <g opacity=".34" fill="#1F7A4D">
        <ellipse cx={cx + rx * 0.3} cy={cy - ry * 0.4} rx={rx * 0.1} ry={ry * 0.3} />
        <ellipse cx={cx + rx * 0.5} cy={cy - ry * 0.32} rx={rx * 0.14} ry={ry * 0.24} />
        <ellipse cx={cx - rx * 0.46} cy={cy - ry * 0.4} rx={rx * 0.09} ry={ry * 0.26} />
      </g>
      <ellipse cx={cx - rx * 0.28} cy={cy - ry * 0.12} rx={rx * 0.34} ry={ry * 0.18} fill="#E6F7FF" opacity=".5" />
      <g stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".6">
        <path d={`M${cx + rx * 0.1} ${cy + ry * 0.1} h${rx * 0.2}`} />
        <path d={`M${cx + rx * 0.35} ${cy + ry * 0.3} h${rx * 0.14}`} />
        <path d={`M${cx - rx * 0.5} ${cy + ry * 0.35} h${rx * 0.16}`} />
      </g>
      <g fill="none" stroke="#fff" strokeWidth="1.6" opacity=".4">
        <ellipse cx={cx + rx * 0.45} cy={cy + ry * 0.05} rx={rx * 0.13} ry={ry * 0.1} />
        <ellipse cx={cx + rx * 0.45} cy={cy + ry * 0.05} rx={rx * 0.2} ry={ry * 0.16} />
      </g>
      {[[0.5, 0.45, 15], [-0.15, 0.55, 12], [0.12, 0.2, 10]].map(([a, b, r], i) => (
        <g key={i} transform={`translate(${cx + rx * a} ${cy + ry * b})`}>
          <ellipse rx={r} ry={r * 0.45} fill="#3FA85A" />
          <ellipse rx={r * 0.7} ry={r * 0.3} cy={-1} fill="#6FD27F" />
          {i === 0 && <circle cx="2" cy="-3" r="3.2" fill="#FF8FA3" />}
        </g>
      ))}
      <Rock x={cx - rx - 2} y={cy + ry * 0.5} s={0.9} />
      <Rock x={cx + rx * 0.7} y={cy + ry + 6} s={0.7} />
      <g stroke="#3FA85A" strokeWidth="2.4" strokeLinecap="round">
        <path d={`M${cx + rx + 4} ${cy + 6} q-3 -26 2 -40`} fill="none" />
        <path d={`M${cx + rx + 12} ${cy + 8} q2 -22 -2 -32`} fill="none" />
      </g>
      <ellipse cx={cx + rx + 6} cy={cy - 34} rx="3.2" ry="8" fill="#8B5A3C" />
      <ellipse cx={cx + rx + 9} cy={cy - 24} rx="3" ry="7" fill="#8B5A3C" transform={`rotate(8 ${cx + rx + 9} ${cy - 24})`} />
    </g>
  );
}

function Brook({ uid, y0, h, cx0, slope, hw0, hws }: { uid: string; y0: number; h: number; cx0: number; slope: number; hw0: number; hws: number }) {
  const L: P[] = [];
  const R: P[] = [];
  const BL: P[] = [];
  const BR: P[] = [];
  for (let y = y0; y <= h + 30; y += 26) {
    const cx = cx0 + (y - y0) * slope + 7 * Math.sin(y / 52);
    const hw = (hw0 + (y - y0) * hws) * Math.min(1, 0.08 + (y - y0) / 110);
    L.push([cx - hw, y]);
    R.push([cx + hw, y]);
    BL.push([cx - hw - 8, y]);
    BR.push([cx + hw + 9, y]);
  }
  const poly = (a: P[], b: P[]) => `${smooth(a)} ${smooth([...b].reverse(), "L")} Z`;
  const mid = L.map(([x, y], i) => [(x + R[i][0]) / 2, y] as P);
  return (
    <g>
      <path d={poly(BL, BR)} fill="#B9EA8E" opacity=".8" />
      <path d={poly(L, R)} fill={`url(#${uid}-brook)`} />
      <path d={smooth(mid.map(([x, y]) => [x - 5, y]))} fill="none" stroke="#fff" strokeWidth="2.6" strokeDasharray="14 26" strokeLinecap="round" opacity=".55" />
      <path d={smooth(mid.map(([x, y]) => [x + 9, y + 12]))} fill="none" stroke="#CFEFFF" strokeWidth="2" strokeDasharray="9 34" strokeLinecap="round" opacity=".6" />
      {mid.filter((_, i) => i % 4 === 2).map(([x, y], i) => (
        <Rock key={i} x={x + (i % 2 ? 16 : -18)} y={y + 4} s={0.5} />
      ))}
    </g>
  );
}

/* ================================================================== */
/* A. Forest with depth                                                */
/* ================================================================== */

function BgA({ w, h, uid, mode, device }: Cfg) {
  const tab = device === "tablet";
  const les = mode === "lesson";
  const hz = les ? 238 : tab ? 104 : 172;
  const [sx, sy, sr] = les ? [w - 34, 18, 46] : tab ? [w - 126, hz + 6, 46] : [w - 96, hz + 16, 30];
  const layers = [
    { y: hz, amp: 14, n: 6, seed: 3, g: ["#C6E0F2", "#A9D2E8"], tree: "#9CC8DE", t: [9, 17] },
    { y: hz + 26, amp: 13, n: 7, seed: 8, g: ["#A9DDCE", "#8FCEBC"], tree: "#7DBDAE", t: [11, 21] },
    { y: hz + 54, amp: 15, n: 6, seed: 15, g: ["#92D8A2", "#70C786"], tree: "#58B070", t: [14, 26] },
    { y: hz + 92, amp: 13, n: 5, seed: 21, g: ["#76CE83", "#58BA68"], tree: "#4CAA5F", t: [20, 34] },
    { y: hz + 132, amp: 11, n: 5, seed: 30, g: ["#66CC74", "#4DB35E"], tree: "", t: [0, 0] },
  ];
  const sunRays: ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const a = 1.55 + i * 0.2 + (i % 2) * 0.03;
    const R = 1300;
    sunRays.push(<path key={i} d={`M${sx} ${sy} L${f(sx + Math.cos(a - 0.034) * R)} ${f(sy + Math.sin(a - 0.034) * R)} L${f(sx + Math.cos(a + 0.034) * R)} ${f(sy + Math.sin(a + 0.034) * R)}Z`} fill={`url(#${uid}-ray)`} />);
  }
  const patches: ReactNode[] = [];
  for (let y = hz + 150, i = 0; y < h + 80; y += 150, i++) {
    patches.push(<ellipse key={`d${i}`} cx={i % 2 ? w * 0.2 : w * 0.82} cy={y} rx={w * 0.3} ry="42" fill={`url(#${uid}-pd)`} />);
    patches.push(<ellipse key={`l${i}`} cx={i % 2 ? w * 0.8 : w * 0.22} cy={y + 64} rx={w * 0.26} ry="34" fill={`url(#${uid}-pl)`} />);
  }
  const R2 = rng(77);
  const L5 = layers.map((l) => ridge(w, l.y, l.amp, l.n, l.seed));

  type T = [TreeKind, number, number, number, Pal?];
  const trees: T[] = les
    ? [
        ["pine", 26, 676, 0.8],
        ["round", 360, 640, 0.62, LIME],
        ["birch", 22, 790, 0.72],
        ["round", 372, 760, 0.78, GOLD],
        ["bush", 330, 826, 1],
        ["cypress", 346, 330, 0.5],
        ["pine", 18, 320, 0.5],
      ]
    : tab
      ? [
          ["pine", 46, 318, 0.9],
          ["pine", 112, 338, 0.62],
          ["birch", 232, 290, 0.74],
          ["round", 946, 330, 0.74, LIME],
          ["pine", 994, 352, 0.6],
          ["cypress", 900, 470, 0.7],
          ["pine", 944, 540, 1.0],
          ["round", 420, 690, 0.8, GOLD],
          ["pine", 52, 770, 1.3],
          ["birch", 340, 740, 0.9],
          ["bush", 120, 690, 1],
        ]
      : [
          ["pine", 30, 340, 0.6],
          ["round", 354, 326, 0.5, LIME],
          ["pine", 360, 482, 0.84],
          ["pine", 334, 504, 0.54],
          ["birch", 364, 652, 0.78],
          ["round", 356, 746, 0.74, GOLD],
          ["cypress", 66, 366, 0.42],
          ["bush", 56, 532, 0.8],
        ];
  trees.sort((a, b) => a[2] - b[2]);

  const flowers: [number, number, string, number][] = les
    ? [[40, 640, "#FF8FA3", 1], [70, 662, "#fff", 0.9], [52, 700, "#FFC93C", 0.9], [300, 680, "#fff", 1], [322, 700, "#FF8FA3", 0.9], [200, 800, "#fff", 1], [226, 818, "#FF8FA3", 0.9], [110, 760, "#FFC93C", 1], [140, 830, "#fff", 0.9], [270, 790, "#FF8FA3", 1]]
    : tab
      ? [[380, 430, "#fff", 1], [420, 450, "#FF8FA3", 0.9], [780, 700, "#fff", 1], [880, 740, "#FF8FA3", 1], [330, 620, "#FFC93C", 0.9], [90, 440, "#fff", 1], [120, 470, "#FF8FA3", 0.9], [470, 540, "#fff", 0.9], [860, 420, "#FFC93C", 0.9], [60, 640, "#FF8FA3", 1], [250, 700, "#fff", 0.9], [460, 760, "#FF8FA3", 0.9]]
      : [[62, 420, "#fff", 1], [86, 440, "#FF8FA3", 0.9], [330, 600, "#FF8FA3", 1], [304, 618, "#fff", 0.9], [330, 752, "#fff", 1], [88, 762, "#FF8FA3", 1], [60, 700, "#FFC93C", 0.9], [270, 590, "#FFC93C", 0.9], [160, 760, "#fff", 0.9], [300, 330, "#fff", 0.9]];
  const tufts: [number, number, number][] = les
    ? [[110, 640, 1], [250, 650, 1], [36, 740, 1.1], [330, 800, 1.1], [180, 760, 1], [86, 818, 1.2], [266, 730, 0.9], [150, 700, 0.9]]
    : tab
      ? [[200, 330, 1], [500, 300, 1], [320, 540, 1.1], [60, 560, 1.1], [840, 600, 1], [480, 670, 1], [180, 740, 1.2], [880, 300, 1], [760, 480, 0.9], [400, 360, 0.9], [610, 700, 1], [300, 460, 1]]
      : [[40, 410, 1], [310, 420, 1.1], [290, 540, 1], [260, 600, 1], [330, 690, 1.1], [60, 660, 1.1], [150, 520, 0.9], [350, 600, 1], [92, 800, 1.2], [270, 780, 1.1], [330, 395, 0.9]];
  const rocks: [number, number, number][] = les ? [[74, 700, 1], [318, 735, 0.9], [150, 810, 0.8]] : tab ? [[410, 520, 1], [250, 700, 1], [868, 630, 0.9], [560, 740, 0.7]] : [[312, 560, 0.9], [84, 720, 0.8], [284, 770, 0.8]];
  const shrooms: [number, number, number][] = les ? [[290, 826, 1.1], [60, 600, 0.9]] : tab ? [[800, 560, 1.1], [270, 640, 1], [470, 440, 0.9]] : [[310, 566, 1.2], [96, 770, 1.1]];

  return (
    <svg className="layer" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3F9AEA" />
          <stop offset=".35" stopColor="#74BDF5" />
          <stop offset=".75" stopColor="#B8E1FB" />
          <stop offset="1" stopColor="#FFF1CC" />
        </linearGradient>
        <radialGradient id={`${uid}-halo`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF6C2" stopOpacity=".95" />
          <stop offset=".4" stopColor="#FFE98F" stopOpacity=".45" />
          <stop offset="1" stopColor="#FFE98F" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-ray`} gradientUnits="userSpaceOnUse" cx={sx} cy={sy} r="720">
          <stop offset="0" stopColor="#FFF8D0" stopOpacity=".34" />
          <stop offset="1" stopColor="#FFF8D0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-cloud`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#CFE6F8" />
        </linearGradient>
        {layers.map((l, i) => (
          <linearGradient key={i} id={`${uid}-h${i}`} gradientUnits="userSpaceOnUse" x1="0" y1={l.y - 20} x2="0" y2={l.y + 150}>
            <stop offset="0" stopColor={l.g[0]} />
            <stop offset="1" stopColor={l.g[1]} />
          </linearGradient>
        ))}
        <radialGradient id={`${uid}-pd`}>
          <stop offset="0" stopColor="#1F7A4D" stopOpacity=".22" />
          <stop offset="1" stopColor="#1F7A4D" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-pl`}>
          <stop offset="0" stopColor="#D9FFB0" stopOpacity=".3" />
          <stop offset="1" stopColor="#D9FFB0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ED8FF" />
          <stop offset="1" stopColor="#3F9CE6" />
        </linearGradient>
        <linearGradient id={`${uid}-brook`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8ED8FF" />
          <stop offset="1" stopColor="#3F9CE6" />
        </linearGradient>
        <radialGradient id={`${uid}-vig`} cx="0.5" cy="0.5" r="0.78">
          <stop offset=".58" stopColor="#0E4A3A" stopOpacity="0" />
          <stop offset="1" stopColor="#0E4A3A" stopOpacity=".34" />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${uid}-sky)`} />
      {sunRays}
      <circle cx={sx} cy={sy} r={sr * 3.2} fill={`url(#${uid}-halo)`} />
      <circle cx={sx} cy={sy} r={sr * 1.35} fill="#FFE98F" opacity=".5" />
      <circle cx={sx} cy={sy} r={sr} fill="#FFE27A" />
      <circle cx={sx} cy={sy} r={sr * 0.7} fill="#FFF3B0" opacity=".7" />
      {/* clouds */}
      {les ? (
        <>
          <Cloud x={w * 0.62} y={74} s={0.8} id={`${uid}-cloud`} />
          <Cloud x={w * 0.9} y={150} s={0.55} id={`${uid}-cloud`} />
          <Cloud x={w * 0.34} y={226} s={0.6} id={`${uid}-cloud`} />
        </>
      ) : tab ? (
        <>
          <Cloud x={560} y={52} s={0.9} id={`${uid}-cloud`} />
          <Cloud x={190} y={46} s={0.7} id={`${uid}-cloud`} />
          <Cloud x={750} y={92} s={0.55} id={`${uid}-cloud`} />
          <Cloud x={430} y={98} s={0.5} id={`${uid}-cloud`} />
        </>
      ) : (
        <>
          <Cloud x={92} y={46} s={0.62} id={`${uid}-cloud`} />
          <Cloud x={250} y={136} s={0.46} id={`${uid}-cloud`} />
          <Cloud x={30} y={170} s={0.5} id={`${uid}-cloud`} />
        </>
      )}
      {/* hill layers, far to near */}
      {layers.map((l, i) => (
        <g key={i}>
          <path d={hillPath(L5[i], w, h)} fill={`url(#${uid}-h${i})`} />
          {l.tree && <path d={treeline(L5[i], -20, w + 20, i === 3 ? 22 : tab ? 22 : 17, l.t[0], l.t[1], 40 + i)} fill={l.tree} />}
          <path d={smooth(L5[i])} fill="none" stroke="#fff" strokeWidth="2.4" opacity={i < 2 ? 0.08 : 0.24} transform="translate(0 -1)" />
        </g>
      ))}
      {patches}
      {/* water */}
      {tab || les ? (
        <Pond cx={tab ? 210 : 290} cy={tab ? 580 : 738} rx={tab ? 150 : 96} ry={tab ? 46 : 28} uid={uid} />
      ) : (
        <Brook uid={uid} y0={528} h={h} cx0={20} slope={0.055} hw0={9} hws={0.03} />
      )}
      {trees.map(([k, x, y, s, pal], i) => (
        <TreeA key={i} k={k} x={x} y={y} s={s} pal={pal} />
      ))}
      {tufts.map(([x, y, s], i) => (
        <Tuft key={i} x={x} y={y} s={s} c={i % 3 ? "#3FA85A" : "#2F9A55"} />
      ))}
      {rocks.map(([x, y, s], i) => (
        <Rock key={i} x={x} y={y} s={s} />
      ))}
      {flowers.map(([x, y, c, s], i) => (
        <FlowerA key={i} x={x} y={y} c={c} s={s} />
      ))}
      {shrooms.map(([x, y, s], i) => (
        <Shroom key={i} x={x} y={y} s={s} />
      ))}
      {/* a few drifting petals / seeds */}
      <g fill="#fff" opacity=".7">
        {Array.from({ length: 9 }).map((_, i) => (
          <circle key={i} cx={f(R2() * w)} cy={f(hz + 60 + R2() * (h - hz - 100))} r={f(1.2 + R2() * 1.6)} />
        ))}
      </g>
      <rect width={w} height={h} fill={`url(#${uid}-vig)`} />
    </svg>
  );
}

/* ================================================================== */
/* B. Paper cut-out diorama                                            */
/* ================================================================== */

const SHADOW = "rgba(78,50,16,.30)";

function PaperTree({ k, x, y, s = 1, c = ["#4FAF63", "#74CF7E", "#A3E8A0"] }: { k: "round" | "pine" | "cloud"; x: number; y: number; s?: number; c?: string[] }) {
  const seed = Math.round(x * 3 + y);
  const g = `translate(${f(x)} ${f(y)}) scale(${s})`;
  if (k === "round") {
    const back = blob(0, -66, 38, 36, seed, 0.1, 9);
    const front = blob(-5, -72, 28, 26, seed + 4, 0.12, 8);
    return (
      <g transform={g}>
        <ellipse cx="6" cy="3" rx="30" ry="6" fill={SHADOW} />
        <path d="M-5 0 V-36 Q-5 -42 -3 -44 H4 Q6 -42 6 -36 V0Z" fill="#8E5A34" transform="translate(3 4)" opacity=".28" />
        <path d="M-5 0 V-36 Q-5 -42 -3 -44 H4 Q6 -42 6 -36 V0Z" fill="#B9733F" />
        <path d="M1 0 V-40 H4 Q6 -42 6 -36 V0Z" fill="#D18B52" />
        <path d={back} fill={SHADOW} transform="translate(3 5)" />
        <path d={back} fill={c[0]} />
        <path d={front} fill={SHADOW} transform="translate(2 3)" opacity=".8" />
        <path d={front} fill={c[1]} />
        <circle cx="-14" cy="-80" r="5" fill={c[2]} />
        <circle cx="8" cy="-64" r="4" fill={c[2]} />
        <circle cx="-4" cy="-56" r="3.2" fill={c[2]} />
      </g>
    );
  }
  if (k === "cloud") {
    return (
      <g transform={g}>
        <ellipse cx="6" cy="3" rx="26" ry="5" fill={SHADOW} />
        <rect x="-4" y="-30" width="8" height="30" rx="2" fill="#B9733F" />
        {[[-18, -44, 18], [14, -48, 20], [0, -62, 22]].map(([cx, cy, r], i) => (
          <circle key={`s${i}`} cx={cx + 3} cy={cy + 4} r={r} fill={SHADOW} />
        ))}
        {[[-18, -44, 18], [14, -48, 20], [0, -62, 22]].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill={c[i % 2 ? 1 : 0]} />
        ))}
        <circle cx="4" cy="-68" r="9" fill={c[2]} opacity=".9" />
      </g>
    );
  }
  const tiers: [number, number, number, string][] = [
    [38, -12, -66, c[0]],
    [31, -38, -90, c[1]],
    [23, -62, -112, c[2]],
  ];
  return (
    <g transform={g}>
      <ellipse cx="6" cy="3" rx="30" ry="6" fill={SHADOW} />
      <rect x="-5" y="-22" width="10" height="22" fill="#B9733F" />
      {tiers.map(([hw, base, top, col], i) => {
        const d = smoothClosed([[-hw, base], [-hw * 0.4, base + 3], [hw * 0.4, base + 3], [hw, base], [hw * 0.45, (base + top) / 2], [0, top], [-hw * 0.45, (base + top) / 2]].map(([a, b]) => [a + Math.sin(seed + i * 3 + b) * 1.2, b] as P));
        return (
          <g key={i}>
            <path d={d} fill={SHADOW} transform="translate(3 4)" />
            <path d={d} fill={col} />
          </g>
        );
      })}
    </g>
  );
}

function PaperFlower({ x, y, c, s = 1 }: { x: number; y: number; c: string; s?: number }) {
  return (
    <g transform={`translate(${f(x)} ${f(y)}) scale(${s})`}>
      <path d="M0 0 Q3 -8 0 -15" stroke="#3E9F55" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <g transform="translate(0 -17)">
        <g transform="translate(1.6 2.4)" fill={SHADOW}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx={Math.cos((i / 6) * 6.283) * 5.6} cy={Math.sin((i / 6) * 6.283) * 5.6} r="4.6" />
          ))}
        </g>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} cx={Math.cos((i / 6) * 6.283) * 5.6} cy={Math.sin((i / 6) * 6.283) * 5.6} r="4.6" fill={c} />
        ))}
        <circle r="3.4" fill="#FFC93C" />
      </g>
    </g>
  );
}

function BgB({ w, h, uid, mode, device }: Cfg) {
  const tab = device === "tablet";
  const les = mode === "lesson";
  const hz = les ? 236 : tab ? 108 : 174;
  const [sx, sy] = les ? [w - 62, 62] : tab ? [w - 124, hz - 4] : [w - 94, hz + 6];
  const defs = [
    { y: hz, amp: 14, n: 6, seed: 4, fill: "#FFD2AE", edge: "#FFE9D4" },
    { y: hz + 30, amp: 14, n: 7, seed: 9, fill: "#F6DC8E", edge: "#FFF0BC" },
    { y: hz + 62, amp: 15, n: 6, seed: 16, fill: "#C8E08A", edge: "#E6F5B4" },
    { y: hz + 100, amp: 13, n: 6, seed: 22, fill: "#93CF72", edge: "#C4EBA2" },
    { y: hz + 140, amp: 11, n: 5, seed: 31, fill: "#5CC46B", edge: "#9BE59E" },
  ];
  const rid = defs.map((l) => ridge(w, l.y, l.amp, l.n * (tab ? 2 : 1), l.seed, 1.1));
  const R2 = rng(5);

  const sun = (r: number, lobes: number, seed: number) => {
    const rr = rng(seed);
    const pts: P[] = [];
    for (let i = 0; i < lobes * 2; i++) {
      const a = (i / (lobes * 2)) * 6.283;
      const k = i % 2 ? r * 0.9 : r * (1 + rr() * 0.03);
      pts.push([sx + Math.cos(a) * k, sy + Math.sin(a) * k]);
    }
    return smoothClosed(pts);
  };

  type T = ["round" | "pine" | "cloud", number, number, number, string[]?];
  const lime = ["#8CC63F", "#B5DE5A", "#E1F5A0"];
  const gold = ["#F0AE2E", "#FFCB4D", "#FFE9A3"];
  const trees: T[] = les
    ? [
        ["pine", 24, 690, 0.85],
        ["round", 362, 650, 0.68, lime],
        ["cloud", 22, 800, 0.8, gold],
        ["round", 366, 768, 0.8],
        ["pine", 350, 330, 0.5],
        ["round", 22, 330, 0.5, lime],
      ]
    : tab
      ? [
          ["pine", 46, 322, 0.92],
          ["pine", 114, 342, 0.62],
          ["cloud", 232, 296, 0.78, gold],
          ["round", 948, 332, 0.76, lime],
          ["pine", 994, 354, 0.6],
          ["round", 884, 500, 0.8, gold],
          ["pine", 944, 552, 1.0],
          ["round", 424, 694, 0.82, lime],
          ["pine", 52, 772, 1.3],
          ["cloud", 340, 742, 0.9],
        ]
      : [
          ["pine", 30, 346, 0.62],
          ["round", 354, 330, 0.52, lime],
          ["pine", 360, 486, 0.86],
          ["cloud", 342, 516, 0.5, gold],
          ["round", 364, 656, 0.78],
          ["cloud", 358, 752, 0.78, gold],
          ["round", 62, 366, 0.4],
          ["cloud", 54, 540, 0.62, lime],
        ];
  trees.sort((a, b) => a[2] - b[2]);
  const flowers: [number, number, string, number][] = les
    ? [[40, 640, "#FF7A6B", 1.1], [70, 662, "#fff", 1], [300, 690, "#FFC93C", 1.1], [326, 712, "#FF7A6B", 1], [200, 806, "#fff", 1.1], [120, 760, "#FFC93C", 1], [270, 800, "#FF7A6B", 1.1], [60, 726, "#FF7A6B", 1]]
    : tab
      ? [[380, 430, "#fff", 1.1], [420, 452, "#FF7A6B", 1], [780, 702, "#FFC93C", 1.1], [880, 742, "#FF7A6B", 1.1], [330, 622, "#FFC93C", 1], [90, 442, "#FF7A6B", 1.1], [120, 472, "#fff", 1], [470, 544, "#FF7A6B", 1], [60, 640, "#FFC93C", 1.1], [250, 704, "#fff", 1], [460, 762, "#FF7A6B", 1]]
      : [[62, 424, "#FF7A6B", 1.1], [88, 444, "#fff", 1], [330, 604, "#FF7A6B", 1.1], [304, 620, "#FFC93C", 1], [330, 756, "#fff", 1.1], [92, 766, "#FF7A6B", 1.1], [270, 592, "#fff", 1], [160, 762, "#FFC93C", 1], [300, 336, "#fff", 1]];

  const filt = (g: ReactNode, key: string | number) => (
    <g key={key} filter={`url(#${uid}-sh)`}>
      {g}
    </g>
  );

  return (
    <svg className="layer" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8DD0F0" />
          <stop offset=".5" stopColor="#CDEBF2" />
          <stop offset="1" stopColor="#FFF2D6" />
        </linearGradient>
        <filter id={`${uid}-sh`} filterUnits="userSpaceOnUse" x="-60" y="-60" width={w + 120} height={h + 120}>
          <feDropShadow dx="0" dy="-3" stdDeviation="4" floodColor="#5A3A12" floodOpacity=".32" />
        </filter>
        <filter id={`${uid}-sh2`} filterUnits="userSpaceOnUse" x="-60" y="-60" width={w + 120} height={h + 120}>
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#5A3A12" floodOpacity=".3" />
        </filter>
        <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 .35  0 0 0 0 .22  0 0 0 0 .08  1.5 0 0 0 -.45" />
        </filter>
        <linearGradient id={`${uid}-riv`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6FBDF5" />
          <stop offset="1" stopColor="#4AA8F0" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${uid}-sky)`} />
      {/* paper sun: stacked scalloped discs */}
      <g filter={`url(#${uid}-sh2)`}>
        <path d={sun(les ? 66 : tab ? 84 : 52, 14, 3)} fill="#FFE9A3" />
        <path d={sun(les ? 50 : tab ? 64 : 40, 10, 6)} fill="#FFD866" />
        <circle cx={sx} cy={sy} r={les ? 32 : tab ? 42 : 26} fill="#FFC93C" />
      </g>
      {/* paper clouds */}
      <g filter={`url(#${uid}-sh2)`}>
        {(les
          ? [[w * 0.62, 90, 0.8], [w * 0.3, 224, 0.6]]
          : tab
            ? [[190, 58, 0.9], [570, 52, 1], [430, 112, 0.6], [760, 70, 0.7]]
            : [[96, 52, 0.66], [262, 128, 0.48], [34, 170, 0.5]]
        ).map(([x, y, s], i) => (
          <path key={i} transform={`translate(${x} ${y}) scale(${s})`} d="M-44 0 C-62 0 -60 -26 -36 -24 C-34 -48 -2 -52 6 -32 C16 -52 52 -46 50 -22 C70 -22 68 0 48 0 Z" fill="#FFFDF6" />
        ))}
      </g>
      {/* hill layers: each a paper sheet with a shadow on the one behind */}
      {defs.map((l, i) =>
        filt(
          <g>
            <path d={hillPath(rid[i], w, h)} fill={l.fill} />
            <path d={smooth(rid[i].map(([x, y]) => [x, y + 11] as P))} fill="none" stroke={l.edge} strokeWidth="2.2" strokeDasharray="7 9" strokeLinecap="round" opacity=".8" />
            <path d={smooth(rid[i])} fill="none" stroke="#fff" strokeWidth="1.6" opacity=".45" />
          </g>,
          i,
        ),
      )}
      {/* soft paper patches on the meadow */}
      {Array.from({ length: Math.ceil((h - hz) / 150) }).map((_, i) => {
        const y = hz + 170 + i * 150;
        const left = i % 2 === 0;
        return (
          <g key={i}>
            <path d={blob(left ? w * 0.2 : w * 0.8, y, w * 0.26, 36, 90 + i, 0.14)} fill="#4FB962" />
            <path d={blob(left ? w * 0.8 : w * 0.2, y + 70, w * 0.22, 28, 120 + i, 0.14)} fill="#72D07F" />
          </g>
        );
      })}
      {/* paper river */}
      {tab || les ? (
        <g filter={`url(#${uid}-sh2)`}>
          <path d={blob(tab ? 210 : 280, tab ? 580 : 742, tab ? 152 : 100, tab ? 48 : 30, 12, 0.08, 12)} fill="#8CD0FA" />
          <path d={blob(tab ? 214 : 284, tab ? 584 : 745, tab ? 126 : 82, tab ? 34 : 22, 14, 0.08, 12)} fill="#5DB5F3" />
          <path d={blob(tab ? 218 : 288, tab ? 588 : 748, tab ? 98 : 62, tab ? 20 : 14, 16, 0.08, 12)} fill="#3F9CE6" />
          <path d={`M${tab ? 150 : 240} ${tab ? 566 : 736} q16 -8 32 0 t32 0`} stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" />
        </g>
      ) : (
        <g filter={`url(#${uid}-sh2)`}>
          {[0, 1, 2].map((i) => {
            const pts: P[] = [];
            for (let y = 520; y <= h + 30; y += 30) pts.push([22 + (y - 520) * 0.06 + 8 * Math.sin(y / 48 + i), y]);
            const hw = [30, 22, 12][i];
            const tap = (y: number) => Math.min(1, 0.08 + (y - 520) / 110);
            const L = pts.map(([x, y]) => [x - (hw + (y - 520) * 0.03) * tap(y), y] as P);
            const Rr = pts.map(([x, y]) => [x + (hw + (y - 520) * 0.03) * tap(y), y] as P);
            return <path key={i} d={`${smooth(L)} ${smooth([...Rr].reverse(), "L")}Z`} fill={["#8CD0FA", "#5DB5F3", "#3F9CE6"][i]} />;
          })}
        </g>
      )}
      {/* trees: paper cut-outs with their own shadows */}
      {trees.map(([k, x, y, s, c], i) => (
        <PaperTree key={i} k={k} x={x} y={y} s={s} c={c} />
      ))}
      {flowers.map(([x, y, c, s], i) => (
        <PaperFlower key={i} x={x} y={y} c={c} s={s} />
      ))}
      {/* paper scraps: little leaves and confetti */}
      {Array.from({ length: 14 }).map((_, i) => {
        const x = R2() * w;
        const y = hz + 140 + R2() * (h - hz - 200);
        const col = ["#FF7A6B", "#FFC93C", "#fff", "#4AA8F0"][i % 4];
        return <rect key={i} x={f(x)} y={f(y)} width="7" height="4" rx="1.5" fill={col} opacity=".9" transform={`rotate(${f(R2() * 180)} ${f(x)} ${f(y)})`} />;
      })}
      {/* paper grain over everything */}
      <rect width={w} height={h} filter={`url(#${uid}-grain)`} opacity=".16" style={{ mixBlendMode: "multiply" }} />
    </svg>
  );
}

/* ================================================================== */
/* C. Stage framed by foliage                                          */
/* ================================================================== */

function Leaf({ len, wid, dark, mid, light }: { len: number; wid: number; dark: string; mid: string; light: string }) {
  const half = `C${f(wid)} ${f(-len * 0.25)} ${f(wid * 0.9)} ${f(-len * 0.75)} 0 ${f(-len)}`;
  return (
    <g>
      <path d={`M0 0 ${half} C${f(-wid * 0.9)} ${f(-len * 0.75)} ${f(-wid)} ${f(-len * 0.25)} 0 0Z`} fill={dark} />
      <path d={`M0 0 ${half} Z`} fill={mid} />
      <path d={`M0 -2 L0 ${f(-len * 0.92)} M0 ${f(-len * 0.3)} L${f(wid * 0.6)} ${f(-len * 0.5)} M0 ${f(-len * 0.52)} L${f(wid * 0.5)} ${f(-len * 0.7)} M0 ${f(-len * 0.3)} L${f(-wid * 0.6)} ${f(-len * 0.5)}`} stroke={light} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".55" />
    </g>
  );
}

function Branch({ x, y, rot, len, seed, pal, leaf = 34, bend = 0.25, stem = "#4A3220" }: { x: number; y: number; rot: number; len: number; seed: number; pal: Pal; leaf?: number; bend?: number; stem?: string }) {
  const r = rng(seed);
  const n = Math.max(3, Math.round(len / 28));
  const leaves: ReactNode[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const side = i % 2 ? 1 : -1;
    const sz = leaf * (1.2 - t * 0.55) * (0.85 + r() * 0.3);
    leaves.push(
      <g key={i} transform={`translate(${f(bend * len * t * t)} ${f(-len * t)}) rotate(${f(side * (46 + r() * 22))})`}>
        <Leaf len={sz * 1.7} wid={sz * 0.58} dark={pal.dark} mid={pal.mid} light={pal.light} />
      </g>,
    );
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0 0 Q${f(bend * len * 0.3)} ${f(-len * 0.5)} ${f(bend * len)} ${f(-len)}`} stroke={stem} strokeWidth="5" fill="none" strokeLinecap="round" />
      {leaves}
      <g transform={`translate(${f(bend * len)} ${f(-len)}) rotate(${f(bend * 40)})`}>
        <Leaf len={leaf * 1.9} wid={leaf * 0.6} dark={pal.dark} mid={pal.mid} light={pal.light} />
      </g>
    </g>
  );
}

function Sparkle({ x, y, s = 1, o = 0.9 }: { x: number; y: number; s?: number; o?: number }) {
  return <path transform={`translate(${f(x)} ${f(y)}) scale(${s})`} d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8Z" fill="#FFF8C4" opacity={o} />;
}

function BgC({ w, h, uid, mode, device }: Cfg) {
  const tab = device === "tablet";
  const les = mode === "lesson";
  const hz = les ? 250 : tab ? 150 : 250;
  const pts = tab ? T_POINTS : P_POINTS;
  const r = rng(11);

  // distant mountains: [peak x, peak y, half width]
  const mtn: [number, number, number][] = les
    ? [[70, 150, 120], [250, 120, 140], [380, 170, 100]]
    : tab
      ? [[130, 50, 190], [420, 30, 200], [760, 56, 210], [1000, 70, 160]]
      : [[58, 150, 110], [196, 134, 130], [330, 156, 120]];
  const mtn2: [number, number, number][] = les ? [[150, 190, 110], [330, 200, 100]] : tab ? [[10, 100, 160], [280, 104, 150], [600, 96, 170], [890, 110, 160]] : [[130, 188, 100], [270, 192, 100], [10, 196, 90]];
  const mountain = (m: [number, number, number][], base: number, jag: number) => {
    let body = "";
    let lit = "";
    let snow = "";
    m.forEach(([px, py, hw], i) => {
      const mid = px + (i % 2 ? 6 : -6);
      body += `M${px - hw} ${base} L${px - hw * 0.45} ${f(py + (base - py) * 0.42)} L${px - hw * 0.2} ${f(py + (base - py) * 0.3)} L${px} ${py} L${px + hw * 0.3} ${f(py + (base - py) * 0.36)} L${px + hw * 0.55} ${f(py + (base - py) * 0.5)} L${px + hw} ${base}Z`;
      lit += `M${px} ${py} L${px + hw * 0.3} ${f(py + (base - py) * 0.36)} L${px + hw * 0.55} ${f(py + (base - py) * 0.5)} L${px + hw} ${base} L${mid} ${base}Z`;
      if (jag) {
        const sh = (base - py) * 0.3;
        snow += `M${px} ${py} L${f(px - hw * 0.2)} ${f(py + sh * 0.9)} L${f(px - hw * 0.1)} ${f(py + sh * 0.72)} L${px} ${f(py + sh * 1.0)} L${f(px + hw * 0.1)} ${f(py + sh * 0.7)} L${f(px + hw * 0.22)} ${f(py + sh * 0.9)}Z`;
      }
    });
    return { body, lit, snow };
  };
  const m1 = mountain(mtn, hz + 20, 1);
  const m2 = mountain(mtn2, hz + 24, 0);

  // treeline: tall at the edges, low in the middle
  const tl = (lo: number, hi: number, seed: number, step: number) => {
    const rr = rng(seed);
    let d = "";
    for (let x = -10; x < w + 10; x += step * (0.7 + rr() * 0.6)) {
      const edge = Math.pow(Math.abs(x - w / 2) / (w / 2), 1.8);
      const base = hz + 24;
      const hh = lo + edge * hi * (0.7 + rr() * 0.5);
      if (rr() < 0.5) {
        const hw = hh * 0.26;
        d += `M${f(x - hw)} ${base}L${f(x)} ${f(base - hh)}L${f(x + hw)} ${base}Z`;
      } else {
        const q = hh * 0.36;
        d += `M${f(x - q)} ${base}a${f(q)} ${f(q)} 0 1 1 ${f(q * 2)} 0Z`;
      }
    }
    return d;
  };

  const dirt = trailPath(pts, h);
  const samples = trailSamples(pts, h, tab ? 18 : 14);
  const pebbles = samples.map(([x, y], i) => {
    const side = i % 2 ? 1 : -1;
    const off = side * (30 + r() * 20);
    return { x: x + off, y: y + (r() - 0.5) * 12, s: 2 + r() * 3.2, c: i % 3 === 0 ? "#E9D3A3" : i % 3 === 1 ? "#B58B5B" : "#CDB48A" };
  });
  const pal: Pal = { dark: "#14603E", mid: "#1F8050", light: "#5CCB85" };
  const palB: Pal = { dark: "#1B7048", mid: "#2A9460", light: "#7BE0A0" };
  const palL: Pal = { dark: "#2C8A55", mid: "#44AD70", light: "#9BEBB5" };
  const sc = tab ? 1.2 : 1;

  const flies: [number, number, number][] = [];
  const rf = rng(31);
  for (let i = 0; i < (tab ? 22 : 16); i++) flies.push([f(30 + rf() * (w - 60)), f(hz + 70 + rf() * (h - hz - 170)), 0.7 + rf() * 0.7]);

  return (
    <svg className="layer" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2C80D8" />
          <stop offset=".4" stopColor="#5DB1F2" />
          <stop offset=".75" stopColor="#B9E4FF" />
          <stop offset="1" stopColor="#FFE6B0" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} gradientUnits="userSpaceOnUse" cx={w * 0.68} cy={hz} r={w * 0.55}>
          <stop offset="0" stopColor="#FFF0B0" stopOpacity=".8" />
          <stop offset="1" stopColor="#FFF0B0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#58BE6A" />
          <stop offset="1" stopColor="#3AA05A" />
        </linearGradient>
        <radialGradient id={`${uid}-clear`} gradientUnits="userSpaceOnUse" cx={tab ? 640 : w * 0.54} cy={les ? h * 0.52 : h * 0.56} r={tab ? 520 : 460} gradientTransform={`translate(${tab ? 640 : w * 0.54} ${les ? h * 0.52 : h * 0.56}) scale(${tab ? 1.2 : 0.8} 1) translate(${-(tab ? 640 : w * 0.54)} ${-(les ? h * 0.52 : h * 0.56)})`}>
          <stop offset="0" stopColor="#E0FA9C" stopOpacity=".72" />
          <stop offset=".55" stopColor="#A9EC86" stopOpacity=".3" />
          <stop offset="1" stopColor="#A9EC86" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-vig`} cx="0.5" cy="0.52" r="0.72">
          <stop offset=".5" stopColor="#06402C" stopOpacity="0" />
          <stop offset="1" stopColor="#06402C" stopOpacity=".5" />
        </radialGradient>
        <linearGradient id={`${uid}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF6C0" stopOpacity=".34" />
          <stop offset="1" stopColor="#FFF6C0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ED8FF" />
          <stop offset="1" stopColor="#3F9CE6" />
        </linearGradient>
        <radialGradient id={`${uid}-fly`}>
          <stop offset="0" stopColor="#FFF59A" stopOpacity=".95" />
          <stop offset=".35" stopColor="#FFE45C" stopOpacity=".45" />
          <stop offset="1" stopColor="#FFE45C" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>
      <rect width={w} height={h} fill={`url(#${uid}-sky)`} />
      <rect width={w} height={h} fill={`url(#${uid}-glow)`} />
      {/* stylised pill clouds */}
      {(les ? [[w * 0.66, 84, 1], [w * 0.22, 226, 0.7]] : tab ? [[200, 50, 1.1], [610, 44, 1.2], [880, 100, 0.8], [420, 112, 0.7]] : [[94, 52, 0.8], [276, 130, 0.58], [40, 172, 0.5]]).map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x="-56" y="-2" width="118" height="22" rx="11" fill="#CFE7FB" opacity=".9" />
          <rect x="-44" y="-14" width="88" height="22" rx="11" fill="#fff" />
          <rect x="-12" y="-28" width="52" height="22" rx="11" fill="#fff" />
          <rect x="-60" y="2" width="70" height="16" rx="8" fill="#fff" />
        </g>
      ))}
      {/* mountains with a lit side and snow caps */}
      <path d={m2.body} fill="#A6BDEC" />
      <path d={m2.lit} fill="#BDD0F5" />
      <path d={m1.body} fill="#7F9FDC" />
      <path d={m1.lit} fill="#9DB8EC" />
      <path d={m1.snow} fill="#F4F9FF" />
      <rect x="0" y={hz} width={w} height="40" fill="#BBD6F2" opacity=".5" />
      {/* tree wall, tall at the edges */}
      <path d={tl(14, 70, 5, 17)} fill="#3C9C78" />
      <path d={tl(10, 58, 9, 14)} fill="#23805A" />
      {/* ground */}
      <path d={`M-20 ${hz + 24} Q${w * 0.3} ${hz + 8} ${w * 0.55} ${hz + 20} T${w + 20} ${hz + 14} V${h} H-20Z`} fill={`url(#${uid}-ground)`} />
      <rect width={w} height={h} fill={`url(#${uid}-clear)`} />
      {/* light shafts */}
      {(tab ? [[180, 110], [520, 130], [820, 90]] : [[60, 80], [210, 100], [330, 70]]).map(([x, bw], i) => (
        <path key={i} d={`M${x} 0 L${x + bw} 0 L${x + bw - 150} ${h * 0.78} L${x - 190} ${h * 0.78}Z`} fill={`url(#${uid}-beam)`} opacity={0.75 - i * 0.12} />
      ))}
      {/* the dirt path under the trail */}
      {!les && (
        <g>
          <path d={dirt} fill="none" stroke="#7E5230" strokeWidth="96" strokeLinecap="round" opacity=".4" transform="translate(0 6)" />
          <path d={dirt} fill="none" stroke="#A97B47" strokeWidth="92" strokeLinecap="round" />
          <path d={dirt} fill="none" stroke="#C99A5F" strokeWidth="80" strokeLinecap="round" />
          <path d={dirt} fill="none" stroke="#B88A52" strokeWidth="64" strokeLinecap="round" strokeDasharray="30 52" opacity=".5" />
          {pebbles.map((p, i) => (
            <g key={i}>
              <ellipse cx={f(p.x + 1)} cy={f(p.y + 1.6)} rx={f(p.s)} ry={f(p.s * 0.6)} fill="#6B4524" opacity=".4" />
              <ellipse cx={f(p.x)} cy={f(p.y)} rx={f(p.s)} ry={f(p.s * 0.65)} fill={p.c} />
            </g>
          ))}
          {samples.filter((_, i) => i % 3 === 0).map(([x, y], i) => (
            <Tuft key={i} x={x + (i % 2 ? 54 : -54)} y={y + 6} s={0.7} c="#2F9A55" c2="#6FD27F" />
          ))}
        </g>
      )}
      {les && (
        <g>
          <path d={`M${w * 0.55} ${h + 10} C${w * 0.6} ${h - 60} ${w * 0.4} ${h - 120} ${w * 0.46} ${h - 200}`} fill="none" stroke="#7E5230" strokeWidth="80" strokeLinecap="round" opacity=".35" transform="translate(0 5)" />
          <path d={`M${w * 0.55} ${h + 10} C${w * 0.6} ${h - 60} ${w * 0.4} ${h - 120} ${w * 0.46} ${h - 200}`} fill="none" stroke="#A97B47" strokeWidth="76" strokeLinecap="round" />
          <path d={`M${w * 0.55} ${h + 10} C${w * 0.6} ${h - 60} ${w * 0.4} ${h - 120} ${w * 0.46} ${h - 200}`} fill="none" stroke="#C99A5F" strokeWidth="64" strokeLinecap="round" />
          {[[170, 786], [226, 770], [140, 730], [250, 700], [198, 818], [160, 700]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx={3 + (i % 3)} ry={2.2 + (i % 3) * 0.6} fill={i % 2 ? "#E9D3A3" : "#B58B5B"} />
          ))}
        </g>
      )}
      {tab && <Pond cx={210} cy={580} rx={140} ry={42} uid={uid} seed={7} />}
      {/* ground details in the clearing */}
      {(les
        ? [[110, 640], [262, 660], [40, 740], [330, 800], [80, 812], [286, 722]]
        : tab
          ? [[300, 300], [460, 280], [330, 560], [440, 680], [160, 600], [860, 600], [880, 300], [760, 470], [200, 420]]
          : [[120, 330], [312, 410], [300, 560], [330, 690], [66, 676], [270, 780], [100, 770], [60, 420], [330, 330]]
      ).map(([x, y], i) => (
        <Tuft key={i} x={x} y={y} s={1.1} c="#2F9A55" c2="#76D786" />
      ))}
      {(les ? [[70, 700, "#FF8FA3"], [300, 700, "#fff"], [190, 812, "#FFC93C"], [110, 770, "#fff"]] : tab ? [[380, 430, "#fff"], [420, 452, "#FF8FA3"], [780, 702, "#FFC93C"], [90, 460, "#fff"], [470, 544, "#FF8FA3"], [250, 704, "#FFC93C"]] : [[70, 440, "#fff"], [330, 610, "#FF8FA3"], [330, 756, "#FFC93C"], [92, 766, "#fff"], [280, 340, "#FF8FA3"]]).map(([x, y, c], i) => (
        <FlowerA key={i} x={x as number} y={y as number} c={c as string} />
      ))}
      <Rock x={les ? 70 : tab ? 410 : 312} y={les ? 640 : tab ? 520 : 566} s={0.9} />
      <Shroom x={les ? 300 : tab ? 800 : 96} y={les ? 770 : tab ? 560 : 770} s={1.1} />
      {/* fireflies and sparkles */}
      {flies.map(([x, y, s], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={f(9 * s)} fill={`url(#${uid}-fly)`} />
          <circle cx={x} cy={y} r={f(1.8 * s)} fill="#FFFBD6" />
        </g>
      ))}
      {[[42, hz + 60], [348, hz + 120], [190, hz + 40], [84, h * 0.6], [330, h * 0.46]].map(([x, y], i) => (
        <Sparkle key={i} x={x} y={y} s={0.7 + (i % 3) * 0.25} />
      ))}
      {/* framing foliage: far layer, soft */}
      <g opacity=".5" filter={`url(#${uid}-blur)`}>
        <Branch x={-30} y={h * 0.5} rot={78} len={150 * sc} seed={3} pal={palL} leaf={42 * sc} bend={-0.2} />
        <Branch x={w + 30} y={h * 0.44} rot={-78} len={150 * sc} seed={4} pal={palL} leaf={42 * sc} bend={0.2} />
      </g>
      <g opacity=".9">
        <Branch x={-24} y={-16} rot={128} len={(les ? 210 : 240) * sc} seed={21} pal={pal} leaf={40 * sc} bend={-0.18} />
        <Branch x={-14} y={70} rot={110} len={140 * sc} seed={22} pal={palB} leaf={30 * sc} bend={-0.15} />
        <Branch x={w + 24} y={-16} rot={-128} len={(les ? 210 : 240) * sc} seed={23} pal={pal} leaf={40 * sc} bend={0.18} />
        <Branch x={w + 14} y={70} rot={-110} len={140 * sc} seed={24} pal={palB} leaf={30 * sc} bend={0.15} />
        <Branch x={-26} y={h * 0.62} rot={72} len={(tab ? 150 : 130) * sc} seed={25} pal={palB} leaf={36 * sc} bend={-0.15} />
        <Branch x={w + 26} y={h * 0.66} rot={-72} len={(tab ? 150 : 130) * sc} seed={26} pal={palB} leaf={36 * sc} bend={0.15} />
      </g>
      {/* near-camera leaves at the bottom corners, out of focus */}
      <g opacity=".95" filter={`url(#${uid}-blur)`}>
        <Branch x={-30} y={h - (les ? 30 : 60)} rot={38} len={(tab ? 260 : 170) * sc} seed={31} pal={pal} leaf={60 * sc} bend={-0.25} stem="#2C1D12" />
        <Branch x={w + 30} y={h - (les ? 30 : 60)} rot={-38} len={(tab ? 260 : 170) * sc} seed={32} pal={pal} leaf={60 * sc} bend={0.25} stem="#2C1D12" />
      </g>
      <rect width={w} height={h} fill={`url(#${uid}-vig)`} />
    </svg>
  );
}

/* ================================================================== */
/* sheets                                                              */
/* ================================================================== */

type Style = "A" | "B" | "C";
const NAMES: Record<Style, string> = {
  A: "A · Floresta ilustrada com profundidade",
  B: "B · Diorama de papel recortado",
  C: "C · Palco de floresta com moldura",
};
const NOTES: Record<Style, string> = {
  A: "No app: nuvens à deriva bem devagar, os raios do sol respirando, as copas das árvores balançando de leve, brilho que corre pela água e uma borboleta de vez em quando.",
  B: "No app: cada camada de papel desliza num ritmo diferente quando a trilha rola (paralaxe), as nuvens de papel passeiam e as flores balançam como se alguém soprasse.",
  C: "No app: vaga-lumes piscando fora de compasso, folhas das bordas balançando em fases diferentes, nuvens passando e os feixes de luz pulsando bem devagar.",
};

function Bg({ style, kind, uid }: { style: Style; kind: "phone-map" | "tablet-map" | "lesson"; uid: string }) {
  const cfg: Cfg =
    kind === "tablet-map"
      ? { w: TW, h: TH, uid, mode: "map", device: "tablet" }
      : { w: PW, h: PH, uid, mode: kind === "lesson" ? "lesson" : "map", device: "phone" };
  return style === "A" ? <BgA {...cfg} /> : style === "B" ? <BgB {...cfg} /> : <BgC {...cfg} />;
}

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

/** The map as it is today: flat sky, smooth hills, plain ellipses, simple trees. */
function TodayMap() {
  return (
    <>
      <TrailScene w={PW} h={PH} sun={false} />
      <Trees
        w={PW}
        h={PH}
        items={[
          ["pine", 26, 330, 0.62],
          ["round", 352, 322, 0.5],
          ["pine", 356, 470, 0.9],
          ["round", 30, 520, 0.72],
          ["pine", 20, 700, 1],
          ["round", 360, 660, 0.8],
          ["mush", 310, 560],
          ["flower", 60, 420],
          ["flower", 330, 750],
          ["mush", 86, 760],
        ]}
      />
      <MapFg device="phone" />
    </>
  );
}

function Page() {
  const styles: Style[] = ["A", "B", "C"];
  return (
    <main>
      <section data-sheet="9-fundos-celular-mapa">
        <h2>Três fundos novos para o mapa (celular em pé)</h2>
        <div className="row">
          <Fig kind="phone" name="Hoje" note="Céu de uma cor só, colinas lisas, elipses verdes e árvores simples. Serve de comparação.">
            <TodayMap />
          </Fig>
          {styles.map((s) => (
            <Fig key={s} kind="phone" name={NAMES[s]} note={NOTES[s]}>
              <Bg style={s} kind="phone-map" uid={`${s}m`} />
              <MapFg device="phone" />
            </Fig>
          ))}
        </div>
      </section>
      <section data-sheet="10-fundos-celular-licao">
        <h2>Os mesmos fundos na lição (celular em pé)</h2>
        <div className="row">
          {styles.map((s) => (
            <Fig key={s} kind="phone" name={NAMES[s]} note={NOTES[s]}>
              <Bg style={s} kind="lesson" uid={`${s}l`} />
              <LessonFg />
            </Fig>
          ))}
        </div>
      </section>
      <section data-sheet="11-fundos-tablet">
        <h2>Os fundos no tablet deitado</h2>
        <div className="row">
          {styles.slice(0, 2).map((s) => (
            <Fig key={s} kind="tablet" name={NAMES[s]} note={NOTES[s]}>
              <Bg style={s} kind="tablet-map" uid={`${s}t`} />
              <MapFg device="tablet" />
            </Fig>
          ))}
        </div>
        <div className="row" style={{ marginTop: 36 }}>
          <Fig kind="tablet" name={NAMES.C} note={NOTES.C}>
            <Bg style="C" kind="tablet-map" uid="Ct" />
            <MapFg device="tablet" />
          </Fig>
          <div className="card">
            <h3>Como ler</h3>
            <p>O primeiro plano é o mesmo das telas aprovadas: trilha, paradas, placa, gatinho, balão, azulejos e menu. Só o fundo muda.</p>
            <p>O miolo fica calmo, com cor de meio-tom, para o texto e os balões brancos terem contraste. O detalhe mais cheio fica nas bordas.</p>
            <p>Tudo é SVG desenhado à mão: gradientes, formas e poucos filtros (B usa sombra e papel; C usa um desfoque nas folhas de perto). Nenhuma imagem externa.</p>
          </div>
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
.card{width:640px;align-self:flex-start;background:#fff;border-radius:28px;padding:30px 36px;box-shadow:0 6px 0 #D5DBE6}
.card h3{margin:0 0 12px;font-family:"Baloo 2";font-weight:800;font-size:30px}
.card p{margin:0 0 14px;font-family:Nunito;font-weight:700;font-size:20px;line-height:1.45;color:#3A3D55}
`;

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
${fontsLink}
<style>${artCss}</style><style>${baseCss}${css}</style></head>
<body>${renderToStaticMarkup(<Page />)}</body></html>`;

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "background-mockups.html"), html);
console.log(`wrote ${resolve(outDir, "background-mockups.html")}`);
