import { GROUND, INK, MOUTH, PINK, SKY, SUN } from "./shared";

// The gatinho, ported from the approved samples (docs/arte/amostras-aprovadas/arte-fonte.html,
// functions cat/eyes/mouth). Coordinates are kept as approved; only the viewBox gained headroom
// so the "happy" jump and the tilted "listening" ear never touch the edge.

export type CatExpression = "idle" | "talking" | "happy" | "pointing" | "helping" | "listening";

const CAT = "#FF9F43";
const CAT_DARK = "#EE8226";
const CAT_LIGHT = "#FFF1DE";

const VIEW = { x: -4, y: -22, width: 218, height: 256 };

const limb = { stroke: CAT, strokeWidth: 18, strokeLinecap: "round", fill: "none" } as const;
const line = (width: number, color = INK) =>
  ({ fill: "none", stroke: color, strokeWidth: width, strokeLinecap: "round" }) as const;

function Arms({ expression }: { expression: CatExpression }) {
  switch (expression) {
    case "happy":
      return (
        <>
          <path d="M62 152 q-34 -10 -44 -42" {...limb} />
          <path d="M138 152 q34 -10 44 -42" {...limb} />
          <circle cx="17" cy="106" r="11" fill={CAT_LIGHT} />
          <circle cx="183" cy="106" r="11" fill={CAT_LIGHT} />
        </>
      );
    case "pointing":
      return (
        <>
          <path d="M64 158 q-6 18 4 28" {...limb} />
          <path d="M136 150 q30 -6 52 -18" {...limb} />
          <circle cx="190" cy="131" r="11" fill={CAT_LIGHT} />
        </>
      );
    case "helping":
      return (
        <>
          <path d="M64 158 q-6 18 4 28" {...limb} />
          <path d="M136 156 q22 -6 26 -34" {...limb} />
          <circle cx="162" cy="118" r="11" fill={CAT_LIGHT} />
          <path d="M178 92 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4z" fill={SUN} />
          <path d="M30 70 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3z" fill={SUN} />
        </>
      );
    default:
      // idle, talking, listening: both arms resting down along the body.
      return (
        <>
          <path d="M64 158 q-6 18 4 28" {...limb} />
          <path d="M136 158 q6 18 -4 28" {...limb} />
        </>
      );
  }
}

function Eyes({ expression }: { expression: CatExpression }) {
  if (expression === "happy") {
    return (
      <>
        <path d="M62 90 q12 -14 24 0" {...line(6)} />
        <path d="M114 90 q12 -14 24 0" {...line(6)} />
      </>
    );
  }
  // pointing looks towards the paw; listening looks up, towards the tilted ear.
  const [dx, dy] = expression === "pointing" ? [4, 0] : expression === "listening" ? [-3, -6] : [0, 0];
  return (
    <g className="blink">
      <ellipse cx={74 + dx} cy={88 + dy} rx="12" ry="14" fill={INK} />
      <ellipse cx={126 + dx} cy={88 + dy} rx="12" ry="14" fill={INK} />
      <circle cx={78 + dx} cy={82 + dy} r="4.5" fill="#fff" />
      <circle cx={130 + dx} cy={82 + dy} r="4.5" fill="#fff" />
      <circle cx={71 + dx} cy={94 + dy} r="2" fill="#fff" />
      <circle cx={123 + dx} cy={94 + dy} r="2" fill="#fff" />
    </g>
  );
}

function Mouth({ expression }: { expression: CatExpression }) {
  switch (expression) {
    case "happy":
      return (
        <>
          <path d="M86 110 q14 22 28 0 z" fill={MOUTH} />
          <path d="M93 118 q7 6 14 0 q-7 -5 -14 0z" fill={PINK} />
        </>
      );
    case "talking":
      return (
        <g className="art-cat-mouth">
          <path d="M90 110 q10 15 20 0 z" fill={MOUTH} />
          <path d="M94.5 116.5 q5.5 4.5 11 0 q-5.5 -4 -11 0z" fill={PINK} />
        </g>
      );
    case "helping":
      return <path d="M90 110 q10 9 20 0" {...line(4)} />;
    default:
      return <path d="M100 108 q-7 9 -14 3 M100 108 q7 9 14 3" {...line(4)} />;
  }
}

