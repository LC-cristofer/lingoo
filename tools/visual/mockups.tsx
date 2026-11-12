// Static mockups of the redesigned screens (trail map, exercise, feedback sheets, lesson opening,
// start screen) for phone portrait (390×844) and tablet landscape (1024×768). They are pictures
// for approval only: no app screen imports this file.
//   npx tsx tools/visual/mockups.tsx
//   node tools/visual/frames.cjs tools/visual/.out/mockups.html tools/visual/.out/mockups
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { CSSProperties, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Animal } from "@/art/Animal";
import { Cat } from "@/art/Cat";
import { Flower, Mushroom, Pine, RoundTree } from "@/art/scenes/ForestBackdrop";
import type { ArtId } from "@/domain/trail/schema";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const outDir = resolve(here, ".out");

type Variant = "forest" | "blocks";
type Kind = "song" | "lesson" | "story" | "challenge";
type State = "done" | "current" | "locked";

const KIND_COLOR: Record<Kind, [string, string]> = {
  song: ["#FF7A6B", "#D9544A"],
  lesson: ["#FFC93C", "#DE9F12"],
  story: ["#4AA8F0", "#2C82CC"],
  challenge: ["#B57EDC", "#8F57BF"],
};
const LOCKED: [string, string] = ["#D5D9E0", "#AEB4BF"];

/* ---------- small pieces ---------- */

function Glyph({ kind, locked }: { kind: Kind; locked?: boolean }) {
  if (locked)
    return (
      <g>
        <rect x="-11" y="-3" width="22" height="17" rx="5" fill="#fff" />
        <path d="M-6.5 -3 v-5 a6.5 6.5 0 0 1 13 0 v5" stroke="#fff" strokeWidth="4.5" fill="none" />
      </g>
    );
  if (kind === "song")
    return (
      <g>
        <ellipse cx="-9" cy="10" rx="7" ry="5.5" fill="#fff" />
        <ellipse cx="10" cy="6" rx="7" ry="5.5" fill="#fff" />
        <path d="M-3 10 V-12 L16 -16 V6" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinejoin="round" />
        <path d="M-3 -12 L16 -16 V-10 L-3 -6Z" fill="#fff" />
      </g>
    );
  if (kind === "lesson")
    return <path d="M0 -17 l5 10 l11 1.6 l-8 7.8 l1.9 11 l-9.9 -5.2 l-9.9 5.2 l1.9 -11 l-8 -7.8 l11 -1.6z" fill="#fff" />;
  if (kind === "story")
    return (
      <g>
        <path d="M-17 -12 q9 -4 17 2 q8 -6 17 -2 v24 q-9 -4 -17 2 q-8 -6 -17 -2z" fill="#fff" />
        <path d="M0 -10 v24" stroke="#4AA8F0" strokeWidth="2" />
      </g>
    );
  return (
    <g>
      <path d="M-11 -14 h22 v8 q0 12 -11 14 q-11 -2 -11 -14z M-4 8 h8 v6 h6 v4 h-20 v-4 h6z" fill="#fff" />
      <path d="M-11 -10 h-6 q0 10 7 10 M11 -10 h6 q0 10 -7 10" stroke="#fff" strokeWidth="3" fill="none" />
    </g>
  );
}

/** A chunky, pressable stop: a disc on a darker "edge". */
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
      {label && (
        <span className={`node-label ${side === "left" ? "is-left" : "is-right"} ${state === "locked" ? "is-locked" : ""}`}>{label}</span>
      )}
    </div>
  );
}

