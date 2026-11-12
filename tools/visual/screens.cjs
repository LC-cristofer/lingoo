#!/usr/bin/env node
// Captures the lesson screens of a running app (npm run build && npx next start -p 3220) with
// Playwright's preinstalled Chromium, at phone portrait (390x844) and tablet landscape (1024x768),
// using the review mode (?revisao=1) so no progress is needed. For each capture it also checks that
// the page does not scroll and that buttons are >= 64 px and answer tiles >= 120 px.
//   node tools/visual/screens.cjs [outDir] [baseUrl]
/* eslint-disable @typescript-eslint/no-require-imports -- a plain CommonJS script for node */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const unit = require("../../content/units/forest-animals.json");

const OUT = path.resolve(process.argv[2] ?? "tools/visual/.out/screens");
const ONLY = process.env.ONLY; // "phone" or "tablet" to capture a single form factor
const BASE = process.argv[3] ?? "http://localhost:3220";
const VIEWPORTS = [
  { prefix: "phone", width: 390, height: 844 },
  { prefix: "tablet", width: 1024, height: 768 },
];
const stopOf = (slug) => unit.stops.find((s) => s.id === `forest-animals/${slug}`);

async function report(page, label) {
  const issues = await page.evaluate(() => {
    const out = [];
    const de = document.documentElement;
    if (de.scrollHeight > innerHeight + 1) out.push(`page scrolls vertically (${de.scrollHeight} > ${innerHeight})`);
    if (de.scrollWidth > innerWidth + 1) out.push(`page scrolls horizontally (${de.scrollWidth} > ${innerWidth})`);
    for (const el of document.querySelectorAll("button, a")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const tile = el.hasAttribute("data-card");
      const min = tile ? 120 : 64;
      if (r.width < min - 0.5 || r.height < min - 0.5) out.push(`${tile ? "tile" : "button"} ${el.getAttribute("aria-label") ?? el.textContent} is ${Math.round(r.width)}x${Math.round(r.height)}`);
      if (r.bottom > innerHeight + 1 || r.right > innerWidth + 1 || r.left < -1) out.push(`${el.getAttribute("aria-label") ?? el.textContent} is clipped by the viewport`);
    }
    return out;
  });
  const tiles = await page.evaluate(() => [...document.querySelectorAll("button[data-card]")].map((t) => Math.round(t.getBoundingClientRect().width)));
  console.log(`  ${label}: ${issues.length ? issues.join("; ") : "ok"}${tiles.length ? ` (tiles ${tiles.join(",")} px)` : ""}`);
}

async function shot(page, prefix, name) {
  await page.waitForTimeout(450);
  const file = path.join(OUT, `${prefix}-${name}.png`);
  await page.screenshot({ path: file, animations: "disabled" });
  await report(page, `${prefix}-${name}`);
}

const card = (page, id) => page.locator(`button[data-card="${id}"]`).first();
const word = (page, id) => page.locator(`button[data-word="${id}"]`).first();
const sheetBtn = (page) => page.locator('[data-testid="feedback-area"] button[aria-label="Continuar"]');

async function continueSheet(page) {
  await sheetBtn(page).waitFor({ timeout: 8000 });
  await sheetBtn(page).click();
  await page.waitForTimeout(250);
}

/** Answers one exercise right. `capture(name)` is called at interesting moments. */
async function solve(page, ex, capture) {
  switch (ex.kind) {
    case "intro": {
      const b = page.locator('main button[aria-label="Continuar"]');
      await b.waitFor({ timeout: 15000 });
      await capture("intro");
      await b.click();
      break;
    }
    case "listenTap":
      await capture("listen");
      await card(page, ex.answerId).click();
      break;
    case "trueFalse":
      await capture("truefalse");
      await page.getByRole("button", { name: ex.isTrue ? "Certo" : "Errado" }).click();
      break;
    case "matchPairs": {
      await capture("match-start");
      const ids = ex.wordIds;
      await card(page, ids[0]).click();
      await word(page, ids[0]).click();
      await page.waitForTimeout(200);
      await card(page, ids[1]).click();
      await capture("match-selected");
      await word(page, ids[1]).click();
      for (const id of ids.slice(2)) {
        await card(page, id).click();
        await word(page, id).click();
      }
      break;
    }
    case "tapRepeat": {
      await capture("taprepeat");
      for (const it of ex.items) await card(page, it.wordId).click();
      const b = page.locator('main button[aria-label="Continuar"]');
      await b.waitFor({ timeout: 8000 });
      await capture("taprepeat-done");
      await b.click();
      break;
    }
    case "whatsMissing":
      await page.locator('[data-row="options"]').waitFor({ timeout: 8000 });
      await capture("missing-options");
      await card(page, ex.missingId).click();
      break;
    default:
      throw new Error(`unknown exercise ${ex.kind}`);
  }
}

