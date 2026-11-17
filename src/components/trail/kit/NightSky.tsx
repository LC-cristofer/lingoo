"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type SkyVariant = "start" | "map" | "lesson" | "quiet";

/** The central band where the trail, the cards and the text live: stars there are rare and tiny. */
export const CONTENT_ZONE = { x0: 14, x1: 86, y0: 22, y1: 82 } as const;

export type Star = { x: number; y: number; size: 1 | 2 | 3; layer: "far" | "near"; lo: number; hi: number; dur: number; delay: number; rank: number };
export type Glint = { x: number; y: number; dur: number; delay: number };

/** mulberry32: a tiny seeded PRNG, so the sky is the same on every render and every device. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const inZone = (x: number, y: number) => x > CONTENT_ZONE.x0 && x < CONTENT_ZONE.x1 && y > CONTENT_ZONE.y0 && y < CONTENT_ZONE.y1;
const clamp = (n: number) => Math.min(99, Math.max(1, n));

/**
 * The star field: faint constellations (small clusters) plus a loose scatter, three sizes, two depth layers.
 * `density` keeps only the best-ranked share of the stars (calmer variants), never a different layout.
 */
export function generateStars(seed: number, density = 1): { stars: Star[]; glints: Glint[] } {
  const r = prng(seed);
  const stars: Star[] = [];
  const outside = (): [number, number] => {
    for (;;) {
      const x = r() * 100;
      const y = r() * 100;
      if (!inZone(x, y)) return [x, y];
    }
  };
  const add = (x: number, y: number, size: 1 | 2 | 3) => {
    // Rare, tiny and dim in the content zone; elsewhere as it comes.
    if (inZone(x, y) && (size !== 1 || r() > 0.18)) return;
    stars.push({
      x: round(clamp(x)),
      y: round(clamp(y)),
      size,
      layer: size === 1 && r() < 0.62 ? "far" : "near",
      lo: round(0.12 + r() * 0.16),
      hi: round(size === 1 ? 0.5 + r() * 0.3 : 0.7 + r() * 0.25),
      dur: round(3.4 + r() * 5.2, 1),
      delay: round(-r() * 9, 1),
      rank: round(r(), 3),
    });
  };
  const sizeOf = (): 1 | 2 | 3 => {
    const k = r();
    return k < 0.66 ? 1 : k < 0.92 ? 2 : 3;
  };
  // Eight faint constellations, centred in the margins.
  for (let c = 0; c < 8; c++) {
    const [cx, cy] = outside();
    const n = 4 + Math.floor(r() * 5);
    const spread = 5 + r() * 5;
    for (let i = 0; i < n; i++) {
      const ang = r() * Math.PI * 2;
      const dist = Math.sqrt(r()) * spread;
      add(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist * 0.6, i === 0 ? 3 : sizeOf());
    }
  }
  // A loose scatter of tiny ones between them.
  for (let i = 0; i < 26; i++) {
    const [x, y] = outside();
    add(x, y, r() < 0.85 ? 1 : 2);
  }
  // Make sure all three sizes exist whatever the seed did.
  for (const size of [2, 3] as const) {
    if (!stars.some((s) => s.size === size)) {
      const [x, y] = outside();
      add(x, y, size);
    }
  }
  const glints: Glint[] = [];
  const spots: [number, number][] = [
    [18 + r() * 12, 8 + r() * 8],
    [74 + r() * 16, 26 + r() * 6],
    [8 + r() * 14, 88 + r() * 6],
  ];
  for (const [x, y] of spots) if (!inZone(x, y)) glints.push({ x: round(x), y: round(y), dur: round(7 + r() * 3, 1), delay: round(-r() * 9, 1) });
  const kept = stars.filter((s) => s.rank < density);
  return { stars: kept, glints };
}

const SEED = 11;
const FULL = generateStars(SEED, 1);
const DENSITY: Record<SkyVariant, number> = { start: 1, map: 1, lesson: 0.55, quiet: 0.32 };
const SHOOTING: Record<SkyVariant, boolean> = { start: true, map: true, lesson: false, quiet: false };

const QUERY = "(prefers-reduced-motion: reduce)";
function subscribe(cb: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener?.("change", cb);
  return () => mq.removeEventListener?.("change", cb);
}
const prefersReduced = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(QUERY).matches : false);

/** Max scroll (px) that still shifts the layers: the far layer moves 1.5 % of it, the near one 4 %. */
const MAX_SCROLL = 2400;

type NightSkyProps = {
  variant?: SkyVariant;
  /** Optional page scroll offset (px): the two star layers drift by different amounts, a gentle parallax. */
  scroll?: number;
};

/**
 * The night sky behind every screen: gradient, two breathing pools of light, a vignette that calms the
 * centre, an organic deterministic star field in two layers, three soft glints and a rare shooting star.
 * Fixed to the viewport; only transform and opacity animate; reduced motion freezes a complete still.
 */
export function NightSky({ variant = "map", scroll }: NightSkyProps) {
  const reduced = useSyncExternalStore(subscribe, prefersReduced, () => false);
  const keep = DENSITY[variant];
  const stars = FULL.stars.filter((s) => s.rank < keep);
  const glints = keep < 0.5 ? FULL.glints.slice(0, 2) : FULL.glints;
  const s = Math.min(MAX_SCROLL, Math.max(0, scroll ?? 0));
  const layerStyle = (k: number): CSSProperties | undefined => (scroll === undefined ? undefined : { transform: `translate3d(0px, ${round(-s * k)}px, 0px)` });
  const renderStar = (st: Star, i: number) => (
    <i
      key={i}
      className={`ns-star is-${st.size === 1 ? "s" : st.size === 2 ? "m" : "l"}`}
      style={{ left: `${st.x}%`, top: `${st.y}%`, "--lo": st.lo, "--hi": st.hi, "--d": `${st.dur}s`, "--dl": `${st.delay}s`, opacity: round((st.lo + st.hi) / 2) } as CSSProperties}
    />
  );
  return (
    <div className={`ns ns-${variant} ${reduced ? "is-still" : ""}`} data-variant={variant} aria-hidden="true">
      <i className="ns-pool ns-pool-a" />
      <i className="ns-pool ns-pool-b" />
      <div className="ns-layer is-far" style={layerStyle(0.015)}>
        {stars.filter((st) => st.layer === "far").map(renderStar)}
      </div>
      <div className="ns-layer is-near" style={layerStyle(0.04)}>
        {stars.filter((st) => st.layer === "near").map(renderStar)}
        {glints.map((g, i) => (
          <i key={`g${i}`} className="ns-glint" style={{ left: `${g.x}%`, top: `${g.y}%`, "--d": `${g.dur}s`, "--dl": `${g.delay}s` } as CSSProperties} />
        ))}
      </div>
      <i className="ns-vignette" />
      {SHOOTING[variant] && !reduced ? <i className="ns-shoot" /> : null}
    </div>
  );
}
