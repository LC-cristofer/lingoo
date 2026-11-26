#!/usr/bin/env node
// Captures the screens of NESTOY from a running production build (npm run build && npx next start -p 3220) with
// Playwright's preinstalled Chromium, at phone portrait (390x844), tablet landscape (1024x768) and a phone on its side (844x390):
//   routes   /  (opening, island day and night, focus on the farol), /farol, /parada/forest-animals/<stop>,
//            /ninho, /responsaveis (gate and sheet), /memoria, /revisao, and the old /mapa and /album redirects;
//            the cadastro (new install), /arvore (new, branch 1 done, English: alphabet) and a letras lesson's opening.
// The lessons use the review mode (?revisao=1) so no progress is needed; the other routes get settings
// (lingoo:settings:v1) and progress (lingoo:progress:v2, migrated to v3 on load) stored before the app loads.
// For each capture it also checks that the page does not scroll and that buttons are >= 64 px and answer tiles >= 120 px.
// (The whole child journey with video is tools/visual/journey.cjs.)
//   node tools/visual/screens.cjs [outDir] [baseUrl]
/* eslint-disable @typescript-eslint/no-require-imports -- a plain CommonJS script for node */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const unit = require("../../content/units/forest-animals.json");

const OUT = path.resolve(process.argv[2] ?? "tools/visual/.out/screens");
const SCALE = Number(process.env.SCALE ?? 1); // deviceScaleFactor: 1 to check, 2 for the committed captures
const ONLY = process.env.ONLY; // "phone", "tablet" or "landscape" (a phone on its side) to capture a single form factor
const BASE = process.argv[3] ?? "http://localhost:3220";
const SETTINGS_KEY = "lingoo:settings:v1";
const VIEWPORTS = [
  { prefix: "phone", width: 390, height: 844 },
  { prefix: "tablet", width: 1024, height: 768 },
  { prefix: "landscape", width: 844, height: 390 },
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
      if (getComputedStyle(el).visibility === "hidden" || el.closest("[inert], [aria-hidden='true']")) continue; // (the island's pins under the cadastro)
      const tile = el.hasAttribute("data-card");
      const min = tile ? (innerHeight <= 520 ? 96 : 120) : 64; // a phone on its side fits cards of 96 px and up
      if (r.width < min - 0.5 || r.height < min - 0.5) out.push(`${tile ? "tile" : "button"} ${el.getAttribute("aria-label") ?? el.textContent} is ${Math.round(r.width)}x${Math.round(r.height)}`);
      // (the farol hit discs and the island pins follow places the camera has moved off screen; the parents sheet scrolls)
      if (el.closest(".nz-hit, .nz-pin, .np-sheet") || el.classList.contains("nz-hit") || el.classList.contains("nz-pin")) continue;
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

const settingsOf = (patch = {}) => ({ version: 1, ambient: "dia", bedtime: "19:30", pauseMinutes: 0, opening: "auto", motion: "auto", openingSeen: true, lastVisit: dayKey(0), ...patch });

/** A fresh context whose settings and progress are stored before the app loads. `motion: "reduce"` is the browser preference. */
async function withProgress(browser, vp, progress, settings = settingsOf(), motion = "reduce") {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: SCALE, reducedMotion: motion });
  // (the cadastro was done: without a stored profile every route would start with it)
  await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), ["lingoo:profile:v1", JSON.stringify({ version: 1, name: "", age: null, english: null, onboarding: "skipped", createdAt: null, islands: { descoberta: { letras: { levels: {} } } } })]);
  if (progress) await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), ["lingoo:progress:v2", JSON.stringify(progress)]);
  if (settings) await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), [SETTINGS_KEY, JSON.stringify(settings)]);
  return { ctx, page: await ctx.newPage() };
}

