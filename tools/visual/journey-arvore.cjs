#!/usr/bin/env node
// The Árvore das Letras journey on a running production build (npm run build && npx next start -p 3400):
// first open -> cadastro -> opening -> island -> tap the tree -> inside -> song -> lesson 1 (a miss, memory round) -> return
// -> story -> challenge and chest -> return (the tree grew) -> nest -> parents "Criança" (English: alphabet) -> the tree suggests branch 3.
// One video and stills per form factor and motion mode. Audio files play at 16x; the requests stay real.
//   node tools/visual/journey-arvore.cjs [outDir] [baseUrl]
//   ONLY=phone-portrait MOTION=reduce node tools/visual/journey-arvore.cjs
/* eslint-disable @typescript-eslint/no-require-imports -- a plain CommonJS script for node */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const unit = require("../../content/units/letras-1.json");

const OUT = path.resolve(process.argv[2] ?? "tools/visual/.out/journey-arvore");
const BASE = process.argv[3] ?? "http://localhost:3400";
const ONLY = process.env.ONLY;
const MOTION = process.env.MOTION;
const FORMS = [
  { name: "phone-portrait", width: 390, height: 844 },
  { name: "tablet-landscape", width: 1024, height: 768 },
];
const stopOf = (slug) => unit.stops.find((s) => s.id === `letras-1/${slug}`);
const level1 = (ex) => (ex.kind === "adaptive" ? ex.levels[0] : ex);

const card = (page, id) => page.locator(`button[data-card="${id}"]:visible`).first();
const word = (page, id) => page.locator(`button[data-word="${id}"]:visible`).first();
const sheetBtn = (page) => page.locator('[data-testid="feedback-area"]:visible button[aria-label="Continuar"]');
async function continueSheet(page) {
  await sheetBtn(page).click({ timeout: 20000 });
  await sheetBtn(page).waitFor({ state: "detached" });
}
async function solve(page, slot) {
  const ex = level1(slot);
  switch (ex.kind) {
    case "intro": await page.locator('main:visible button[aria-label="Continuar"]').click({ timeout: 20000 }); break;
    case "listenTap": await card(page, ex.answerId).click({ timeout: 20000 }); break;
    case "trueFalse": await page.getByRole("button", { name: ex.isTrue ? "Certo" : "Errado" }).click({ timeout: 20000 }); break;
    case "matchPairs":
      for (const id of ex.wordIds) { await card(page, id).click({ timeout: 20000 }); await word(page, id).click(); }
      break;
    case "tapRepeat":
      for (const it of ex.items) await card(page, it.wordId).click({ timeout: 20000 });
      await page.locator('main:visible button[aria-label="Continuar"]').click({ timeout: 20000 });
      break;
    case "whatsMissing":
      await page.locator('[data-row="options"]:visible').waitFor({ timeout: 20000 });
      await card(page, ex.missingId).click();
      break;
    default: throw new Error(`unknown exercise ${ex.kind}`);
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
    await card(page, `letter-${asked.toLowerCase()}`).click();
    await continueSheet(page);
  }
  await page.getByRole("button", { name: "Continuar" }).click({ timeout: 20000 });
}
const hold = async (page, loc) => {
  const box = await loc.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2400);
  await page.mouse.up();
};

