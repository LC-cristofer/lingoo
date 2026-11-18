/* NESTOY · Ilha-Ninho — the world, drawn in SVG with the same rules as Nino:
   flat shapes, no outlines, light from the upper left, one shade + one light tone per material,
   soft contact shadows. Every colour comes from PAL (the bible's palette). */
"use strict";

const PAL = {
  skyTop: "#7CC4EE", skyMid: "#CDEBF8", skyLow: "#FFEFD9",
  cloud: "#FFFFFF", cloudShade: "#DCEBF6",
  grass: "#86CC5E", grassLight: "#9CDA74", grassDark: "#6DB64C", grassEdge: "#559B3D",
  soil: "#C08453", soilMid: "#A46A3E", soilDark: "#84512D", soilDeep: "#6A3E22",
  path: "#F6E2B8", pathEdge: "#E3C58C",
  water: "#6CCBE3", waterDeep: "#45AECB", waterLight: "#C2EEF7",
  rock: "#CBD3DC", rockDark: "#A1ADBB", rockLight: "#E3E8EE",
  wood: "#C98A4B", woodDark: "#9C6631", woodLight: "#E2A762", woodDeep: "#7A4A26",
  stump: "#B07A4E", stumpTop: "#E3B57F", stumpRing: "#C99360",
  leaf: "#5DB55A", leafDark: "#3F8F45", leafLight: "#86CF6B",
  trunk: "#9A6A43", trunkDark: "#7A5232",
  cream: "#FFF8EC", wool: "#F6E7CF", ink: "#3A2618", shadow: "rgba(58,38,24,.16)",
  letras: "#FF7A5C", letrasDark: "#E35F45",
  numeros: "#F5B12E", numerosDark: "#D99216",
  cores: "#A57BEA", coresDark: "#8A5ED6",
  linguas: "#2E9FD8", linguasDark: "#2384B5", linguasDeep: "#23609E",
  mundo: "#2EB8A4", mundoDark: "#1F9A88",
  glow: "#FFE29A", lamp: "#FFC94A",
  nino: "#FF9F43",
};

/* ---------- tiny helpers ---------- */
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
const f1 = n => Math.round(n * 10) / 10;
function smooth(pts, closed = true) {
  const n = pts.length, P = i => pts[(i + n) % n];
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = closed ? P(i - 1) : pts[Math.max(0, i - 1)], p1 = P(i), p2 = closed ? P(i + 1) : pts[Math.min(n - 1, i + 1)], p3 = closed ? P(i + 2) : pts[Math.min(n - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return closed ? d + "Z" : d;
}
function blob(cx, cy, rx, ry, n, jit, seed) {
  const r = rng(seed), pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * 2 * jit; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  return smooth(pts);
}
const shadowAt = (x, y, rx, ry = rx * 0.28, o = 0.16) => `<ellipse cx="${f1(x + rx * 0.12)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="rgba(58,38,24,${o})"/>`;

/* A round, flat "lollipop" form lit from the upper left: shade crescent + base + light spot. */
function puff(cx, cy, r, base, dark, light) {
  return `<circle cx="${f1(cx + r * 0.1)}" cy="${f1(cy + r * 0.12)}" r="${f1(r)}" fill="${dark}"/>` +
    `<circle cx="${f1(cx - r * 0.04)}" cy="${f1(cy - r * 0.04)}" r="${f1(r * 0.93)}" fill="${base}"/>` +
    `<circle cx="${f1(cx - r * 0.32)}" cy="${f1(cy - r * 0.34)}" r="${f1(r * 0.42)}" fill="${light}" opacity=".7"/>`;
}
function tree(x, y, s = 1, seed = 1) {
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
function bush(x, y, s = 1) {
  return shadowAt(x + 4, y + 2, 26 * s, 6 * s) + puff(x - 12 * s, y - 12 * s, 15 * s, PAL.leaf, PAL.leafDark, PAL.leafLight) + puff(x + 10 * s, y - 14 * s, 17 * s, PAL.leaf, PAL.leafDark, PAL.leafLight) + puff(x, y - 24 * s, 14 * s, PAL.leaf, PAL.leafDark, PAL.leafLight);
}
function rock(x, y, s = 1, seed = 3) {
  return shadowAt(x + 3, y + 2, 20 * s, 5 * s) + `<path d="${blob(x, y - 9 * s, 20 * s, 12 * s, 7, 0.14, seed)}" fill="${PAL.rockDark}"/><path d="${blob(x - 3 * s, y - 11 * s, 16 * s, 9 * s, 7, 0.12, seed + 1)}" fill="${PAL.rock}"/><ellipse cx="${f1(x - 8 * s)}" cy="${f1(y - 15 * s)}" rx="${f1(6 * s)}" ry="${f1(3 * s)}" fill="${PAL.rockLight}"/>`;
}
function flower(x, y, c, s = 1) {
  return `<path d="M${f1(x)} ${f1(y)} q-1 -6 0 -10" stroke="${PAL.leafDark}" stroke-width="${f1(2 * s)}" fill="none" stroke-linecap="round"/>` +
    `<g fill="${c}">${[0, 72, 144, 216, 288].map(a => `<circle cx="${f1(x + Math.cos(a * Math.PI / 180) * 4 * s)}" cy="${f1(y - 11 * s + Math.sin(a * Math.PI / 180) * 4 * s)}" r="${f1(3.4 * s)}"/>`).join("")}</g><circle cx="${f1(x)}" cy="${f1(y - 11 * s)}" r="${f1(2.4 * s)}" fill="#FFE07A"/>`;
}
function mushrooms(x, y) {
  const m = (mx, my, k) => `<rect x="${mx - 2.5 * k}" y="${my - 9 * k}" width="${5 * k}" height="${9 * k}" rx="${2 * k}" fill="${PAL.cream}"/><path d="M${mx - 9 * k} ${my - 8 * k} a${9 * k} ${7 * k} 0 0 1 ${18 * k} 0z" fill="${PAL.letras}"/><circle cx="${mx - 3 * k}" cy="${my - 11 * k}" r="${1.6 * k}" fill="#fff"/><circle cx="${mx + 3 * k}" cy="${my - 12 * k}" r="${1.3 * k}" fill="#fff"/>`;
  return shadowAt(x + 4, y + 1, 14, 3) + m(x, y, 1.2) + m(x + 12, y + 3, 0.8);
}
function tuft(x, y, s = 1) { return `<path d="M${f1(x - 6 * s)} ${f1(y)} q2 -9 4 -12 q1 7 2 10 q2 -9 5 -13 q0 9 1 12 q2 -6 5 -8 q-1 6 -2 11z" fill="${PAL.grassDark}"/>`; }
function cloud(x, y, s = 1, o = 1) {
  const c = [[-40, 6, 22], [-14, -8, 30], [18, -2, 26], [42, 8, 18]];
  return `<g opacity="${o}"><g fill="${PAL.cloudShade}">${c.map(([dx, dy, r]) => `<circle cx="${f1(x + dx * s)}" cy="${f1(y + dy * s + 7 * s)}" r="${f1(r * s)}"/>`).join("")}<rect x="${f1(x - 58 * s)}" y="${f1(y + 8 * s)}" width="${f1(116 * s)}" height="${f1(22 * s)}" rx="${f1(11 * s)}"/></g>` +
    `<g fill="${PAL.cloud}">${c.map(([dx, dy, r]) => `<circle cx="${f1(x + dx * s)}" cy="${f1(y + dy * s)}" r="${f1(r * s)}"/>`).join("")}<rect x="${f1(x - 58 * s)}" y="${f1(y + 2 * s)}" width="${f1(116 * s)}" height="${f1(20 * s)}" rx="${f1(10 * s)}"/></g></g>`;
}
/* far islet with aerial perspective (mixed toward the sky) */
function islet(x, y, s, seed, tint = 0.55) {
  const mix = (a, b) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * tint).toString(16).padStart(2, "0")).join(""); };
  const sky = PAL.skyMid;
  return `<path d="M${f1(x - 70 * s)} ${f1(y)} C${f1(x - 60 * s)} ${f1(y + 40 * s)} ${f1(x - 20 * s)} ${f1(y + 90 * s)} ${f1(x)} ${f1(y + 110 * s)} C${f1(x + 22 * s)} ${f1(y + 80 * s)} ${f1(x + 64 * s)} ${f1(y + 40 * s)} ${f1(x + 70 * s)} ${f1(y)} Z" fill="${mix(PAL.soilMid, sky)}"/>` +
    `<path d="${blob(x, y - 2 * s, 74 * s, 22 * s, 9, 0.12, seed)}" fill="${mix(PAL.grass, sky)}"/>` +
    `<g opacity=".9">${puff(x - 24 * s, y - 26 * s, 16 * s, mix(PAL.leaf, sky), mix(PAL.leafDark, sky), mix(PAL.leafLight, sky))}${puff(x + 6 * s, y - 32 * s, 20 * s, mix(PAL.leaf, sky), mix(PAL.leafDark, sky), mix(PAL.leafLight, sky))}</g>`;
}

