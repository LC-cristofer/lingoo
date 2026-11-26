/* The Ilha-Ninho, drawn as strings. Pure and deterministic: the stage engine mounts these. */
import { PAL } from "./palette";
import {
  blob, bush, butterfly, cloud, f1, flower, islet, mushrooms, rng, rock, shadowAt, smooth, tree, tuft,
} from "./shapes";

type Pt = [number, number];

export type PlaceId = "ninho" | "farol" | "letras" | "numeros" | "cores" | "lago";
export type PlaceState = "pronto" | "obra" | "futuro";
export type IslandStates = { letras: PlaceState; numeros: PlaceState; cores: PlaceState; lago: PlaceState };
/** The nest's threads: a count (the first n are woven) or one flag per thread (0 Línguas, 1 Letras, 2 Números, 3 Cores). */
export type Threads = number | readonly boolean[];
/** Whether thread `i` is woven. */
export const threadWoven = (t: Threads, i: number): boolean => (typeof t === "number" ? i < t : !!t[i]);

/* ---------- island geometry ---------- */
const ISLAND = { cx: 500, cy: 1120, rx: 430, ry: 360 };
function islandTopPts(seed = 11): Pt[] {
  const r = rng(seed), pts: Pt[] = [], n = 22;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * 0.07;
    pts.push([ISLAND.cx + Math.cos(a) * ISLAND.rx * k, ISLAND.cy + Math.sin(a) * ISLAND.ry * k]);
  }
  return pts;
}
function islandBase(): string {
  const top = islandTopPts(), lipY = 26;
  const lip = top.map(([x, y]): Pt => [x, y + lipY]);
  // underside: front half of the lip, then down to the tip
  const front: Pt[] = lip.filter(([, y]) => y >= ISLAND.cy - 4).sort((a, b) => a[0] - b[0]);
  const under: Pt[] = [...front.reverse(), [938, 1200], [905, 1330], [840, 1470], [760, 1590], [680, 1690], [590, 1790], [520, 1860], [470, 1830], [400, 1740], [300, 1620], [200, 1500], [120, 1370], [70, 1230]];
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
function floatingRocks(): string {
  return [[150, 1660, 0.8, 2], [880, 1630, 0.6, 5], [380, 1930, 0.5, 7], [700, 1880, 0.45, 9]].map(([x, y, s, seed]) =>
    `<g class="bob" style="--d:${seed}"><path d="${blob(x, y, 26 * s, 14 * s, 7, 0.2, seed)}" fill="${PAL.soilMid}"/><path d="${blob(x, y - 9 * s, 26 * s, 8 * s, 7, 0.18, seed + 1)}" fill="${PAL.grass}"/></g>`).join("");
}

/* paths between places: centre lines are also Nino's walking routes */
export const ROUTES = {
  farol: "M590 934 C640 950 690 990 720 1040 S790 1120 828 1158",
  letras: "M548 928 C500 940 440 962 400 954 S320 940 282 952",
  numeros: "M606 922 C650 905 700 940 738 930",
  jardim: "M548 940 C500 990 420 984 384 1040 S300 1140 262 1188",
  lago: "M566 944 C620 1010 560 1080 588 1150 S556 1236 520 1262",
} as const;
function paths(): string {
  const all = Object.values(ROUTES);
  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    all.map(d => `<path d="${d}" stroke="${PAL.pathEdge}" stroke-width="40"/>`).join("") +
    all.map(d => `<path d="${d}" stroke="${PAL.path}" stroke-width="31"/>`).join("") +
    `</g>` + Object.entries(ROUTES).map(([k, d]) => `<path id="route-${k}" d="${d}" fill="none" stroke="none"/>`).join("") +
    "";
}

/* ---------- the nest (Nino's home): stump + bowl woven from twigs and the colours of what was learned ---------- */
/** The nest group is drawn at y=1040 then lifted by `dy` (translate(0 -190)). */
export const NEST = { x: 500, y: 1040, dy: -190 } as const;
function stump(): string {
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
function nestBack(): string {
  const { x, y } = NEST;
  return `<ellipse cx="${x}" cy="${y + 4}" rx="66" ry="21" fill="${PAL.woodDeep}"/>` +
    `<path d="M${x - 64} ${y} C${x - 50} ${y - 22} ${x + 50} ${y - 22} ${x + 64} ${y} C${x + 40} ${y - 10} ${x - 40} ${y - 10} ${x - 64} ${y}Z" fill="${PAL.woodDark}"/>` +
    // wool lining peeking from the back rim
    `<path d="M${x - 52} ${y - 2} C${x - 50} ${y - 16} ${x - 30} ${y - 22} ${x - 12} ${y - 18} C${x} ${y - 25} ${x + 22} ${y - 24} ${x + 32} ${y - 16} C${x + 46} ${y - 18} ${x + 56} ${y - 8} ${x + 54} ${y} Z" fill="${PAL.wool}"/>` +
    `<path d="M${x - 40} ${y - 8} q8 -6 16 -2 M${x - 6} ${y - 12} q8 -6 16 -2 M${x + 24} ${y - 9} q8 -5 15 -1" stroke="#E6D2B2" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
    `<path d="M${x - 70} ${y - 2} q-10 -10 -16 -20 M${x + 66} ${y - 4} q12 -8 18 -22 M${x - 30} ${y - 16} q-4 -12 2 -22" stroke="${PAL.woodDark}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
}
function nestFront(threads: Threads = 2): string {
  const { x, y } = NEST;
  const thread = (i: number, c: string) => `<path class="thread" data-i="${i}" d="M${x - 62} ${y + 10 + i * 7} Q${x} ${y + 30 + i * 8} ${x + 62} ${y + 10 + i * 7}" stroke="${c}" stroke-width="3.2" stroke-dasharray="9 6" fill="none" stroke-linecap="round" ${threadWoven(threads, i) ? "" : 'opacity="0"'}/>`;
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
function lantern(): string {
  const x = NEST.x + 72;
  return `<path d="M${x} 1100 C${x + 2} 1040 ${x + 6} 1000 ${x + 10} 978 q10 -10 22 -4" stroke="${PAL.woodDark}" stroke-width="4.5" fill="none" stroke-linecap="round"/>` +
    `<g class="lantern-swing" style="transform-origin:${x + 32}px 974px"><path d="M${x + 32} 974 v10" stroke="${PAL.woodDeep}" stroke-width="2"/>` +
    `<rect x="${x + 24}" y="984" width="16" height="20" rx="6" fill="${PAL.lamp}"/><rect x="${x + 22}" y="982" width="20" height="5" rx="2.5" fill="${PAL.woodDeep}"/><rect x="${x + 22}" y="1002" width="20" height="4" rx="2" fill="${PAL.woodDeep}"/></g>`;
}
function nestGrounds(): string {
  const { x } = NEST;
  return ([[x - 104, 1110, PAL.letras], [x - 92, 1122, PAL.numeros], [x + 96, 1120, PAL.cores], [x + 108, 1108, "#FFFFFF"], [x - 70, 1128, "#FFFFFF"]] as [number, number, string][]).map(([fx, fy, c]) => flower(fx, fy, c)).join("") +
    tuft(x - 120, 1100) + tuft(x + 124, 1112) + tuft(x - 30, 1124, 0.8) +
    // basket of yarn: where the memories are kept
    `<g>${shadowAt(x - 92, 1094, 16, 4)}<path d="M${x - 108} 1078 h32 l-4 16 h-24z" fill="${PAL.wood}"/><path d="M${x - 108} 1078 h32" stroke="${PAL.woodDark}" stroke-width="3"/>` +
    `<circle cx="${x - 98}" cy="1074" r="7" fill="${PAL.letras}"/><circle cx="${x - 86}" cy="1072" r="6" fill="${PAL.linguas}"/><circle cx="${x - 92}" cy="1066" r="5" fill="${PAL.numeros}"/></g>`;
}

/* ---------- places ---------- */
function lighthouse(): string {
  const x = 868, b = 1138, top = 962, wb = 34, wt = 23;
  const xl = (y: number) => x - (wb + (wt - wb) * (b - y) / (b - top)), xr = (y: number) => x + (wb + (wt - wb) * (b - y) / (b - top));
  const band = (y1: number, y2: number, c: string) => `<path d="M${f1(xl(y1))} ${y1} L${f1(xr(y1))} ${y1} L${f1(xr(y2))} ${y2} L${f1(xl(y2))} ${y2}Z" fill="${c}"/>`;
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
type TreeLevel = 1 | 2 | 3 | 4;
/** The tree's growth layers (classes `arvore-l2..4`): each is drawn always and shown from its level up, so the return can grow it. */
const show = (on: boolean) => (on ? "" : ' opacity="0"');
/* Level 2: letter-fruits hanging in the crown */
function letterFruits(x: number, b: number, on: boolean): string {
  const fruits: [string, number, number, string][] = [["A", -84, -232, PAL.letras], ["B", 82, -226, PAL.lamp], ["C", -50, -318, PAL.linguas], ["D", 52, -320, PAL.letras], ["E", -110, -286, PAL.lamp], ["F", 112, -280, PAL.linguas]];
  return `<g class="arvore-l2"${show(on)}>` + fruits.map(([L, dx, dy, c], i) => {
    const fx = x + dx, fy = b + dy;
    return `<g class="dangle" style="--i:${i};transform-origin:${fx}px ${fy - 16}px"><path d="M${fx} ${fy - 16} v6" stroke="${PAL.woodDark}" stroke-width="2.2" stroke-linecap="round"/>` +
      `<ellipse cx="${fx + 5}" cy="${fy - 13}" rx="5" ry="2.6" fill="${PAL.leafLight}" transform="rotate(-25 ${fx + 5} ${fy - 13})"/>` +
      `<circle cx="${fx}" cy="${fy}" r="12" fill="${c}"/><circle cx="${fx + 3}" cy="${fy + 3}" r="9" fill="#000" opacity=".08"/><circle cx="${fx - 4}" cy="${fy - 4}" r="3.4" fill="#fff" opacity=".45"/>` +
      `<text x="${fx}" y="${fy + 5}" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="14" fill="#fff">${L}</text></g>`;
  }).join("") + `</g>`;
}
/* Level 3: two birds on the crown and two lanterns under it (they glow at night: see nightLights) */
function birdsAndLanterns(x: number, b: number, on: boolean): string {
  const bird = (bx: number, by: number, c: string, dark: string, facing: 1 | -1) =>
    `<g transform="translate(${bx} ${by}) scale(${facing} 1)">${shadowAt(0, 10, 10, 2.4, 0.14)}` +
    `<path d="M-12 2 q-8 -2 -12 -8 q8 0 13 3z" fill="${dark}"/>` +
    `<ellipse cx="0" cy="0" rx="12" ry="10" fill="${c}"/><ellipse cx="-2" cy="3" rx="7" ry="5" fill="${PAL.cream}" opacity=".85"/>` +
    `<path d="M-4 -2 q4 -7 10 -2 q-5 3 -10 2z" fill="${dark}"/>` +
    `<circle cx="7" cy="-8" r="7.5" fill="${c}"/><circle cx="9" cy="-9" r="1.8" fill="${PAL.ink}"/><circle cx="9.6" cy="-9.6" r=".6" fill="#fff"/>` +
    `<path d="M14 -8 l6 1.6 l-6 2z" fill="${PAL.lamp}"/><path d="M-2 9 v4 M3 9 v4" stroke="${PAL.woodDark}" stroke-width="1.6" stroke-linecap="round"/></g>`;
  const lantern = (lx: number, ly: number) =>
    `<g class="lantern-swing" style="transform-origin:${lx}px ${ly - 18}px"><path d="M${lx} ${ly - 18} v8" stroke="${PAL.woodDeep}" stroke-width="2"/>` +
    `<rect x="${lx - 7}" y="${ly - 10}" width="14" height="17" rx="5" fill="${PAL.lamp}"/><rect x="${lx - 9}" y="${ly - 12}" width="18" height="4.5" rx="2.2" fill="${PAL.letrasDark}"/><rect x="${lx - 9}" y="${ly + 5}" width="18" height="4" rx="2" fill="${PAL.letrasDark}"/></g>`;
  return `<g class="arvore-l3"${show(on)}>` + bird(x - 46, b - 398, PAL.linguas, PAL.linguasDark, 1) + bird(x + 70, b - 384, PAL.letras, PAL.letrasDark, -1) +
    lantern(x - 98, b - 196) + lantern(x + 104, b - 192) + `</g>`;
}
/* Level 4: the crown in flower */
function crownFlowers(x: number, b: number, on: boolean): string {
  const spots: [number, number, string][] = [[-120, -258, "#fff"], [-64, -366, PAL.letras], [8, -420, "#fff"], [70, -380, PAL.letras], [124, -250, "#fff"], [-26, -336, "#fff"], [96, -320, PAL.letras], [-98, -330, PAL.letras], [30, -280, "#fff"], [-136, -214, PAL.letras], [140, -214, "#fff"]];
  return `<g class="arvore-l4"${show(on)}>` + spots.map(([dx, dy, c]) => {
    const fx = x + dx, fy = b + dy;
    return `<g fill="${c}">${[0, 72, 144, 216, 288].map(a => `<circle cx="${f1(fx + Math.cos(a * Math.PI / 180) * 5)}" cy="${f1(fy + Math.sin(a * Math.PI / 180) * 5)}" r="4.4"/>`).join("")}</g><circle cx="${fx}" cy="${fy}" r="3" fill="${PAL.lamp}"/>`;
  }).join("") + `</g>`;
}
function letterTree(state: PlaceState, level: TreeLevel = 1): string {
  const x = 255, b = 972, ready = state === "pronto";
  let g = `<g id="letras">` + shadowAt(x + 12, b + 4, 74, 16, 0.18);
  g += `<path d="M${x - 26} ${b} C${x - 16} ${b - 40} ${x - 14} ${b - 140} ${x - 12} ${b - 196} h26 C${x + 16} ${b - 140} ${x + 18} ${b - 40} ${x + 30} ${b} C${x + 10} ${b - 6} ${x - 6} ${b - 6} ${x - 26} ${b}Z" fill="${PAL.trunk}"/>`;
  g += `<path d="M${x + 4} ${b - 4} C${x + 6} ${b - 60} ${x + 6} ${b - 140} ${x + 8} ${b - 196} h6 C${x + 16} ${b - 140} ${x + 18} ${b - 40} ${x + 30} ${b}Z" fill="${PAL.trunkDark}"/>`;
  g += `<path d="M${x - 26} ${b} q-16 2 -22 6 M${x + 30} ${b} q14 1 20 6" stroke="${PAL.trunk}" stroke-width="8" stroke-linecap="round"/>`;
  // the trunk's door, where the camera dives in (the hollow trunk inside is /arvore)
  if (ready) g += `<path d="M${x - 9} ${b - 2} v-20 a10 10 0 0 1 20 0 v20z" fill="${PAL.woodDeep}"/><path d="M${x - 6} ${b - 2} v-18 a7 7 0 0 1 14 0 v18z" fill="${PAL.woodDark}"/><circle cx="${x + 5}" cy="${b - 12}" r="1.6" fill="${PAL.lamp}"/>`;
  // canopy
  const parts: [number, number, number][] = [[0, -300, 92], [-82, -250, 64], [84, -246, 66], [-46, -350, 62], [52, -352, 60], [0, -390, 52]];
  g += `<g class="sway" style="transform-origin:${x}px ${b - 200}px">`;
  g += `<g fill="${PAL.leafDark}">${parts.map(([dx, dy, r]) => `<circle cx="${x + dx + r * 0.1}" cy="${b + dy + r * 0.12}" r="${r}"/>`).join("")}</g>`;
  g += `<g fill="${PAL.leaf}">${parts.map(([dx, dy, r]) => `<circle cx="${x + dx - r * 0.05}" cy="${b + dy - r * 0.05}" r="${r * 0.92}"/>`).join("")}</g>`;
  g += `<g fill="${PAL.leafLight}" opacity=".6">${parts.map(([dx, dy, r]) => `<circle cx="${x + dx - r * 0.34}" cy="${b + dy - r * 0.36}" r="${r * 0.38}"/>`).join("")}</g>`;
  if (ready) {
    g += crownFlowers(x, b, level >= 4) + letterFruits(x, b, level >= 2);
  } else {
    // hanging letter blocks (the place being built)
    g += ([["A", -70, -236, PAL.letras], ["B", 76, -228, PAL.lamp], ["C", -20, -214, PAL.linguas]] as [string, number, number, string][]).map(([L, dx, dy, c], i) =>
      `<g class="dangle" style="--i:${i};transform-origin:${x + dx}px ${b + dy - 26}px"><path d="M${x + dx} ${b + dy - 26} v18" stroke="${PAL.wool}" stroke-width="1.6"/><rect x="${x + dx - 11}" y="${b + dy - 8}" width="22" height="22" rx="5" fill="${c}"/><text x="${x + dx}" y="${b + dy + 9}" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="16" fill="#fff">${L}</text></g>`).join("");
  }
  g += `</g>`;
  // treehouse
  const hy = b - 190;
  g += `<rect x="${x - 60}" y="${hy + 34}" width="120" height="10" rx="4" fill="${PAL.woodDark}"/>`;
  g += `<circle cx="${x}" cy="${hy}" r="44" fill="#F3C892"/><path d="M${x + 12} ${hy - 42} A44 44 0 0 1 ${x + 12} ${hy + 42}Z" fill="#DDA96C"/>`;
  g += `<circle cx="${x - 12}" cy="${hy - 2}" r="11" fill="${PAL.woodDeep}"/><circle id="letras-win" cx="${x - 12}" cy="${hy - 2}" r="8" fill="${PAL.glow}" opacity=".3"/>`;
  g += `<path d="M${x + 6} ${hy + 34} v-24 a10 10 0 0 1 20 0 v24z" fill="${PAL.woodDark}"/>`;
  g += `<path d="M${x - 56} ${hy - 22} L${x} ${hy - 86} L${x + 56} ${hy - 22} Q${x} ${hy - 6} ${x - 56} ${hy - 22}Z" fill="${PAL.letras}"/><path d="M${x} ${hy - 86} L${x + 56} ${hy - 22} Q${x + 30} ${hy - 12} ${x + 10} ${hy - 12}Z" fill="${PAL.letrasDark}"/>`;
  g += `<path d="M${x - 50} ${hy + 44} l-6 150 M${x - 34} ${hy + 44} l-4 150" stroke="${PAL.woodLight}" stroke-width="3"/>` + [0, 1, 2, 3, 4, 5].map(i => `<path d="M${x - 53 - i * 0.2} ${hy + 64 + i * 24} h17" stroke="${PAL.woodLight}" stroke-width="3"/>`).join("");
  if (ready) g += birdsAndLanterns(x, b, level >= 3);
  if (state === "obra") g += scaffold(x, hy, b);
  g += `</g>`;
  return g;
}
/* "Em construção": twig scaffolding, a little tarp and a tiny working hammer */
function scaffold(x: number, hy: number, gy: number): string {
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
function sprout(x: number, y: number, icon: string, color: string): string {
  return `<g class="sprout"><g transform="translate(${x} ${y}) scale(1.4) translate(${-x} ${-y})">` + shadowAt(x, y + 2, 30, 7) + `<path d="${blob(x, y - 4, 34, 10, 8, 0.15, x)}" fill="${PAL.soilMid}"/>` +
    `<path d="M${x - 2} ${y - 6} q-2 -16 2 -26" stroke="${PAL.leafDark}" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="${x - 10}" cy="${y - 30}" rx="10" ry="5" fill="${PAL.leaf}" transform="rotate(-25 ${x - 10} ${y - 30})"/><ellipse cx="${x + 9}" cy="${y - 34}" rx="10" ry="5" fill="${PAL.leafLight}" transform="rotate(25 ${x + 9} ${y - 34})"/>` +
    `<rect x="${x + 26}" y="${y - 30}" width="4" height="30" fill="${PAL.woodDark}"/><rect x="${x + 10}" y="${y - 52}" width="36" height="26" rx="6" fill="${PAL.cream}"/><rect x="${x + 10}" y="${y - 52}" width="36" height="26" rx="6" fill="none" stroke="${color}" stroke-width="3"/>` +
    `<text x="${x + 28}" y="${y - 34}" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="13" fill="${color}">${icon}</text>` +
    `<g stroke="${PAL.woodLight}" stroke-width="3" stroke-linecap="round"><path d="M${x - 40} ${y + 4} v-14 M${x - 26} ${y + 8} v-14 M${x - 44} ${y - 2} l20 4"/></g></g></g>`;
}
function numberTower(state: PlaceState): string {
  const x = 738, b = 968;
  if (state !== "pronto") return `<g id="numeros">${sprout(x - 10, b, "123", PAL.numerosDark)}</g>`;
  const blocks: [number, string, number][] = [[1, PAL.lamp, 0], [2, PAL.leaf, -4], [3, PAL.linguas, 3], [4, PAL.letras, -2]];
  let g = `<g id="numeros">` + shadowAt(x + 8, b + 4, 50, 12, 0.18);
  blocks.forEach(([n, c, rot], i) => { const y = b - 56 * (i + 1); g += `<g transform="rotate(${rot} ${x} ${y + 28})"><rect x="${x - 28}" y="${y}" width="56" height="56" rx="9" fill="${c}"/><rect x="${x + 10}" y="${y}" width="18" height="56" rx="6" fill="#000" opacity=".1"/><text x="${x - 3}" y="${y + 40}" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="34" fill="#fff">${n}</text></g>`; });
  g += `<path d="M${x} ${b - 224} v-36" stroke="${PAL.woodDark}" stroke-width="3"/><path d="M${x} ${b - 260} l22 7 l-22 7z" fill="${PAL.letras}"/></g>`;
  return g;
}
function garden(state: PlaceState): string {
  const x = 262, y = 1222;
  if (state !== "pronto") return `<g id="cores">${sprout(x, y, "●▲■", PAL.coresDark)}</g>`;
  let g = `<g id="cores">` + `<path d="${blob(x, y, 70, 22, 9, 0.12, 51)}" fill="${PAL.soilMid}"/>`;
  ([[-46, -6, PAL.letras], [-24, 2, PAL.lamp], [0, -4, PAL.cores], [24, 2, PAL.linguas], [46, -6, PAL.letras], [-34, 10, PAL.cores], [34, 10, PAL.lamp]] as [number, number, string][]).forEach(([dx, dy, c]) => g += flower(x + dx, y + dy, c, 1.6));
  g += `</g>`;
  return g;
}
function pond(state: PlaceState): string {
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

/* ---------- emissive night lights (drawn above the night grade) ---------- */
/** The tree's night lights (island space, after the places' translate(-15 -32)): its two lanterns and, in flower, a warm glow around the crown. */
const TREE_GLOW = { lanterns: [[142, 744], [344, 748]] as Pt[], crown: [240, 610] as Pt };
function nightLights(level: TreeLevel = 1): string {
  const g = (x: number, y: number, r: number, c: string = PAL.glow, cls = "") => `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}" fill="url(#glowGrad)" style="--c:${c}"/>`;
  return `<defs><radialGradient id="glowGrad"><stop offset="0" stop-color="#FFE7A8" stop-opacity=".95"/><stop offset=".35" stop-color="#FFD27A" stop-opacity=".45"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></radialGradient>
    <radialGradient id="poolGrad"><stop offset="0" stop-color="#FFB866" stop-opacity=".55"/><stop offset=".6" stop-color="#FFB866" stop-opacity=".2"/><stop offset="1" stop-color="#FFB866" stop-opacity="0"/></radialGradient>
    <linearGradient id="beamGrad" x1="0" x2="1"><stop offset="0" stop-color="#FFE7A8" stop-opacity=".55"/><stop offset="1" stop-color="#FFE7A8" stop-opacity="0"/></linearGradient></defs>` +
    `<g id="lights"><circle id="poolNest" cx="520" cy="842" r="130" fill="url(#poolGrad)" style="mix-blend-mode:screen"/><circle id="poolNino" cx="0" cy="0" r="70" fill="url(#poolGrad)" style="mix-blend-mode:screen"/>${g(604, 804, 34, "", "l-lantern")}${g(228, 748, 30, "", "l-letras")}${g(862, 949, 46, "", "l-farol")}${g(862, 1064, 14)}
     <circle id="arvore-aura" cx="${TREE_GLOW.crown[0]}" cy="${TREE_GLOW.crown[1]}" r="190" fill="url(#poolGrad)" style="mix-blend-mode:screen"${show(level >= 4)}/>
     <g id="arvore-lights"${show(level >= 3)}>${TREE_GLOW.lanterns.map(([x, y]) => g(x, y, 24, "", "l-arvore")).join("")}</g>
     <path id="beam" d="M862 949 L1240 890 L1240 1010 Z" fill="url(#beamGrad)" opacity="0"/>
     <g id="fireflies" fill="#FFE7A8">${[[330, 1000], [420, 1110], [720, 1000], [560, 1200], [180, 1150], [800, 1250], [460, 930]].map(([x, y], i) => `<circle class="ff" data-i="${i}" cx="${x}" cy="${y}" r="3"/>`).join("")}</g></g>`;
}

/* ---------- layers ---------- */
export function buildIsland(o: { states: IslandStates; threads: Threads; arvoreLevel?: TreeLevel }): { far: string; mid: string; island: string; near: string } {
  const st = { ...o.states, threads: o.threads };
  const treeLevel = o.arvoreLevel ?? 1;
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
    `<g id="places"><g transform="translate(-15 -32)">${letterTree(st.letras, treeLevel)}</g><g transform="translate(32 -38)">${numberTower(st.numeros)}</g><g transform="translate(-60 80)">${pond(st.lago)}</g><g transform="translate(-22 -32)">${garden(st.cores)}</g><g transform="translate(-6 12)">${lighthouse()}</g></g>` +
    `<g id="nestG" transform="translate(0 -190)">${stump()}${nestGrounds()}${nestBack()}<g id="slotNest"></g>${nestFront(st.threads)}${lantern()}</g><g id="butterflies">${butterfly(0)}${butterfly(1)}</g>` +
    `<g id="decorFront">${bush(120, 1330, 1.1)}${bush(440, 1450, 0.9)}${bush(860, 1340, 0.8)}${bush(210, 1410, 0.8)}${rock(300, 1420, 1.1, 8)}${rock(780, 1420, 0.9, 9)}${flower(140, 1232, PAL.letras)}${flower(160, 1248, PAL.lamp)}${flower(450, 1300, PAL.cores)}${flower(720, 1200, "#fff")}${flower(740, 1212, PAL.letras)}${flower(680, 1440, PAL.lamp)}${tuft(470, 1380)}${tuft(300, 1330)}${tuft(700, 1460)}</g>` +
    `<g id="slotActors"></g>` +
    `<rect id="nightGrade" x="-2000" y="-2000" width="5000" height="6000" fill="#3A4A8C" opacity="0" style="mix-blend-mode:multiply"/>` +
    nightLights(st.letras === "pronto" ? treeLevel : 1);
  const near = cloud(60, 1760, 1.5) + cloud(940, 1820, 1.6) + cloud(500, 2060, 1.2, 0.9);
  return { far, mid, island, near };
}

/** Pin anchors on the island (viewBox units, after the group transforms). */
export const PLACE_ANCHORS: Record<PlaceId, { x: number; y: number }> = {
  ninho: { x: 500, y: 786 },
  farol: { x: 876, y: 862 },
  letras: { x: 240, y: 556 },
  numeros: { x: 756, y: 806 },
  cores: { x: 240, y: 1100 },
  lago: { x: 640, y: 1306 },
};

/** The tree's trunk door where the camera dives in (island space, after translate(-15 -32)). */
export const ARVORE_DOOR = { x: 241, y: 928 } as const;

/** The lighthouse door where Nino goes in/out (island space, after translate(-6 12)). */
export const FAROL_DOOR = { x: 862, y: 1136 } as const;
