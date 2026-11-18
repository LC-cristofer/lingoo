/* The stage: plain-TS runtime that mounts the Ilha-Ninho (or the Farol interior) as SVG layers and
   drives all motion (camera, day/night, ambient loops, Nino). React never re-renders per frame:
   only viewBox, SVG attributes, transform and opacity change. Ported from tools/visual/ilha/src/app.js. */
import { createNinoRig, type NinoRig } from "@/art/nino/rig";
import { FAROL_INTERIOR_DOOR, buildFarolInterior } from "./farol-interior";
import { NEST, ROUTES, buildIsland, type IslandStates, type PlaceId } from "./island";
import { LAYER_K, layerViewBox, toScreen, overviewCam, type Cam, type Viewport } from "./camera";
import { createTimeline, type Timeline } from "./timeline";

const FAROL_IN = FAROL_INTERIOR_DOOR;
const SVGNS = "http://www.w3.org/2000/svg";
const SKY_D = ["#7CC4EE", "#CDEBF8", "#FFEFD9"], SKY_N = ["#0E1640", "#1E2A6B", "#3A3270"];
const mixHex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",") + ")";
};
/** Sprout pivots (base of the sprout, in its place's local space) when getBBox is unavailable. */
const SPROUT_PIVOT: Record<string, [number, number]> = { numeros: [728, 968], cores: [262, 1222], lago: [700, 1324] };

export type Stage = {
  tl: Timeline;
  cam: Cam;
  nino: NinoRig;
  env: { night: number; farolLevel: number; reduced: boolean };
  fx: { pennant: number[]; boatX: number; thread: number[]; lampPulse: number; hammerFast: boolean; wiggle: Partial<Record<PlaceId, number>> };
  setViewport(vp: Viewport): void;
  frame(t: number): void;
  screenOf(x: number, y: number): [number, number];
  moveNino(slot: "nest" | "actors" | "interior"): void;
  walk(route: keyof typeof ROUTES, reverse?: boolean): Promise<void>;
  onFrame(cb: (t: number) => void): () => void;
  destroy(): void;
};

export type StageOptions = {
  scene: "island" | "farol"; states: IslandStates; threads: number; farolLevel: 1 | 2 | 3 | 4; reduced: boolean; clock?: "raf" | "manual";
};

function svgEl(html: string, id: string, cls = "stage-layer"): SVGSVGElement {
  const s = document.createElementNS(SVGNS, "svg") as SVGSVGElement;
  s.setAttribute("id", id);
  s.setAttribute("class", cls);
  s.setAttribute("aria-hidden", "true");
  s.setAttribute("preserveAspectRatio", "xMidYMid slice");
  s.setAttribute("viewBox", "0 0 1000 1000");
  Object.assign(s.style, { position: "absolute", inset: "0", width: "100%", height: "100%", overflow: "hidden", display: "block" });
  s.innerHTML = html;
  return s;
}
const all = (roots: Element[], sel: string) => roots.flatMap(r => [...r.querySelectorAll(sel)]);
const setOp = (e: Element | null | undefined, v: number) => e?.setAttribute("opacity", v.toFixed(3));

/** Straight-line fallback and endpoints, parsed from a route's path data. */
function routeEnds(d: string): [[number, number], [number, number]] {
  const n = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  return [[n[0], n[1]], [n[n.length - 2], n[n.length - 1]]];
}

