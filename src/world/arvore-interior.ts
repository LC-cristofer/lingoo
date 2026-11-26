/* Inside the Árvore das Letras: a hollow trunk of light wood. The four branches are the four units, each
   a stretch of the climb with six leafy platforms (one per stop); a letter nest crowns the top and lights up when the four are done.
   Every colour is the bible's (PAL). Own gradient ids (`ai-`) never clash with the island's or the farol's. */
import { PAL } from "./palette";
import { puff, rng } from "./shapes";

const KINDS = ["music", "talk", "talk", "talk", "book", "star"] as const;
type Icon = (typeof KINDS)[number];

/** Horizontal stops of one branch: the climb zigzags across the trunk. */
const ZIG = [330, 668, 332, 668, 332, 640] as const;
const FIRST_Y = 5640;
const STEP = 220;
/** Extra height between one branch and the next, where the branch emblem sits. */
const GAP = 40;
export const ARVORE_HEIGHT = 6200;
const FLOOR_Y = 5880;

/** Where Nino stands on each platform (interior space): 24 platforms, 6 per branch, spiralling up. */
export const ARVORE_LANDINGS: { unit: 1 | 2 | 3 | 4; stop: number; x: number; y: number }[] = Array.from({ length: 24 }, (_, i) => ({
  unit: (Math.floor(i / 6) + 1) as 1 | 2 | 3 | 4,
  stop: i % 6,
  x: ZIG[i % 6],
  y: FIRST_Y - STEP * i - GAP * Math.floor(i / 6),
}));

/** The door we came in through (interior space). */
export const ARVORE_DOOR = { x: 500, y: 5890 } as const;

const FONT = "Fredoka, sans-serif";

function leafPair(x: number, y: number, s: number, flip = 1): string {
  const P = PAL;
  return `<ellipse cx="${x - 12 * s * flip}" cy="${y - 4 * s}" rx="${13 * s}" ry="${6.5 * s}" transform="rotate(${-28 * flip} ${x - 12 * s * flip} ${y - 4 * s})" fill="${P.leafLight}"/>` +
    `<ellipse cx="${x + 12 * s * flip}" cy="${y - 4 * s}" rx="${13 * s}" ry="${6.5 * s}" transform="rotate(${28 * flip} ${x + 12 * s * flip} ${y - 4 * s})" fill="${P.leaf}"/>`;
}

/** A little sprout on a mound: what a branch that is not open yet shows. */
function sprout(x: number, y: number, s: number): string {
  const P = PAL;
  return `<ellipse cx="${x}" cy="${y + 4 * s}" rx="${30 * s}" ry="${9 * s}" fill="${P.soilMid}"/><ellipse cx="${x - 2 * s}" cy="${y + 1 * s}" rx="${27 * s}" ry="${8 * s}" fill="${P.soil}"/>` +
    `<path d="M${x} ${y} q${-3 * s} ${-18 * s} ${1 * s} ${-34 * s}" stroke="${P.leafDark}" stroke-width="${6 * s}" fill="none" stroke-linecap="round"/>` +
    leafPair(x, y - 32 * s, s) + `<circle cx="${x}" cy="${y - 38 * s}" r="${6 * s}" fill="${P.leafLight}"/>`;
}