/* ---------- island geometry ---------- */
const ISLAND = { cx: 500, cy: 1120, rx: 430, ry: 360 };
function islandTopPts(seed = 11) {
  const r = rng(seed), pts = [], n = 22;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * 0.07;
    pts.push([ISLAND.cx + Math.cos(a) * ISLAND.rx * k, ISLAND.cy + Math.sin(a) * ISLAND.ry * k]);
  }
  return pts;
}
function islandBase() {
  const top = islandTopPts(), lipY = 26;
  const lip = top.map(([x, y]) => [x, y + lipY]);
  // underside: front half of the lip, then down to the tip
  const front = lip.filter(([x, y]) => y >= ISLAND.cy - 4).sort((a, b) => a[0] - b[0]);
  const under = [...front.reverse(), [938, 1200], [905, 1330], [840, 1470], [760, 1590], [680, 1690], [590, 1790], [520, 1860], [470, 1830], [400, 1740], [300, 1620], [200, 1500], [120, 1370], [70, 1230]];
  const underD = smooth(under);
  let g = `<defs><clipPath id="clipUnder"><path d="${underD}"/></clipPath>
    <linearGradient id="underLight" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#2a1608" stop-opacity=".22"/></linearGradient></defs>`;
  g += `<path d="${underD}" fill="${PAL.soil}"/>`;
  g += `<g clip-path="url(#clipUnder)">` +
    `<path d="M0 1520 C200 1505 320 1545 500 1528 S800 1508 1000 1532 V2100 H0Z" fill="${PAL.soilMid}"/>` +
    `<path d="M0 1640 C220 1625 360 1670 520 1650 S820 1632 1000 1660 V2100 H0Z" fill="${PAL.soilDark}"/>` +
    `<path d="M0 1760 C240 1745 380 1785 520 1768 S800 1752 1000 1775 V2100 H0Z" fill="${PAL.soilDeep}"/>` +
    // embedded pebbles
    [[230, 1500, 9], [610, 1560, 7], [380, 1600, 11], [760, 1560, 8], [470, 1700, 9], [300, 1640, 6], [640, 1720, 10], [540, 1810, 7]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r * 1.4}" ry="${r}" fill="${PAL.rockDark}" opacity=".55"/>`).join("") +
    `<rect x="0" y="1150" width="1000" height="950" fill="url(#underLight)"/></g>`;
  // hanging roots & vines
  const roots = [[170, 1460, 70], [330, 1600, 90], [560, 1740, 60], [720, 1610, 80], [870, 1420, 50], [460, 1800, 55]];
  g += roots.map(([x, y, l], i) => `<path class="vine" style="transform-origin:${x}px ${y}px" d="M${x} ${y} q${i % 2 ? 8 : -8} ${l * 0.5} ${i % 2 ? -4 : 4} ${l}" stroke="${PAL.leafDark}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="${x + (i % 2 ? 4 : -4)}" cy="${y + l * 0.55}" rx="7" ry="4" fill="${PAL.leaf}" transform="rotate(${i % 2 ? 30 : -30} ${x} ${y + l * 0.55})"/><ellipse cx="${x}" cy="${y + l}" rx="6" ry="3.5" fill="${PAL.leafLight}"/>`).join("");
  // grass lip, then top
  g += `<path d="${smooth(lip)}" fill="${PAL.grassEdge}"/>`;
  g += `<path id="islandTop" d="${smooth(top)}" fill="${PAL.grass}"/>`;
  g += `<path d="${blob(420, 1000, 290, 160, 12, 0.15, 21)}" fill="${PAL.grassLight}" opacity=".55"/>`;
  g += `<path d="${blob(620, 1390, 250, 90, 12, 0.18, 23)}" fill="${PAL.grassDark}" opacity=".35"/>`;
  g += `<path d="${blob(500, 900, 150, 55, 10, 0.12, 25)}" fill="${PAL.grassLight}"/>`;
  return g;
}
function floatingRocks() {
  return [[150, 1660, 0.8, 2], [880, 1630, 0.6, 5], [380, 1930, 0.5, 7], [700, 1880, 0.45, 9]].map(([x, y, s, seed]) =>
    `<g class="bob" style="--d:${seed}"><path d="${blob(x, y, 26 * s, 14 * s, 7, 0.2, seed)}" fill="${PAL.soilMid}"/><path d="${blob(x, y - 9 * s, 26 * s, 8 * s, 7, 0.18, seed + 1)}" fill="${PAL.grass}"/></g>`).join("");
}

