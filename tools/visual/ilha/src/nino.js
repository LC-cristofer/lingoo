/* Nino's rig: the approved cat drawing (src/art/Cat.tsx), split into parts that can move.
   Shapes, colours and proportions are the original ones; only transforms change. */
"use strict";
const NINO_C = { cat: "#FF9F43", dark: "#EE8226", light: "#FFF1DE", ink: "#2B2D42", pink: "#FF8FA3", mouth: "#B23A48", sun: "#FFC93C" };
const ARM = {
  downL: [64, 158, -6, 18, 4, 28], downR: [136, 158, 6, 18, -4, 28],
  upL: [62, 152, -34, -10, -44, -42], upR: [138, 152, 34, -10, 44, -42],
  stretchL: [62, 148, -22, -26, -12, -76], stretchR: [138, 148, 22, -26, 12, -76],
  pointR: [136, 150, 30, -6, 52, -18], helpR: [136, 156, 22, -6, 26, -34],
  waveR: [138, 150, 30, -14, 40, -50], restL: [66, 160, -8, 14, 2, 26],
};
function ninoMarkup(uid) {
  const C = NINO_C, limb = `stroke="${C.cat}" stroke-width="18" stroke-linecap="round" fill="none"`, line = w => `fill="none" stroke="${C.ink}" stroke-width="${w}" stroke-linecap="round"`;
  return `<g class="n-root">
  <ellipse class="n-shadow" cx="100" cy="222" rx="58" ry="8" fill="rgba(43,45,66,.14)"/>
  <g class="n-body">
    <g class="n-tail"><path d="M140 196 C192 192 196 132 168 120 C156 115 150 128 160 134 C176 142 172 178 134 182 Z" fill="${C.cat}"/><path d="M168 120 C156 115 150 128 160 134 C164 128 168 124 168 120Z" fill="${C.dark}"/></g>
    <ellipse cx="100" cy="176" rx="46" ry="44" fill="${C.cat}"/><ellipse cx="100" cy="184" rx="27" ry="30" fill="${C.light}"/>
    <g class="n-footL"><ellipse cx="78" cy="216" rx="18" ry="10" fill="${C.cat}"/><ellipse cx="78" cy="218" rx="10" ry="5" fill="${C.light}"/></g>
    <g class="n-footR"><ellipse cx="122" cy="216" rx="18" ry="10" fill="${C.cat}"/><ellipse cx="122" cy="218" rx="10" ry="5" fill="${C.light}"/></g>
    <path class="n-armL" d="M64 158 q-6 18 4 28" ${limb}/><circle class="n-pawL" cx="68" cy="186" r="11" fill="${C.light}" opacity="0"/>
    <path class="n-armR" d="M136 158 q6 18 -4 28" ${limb}/><circle class="n-pawR" cx="132" cy="186" r="11" fill="${C.light}" opacity="0"/>
    <g class="n-head">
      <g class="n-earL"><path d="M44 66 L40 14 Q42 6 50 10 L88 44 Z" fill="${C.cat}"/><path d="M52 52 L50 24 L74 44 Z" fill="${C.pink}"/></g>
      <g class="n-earR"><path d="M156 66 L160 14 Q158 6 150 10 L112 44 Z" fill="${C.cat}"/><path d="M148 52 L150 24 L126 44 Z" fill="${C.pink}"/></g>
      <ellipse cx="100" cy="92" rx="66" ry="58" fill="${C.cat}"/>
      <path d="M88 38 q4 12 0 20 M100 36 q4 14 0 24 M112 38 q4 12 0 20" fill="none" stroke="${C.dark}" stroke-width="6" stroke-linecap="round"/>
      <ellipse cx="100" cy="112" rx="30" ry="21" fill="${C.light}"/>
      <g class="n-eyesOpen"><g class="n-look">
        <ellipse cx="74" cy="88" rx="12" ry="14" fill="${C.ink}"/><ellipse cx="126" cy="88" rx="12" ry="14" fill="${C.ink}"/>
        <circle cx="78" cy="82" r="4.5" fill="#fff"/><circle cx="130" cy="82" r="4.5" fill="#fff"/><circle cx="71" cy="94" r="2" fill="#fff"/><circle cx="123" cy="94" r="2" fill="#fff"/></g></g>
      <path class="n-eyesClosed" d="M62 86 q12 10 24 0 M114 86 q12 10 24 0" ${line(5)} display="none"/>
      <path class="n-eyesHappy" d="M62 90 q12 -14 24 0 M114 90 q12 -14 24 0" ${line(6)} display="none"/>
      <path d="M93 100 h14 q-7 9 -7 9 q0 0 -7 -9z" fill="${C.pink}" stroke="${C.pink}" stroke-width="3" stroke-linejoin="round"/>
      <path class="n-m n-mSmile" d="M100 108 q-7 9 -14 3 M100 108 q7 9 14 3" ${line(4)}/>
      <g class="n-m n-mOpen" display="none"><path d="M90 110 q10 15 20 0 z" fill="${C.mouth}"/><path d="M94.5 116.5 q5.5 4.5 11 0 q-5.5 -4 -11 0z" fill="${C.pink}"/></g>
      <g class="n-m n-mBig" display="none"><path d="M86 110 q14 22 28 0 z" fill="${C.mouth}"/><path d="M93 118 q7 6 14 0 q-7 -5 -14 0z" fill="${C.pink}"/></g>
      <g class="n-m n-mYawn" display="none"><ellipse cx="100" cy="118" rx="10" ry="13" fill="${C.mouth}"/><ellipse cx="100" cy="125" rx="6" ry="4" fill="${C.pink}"/></g>
      <path class="n-m n-mSoft" d="M90 110 q10 9 20 0" ${line(4)} display="none"/>
      <ellipse cx="56" cy="112" rx="11" ry="7" fill="#FF7A6B" opacity=".35"/><ellipse cx="144" cy="112" rx="11" ry="7" fill="#FF7A6B" opacity=".35"/>
      <path d="M40 104 l-18 -4 M40 112 l-18 2 M160 104 l18 -4 M160 112 l18 2" fill="none" stroke="${C.dark}" stroke-width="3" stroke-linecap="round"/>
    </g>
  </g>
  <g class="n-fx"></g>
</g>`;
}

