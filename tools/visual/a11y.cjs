#!/usr/bin/env node
// Accessibility pass over every route of a running production build (npx next start -p 3300):
// axe-core (WCAG 2 A/AA rules), plus our own checks: every control has an accessible name, touch targets are
// >= 64 px, and a focused control shows a visible focus ring.
//   node tools/visual/a11y.cjs [baseUrl]
/* eslint-disable @typescript-eslint/no-require-imports -- a plain CommonJS script for node */
const fs = require("node:fs");
const { chromium } = require("playwright");
const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const BASE = process.argv[2] ?? "http://localhost:3300";
const FORMS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "phone-landscape", width: 844, height: 390 },
];
const today = new Date().toISOString().slice(0, 10);
const SETTINGS = { version: 1, ambient: "dia", bedtime: "19:30", pauseMinutes: 0, opening: "auto", motion: "reduzir", openingSeen: true, lastVisit: today };
const done = (...slugs) => ({ completedStops: Object.fromEntries(slugs.map((s) => [`forest-animals/${s}`, today])), stickers: { "sticker-forest-bear": today }, daysPlayed: [today], memory: { "forest-animals:bear": { box: 1, due: "2020-01-01" } } });
const holdGate = async (page) => {
  const box = await page.locator(".np-hold").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2300);
  await page.mouse.up();
  await page.locator(".np-sheet").waitFor();
  await page.waitForTimeout(300);
};
// Each scenario is a screen state, not only a route: the opened parents' sheet, the island with a card action, the night...
const SCENARIOS = [
  { name: "/ (island)", url: "/" },
  { name: "/ (farol focused, with the Entrar button)", url: "/", act: async (p) => { await p.getByRole("button", { name: "Farol das Línguas" }).click(); await p.getByRole("button", { name: "Entrar no farol" }).waitFor(); } },
  { name: "/ (night)", url: "/", settings: { ambient: "noite" } },
  { name: "/farol (half way)", url: "/farol", progress: done("song", "lesson-1", "lesson-2") },
  { name: "/ninho (sticker, memory due)", url: "/ninho", progress: done("song", "lesson-1", "lesson-2", "lesson-3", "story", "challenge") },
  { name: "/responsaveis (gate)", url: "/responsaveis" },
  { name: "/responsaveis (sheet, routine on)", url: "/responsaveis", act: async (p) => { await holdGate(p); await p.getByRole("button", { name: "Seguir a rotina" }).click(); } },
  { name: "/memoria", url: "/memoria", progress: done("song", "lesson-1", "lesson-2") },
  { name: "/revisao", url: "/revisao" },
  { name: "/parada/forest-animals/lesson-1 (review mode)", url: "/parada/forest-animals/lesson-1?revisao=1" },
];