/** Island, farol, nest, parents, memory, song, story and the review list. */
async function extras(browser, vp) {
  const P = vp.prefix;
  const open = async (page, url, ready) => {
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
    if (ready) await ready();
  };
  const island = (page) => page.getByRole("button", { name: "Farol das Línguas" }).waitFor();
  console.log(`\n== ${P} island, farol, nest, parents, memory, song, story, review`);

  // The first visit: the opening (full motion), a still of its first second.
  let { ctx, page } = await withProgress(browser, vp, null, null, "no-preference");
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, `${P}-first-opening.png`) }); // mid-animation: the pins are still popping in, so no size report
  await ctx.close();

  // The island by day, with the farol in focus, and by night.
  ({ ctx, page } = await withProgress(browser, vp, null));
  await open(page, "/", () => island(page));
  await shot(page, P, "island");
  await page.getByRole("button", { name: "Farol das Línguas" }).click();
  await page.getByRole("button", { name: "Entrar no farol" }).waitFor();
  await shot(page, P, "island-farol");
  await ctx.close();
  ({ ctx, page } = await withProgress(browser, vp, progressOf({ stops: ["song", "lesson-1"] }), settingsOf({ ambient: "noite" })));
  await open(page, "/", () => island(page));
  await shot(page, P, "island-night");
  await ctx.close();
  ({ ctx, page } = await withProgress(browser, vp, progressOf({ stops: ["song", "lesson-1", "lesson-2", "lesson-3", "story", "challenge"] })));
  await open(page, "/", () => island(page));
  await shot(page, P, "island-grown");
  await ctx.close();

  // The farol: new, half way, finished.
  for (const [name, stops] of [["new", []], ["half", ["song", "lesson-1", "lesson-2"]], ["done", ["song", "lesson-1", "lesson-2", "lesson-3", "story", "challenge"]]]) {
    ({ ctx, page } = await withProgress(browser, vp, progressOf({ stops })));
    await open(page, "/farol", () => page.locator(".nz-hit").first().waitFor());
    await page.waitForTimeout(500);
    await shot(page, P, `farol-${name}`);
    await ctx.close();
  }

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

  // The nest: nothing earned, then the sticker and the threads; the old /album and /mapa lead to /ninho and /.
  ({ ctx, page } = await withProgress(browser, vp, progressOf({})));
  await open(page, "/ninho");
  await shot(page, P, "ninho-empty");
  await open(page, "/album");
  console.log(`  /album -> ${new URL(page.url()).pathname}`);
  await open(page, "/mapa", () => island(page));
  console.log(`  /mapa -> ${new URL(page.url()).pathname}`);
  await ctx.close();
  ({ ctx, page } = await withProgress(browser, vp, progressOf({ stops: ["song", "lesson-1", "lesson-2", "lesson-3", "story", "challenge"], stickers: { "sticker-forest-bear": dayKey(0) }, memory: cards(WORDS.slice(0, 3), 1, dayKey(-1)) })));
  await open(page, "/ninho");
  await shot(page, P, "ninho-earned");
  await ctx.close();

  // The parents' area: the gate, then the sheet (the gate is held for 2 s).
  ({ ctx, page } = await withProgress(browser, vp, null));
  await open(page, "/responsaveis");
  await shot(page, P, "parents-gate");
  const hold = page.locator(".np-hold");
  const box = await hold.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2300);
  await page.mouse.up();
  await page.locator(".np-sheet").waitFor();
  await shot(page, P, "parents-sheet");
  await ctx.close();

  // The review list (adults only).
  ({ ctx, page } = await withProgress(browser, vp, null));
  await open(page, "/revisao");
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${P}-review-list.png`), animations: "disabled" });
  await ctx.close();

  // Memory training: none, due (with the round), ready tomorrow, ready later.
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

const PROFILE_KEY = "lingoo:profile:v1";
const profileOf = (patch = {}) => ({ version: 1, name: "Ana", age: 5, english: "none", onboarding: "done", createdAt: "2026-11-26T10:00:00.000Z", islands: { descoberta: { letras: { levels: {} } } }, ...patch });
const letrasProgress = (slugs) => ({ version: 3, completedStops: Object.fromEntries(slugs.map((s) => [`letras-1/${s}`, dayKey(0)])), stickers: {}, daysPlayed: slugs.length ? [dayKey(0)] : [], memory: {}, legacy: null });

/** The Árvore das Letras: the cadastro (a new install), the tree inside (new, branch 1 done, branch 3 start) and a letras lesson's opening. */
async function arvoreScreens(browser, vp) {
  const P = vp.prefix;
  console.log(`\n== ${P} cadastro and the Árvore das Letras`);
  const ctxFor = async (profile, progress) => {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: SCALE, reducedMotion: "reduce" });
    await ctx.addInitScript(([sk, sv, pk, pv, gk, gv]) => {
      localStorage.setItem(sk, sv);
      if (pv) localStorage.setItem(pk, pv);
      if (gv) localStorage.setItem(gk, gv);
    }, [SETTINGS_KEY, JSON.stringify(settingsOf()), PROFILE_KEY, profile ? JSON.stringify(profile) : "", "lingoo:progress:v3", progress ? JSON.stringify(progress) : ""]);
    return { ctx, page: await ctx.newPage() };
  };

  // The cadastro of a new install, step by step.
  let { ctx, page } = await ctxFor(null, null);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const gate = page.getByRole("button", { name: "Segure para entrar" });
  await gate.waitFor();
  await shot(page, P, "cadastro-gate");
  const box = await gate.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2400);
  await page.mouse.up();
  await page.getByLabel("Nome da criança").fill("Ana");
  await shot(page, P, "cadastro-name");
  await page.getByRole("button", { name: "Seguir" }).click();
  await shot(page, P, "cadastro-age");
  await page.getByRole("button", { name: "5", exact: true }).click();
  await shot(page, P, "cadastro-english");
  await page.getByRole("button", { name: "Nenhum ainda" }).click();
  await shot(page, P, "cadastro-ready");
  await ctx.close();

  // The tree inside.
  for (const [name, profile, slugs] of [["new", profileOf(), []], ["branch1-done", profileOf(), ["song", "lesson-1", "lesson-2", "lesson-3", "story", "challenge"]], ["alphabet", profileOf({ english: "alphabet" }), []]]) {
    ({ ctx, page } = await ctxFor(profile, letrasProgress(slugs)));
    await page.goto(`${BASE}/arvore`, { waitUntil: "networkidle" });
    await page.locator(".nz-hit").first().waitFor();
    await page.waitForTimeout(600);
    await shot(page, P, `arvore-${name}`);
    await ctx.close();
  }

  // A letras lesson: four letters on the opening (the start button must stay on screen).
  ({ ctx, page } = await ctxFor(profileOf(), letrasProgress(["song"])));
  await page.goto(`${BASE}/parada/letras-1/lesson-1`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Começar" }).waitFor();
  await shot(page, P, "letras-opening");
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
      await arvoreScreens(browser, vp);
      console.log(`\n== ${vp.prefix} ${vp.width}x${vp.height} lessons`);
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: SCALE, reducedMotion: "reduce" });
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
      await finishRepeats(page, page.getByRole("button", { name: "Voltar", exact: true }));
      await page.getByRole("button", { name: "Voltar", exact: true }).waitFor({ timeout: 8000 }).catch(async () => {
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