function makeNino(svgParent, opts = {}) {
  const NS = "http://www.w3.org/2000/svg";
  const el = document.createElementNS(NS, "g");
  el.setAttribute("class", "nino");
  el.innerHTML = ninoMarkup();
  svgParent.appendChild(el);
  const q = s => el.querySelector(s);
  const parts = { root: q(".n-root"), body: q(".n-body"), tail: q(".n-tail"), head: q(".n-head"), earL: q(".n-earL"), earR: q(".n-earR"),
    armL: q(".n-armL"), armR: q(".n-armR"), pawL: q(".n-pawL"), pawR: q(".n-pawR"), footL: q(".n-footL"), footR: q(".n-footR"),
    eyesOpen: q(".n-eyesOpen"), look: q(".n-look"), eyesClosed: q(".n-eyesClosed"), eyesHappy: q(".n-eyesHappy"), shadow: q(".n-shadow"),
    mouths: { smile: q(".n-mSmile"), open: q(".n-mOpen"), big: q(".n-mBig"), yawn: q(".n-mYawn"), soft: q(".n-mSoft") } };
  const st = Object.assign({
    x: 0, y: 0, s: 0.3, facing: 1, lean: 0, lift: 0, sx: 1, sy: 1, alpha: 1,
    head: 0, headY: 0, earL: 0, earR: 0, tail: 0, tailAmp: 1,
    armL: ARM.downL.slice(), armR: ARM.downR.slice(), pawL: 0, pawR: 0,
    eyes: "open", blink: 0, lookX: 0, lookY: 0, mouth: "smile",
    talking: false, walk: 0, walkPhase: 0, breathe: 1, alive: true, shadow: 1,
  }, opts);
  let nextBlink = 1800, blinkUntil = 0, twitchAt = 4200;
  const setD = (p, a) => p.setAttribute("d", `M${a[0].toFixed(1)} ${a[1].toFixed(1)} q${a[2].toFixed(1)} ${a[3].toFixed(1)} ${a[4].toFixed(1)} ${a[5].toFixed(1)}`);
  const setPaw = (c, a, o) => { c.setAttribute("cx", (a[0] + a[4]).toFixed(1)); c.setAttribute("cy", (a[1] + a[5]).toFixed(1)); c.setAttribute("opacity", o.toFixed(2)); };
  function render(t, reduced) {
    const alive = st.alive && !reduced;
    // ambient life: breathing, tail, blinks (two rhythms, sometimes double), ear twitch
    const br = alive ? Math.sin(t / 3600 * Math.PI * 2) * 0.012 * st.breathe : 0;
    let blink = st.blink;
    if (alive && st.eyes === "open") {
      if (t > nextBlink) { blinkUntil = t + 150; const r = (Math.sin(t * 12.9898) * 43758.5453) % 1; nextBlink = t + 2400 + Math.abs(r) * 3200; if (Math.abs(r) < 0.2) nextBlink = t + 320; }
      if (t < blinkUntil) blink = Math.max(blink, 1 - Math.abs((blinkUntil - t) / 75 - 1));
    }
    let earL = st.earL;
    if (alive && t > twitchAt) { const k = (t - twitchAt) / 260; if (k < 1) earL += Math.sin(k * Math.PI) * -12; else twitchAt = t + 5200 + (t % 3000); }
    // walking: bob, alternating feet, swinging arms
    const w = st.walk, ph = st.walkPhase;
    const bob = w * Math.abs(Math.sin(ph)) * -10, fL = w * Math.max(0, Math.sin(ph)) * -7, fR = w * Math.max(0, -Math.sin(ph)) * -7;
    const talkMouth = st.talking && alive ? (Math.floor(t / 130) % 3 === 0 ? "smile" : "open") : null;
    // root transform (feet anchored at 100,224 in rig space)
    const sx = st.sx * (1 - br * 0.5), sy = st.sy * (1 + br);
    parts.root.setAttribute("transform", `translate(${st.x.toFixed(2)} ${(st.y - st.lift).toFixed(2)}) scale(${(st.s * st.facing).toFixed(4)} ${st.s.toFixed(4)}) rotate(${st.lean.toFixed(2)}) translate(-100 -224)`);
    parts.root.setAttribute("opacity", st.alpha.toFixed(3));
    parts.body.setAttribute("transform", `translate(100 ${(224 + bob).toFixed(2)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(-100 -224)`);
    parts.shadow.setAttribute("opacity", (st.shadow * (1 - Math.min(1, st.lift / 60))).toFixed(2));
    const tail = st.tail + (alive ? Math.sin(t / 1450 * Math.PI) * 7 * st.tailAmp * (1 + w) : 0);
    parts.tail.setAttribute("transform", `rotate(${tail.toFixed(2)} 138 192)`);
    parts.head.setAttribute("transform", `translate(0 ${st.headY.toFixed(2)}) rotate(${(st.head + (alive ? Math.sin(t / 2600) * 1.2 : 0) + (st.talking && alive ? Math.sin(t / 160) * 1.6 : 0)).toFixed(2)} 100 140)`);
    parts.earL.setAttribute("transform", `rotate(${earL.toFixed(2)} 60 54)`);
    parts.earR.setAttribute("transform", `rotate(${st.earR.toFixed(2)} 140 54)`);
    const aL = st.armL.slice(), aR = st.armR.slice();
    if (w) { aL[4] += Math.sin(ph) * 6 * w; aR[4] -= Math.sin(ph) * 6 * w; }
    setD(parts.armL, aL); setD(parts.armR, aR); setPaw(parts.pawL, aL, st.pawL); setPaw(parts.pawR, aR, st.pawR);
    parts.footL.setAttribute("transform", `translate(0 ${fL.toFixed(2)})`); parts.footR.setAttribute("transform", `translate(0 ${fR.toFixed(2)})`);
    parts.eyesOpen.setAttribute("display", st.eyes === "open" ? "inline" : "none");
    parts.eyesClosed.setAttribute("display", st.eyes === "closed" ? "inline" : "none");
    parts.eyesHappy.setAttribute("display", st.eyes === "happy" ? "inline" : "none");
    parts.eyesOpen.setAttribute("transform", `translate(0 88) scale(1 ${(1 - 0.92 * Math.min(1, blink)).toFixed(3)}) translate(0 -88)`);
    parts.look.setAttribute("transform", `translate(${st.lookX.toFixed(2)} ${st.lookY.toFixed(2)})`);
    const m = talkMouth || st.mouth;
    for (const k in parts.mouths) parts.mouths[k].setAttribute("display", k === m ? "inline" : "none");
  }
  return { el, st, render, parts };
}
if (typeof module !== "undefined") module.exports = { makeNino, ARM };