function trailPath(points: [number, number][], extendTo?: number): string {
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

function Trail({ points, w, h, extendTo, dotted, from }: { points: [number, number][]; w: number; h: number; extendTo?: number; dotted?: boolean; from?: [number, number] }) {
  const all = from ? [from, ...points] : points;
  const d = trailPath(all, extendTo);
  return (
    <svg className="layer" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      {dotted ? (
        <path d={d} fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeDasharray="1 22" opacity=".9" />
      ) : (
        <>
          <path d={d} fill="none" stroke="#D9B873" strokeWidth="54" strokeLinecap="round" />
          <path d={d} fill="none" stroke="#F6DDA6" strokeWidth="46" strokeLinecap="round" />
          <path d={d} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 20" opacity=".85" />
        </>
      )}
    </svg>
  );
}

function Clouds({ w }: { w: number }) {
  return (
    <g fill="#fff" opacity=".95">
      <ellipse cx={w * 0.18} cy="150" rx="46" ry="16" />
      <ellipse cx={w * 0.18 + 22} cy="138" rx="26" ry="18" />
      <ellipse cx={w * 0.62} cy="118" rx="38" ry="13" />
      <ellipse cx={w * 0.62 + 18} cy="108" rx="22" ry="15" />
    </g>
  );
}

/** Tall forest scene for the trail: sky and hills on top, meadow all the way down. */
function TrailScene({ w, h, skyless, sun = true, clouds = true }: { w: number; h: number; skyless?: boolean; sun?: boolean; clouds?: boolean }) {
  const patches: ReactNode[] = [];
  for (let y = skyless ? 40 : 420; y < h + 80; y += 150) {
    const i = Math.round(y / 150);
    patches.push(<ellipse key={`d${y}`} cx={i % 2 ? w * 0.22 : w * 0.8} cy={y} rx={w * 0.34} ry="46" fill="#52B861" />);
    patches.push(<ellipse key={`l${y}`} cx={i % 2 ? w * 0.78 : w * 0.2} cy={y + 70} rx={w * 0.3} ry="38" fill="#68CE77" />);
  }
  return (
    <svg className="layer" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true" preserveAspectRatio="none">
      {skyless ? (
        <rect width={w} height={h} fill="#5CC46B" />
      ) : (
        <>
          <rect width={w} height={h} fill="#8FD0FF" />
          <rect width={w} height="200" fill="#7CC6FF" />
          {sun && <circle cx={w - 62} cy="150" r="40" fill="#FFE27A" />}
          {sun && <circle cx={w - 62} cy="150" r="58" fill="#FFE27A" opacity=".25" />}
          {clouds && <Clouds w={w} />}
          <path d={`M0 250 Q${w * 0.25} 186 ${w * 0.5} 232 T${w} 214 V${h} H0Z`} fill="#A6DDA3" />
          <path d={`M0 300 Q${w * 0.3} 250 ${w * 0.6} 292 T${w} 280 V${h} H0Z`} fill="#7FCF85" />
          <path d={`M0 352 Q${w * 0.4} 322 ${w * 0.7} 348 T${w} 338 V${h} H0Z`} fill="#5CC46B" />
        </>
      )}
      {patches}
    </svg>
  );
}

function BlocksScene({ w, h, color, blob }: { w: number; h: number; color: string; blob: string }) {
  return (
    <svg className="layer" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <rect width={w} height={h} fill={color} />
      <circle cx={w * 0.08} cy={h * 0.3} r={w * 0.3} fill={blob} />
      <circle cx={w * 0.98} cy={h * 0.58} r={w * 0.36} fill={blob} />
      <circle cx={w * 0.2} cy={h * 0.95} r={w * 0.4} fill={blob} />
    </svg>
  );
}

function Trees({ items, w, h }: { items: ["pine" | "round" | "mush" | "flower", number, number, number?][]; w: number; h: number }) {
  return (
    <svg className="layer" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      {items.map(([t, x, y, s], i) =>
        t === "pine" ? (
          <Pine key={i} x={x} y={y} s={s ?? 1} />
        ) : t === "round" ? (
          <RoundTree key={i} x={x} y={y} s={s ?? 1} />
        ) : t === "mush" ? (
          <Mushroom key={i} x={x} y={y} />
        ) : (
          <Flower key={i} x={x} y={y} color={i % 2 ? "#FF8FA3" : "#fff"} />
        ),
      )}
    </svg>
  );
}

function StarIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="-12 -12 24 24" width={size} height={size} aria-hidden="true">
      <path d="M0 -11 l3.3 6.8 l7.5 1 l-5.4 5.2 l1.3 7.4 l-6.7 -3.5 l-6.7 3.5 l1.3 -7.4 l-5.4 -5.2 l7.5 -1z" fill="#FFC93C" stroke="#DE9F12" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function TopChips({ stars, days }: { stars: number; days: number }) {
  return (
    <div className="chips">
      <span className="chip">
        <StarIcon />
        <b>{stars}</b>
      </span>
      <span className="chip chip-days">
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <span key={i} className={`day ${i < days ? "is-on" : ""}`}>
            <i />
            <em>{d}</em>
          </span>
        ))}
      </span>
    </div>
  );
}