async function journey(browser, form, motion, log) {
  const tag = `${form.name}-${motion === "reduce" ? "reduced" : "full"}`;
  const dir = path.join(OUT, tag);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: form.width, height: form.height },
    reducedMotion: motion,
    recordVideo: { dir: path.join(OUT, `videos-tmp-${tag}`), size: { width: form.width, height: form.height } },
  });
  await ctx.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { this.playbackRate = 16; return play.call(this); };
    window.__long = [];
    try {
      new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push({ t: Math.round(performance.now()), d: Math.round(e.duration) }))).observe({ type: "longtask", buffered: true });
    } catch { /* not supported */ }
  });
  const page = await ctx.newPage();
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
  const backFromStop = async (label, name) => {
    await page.locator('[data-testid="star"]:visible, [data-art][data-earned="true"]:visible').first().waitFor({ timeout: 30000 }).catch(() => {});
    await page.getByRole("button", { name: label }).click({ timeout: 20000 });
    await shot(`${name}-return-start`, 1500);
    await shot(`${name}-return-mid`, 2500);
    await page.getByTestId("island").and(page.locator('[data-phase="island"]')).waitFor({ timeout: 60000 });
    await shot(`${name}-return-end`, 800);
  };
  const enterTree = async (name) => {
    await page.getByRole("button", { name: "Árvore das Letras" }).click({ timeout: 60000 });
    await shot(`${name}-island-tree-focus`, 2600);
    await page.getByRole("button", { name: "Entrar na árvore" }).click({ timeout: 20000 });
    await page.waitForURL(/\/arvore$/);
    await shot(`${name}-arvore-arrival`, 700);
    await shot(`${name}-arvore-ready`, 3200);
  };
  log(`\n== ${tag}`);
  let step = "start";
  try {
    step = "cadastro";
    await page.goto(`${BASE}/`);
    await shot("cadastro-gate", 900);
    await hold(page, page.getByRole("button", { name: "Segure para entrar" }));
    await shot("cadastro-name", 500);
    await page.getByLabel("Nome da criança").fill("Ana");
    await page.getByRole("button", { name: "Seguir" }).click();
    await shot("cadastro-age", 500);
    await page.getByRole("button", { name: "5", exact: true }).click();
    await shot("cadastro-english", 500);
    await page.getByRole("button", { name: "Nenhum ainda" }).click();
    await shot("cadastro-ready", 400);
    await page.getByRole("button", { name: "Pronto!" }).click();
    step = "opening";
    await shot("opening-start", 800);
    if (motion !== "reduce") {
      await shot("opening-6s", 5500);
      await page.getByRole("button", { name: "Pular" }).click({ timeout: 15000 }).catch(() => {});
    }
    step = "island";
    await page.getByRole("button", { name: "Árvore das Letras" }).waitFor({ timeout: 30000 });
    await shot("island", 2000);
    await enterTree("1");
    step = "song";
    await page.locator('.nz-hit[data-stop="letras-1/song"]').click();
    await page.getByRole("button", { name: "Cantar" }).click();
    await shot("song-karaoke", 500);
    await page.getByRole("button", { name: "Continuar" }).click({ timeout: 120000 });
    for (const ex of stopOf("song").exercises) await solve(page, ex);
    await shot("song-closing", 700);
    await backFromStop("Voltar à árvore", "song");
    step = "lesson-1";
    await enterTree("2");
    await page.locator('.nz-hit[data-stop="letras-1/lesson-1"]').click();
    await shot("lesson-opening", 700);
    await page.getByRole("button", { name: "Começar" }).click();
    const l1 = stopOf("lesson-1");
    let missed = false;
    for (const slot of l1.exercises) {
      const ex = level1(slot);
      if (!missed && ex.kind === "listenTap") {
        missed = true;
        await card(page, ex.answerId).waitFor({ timeout: 20000 });
        const shown = await page.locator("button[data-card]:visible").evaluateAll((els) => els.map((e) => e.getAttribute("data-card")));
        await shot("lesson-listen", 300);
        await card(page, shown.find((id) => id !== ex.answerId)).click();
        await shot("lesson-retry", 200);
        await page.locator('[data-kind="retry"]').waitFor({ state: "detached", timeout: 20000 });
      }
      await solve(page, slot);
    }
    await shot("lesson-memory", 600);
    await memoryRound(page);
    await shot("lesson-closing", 700);
    await backFromStop("Voltar à árvore", "lesson");
    step = "story";
    // lessons 2 and 3 are played in the e2e; here they are marked done so the story and the challenge open
    await page.evaluate(() => {
      const k = "lingoo:progress:v3";
      const p = JSON.parse(localStorage.getItem(k));
      const now = new Date().toISOString();
      for (const s of ["lesson-2", "lesson-3"]) p.completedStops[`letras-1/${s}`] = now;
      localStorage.setItem(k, JSON.stringify(p));
    });
    await page.reload();
    await page.getByRole("button", { name: "Árvore das Letras" }).waitFor({ timeout: 30000 });
    await enterTree("3");
    await page.locator('.nz-hit[data-stop="letras-1/story"]').click();
    await page.getByRole("button", { name: "Começar" }).click();
    const story = stopOf("story");
    await solve(page, story.warmup);
    for (let i = 0; i < story.pages.length; i++) {
      if (i === 1) await shot("story-page", 400);
      await page.getByRole("button", { name: "Avançar" }).click({ timeout: 60000 });
    }
    await solve(page, story.question);
    await shot("story-closing", 700);
    await backFromStop("Voltar à árvore", "story");
    step = "challenge";
    await enterTree("4");
    await page.locator('.nz-hit[data-stop="letras-1/challenge"]').click();
    await page.getByRole("button", { name: "Começar" }).click();
    for (const slot of stopOf("challenge").exercises) await solve(page, slot);
    await page.locator('[data-testid="star"]:visible').waitFor({ timeout: 20000 });
    await page.getByRole("button", { name: "Continuar" }).click();
    await shot("chest-closed", 600);
    await page.getByRole("button", { name: "Abrir o baú" }).click();
    await shot("chest-open", 900);
    await page.getByRole("button", { name: "Voltar à árvore" }).click();
    await shot("final-return-start", 1500);
    await shot("final-return-mid", 2200);
    await page.getByTestId("island").and(page.locator('[data-phase="island"]')).waitFor({ timeout: 60000 });
    await shot("final-return-end", 1500);
    step = "ninho";
    await page.getByRole("button", { name: "Ninho do Nino" }).first().click();
    await page.waitForURL(/\/ninho$/);
    await shot("ninho", 1500);
    await page.getByRole("button", { name: "Voltar para a ilha" }).click();
    await page.waitForURL(/\/$/);
    step = "parents";
    await page.getByRole("button", { name: "Área dos responsáveis" }).click();
    await page.waitForURL(/\/responsaveis$/);
    await shot("parents-gate", 800);
    await hold(page, page.locator(".np-hold"));
    await page.locator(".np-sheet").waitFor({ timeout: 5000 });
    await shot("parents-crianca", 600);
    await page.getByRole("button", { name: "Sabe o alfabeto em inglês" }).click();
    await shot("parents-alphabet", 400);
    await page.getByRole("button", { name: "Fechar" }).click();
    await page.waitForURL(/\/$/);
    step = "tree-3";
    await enterTree("5");
    const cardText = await page.getByTestId("arvore").getByTestId("nino-card").textContent();
    log(`  tree card after alphabet: ${cardText}`);
    if (!/Galho\s3/.test(cardText)) problems.push(`the tree did not suggest branch 3: ${cardText}`);
    await shot("arvore-branch-3", 800);
  } catch (e) {
    log(`  FAILED at step "${step}": ${String(e.message).split("\n")[0]}`);
    problems.push(`journey stopped at ${step}: ${String(e.message).split("\n")[0]}`);
    await page.screenshot({ path: path.join(dir, "99-failure.png") }).catch(() => {});
  }
  const longs = await page.evaluate(() => window.__long).catch(() => []);
  log(`  long tasks (> 50 ms): ${longs.length}, worst ${Math.max(0, ...longs.map((l) => l.d))} ms, over 100 ms: ${longs.filter((l) => l.d > 100).length}`);
  const video = page.video();
  await ctx.close();
  if (video) {
    const dest = path.join(OUT, "videos");
    fs.mkdirSync(dest, { recursive: true });
    fs.copyFileSync(await video.path(), path.join(dest, `${tag}.webm`));
  }
  fs.rmSync(path.join(OUT, `videos-tmp-${tag}`), { recursive: true, force: true });
  log(problems.length ? `  problems:\n    ${[...new Set(problems)].join("\n    ")}` : "  no console errors, no failed requests");
  return problems;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const sandboxChromium = process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
  const browser = await chromium.launch(fs.existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {});
  const lines = [];
  const log = (l) => { console.log(l); lines.push(l); };
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
    fs.writeFileSync(path.join(OUT, `journey-${ONLY ?? "all"}-${MOTION ?? "both"}.log`), lines.join("\n") + "\n");
  }
  process.exit(failed ? 1 : 0);
})();