/* paths between places: centre lines are also Nino's walking routes */
const ROUTES = {
  farol: "M590 934 C640 950 690 990 720 1040 S790 1120 828 1158",
  letras: "M548 928 C500 940 440 962 400 954 S320 940 282 952",
  numeros: "M606 922 C650 905 700 940 738 930",
  jardim: "M548 940 C500 990 420 984 384 1040 S300 1140 262 1188",
  lago: "M566 944 C620 1010 560 1080 588 1150 S556 1236 520 1262",
};
function paths() {
  const all = Object.values(ROUTES);
  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    all.map(d => `<path d="${d}" stroke="${PAL.pathEdge}" stroke-width="40"/>`).join("") +
    all.map(d => `<path d="${d}" stroke="${PAL.path}" stroke-width="31"/>`).join("") +
    `</g>` + Object.entries(ROUTES).map(([k, d]) => `<path id="route-${k}" d="${d}" fill="none" stroke="none"/>`).join("") +
    "";
}

/* ---------- the nest (Nino's home): stump + bowl woven from twigs and the colours of what was learned ---------- */
const NEST = { x: 500, y: 1040 };
function stump() {
  const { x } = NEST;
  return shadowAt(x + 6, 1104, 78, 13, 0.2) +
    `<path d="M${x - 58} 1060 C${x - 60} 1080 ${x - 66} 1096 ${x - 80} 1104 C${x - 40} 1110 ${x + 40} 1110 ${x + 82} 1103 C${x + 66} 1096 ${x + 60} 1080 ${x + 58} 1060 Z" fill="${PAL.stump}"/>` +
    `<path d="M${x + 18} 1062 C${x + 22} 1082 ${x + 30} 1098 ${x + 82} 1103 C${x + 66} 1096 ${x + 60} 1080 ${x + 58} 1060 Z" fill="#93623C"/>` +
    `<path d="M${x - 40} 1072 q4 14 -2 30 M${x - 6} 1074 q3 14 0 30 M${x + 30} 1072 q-2 14 2 30" stroke="#93623C" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>` +
    `<ellipse cx="${x}" cy="1060" rx="58" ry="14" fill="${PAL.stumpTop}"/>` +
    `<ellipse cx="${x}" cy="1060" rx="40" ry="9" fill="none" stroke="${PAL.stumpRing}" stroke-width="2.4"/><ellipse cx="${x}" cy="1060" rx="22" ry="5" fill="none" stroke="${PAL.stumpRing}" stroke-width="2.4"/>` +
    // moss
    `<path d="${blob(x - 44, 1096, 20, 7, 7, 0.2, 31)}" fill="${PAL.leaf}"/><path d="${blob(x + 52, 1094, 14, 5, 7, 0.2, 33)}" fill="${PAL.leafDark}"/>`;
}
function nestBack() {
  const { x, y } = NEST;
  return `<ellipse cx="${x}" cy="${y + 4}" rx="66" ry="21" fill="${PAL.woodDeep}"/>` +
    `<path d="M${x - 64} ${y} C${x - 50} ${y - 22} ${x + 50} ${y - 22} ${x + 64} ${y} C${x + 40} ${y - 10} ${x - 40} ${y - 10} ${x - 64} ${y}Z" fill="${PAL.woodDark}"/>` +
    // wool lining peeking from the back rim
    `<path d="M${x - 52} ${y - 2} C${x - 50} ${y - 16} ${x - 30} ${y - 22} ${x - 12} ${y - 18} C${x} ${y - 25} ${x + 22} ${y - 24} ${x + 32} ${y - 16} C${x + 46} ${y - 18} ${x + 56} ${y - 8} ${x + 54} ${y} Z" fill="${PAL.wool}"/>` +
    `<path d="M${x - 40} ${y - 8} q8 -6 16 -2 M${x - 6} ${y - 12} q8 -6 16 -2 M${x + 24} ${y - 9} q8 -5 15 -1" stroke="#E6D2B2" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
    `<path d="M${x - 70} ${y - 2} q-10 -10 -16 -20 M${x + 66} ${y - 4} q12 -8 18 -22 M${x - 30} ${y - 16} q-4 -12 2 -22" stroke="${PAL.woodDark}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
}
function nestFront(threads = 2) {
  const { x, y } = NEST;
  const thread = (i, c) => `<path class="thread" data-i="${i}" d="M${x - 62} ${y + 10 + i * 7} Q${x} ${y + 30 + i * 8} ${x + 62} ${y + 10 + i * 7}" stroke="${c}" stroke-width="3.2" stroke-dasharray="9 6" fill="none" stroke-linecap="round" ${i >= threads ? 'opacity="0"' : ""}/>`;
  return `<path d="M${x - 68} ${y + 2} C${x - 66} ${y + 30} ${x - 40} ${y + 46} ${x} ${y + 48} C${x + 40} ${y + 46} ${x + 66} ${y + 30} ${x + 68} ${y + 2} C${x + 40} ${y + 18} ${x - 40} ${y + 18} ${x - 68} ${y + 2}Z" fill="${PAL.wood}"/>` +
    `<path d="M${x + 20} ${y + 16} C${x + 50} ${y + 12} ${x + 64} ${y + 6} ${x + 68} ${y + 2} C${x + 66} ${y + 30} ${x + 44} ${y + 44} ${x + 12} ${y + 47}Z" fill="${PAL.woodDark}" opacity=".55"/>` +
    // weave
    `<g stroke="${PAL.woodDark}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"><path d="M${x - 60} ${y + 18} Q${x} ${y + 40} ${x + 60} ${y + 18}"/><path d="M${x - 50} ${y + 32} Q${x} ${y + 50} ${x + 50} ${y + 32}"/></g>` +
    `<g stroke="${PAL.woodLight}" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M${x - 46} ${y + 14} l8 26 M${x - 22} ${y + 18} l4 28 M${x + 4} ${y + 19} l-2 28 M${x + 28} ${y + 17} l-6 27"/></g>` +
    thread(0, PAL.linguas) + thread(1, PAL.letras) + thread(2, PAL.numeros) + thread(3, PAL.cores) +
    `<path d="M${x - 68} ${y + 2} C${x - 40} ${y + 18} ${x + 40} ${y + 18} ${x + 68} ${y + 2}" stroke="${PAL.woodLight}" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    // twig ends poking out
    `<g stroke="${PAL.woodDark}" stroke-width="3.4" stroke-linecap="round"><path d="M${x - 66} ${y + 4} l-16 -6 M${x - 62} ${y + 16} l-14 4 M${x + 66} ${y + 2} l16 -9 M${x + 62} ${y + 18} l15 3 M${x + 12} ${y + 46} l4 9"/></g>` +
    `<circle cx="${x - 84}" cy="${y - 3}" r="3" fill="${PAL.leaf}"/><ellipse cx="${x + 84}" cy="${y - 9}" rx="5" ry="3" fill="${PAL.leaf}" transform="rotate(-30 ${x + 84} ${y - 9})"/>`;
}
function lantern() {
  const x = NEST.x + 72;
  return `<path d="M${x} 1100 C${x + 2} 1040 ${x + 6} 1000 ${x + 10} 978 q10 -10 22 -4" stroke="${PAL.woodDark}" stroke-width="4.5" fill="none" stroke-linecap="round"/>` +
    `<g class="lantern-swing" style="transform-origin:${x + 32}px 974px"><path d="M${x + 32} 974 v10" stroke="${PAL.woodDeep}" stroke-width="2"/>` +
    `<rect x="${x + 24}" y="984" width="16" height="20" rx="6" fill="${PAL.lamp}"/><rect x="${x + 22}" y="982" width="20" height="5" rx="2.5" fill="${PAL.woodDeep}"/><rect x="${x + 22}" y="1002" width="20" height="4" rx="2" fill="${PAL.woodDeep}"/></g>`;
}
function nestGrounds() {
  const { x } = NEST;
  return [[x - 104, 1110, PAL.letras], [x - 92, 1122, PAL.numeros], [x + 96, 1120, PAL.cores], [x + 108, 1108, "#FFFFFF"], [x - 70, 1128, "#FFFFFF"]].map(([fx, fy, c]) => flower(fx, fy, c)).join("") +
    tuft(x - 120, 1100) + tuft(x + 124, 1112) + tuft(x - 30, 1124, 0.8) +
    // basket of yarn: where the memories are kept
    `<g>${shadowAt(x - 92, 1094, 16, 4)}<path d="M${x - 108} 1078 h32 l-4 16 h-24z" fill="${PAL.wood}"/><path d="M${x - 108} 1078 h32" stroke="${PAL.woodDark}" stroke-width="3"/>` +
    `<circle cx="${x - 98}" cy="1074" r="7" fill="${PAL.letras}"/><circle cx="${x - 86}" cy="1072" r="6" fill="${PAL.linguas}"/><circle cx="${x - 92}" cy="1066" r="5" fill="${PAL.numeros}"/></g>`;
}

/* ---------- places ---------- */
function lighthouse() {
  const x = 868, b = 1138, top = 962, wb = 34, wt = 23;
  const xl = y => x - (wb + (wt - wb) * (b - y) / (b - top)), xr = y => x + (wb + (wt - wb) * (b - y) / (b - top));
  const band = (y1, y2, c) => `<path d="M${f1(xl(y1))} ${y1} L${f1(xr(y1))} ${y1} L${f1(xr(y2))} ${y2} L${f1(xl(y2))} ${y2}Z" fill="${c}"/>`;
  let g = `<g id="farol">`;
  g += shadowAt(x + 10, b + 4, 64, 14, 0.18);
  g += `<path d="${blob(x + 6, b - 6, 76, 30, 9, 0.16, 41)}" fill="${PAL.rockDark}"/><path d="${blob(x - 2, b - 12, 68, 24, 9, 0.14, 42)}" fill="${PAL.rock}"/><ellipse cx="${x - 30}" cy="${b - 22}" rx="16" ry="6" fill="${PAL.rockLight}"/>`;
  g += `<path d="M${f1(xl(b))} ${b} L${f1(xr(b))} ${b} L${f1(xr(top))} ${top} L${f1(xl(top))} ${top}Z" fill="${PAL.cream}"/>`;
  g += band(1094, 1072, PAL.linguas) + band(1036, 1014, PAL.linguas);
  g += `<path d="M${x + 10} ${b} L${f1(xr(b))} ${b} L${f1(xr(top))} ${top} L${x + 7} ${top}Z" fill="#1F3A66" opacity=".12"/>`;
  g += `<path d="M${x - 9} ${b} v-22 a9 9 0 0 1 18 0 v22z" fill="${PAL.woodDark}"/><circle cx="${x + 5}" cy="${b - 12}" r="1.6" fill="${PAL.lamp}"/>`;
  g += `<circle cx="${x}" cy="1052" r="7" fill="${PAL.linguasDeep}"/><circle id="farol-win" cx="${x}" cy="1052" r="4.5" fill="${PAL.glow}" opacity=".35"/>`;
  g += `<rect x="${x - 30}" y="${top - 10}" width="60" height="10" rx="4" fill="${PAL.linguasDeep}"/>`;
  g += `<rect x="${x - 21}" y="${top - 42}" width="42" height="34" rx="6" fill="#FFF4D6"/>`;
  g += `<circle id="farol-lamp" cx="${x}" cy="${top - 25}" r="11" fill="${PAL.lamp}"/>`;
  g += `<path d="M${x - 7} ${top - 42} v34 M${x + 7} ${top - 42} v34" stroke="${PAL.linguasDeep}" stroke-width="3"/>`;
  g += `<path d="M${x - 26} ${top - 40} C${x - 22} ${top - 70} ${x + 22} ${top - 70} ${x + 26} ${top - 40}Z" fill="${PAL.linguasDeep}"/><circle cx="${x}" cy="${top - 70}" r="5" fill="${PAL.letras}"/>`;
  // pennants (transformation adds more)
  g += `<path d="M${x - 28} ${top - 6} Q${x - 60} ${top + 10} ${x - 92} ${top + 46}" stroke="${PAL.woodDark}" stroke-width="1.6" fill="none"/>`;
  g += [0, 1, 2, 3, 4].map(i => { const t = (i + 0.5) / 5, px = x - 28 - 64 * t, py = top - 6 + 52 * t * t + 8 * t; const c = [PAL.linguas, PAL.lamp, PAL.letras, PAL.mundo, PAL.cores][i]; return `<path class="pennant" data-i="${i}" d="M${f1(px - 6)} ${f1(py - 1)} l12 2 l-7 11z" fill="${c}" ${i >= 2 ? 'opacity="0"' : ""}/>`; }).join("");
  g += `<path d="M${x - 94} ${top + 48} v70" stroke="${PAL.woodDark}" stroke-width="4" stroke-linecap="round"/>`;
  g += `</g>`;
  return g;
}
function letterTree(state) {
  const x = 255, b = 972;
  let g = `<g id="letras">` + shadowAt(x + 12, b + 4, 74, 16, 0.18);
  g += `<path d="M${x - 26} ${b} C${x - 16} ${b - 40} ${x - 14} ${b - 140} ${x - 12} ${b - 196} h26 C${x + 16} ${b - 140} ${x + 18} ${b - 40} ${x + 30} ${b} C${x + 10} ${b - 6} ${x - 6} ${b - 6} ${x - 26} ${b}Z" fill="${PAL.trunk}"/>`;
  g += `<path d="M${x + 4} ${b - 4} C${x + 6} ${b - 60} ${x + 6} ${b - 140} ${x + 8} ${b - 196} h6 C${x + 16} ${b - 140} ${x + 18} ${b - 40} ${x + 30} ${b}Z" fill="${PAL.trunkDark}"/>`;
  g += `<path d="M${x - 26} ${b} q-16 2 -22 6 M${x + 30} ${b} q14 1 20 6" stroke="${PAL.trunk}" stroke-width="8" stroke-linecap="round"/>`;
  // canopy
  const parts = [[0, -300, 92], [-82, -250, 64], [84, -246, 66], [-46, -350, 62], [52, -352, 60], [0, -390, 52]];
  g += `<g class="sway" style="transform-origin:${x}px ${b - 200}px">`;
  g += `<g fill="${PAL.leafDark}">${parts.map(([dx, dy, r]) => `<circle cx="${x + dx + r * 0.1}" cy="${b + dy + r * 0.12}" r="${r}"/>`).join("")}</g>`;
  g += `<g fill="${PAL.leaf}">${parts.map(([dx, dy, r]) => `<circle cx="${x + dx - r * 0.05}" cy="${b + dy - r * 0.05}" r="${r * 0.92}"/>`).join("")}</g>`;
  g += `<g fill="${PAL.leafLight}" opacity=".6">${parts.map(([dx, dy, r]) => `<circle cx="${x + dx - r * 0.34}" cy="${b + dy - r * 0.36}" r="${r * 0.38}"/>`).join("")}</g>`;
  // hanging letter blocks
  g += [["A", -70, -236, PAL.letras], ["B", 76, -228, PAL.lamp], ["C", -20, -214, PAL.linguas]].map(([L, dx, dy, c], i) =>
    `<g class="dangle" style="--i:${i};transform-origin:${x + dx}px ${b + dy - 26}px"><path d="M${x + dx} ${b + dy - 26} v18" stroke="${PAL.wool}" stroke-width="1.6"/><rect x="${x + dx - 11}" y="${b + dy - 8}" width="22" height="22" rx="5" fill="${c}"/><text x="${x + dx}" y="${b + dy + 9}" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="16" fill="#fff">${L}</text></g>`).join("");
  g += `</g>`;
  // treehouse
  const hy = b - 190;
  g += `<rect x="${x - 60}" y="${hy + 34}" width="120" height="10" rx="4" fill="${PAL.woodDark}"/>`;
  g += `<circle cx="${x}" cy="${hy}" r="44" fill="#F3C892"/><path d="M${x + 12} ${hy - 42} A44 44 0 0 1 ${x + 12} ${hy + 42}Z" fill="#DDA96C"/>`;
  g += `<circle cx="${x - 12}" cy="${hy - 2}" r="11" fill="${PAL.woodDeep}"/><circle id="letras-win" cx="${x - 12}" cy="${hy - 2}" r="8" fill="${PAL.glow}" opacity=".3"/>`;
  g += `<path d="M${x + 6} ${hy + 34} v-24 a10 10 0 0 1 20 0 v24z" fill="${PAL.woodDark}"/>`;
  g += `<path d="M${x - 56} ${hy - 22} L${x} ${hy - 86} L${x + 56} ${hy - 22} Q${x} ${hy - 6} ${x - 56} ${hy - 22}Z" fill="${PAL.letras}"/><path d="M${x} ${hy - 86} L${x + 56} ${hy - 22} Q${x + 30} ${hy - 12} ${x + 10} ${hy - 12}Z" fill="${PAL.letrasDark}"/>`;
  g += `<path d="M${x - 50} ${hy + 44} l-6 150 M${x - 34} ${hy + 44} l-4 150" stroke="${PAL.woodLight}" stroke-width="3"/>` + [0, 1, 2, 3, 4, 5].map(i => `<path d="M${x - 53 - i * 0.2} ${hy + 64 + i * 24} h17" stroke="${PAL.woodLight}" stroke-width="3"/>`).join("");
  if (state === "obra") g += scaffold(x, hy, b);
  g += `</g>`;
  return g;
}
/* "Em construção": twig scaffolding, a little tarp and a tiny working hammer */
function scaffold(x, hy, gy) {
  const L = PAL.woodLight, D = "#B98552";
  return `<g class="obra">` +
    // poles and crossbars beside the house, standing on the deck
    `<g stroke="${D}" stroke-width="5" stroke-linecap="round"><path d="M${x + 50} ${hy + 40} V${hy - 64}"/><path d="M${x + 80} ${hy + 40} V${hy - 40}"/><path d="M${x + 44} ${hy - 20} H${x + 86}"/><path d="M${x + 44} ${hy + 14} H${x + 86}"/><path d="M${x + 50} ${hy + 14} L${x + 80} ${hy - 20}"/></g>` +
    // tarp draped over the right side of the roof
    `<path d="M${x + 4} ${hy - 80} C${x + 24} ${hy - 70} ${x + 48} ${hy - 46} ${x + 60} ${hy - 22} L${x + 56} ${hy - 4} C${x + 40} ${hy - 22} ${x + 20} ${hy - 40} ${x - 2} ${hy - 56}Z" fill="${PAL.cream}"/>` +
    `<path d="M${x + 2} ${hy - 68} C${x + 22} ${hy - 56} ${x + 42} ${hy - 36} ${x + 58} ${hy - 13}" stroke="${PAL.letras}" stroke-width="4" fill="none"/>` +
    // tiny hammer working on the top bar
    `<g class="hammer" style="transform-origin:${x + 86}px ${hy - 40}px"><path d="M${x + 86} ${hy - 40} l16 -16" stroke="${PAL.woodDark}" stroke-width="3.5" stroke-linecap="round"/><rect x="${x + 96}" y="${hy - 66}" width="14" height="9" rx="2" fill="${PAL.rockDark}" transform="rotate(-45 ${x + 103} ${hy - 61})"/></g>` +
    // sign on the ground with the hammer icon
    `<g><rect x="${x - 64}" y="${gy - 34}" width="4" height="34" fill="${PAL.woodDark}"/><rect x="${x - 84}" y="${gy - 58}" width="44" height="28" rx="6" fill="${PAL.cream}"/><rect x="${x - 84}" y="${gy - 58}" width="44" height="28" rx="6" fill="none" stroke="${PAL.letras}" stroke-width="3"/>` +
    `<path d="M${x - 72} ${gy - 36} l14 -14" stroke="${PAL.woodDark}" stroke-width="3" stroke-linecap="round"/><rect x="${x - 62}" y="${gy - 54}" width="10" height="7" rx="1.5" fill="${PAL.rockDark}" transform="rotate(45 ${x - 57} ${gy - 51})"/></g>` +
    `<g stroke="${L}" stroke-width="5" stroke-linecap="round"><path d="M${x + 30} ${gy + 4} l40 -10"/><path d="M${x + 34} ${gy + 10} l40 -8"/></g></g>`;
}
/* "Futuro": a sprout and a little sign with the area's icon — a place that will be born here */
function sprout(x, y, icon, color) {
  return `<g class="sprout"><g transform="translate(${x} ${y}) scale(1.4) translate(${-x} ${-y})">` + shadowAt(x, y + 2, 30, 7) + `<path d="${blob(x, y - 4, 34, 10, 8, 0.15, x)}" fill="${PAL.soilMid}"/>` +
    `<path d="M${x - 2} ${y - 6} q-2 -16 2 -26" stroke="${PAL.leafDark}" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="${x - 10}" cy="${y - 30}" rx="10" ry="5" fill="${PAL.leaf}" transform="rotate(-25 ${x - 10} ${y - 30})"/><ellipse cx="${x + 9}" cy="${y - 34}" rx="10" ry="5" fill="${PAL.leafLight}" transform="rotate(25 ${x + 9} ${y - 34})"/>` +
    `<rect x="${x + 26}" y="${y - 30}" width="4" height="30" fill="${PAL.woodDark}"/><rect x="${x + 10}" y="${y - 52}" width="36" height="26" rx="6" fill="${PAL.cream}"/><rect x="${x + 10}" y="${y - 52}" width="36" height="26" rx="6" fill="none" stroke="${color}" stroke-width="3"/>` +
    `<text x="${x + 28}" y="${y - 34}" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="13" fill="${color}">${icon}</text>` +
    `<g stroke="${PAL.woodLight}" stroke-width="3" stroke-linecap="round"><path d="M${x - 40} ${y + 4} v-14 M${x - 26} ${y + 8} v-14 M${x - 44} ${y - 2} l20 4"/></g></g></g>`;
}
function numberTower(state) {
  const x = 738, b = 968;
  if (state !== "pronto") return `<g id="numeros">${sprout(x - 10, b, "123", PAL.numerosDark)}</g>`;
  const blocks = [[1, PAL.lamp, 0], [2, PAL.leaf, -4], [3, PAL.linguas, 3], [4, PAL.letras, -2]];
  let g = `<g id="numeros">` + shadowAt(x + 8, b + 4, 50, 12, 0.18);
  blocks.forEach(([n, c, rot], i) => { const y = b - 56 * (i + 1); g += `<g transform="rotate(${rot} ${x} ${y + 28})"><rect x="${x - 28}" y="${y}" width="56" height="56" rx="9" fill="${c}"/><rect x="${x + 10}" y="${y}" width="18" height="56" rx="6" fill="#000" opacity=".1"/><text x="${x - 3}" y="${y + 40}" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="34" fill="#fff">${n}</text></g>`; });
  g += `<path d="M${x} ${b - 224} v-36" stroke="${PAL.woodDark}" stroke-width="3"/><path d="M${x} ${b - 260} l22 7 l-22 7z" fill="${PAL.letras}"/></g>`;
  return g;
}
function garden(state) {
  const x = 262, y = 1222;
  if (state !== "pronto") return `<g id="cores">${sprout(x, y, "●▲■", PAL.coresDark)}</g>`;
  let g = `<g id="cores">` + `<path d="${blob(x, y, 70, 22, 9, 0.12, 51)}" fill="${PAL.soilMid}"/>`;
  [[-46, -6, PAL.letras], [-24, 2, PAL.lamp], [0, -4, PAL.cores], [24, 2, PAL.linguas], [46, -6, PAL.letras], [-34, 10, PAL.cores], [34, 10, PAL.lamp]].forEach(([dx, dy, c]) => g += flower(x + dx, y + dy, c, 1.6));
  g += `</g>`;
  return g;
}
function pond(state) {
  const x = 660, y = 1250;
  let g = `<g id="lago"><path d="${blob(x, y + 4, 126, 58, 11, 0.1, 61)}" fill="${PAL.grassDark}" opacity=".5"/>`;
  g += `<path d="${blob(x, y, 118, 52, 11, 0.1, 61)}" fill="${PAL.waterDeep}"/><path d="${blob(x - 6, y - 4, 108, 44, 11, 0.1, 62)}" fill="${PAL.water}"/>`;
  g += `<g class="ripple" stroke="${PAL.waterLight}" stroke-width="3" fill="none" stroke-linecap="round"><path d="M${x - 70} ${y - 12} h26"/><path d="M${x + 20} ${y + 16} h34"/><path d="M${x - 20} ${y - 26} h18"/></g>`;
  g += `<ellipse cx="${x - 76}" cy="${y + 14}" rx="12" ry="5" fill="${PAL.leaf}"/><ellipse cx="${x + 70}" cy="${y - 18}" rx="10" ry="4" fill="${PAL.leaf}"/>`;
  // dock
  g += `<path d="M${x - 98} ${y - 46} l46 22 l-8 10 l-46 -22z" fill="${PAL.wood}"/><path d="M${x - 92} ${y - 30} v14 M${x - 60} ${y - 16} v14" stroke="${PAL.woodDark}" stroke-width="4"/>`;
  // boat (arrives with the lighthouse transformation)
  g += `<g id="barco" class="boat" transform="translate(${x + 30} ${y - 6})"><path d="M-22 0 h44 q-6 12 -22 12 q-16 0 -22 -12z" fill="${PAL.letras}"/><path d="M0 -2 v-34" stroke="${PAL.woodDark}" stroke-width="2.4"/><path d="M2 -34 q18 14 14 30 h-14z" fill="${PAL.cream}"/><path d="M-2 -30 q-14 12 -12 26 h12z" fill="${PAL.linguas}"/></g>`;
  if (state !== "pronto") g += sprout(x + 40, y + 74, "?", PAL.mundoDark);
  g += `</g>`;
  return g;
}

function butterfly(i) {
  const c = [PAL.cores, PAL.lamp][i % 2];
  return `<g class="bfly" data-i="${i}"><g class="wing"><ellipse cx="-5" cy="-3" rx="6" ry="8" fill="${c}"/><ellipse cx="-4" cy="5" rx="4" ry="5" fill="${c}"/></g><g class="wing2"><ellipse cx="5" cy="-3" rx="6" ry="8" fill="${c}"/><ellipse cx="4" cy="5" rx="4" ry="5" fill="${c}"/></g><rect x="-1.3" y="-6" width="2.6" height="13" rx="1.3" fill="${PAL.ink}"/></g>`;
}
/* ---------- emissive night lights (drawn above the night grade) ---------- */
function nightLights() {
  const g = (x, y, r, c = PAL.glow, cls = "") => `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}" fill="url(#glowGrad)" style="--c:${c}"/>`;
  return `<defs><radialGradient id="glowGrad"><stop offset="0" stop-color="#FFE7A8" stop-opacity=".95"/><stop offset=".35" stop-color="#FFD27A" stop-opacity=".45"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></radialGradient>
    <radialGradient id="poolGrad"><stop offset="0" stop-color="#FFB866" stop-opacity=".55"/><stop offset=".6" stop-color="#FFB866" stop-opacity=".2"/><stop offset="1" stop-color="#FFB866" stop-opacity="0"/></radialGradient>
    <linearGradient id="beamGrad" x1="0" x2="1"><stop offset="0" stop-color="#FFE7A8" stop-opacity=".55"/><stop offset="1" stop-color="#FFE7A8" stop-opacity="0"/></linearGradient></defs>` +
    `<g id="lights"><circle id="poolNest" cx="520" cy="842" r="130" fill="url(#poolGrad)" style="mix-blend-mode:screen"/><circle id="poolNino" cx="0" cy="0" r="70" fill="url(#poolGrad)" style="mix-blend-mode:screen"/>${g(604, 804, 34, "", "l-lantern")}${g(228, 748, 30, "", "l-letras")}${g(862, 949, 46, "", "l-farol")}${g(862, 1064, 14)}
     <path id="beam" d="M862 949 L1240 890 L1240 1010 Z" fill="url(#beamGrad)" opacity="0"/>
     <g id="fireflies" fill="#FFE7A8">${[[330, 1000], [420, 1110], [720, 1000], [560, 1200], [180, 1150], [800, 1250], [460, 930]].map(([x, y], i) => `<circle class="ff" data-i="${i}" cx="${x}" cy="${y}" r="3"/>`).join("")}</g></g>`;
}

