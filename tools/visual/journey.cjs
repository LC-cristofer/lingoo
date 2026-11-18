#!/usr/bin/env node
// Records the whole child journey of NESTOY on a running production build (npm run build && npx next start -p 3300):
// first opening -> island -> farol -> lesson (wrong, then right) -> closing -> return (the farol grows, a thread)
// -> nest -> parents (the held gate, the routine) -> the night. One video and a few stills per form factor and motion mode.
//   node tools/visual/journey.cjs [outDir] [baseUrl]
//   ONLY=phone-portrait MOTION=reduce node tools/visual/journey.cjs   (a single combination)
// Audio files play at 16x so the lesson takes seconds; the requests stay real.
/* eslint-disable @typescript-eslint/no-require-imports -- a plain CommonJS script for node */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const unit = require("../../content/units/forest-animals.json");

const OUT = path.resolve(process.argv[2] ?? "tools/visual/.out/journey");
const BASE = process.argv[3] ?? "http://localhost:3300";
const ONLY = process.env.ONLY;
const MOTION = process.env.MOTION; // "reduce" | "no-preference" | undefined = both
const FORMS = [
  { name: "phone-portrait", width: 390, height: 844 },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "phone-landscape", width: 844, height: 390 },
  { name: "tablet-portrait", width: 768, height: 1024 },
];

const stopOf = (slug) => unit.stops.find((s) => s.id === `forest-animals/${slug}`);

async function instrument(ctx) {
  await ctx.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      this.playbackRate = 16;
      return play.call(this);
    };
  });
}

function makeRunner(page, dir, log) {
  const problems = [];
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
  page.on("response", (r) => r.status() >= 400 && problems.push(`http ${r.status()} ${r.url()}`));
  let n = 0;
  const shot = async (name, wait = 350) => {
    await page.waitForTimeout(wait);
    await page.screenshot({ path: path.join(dir, `${String(++n).padStart(2, "0")}-${name}.png`) });
    log(`  shot ${name}`);
  };
  return { problems, shot };
}

const card = (page, id) => page.locator(`button[data-card="${id}"]:visible`).first();
const word = (page, id) => page.locator(`button[data-word="${id}"]:visible`).first();
const sheetBtn = (page) => page.locator('[data-testid="feedback-area"]:visible button[aria-label="Continuar"]');
async function continueSheet(page) {
  await sheetBtn(page).click({ timeout: 20000 });
  await sheetBtn(page).waitFor({ state: "detached" });
}

async function solve(page, ex) {
  switch (ex.kind) {
    case "intro":
      await page.locator('main:visible button[aria-label="Continuar"]').click({ timeout: 20000 });
      break;
    case "listenTap":
      await card(page, ex.answerId).click({ timeout: 20000 });
      break;
    case "trueFalse":
      await page.getByRole("button", { name: ex.isTrue ? "Certo" : "Errado" }).click({ timeout: 20000 });
      break;
    case "matchPairs":
      for (const id of ex.wordIds) {
        await card(page, id).click({ timeout: 20000 });
        await word(page, id).click();
      }
      break;
    case "tapRepeat":
      for (const it of ex.items) await card(page, it.wordId).click({ timeout: 20000 });
      await page.locator('main:visible button[aria-label="Continuar"]').click({ timeout: 20000 });
      break;
    case "whatsMissing":
      await page.locator('[data-row="options"]:visible').waitFor({ timeout: 20000 });
      await card(page, ex.missingId).click();
      break;
    default:
      throw new Error(`unknown exercise ${ex.kind}`);
  }
  await continueSheet(page);
}

async function memoryRound(page) {
  const pill = page.locator(".k-pill-count:visible", { hasText: /^1 de \d+$/ });
  await pill.waitFor({ timeout: 20000 });
  const total = Number((await pill.textContent()).match(/de (\d+)/)[1]);
  for (let i = 0; i < total; i++) {
    await page.getByRole("button", { name: "Virar o cartão" }).click();
    await page.getByRole("button", { name: "Próximo" }).click({ timeout: 20000 });
  }
  for (let i = 0; i < total; i++) {
    await page.locator("button[data-card]:visible").first().waitFor({ timeout: 20000 });
    const asked = (await page.locator(".k-bubble:visible b[lang='en']").first().textContent()).replace(/[^a-z]/gi, "");
    await card(page, asked).click();
    await continueSheet(page);
  }
  await page.getByRole("button", { name: "Continuar" }).click({ timeout: 20000 });
}

