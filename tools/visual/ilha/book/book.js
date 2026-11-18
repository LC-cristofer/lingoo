/* Book page behaviour: film chapters, bible specimens drawn with the world's own functions, prototype controls. */
(function () {
  // film chapters
  const film = document.getElementById("film");
  document.getElementById("steps").addEventListener("click", ev => {
    const b = ev.target.closest("button[data-t]"); if (!b || !film) return;
    try { film.currentTime = +b.dataset.t; film.play().catch(() => { }); } catch (e) { }
    document.querySelectorAll("#steps button").forEach(x => x.setAttribute("aria-current", x === b));
  });

  // bible specimens, drawn with the same functions as the island
  const spec = {
    formas: `<svg viewBox="40 40 120 100">${bush(100, 120, 2)}</svg>`,
    cores: `<svg viewBox="0 0 120 110">${[[30, 34, PAL.grass], [62, 34, PAL.water], [94, 34, PAL.path], [30, 70, PAL.letras], [62, 70, PAL.linguas], [94, 70, PAL.wood]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="14" fill="${c}"/>`).join("")}<circle cx="62" cy="96" r="9" fill="${PAL.nino}"/></svg>`,
    texturas: `<div style="width:100%;height:100%;background-color:#86CC5E;background-image:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .3 0 0 0 0 .25 0 0 0 0 .15 0 0 0 .35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E&quot;)"></div>`,
    luz: `<svg viewBox="0 0 120 110"><path d="M14 14 l20 16" stroke="#F5B12E" stroke-width="4" stroke-linecap="round"/><circle cx="14" cy="14" r="8" fill="#FFC94A"/>${puff(68, 62, 34, PAL.leaf, PAL.leafDark, PAL.leafLight)}</svg>`,
    sombras: `<svg viewBox="50 60 100 70">${rock(100, 110, 2.2, 5)}</svg>`,
    contornos: `<svg viewBox="0 0 120 110"><circle cx="60" cy="55" r="40" fill="#FFF1DA" stroke="#fff" stroke-width="8"/><svg x="26" y="21" width="68" height="68" viewBox="0 0 300 300"><use href="#ani-frog"/></svg></svg>`,
    personagens: `<svg viewBox="-30 -40 260 300" id="specNino"></svg>`,
    cenarios: `<svg viewBox="20 520 220 200">${islet(130, 640, 0.9, 3, 0)}</svg>`,
    interface: `<div style="display:grid;gap:8px;justify-items:center"><span style="width:46px;height:46px;border-radius:50%;background:#FFF8EC;border:3px solid #2E9FD8;display:grid;place-items:center;font:700 13px Fredoka,sans-serif;color:#3A2618;box-shadow:0 4px 10px rgba(58,38,24,.2)">Hi!</span><span style="height:34px;padding:0 14px;border-radius:12px;background:#5DB55A;color:#fff;font:700 13px/34px Fredoka,sans-serif;box-shadow:0 4px 0 #3E8E3E">Continuar</span></div>`,
    animacao: `<svg viewBox="0 0 120 110"><path d="M14 92 Q36 10 60 92 Q82 30 104 92" stroke="#C9BEA9" stroke-width="2" stroke-dasharray="4 5" fill="none"/>${[[14, 92, 1.3, 0.7], [37, 40, 0.85, 1.2], [60, 92, 1.35, 0.68], [82, 56, 0.9, 1.15], [104, 92, 1.25, 0.75]].map(([x, y, sx, sy]) => `<ellipse cx="${x}" cy="${y - 9 * sy}" rx="${9 * sx}" ry="${9 * sy}" fill="${PAL.nino}"/>`).join("")}</svg>`,
  };
  document.querySelectorAll("[data-spec]").forEach(el => { el.innerHTML = spec[el.dataset.spec] || ""; });
  const sn = document.getElementById("specNino");
  if (sn && window.makeNino) { const k = makeNino(sn, { x: 100, y: 222, s: 1, alive: false }); k.render(0, true); }

  // prototype
  const N = window.NESTOY, ov = document.getElementById("startov");
  let started = false;
  function begin(mode) {
    if (ov) ov.hidden = true; started = true;
    N.start(mode);
  }
  document.getElementById("startBtn").addEventListener("click", () => begin(N.env.reduced ? "reduced" : "full"));
  const whenIsland = async (f) => { if (!started) begin("reduced"); for (let i = 0; i < 80 && N.state().scene !== "island"; i++) await new Promise(r => setTimeout(r, 100)); if (N.state().scene !== "island") { N.start("reduced"); await new Promise(r => setTimeout(r, 700)); } f(); };
  document.querySelector(".controls").addEventListener("click", ev => {
    const b = ev.target.closest("button[data-c]"); if (!b) return;
    const c = b.dataset.c;
    if (c === "full" || c === "short") return begin(N.env.reduced ? "reduced" : c);
    if (c === "reduced") { N.env.reduced = !N.env.reduced; b.setAttribute("aria-pressed", N.env.reduced); return begin(N.env.reduced ? "reduced" : "full"); }
    if (c === "bed") return whenIsland(() => N.bedtime());
    if (c === "pause") return whenIsland(() => N.pauseReminder());
    if (c === "sound") { const on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on); b.textContent = on ? "Som ligado" : "Som desligado"; N.setSound(on); }
  });
  if (N && N.preview) N.preview();
})();