/* ---------- layers ---------- */
function buildLayers(states) {
  const st = Object.assign({ letras: "obra", numeros: "futuro", cores: "futuro", lago: "futuro", threads: 1 }, states || {});
  const far = `<g id="sun"><circle cx="330" cy="520" r="90" fill="#FFF6D8" opacity=".55"/><circle cx="330" cy="520" r="44" fill="#FFF3C4"/></g>` +
    `<g id="moon" opacity="0"><circle cx="700" cy="520" r="40" fill="#FFF3D1"/><circle cx="718" cy="508" r="36" fill="#16205A" class="moon-cut"/></g>` +
    `<g id="stars" opacity="0">${(() => { const r = rng(77); let s = ""; for (let i = 0; i < 90; i++) { const x = r() * 1000, y = r() * 2200, rr = r() < 0.85 ? 1.4 + r() : 2.6 + r() * 1.4; s += `<circle class="st" data-i="${i % 7}" cx="${f1(x)}" cy="${f1(y)}" r="${f1(rr)}" fill="#FFF6E0"/>`; } return s; })()}</g>` +
    islet(130, 640, 0.9, 3) + islet(880, 520, 0.7, 5) + islet(860, 1960, 1.0, 8) + islet(120, 2010, 0.6, 9) +
    `<g class="drift" style="--sp:1">${cloud(330, 330, 1.1, 0.9)}${cloud(760, 760, 0.8, 0.85)}${cloud(150, 1880, 1.2, 0.8)}</g>`;
  const mid = `<g class="drift" style="--sp:1.6">${cloud(840, 640, 1.0)}${cloud(120, 840, 0.9)}${cloud(560, 2040, 1.3)}</g>`;
  const island =
    `<g id="islandBase">${floatingRocks()}${islandBase()}</g>` +
    `<g id="decorBack">${tree(372, 800, 0.95, 4)}${tree(642, 796, 1.0, 5)}${tree(118, 1070, 1.0, 6)}${tree(910, 1010, 0.85, 7)}${bush(160, 960, 1)}${bush(830, 1020, 0.9)}${rock(700, 866)}${tuft(330, 880)}${tuft(690, 884)}${tree(340, 1350, 0.8, 8)}${tree(470, 1170, 0.7, 9)}${bush(690, 1250, 0.8)}${rock(650, 1080, 0.8, 11)}${mushrooms(612, 968)}${mushrooms(330, 1060)}<path d="${blob(452, 1096, 44, 14, 8, 0.2, 71)}" fill="${PAL.grassLight}"/>${flower(440, 1094, PAL.letras)}${flower(458, 1102, "#fff")}${flower(470, 1090, PAL.cores)}${flower(690, 1180, PAL.lamp)}${flower(706, 1188, "#fff")}</g>` +
    `<g id="pathsG">${paths()}</g>` +
    `<g id="places"><g transform="translate(-15 -32)">${letterTree(st.letras)}</g><g transform="translate(32 -38)">${numberTower(st.numeros)}</g><g transform="translate(-60 80)">${pond(st.lago)}</g><g transform="translate(-22 -32)">${garden(st.cores)}</g><g transform="translate(-6 12)">${lighthouse()}</g></g>` +
    `<g id="nestG" transform="translate(0 -190)">${stump()}${nestGrounds()}${nestBack()}<g id="slotNest"></g>${nestFront(st.threads)}${lantern()}</g><g id="butterflies">${butterfly(0)}${butterfly(1)}</g>` +
    `<g id="decorFront">${bush(120, 1330, 1.1)}${bush(440, 1450, 0.9)}${bush(860, 1340, 0.8)}${bush(210, 1410, 0.8)}${rock(300, 1420, 1.1, 8)}${rock(780, 1420, 0.9, 9)}${flower(140, 1232, PAL.letras)}${flower(160, 1248, PAL.lamp)}${flower(450, 1300, PAL.cores)}${flower(720, 1200, "#fff")}${flower(740, 1212, PAL.letras)}${flower(680, 1440, PAL.lamp)}${tuft(470, 1380)}${tuft(300, 1330)}${tuft(700, 1460)}</g>` +
    `<g id="slotActors"></g>` +
    `<rect id="nightGrade" x="-2000" y="-2000" width="5000" height="6000" fill="#3A4A8C" opacity="0" style="mix-blend-mode:multiply"/>` +
    nightLights();
  const near = cloud(60, 1760, 1.5) + cloud(940, 1820, 1.6) + cloud(500, 2060, 1.2, 0.9);
  return { far, mid, island, near };
}

if (typeof module !== "undefined") module.exports = { PAL, buildLayers, ROUTES, NEST, ISLAND };
