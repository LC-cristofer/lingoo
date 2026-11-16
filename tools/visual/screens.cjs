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
const SCALE = Number(process.env.SCALE ?? 1); // deviceScaleFactor: 1 to check, 2 for the committed captures
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

/** The memory round after a lesson: flip every card, check every card, leave the summary. */
async function memoryThrough(page) {
  const total = Number((await page.getByText(/^1 de \d+$/).textContent()).match(/de (\d+)/)[1]);
  for (let i = 0; i < total; i++) {
    await page.getByRole("button", { name: "Virar o cartão" }).click();
    await page.getByRole("button", { name: "Próximo" }).click();
  }
  for (let i = 0; i < total; i++) {
    await page.locator("button[data-card]").first().waitFor();
    const asked = (await page.locator(".k-bubble b[lang='en']").first().textContent()).replace(/[^a-z]/gi, "");
    await card(page, asked).click();
    await continueSheet(page);
  }
  await page.getByRole("button", { name: "Continuar" }).click();
}

/** An exercise answered wrong comes back at the end (listenTap only); a lesson then runs its memory round.
 *  Loops until `done` shows. */
async function finishRepeats(page, done) {
  for (let i = 0; i < 8; i++) {
    if (await done.isVisible()) return;
    if (await page.getByRole("button", { name: "Virar o cartão" }).isVisible()) {
      await memoryThrough(page);
      continue;
    }
    const target = await page.locator(".k-bubble b[lang='en']").first().textContent({ timeout: 3000 }).catch(() => null);
    if (target === null) {
      await page.waitForTimeout(400);
      continue;
    }
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


const pad = (n) => String(n).padStart(2, "0");
const dayKey = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const WORDS = ["bear", "bird", "frog", "snake", "spider"];
const progressOf = ({ stops = [], stickers = {}, memory = {} }) => ({
  completedStops: Object.fromEntries(stops.map((slug) => [`forest-animals/${slug}`, dayKey(0)])),
  stickers,
  daysPlayed: [dayKey(0)],
  memory,
});
const cards = (words, box, due) => Object.fromEntries(words.map((w) => [`forest-animals:${w}`, { box, due }]));

/** A fresh context whose progress is stored before the app loads. */
async function withProgress(browser, vp, progress) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: SCALE });
  if (progress) await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), ["lingoo:progress:v2", JSON.stringify(progress)]);
  return { ctx, page: await ctx.newPage() };
}

/** Start, map, song, story, album and the memory screens. */
async function extras(browser, vp) {
  const P = vp.prefix;
  const open = async (page, url, ready) => {
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
    if (ready) await ready();
  };
  console.log(`\n== ${P} start, map, song, story, album, memory`);
  let { ctx, page } = await withProgress(browser, vp, null);
  await open(page, "/");
  await shot(page, P, "start");
  await open(page, "/mapa");
  await shot(page, P, "map-new");
  await ctx.close();

  ({ ctx, page } = await withProgress(browser, vp, progressOf({ stops: ["song", "lesson-1"], memory: cards(WORDS.slice(0, 3), 1, dayKey(1)) })));
  await open(page, "/mapa");
  await shot(page, P, "map-progress");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await shot(page, P, "map-next-unit");
  await ctx.close();

  // The song: karaoke (the line being sung) after the start.
  ({ ctx, page } = await withProgress(browser, vp, progressOf({})));
  await open(page, "/parada/forest-animals/song");
  await page.getByRole("button", { name: "Cantar" }).click();
  await page.locator('[data-state="current"][data-line]').waitFor({ timeout: 30000 }).catch(() => {});
  await shot(page, P, "song-karaoke");
  await ctx.close();

  // The story: the page with a hotspot (page 2).
  ({ ctx, page } = await withProgress(browser, vp, progressOf({})));
  await play(page, P, "story");
  await page.getByRole("button", { name: "Começar" }).click();
  const story = stopOf("story");
  await solve(page, story.warmup, async () => {});
  await continueSheet(page);
  await page.getByRole("button", { name: "Avançar" }).click({ timeout: 90000 });
  await page.locator("[data-hotspot]").first().waitFor();
  await page.getByRole("button", { name: "Avançar" }).waitFor({ timeout: 60000 }); // the page has been read: both buttons show
  await shot(page, P, "story-page");
  await ctx.close();

  // Album: nothing earned, then the sticker earned.
  ({ ctx, page } = await withProgress(browser, vp, progressOf({})));
  await open(page, "/album");
  await shot(page, P, "album-empty");
  await ctx.close();
  ({ ctx, page } = await withProgress(browser, vp, progressOf({ stops: ["song", "lesson-1", "lesson-2", "lesson-3", "story", "challenge"], stickers: { "sticker-forest-bear": dayKey(0) } })));
  await open(page, "/album");
  await shot(page, P, "album-earned");
  await ctx.close();

  // Memory tab: none, due (with the round), ready tomorrow, ready later.
  ({ ctx, page } = await withProgress(browser, vp, progressOf({})));
  await open(page, "/memoria");
  await shot(page, P, "mem-none");
  await ctx.close();
  ({ ctx, page } = await withProgress(browser, vp, progressOf({ stops: ["song", "lesson-1"], memory: cards(WORDS.slice(0, 3), 1, dayKey(1)) })));
  await open(page, "/memoria");
  await shot(page, P, "mem-tomorrow");
  await ctx.close();
  ({ ctx, page } = await withProgress(browser, vp, progressOf({ stops: ["song", "lesson-1"], memory: cards(WORDS.slice(0, 3), 2, dayKey(3)) })));
  await open(page, "/memoria");
  await shot(page, P, "mem-later");
  await ctx.close();

  ({ ctx, page } = await withProgress(browser, vp, progressOf({ stops: ["song", "lesson-1", "lesson-2"], memory: cards(WORDS, 1, dayKey(-1)) })));
  await open(page, "/memoria");
  await shot(page, P, "mem-due");
  await page.getByRole("button", { name: "Treinar" }).click();
  await page.getByRole("button", { name: "Virar o cartão" }).waitFor();
  await shot(page, P, "mem-front");
  await page.getByRole("button", { name: "Virar o cartão" }).click();
  await page.getByRole("button", { name: "Próximo" }).waitFor();
  await shot(page, P, "mem-back");
  await page.getByRole("button", { name: "Próximo" }).click();
  for (let i = 1; i < WORDS.length; i++) {
    await page.getByRole("button", { name: "Virar o cartão" }).click();
    await page.getByRole("button", { name: "Próximo" }).click();
  }
  const asked = async () => (await page.locator(".k-bubble b[lang='en']").first().textContent()).replace(/[^a-z]/gi, "");
  await card(page, await asked()).waitFor();
  await shot(page, P, "mem-check");
  for (let i = 0; i < WORDS.length; i++) {
    await card(page, await asked()).click();
    if (i === 0) await shot(page, P, "mem-sheet");
    await continueSheet(page);
  }
  await page.getByRole("button", { name: "Continuar" }).waitFor();
  await shot(page, P, "mem-summary");
  await ctx.close();
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const sandboxChromium = process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
  const browser = await chromium.launch({ ...(fs.existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {}), });
  try {
    for (const vp of VIEWPORTS) {
      if (ONLY && vp.prefix !== ONLY) continue;
      await extras(browser, vp);
      console.log(`\n== ${vp.prefix} ${vp.width}x${vp.height} lessons`);
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: SCALE });
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
