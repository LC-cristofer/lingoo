/* NESTOY · Ilha-Ninho prototype: engine (deterministic clock), camera with parallax, journey flows. */
"use strict";
(function () {
  const W = 390, H = 844, BASE = W / 1000;
  const root = document.getElementById("nst");
  const $ = s => root.querySelector(s);
  const CFG = window.NESTOY_CFG || {};
  const SND = CFG.sounds || "sons/";
  const DUR = window.NESTOY_DUR || {};

  /* ---------------- clock, tweens ---------------- */
  const T = { now: 0, film: !!CFG.film };
  let tweens = [], waiters = [], gen = 0;
  const EASE = {
    lin: t => t, io: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, out: t => 1 - Math.pow(1 - t, 3), in: t => t * t * t,
    sine: t => -(Math.cos(Math.PI * t) - 1) / 2, back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    soft: t => 1 - Math.pow(1 - t, 4), cam: t => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  };
  function tween(obj, to, dur, ease = "io", o = {}) {
    return new Promise(res => tweens.push({ obj, to, dur: Math.max(1, dur), ease: EASE[ease] || ease, start: T.now + (o.delay || 0), from: null, res, upd: o.upd, g: gen }));
  }
  const wait = ms => new Promise(res => waiters.push({ at: T.now + ms, res, g: gen }));
  function step(t) {
    T.now = t;
    waiters = waiters.filter(w => { if (w.g !== gen) return false; if (t >= w.at) { w.res(); return false; } return true; });
    tweens = tweens.filter(tw => {
      if (tw.g !== gen && !tw.keep) return false;
      if (t < tw.start) return true;
      if (!tw.from) { tw.from = {}; for (const k in tw.to) tw.from[k] = Array.isArray(tw.obj[k]) ? tw.obj[k].slice() : tw.obj[k]; }
      const p = Math.min(1, (t - tw.start) / tw.dur), e = tw.ease(p);
      for (const k in tw.to) { const a = tw.from[k], b = tw.to[k]; tw.obj[k] = Array.isArray(b) ? b.map((v, i) => a[i] + (v - a[i]) * e) : a + (b - a) * e; }
      if (tw.upd) tw.upd(e);
      if (p >= 1) { tw.res(); return false; }
      return true;
    });
  }
  const alive = g => g === gen;
  function animEl(elm, dur, f, ease = "lin") { const k = { p: 0 }; return tween(k, { p: 1 }, dur, ease, { upd: e => f(elm, e) }); }
  const shake = b => animEl(b, 480, (x, e) => x.style.transform = `translateX(${(Math.sin(e * Math.PI * 5) * (1 - e) * 10).toFixed(2)}px) rotate(${(Math.sin(e * Math.PI * 5) * (1 - e) * 2).toFixed(2)}deg)`);
  const popEl = (b, a = 0.09, d = 380) => animEl(b, d, (x, e) => x.style.transform = `scale(${(1 + Math.sin(e * Math.PI) * a).toFixed(4)})`);
  const riseEl = b => animEl(b, 460, (x, e) => x.style.transform = `translateY(${((1 - e) * 105).toFixed(2)}%)`, "soft");
  const fadeIn = (b, d = 380, dy = 18) => animEl(b, d, (x, e) => { x.style.opacity = e.toFixed(3); x.style.transform = `translateY(${((1 - e) * dy).toFixed(2)}px)`; }, "out");

  /* ---------------- world ---------------- */
  const LAY = buildLayers(CFG.vision ? { letras: "pronto", numeros: "pronto", cores: "pronto", lago: "pronto", threads: 4 } : {});
  const layers = [["Lfar", 2, LAY.far], ["Lmid", 0.8, LAY.mid], ["Lisl", 0, LAY.island], ["Lnear", -0.12, LAY.near]].map(([id, k, html]) => { const el = $("#" + id); el.innerHTML = html; return { el, k }; });
  const isl = $("#Lisl"), lint = $("#Lint");
  lint.innerHTML = `<defs><radialGradient id="glowGrad2"><stop offset="0" stop-color="#FFE7A8" stop-opacity=".95"/><stop offset=".4" stop-color="#FFD27A" stop-opacity=".4"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></radialGradient></defs>` + interiorFarol().replace(/glowGrad/g, "glowGrad2");
  const cam = { X: 500, Y: 789, D: 0.22 }, icam = { X: 500, Y: 2280, D: 0.45 };
  const OVER = { X: 500, Y: 1250, D: 0.9 };
  const NEST_DY = -190;
  const env = { night: 0, blur: 0, interior: 0, veil: 0, farolLevel: 1, reduced: !!CFG.reduced };
  function ppu(D) { return BASE / D; }
  function toScreen(x, y, c = cam) { const p = ppu(c.D); return [(x - c.X) * p + W / 2, (y - c.Y) * p + H / 2]; }
  function applyCam() {
    for (const L of layers) {
      const d = cam.D + L.k; if (d <= 0.02) { L.el.style.visibility = "hidden"; continue; }
      L.el.style.visibility = env.interior >= 1 ? "hidden" : "visible";
      const s = (1 + L.k) / d, p = BASE * s, w = W / p, h = H / p;
      L.el.setAttribute("viewBox", `${(cam.X - w / 2).toFixed(2)} ${(cam.Y - h / 2).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
    }
    const blur = env.reduced ? 0 : Math.max(0, Math.min(3.2, (0.62 - cam.D) * 7));
    layers[0].el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
    layers[1].el.style.filter = blur > 0.05 ? `blur(${(blur * 0.55).toFixed(2)}px)` : "none";
    const ip = ppu(icam.D), iw = W / ip, ih = H / ip;
    lint.setAttribute("viewBox", `${(icam.X - iw / 2).toFixed(2)} ${(icam.Y - ih / 2).toFixed(2)} ${iw.toFixed(2)} ${ih.toFixed(2)}`);
    lint.style.opacity = env.interior.toFixed(3);
    lint.style.visibility = env.interior > 0 ? "visible" : "hidden";
    lint.style.filter = env.blur > 0.05 ? `blur(${env.blur.toFixed(2)}px)` : "none";
    $("#veil").style.opacity = env.veil.toFixed(3);
  }
  /* day → night relighting: one grade over the same world, plus emissive lights */
  const SKY_D = ["#7CC4EE", "#CDEBF8", "#FFEFD9"], SKY_N = ["#0E1640", "#1E2A6B", "#3A3270"];
  const mixHex = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",") + ")"; };
  const q = s => isl.querySelector(s);
  const el = { grade: q("#nightGrade"), lights: q("#lights"), stars: $("#Lfar #stars"), sun: $("#Lfar #sun"), moon: $("#Lfar #moon"), beam: q("#beam"), lamp: q("#farol-lamp"),
    pennants: [...isl.querySelectorAll(".pennant")], boat: q("#barco"), threads: [...isl.querySelectorAll(".thread")], hammer: q(".hammer"), ff: [...isl.querySelectorAll(".ff")],
    sways: [...root.querySelectorAll(".sway")], drifts: [...root.querySelectorAll(".drift")], bobs: [...root.querySelectorAll(".bob")], dangles: [...root.querySelectorAll(".dangle")],
    lanterns: [...root.querySelectorAll(".lantern-swing")], ripples: [...root.querySelectorAll(".ripple")], sprouts: [...isl.querySelectorAll(".sprout")],
    bf: [...isl.querySelectorAll(".bfly")], poolNino: q("#poolNino"),
    stops: [...lint.querySelectorAll(".stop")], bigLamp: lint.querySelector("#bigLamp"), bigGlow: lint.querySelector("#bigLampGlow") };
  const farolGlowDay = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  farolGlowDay.setAttribute("cx", 868); farolGlowDay.setAttribute("cy", 937); farolGlowDay.setAttribute("r", 40); farolGlowDay.setAttribute("fill", "url(#glowGrad)");
  q("#farol").appendChild(farolGlowDay);
  const fx = { pennant: [0, 0, 1, 1, 1].map((v, i) => i < 2 ? 1 : 0), boatX: 120, boatA: 0, thread: [1, 0, 0, 0], hammer: 1, wiggle: {}, lampPulse: 0 };
  function renderWorld(t) {
    const n = env.night, red = env.reduced;
    $("#sky").style.background = `linear-gradient(${mixHex(SKY_D[0], SKY_N[0], n)}, ${mixHex(SKY_D[1], SKY_N[1], n)} 55%, ${mixHex(SKY_D[2], SKY_N[2], n)})`;
    el.grade.setAttribute("opacity", (n * 0.62).toFixed(3));
    el.lights.setAttribute("opacity", n.toFixed(3));
    el.stars.setAttribute("opacity", n.toFixed(3)); el.sun.setAttribute("opacity", (1 - n).toFixed(3)); el.moon.setAttribute("opacity", n.toFixed(3));
    el.beam.setAttribute("opacity", (n * (env.farolLevel >= 2 ? 0.9 : 0.4) * (red ? 1 : 0.75 + 0.25 * Math.sin(t / 900))).toFixed(3));
    const lv = env.farolLevel;
    el.lamp.setAttribute("r", (9 + lv * 2.5 + fx.lampPulse * 6).toFixed(2));
    farolGlowDay.setAttribute("r", (24 + lv * 16 + fx.lampPulse * 30).toFixed(1));
    farolGlowDay.setAttribute("opacity", ((0.25 + lv * 0.22 + fx.lampPulse * 0.4) * (1 - n * 0.5)).toFixed(3));
    el.pennants.forEach((p, i) => { const v = fx.pennant[i]; p.setAttribute("opacity", Math.min(1, v).toFixed(2)); p.setAttribute("transform", v < 1 ? `translate(0 ${((1 - v) * -14).toFixed(1)})` : ""); });
    el.boat.setAttribute("transform", `translate(${(690 + fx.boatX).toFixed(1)} ${(1244 + (red ? 0 : Math.sin(t / 700) * 2)).toFixed(1)}) rotate(${(red ? 0 : Math.sin(t / 900) * 4).toFixed(2)})`);
    el.threads.forEach((p, i) => { const v = fx.thread[i]; p.setAttribute("opacity", v > 0 ? "1" : "0"); p.setAttribute("stroke-dashoffset", ((1 - v) * 160).toFixed(1)); p.setAttribute("stroke-dasharray", v >= 1 ? "9 6" : `${(v * 160).toFixed(1)} 400`); });
    if (!red) {
      el.sways.forEach((g, i) => g.setAttribute("transform", `rotate(${(Math.sin(t / 2100 + i) * 1.1).toFixed(3)})`));
      el.drifts.forEach((g, i) => g.setAttribute("transform", `translate(${(Math.sin(t / 9000 + i * 2) * 26).toFixed(2)} 0)`));
      el.bobs.forEach((g, i) => g.setAttribute("transform", `translate(0 ${(Math.sin(t / 1700 + i) * 6).toFixed(2)})`));
      el.dangles.forEach((g, i) => g.setAttribute("transform", `rotate(${(Math.sin(t / 800 + i * 1.7) * 6).toFixed(2)})`));
      el.lanterns.forEach((g, i) => g.setAttribute("transform", `rotate(${(Math.sin(t / 1300 + i) * 3).toFixed(2)})`));
      el.ripples.forEach(g => g.setAttribute("transform", `translate(${(Math.sin(t / 1100) * 5).toFixed(2)} 0)`));
      if (el.hammer) el.hammer.setAttribute("transform", `rotate(${(fx.hammer * Math.max(0, Math.sin(t / (fx.hammerFast ? 90 : 260))) * -28).toFixed(2)})`);
      el.ff.forEach((c, i) => { c.setAttribute("transform", `translate(${(Math.sin(t / 1300 + i * 2.1) * 14).toFixed(1)} ${(Math.cos(t / 1700 + i) * 10).toFixed(1)})`); c.setAttribute("opacity", (0.4 + 0.6 * Math.abs(Math.sin(t / 600 + i))).toFixed(2)); });
      [...el.stars.children].forEach((c, i) => { if (i % 3 === 0) c.setAttribute("opacity", (0.45 + 0.55 * Math.abs(Math.sin(t / 900 + i))).toFixed(2)); });
    }
    el.bf.forEach((g, i) => {
      const x = 500 + Math.sin(t / 2300 + i * 2.2) * 90 + Math.sin(t / 700 + i) * 22, y = 806 + Math.sin(t / 1900 + i * 1.3) * 40 - Math.abs(Math.sin(t / 420 + i)) * 16;
      g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(1.5)`); g.setAttribute("opacity", (1 - n).toFixed(2));
      const k = red ? 1 : 0.25 + 0.75 * Math.abs(Math.sin(t / 85 + i)); g.firstChild.setAttribute("transform", `scale(${k.toFixed(3)} 1)`); g.children[1].setAttribute("transform", `scale(${k.toFixed(3)} 1)`);
    });
    const inNestNow = nino.el.parentNode && nino.el.parentNode.id === "slotNest";
    el.poolNino.setAttribute("cx", (inNestNow ? 500 : nino.st.x).toFixed(1)); el.poolNino.setAttribute("cy", (inNestNow ? 850 : nino.st.y - 40).toFixed(1));
    el.poolNino.setAttribute("opacity", env.interior >= 1 ? 0 : 1);
    $("#bTime").setAttribute("aria-pressed", n > 0.5 ? "true" : "false");
    el.sprouts.forEach(g => { const w = fx.wiggle[g.parentNode.id] || 0; if (!g._c) { const b = g.getBBox(); g._c = [b.x + b.width / 2, b.y + b.height]; } g.setAttribute("transform", w ? `rotate(${(Math.sin(t / 70) * 4 * w).toFixed(2)} ${g._c[0].toFixed(1)} ${g._c[1].toFixed(1)})` : ""); });
    // interior lamp & stops
    el.bigLamp.setAttribute("opacity", (0.35 + 0.1 * env.farolLevel + fx.lampPulse * 0.5).toFixed(2));
    el.bigGlow.setAttribute("opacity", (0.2 + 0.12 * env.farolLevel + fx.lampPulse * 0.6).toFixed(2));
  }

  /* ---------------- Nino ---------------- */
  const nino = makeNino(isl.querySelector("#slotNest"), { x: 500, y: 1070, s: 0.56 });
  const portrait = makeNino($("#portrait"), { x: 100, y: 222, s: 1 });
  const actNino = makeNino($("#actNino"), { x: 100, y: 222, s: 1 });
  const sheetNino = makeNino($("#sheetNino"), { x: 100, y: 222, s: 1 });
  const rewardNino = makeNino($("#rewardNino"), { x: 100, y: 222, s: 1 });
  const ninos = [nino, portrait, actNino, sheetNino, rewardNino];
  function moveNinoTo(slot) { slot.appendChild(nino.el); nino.render(T.now, env.reduced); }
  function pose(n, p) {
    const P = {
      sleep: { eyes: "closed", mouth: "smile", head: 9, armL: ARM.downL, armR: ARM.downR, pawL: 0, pawR: 0, breathe: 2.2, sy: 1, sx: 1 },
      idle: { eyes: "open", mouth: "smile", head: 0, armL: ARM.downL, armR: ARM.downR, pawL: 0, pawR: 0, breathe: 1, lookX: 0, lookY: 0 },
      happy: { eyes: "happy", mouth: "big", head: 0, armL: ARM.upL, armR: ARM.upR, pawL: 1, pawR: 1 },
      point: { eyes: "open", mouth: "smile", head: 0, armL: ARM.downL, armR: ARM.pointR, pawL: 0, pawR: 1, lookX: 4 },
      help: { eyes: "open", mouth: "soft", head: -6, armL: ARM.downL, armR: ARM.helpR, pawL: 0, pawR: 1, lookX: 0 },
      wave: { eyes: "open", mouth: "big", head: 4, armL: ARM.downL, armR: ARM.waveR, pawL: 0, pawR: 1 },
    }[p];
    const disc = {}, cont = {};
    for (const k in P) (typeof P[k] === "string" ? disc : cont)[k] = Array.isArray(P[k]) ? P[k].slice() : P[k];
    Object.assign(n.st, disc);
    return cont;
  }
  async function setPose(n, p, ms = 280) { const c = pose(n, p); if (ms <= 0 || env.reduced) { Object.assign(n.st, c); return; } return tween(n.st, c, ms, "out"); }
  function allPose(p) { [portrait].forEach(n => setPose(n, p)); }

  /* ---------------- sound ---------------- */
  const audioLog = [];
  const amb = {};
  let soundOn = CFG.sound !== false;
  function sfx(name, vol = 1) {
    if (T.film) { audioLog.push({ t: T.now, name, vol }); return; }
    if (!soundOn) return;
    try { const a = new Audio(SND + name + ".mp3"); a.volume = Math.min(1, vol); a.play().catch(() => { }); } catch (e) { }
  }
  function loop(name, vol, fade = 1200) {
    if (T.film) { audioLog.push({ t: T.now, loop: name, vol, fade }); return; }
    if (!soundOn) return;
    let a = amb[name];
    if (!a) { a = amb[name] = new Audio(SND + name + ".mp3"); a.loop = true; a.volume = 0; }
    a.play().catch(() => { });
    const v0 = a.volume, t0 = performance.now();
    const f = () => { const k = Math.min(1, (performance.now() - t0) / fade); a.volume = v0 + (vol - v0) * k; if (k < 1) requestAnimationFrame(f); else if (vol === 0) a.pause(); };
    f();
  }
  async function say(name, who = [nino, portrait]) {
    const d = (DUR[name] || 2) * 1000;
    sfx(name, 1);
    who.forEach(n => n.st.talking = true);
    await wait(d);
    who.forEach(n => n.st.talking = false);
    await wait(120);
  }

  /* ---------------- UI helpers ---------------- */
  const PLACES = {
    ninho: { x: 500, y: 786, name: "Ninho do Nino", icon: "nest", color: PAL.wood, state: "pronto", sub: "Treino de memória e figurinhas" },
    farol: { x: 876, y: 862, name: "Farol das Línguas", icon: "Hi!", color: PAL.linguas, state: "pronto", sub: "Inglês · Animais da floresta" },
    letras: { x: 240, y: 556, name: "Árvore das Letras", icon: "Aa", color: PAL.letras, state: "obra", sub: "Em construção" },
    numeros: { x: 756, y: 806, name: "Torre dos Números", icon: "123", color: PAL.numerosDark, state: "futuro", sub: "Em breve" },
    cores: { x: 240, y: 1100, name: "Jardim das Cores", icon: "dots", color: PAL.coresDark, state: "futuro", sub: "Em breve" },
    lago: { x: 640, y: 1306, name: "Lago das Descobertas", icon: "boat", color: PAL.mundoDark, state: "futuro", sub: "Em breve" },
  };
  const pinsEl = $("#pins");
  const pinIcon = p => p.icon === "nest" ? `<svg viewBox="0 0 640 600"><use href="#nest-o"/></svg>` : p.icon === "dots" ? `<svg viewBox="0 0 30 12" width="26"><circle cx="5" cy="6" r="4.5" fill="#FF7A5C"/><circle cx="15" cy="6" r="4.5" fill="#FFC94A"/><circle cx="25" cy="6" r="4.5" fill="#2E9FD8"/></svg>` : p.icon === "boat" ? `<svg viewBox="0 0 24 24" width="22"><path d="M3 15h18l-3 4H6z" fill="#C98A4B"/><path d="M12 3v11M12 4l6 9h-6z" fill="#FF7A5C" stroke="#3A2618" stroke-width="1.2"/></svg>` : `<b>${p.icon}</b>`;
  const badge = s => s === "obra" ? `<i class="pb obra"><svg viewBox="0 0 20 20"><path d="M5 15l7-7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><rect x="10" y="3" width="7" height="5" rx="1" fill="#fff" transform="rotate(45 13.5 5.5)"/></svg></i>` : s === "futuro" ? `<i class="pb futuro"><svg viewBox="0 0 20 20"><path d="M10 17V9" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="6.5" cy="8" rx="4" ry="2.4" fill="#fff" transform="rotate(-25 6.5 8)"/><ellipse cx="13.5" cy="7" rx="4" ry="2.4" fill="#fff" transform="rotate(25 13.5 7)"/></svg></i>` : "";
  if (CFG.vision) for (const id in PLACES) PLACES[id].state = "pronto";
  for (const id in PLACES) { const p = PLACES[id]; pinsEl.insertAdjacentHTML("beforeend", `<button class="pin ${p.state}" data-id="${id}" style="--c:${p.color}" aria-label="${p.name}"><span class="med">${pinIcon(p)}${badge(p.state)}</span></button>`); p.pin = pinsEl.lastElementChild; p.show = 0; p.glow = 0; }
  const stopBtns = FAROL_STOPS.map((s, i) => { $("#stopHits").insertAdjacentHTML("beforeend", `<button class="stopHit" data-i="${i}" aria-label="${s.label}"></button>`); return $("#stopHits").lastElementChild; });
  const ui = { top: 0, card: 0, logo: 0, skip: 0, pins: 0, stopHits: 0 };
  function renderUI(t) {
    for (const id in PLACES) {
      const p = PLACES[id], [sx, sy] = toScreen(p.x, p.y), v = p.show * ui.pins;
      p.pin.style.transform = `translate(${(sx - 32).toFixed(1)}px, ${(sy - 32).toFixed(1)}px) scale(${(0.4 + 0.6 * Math.min(1, v)).toFixed(3)})`;
      const glow = p.glow * (env.reduced ? 0.7 : 0.45 + 0.35 * Math.sin(t / 380));
      p.pin.firstChild.style.boxShadow = glow > 0.05 ? `0 0 0 ${(4 + glow * 7).toFixed(1)}px rgba(255,214,120,${(glow * 0.9).toFixed(2)}), 0 4px 10px rgba(58,38,24,.25)` : "";
      p.pin.style.opacity = Math.min(1, v).toFixed(3);
      p.pin.style.pointerEvents = v > 0.5 && env.interior < 0.5 ? "auto" : "none";
    }
    $("#topbar").style.opacity = ui.top.toFixed(3); $("#topbar").style.transform = `translateY(${((1 - ui.top) * -16).toFixed(1)}px)`; $("#topbar").style.pointerEvents = ui.top > 0.5 ? "auto" : "none";
    $("#card").style.opacity = ui.card.toFixed(3); $("#card").style.transform = `translateY(${((1 - ui.card) * 40).toFixed(1)}px)`; $("#card").style.pointerEvents = ui.card > 0.5 ? "auto" : "none";
    $("#logo").style.opacity = ui.logo.toFixed(3); $("#logo").style.transform = `translateY(${((1 - ui.logo) * -24).toFixed(1)}px)`;
    $("#skip").style.opacity = ui.skip.toFixed(3); $("#skip").style.pointerEvents = ui.skip > 0.5 ? "auto" : "none";
    stopBtns.forEach((b, i) => { const s = FAROL_STOPS[i], [sx, sy] = toScreen(s.x, s.y - 18, icam); const r = 50 * ppu(icam.D); b.style.transform = `translate(${(sx - r).toFixed(1)}px, ${(sy - r).toFixed(1)}px)`; b.style.width = b.style.height = (2 * r).toFixed(1) + "px"; b.style.pointerEvents = ui.stopHits > 0.5 ? "auto" : "none"; });
  }
  function card({ title = "", text = "", btn = null, chip = "", tone = "" }) {
    $("#cardTitle").textContent = title; $("#cardText").textContent = text;
    const c = $("#cardChip"); c.textContent = chip; c.hidden = !chip; c.className = "chip " + tone;
    const b = $("#cardBtn"); b.hidden = !btn; if (btn) { b.dataset.act = btn.act; b.setAttribute("aria-label", btn.label); b.className = "cardBtn " + (btn.cls || ""); b.innerHTML = btn.act === "pause" ? '<svg viewBox="0 0 20 20"><rect x="5" y="4" width="3.6" height="12" rx="1.5" fill="#fff"/><rect x="11.4" y="4" width="3.6" height="12" rx="1.5" fill="#fff"/></svg>' : '<svg viewBox="0 0 20 20"><path d="M6 3.5l11 6.5-11 6.5z" fill="#fff"/></svg>'; }
  }
  let hintFlash = 0;
  const touches = [];
  function touch(x, y) { const d = document.createElement("i"); d.className = "tap"; d.style.left = x + "px"; d.style.top = y + "px"; $("#touches").appendChild(d); touches.push({ d, t0: T.now }); }
  function renderTouches(t) { for (let i = touches.length - 1; i >= 0; i--) { const o = touches[i], k = (t - o.t0) / 650; if (k >= 1 || k < 0) { o.d.remove(); touches.splice(i, 1); continue; } o.d.style.transform = `translate(-50%,-50%) scale(${(0.5 + k * 0.9).toFixed(3)})`; o.d.style.opacity = (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85).toFixed(3); } }

  /* ---------------- flows ---------------- */
  let scene = "opening", busy = false, focus = null, visits = CFG.visits || 0;
  const nestPos = { x: 500, y: 1070 }, nestFrontPos = { x: 578, y: 930 }; // nestPos is in the nest's local space (world y = local + NEST_DY)
  const NS = 0.45; // Nino's scale on the island

  function resetWorld() {
    gen++; tweens = []; waiters = [];
    Object.assign(env, { night: CFG.night ? 1 : 0, blur: 0, interior: 0, veil: 0, farolLevel: 1 });
    Object.assign(fx, { pennant: [1, 1, 0, 0, 0], boatX: 120, thread: [1, 0, 0, 0], lampPulse: 0, hammerFast: false, wiggle: {} });
    Object.assign(ui, { top: 0, card: 0, logo: 0, skip: 0, pins: 0, stopHits: 0 });
    for (const id in PLACES) { PLACES[id].show = 0; PLACES[id].glow = 0; }
    ["#activity", "#reward", "#sheet", "#parents", "#pauseScr"].forEach(s => $(s).hidden = true);
    $("#fade").style.opacity = 0;
    moveNinoTo(isl.querySelector("#slotNest"));
    Object.assign(nino.st, { x: nestPos.x, y: nestPos.y, s: 0.56, facing: 1, lift: 0, alpha: 1, walk: 0, talking: false, earR: 0, earL: 0, lookX: 0, lookY: 0 });
    pose(nino, "idle"); Object.assign(nino.st, { armL: ARM.downL.slice(), armR: ARM.downR.slice(), pawL: 0, pawR: 0, head: 0, sx: 1, sy: 1, blink: 0 });
    Object.assign(portrait.st, pose(portrait, "idle"));
    stopsState(1); focus = null; busy = false; touches.length = 0;
  }
  function stopsState(cur) {
    el.stops.forEach((g, i) => {
      g.querySelector(".stop-done").setAttribute("opacity", i < cur ? 1 : 0);
      g.querySelector(".stop-halo").setAttribute("opacity", i === cur ? 1 : 0);
      g.querySelector(".stop-icon").setAttribute("opacity", i <= cur ? 1 : 0.35);
      g.querySelector(".stop-face").setAttribute("fill", i <= cur ? PAL.cream : "#E3DACB");
    });
  }

  async function openingFull() {
    const g = gen; scene = "opening"; busy = true;
    Object.assign(cam, { X: 500, Y: 789, D: 0.22 }); pose(nino, "sleep"); Object.assign(nino.st, pose(nino, "sleep"));
    loop("amb_dia", 0.55, 1500);
    tween(ui, { logo: 1 }, 1400, "out", { delay: 500 }); tween(ui, { skip: 1 }, 500, "out", { delay: 1200 });
    await Promise.race([wait(2600), new Promise(r => wakeEarly = r)]); wakeEarly = null; if (!alive(g)) return;
    // wake up: ear twitch, eyes open, double blink, yawn and stretch, look at the child, wave
    await tween(nino.st, { earR: -16 }, 140, "out"); await tween(nino.st, { earR: 0 }, 220, "back"); if (!alive(g)) return;
    await wait(250); await tween(nino.st, { earL: -12, earR: -10 }, 140, "out"); tween(nino.st, { earL: 0, earR: 0 }, 260, "back");
    nino.st.eyes = "open"; nino.st.blink = 1; await tween(nino.st, { blink: 0, head: 4, breathe: 1 }, 420, "out"); if (!alive(g)) return;
    await wait(200); await tween(nino.st, { blink: 1 }, 70, "lin"); await tween(nino.st, { blink: 0 }, 110, "out"); await tween(nino.st, { blink: 1 }, 70, "lin"); await tween(nino.st, { blink: 0 }, 120, "out");
    await wait(240); if (!alive(g)) return;
    sfx("yawn", 0.9); nino.st.mouth = "yawn"; nino.st.eyes = "happy";
    tween(nino.st, { armL: ARM.stretchL, armR: ARM.stretchR, pawL: 1, pawR: 1, sy: 1.08, sx: 0.95, head: 0 }, 620, "out", { delay: 120 });
    await wait(400); sfx("stretch", 0.7); await wait(700); if (!alive(g)) return;
    await tween(nino.st, { armL: ARM.downL, armR: ARM.downR, pawL: 0, pawR: 0, sy: 0.96, sx: 1.03 }, 320, "io");
    nino.st.mouth = "smile"; nino.st.eyes = "open"; await tween(nino.st, { sy: 1, sx: 1, lookY: 2, head: 5 }, 260, "back"); if (!alive(g)) return;
    await wait(250);
    // "Oi! Eu sou o Nino." with a wave
    nino.st.mouth = "big"; tween(nino.st, { armR: ARM.waveR, pawR: 1 }, 260, "out");
    const waving = (async () => { for (let i = 0; i < 4 && alive(g); i++) { await tween(nino.st, { armR: ARM.upR }, 200, "sine"); await tween(nino.st, { armR: ARM.waveR }, 200, "sine"); } })();
    await say("v_oi", [nino]); await waving; if (!alive(g)) return;
    tween(ui, { logo: 0, skip: 0 }, 600, "io");
    // hop out of the nest and invite the child; the camera starts to pull back while he lands
    await tween(nino.st, { armR: ARM.downR, pawR: 0, sy: 0.9, sx: 1.08 }, 180, "out"); nino.st.mouth = "smile";
    nino.st.y += NEST_DY; moveNinoTo(isl.querySelector("#slotActors")); sfx("pop", 0.6);
    const hop = tween(nino.st, { x: nestFrontPos.x, y: nestFrontPos.y, sy: 1, sx: 1, s: NS }, 620, "io", { upd: e => nino.st.lift = Math.sin(e * Math.PI) * 46 });
    revealIsland(4800, g);
    await hop; await tween(nino.st, { sy: 0.9, sx: 1.08 }, 90, "out"); await tween(nino.st, { sy: 1, sx: 1 }, 220, "back"); if (!alive(g)) return;
    tween(nino.st, pose(nino, "point"), 300, "out");
    await say("v_vem", [nino]); if (!alive(g)) return;
    await setPose(nino, "idle", 300);
  }
  let wakeEarly = null;
  async function revealIsland(dur, g) {
    sfx("reveal", 0.9);
    const from = { X: cam.X, Y: cam.Y, D: cam.D }, to = OVER, lf = Math.log(from.D), lt = Math.log(to.D);
    const k = { p: 0 };
    const order = ["ninho", "letras", "numeros", "cores", "lago", "farol"];
    order.forEach((id, i) => wait(dur * 0.42 + i * 260).then(() => {
      if (!alive(g)) return; sfx("pop", 0.35); tween(PLACES[id], { show: 1 }, 420, "back");
      if (id === "farol") tween(fx, { lampPulse: 1 }, 200, "out").then(() => tween(fx, { lampPulse: 0 }, 700, "io"));
      if (id === "letras") { fx.hammerFast = true; wait(700).then(() => fx.hammerFast = false); }
      if (id === "numeros" || id === "cores" || id === "lago") { fx.wiggle[id] = 1; wait(500).then(() => fx.wiggle[id] = 0); }
    }));
    tween(ui, { pins: 1 }, 10, "lin");
    await tween(k, { p: 1 }, dur, "cam", { upd: e => { cam.D = Math.exp(lf + (lt - lf) * e); const ey = EASE.soft(Math.min(1, e * 1.15)); cam.X = from.X + (to.X - from.X) * ey; cam.Y = from.Y + (to.Y - from.Y) * ey - Math.sin(e * Math.PI) * 60; } });
    if (!alive(g)) return;
    arrive(g);
  }
  function arrive(g) {
    scene = "island"; busy = false;
    loop("trail", 0.32, 2500); loop("amb_dia", 0.35, 2000);
    PLACES.farol.glow = 1;
    card({ title: "Vamos explorar?", text: "Toque num lugar da ilha.", chip: "" });
    tween(ui, { top: 1, card: 1 }, 520, "out");
  }
  async function openingShort() {
    const g = gen; scene = "opening"; busy = true;
    Object.assign(cam, { X: 500, Y: 800, D: 0.3 }); Object.assign(nino.st, pose(nino, "idle"));
    loop("amb_dia", 0.5, 600);
    nino.st.mouth = "big"; tween(nino.st, { armR: ARM.waveR, pawR: 1 }, 220, "out");
    sfx("e_hello", 1); nino.st.talking = true;
    for (let i = 0; i < 2; i++) { await tween(nino.st, { armR: ARM.upR }, 180, "sine"); await tween(nino.st, { armR: ARM.waveR }, 180, "sine"); }
    nino.st.talking = false; if (!alive(g)) return;
    tween(nino.st, { armR: ARM.downR, pawR: 0 }, 200, "out"); nino.st.mouth = "smile";
    nino.st.y += NEST_DY; moveNinoTo(isl.querySelector("#slotActors"));
    tween(nino.st, { x: nestFrontPos.x, y: nestFrontPos.y, s: NS }, 500, "io", { upd: e => nino.st.lift = Math.sin(e * Math.PI) * 40 });
    for (const id in PLACES) tween(PLACES[id], { show: 1 }, 400, "back", { delay: 900 });
    await revealIsland(1700, g);
  }
  function openingReduced() {
    scene = "island"; Object.assign(cam, OVER); moveNinoTo(isl.querySelector("#slotActors")); Object.assign(nino.st, { x: nestFrontPos.x, y: nestFrontPos.y, s: NS });
    for (const id in PLACES) PLACES[id].show = 1;
    ui.pins = 1; $("#fade").style.opacity = 1; tween({ v: 1 }, { v: 0 }, 400, "lin", { upd: e => $("#fade").style.opacity = 1 - e });
    arrive(gen);
  }
  function skipOpening() {
    if (scene !== "opening") return;
    gen++; tweens = []; waiters = [];
    Object.assign(nino.st, pose(nino, "idle")); Object.assign(nino.st, { blink: 0, sy: 1, sx: 1, lift: 0, talking: false });
    ui.logo = 0; ui.skip = 0;
    openingReduced();
  }

  async function overview() {
    if (focus === null) return; focus = null;
    for (const id in PLACES) PLACES[id].glow = id === (env.farolLevel >= 2 ? "ninho" : "farol") ? 1 : 0;
    card({ title: "Vamos explorar?", text: "Toque num lugar da ilha." });
    await tween(cam, OVER, 900, "io");
  }
  async function focusPlace(id) {
    if (busy || scene !== "island") return; const g = gen; const p = PLACES[id]; focus = id; busy = true;
    for (const k in PLACES) PLACES[k].glow = k === id ? 1 : 0;
    sfx("tap", 0.6);
    const target = { X: 500 + (p.x - 500) * 0.7, Y: p.y + 230, D: 0.55 };
    if (id === "farol") {
      card({ title: p.name, text: p.sub, chip: "Pronto", tone: "ok" });
      tween(cam, target, 1100, "io");
      await walkTo("farol", g); if (!alive(g)) return;
      sfx("bell", 0.8); tween(fx, { lampPulse: 1 }, 220, "out").then(() => tween(fx, { lampPulse: 0 }, 900, "io"));
      setPose(nino, "point"); setPose(portrait, "point");
      card({ title: p.name, text: "Inglês · Unidade 1: Animais da floresta", chip: "Pronto", tone: "ok", btn: { act: "enter", label: "Entrar no farol" } });
      await say("v_farol"); setPose(nino, "idle"); setPose(portrait, "idle");
    } else if (id === "letras") {
      card({ title: p.name, text: "Os construtores estão trabalhando aqui.", chip: "Em construção", tone: "obra" });
      tween(cam, target, 1000, "io"); fx.hammerFast = true; sfx("obra", 0.9);
      setPose(portrait, "help"); await say("v_obra", [portrait]); fx.hammerFast = false; setPose(portrait, "idle");
    } else if (id === "ninho") {
      card({ title: p.name, text: "Aqui ficam as figurinhas e o Treino de memória.", chip: "Pronto", tone: "ok" });
      tween(cam, { X: 500, Y: 960, D: 0.42 }, 1000, "io"); sfx("thread", 0.7); setPose(portrait, "happy"); await wait(900); setPose(portrait, "idle");
    } else {
      card({ title: p.name, text: "Um lugar novo vai nascer aqui.", chip: "Em breve", tone: "futuro" });
      tween(cam, target, 1000, "io"); fx.wiggle[id] = 1; sfx("leaves", 0.8);
      await say("e_chegando", [portrait]); fx.wiggle[id] = 0;
    }
    busy = false;
  }
  async function walkTo(route, g, reverse = false) {
    const path = isl.querySelector("#route-" + route), L = path.getTotalLength();
    const startP = reverse ? path.getPointAtLength(L) : path.getPointAtLength(0);
    if (!reverse && Math.hypot(nino.st.x - path.getPointAtLength(L).x, nino.st.y - path.getPointAtLength(L).y) < 20) return;
    // walk from wherever he stands to the start of the route
    const d0 = Math.hypot(startP.x - nino.st.x, startP.y - nino.st.y);
    sfx("steps", 0.7); nino.st.walk = 1;
    if (d0 > 4) { nino.st.facing = startP.x < nino.st.x ? -1 : 1; await tween(nino.st, { x: startP.x, y: startP.y }, d0 / 0.14, "lin", { upd: () => nino.st.walkPhase = T.now / 70 }); }
    if (!alive(g)) return;
    const k = { u: 0 }; let last = 0;
    await tween(k, { u: 1 }, L / 0.13, "sine", {
      upd: e => { const pt = path.getPointAtLength((reverse ? 1 - e : e) * L); if (Math.abs(pt.x - nino.st.x) > 0.4) nino.st.facing = pt.x < nino.st.x ? -1 : 1; nino.st.x = pt.x; nino.st.y = pt.y; nino.st.walkPhase = T.now / 70; if (T.now - last > 1000) { last = T.now; sfx("steps", 0.55); } } });
    nino.st.walk = 0; nino.st.facing = 1;
  }

  async function enterFarol() {
    if (busy) return; const g = gen; busy = true; scene = "toInterior";
    sfx("dive", 0.9); tween(ui, { card: 0, pins: 0, top: 0 }, 300, "io");
    loop("trail", 0.12, 800);
    const dur = env.reduced ? 10 : 1000;
    tween(nino.st, { alpha: 0 }, 300, "io", { delay: 200 });
    await tween(cam, { X: 862, Y: 1136, D: 0.035 }, dur, "in", { upd: e => $("#fade").style.opacity = Math.max(0, (e - 0.7) / 0.3) }); if (!alive(g)) return;
    env.interior = 1; Object.assign(icam, { X: 500, Y: 2250, D: 0.5 });
    stopsState(1);
    Object.assign(nino.st, { x: 500, y: 2390, s: 0.62, alpha: 1, facing: 1 }); moveNinoTo(lint.querySelector("#slotInterior"));
    await tween({ v: 1 }, { v: 0 }, 260, "lin", { upd: e => $("#fade").style.opacity = 1 - e }); if (!alive(g)) return;
    scene = "interior";
    const camGo = tween(icam, { X: 560, Y: 2010, D: 0.66 }, env.reduced ? 10 : 1700, "cam");
    await wait(500); nino.st.walk = 1; sfx("steps", 0.6);
    await tween(nino.st, { x: 548, y: 1966 }, 1300, "io", { upd: () => { nino.st.walkPhase = T.now / 70; } }); nino.st.walk = 0;
    await camGo; if (!alive(g)) return;
    card({ title: "Farol das Línguas", text: "Suba a escada: cada degrau é uma parada.", chip: "1 de 6", tone: "ok" });
    tween(ui, { card: 1, stopHits: 1 }, 400, "out");
    setPose(nino, "point"); setPose(portrait, "point");
    await say("v_subir"); setPose(nino, "idle"); setPose(portrait, "idle");
    busy = false;
  }
  async function startActivity() {
    if (busy) return; const g = gen; busy = true; scene = "activity";
    sfx("tap", 0.6); tween(ui, { card: 0, stopHits: 0 }, 250, "io");
    await tween(icam, { X: 640, Y: 1940, D: 0.5 }, 500, "io");
    tween(env, { blur: 6, veil: 1 }, 400, "io");
    const A = $("#activity"); A.hidden = false; A.querySelectorAll(".ans").forEach(b => { b.className = "ans"; b.disabled = false; });
    $("#actSay").innerHTML = 'Qual é o <em>bear</em>? Toque nele!';
    A.querySelectorAll(".ans").forEach(b => b.style.transform = ""); fadeIn(A, 420, 24);
    Object.assign(actNino.st, pose(actNino, "idle"));
    await wait(350); await say("e_prompt", [actNino]);
    busy = false;
  }
  async function answer(id) {
    if (busy || scene !== "activity") return; const g = gen; busy = true;
    const b = $(`#activity .ans[data-id="${id}"]`);
    if (id === "bird") {
      shake(b); sfx("retry", 0.8);
      setPose(actNino, "help"); $("#actSay").textContent = "Opa! Vamos tentar de novo.";
      await say("e_opa", [actNino]); if (!alive(g)) return;
      $("#actSay").innerHTML = 'Qual é o <em>bear</em>? Toque nele!'; setPose(actNino, "idle");
      busy = false;
    } else {
      b.classList.add("ok"); popEl(b); sfx("correct", 0.9); $(`#activity .ans[data-id="bird"]`).classList.add("dim");
      $("#activity").querySelectorAll(".ans").forEach(x => x.disabled = true);
      setPose(actNino, "happy");
      const S = $("#sheet"); S.hidden = false; S.style.transform = "translateY(105%)"; riseEl(S);
      Object.assign(sheetNino.st, pose(sheetNino, "happy"));
      tween(sheetNino.st, { lift: 26, sy: 1.05 }, 220, "out").then(() => tween(sheetNino.st, { lift: 0, sy: 1 }, 320, "back"));
      $(".lampbar i:nth-child(2)").classList.add("on");
      await say("e_awesome", [sheetNino, actNino]);
      busy = false;
    }
  }
  async function reward() {
    if (busy) return; const g = gen; busy = true; scene = "reward";
    sfx("tap", 0.6); $("#sheet").hidden = true; $("#activity").hidden = true;
    const R = $("#reward"); R.hidden = false; fadeIn(R, 360, 0);
    const star = $("#rwStar"), stk = $("#rwSticker");
    star.style.transform = "scale(0)"; stk.style.transform = "scale(0) rotate(-30deg)";
    animEl(star, 620, (x, e) => x.style.transform = `scale(${e.toFixed(3)}) rotate(${((1 - e) * -40).toFixed(1)}deg)`, "back");
    animEl(stk, 700, (x, e) => x.style.transform = `scale(${e.toFixed(3)}) rotate(${(-30 + e * 22).toFixed(1)}deg)`, "back").then(() => {});
    Object.assign(rewardNino.st, pose(rewardNino, "happy"));
    await wait(250); sfx("star", 0.9);
    tween(rewardNino.st, { lift: 30 }, 260, "out").then(() => tween(rewardNino.st, { lift: 0 }, 360, "back"));
    await wait(500); await say("e_estrela", [rewardNino]);
    busy = false;
  }
  async function backOutside() {
    if (busy) return; const g = gen; busy = true; scene = "outside";
    sfx("whoosh" in DUR ? "whoosh" : "dive", 0.7);
    $("#fade").style.opacity = 0; await tween({ v: 0 }, { v: 1 }, 300, "lin", { upd: e => $("#fade").style.opacity = e }); if (!alive(g)) return;
    $("#reward").hidden = true; env.interior = 0; env.blur = 0; env.veil = 0;
    Object.assign(nino.st, { x: 828, y: 1158, s: NS, alpha: 1, facing: -1 }); moveNinoTo(isl.querySelector("#slotActors"));
    Object.assign(cam, { X: 790, Y: 1080, D: 0.36 });
    await tween({ v: 1 }, { v: 0 }, 350, "lin", { upd: e => $("#fade").style.opacity = 1 - e }); if (!alive(g)) return;
    // the place transforms: the lamp grows brighter, new pennants, a boat arrives
    loop("trail", 0.3, 1500);
    await wait(300); sfx("grow", 0.9);
    env.farolLevel = 2; tween(fx, { lampPulse: 1 }, 400, "out").then(() => tween(fx, { lampPulse: 0 }, 1400, "io"));
    tween(fx.pennant, { 2: 1 }, 380, "back", { delay: 300 }); tween(fx.pennant, { 3: 1 }, 380, "back", { delay: 520 });
    sfx("water", 0.6); tween(fx, { boatX: -20 }, 2600, "soft", { delay: 200 });
    setPose(nino, "happy"); tween(nino.st, { lift: 18 }, 200, "out").then(() => tween(nino.st, { lift: 0 }, 300, "back"));
    await wait(500); await say("v_brilhou"); if (!alive(g)) return;
    setPose(nino, "idle");
    // back to the whole island while Nino walks home; a new thread is woven into the nest
    tween(cam, OVER, 2000, "io");
    await walkTo("farol", g, true); if (!alive(g)) return;
    nino.st.facing = 1;
    PLACES.ninho.glow = 1; PLACES.farol.glow = 0;
    sfx("thread", 0.9); await tween(fx.thread, { 1: 1 }, 1200, "io");
    tween(ui, { top: 1, pins: 1 }, 400, "out");
    setPose(portrait, "happy"); card({ title: "Ninho do Nino", text: "A figurinha do urso foi guardada aqui.", chip: "Novo fio no ninho", tone: "ok" }); tween(ui, { card: 1 }, 400, "out");
    await say("v_ninho"); setPose(portrait, "idle");
    scene = "island"; focus = "ninho"; busy = false;
  }
  async function bedtime() {
    if (busy && scene !== "island") return; const g = gen; busy = true;
    $("#parents").hidden = true;
    sfx("night", 0.8); loop("trail", 0, 2500); loop("amb_dia", 0, 2600); loop("amb_noite", 0.5, 2600);
    card({ title: "Hora de dormir", text: "A rotina foi combinada pelos responsáveis.", chip: "19:30", tone: "noite" }); tween(ui, { card: 1, top: 1 }, 300, "out");
    tween(ui, { pins: 0 }, 600, "io"); tween(cam, { X: 500, Y: 980, D: 0.6 }, 3000, "io");
    await tween(env, { night: 1 }, env.reduced ? 300 : 3000, "io"); if (!alive(g)) return;
    sfx("yawn", 0.8); nino.st.mouth = "yawn"; nino.st.eyes = "happy"; await tween(nino.st, { armL: ARM.stretchL, armR: ARM.stretchR, pawL: 1, pawR: 1, sy: 1.06 }, 500, "out");
    await wait(500); await tween(nino.st, { armL: ARM.downL, armR: ARM.downR, pawL: 0, pawR: 0, sy: 1 }, 300, "io"); nino.st.mouth = "smile"; nino.st.eyes = "open";
    if (Math.hypot(nino.st.x - nestFrontPos.x, nino.st.y - nestFrontPos.y) > 10) { nino.st.walk = 1; nino.st.facing = nestFrontPos.x < nino.st.x ? -1 : 1; await tween(nino.st, { x: nestFrontPos.x, y: nestFrontPos.y }, 900, "io", { upd: () => nino.st.walkPhase = T.now / 70 }); nino.st.walk = 0; }
    nino.st.facing = -1; await tween(nino.st, { sy: 0.9, sx: 1.08 }, 140, "out");
    const fx0 = nino.st.x, fy0 = nino.st.y; let inNest = false; nino.st.sy = 1; nino.st.sx = 1;
    await tween({ e: 0 }, { e: 1 }, 640, "io", { upd: e => { const yw = fy0 + (nestPos.y + NEST_DY - fy0) * e; nino.st.x = fx0 + (nestPos.x - fx0) * e; nino.st.lift = Math.sin(e * Math.PI) * 44; nino.st.s = NS + (0.56 - NS) * e; nino.st.y = e > 0.5 ? yw - NEST_DY : yw; if (e > 0.5 && !inNest) { inNest = true; moveNinoTo(isl.querySelector("#slotNest")); } } });
    nino.st.facing = 1;
    await tween(cam, { X: 500, Y: 800, D: 0.3 }, 1600, "io");
    setPose(portrait, "idle");
    await say("v_noite", [nino, portrait]); if (!alive(g)) return;
    Object.assign(nino.st, { eyes: "closed" }); tween(nino.st, { head: 9, breathe: 2.2 }, 700, "io"); $("#zz").classList.add("on");
    busy = false; scene = "sleep";
  }
  async function pauseReminder() {
    if (scene !== "island" || busy) return; busy = true;
    $("#parents").hidden = true;
    setPose(portrait, "idle"); card({ title: "Que tal uma pausa?", text: "Você brincou bastante hoje.", chip: "Lembrete de 20 min", tone: "noite", btn: { act: "pause", label: "Pausar" } });
    tween(ui, { card: 1 }, 300, "out");
    sfx("stretch", 0.5); portrait.st.mouth = "yawn"; portrait.st.eyes = "happy"; await tween(portrait.st, { armL: ARM.stretchL, armR: ARM.stretchR, pawL: 1, pawR: 1 }, 420, "out");
    await wait(300); await tween(portrait.st, { armL: ARM.downL, armR: ARM.downR, pawL: 0, pawR: 0 }, 300, "io"); portrait.st.mouth = "smile"; portrait.st.eyes = "open";
    await say("v_pausa", [portrait]);
    busy = false;
  }

  /* ---------------- input ---------------- */
  root.addEventListener("click", ev => {
    const t = ev.target.closest("button");
    const r = root.getBoundingClientRect(), k = r.width / W;
    if (!T.film) touch((ev.clientX - r.left) / k, (ev.clientY - r.top) / k);
    if (scene === "opening" && !t) { if (wakeEarly) wakeEarly(); return; }
    if (!t) { if (scene === "island" && !busy) overview(); return; }
    if (t.id === "skip") return skipOpening();
    if (t.classList.contains("pin")) return focusPlace(t.dataset.id);
    if (t.classList.contains("stopHit")) { if (+t.dataset.i === 1) startActivity(); else { sfx("tap", 0.4); setPose(portrait, "help"); card({ title: FAROL_STOPS[+t.dataset.i].label, text: +t.dataset.i === 0 ? "Você já fez essa parada." : "Primeiro a parada que está brilhando!", chip: "1 de 6", tone: "ok" }); } return; }
    if (t.classList.contains("ans")) return answer(t.dataset.id);
    if (t.id === "cardBtn") { const a = t.dataset.act; if (a === "enter") return enterFarol(); if (a === "pause") return doPause(); }
    if (t.id === "sheetBtn") return reward();
    if (t.id === "rewardBtn") return backOutside();
    if (t.id === "actClose") { $("#activity").hidden = true; tween(env, { blur: 0, veil: 0 }, 300, "io"); scene = "interior"; tween(ui, { card: 1, stopHits: 1 }, 300, "out"); return; }
    if (t.id === "bParents") { $("#parents").hidden = false; return; }
    if (t.id === "parentsClose") { $("#parents").hidden = true; return; }
    if (t.id === "bTime") { const goNight = env.night < 0.5; sfx("night", 0.5); loop(goNight ? "amb_noite" : "amb_dia", 0.45, 1500); loop(goNight ? "amb_dia" : "amb_noite", 0, 1500); tween(env, { night: goNight ? 1 : 0 }, env.reduced ? 200 : 2200, "io"); $("#bTime").setAttribute("aria-pressed", goNight); return; }
    if (t.id === "bNest") return focusPlace("ninho");
    if (t.id === "pauseBack") { $("#pauseScr").hidden = true; scene = "island"; busy = false; setPose(portrait, "wave"); card({ title: "Oi de novo!", text: "Vamos continuar?" }); return; }
    if (t.dataset.pset) { const [k, v] = t.dataset.pset.split(":"); t.parentNode.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b === t)); if (k === "amb" && v === "noite") bedtimeOrNight(); if (k === "amb" && v === "dia") tween(env, { night: 0 }, 1200, "io"); if (k === "mov") env.reduced = v === "on"; return; }
  });
  function bedtimeOrNight() { tween(env, { night: 1 }, 1500, "io"); }
  async function doPause() { busy = true; sfx("tap", 0.5); tween(ui, { card: 0 }, 250, "io"); $("#pauseScr").hidden = false; scene = "pause"; }

  /* ---------------- main loop ---------------- */
  function frame(t) {
    step(t);
    applyCam(); renderWorld(t); renderUI(t); renderTouches(t);
    const red = env.reduced;
    ninos.forEach(n => n.render(t, red));
  }
  function render(t) { applyCam(); renderWorld(t); renderUI(t); renderTouches(t); ninos.forEach(n => n.render(t, env.reduced)); }
  function preview() { Object.assign(nino.st, pose(nino, "sleep")); Object.assign(cam, { X: 500, Y: 789, D: 0.22 }); ui.logo = 1; }
  const api = { preview, render, state: () => ({ scene, busy }), openParents: v => $("#parents").hidden = !v, pressSeg: sel => { const b = $(sel); b.parentNode.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); }, rectOf: sel => { const r = $(sel).getBoundingClientRect(), R = root.getBoundingClientRect(), k = R.width / W; return [(r.left + r.width / 2 - R.left) / k, (r.top + r.height / 2 - R.top) / k]; }, frame, T, audioLog, start, openingFull, openingShort, openingReduced, focusPlace, enterFarol, startActivity, answer, reward, backOutside, bedtime, pauseReminder, skipOpening,
    screenOf: id => toScreen(PLACES[id].x, PLACES[id].y), stopScreen: i => toScreen(FAROL_STOPS[i].x, FAROL_STOPS[i].y - 18, icam), touch, env, cam, wait, setSound: v => { soundOn = v; if (!v) Object.values(amb).forEach(a => a.pause()); } };
  window.NESTOY = api;
  function start(mode = "full") {
    resetWorld();
    $("#zz").classList.remove("on");
    if (env.reduced || mode === "reduced") return openingReduced();
    if (mode === "short") return openingShort();
    return openingFull();
  }
  frame(0);
  if (!T.film) {
    const t0 = performance.now();
    const loopF = () => { frame(performance.now() - t0); requestAnimationFrame(loopF); };
    requestAnimationFrame(loopF);
    if (CFG.autostart !== false) start(CFG.mode || "full");
  }
})();
