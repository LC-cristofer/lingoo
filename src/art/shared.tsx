// Shared colours and small parts for the Lingoo art, so every character reads as drawn by the
// same hand: flat fills, no outlines, ink eyes with white shine dots, coral blush, a soft ground
// shadow. See docs/arte/guia-de-estilo.md.

export const INK = "#2B2D42";
export const SUN = "#FFC93C";
export const SKY = "#4AA8F0";
export const LEAF = "#5CC46B";
export const BLUSH = "#FF7A6B";
export const PINK = "#FF8FA3";
export const MOUTH = "#B23A48";
export const WHITE = "#fff";
/** Ground shadow: navy at 12%. */
export const GROUND = "rgba(43,45,66,.12)";
/** Shading shapes: black at 6%, laid over the base colour. */
export const SHADE_OPACITY = 0.06;

export function GroundShadow({ cx = 100, cy = 200, rx, ry = 7 }: { cx?: number; cy?: number; rx: number; ry?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={GROUND} />;
}

/** A pair of big round ink eyes with a large and a small shine dot, mirrored around x = 100. */
export function Eyes({ dx, cy, r, delay }: { dx: number; cy: number; r: number; delay?: string }) {
  const big = r * 0.38;
  const small = r * 0.17;
  return (
    <g className="blink" style={delay ? ({ "--blink-delay": delay } as React.CSSProperties) : undefined}>
      {[100 - dx, 100 + dx].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r={r} fill={INK} />
          <circle cx={cx + r * 0.36} cy={cy - r * 0.38} r={big} fill={WHITE} />
          <circle cx={cx - r * 0.34} cy={cy + r * 0.42} r={small} fill={WHITE} />
        </g>
      ))}
    </g>
  );
}

/**
 * Blush on both cheeks, mirrored around x = 100. Warm coats (orange, brown) take the approved
 * coral at 30–35%; on cool coats (blue, green, purple, grey) coral turns muddy, so those use
 * `cool`: pink at 75%.
 */
export function Cheeks({ dx, cy, rx = 11, ry = 7, cool = false }: { dx: number; cy: number; rx?: number; ry?: number; cool?: boolean }) {
  const fill = cool ? PINK : BLUSH;
  const opacity = cool ? 0.75 : 0.35;
  return (
    <>
      <ellipse cx={100 - dx} cy={cy} rx={rx} ry={ry} fill={fill} opacity={opacity} />
      <ellipse cx={100 + dx} cy={cy} rx={rx} ry={ry} fill={fill} opacity={opacity} />
    </>
  );
}

/** A four-point sparkle centred on (x, y), as in the approved "helping" gatinho. */
export function Sparkle({ x, y, r, fill = SUN, className }: { x: number; y: number; r: number; fill?: string; className?: string }) {
  const i = r * 0.29;
  const d = `M${x} ${y - r} L${x + i} ${y - i} L${x + r} ${y} L${x + i} ${y + i} L${x} ${y + r} L${x - i} ${y + i} L${x - r} ${y} L${x - i} ${y - i}Z`;
  return <path className={className} d={d} fill={fill} />;
}