function LeftEar() {
  return (
    <>
      <path d="M44 66 L40 14 Q42 6 50 10 L88 44 Z" fill={CAT} />
      <path d="M52 52 L50 24 L74 44 Z" fill={PINK} />
    </>
  );
}

export function Cat({ expression, size = 220 }: { expression: CatExpression; size?: number }) {
  const listening = expression === "listening";
  const headTilt = expression === "helping" ? "rotate(-6 100 95)" : undefined;
  return (
    <svg
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`}
      width={size}
      height={Math.round((size * VIEW.height) / VIEW.width)}
      role="img"
      aria-label="Gatinho"
      data-expression={expression}
      className="art-cat"
    >
      <ellipse className="art-cat-shadow" cx="100" cy="222" rx="58" ry="8" fill={GROUND} />
      <g className="art-cat-figure">
        <g className="art-cat-tail">
          <path d="M140 196 C192 192 196 132 168 120 C156 115 150 128 160 134 C176 142 172 178 134 182 Z" fill={CAT} />
          <path d="M168 120 C156 115 150 128 160 134 C164 128 168 124 168 120Z" fill={CAT_DARK} />
        </g>
        <ellipse cx="100" cy="176" rx="46" ry="44" fill={CAT} />
        <ellipse cx="100" cy="184" rx="27" ry="30" fill={CAT_LIGHT} />
        <ellipse cx="78" cy="216" rx="18" ry="10" fill={CAT} />
        <ellipse cx="122" cy="216" rx="18" ry="10" fill={CAT} />
        <ellipse cx="78" cy="218" rx="10" ry="5" fill={CAT_LIGHT} />
        <ellipse cx="122" cy="218" rx="10" ry="5" fill={CAT_LIGHT} />
        <Arms expression={expression} />
        {listening ? (
          // Sound arriving at the tilted ear.
          <g>
            <path d="M22 34 q-7 10 0 20" {...line(4, SKY)} />
            <path d="M11 27 q-11 17 0 34" {...line(4, SKY)} opacity={0.6} />
          </g>
        ) : null}
        <g transform={headTilt}>
          {listening ? (
            <g transform="rotate(-20 64 54)">
              <g className="art-cat-ear-twitch">
                <LeftEar />
              </g>
            </g>
          ) : (
            <LeftEar />
          )}
          <path d="M156 66 L160 14 Q158 6 150 10 L112 44 Z" fill={CAT} />
          <path d="M148 52 L150 24 L126 44 Z" fill={PINK} />
          <ellipse cx="100" cy="92" rx="66" ry="58" fill={CAT} />
          <path d="M88 38 q4 12 0 20 M100 36 q4 14 0 24 M112 38 q4 12 0 20" {...line(6, CAT_DARK)} />
          <ellipse cx="100" cy="112" rx="30" ry="21" fill={CAT_LIGHT} />
          <Eyes expression={expression} />
          <path d="M93 100 h14 q-7 9 -7 9 q0 0 -7 -9z" fill={PINK} stroke={PINK} strokeWidth="3" strokeLinejoin="round" />
          <Mouth expression={expression} />
          <ellipse cx="56" cy="112" rx="11" ry="7" fill="#FF7A6B" opacity=".35" />
          <ellipse cx="144" cy="112" rx="11" ry="7" fill="#FF7A6B" opacity=".35" />
          <path d="M40 104 l-18 -4 M40 112 l-18 2 M160 104 l18 -4 M160 112 l18 2" {...line(3, CAT_DARK)} />
        </g>
      </g>
    </svg>
  );
}
