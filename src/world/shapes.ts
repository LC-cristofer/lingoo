/* Flat-shape SVG helpers (same rules as Nino: no outlines, light from the upper left). Pure, seeded, no DOM. */
import { PAL } from "./palette";

export function rng(seed: number): () => number { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
export const f1 = (n: number) => Math.round(n * 10) / 10;
type Pt = [number, number];
export function smooth(pts: Pt[], closed = true): string {
  const n = pts.length, P = (i: number) => pts[(i + n) % n];
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = closed ? P(i - 1) : pts[Math.max(0, i - 1)], p1 = P(i), p2 = closed ? P(i + 1) : pts[Math.min(n - 1, i + 1)], p3 = closed ? P(i + 2) : pts[Math.min(n - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return closed ? d + "Z" : d;
}
export function blob(cx: number, cy: number, rx: number, ry: number, n: number, jit: number, seed: number): string {
  const r = rng(seed), pts: Pt[] = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * 2 * jit; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  return smooth(pts);
}
export const shadowAt = (x: number, y: number, rx: number, ry = rx * 0.28, o = 0.16) => `<ellipse cx="${f1(x + rx * 0.12)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="rgba(58,38,24,${o})"/>`;

/* A round, flat "lollipop" form lit from the upper left: shade crescent + base + light spot. */
export function puff(cx: number, cy: number, r: number, base: string, dark: string, light: string): string {
  return `<circle cx="${f1(cx + r * 0.1)}" cy="${f1(cy + r * 0.12)}" r="${f1(r)}" fill="${dark}"/>` +
    `<circle cx="${f1(cx - r * 0.04)}" cy="${f1(cy - r * 0.04)}" r="${f1(r * 0.93)}" fill="${base}"/>` +
    `<circle cx="${f1(cx - r * 0.32)}" cy="${f1(cy - r * 0.34)}" r="${f1(r * 0.42)}" fill="${light}" opacity=".7"/>`;
}
export function tree(x: number, y: number, s = 1, seed = 1): string {
  const r = rng(seed), h = 70 * s;
  let g = shadowAt(x + 6 * s, y + 2, 34 * s);
  g += `<path d="M${f1(x - 7 * s)} ${f1(y)} q${f1(2 * s)} ${f1(-h * 0.6)} ${f1(3 * s)} ${f1(-h)} h${f1(8 * s)} q${f1(1 * s)} ${f1(h * 0.4)} ${f1(3 * s)} ${f1(h)} z" fill="${PAL.trunk}"/>`;
  g += `<path d="M${f1(x + 2 * s)} ${f1(y)} q${f1(1 * s)} ${f1(-h * 0.5)} ${f1(2 * s)} ${f1(-h)} h${f1(3 * s)} q${f1(1 * s)} ${f1(h * 0.4)} ${f1(2 * s)} ${f1(h)} z" fill="${PAL.trunkDark}"/>`;
  const cy = y - h - 22 * s, parts = [[0, 0, 40], [-26, 14, 28], [27, 12, 30], [-8, -24, 28]];
  let dark = "", base = "", light = "";
  for (const [dx, dy, rr] of parts) {
    const R = rr * s * (0.92 + r() * 0.16), X = x + dx * s, Y = cy + dy * s;
    dark += `<circle cx="${f1(X + R * 0.12)}" cy="${f1(Y + R * 0.14)}" r="${f1(R)}"/>`;
    base += `<circle cx="${f1(X - R * 0.05)}" cy="${f1(Y - R * 0.05)}" r="${f1(R * 0.92)}"/>`;
    light += `<circle cx="${f1(X - R * 0.34)}" cy="${f1(Y - R * 0.36)}" r="${f1(R * 0.4)}"/>`;
  }
  return g + `<g class="sway" style="transform-origin:${f1(x)}px ${f1(y - h)}px"><g fill="${PAL.leafDark}">${dark}</g><g fill="${PAL.leaf}">${base}</g><g fill="${PAL.leafLight}" opacity=".65">${light}</g></g>`;
}
export function bush(x: number, y: number, s = 1): string {
  return shadowAt(x + 4, y + 2, 26 * s, 6 * s) + puff(x - 12 * s, y - 12 * s, 15 * s, PAL.leaf, PAL.leafDark, PAL.leafLight) + puff(x + 10 * s, y - 14 * s, 17 * s, PAL.leaf, PAL.leafDark, PAL.leafLight) + puff(x, y - 24 * s, 14 * s, PAL.leaf, PAL.leafDark, PAL.leafLight);
}
export function rock(x: number, y: number, s = 1, seed = 3): string {
  return shadowAt(x + 3, y + 2, 20 * s, 5 * s) + `<path d="${blob(x, y - 9 * s, 20 * s, 12 * s, 7, 0.14, seed)}" fill="${PAL.rockDark}"/><path d="${blob(x - 3 * s, y - 11 * s, 16 * s, 9 * s, 7, 0.12, seed + 1)}" fill="${PAL.rock}"/><ellipse cx="${f1(x - 8 * s)}" cy="${f1(y - 15 * s)}" rx="${f1(6 * s)}" ry="${f1(3 * s)}" fill="${PAL.rockLight}"/>`;
}
export function flower(x: number, y: number, c: string, s = 1): string {
  return `<path d="M${f1(x)} ${f1(y)} q-1 -6 0 -10" stroke="${PAL.leafDark}" stroke-width="${f1(2 * s)}" fill="none" stroke-linecap="round"/>` +
    `<g fill="${c}">${[0, 72, 144, 216, 288].map(a => `<circle cx="${f1(x + Math.cos(a * Math.PI / 180) * 4 * s)}" cy="${f1(y - 11 * s + Math.sin(a * Math.PI / 180) * 4 * s)}" r="${f1(3.4 * s)}"/>`).join("")}</g><circle cx="${f1(x)}" cy="${f1(y - 11 * s)}" r="${f1(2.4 * s)}" fill="#FFE07A"/>`;
}
export function mushrooms(x: number, y: number): string {
  const m = (mx: number, my: number, k: number) => `<rect x="${mx - 2.5 * k}" y="${my - 9 * k}" width="${5 * k}" height="${9 * k}" rx="${2 * k}" fill="${PAL.cream}"/><path d="M${mx - 9 * k} ${my - 8 * k} a${9 * k} ${7 * k} 0 0 1 ${18 * k} 0z" fill="${PAL.letras}"/><circle cx="${mx - 3 * k}" cy="${my - 11 * k}" r="${1.6 * k}" fill="#fff"/><circle cx="${mx + 3 * k}" cy="${my - 12 * k}" r="${1.3 * k}" fill="#fff"/>`;
  return shadowAt(x + 4, y + 1, 14, 3) + m(x, y, 1.2) + m(x + 12, y + 3, 0.8);
}
export function tuft(x: number, y: number, s = 1): string { return `<path d="M${f1(x - 6 * s)} ${f1(y)} q2 -9 4 -12 q1 7 2 10 q2 -9 5 -13 q0 9 1 12 q2 -6 5 -8 q-1 6 -2 11z" fill="${PAL.grassDark}"/>`; }
export function cloud(x: number, y: number, s = 1, o = 1): string {
  const c: [number, number, number][] = [[-40, 6, 22], [-14, -8, 30], [18, -2, 26], [42, 8, 18]];
  return `<g opacity="${o}"><g fill="${PAL.cloudShade}">${c.map(([dx, dy, r]) => `<circle cx="${f1(x + dx * s)}" cy="${f1(y + dy * s + 7 * s)}" r="${f1(r * s)}"/>`).join("")}<rect x="${f1(x - 58 * s)}" y="${f1(y + 8 * s)}" width="${f1(116 * s)}" height="${f1(22 * s)}" rx="${f1(11 * s)}"/></g>` +
    `<g fill="${PAL.cloud}">${c.map(([dx, dy, r]) => `<circle cx="${f1(x + dx * s)}" cy="${f1(y + dy * s)}" r="${f1(r * s)}"/>`).join("")}<rect x="${f1(x - 58 * s)}" y="${f1(y + 2 * s)}" width="${f1(116 * s)}" height="${f1(20 * s)}" rx="${f1(10 * s)}"/></g></g>`;
}
/* far islet with aerial perspective (mixed toward the sky) */
export function islet(x: number, y: number, s: number, seed: number, tint = 0.55): string {
  const mix = (a: string, b: string) => { const p = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * tint).toString(16).padStart(2, "0")).join(""); };
  const sky = PAL.skyMid;
  return `<path d="M${f1(x - 70 * s)} ${f1(y)} C${f1(x - 60 * s)} ${f1(y + 40 * s)} ${f1(x - 20 * s)} ${f1(y + 90 * s)} ${f1(x)} ${f1(y + 110 * s)} C${f1(x + 22 * s)} ${f1(y + 80 * s)} ${f1(x + 64 * s)} ${f1(y + 40 * s)} ${f1(x + 70 * s)} ${f1(y)} Z" fill="${mix(PAL.soilMid, sky)}"/>` +
    `<path d="${blob(x, y - 2 * s, 74 * s, 22 * s, 9, 0.12, seed)}" fill="${mix(PAL.grass, sky)}"/>` +
    `<g opacity=".9">${puff(x - 24 * s, y - 26 * s, 16 * s, mix(PAL.leaf, sky), mix(PAL.leafDark, sky), mix(PAL.leafLight, sky))}${puff(x + 6 * s, y - 32 * s, 20 * s, mix(PAL.leaf, sky), mix(PAL.leafDark, sky), mix(PAL.leafLight, sky))}</g>`;
}
export function butterfly(i: number): string {
  const c = [PAL.cores, PAL.lamp][i % 2];
  return `<g class="bfly" data-i="${i}"><g class="wing"><ellipse cx="-5" cy="-3" rx="6" ry="8" fill="${c}"/><ellipse cx="-4" cy="5" rx="4" ry="5" fill="${c}"/></g><g class="wing2"><ellipse cx="5" cy="-3" rx="6" ry="8" fill="${c}"/><ellipse cx="4" cy="5" rx="4" ry="5" fill="${c}"/></g><rect x="-1.3" y="-6" width="2.6" height="13" rx="1.3" fill="${PAL.ink}"/></g>`;
}