export function createStage(host: HTMLElement, o: StageOptions): Stage {
  const tl = createTimeline();
  const isIsland = o.scene === "island";
  const env = { night: 0, farolLevel: o.farolLevel as number, reduced: o.reduced };
  const fx: Stage["fx"] = {
    pennant: [1, 1, 0, 0, 0], boatX: 120, thread: [0, 1, 2, 3].map(i => (i < o.threads ? 1 : 0)), lampPulse: 0, hammerFast: false, wiggle: {},
  };
  let vp: Viewport = { w: host.clientWidth || 390, h: host.clientHeight || 844, top: 108, bottom: 150 };
  const cam: Cam = isIsland ? overviewCam(vp) : { X: 500, Y: 2250, D: 0.5 };

  // ---- DOM ----
  const wrap = document.createElement("div");
  wrap.className = "stage-root";
  Object.assign(wrap.style, { position: "absolute", inset: "0", overflow: "hidden" });
  let skySvg: SVGSVGElement | null = null;
  const skyStops: SVGStopElement[] = [];
  let layers: { el: SVGSVGElement; k: number }[] = [];
  let isl: SVGSVGElement | null = null, far: SVGSVGElement | null = null, inter: SVGSVGElement | null = null;
  if (isIsland) {
    const art = buildIsland({ states: o.states, threads: o.threads });
    skySvg = svgEl(`<defs><linearGradient id="stageSkyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0"/><stop offset=".55"/><stop offset="1"/></linearGradient></defs><rect width="1000" height="1000" fill="url(#stageSkyG)"/>`, "Lsky", "stage-sky");
    skySvg.setAttribute("preserveAspectRatio", "none");
    skyStops.push(...(skySvg.querySelectorAll("stop") as unknown as SVGStopElement[]));
    wrap.appendChild(skySvg);
    far = svgEl(art.far, "Lfar");
    const mid = svgEl(art.mid, "Lmid");
    isl = svgEl(art.island, "Lisl");
    const near = svgEl(art.near, "Lnear");
    layers = [[far, LAYER_K.far], [mid, LAYER_K.mid], [isl, LAYER_K.island], [near, LAYER_K.near]].map(([el, k]) => ({ el: el as SVGSVGElement, k: k as number }));
    layers.forEach(l => wrap.appendChild(l.el));
  } else {
    inter = svgEl(buildFarolInterior(), "Lint");
    layers = [{ el: inter, k: 0 }];
    wrap.appendChild(inter);
  }
  host.appendChild(wrap);
  const roots: Element[] = layers.map(l => l.el);

  // the day-time glow on the farol lamp (must use the island's glow gradient)
  let glowDay: SVGCircleElement | null = null;
  if (isl) {
    glowDay = document.createElementNS(SVGNS, "circle") as SVGCircleElement;
    glowDay.setAttribute("id", "farol-glow-day");
    glowDay.setAttribute("cx", "868"); glowDay.setAttribute("cy", "937"); glowDay.setAttribute("r", "40");
    glowDay.setAttribute("fill", "url(#glowGrad)");
    isl.querySelector("#farol")?.appendChild(glowDay);
  }

  const q = (s: string) => isl?.querySelector(s) ?? null;
  const els = {
    grade: q("#nightGrade"), lights: q("#lights"), stars: far?.querySelector("#stars") ?? null, sun: far?.querySelector("#sun") ?? null,
    moon: far?.querySelector("#moon") ?? null, beam: q("#beam"), lamp: q("#farol-lamp"), poolNino: q("#poolNino"), hammer: q(".hammer"),
    boat: q("#barco"),
    pennants: isl ? [...isl.querySelectorAll(".pennant")] : [], threads: isl ? [...isl.querySelectorAll(".thread")] : [],
    ff: isl ? [...isl.querySelectorAll(".ff")] : [], bf: isl ? [...isl.querySelectorAll(".bfly")] : [],
    sprouts: isl ? [...isl.querySelectorAll(".sprout")] : [],
    sways: all(roots, ".sway"), drifts: all(roots, ".drift"), bobs: all(roots, ".bob"), dangles: all(roots, ".dangle"),
    lanterns: all(roots, ".lantern-swing"), ripples: all(roots, ".ripple"),
    bigLamp: inter?.querySelector("#bigLamp") ?? null, bigGlow: inter?.querySelector("#bigLampGlow") ?? null,
  };
  const starKids = els.stars ? [...els.stars.children] : [];
  const sproutPivot = new Map<Element, [number, number]>();

  // ---- Nino ----
  let slot: "nest" | "actors" | "interior" = isIsland ? "nest" : "interior";
  const slotEl = (s: typeof slot) => (s === "nest" ? q("#slotNest") : s === "actors" ? q("#slotActors") : inter?.querySelector("#slotInterior")) as SVGElement | null;
  const nino = createNinoRig(slotEl(slot) as SVGElement, isIsland ? { x: 500, y: 1070, s: 0.56 } : { x: FAROL_IN.x, y: FAROL_IN.y, s: 0.62 });

  function moveNino(to: "nest" | "actors" | "interior") {
    const target = slotEl(to);
    if (!target || to === slot) return;
    if (slot === "nest" && to === "actors") nino.st.y += NEST.dy;
    else if (slot === "actors" && to === "nest") nino.st.y -= NEST.dy;
    target.appendChild(nino.el);
    slot = to;
    nino.render(tl.now(), env.reduced);
  }

  // ---- camera ----
  const lastVB: string[] = [], lastVis: string[] = [], lastFilter: string[] = [];
  function applyCam() {
    layers.forEach((L, i) => {
      const vb = layerViewBox(cam, L.k, vp);
      const vis = vb ? "visible" : "hidden";
      if (lastVis[i] !== vis) { L.el.style.visibility = vis; lastVis[i] = vis; }
      if (vb) {
        const s = `${vb[0].toFixed(2)} ${vb[1].toFixed(2)} ${vb[2].toFixed(2)} ${vb[3].toFixed(2)}`;
        if (lastVB[i] !== s) { L.el.setAttribute("viewBox", s); lastVB[i] = s; }
      }
    });
    if (isIsland) {
      const blur = env.reduced ? 0 : Math.max(0, Math.min(3.2, (0.62 - cam.D) * 7));
      const f = [blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none", blur > 0.05 ? `blur(${(blur * 0.55).toFixed(2)}px)` : "none"];
      f.forEach((v, i) => { if (lastFilter[i] !== v) { layers[i].el.style.filter = v; lastFilter[i] = v; } });
    }
  }

  // ---- world ----
  let lastNight = -1;
  function renderWorld(t: number) {
    const n = env.night, red = env.reduced, lv = env.farolLevel;
    if (isIsland) {
      if (n !== lastNight) {
        lastNight = n;
        skyStops.forEach((s, i) => s.setAttribute("stop-color", mixHex(SKY_D[i], SKY_N[i], n)));
      }
      setOp(els.grade, n * 0.62); setOp(els.lights, n);
      setOp(els.stars, n); setOp(els.sun, 1 - n); setOp(els.moon, n);
      setOp(els.beam, n * (lv >= 2 ? 0.9 : 0.4) * (red ? 1 : 0.75 + 0.25 * Math.sin(t / 900)));
      els.lamp?.setAttribute("r", (9 + lv * 2.5 + fx.lampPulse * 6).toFixed(2));
      glowDay?.setAttribute("r", (24 + lv * 16 + fx.lampPulse * 30).toFixed(1));
      setOp(glowDay, (0.25 + lv * 0.22 + fx.lampPulse * 0.4) * (1 - n * 0.5));
      els.pennants.forEach((p, i) => {
        const v = fx.pennant[i] ?? 0;
        p.setAttribute("opacity", Math.min(1, v).toFixed(2));
        p.setAttribute("transform", v < 1 ? `translate(0 ${((1 - v) * -14).toFixed(1)})` : "");
      });
      els.boat?.setAttribute("transform", `translate(${(690 + fx.boatX).toFixed(1)} ${(1244 + (red ? 0 : Math.sin(t / 700) * 2)).toFixed(1)}) rotate(${(red ? 0 : Math.sin(t / 900) * 4).toFixed(2)})`);
      els.threads.forEach((p, i) => {
        const v = fx.thread[i] ?? 0;
        p.setAttribute("opacity", v > 0 ? "1" : "0");
        p.setAttribute("stroke-dashoffset", ((1 - v) * 160).toFixed(1));
        p.setAttribute("stroke-dasharray", v >= 1 ? "9 6" : `${(v * 160).toFixed(1)} 400`);
      });
      els.bf.forEach((g, i) => {
        const x = 500 + Math.sin(t / 2300 + i * 2.2) * 90 + Math.sin(t / 700 + i) * 22;
        const y = 806 + Math.sin(t / 1900 + i * 1.3) * 40 - Math.abs(Math.sin(t / 420 + i)) * 16;
        g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(1.5)`);
        g.setAttribute("opacity", (1 - n).toFixed(2));
        const k = red ? 1 : 0.25 + 0.75 * Math.abs(Math.sin(t / 85 + i));
        g.children[0]?.setAttribute("transform", `scale(${k.toFixed(3)} 1)`);
        g.children[1]?.setAttribute("transform", `scale(${k.toFixed(3)} 1)`);
      });
      const inNest = slot === "nest";
      els.poolNino?.setAttribute("cx", (inNest ? 500 : nino.st.x).toFixed(1));
      els.poolNino?.setAttribute("cy", (inNest ? 850 : nino.st.y - 40).toFixed(1));
      els.poolNino?.setAttribute("opacity", "1");
      els.sprouts.forEach(g => {
        const id = (g.parentNode as Element | null)?.id ?? "";
        const w = fx.wiggle[id as PlaceId] || 0;
        let c = sproutPivot.get(g);
        if (!c) {
          let box: { x: number; y: number; width: number; height: number } | null = null;
          try { box = typeof (g as SVGGraphicsElement).getBBox === "function" ? (g as SVGGraphicsElement).getBBox() : null; } catch { box = null; }
          c = box ? [box.x + box.width / 2, box.y + box.height] : (SPROUT_PIVOT[id] ?? [500, 1000]);
          sproutPivot.set(g, c);
        }
        g.setAttribute("transform", w ? `rotate(${(Math.sin(t / 70) * 4 * w).toFixed(2)} ${c[0].toFixed(1)} ${c[1].toFixed(1)})` : "");
      });
    } else {
      els.bigLamp?.setAttribute("opacity", (0.35 + 0.1 * lv + fx.lampPulse * 0.5).toFixed(2));
      els.bigGlow?.setAttribute("opacity", (0.2 + 0.12 * lv + fx.lampPulse * 0.6).toFixed(2));
    }
    if (!red) {
      els.sways.forEach((g, i) => g.setAttribute("transform", `rotate(${(Math.sin(t / 2100 + i) * 1.1).toFixed(3)})`));
      els.drifts.forEach((g, i) => g.setAttribute("transform", `translate(${(Math.sin(t / 9000 + i * 2) * 26).toFixed(2)} 0)`));
      els.bobs.forEach((g, i) => g.setAttribute("transform", `translate(0 ${(Math.sin(t / 1700 + i) * 6).toFixed(2)})`));
      els.dangles.forEach((g, i) => g.setAttribute("transform", `rotate(${(Math.sin(t / 800 + i * 1.7) * 6).toFixed(2)})`));
      els.lanterns.forEach((g, i) => g.setAttribute("transform", `rotate(${(Math.sin(t / 1300 + i) * 3).toFixed(2)})`));
      els.ripples.forEach(g => g.setAttribute("transform", `translate(${(Math.sin(t / 1100) * 5).toFixed(2)} 0)`));
      els.hammer?.setAttribute("transform", `rotate(${(Math.max(0, Math.sin(t / (fx.hammerFast ? 90 : 260))) * -28).toFixed(2)})`);
      els.ff.forEach((c, i) => {
        c.setAttribute("transform", `translate(${(Math.sin(t / 1300 + i * 2.1) * 14).toFixed(1)} ${(Math.cos(t / 1700 + i) * 10).toFixed(1)})`);
        c.setAttribute("opacity", (0.4 + 0.6 * Math.abs(Math.sin(t / 600 + i))).toFixed(2));
      });
      starKids.forEach((c, i) => { if (i % 3 === 0) c.setAttribute("opacity", (0.45 + 0.55 * Math.abs(Math.sin(t / 900 + i))).toFixed(2)); });
    }
  }

  // ---- frame loop ----
  const subs = new Set<(t: number) => void>();
  function frame(t: number) {
    tl.step(t);
    applyCam();
    renderWorld(t);
    nino.render(t, env.reduced);
    subs.forEach(cb => cb(t));
  }
  let raf = 0, destroyed = false;
  if ((o.clock ?? "raf") === "raf") {
    const t0 = performance.now();
    const loop = () => { if (destroyed) return; frame(performance.now() - t0); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  }
  frame(0);

  // ---- walking ----
  async function walk(route: keyof typeof ROUTES, reverse = false): Promise<void> {
    if (!isIsland) return;
    if (slot === "nest") moveNino("actors");
    const [a, b] = routeEnds(ROUTES[route]);
    const path = q("#route-" + route) as unknown as SVGGeometryElement | null;
    const hasLen = !!path && typeof path.getTotalLength === "function" && typeof path.getPointAtLength === "function";
    let L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    try { if (hasLen) L = path!.getTotalLength(); } catch { /* straight line */ }
    const at = (u: number): [number, number] => {
      if (hasLen) { try { const p = path!.getPointAtLength(u * L); return [p.x, p.y]; } catch { /* fall through */ } }
      return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    };
    const st = nino.st, start = reverse ? at(1) : at(0), end = reverse ? at(0) : at(1);
    if (!reverse && Math.hypot(st.x - end[0], st.y - end[1]) < 20) return;
    const d0 = Math.hypot(start[0] - st.x, start[1] - st.y);
    st.walk = 1;
    if (d0 > 4) {
      st.facing = start[0] < st.x ? -1 : 1;
      await tl.tween(st, { x: start[0], y: start[1] }, d0 / 0.14, "lin", { onUpdate: () => { st.walkPhase = tl.now() / 70; } });
    }
    const k = { u: 0 };
    await tl.tween(k, { u: 1 }, L / 0.13, "sine", {
      onUpdate: e => {
        const [x, y] = at(reverse ? 1 - e : e);
        if (Math.abs(x - st.x) > 0.4) st.facing = x < st.x ? -1 : 1;
        st.x = x; st.y = y; st.walkPhase = tl.now() / 70;
      },
    });
    st.walk = 0; st.facing = 1;
    st.x = end[0]; st.y = end[1];
  }

  return {
    tl, cam, nino, env, fx,
    setViewport(v) { vp = v; lastVB.length = 0; applyCam(); },
    frame,
    screenOf: (x, y) => toScreen(cam, x, y, vp),
    moveNino, walk,
    onFrame(cb) { subs.add(cb); return () => { subs.delete(cb); }; },
    destroy() { destroyed = true; cancelAnimationFrame(raf); tl.cancelAll(); subs.clear(); wrap.remove(); },
  };
}