export function buildArvoreInterior(): string {
  const P = PAL;
  const L = ARVORE_LANDINGS;
  let g = `<defs><linearGradient id="ai-cyl" x1="0" x2="1"><stop offset="0" stop-color="${P.trunkDark}" stop-opacity=".4"/><stop offset=".22" stop-color="${P.trunkDark}" stop-opacity="0"/><stop offset=".78" stop-color="${P.trunkDark}" stop-opacity="0"/><stop offset="1" stop-color="${P.trunkDark}" stop-opacity=".46"/></linearGradient>
    <radialGradient id="ai-glow"><stop offset="0" stop-color="${P.glow}" stop-opacity=".95"/><stop offset=".4" stop-color="${P.lamp}" stop-opacity=".4"/><stop offset="1" stop-color="${P.lamp}" stop-opacity="0"/></radialGradient>
    <radialGradient id="ai-door-light" cx=".5" cy="1" r=".8"><stop offset="0" stop-color="${P.glow}" stop-opacity=".8"/><stop offset="1" stop-color="${P.glow}" stop-opacity="0"/></radialGradient>
    <clipPath id="ai-clip-top"><circle cx="500" cy="150" r="190"/></clipPath>${[0, 1, 2, 3].map((k) => `<clipPath id="ai-clip-w${k}"><circle cx="${k % 2 ? 850 : 150}" cy="${ARVORE_LANDINGS[6 * k + 3].y}" r="62"/></clipPath>`).join("")}</defs>`;

  // the inside of the trunk: light wood with long grain and a few knots
  g += `<rect x="-400" y="0" width="1800" height="${ARVORE_HEIGHT}" fill="${P.path}"/>`;
  const r = rng(53);
  let grain = "";
  for (let i = 0; i < 24; i++) {
    const x0 = -380 + i * 80 + r() * 36;
    let d = `M${x0.toFixed(1)} 0`;
    for (let y = 400; y <= ARVORE_HEIGHT + 400; y += 400) d += ` Q${(x0 + (r() - 0.5) * 70).toFixed(1)} ${y - 200} ${(x0 + (r() - 0.5) * 36).toFixed(1)} ${y}`;
    grain += `<path d="${d}" stroke="${P.pathEdge}" stroke-width="${(6 + r() * 6).toFixed(1)}" fill="none" stroke-linecap="round" opacity="${(0.55 + r() * 0.35).toFixed(2)}"/>`;
  }
  g += `<g>${grain}</g>`;
  let knots = "";
  for (let i = 0; i < 9; i++) {
    const x = 60 + r() * 880, y = 500 + i * 640 + r() * 200, rx = 22 + r() * 16;
    knots += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${(rx * 1.5).toFixed(1)}" fill="${P.pathEdge}"/><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(rx * 0.62).toFixed(1)}" ry="${(rx * 0.95).toFixed(1)}" fill="${P.stumpTop}"/>`;
  }
  g += `<g opacity=".8">${knots}</g>`;

  // the opening at the top of the trunk: sky and leaves above the nest
  g += `<g><circle cx="500" cy="150" r="210" fill="${P.trunkDark}"/><circle cx="500" cy="150" r="190" fill="${P.skyMid}"/>` +
    `<circle cx="500" cy="190" r="190" fill="${P.skyLow}" clip-path="url(#ai-clip-top)" opacity=".7"/>` +
    `<g clip-path="url(#ai-clip-top)">${puff(330, 70, 70, P.leaf, P.leafDark, P.leafLight)}${puff(650, 60, 78, P.leaf, P.leafDark, P.leafLight)}${puff(520, 0, 64, P.leafLight, P.leaf, P.cloud)}${puff(380, 250, 40, P.leaf, P.leafDark, P.leafLight)}${puff(640, 250, 44, P.leaf, P.leafDark, P.leafLight)}</g></g>`;

  // round windows with leaves, one along each branch
  const win = (x: number, y: number, rad: number, i: number) => `<g><circle cx="${x}" cy="${y}" r="${rad + 16}" fill="${P.woodDeep}"/><circle cx="${x}" cy="${y}" r="${rad}" fill="${P.skyMid}"/>` +
    `<g clip-path="url(#ai-clip-w${i})"><circle cx="${x}" cy="${y + rad * 0.6}" r="${rad}" fill="${P.skyLow}" opacity=".8"/><g class="sway" style="--i:${i};transform-origin:${x}px ${y + rad}px">${puff(x - rad * 0.4, y - rad * 0.1, rad * 0.5, P.leaf, P.leafDark, P.leafLight)}${puff(x + rad * 0.45, y + rad * 0.25, rad * 0.55, P.leafLight, P.leaf, P.cloud)}${puff(x + rad * 0.1, y - rad * 0.65, rad * 0.4, P.leaf, P.leafDark, P.leafLight)}</g></g>` +
    `<path d="M${x - rad} ${y} h${2 * rad}" stroke="${P.woodDark}" stroke-width="6"/><path d="M${x} ${y - rad} v${2 * rad}" stroke="${P.woodDark}" stroke-width="6"/></g>`;
  for (let k = 0; k < 4; k++) g += win(k % 2 ? 850 : 150, L[6 * k + 3].y, 62, k);

  // lanterns on little vines
  g += [0, 1, 2, 3].map((k) => {
    const y = L[6 * k + 1].y + 150, x = k % 2 ? 470 : 530;
    return `<g class="lantern-swing" style="transform-origin:${x}px ${y - 60}px"><path d="M${x} ${y - 60} v40" stroke="${P.leafDark}" stroke-width="4"/><rect x="${x - 12}" y="${y - 22}" width="24" height="30" rx="8" fill="${P.lamp}"/><rect x="${x - 15}" y="${y - 26}" width="30" height="6" rx="3" fill="${P.woodDeep}"/></g>`;
  }).join("");

  // the branch emblems: a wreath with the branch number; a bud while the branch is closed
  g += [1, 2, 3, 4].map((n) => {
    const first = L[6 * (n - 1)], x = first.x < 500 ? 850 : 150, y = first.y - 30;
    const crown = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return puff(x + Math.cos(a) * 84, y + Math.sin(a) * 84, 17, i % 2 ? P.leaf : P.leafLight, P.leafDark, P.leafLight); }).join("");
    return `<g class="branch" data-branch="${n}"><circle class="branch-glow" cx="${x}" cy="${y}" r="150" fill="url(#ai-glow)" opacity="0"/>` +
      `<circle cx="${x}" cy="${y + 8}" r="84" fill="${P.trunkDark}" opacity=".5"/>${crown}<circle cx="${x}" cy="${y}" r="66" fill="${P.woodDeep}"/><circle cx="${x}" cy="${y}" r="58" fill="${P.cream}"/>` +
      `<text class="branch-open" x="${x}" y="${y + 20}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="62" fill="${P.letras}">${n}</text>` +
      `<g class="branch-bud" opacity="0">${sprout(x, y + 26, 1.1)}</g></g>`;
  }).join("");

  // floor, rug, the door we came in through
  g += `<rect x="-400" y="${FLOOR_Y}" width="1800" height="${ARVORE_HEIGHT - FLOOR_Y}" fill="${P.soilMid}"/><g stroke="${P.soilDark}" stroke-width="3">${Array.from({ length: 14 }, (_, i) => `<path d="M${-300 + i * 120} ${FLOOR_Y} v${ARVORE_HEIGHT - FLOOR_Y}"/>`).join("")}</g>`;
  g += `<ellipse cx="500" cy="5970" rx="250" ry="56" fill="${P.leaf}"/><ellipse cx="500" cy="5970" rx="200" ry="40" fill="none" stroke="${P.cream}" stroke-width="6" stroke-dasharray="14 10"/>`;
  const dy = ARVORE_DOOR.y;
  g += `<rect x="400" y="${dy - 250}" width="200" height="250" fill="url(#ai-door-light)"/><path d="M430 ${dy} V${dy - 140} a70 70 0 0 1 140 0 V${dy}Z" fill="${P.woodDark}"/><path d="M500 ${dy - 200} V${dy}" stroke="${P.woodDeep}" stroke-width="5"/><circle cx="530" cy="${dy - 70}" r="6" fill="${P.lamp}"/>`;

  // the climb: planks between platforms, with a vine for a rail
  const pts: [number, number][] = [[500, FLOOR_Y], ...L.map((s): [number, number] => [s.x, s.y]), [500, 400]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], n = 7;
    for (let k = 1; k < n; k++) { const t = k / n, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t; g += `<rect x="${(x - 46).toFixed(1)}" y="${(y + 18).toFixed(1)}" width="92" height="14" rx="5" fill="${P.woodDeep}"/><rect x="${(x - 46).toFixed(1)}" y="${(y + 4).toFixed(1)}" width="92" height="18" rx="6" fill="${P.woodLight}"/>`; }
    g += `<path d="M${x1 + 40} ${y1 - 60} L${x2 + 40} ${y2 - 60}" stroke="${P.leafDark}" stroke-width="7" stroke-linecap="round"/>`;
    for (const t of [0.3, 0.7]) g += leafPair(x1 + 40 + (x2 - x1) * t, y1 - 60 + (y2 - y1) * t, 0.9, i % 2 ? 1 : -1);
  }

  // the letter nest at the top
  const NX = 500, NY = 330;
  const block = (dx: number, rot: number, ch: string) => `<g transform="translate(${NX + dx} ${NY - 52}) rotate(${rot})"><rect x="-30" y="-30" width="60" height="60" rx="14" fill="${P.cream}"/><text x="0" y="16" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="44" fill="${P.letras}">${ch}</text></g>`;
  g += `<g id="arvoreNest"><circle id="bigLampGlow" cx="${NX}" cy="${NY - 40}" r="230" fill="url(#ai-glow)" opacity=".25"/><circle id="bigLamp" cx="${NX}" cy="${NY - 40}" r="92" fill="${P.glow}" opacity=".45"/>` +
    block(-62, -10, "A") + block(0, 4, "B") + block(62, 11, "C") +
    `<path d="M${NX - 150} ${NY - 20} q0 80 150 80 q150 0 150 -80 q-60 22 -150 22 q-90 0 -150 -22z" fill="${P.woodDeep}"/><path d="M${NX - 150} ${NY - 24} q150 40 300 0 q-20 -14 -40 -10 q-110 30 -220 0 q-20 -4 -40 10z" fill="${P.wool}"/>` +
    `<path d="M${NX - 168} ${NY - 6} l40 18 M${NX + 168} ${NY - 6} l-40 18 M${NX - 120} ${NY + 40} l24 24 M${NX + 120} ${NY + 40} l-24 24" stroke="${P.wood}" stroke-width="9" stroke-linecap="round"/></g>`;

  // platforms (stops)
  const icon = (k: Icon, x: number, y: number, c: string) => ({
    music: `<path d="M${x - 8} ${y + 12} V${y - 14} l20 -5 V${y + 8}" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x - 13}" cy="${y + 13}" r="7" fill="${c}"/><circle cx="${x + 7}" cy="${y + 9}" r="7" fill="${c}"/>`,
    talk: `<rect x="${x - 20}" y="${y - 16}" width="40" height="28" rx="10" fill="${c}"/><path d="M${x - 8} ${y + 10} l-6 10 l14 -8z" fill="${c}"/><circle cx="${x - 9}" cy="${y - 2}" r="3" fill="${P.cloud}"/><circle cx="${x}" cy="${y - 2}" r="3" fill="${P.cloud}"/><circle cx="${x + 9}" cy="${y - 2}" r="3" fill="${P.cloud}"/>`,
    book: `<path d="M${x} ${y - 12} q-12 -8 -24 -4 v28 q12 -4 24 4 q12 -8 24 -4 v-28 q-12 -4 -24 4z" fill="${c}"/><path d="M${x} ${y - 12} v28" stroke="${P.cloud}" stroke-width="2.5"/>`,
    star: `<path d="M${x} ${y - 22} l6.5 13.5 14.8 1.8-10.9 10.2 2.8 14.6L${x} ${y + 11} l-13.2 7.1 2.8-14.6-10.9-10.2 14.8-1.8z" fill="${c}"/>`,
  })[k];
  g += L.map((s, i) => `<g class="stop" data-i="${i}" data-unit="${s.unit}"><ellipse cx="${s.x}" cy="${s.y + 40}" rx="96" ry="26" fill="${P.leafDark}"/><ellipse cx="${s.x}" cy="${s.y + 30}" rx="96" ry="26" fill="${P.leaf}"/>` +
    `${puff(s.x - 88, s.y + 26, 20, P.leaf, P.leafDark, P.leafLight)}${puff(s.x + 88, s.y + 28, 18, P.leafLight, P.leaf, P.cloud)}` +
    `<circle class="stop-halo" cx="${s.x}" cy="${s.y - 18}" r="100" fill="url(#ai-glow)" opacity="0"/>` +
    `<circle cx="${s.x}" cy="${s.y - 10}" r="62" fill="${P.stumpRing}"/><circle class="stop-face" cx="${s.x}" cy="${s.y - 18}" r="62" fill="${P.cream}"/>` +
    `<g class="stop-icon" transform="translate(${s.x} ${s.y - 18}) scale(1.3) translate(${-s.x} ${-(s.y - 18)})">${icon(KINDS[s.stop], s.x, s.y - 18, P.letras)}</g>` +
    `<g class="stop-bud" opacity="0">${sprout(s.x, s.y - 4, 1.2)}</g>` +
    `<g class="stop-done" opacity="0" transform="translate(10 -12)"><circle cx="${s.x + 36}" cy="${s.y - 52}" r="17" fill="${P.lamp}"/><path d="M${s.x + 36} ${s.y - 64} l3.4 7 7.6 .9-5.6 5.3 1.4 7.5-6.8-3.7-6.8 3.7 1.4-7.5-5.6-5.3 7.6-.9z" fill="${P.cloud}"/></g></g>`).join("");
  g += `<g id="slotInterior"></g>`;
  g += `<rect x="-400" y="0" width="1800" height="${ARVORE_HEIGHT}" fill="url(#ai-cyl)" pointer-events="none"/>`;
  return g;
}
