import { useId } from "react";
import { BLUSH, PINK, SUN, WHITE } from "../shared";

// The forest scenery, ported from the approved map (docs/arte/amostras-aprovadas/arte-fonte.html,
// functions map, pine, roundTree, mushroom, flower). The map variant keeps the approved
// coordinates (1136 × 640) without the path, the stops, the gatinho and the header: the map
// screen draws those on top. The story variant (1000 × 625, 16:10) is the same forest, softer:
// trees pushed to the edges and open ground in the middle so the characters stay readable.

const TRUNK = "#8B5A3C";
const PINE_DARK = "#2F9E5B";
const PINE_LIGHT = "#3DB56B";
const PINE2_DARK = "#33A862";
const PINE2_LIGHT = "#45BE75";
const TREE_DARK = "#4DBA6C";
const TREE = "#5CC46B";
const MUSHROOM_STEM = "#FFF1DE";
const STEM = "#3B9F57";
const SUN_FILL = "#FFE27A";
const HILL_FAR = "#A6DDA3";
const HILL_MID = "#7FCF85";
const HILL_NEAR = "#5CC46B";

export function Pine({ x, y, s, dark = PINE_DARK, light = PINE_LIGHT }: { x: number; y: number; s: number; dark?: string; light?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-7" y="0" width="14" height="26" rx="4" fill={TRUNK} />
      <path d="M0 -110 L44 -40 H-44Z" fill={light} />
      <path d="M0 -80 L54 0 H-54Z" fill={dark} />
      <path d="M0 -110 L44 -40 H8 L0 -60Z" fill="#000" opacity=".06" />
    </g>
  );
}

export function RoundTree({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-8" y="-10" width="16" height="40" rx="5" fill={TRUNK} />
      <circle cx="-26" cy="-34" r="30" fill={TREE_DARK} />
      <circle cx="24" cy="-36" r="32" fill={TREE_DARK} />
      <circle cx="0" cy="-62" r="36" fill={TREE} />
      <circle cx="12" cy="-70" r="12" fill={WHITE} opacity=".18" />
    </g>
  );
}

export function Mushroom({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-6" y="-14" width="12" height="16" rx="5" fill={MUSHROOM_STEM} />
      <path d="M-18 -12 q18 -26 36 0z" fill={BLUSH} />
      <circle cx="-6" cy="-19" r="3" fill={WHITE} />
      <circle cx="6" cy="-16" r="2.5" fill={WHITE} />
    </g>
  );
}

const PETALS = [0, 72, 144, 216, 288].map((a) => [7 * Math.cos((a * Math.PI) / 180), 7 * Math.sin((a * Math.PI) / 180)]);

export function Flower({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 v14" stroke={STEM} strokeWidth="3" />
      {PETALS.map(([cx, cy], i) => (
        <circle key={i} cx={cx.toFixed(2)} cy={cy.toFixed(2)} r="5" fill={color} />
      ))}
      <circle r="4" fill={SUN} />
    </g>
  );
}

function Sky({ id, width, height }: { id: string; width: number; height: number }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FD0FF" />
          <stop offset="1" stopColor="#DDF2FF" />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill={`url(#${id})`} />
    </>
  );
}

function Sun({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={SUN_FILL} />
      <circle cx={cx} cy={cy} r={r * 1.46} fill={SUN_FILL} opacity=".25" />
    </>
  );
}

function MapScenery() {
  return (
    <>
      <Sun cx={800} cy={170} r={52} />
      <g fill={WHITE} opacity=".95">
        <ellipse cx="200" cy="110" rx="70" ry="26" />
        <ellipse cx="240" cy="94" rx="40" ry="30" />
        <ellipse cx="640" cy="80" rx="60" ry="20" />
        <ellipse cx="670" cy="68" rx="34" ry="24" />
      </g>
      <path d="M0 300 Q180 210 380 280 T780 260 T1136 250 V640 H0Z" fill={HILL_FAR} />
      <path d="M0 360 Q240 300 470 350 T900 330 T1136 340 V640 H0Z" fill={HILL_MID} />
      <path d="M0 420 Q300 380 600 410 T1136 400 V640 H0Z" fill={HILL_NEAR} />
      <Pine x={70} y={330} s={1.1} />
      <Pine x={140} y={350} s={0.8} dark={PINE2_DARK} light={PINE2_LIGHT} />
      <RoundTree x={1060} y={340} s={1} />
      <Pine x={980} y={320} s={0.9} />
      <RoundTree x={560} y={300} s={0.7} />
      <Pine x={820} y={300} s={0.7} dark={PINE2_DARK} light={PINE2_LIGHT} />
      <Mushroom x={300} y={600} />
      <Mushroom x={318} y={606} />
      <Flower x={470} y={600} color={PINK} />
      <Flower x={860} y={560} color={WHITE} />
      <Flower x={890} y={575} color={PINK} />
      <Mushroom x={1080} y={540} />
      <RoundTree x={40} y={640} s={0.8} />
      <Pine x={1110} y={640} s={0.9} />
    </>
  );
}

function StoryScenery() {
  return (
    <>
      <Sun cx={860} cy={104} r={44} />
      <g fill={WHITE} opacity=".95">
        <ellipse cx="170" cy="92" rx="62" ry="23" />
        <ellipse cx="206" cy="78" rx="36" ry="27" />
        <ellipse cx="560" cy="64" rx="52" ry="18" />
        <ellipse cx="586" cy="54" rx="30" ry="21" />
      </g>
      <path d="M0 262 Q190 196 400 250 T800 232 T1000 236 V625 H0Z" fill={HILL_FAR} />
      <path d="M0 304 Q250 262 500 292 T1000 286 V625 H0Z" fill={HILL_MID} />
      <path d="M0 350 Q300 326 560 344 T1000 338 V625 H0Z" fill={HILL_NEAR} />
      {/* Trees only at the edges and far back: the middle stays open for the characters. */}
      <RoundTree x={480} y={262} s={0.42} />
      <Pine x={58} y={300} s={0.95} />
      <Pine x={124} y={318} s={0.66} dark={PINE2_DARK} light={PINE2_LIGHT} />
      <Pine x={872} y={286} s={0.6} dark={PINE2_DARK} light={PINE2_LIGHT} />
      <RoundTree x={948} y={318} s={0.85} />
      <Mushroom x={70} y={606} />
      <Mushroom x={88} y={613} />
      <Flower x={260} y={596} color={PINK} />
      <Flower x={612} y={604} color={WHITE} />
      <Flower x={918} y={590} color={WHITE} />
      <Flower x={944} y={602} color={PINK} />
    </>
  );
}

const SIZES = { map: [1136, 640], story: [1000, 625] } as const;

export function ForestBackdrop({ variant }: { variant: "map" | "story" }) {
  const skyId = `forest-sky-${useId().replace(/:/g, "")}`;
  const [width, height] = SIZES[variant];
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
      data-variant={variant}
      className="art-backdrop"
      style={{ display: "block", position: "absolute", inset: 0 }}
    >
      <Sky id={skyId} width={width} height={height} />
      {variant === "map" ? <MapScenery /> : <StoryScenery />}
    </svg>
  );
}