/** An exercise answered wrong comes back at the end: play the repeats (listenTap only) until `done` shows. */
async function finishRepeats(page, done) {
  for (let i = 0; i < 6; i++) {
    if (await done.isVisible()) return;
    const target = await page.locator(".k-bubble b[lang='en']").first().textContent({ timeout: 3000 });
    await card(page, target.replace(/[^a-z]/gi, "")).click();
    await continueSheet(page);
  }
}

/** Opens a stop in review mode and waits for its opening screen. */
async function play(page, prefix, slug) {
  const stop = stopOf(slug);
  await page.goto(`${BASE}/parada/forest-animals/${slug}?revisao=1`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Começar" }).waitFor();
  return stop;
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const sandboxChromium = process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
  const browser = await chromium.launch({ ...(fs.existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {}), });
  try {
    for (const vp of VIEWPORTS) {
      if (ONLY && vp.prefix !== ONLY) continue;
      console.log(`\n== ${vp.prefix} ${vp.width}x${vp.height}`);
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const P = vp.prefix;

      // lesson-1: opening, intro, 2 tiles, correct, retry, hint, match, closing
      let stop = await play(page, P, "lesson-1");
      await shot(page, P, "opening");
      await page.getByRole("button", { name: "Começar" }).click();
      const seen = new Set();
      const capture = (prefixName) => async (name) => {
        const key = `${prefixName}-${name}`;
        if (seen.has(key)) return;
        seen.add(key);
        await shot(page, P, key);
      };
      const cap1 = capture("l1");
      for (let i = 0; i < stop.exercises.length; i++) {
        const ex = stop.exercises[i];
        if (ex.kind === "listenTap" && ex.optionIds.length === 3 && !seen.has("l1-retry")) {
          // wrong, wrong (hint), then right
          const wrong = ex.optionIds.find((id) => id !== ex.answerId);
          await cap1("listen3");
          await card(page, wrong).click();
          await page.locator('[data-kind="retry"]').waitFor({ timeout: 8000 });
          seen.add("l1-retry");
          await shot(page, P, "l1-retry");
          await page.locator('[data-kind="retry"]').waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
          await card(page, wrong).click();
          await page.locator('[data-kind="hint"]').waitFor({ timeout: 8000 });
          await shot(page, P, "l1-hint");
        }
        await solve(page, ex, cap1);
        if (!seen.has("l1-correct")) {
          await sheetBtn(page).waitFor({ timeout: 8000 });
          seen.add("l1-correct");
          await shot(page, P, "l1-correct");
        }
        if (ex.kind === "matchPairs" && !seen.has("l1-match-correct")) {
          seen.add("l1-match-correct");
          await shot(page, P, "l1-match-correct");
        }
        await continueSheet(page);
      }
      await finishRepeats(page, page.getByRole("button", { name: "Voltar ao mapa" }));
      await page.getByRole("button", { name: "Voltar ao mapa" }).waitFor({ timeout: 8000 }).catch(async () => {
        await page.screenshot({ path: path.join(OUT, `${P}-debug.png`) });
        throw new Error("the closing did not appear (see the debug shot)");
      });
      await shot(page, P, "closing");

      // lesson-2: exercise 10 is a 4-option listenTap
      stop = await play(page, P, "lesson-2");
      await page.getByRole("button", { name: "Começar" }).click();
      const cap2 = capture("l2");
      for (let i = 0; i < stop.exercises.length; i++) {
        const ex = stop.exercises[i];
        if (ex.kind === "listenTap" && ex.optionIds.length === 4) {
          await cap2("listen4");
          await solve(page, ex, async () => {});
          await sheetBtn(page).waitFor({ timeout: 8000 });
          await shot(page, P, "l2-listen4-correct");
          break;
        }
        await solve(page, ex, async () => {});
        await continueSheet(page);
      }

      // challenge: hard exercises (4 pairs, what's missing, 6 animals), closing and chest
      stop = await play(page, P, "challenge");
      await page.getByRole("button", { name: "Começar" }).click();
      const cap3 = capture("ch");
      for (const ex of stop.exercises) {
        await solve(page, ex, cap3);
        await continueSheet(page);
      }
      await finishRepeats(page, page.getByRole("button", { name: "Continuar" }));
      await page.getByRole("button", { name: "Continuar" }).waitFor();
      await shot(page, P, "challenge-closing");
      await page.getByRole("button", { name: "Continuar" }).click();
      await page.getByRole("button", { name: "Abrir o baú" }).waitFor();
      await shot(page, P, "chest-closed");
      await page.getByRole("button", { name: "Abrir o baú" }).click();
      await page.waitForTimeout(900);
      await shot(page, P, "chest-open");
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