function WoodSign({ unit, title, done, total, locked, style, compact }: { unit: string; title: string; done?: number; total?: number; locked?: boolean; style?: CSSProperties; compact?: boolean }) {
  return (
    <div className={`sign ${locked ? "is-locked" : ""} ${compact ? "is-compact" : ""}`} style={style}>
      <span className="sign-post sign-post-l" />
      <span className="sign-post sign-post-r" />
      <div className="sign-board">
        <div className="sign-text">
          <small>{unit}</small>
          <strong>{title}</strong>
        </div>
        {locked ? (
          <span className="sign-lock">
            <svg viewBox="-24 -24 48 48" width="30" height="30" aria-hidden="true">
              <Glyph kind="lesson" locked />
            </svg>
          </span>
        ) : (
          <div className="sign-progress">
            <span className="sign-bar">
              <i style={{ width: `${((done ?? 0) / (total ?? 1)) * 100}%` }} />
            </span>
            <em>
              {done} de {total}
            </em>
          </div>
        )}
      </div>
    </div>
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

function Bubble({ children, tail = "left", style }: { children: ReactNode; tail?: "left" | "down"; style?: CSSProperties }) {
  return (
    <div className={`bubble tail-${tail}`} style={style}>
      {children}
    </div>
  );
}

function SpeakerButton() {
  return (
    <span className="round-btn is-sky">
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
        <path d="M5 12 h6 l8 -6 v20 l-8 -6 h-6z" fill="#fff" />
        <path d="M23 11 q4 5 0 10 M26.5 7.5 q7 8.500 0 17" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function CloseButton() {
  return (
    <span className="round-btn is-white">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M5 5 L19 19 M19 5 L5 19" stroke="#2B2D42" strokeWidth="3.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function Tile({ id, size, state }: { id: ArtId; size: number; state?: "correct" | "wrong" | "dim" | "hint" }) {
  return (
    <div className={`tile ${state ? `is-${state}` : ""}`} style={{ width: size, height: size }}>
      <Animal id={id} size={size * 0.74} glow={state === "hint"} />
      {state === "correct" && (
        <span className="tile-badge">
          <svg viewBox="-10 -10 20 20" width="22" height="22" aria-hidden="true">
            <path d="M-5 0 l4 4 l7 -8" stroke="#fff" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </div>
  );
}

function LessonTop({ ratio }: { ratio: number }) {
  return (
    <div className="lesson-top">
      <CloseButton />
      <span className="bar">
        <i style={{ width: `${ratio * 100}%` }} />
      </span>
    </div>
  );
}

function LessonScene({ w, h, variant }: { w: number; h: number; variant: Variant }) {
  if (variant === "blocks") return <BlocksScene w={w} h={h} color="#4AA8F0" blob="#3F9CE6" />;
  const g = h * 0.44;
  return (
    <svg className="layer" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <rect width={w} height={h} fill="#8FD0FF" />
      <rect width={w} height={h * 0.2} fill="#7CC6FF" />
      <path d={`M0 ${g} Q${w * 0.25} ${g - 54} ${w * 0.5} ${g - 14} T${w} ${g - 30} V${h} H0Z`} fill="#A6DDA3" />
      <path d={`M0 ${g + 40} Q${w * 0.3} ${g} ${w * 0.6} ${g + 34} T${w} ${g + 22} V${h} H0Z`} fill="#7FCF85" />
      <path d={`M0 ${g + 84} Q${w * 0.4} ${g + 58} ${w * 0.7} ${g + 80} T${w} ${g + 70} V${h} H0Z`} fill="#5CC46B" />
      <ellipse cx={w * 0.2} cy={h * 0.82} rx={w * 0.34} ry="44" fill="#52B861" />
      <ellipse cx={w * 0.84} cy={h * 0.93} rx={w * 0.3} ry="40" fill="#68CE77" />
      <Flower x={w * 0.08} y={h * 0.86} color="#FF8FA3" />
      <Flower x={w * 0.16} y={h * 0.93} color="#fff" />
      <Mushroom x={w * 0.9} y={h * 0.84} />
      <Flower x={w * 0.8} y={h * 0.95} color="#fff" />
      <Mushroom x={w * 0.3} y={h * 0.97} />
    </svg>
  );
}

function Sheet({ kind, children, button, wide }: { kind: "correct" | "retry"; children: ReactNode; button?: string; wide?: boolean }) {
  return (
    <div className={`sheet is-${kind} ${wide ? "is-wide" : ""}`}>
      <p className="sheet-text">{children}</p>
      {button && <span className="btn is-sun sheet-btn">{button}</span>}
    </div>
  );
}

/* ---------- phone screens (390 × 844) ---------- */

const PW = 390;
const PH = 844;

const P_POINTS: [number, number][] = [
  [118, 236],
  [214, 324],
  [278, 412],
  [206, 500],
  [118, 588],
  [196, 676],
];

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

function stateOf(i: number, done: number): State {
  return i < done ? "done" : i === done ? "current" : "locked";
}

function PhoneMap({ variant }: { variant: Variant }) {
  const forest = variant === "forest";
  return (
    <>
      {forest ? <TrailScene w={PW} h={PH} sun={false} /> : <BlocksScene w={PW} h={PH} color="#5CC46B" blob="#52B861" />}
      {forest && (
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
      )}
      <Trail points={P_POINTS} w={PW} h={PH} extendTo={PH} dotted={!forest} />
      {UNIT_STOPS.map((s, i) => {
        const [x, y] = P_POINTS[i];
        const state = stateOf(i, 2);
        return <TrailNode key={i} x={x} y={y} kind={s.kind} state={state} label={state === "current" ? undefined : s.label} side={P_SIDES[i]} />;
      })}
      <div className="guide" style={{ left: 8, top: 384 }}>
        <Bubble tail="down">
          <b>Lição 2</b> Vamos!
        </Bubble>
        <Cat expression="pointing" size={92} />
      </div>
      {forest && (
        <span className="peek" style={{ left: 306, top: 232 }}>
          <Animal id="bird" size={54} />
        </span>
      )}
      <WoodSign unit="Unidade 1" title="Animais da floresta" done={2} total={6} style={{ left: 20, top: 66, width: 350 }} />
      <TopChips stars={2} days={3} />
      <BottomNav />
    </>
  );
}

function PhoneMapScrolled() {
  const pts: [number, number][] = [
    [206, 112],
    [118, 200],
    [196, 288],
  ];
  const ghost: [number, number][] = [
    [128, 560],
    [222, 644],
    [284, 728],
    [212, 812],
  ];
  return (
    <>
      <TrailScene w={PW} h={PH} skyless />
      <Trees
        w={PW}
        h={PH}
        items={[
          ["pine", 352, 150, 0.95],
          ["round", 30, 300, 0.78],
          ["pine", 24, 560, 1],
          ["round", 358, 500, 0.74],
          ["pine", 350, 800, 1.05],
          ["mush", 300, 300],
          ["flower", 70, 430],
          ["flower", 326, 630],
          ["mush", 60, 720],
        ]}
      />
      <Trail points={[...pts, [196, 372], ...ghost]} from={[278, 20]} w={PW} h={PH} extendTo={PH + 20} />
      <TrailNode x={206} y={112} kind="lesson" state="locked" label="Lição 3" side="left" />
      <TrailNode x={118} y={200} kind="story" state="locked" label="História" side="right" />
      <TrailNode x={196} y={288} kind="challenge" state="locked" label="Desafio" side="left" />
      <span className="peek" style={{ left: 252, top: 246 }}>
        <ChestMini />
      </span>
      <WoodSign unit="Unidade 2" title="Cores" locked compact style={{ left: 50, top: 398, width: 290 }} />
      {ghost.map(([x, y], i) => (
        <TrailNode key={i} x={x} y={y} kind={i === 0 ? "song" : "lesson"} state="locked" />
      ))}
      <span className="peek" style={{ left: 300, top: 566 }}>
        <Animal id="bear" size={70} />
      </span>
      <TopChips stars={2} days={3} />
      <BottomNav />
    </>
  );
}

function ChestMini() {
  return (
    <svg viewBox="0 0 80 70" width="84" height="74" aria-hidden="true">
      <ellipse cx="40" cy="64" rx="34" ry="5" fill="rgba(31,60,40,.2)" />
      <rect x="8" y="26" width="64" height="36" rx="6" fill="#B9733F" />
      <path d="M8 30 q0 -22 32 -22 q32 0 32 22z" fill="#C98548" />
      <rect x="8" y="27" width="64" height="7" fill="#8B5A3C" />
      <rect x="18" y="8" width="8" height="54" fill="#FFC93C" />
      <rect x="54" y="8" width="8" height="54" fill="#FFC93C" />
      <rect x="33" y="24" width="14" height="16" rx="3" fill="#FFC93C" />
      <circle cx="40" cy="31" r="2.6" fill="#2B2D42" />
    </svg>
  );
}

function PhoneExercise({ variant, state }: { variant: Variant; state: "answering" | "correct" | "retry" }) {
  const tiles: ArtId[] = ["bird", "bear", "frog", "mouse"];
  const tileState = (id: ArtId) => (state === "correct" ? (id === "bear" ? "correct" : "dim") : state === "retry" && id === "frog" ? "wrong" : undefined);
  return (
    <>
      <LessonScene w={PW} h={PH} variant={variant} />
      <div className="lesson">
        <LessonTop ratio={0.3} />
        <div className="ask">
          <Cat expression={state === "correct" ? "happy" : state === "retry" ? "helping" : "pointing"} size={116} />
          <Bubble>
            <span className="bubble-text">
              Qual é o <b lang="en">bear</b>? Toque nele!
            </span>
            <SpeakerButton />
          </Bubble>
        </div>
        <div className="tiles is-2">
          {tiles.map((id) => (
            <Tile key={id} id={id} size={166} state={tileState(id)} />
          ))}
        </div>
      </div>
      {state === "correct" && (
        <Sheet kind="correct" button="Continuar">
          <b lang="en">Yes! That&apos;s great!</b>
        </Sheet>
      )}
      {state === "retry" && (
        <Sheet kind="retry">
          Opa! Vamos tentar de novo.
        </Sheet>
      )}
    </>
  );
}

function PhoneOpening() {
  const words: [ArtId, string][] = [
    ["bear", "bear"],
    ["bird", "bird"],
    ["frog", "frog"],
  ];
  return (
    <>
      <LessonScene w={PW} h={PH} variant="forest" />
      <Trees
        w={PW}
        h={PH}
        items={[
          ["pine", 28, 400, 0.7],
          ["round", 362, 392, 0.6],
          ["flower", 44, 800],
          ["mush", 340, 806],
        ]}
      />
      <div className="lesson">
        <div className="lesson-top">
          <CloseButton />
          <span className="pill">Lição 1</span>
        </div>
        <div className="hello">
          <Bubble tail="down">Oi! Hoje nós vamos aprender três animais da floresta!</Bubble>
          <Cat expression="happy" size={170} />
        </div>
        <div className="words">
          {words.map(([id, w]) => (
            <div key={id} className="word">
              <Tile id={id} size={104} />
              <b lang="en">{w}</b>
            </div>
          ))}
        </div>
        <span className="btn is-sun is-big">
          Começar
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <path d="M7 4 L20 12 L7 20Z" fill="currentColor" />
          </svg>
        </span>
      </div>
    </>
  );
}

function PhoneStart() {
  return (
    <>
      <TrailScene w={PW} h={PH} sun={false} clouds={false} />
      <Trees
        w={PW}
        h={PH}
        items={[
          ["pine", 30, 360, 0.8],
          ["pine", 78, 380, 0.56],
          ["round", 350, 356, 0.7],
          ["pine", 350, 620, 1.1],
          ["round", 34, 640, 0.9],
          ["flower", 100, 690],
          ["mush", 292, 720],
          ["flower", 320, 800],
        ]}
      />
      <div className="start">
        <h1 className="logo">Lingoo</h1>
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
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <path d="M7 4 L20 12 L7 20Z" fill="currentColor" />
          </svg>
        </span>
      </div>
    </>
  );
}

/* ---------- tablet screens (1024 × 768) ---------- */

const TW = 1024;
const TH = 768;
const T_POINTS: [number, number][] = [
  [540, 128],
  [680, 226],
  [774, 324],
  [670, 422],
  [540, 520],
  [650, 618],
];

function TabletMap() {
  return (
    <>
      <TrailScene w={TW} h={TH} />
      <Trees
        w={TW}
        h={TH}
        items={[
          ["pine", 60, 330, 0.8],
          ["pine", 130, 346, 0.56],
          ["round", 940, 330, 0.7],
          ["pine", 990, 350, 0.6],
          ["round", 930, 520, 0.95],
          ["pine", 410, 610, 0.9],
          ["pine", 60, 760, 1.25],
          ["round", 330, 760, 0.9],
          ["mush", 800, 560],
          ["flower", 380, 430],
          ["flower", 780, 700],
          ["mush", 270, 640],
          ["flower", 880, 740],
        ]}
      />
      <svg className="layer" viewBox={`0 0 ${TW} ${TH}`} width={TW} height={TH} aria-hidden="true">
        <ellipse cx="210" cy="560" rx="150" ry="48" fill="#3F9CE6" />
        <ellipse cx="210" cy="554" rx="150" ry="48" fill="#6FC0FF" />
        <ellipse cx="170" cy="540" rx="46" ry="10" fill="#fff" opacity=".35" />
      </svg>
      <Trail points={T_POINTS} w={TW} h={TH} extendTo={TH} />
      {UNIT_STOPS.map((s, i) => {
        const [x, y] = T_POINTS[i];
        const state = stateOf(i, 2);
        return <TrailNode key={i} x={x} y={y} size={84} kind={s.kind} state={state} label={state === "current" ? undefined : s.label} side={T_SIDES[i]} />;
      })}
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
      <TopChips stars={2} days={3} />
      <BottomNav wide />
    </>
  );
}

function TabletExercise({ state }: { state: "answering" | "correct" }) {
  const tiles: ArtId[] = ["bird", "bear", "frog", "mouse"];
  return (
    <>
      <LessonScene w={TW} h={TH} variant="forest" />
      <div className="lesson is-tablet">
        <LessonTop ratio={0.3} />
        <div className="ask">
          <Cat expression={state === "correct" ? "happy" : "pointing"} size={150} />
          <Bubble>
            <span className="bubble-text">
              Qual é o <b lang="en">bear</b>? Toque nele!
            </span>
            <SpeakerButton />
          </Bubble>
        </div>
        <div className="tiles is-4">
          {tiles.map((id) => (
            <Tile key={id} id={id} size={214} state={state === "correct" ? (id === "bear" ? "correct" : "dim") : undefined} />
          ))}
        </div>
      </div>
      {state === "correct" && (
        <Sheet kind="correct" button="Continuar" wide>
          <b lang="en">Yes! That&apos;s great!</b>
        </Sheet>
      )}
    </>
  );
}

function TabletStart() {
  return (
    <>
      <TrailScene w={TW} h={TH} clouds={false} />
      <Trees
        w={TW}
        h={TH}
        items={[
          ["round", 560, 322, 0.6],
          ["round", 950, 340, 0.8],
          ["pine", 1004, 366, 0.6],
          ["pine", 70, 740, 1.3],
          ["round", 980, 730, 1.1],
          ["flower", 300, 700],
          ["mush", 740, 720],
          ["flower", 820, 610],
        ]}
      />
      <div className="start is-tablet">
        <div>
          <h1 className="logo">Lingoo</h1>
          <p className="tagline">Inglês para brincar</p>
          <span className="btn is-sun is-big">
            Jogar
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
              <path d="M7 4 L20 12 L7 20Z" fill="currentColor" />
            </svg>
          </span>
        </div>
        <div className="start-cast">
          <span className="cast cast-l">
            <Animal id="bear" size={130} />
          </span>
          <Cat expression="happy" size={300} />
          <span className="cast cast-r">
            <Animal id="bird" size={110} />
          </span>
        </div>
      </div>
    </>
  );
}

/* ---------- page ---------- */

function Device({ kind, name, children }: { kind: "phone" | "tablet"; name: string; children: ReactNode }) {
  return (
    <figure className={`device is-${kind}`}>
      <div className="screen">{children}</div>
      <figcaption>{name}</figcaption>
    </figure>
  );
}

function Page() {
  return (
    <main>
      <section data-sheet="1-celular-mapa">
        <h2>Celular em pé: o mapa em trilha</h2>
        <div className="row">
          <Device kind="phone" name="Versão A, floresta ilustrada">
            <PhoneMap variant="forest" />
          </Device>
          <Device kind="phone" name="Versão A, rolando para baixo">
            <PhoneMapScrolled />
          </Device>
          <Device kind="phone" name="Versão B, blocos de cor">
            <PhoneMap variant="blocks" />
          </Device>
        </div>
      </section>
      <section data-sheet="2-celular-licao">
        <h2>Celular em pé: a lição</h2>
        <div className="row">
          <Device kind="phone" name="Exercício, versão A">
            <PhoneExercise variant="forest" state="answering" />
          </Device>
          <Device kind="phone" name="Acertou">
            <PhoneExercise variant="forest" state="correct" />
          </Device>
          <Device kind="phone" name="Errou">
            <PhoneExercise variant="forest" state="retry" />
          </Device>
          <Device kind="phone" name="Exercício, versão B">
            <PhoneExercise variant="blocks" state="answering" />
          </Device>
        </div>
      </section>
      <section data-sheet="3-celular-abertura-inicio">
        <h2>Celular em pé: tela inicial e abertura da lição</h2>
        <div className="row">
          <Device kind="phone" name="Tela inicial">
            <PhoneStart />
          </Device>
          <Device kind="phone" name="Abertura da lição">
            <PhoneOpening />
          </Device>
        </div>
      </section>
      <section data-sheet="4-tablet-mapa-inicio">
        <h2>Tablet deitado: mapa e tela inicial</h2>
        <div className="row">
          <Device kind="tablet" name="Mapa em trilha">
            <TabletMap />
          </Device>
          <Device kind="tablet" name="Tela inicial">
            <TabletStart />
          </Device>
        </div>
      </section>
      <section data-sheet="5-tablet-licao">
        <h2>Tablet deitado: a lição</h2>
        <div className="row">
          <Device kind="tablet" name="Exercício">
            <TabletExercise state="answering" />
          </Device>
          <Device kind="tablet" name="Acertou">
            <TabletExercise state="correct" />
          </Device>
        </div>
      </section>
    </main>
  );
}

const css = `
*{box-sizing:border-box}
body{margin:0;background:#EEF1F6;font-family:Nunito,system-ui,sans-serif;color:#2B2D42}
main{padding:36px;display:flex;flex-direction:column;gap:48px;width:max-content}
section{padding:28px 32px 32px;background:#EEF1F6}
h2{font-family:"Baloo 2";font-weight:800;font-size:34px;margin:0 0 20px}
.row{display:flex;gap:36px;align-items:flex-start}
.device{margin:0}
.device figcaption{font-weight:800;font-size:19px;margin-top:14px;text-align:center}
.device .screen{position:relative;overflow:hidden;background:#5CC46B;border:10px solid #23243A}
.device.is-phone .screen{width:410px;height:864px;border-radius:46px}
.device.is-tablet .screen{width:1044px;height:788px;border-radius:34px}
.layer{position:absolute;inset:0;display:block}

/* trail nodes */
.node{position:absolute;display:block}
.node-disc{position:absolute;inset:0;border-radius:50%;border:5px solid #fff;display:grid;place-items:center}
.node-ring{position:absolute;inset:-12px;border-radius:50%;border:5px dashed #fff;opacity:.95}
.node-check{position:absolute;right:-6px;top:-6px;width:30px;height:30px;border-radius:50%;background:#2F9E5B;border:4px solid #fff;display:grid;place-items:center}
.node-label{position:absolute;top:50%;transform:translateY(-50%);white-space:nowrap;font-family:"Baloo 2";font-weight:800;font-size:17px;line-height:1;padding:7px 12px 6px;border-radius:14px;background:#fff;color:#2B2D42;box-shadow:0 4px 0 rgba(31,60,40,.18)}
.node-label.is-right{left:calc(100% + 12px)}
.node-label.is-left{right:calc(100% + 12px)}
.node-label.is-locked{background:rgba(255,255,255,.72);color:#5E6475;box-shadow:none}
.guide{position:absolute;display:flex;flex-direction:column;align-items:center;gap:2px}
.peek{position:absolute;display:block}

/* chips */
.chips{position:absolute;left:16px;right:16px;top:14px;display:flex;justify-content:space-between;align-items:center}
.chip{display:inline-flex;align-items:center;gap:6px;background:#fff;border-radius:18px;padding:7px 14px;box-shadow:0 4px 0 rgba(31,60,40,.18);font-family:"Baloo 2";font-weight:800;font-size:20px;line-height:1}
.chip-days{gap:7px;padding:8px 12px 5px}
.day{display:inline-flex;flex-direction:column;align-items:center;gap:1px}
.day i{width:15px;height:15px;border-radius:50%;background:#E3E7EE;display:block}
.day.is-on i{background:#FFC93C;box-shadow:inset 0 0 0 3px #FFE48F}
.day em{font-style:normal;font-family:Nunito;font-weight:900;font-size:10px;color:#7A8094}

/* wooden sign */
.sign{position:absolute}
.sign-post{position:absolute;top:-24px;width:8px;height:30px;background:#8B5A3C;border-radius:4px}
.sign-post-l{left:34px}.sign-post-r{right:34px}
.sign-board{position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;background:#C98548;border-radius:20px;padding:12px 16px 12px 18px;box-shadow:0 8px 0 #8B5A3C, 0 14px 0 rgba(31,60,40,.2);border:4px solid #DDA066}
.sign-text small{display:block;font-family:Nunito;font-weight:900;font-size:14px;color:#FFE9CF;line-height:1.1}
.sign-text strong{display:block;font-family:"Baloo 2";font-weight:800;font-size:25px;line-height:1.05;color:#fff;text-shadow:0 2px 0 #8B5A3C}
.sign-progress{display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex:none}
.sign-bar{width:84px;height:14px;border-radius:8px;background:#8B5A3C;display:block;overflow:hidden}
.sign-bar i{display:block;height:100%;background:#FFC93C;border-radius:8px}
.sign-progress em{font-style:normal;font-family:Nunito;font-weight:900;font-size:13px;color:#FFE9CF}
.sign-lock{width:48px;height:48px;border-radius:50%;background:#8B5A3C;display:grid;place-items:center;flex:none}
.sign.is-locked .sign-board{background:#B9A58F;border-color:#CDBDAA;box-shadow:0 8px 0 #8F7F6C, 0 14px 0 rgba(31,60,40,.2)}
.sign.is-locked .sign-text strong{text-shadow:0 2px 0 #8F7F6C}
.sign.is-locked .sign-lock{background:#8F7F6C}
.sign.is-compact .sign-text strong{font-size:23px}

/* bottom nav */
.nav{position:absolute;left:0;right:0;bottom:0;height:78px;background:#FFF8EC;border-radius:26px 26px 0 0;display:flex;justify-content:space-around;align-items:center;padding:0 22px;box-shadow:0 -5px 0 rgba(31,60,40,.14)}
.nav.is-wide{left:50%;right:auto;transform:translateX(-50%);width:380px;bottom:14px;border-radius:26px;box-shadow:0 6px 0 rgba(31,60,40,.2)}
.tab{display:inline-flex;align-items:center;gap:9px;font-family:"Baloo 2";font-weight:800;font-size:20px;color:#7A8094;padding:9px 20px;border-radius:18px}
.tab.is-active{background:#5CC46B;color:#fff;box-shadow:0 5px 0 #2F9E5B}

/* bubbles and buttons */
.bubble{position:relative;background:#fff;border-radius:22px;padding:13px 16px;font-family:"Baloo 2";font-weight:700;font-size:21px;line-height:1.2;box-shadow:0 5px 0 rgba(31,60,40,.18);display:flex;align-items:center;gap:10px}
.bubble-text{flex:1}
.bubble b{color:#2C82CC;font-weight:800}
.bubble.tail-left::before{content:"";position:absolute;left:-10px;top:50%;margin-top:-10px;border:10px solid transparent;border-right-color:#fff;border-left:0}
.bubble.tail-down{font-size:19px;padding:9px 14px;text-align:center;display:block}
.bubble.tail-down::after{content:"";position:absolute;left:50%;bottom:-10px;margin-left:-10px;border:10px solid transparent;border-top-color:#fff;border-bottom:0}
.round-btn{flex:none;width:52px;height:52px;border-radius:50%;display:grid;place-items:center}
.round-btn.is-sky{background:#4AA8F0;box-shadow:0 5px 0 #2C82CC}
.round-btn.is-white{background:#fff;box-shadow:0 5px 0 rgba(31,60,40,.2)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;font-family:"Baloo 2";font-weight:800;font-size:24px;line-height:1;border-radius:22px;padding:17px 26px 15px;color:#2B2D42}
.btn.is-sun{background:#FFC93C;box-shadow:0 7px 0 #DE9F12}
.btn.is-leaf{background:#5CC46B;color:#fff;box-shadow:0 7px 0 #2F9E5B}
.btn.is-big{font-size:30px;padding:20px 30px 18px;border-radius:26px}
.pill{font-family:"Baloo 2";font-weight:800;font-size:20px;background:#fff;border-radius:18px;padding:8px 16px 6px;box-shadow:0 4px 0 rgba(31,60,40,.18)}

/* lesson */
.lesson{position:absolute;inset:0;padding:14px 16px 0;display:flex;flex-direction:column;gap:18px}
.lesson-top{display:flex;align-items:center;gap:12px}
.bar{flex:1;height:22px;border-radius:12px;background:#fff;box-shadow:inset 0 0 0 3px #fff, 0 4px 0 rgba(31,60,40,.16);overflow:hidden;display:block}
.bar i{display:block;height:100%;border-radius:12px;background:#5CC46B;box-shadow:inset 0 5px 0 #86DA92}
.ask{display:flex;align-items:center;gap:12px}
.ask .bubble{flex:1}
.tiles{display:grid;gap:14px;justify-content:center;margin-top:6px}
.tiles.is-2{grid-template-columns:repeat(2,auto)}
.tiles.is-4{grid-template-columns:repeat(4,auto);gap:22px}
.tile{position:relative;background:#fff;border-radius:30px;border:5px solid #E1E7EF;box-shadow:0 9px 0 #C5CFDC;display:grid;place-items:center}
.tile.is-correct{border-color:#5CC46B;box-shadow:0 9px 0 #2F9E5B;background:#F1FBF2}
.tile.is-wrong{border-color:#FFA94D;box-shadow:0 9px 0 #E08A2C;background:#FFF5E8;transform:rotate(-3deg)}
.tile.is-dim{opacity:.55}
.tile-badge{position:absolute;right:-10px;top:-10px;width:38px;height:38px;border-radius:50%;background:#2F9E5B;border:4px solid #fff;display:grid;place-items:center}
.lesson.is-tablet{padding:18px 28px 0;gap:22px}
.lesson.is-tablet .bubble{font-size:28px;padding:18px 22px}
.lesson.is-tablet .ask{max-width:820px;margin:0 auto;width:100%}
.lesson.is-tablet .tiles{margin-top:16px}

/* feedback sheet */
.sheet{position:absolute;left:0;right:0;bottom:0;border-radius:30px 30px 0 0;padding:26px 20px 24px;display:flex;flex-direction:column;gap:16px}
.sheet.is-correct{background:#2F9E5B;box-shadow:0 -7px 0 #1F7A4D}
.sheet.is-retry{background:#FFA94D;box-shadow:0 -6px 0 #E08A2C;padding-bottom:40px}
.sheet-text{margin:0;font-family:"Baloo 2";font-weight:800;font-size:32px;line-height:1.1;color:#fff;text-shadow:0 2px 0 rgba(20,60,40,.35)}
.sheet.is-retry .sheet-text{color:#2B2D42;text-shadow:none}
.sheet-btn{width:100%}
.sheet.is-wide{flex-direction:row;align-items:center;justify-content:space-between;padding:28px 40px 30px}
.sheet.is-wide .sheet-text{font-size:40px}
.sheet.is-wide .sheet-btn{width:auto;min-width:260px}

/* opening */
.hello{display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:6px}
.hello .bubble{font-size:23px;max-width:330px;padding:14px 18px}
.words{display:flex;justify-content:center;gap:12px}
.word{display:flex;flex-direction:column;align-items:center;gap:12px}
.word b{font-family:"Baloo 2";font-weight:800;font-size:22px;line-height:1;background:#fff;border-radius:14px;padding:6px 14px 4px;color:#2C82CC;box-shadow:0 4px 0 rgba(31,60,40,.18)}
.lesson > .btn{margin:auto 8px 30px}

/* start */
.start{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:86px 24px 44px}
.logo{margin:0;font-family:"Baloo 2";font-weight:800;font-size:92px;line-height:.9;color:#fff;text-shadow:0 4px 0 #2C82CC, 0 9px 0 rgba(31,60,40,.22);letter-spacing:-1px}
.tagline{margin:10px 0 0;font-family:"Baloo 2";font-weight:700;font-size:23px;color:#1F5E96}
.start-cast{position:relative;margin-top:auto;display:flex;align-items:flex-end;justify-content:center}
.cast{display:block}
.cast-l{margin-right:-22px;margin-bottom:6px}
.cast-r{margin-left:-18px;margin-bottom:2px}
.start > .btn{margin-top:26px;width:100%}
.start.is-tablet{flex-direction:row;align-items:center;justify-content:center;gap:70px;padding:60px}
.start.is-tablet .logo{font-size:132px}
.start.is-tablet .tagline{font-size:32px;margin-bottom:34px}
.start.is-tablet .start-cast{margin-top:120px}
.start.is-tablet .btn{min-width:300px}
`;

const artCss = readFileSync(resolve(root, "src/art/art.css"), "utf8");
const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
<style>${artCss}</style><style>${css}</style></head>
<body>${renderToStaticMarkup(<Page />)}</body></html>`;

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "mockups.html"), html);
console.log(`wrote ${resolve(outDir, "mockups.html")}`);