async function ownChecks(page) {
  return page.evaluate(() => {
    const out = { unnamed: [], small: [], noFocus: [] };
    const name = (el) =>
      (el.getAttribute("aria-label") ||
        (el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby"))?.textContent) ||
        el.textContent ||
        [...(el.labels ?? [])].map((l) => l.textContent).join(" ") ||
        el.getAttribute("title") ||
        [...el.querySelectorAll("[aria-label], img[alt]")].map((d) => d.getAttribute("aria-label") || d.getAttribute("alt")).join(" ") ||
        "").trim();
    const controls = [...document.querySelectorAll("button, a[href], input, select, textarea, [role=button]")].filter((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && !el.closest("[inert]") && !el.closest("[hidden]");
    });
    for (const el of controls) {
      const label = name(el) || el.tagName;
      if (!name(el)) out.unnamed.push(el.outerHTML.slice(0, 90));
      const r = el.getBoundingClientRect();
      const offscreen = r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth;
      if (!offscreen && (r.width < 63.5 || r.height < 63.5)) out.small.push(`${label} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return { out, count: controls.length };
  });
}

async function focusRings(page) {
  const bad = [];
  const n = await page.evaluate(() => document.querySelectorAll("button, a[href], input").length);
  for (let i = 0; i < Math.min(n, 14); i++) {
    await page.keyboard.press("Tab");
    const r = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || !el.matches(":focus-visible")) return null; // (a time input keeps focus across its fields)
      const cs = getComputedStyle(el);
      const probe = document.createElement("i");
      probe.style.boxShadow = "var(--focus-ring)"; // the design's focus ring, as the browser resolves it
      document.body.appendChild(probe);
      const ringShadow = getComputedStyle(probe).boxShadow;
      probe.remove();
      const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
      const own = ringShadow !== "none" && cs.boxShadow.includes(ringShadow);
      // some controls draw the ring on their face (the island pins' medallion)
      const child = ringShadow !== "none" && [...el.querySelectorAll("*")].some((d) => getComputedStyle(d).boxShadow.includes(ringShadow));
      return { label: (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 30), ring: outline || own || child, shadow: cs.boxShadow, want: ringShadow };
    });
    if (r && !r.ring) bad.push(`${r.label} [${r.shadow} | wanted ${r.want}]`);
  }
  return bad;
}

(async () => {
  const sandboxChromium = process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
  const browser = await chromium.launch(fs.existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {});
  let total = 0;
  for (const form of FORMS) {
    for (const sc of SCENARIOS.filter((x) => !process.env.ONLY_SC || x.name.includes(process.env.ONLY_SC))) {
      const ctx = await browser.newContext({ viewport: { width: form.width, height: form.height }, reducedMotion: "reduce" });
      await ctx.addInitScript(([k, v, pk, pv]) => {
        try {
          localStorage.setItem(k, v);
          if (pv) localStorage.setItem(pk, pv);
        } catch {}
      }, ["lingoo:settings:v1", JSON.stringify({ ...SETTINGS, ...(sc.settings ?? {}) }), "lingoo:progress:v2", sc.progress ? JSON.stringify(sc.progress) : ""]);
      const page = await ctx.newPage();
      await page.goto(`${BASE}${sc.url}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      if (sc.act) await sc.act(page);
      await page.evaluate(axeSource);
      const axe = await page.evaluate(() => window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
      const own = await ownChecks(page);
      const rings = await focusRings(page);
      const lines = [];
      let noted = 0;
      for (const v of axe.violations) {
        if (v.id === "meta-viewport") continue; // zoom is off on purpose: a fixed full-screen game for 5-8 year olds
        if (v.id === "color-contrast") {
          // Ruling 2: the white label on the approved green (#5DB55A) and blue (#2E9FD8) buttons stays as approved (spec §1).
          const real = v.nodes.filter((n) => !/foreground color: #ffffff, background color: #(5db55a|2e9fd8)/.test(n.failureSummary || ""));
          noted += v.nodes.length - real.length;
          if (!real.length) continue;
          lines.push(`axe color-contrast (serious): ${real.length} node(s) e.g. ${real[0].target.join(" ")} :: ${(real[0].failureSummary || "").split("\n")[1] ?? ""}`);
          continue;
        }
        lines.push(`axe ${v.id} (${v.impact}): ${v.nodes.length} node(s) e.g. ${v.nodes[0].target.join(" ")} :: ${(v.nodes[0].failureSummary || "").split("\n")[1] ?? ""}`);
      }
      const unsure = axe.incomplete.filter((v) => v.id === "color-contrast").reduce((n, v) => n + v.nodes.length, 0);
      if (own.out.unnamed.length) lines.push(`unnamed: ${own.out.unnamed.join(" | ")}`);
      if (own.out.small.length) lines.push(`small (<64): ${[...new Set(own.out.small)].join("; ")}`);
      if (rings.length) lines.push(`no visible focus: ${rings.join(", ")}`);
      total += lines.length;
      console.log(`${form.name} ${sc.name}: ${own.count} controls, axe ${axe.passes.length} rules pass${unsure ? `, ${unsure} text(s) over art that axe cannot judge` : ""}${noted ? `, ${noted} approved white-on-green/blue label(s) noted` : ""} -> ${lines.length ? "\n  " + lines.join("\n  ") : "ok"}`);
      await ctx.close();
    }
  }
  await browser.close();
  process.exit(total ? 1 : 0);
})();
