/* Inside the Farol das Línguas: the trail is the spiral staircase. Each landing is a stop,
   the lamp at the top lights up when the unit is done. Own gradient ids (`fi-`) never clash with the island's. */
import { PAL } from "./palette";
import { rng } from "./shapes";

const FAROL_STOPS: { id: string; x: number; y: number; icon: "music" | "talk" | "book" | "star"; label: string }[] = [
  { id: "musica", x: 330, y: 2170, icon: "music", label: "Música" },
  { id: "licao1", x: 668, y: 1930, icon: "talk", label: "Lição 1" },
  { id: "licao2", x: 332, y: 1690, icon: "talk", label: "Lição 2" },
  { id: "licao3", x: 668, y: 1450, icon: "talk", label: "Lição 3" },
  { id: "historia", x: 332, y: 1210, icon: "book", label: "História" },
  { id: "desafio", x: 640, y: 970, icon: "star", label: "Desafio" },
];

/** Where Nino stands on each landing (interior space). */
export const FAROL_LANDINGS: { x: number; y: number }[] = FAROL_STOPS.map(({ x, y }) => ({ x, y }));

/** The door we came in through (interior space). */
export const FAROL_INTERIOR_DOOR = { x: 500, y: 2390 } as const;

export function buildFarolInterior(): string {
  const P = PAL, W = 1000;
  const stone = (() => { const r = rng(91); let s = ""; for (let row = 0; row < 40; row++) { const y = 380 + row * 54, off = row % 2 ? 0 : 60; for (let x = -420 + off; x < W + 420; x += 120) { const w = 104 + r() * 10; s += `<rect x="${(x + r() * 6).toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="46" rx="12"/>`; } } return s; })();
  let g = `<defs><linearGradient id="fi-cyl" x1="0" x2="1"><stop offset="0" stop-color="#5A3F2A" stop-opacity=".35"/><stop offset=".22" stop-color="#5A3F2A" stop-opacity="0"/><stop offset=".78" stop-color="#5A3F2A" stop-opacity="0"/><stop offset="1" stop-color="#5A3F2A" stop-opacity=".42"/></linearGradient>
    <radialGradient id="fi-glow"><stop offset="0" stop-color="#FFE7A8" stop-opacity=".95"/><stop offset=".4" stop-color="#FFD27A" stop-opacity=".4"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></radialGradient>
    <radialGradient id="fi-door-light" cx=".5" cy="1" r=".8"><stop offset="0" stop-color="#FFE7A8" stop-opacity=".8"/><stop offset="1" stop-color="#FFE7A8" stop-opacity="0"/></radialGradient></defs>`;
  g += `<rect x="-400" y="0" width="1800" height="2700" fill="#EFE5D3"/><g fill="#E4D7C0">${stone}</g>`;
  // round windows with the sea and little boats
  const win = (x: number, y: number, r: number, i: number) => `<g><circle cx="${x}" cy="${y}" r="${r + 14}" fill="${P.woodDark}"/><circle cx="${x}" cy="${y}" r="${r}" fill="#A9DDF3"/><path d="M${x - r} ${y + r * 0.25} Q${x} ${y + r * 0.1} ${x + r} ${y + r * 0.25} V${y + r} H${x - r}Z" fill="${P.linguas}" clip-path="circle(${r}px at ${x}px ${y}px)"/>` +
    `<path class="boat" style="--i:${i}" d="M${x - 14} ${y + r * 0.2} h28 q-4 8 -14 8 q-10 0 -14 -8z M${x} ${y + r * 0.2} v-22 l14 18z" fill="${P.letras}"/><path d="M${x - r} ${y} h${2 * r}" stroke="${P.woodDark}" stroke-width="6"/><path d="M${x} ${y - r} v${2 * r}" stroke="${P.woodDark}" stroke-width="6"/></g>`;
  g += win(170, 1560, 70, 0) + win(840, 1180, 64, 1) + win(170, 860, 62, 2);
  // wall decor: map with speech bubbles, shelf, lanterns, garland
  g += `<g><rect x="760" y="1660" width="170" height="120" rx="10" fill="${P.cream}"/><path d="M790 1740 q30 -40 60 -10 q30 30 50 -20" stroke="${P.linguas}" stroke-width="5" fill="none"/>` +
    `<g><rect x="786" y="1676" width="44" height="26" rx="10" fill="${P.letras}"/><path d="M796 1700 l-4 10 l12 -8z" fill="${P.letras}"/><text x="808" y="1695" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="14" fill="#fff">Hi!</text></g>` +
    `<g><rect x="862" y="1718" width="54" height="26" rx="10" fill="${P.mundo}"/><path d="M904 1742 l6 10 l-12 -8z" fill="${P.mundo}"/><text x="889" y="1737" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="14" fill="#fff">Olá!</text></g></g>`;
  g += `<g><rect x="70" y="1960" width="170" height="12" rx="4" fill="${P.woodDark}"/>${([[86, P.letras], [104, P.lamp], [122, P.linguas], [140, P.mundo]] as [number, string][]).map(([x, c], i) => `<rect x="${x}" y="${1914 + (i % 2) * 6}" width="15" height="${46 - (i % 2) * 6}" rx="3" fill="${c}"/>`).join("")}<circle cx="200" cy="1934" r="24" fill="${P.linguas}"/><path d="M182 1924 q18 8 36 -2 M184 1946 q16 -8 32 2" stroke="${P.leaf}" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="196" y="1956" width="8" height="8" fill="${P.woodDark}"/></g>`;
  g += ([[500, 1560], [470, 1080], [530, 760]] as [number, number][]).map(([x, y]) => `<g class="lantern-swing" style="transform-origin:${x}px ${y - 60}px"><path d="M${x} ${y - 60} v40" stroke="${P.woodDeep}" stroke-width="3"/><rect x="${x - 12}" y="${y - 22}" width="24" height="30" rx="8" fill="${P.lamp}"/><rect x="${x - 15}" y="${y - 26}" width="30" height="6" rx="3" fill="${P.woodDeep}"/></g>`).join("");
  g += `<path d="M60 600 Q500 700 940 600" stroke="${P.woodDark}" stroke-width="2" fill="none"/>` + Array.from({ length: 11 }, (_, i) => { const t = (i + 0.5) / 11, x = 60 + 880 * t, y = 600 + 400 * t * (1 - t) * 0.25 * 4 * 0.25; const c = [P.linguas, P.lamp, P.letras, P.mundo, P.cores][i % 5]; return `<path d="M${x - 10} ${y} h20 l-10 18z" fill="${c}"/>`; }).join("");
  // floor, rug, the door we came in through
  g += `<rect x="-400" y="2380" width="1800" height="320" fill="#C89566"/><g stroke="#B07E52" stroke-width="3">${Array.from({ length: 14 }, (_, i) => `<path d="M${-300 + i * 120} 2380 v320"/>`).join("")}</g>`;
  g += `<ellipse cx="500" cy="2470" rx="250" ry="56" fill="${P.linguas}"/><ellipse cx="500" cy="2470" rx="200" ry="40" fill="none" stroke="${P.cream}" stroke-width="6" stroke-dasharray="14 10"/>`;
  g += `<rect x="400" y="2140" width="200" height="250" fill="url(#fi-door-light)"/><path d="M430 2390 V2250 a70 70 0 0 1 140 0 V2390Z" fill="${P.woodDark}"/><path d="M500 2190 V2390" stroke="${P.woodDeep}" stroke-width="5"/><circle cx="530" cy="2320" r="6" fill="${P.lamp}"/>`;
  // the staircase: planks between landings, with a rail
  const pts: [number, number][] = [[500, 2380], ...FAROL_STOPS.map((s): [number, number] => [s.x, s.y]), [500, 700]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], n = 7;
    for (let k = 1; k < n; k++) { const t = k / n, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t; g += `<rect x="${(x - 46).toFixed(1)}" y="${(y + 18).toFixed(1)}" width="92" height="14" rx="5" fill="#8E5C33"/><rect x="${(x - 46).toFixed(1)}" y="${(y + 4).toFixed(1)}" width="92" height="18" rx="6" fill="${P.wood}"/>`; }
    g += `<path d="M${x1 + 40} ${y1 - 60} L${x2 + 40} ${y2 - 60}" stroke="${P.woodDark}" stroke-width="7" stroke-linecap="round"/>`;
  }
  // the lamp room at the top
  g += `<g id="lampRoom"><rect x="330" y="470" width="340" height="220" rx="30" fill="${P.linguasDeep}"/><rect x="350" y="490" width="300" height="180" rx="22" fill="#FFF4D6"/>` +
    `<circle id="bigLampGlow" cx="500" cy="580" r="150" fill="url(#fi-glow)" opacity=".25"/><circle id="bigLamp" cx="500" cy="580" r="62" fill="${P.lamp}" opacity=".45"/>` +
    `<path d="M470 520 v120 M530 520 v120" stroke="${P.linguasDeep}" stroke-width="8"/><path d="M330 470 Q500 330 670 470Z" fill="${P.linguasDeep}"/></g>`;
  // landings (stops)
  const icon = (k: string, x: number, y: number, c: string) => ({
    music: `<path d="M${x - 8} ${y + 12} V${y - 14} l20 -5 V${y + 8}" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x - 13}" cy="${y + 13}" r="7" fill="${c}"/><circle cx="${x + 7}" cy="${y + 9}" r="7" fill="${c}"/>`,
    talk: `<rect x="${x - 20}" y="${y - 16}" width="40" height="28" rx="10" fill="${c}"/><path d="M${x - 8} ${y + 10} l-6 10 l14 -8z" fill="${c}"/><circle cx="${x - 9}" cy="${y - 2}" r="3" fill="#fff"/><circle cx="${x}" cy="${y - 2}" r="3" fill="#fff"/><circle cx="${x + 9}" cy="${y - 2}" r="3" fill="#fff"/>`,
    book: `<path d="M${x} ${y - 12} q-12 -8 -24 -4 v28 q12 -4 24 4 q12 -8 24 -4 v-28 q-12 -4 -24 4z" fill="${c}"/><path d="M${x} ${y - 12} v28" stroke="#fff" stroke-width="2.5"/>`,
    star: `<path d="M${x} ${y - 22} l6.5 13.5 14.8 1.8-10.9 10.2 2.8 14.6L${x} ${y + 11} l-13.2 7.1 2.8-14.6-10.9-10.2 14.8-1.8z" fill="${c}"/>`,
  })[k];
  g += FAROL_STOPS.map((s, i) => `<g class="stop" data-i="${i}"><ellipse cx="${s.x}" cy="${s.y + 40}" rx="96" ry="26" fill="#8E5C33"/><ellipse cx="${s.x}" cy="${s.y + 30}" rx="96" ry="26" fill="${P.wood}"/>` +
    `<circle class="stop-halo" cx="${s.x}" cy="${s.y - 18}" r="100" fill="url(#fi-glow)" opacity="0"/>` +
    `<circle cx="${s.x}" cy="${s.y - 10}" r="62" fill="#C9BEA9"/><circle class="stop-face" cx="${s.x}" cy="${s.y - 18}" r="62" fill="${P.cream}"/>` +
    `<g class="stop-icon" transform="translate(${s.x} ${s.y - 18}) scale(1.3) translate(${-s.x} ${-(s.y - 18)})">${icon(s.icon, s.x, s.y - 18, P.linguas)}</g>` +
    `<g class="stop-done" opacity="0" transform="translate(10 -12)"><circle cx="${s.x + 36}" cy="${s.y - 52}" r="17" fill="${P.lamp}"/><path d="M${s.x + 36} ${s.y - 64} l3.4 7 7.6 .9-5.6 5.3 1.4 7.5-6.8-3.7-6.8 3.7 1.4-7.5-5.6-5.3 7.6-.9z" fill="#fff"/></g></g>`).join("");
  g += `<g id="slotInterior"></g>`;
  g += `<rect x="-400" y="0" width="1800" height="2700" fill="url(#fi-cyl)" pointer-events="none"/>`;
  return g;
}