async function journey(browser, form, motion, log) {
  const tag = `${form.name}-${motion === "reduce" ? "reduced" : "full"}`;
  const dir = path.join(OUT, tag);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: form.width, height: form.height },
    reducedMotion: motion,
    recordVideo: { dir: path.join(OUT, `videos-tmp-${process.pid}`), size: { width: form.width, height: form.height } },
  });
  await instrument(ctx);
  const page = await ctx.newPage();
  const { problems, shot } = makeRunner(page, dir, log);
  log(`\n== ${tag}`);
  let step = "start";
  try {
    // 1. first opening
    step = "opening";
    await page.goto(`${BASE}/`);
    await shot("opening-start", 600);
    if (motion !== "reduce") {
      await shot("opening-3s", 2800);
      await shot("opening-7s", 4000);
      await shot("opening-11s", 4000);
    }
    // 2. the island
    step = "island";
    const farol = page.getByRole("button", { name: "Farol das Línguas" });
    await farol.waitFor({ timeout: 25000 });
    await shot("island", 1800);
    await farol.click();
    await shot("island-farol-focus", 2500);
    await page.getByRole("button", { name: "Entrar no farol" }).click();
    // 3. farol
    step = "farol";
    await page.waitForURL(/\/farol$/);
    await page.locator(".nz-hit").first().waitFor();
    await shot("farol-arrival", 800);
    await shot("farol-ready", 3200);
    // a locked stop answers kindly
    await page.getByRole("button", { name: "Lição 2", exact: true }).click().catch(() => {});
    await shot("farol-locked-tap", 500);
    // the song then lesson 1
    for (const slug of ["song"]) {
      step = `stop ${slug}`;
      const song = stopOf(slug);
      await page.getByRole("button", { name: song.title, exact: true }).click();
      await page.waitForURL(new RegExp(`/parada/forest-animals/${slug}$`));
      await page.getByRole("button", { name: "Cantar" }).click();
      await page.locator('[data-state="current"][data-line]:visible').waitFor({ timeout: 30000 }).catch(() => {});
      await shot("song-karaoke", 300);
      await page.getByRole("button", { name: "Continuar" }).click({ timeout: 120000 });
      for (const ex of song.exercises) await solve(page, ex);
      await page.locator('[data-testid="star"]:visible').waitFor({ timeout: 20000 });
      await shot("song-closing", 600);
      await page.getByRole("button", { name: "Voltar ao farol" }).click();
      step = "return";
      await shot("return-start", 1500);
      await shot("return-mid", 3500);
      await page.waitForTimeout(6000);
      await shot("return-end", 500);
      await page.goto(`${BASE}/farol`);
      await page.locator('.nz-hit[data-status="current"]').waitFor({ timeout: 20000 });
      await shot("farol-after-song", 2500);
    }
    // lesson 1: a wrong answer, then right
    step = "lesson-1";
    const l1 = stopOf("lesson-1");
    await page.getByRole("button", { name: l1.title, exact: true }).click();
    await page.waitForURL(/\/parada\/forest-animals\/lesson-1$/);
    await shot("lesson-opening", 500);
    await page.getByRole("button", { name: "Começar" }).click();
    let wrongDone = false, again = null; // the exercise answered wrong comes back once at the end
    for (const ex of l1.exercises) {
      if (!wrongDone && ex.kind === "listenTap") {
        wrongDone = true;
        again = ex;
        const wrong = ex.optionIds.find((id) => id !== ex.answerId);
        await shot("lesson-listen", 400);
        await card(page, wrong).click();
        await page.locator('[data-kind="retry"]').waitFor({ timeout: 8000 });
        await shot("lesson-retry", 120);
        await page.locator('[data-kind="retry"]').waitFor({ state: "detached", timeout: 20000 });
        await card(page, wrong).click();
        await page.locator('[data-kind="hint"]').waitFor({ timeout: 8000 });
        await shot("lesson-hint", 500);
        await card(page, ex.answerId).click();
        await sheetBtn(page).waitFor();
        await shot("lesson-correct", 600);
        await continueSheet(page);
        continue;
      }
      await solve(page, ex);
    }
    if (again) await solve(page, again);
    await memoryRound(page);
    await page.locator('[data-testid="star"]:visible').waitFor({ timeout: 20000 });
    await shot("lesson-closing", 800);
    await page.getByRole("button", { name: "Voltar ao farol" }).click();
    // 4. the return: the farol grows, the nest threads
    step = "return";
    await shot("return-start", 1200);
    await shot("return-mid", 3000);
    await shot("return-late", 4000);
    await page.getByRole("button", { name: "Farol das Línguas" }).waitFor({ timeout: 25000 });
    await shot("return-island", 6000);
    // 5. nest
    step = "ninho";
    await page.getByRole("button", { name: "Voltar ao ninho" }).click();
    await page.waitForURL(/\/ninho$/);
    await shot("ninho", 1200);
    await page.getByRole("button", { name: "Voltar para a ilha" }).click();
    await page.waitForURL(/\/$/);
    // 6. parents: hold 2 s, then the routine at "now" so the night comes
    step = "parents";
    await page.getByRole("button", { name: "Área dos responsáveis" }).click();
    await page.waitForURL(/\/responsaveis$/);
    await shot("parents-gate", 800);
    const hold = page.locator(".np-hold");
    const box = await hold.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await shot("parents-holding", 1000);
    await page.waitForTimeout(1300);
    await page.mouse.up();
    await page.locator(".np-sheet").waitFor({ timeout: 5000 });
    await shot("parents-sheet", 600);
    await page.getByRole("button", { name: "Seguir a rotina" }).click();
    const past = new Date(Date.now() - 2 * 60_000);
    await page.locator('input[type="time"]').fill(`${String(past.getHours()).padStart(2, "0")}:${String(past.getMinutes()).padStart(2, "0")}`);
    await shot("parents-routine", 400);
    await page.locator(".np-sheet").evaluate((el) => (el.scrollTop = el.scrollHeight));
    await shot("parents-sheet-bottom", 400);
    await page.getByRole("button", { name: "Fechar" }).click();
    // 7. the night
    step = "night";
    await page.waitForURL(/\/$/);
    await shot("night-start", 1500);
    await shot("night-mid", 5000);
    await shot("night-sleep", 9000);
    await shot("night-end", 6000);
  } catch (e) {
    log(`  FAILED at step "${step}": ${String(e.message).split("\n")[0]}`);
    problems.push(`journey stopped at ${step}: ${String(e.message).split("\n")[0]}`);
    await page.screenshot({ path: path.join(dir, "99-failure.png") }).catch(() => {});
  }
  const video = page.video();
  await ctx.close();
  if (video) {
    const dest = path.join(OUT, "videos");
    fs.mkdirSync(dest, { recursive: true });
    fs.copyFileSync(await video.path(), path.join(dest, `${tag}.webm`));
  }
  log(problems.length ? `  problems:\n    ${[...new Set(problems)].join("\n    ")}` : "  no console errors, no failed requests");
  return problems;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const sandboxChromium = process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
  const browser = await chromium.launch(fs.existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {});
  const lines = [];
  const log = (l) => {
    console.log(l);
    lines.push(l);
  };
  let failed = 0;
  try {
    for (const form of FORMS) {
      if (ONLY && form.name !== ONLY) continue;
      for (const motion of ["no-preference", "reduce"]) {
        if (MOTION && motion !== MOTION) continue;
        failed += (await journey(browser, form, motion, log)).length;
      }
    }
  } finally {
    await browser.close();
    fs.rmSync(path.join(OUT, `videos-tmp-${process.pid}`), { recursive: true, force: true });
    fs.writeFileSync(path.join(OUT, `journey-${ONLY ?? "all"}.log`), lines.join("\n") + "\n");
  }
  process.exit(failed ? 1 : 0);
})();
