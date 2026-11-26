import { expect, test, type Locator, type Page } from "@playwright/test";
import { skipOnboarding } from "./helpers";
import { segmentId } from "../src/domain/trail/audio-id";
import { getLines, getUnit } from "../src/domain/trail/content";
import type { Exercise, Narration, Stop } from "../src/domain/trail/schema";

const unit = getUnit("forest-animals")!;
const lines = getLines();
const stopOf = (slug: string): Stop => unit.stops.find((s) => s.id === `forest-animals/${slug}`)!;
const idsOf = (n: Narration) => n.map(segmentId);
const labelOf = (stop: Stop) => (stop.kind === "story" ? "História" : stop.title);

/**
 * Before the page loads: a fake speechSynthesis that records every speak() (the browser voice must never be
 * needed), and audio files played at 16x so the whole unit takes minutes, not an hour. The requests stay real.
 */
async function instrument(page: Page) {
  await skipOnboarding(page);
  await page.addInitScript(() => {
    const spoken: string[] = [];
    (window as unknown as { __spoken: string[] }).__spoken = spoken;
    const fake = {
      speaking: false,
      pending: false,
      paused: false,
      onvoiceschanged: null,
      speak(u: SpeechSynthesisUtterance) {
        spoken.push(u.text);
        setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 0);
      },
      cancel() {},
      pause() {},
      resume() {},
      getVoices: () => [],
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => true,
    };
    Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      this.playbackRate = 16;
      return play.call(this);
    };
  });
}

type Net = { requested: string[]; failed: string[] };

function watchAudio(page: Page): Net {
  const net: Net = { requested: [], failed: [] };
  page.on("request", (r) => {
    const m = new URL(r.url()).pathname.match(/^\/audio\/(.+)\.mp3$/);
    if (m) net.requested.push(m[1]);
  });
  page.on("response", (r) => {
    if (new URL(r.url()).pathname.startsWith("/audio/") && r.status() >= 400) net.failed.push(`${r.status()} ${r.url()}`);
  });
  return net;
}

const spokenCount = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken.length);
const card = (page: Page, id: string): Locator => page.locator(`button[data-card="${id}"]:visible`).first();
const word = (page: Page, id: string): Locator => page.locator(`button[data-word="${id}"]:visible`).first();
const sheetContinue = (page: Page): Locator => page.locator('[data-testid="feedback-area"]:visible button[aria-label="Continuar"]');
const sheet = (page: Page): Locator => page.locator('[data-testid="feedback-area"]:visible [data-kind]');

async function continueSheet(page: Page) {
  await sheetContinue(page).click({ timeout: 20_000 });
  await expect(sheetContinue(page)).toHaveCount(0);
}

/** Answers one exercise right (a wrong first answer is staged by the caller). */
async function solve(page: Page, ex: Exercise) {
  switch (ex.kind) {
    case "intro":
      await page.locator('main:visible button[aria-label="Continuar"]').click({ timeout: 20_000 });
      break;
    case "listenTap":
      await card(page, ex.answerId).click({ timeout: 20_000 });
      break;
    case "trueFalse":
      await page.getByRole("button", { name: ex.isTrue ? "Certo" : "Errado" }).click({ timeout: 20_000 });
      break;
    case "matchPairs":
      for (const id of ex.wordIds) {
        await card(page, id).click({ timeout: 20_000 });
        await word(page, id).click();
      }
      break;
    case "tapRepeat":
      for (const it of ex.items) await card(page, it.wordId).click({ timeout: 20_000 });
      await page.locator('main:visible button[aria-label="Continuar"]').click({ timeout: 20_000 });
      break;
    case "whatsMissing":
      await page.locator('[data-row="options"]:visible').waitFor({ timeout: 20_000 });
      await card(page, ex.missingId).click();
      break;
  }
  await continueSheet(page);
}

/** The memory round: flip every card, then check every card right on the first tap. Returns the card count. */
async function memoryRound(page: Page): Promise<number> {
  // Only the visible memory pill: the map's sign ("1 de 6") can still be in the page, hidden, as the lesson starts.
  const pill = page.locator(".k-pill-count:visible", { hasText: /^1 de \d+$/ });
  await expect(pill).toBeVisible({ timeout: 20_000 });
  const total = Number((await pill.textContent())!.match(/de (\d+)/)![1]);
  for (let i = 0; i < total; i++) {
    await page.getByRole("button", { name: "Virar o cartão" }).click();
    await page.getByRole("button", { name: "Próximo" }).click({ timeout: 20_000 });
  }
  for (let i = 0; i < total; i++) {
    await expect(page.locator("button[data-card]:visible").first()).toBeVisible({ timeout: 20_000 });
    const asked = (await page.locator(".k-bubble:visible b[lang='en']").first().textContent())!.replace(/[^a-z]/gi, "");
    await card(page, asked).click();
    await continueSheet(page);
  }
  await page.getByRole("button", { name: "Continuar" }).click({ timeout: 20_000 }); // the summary
  return total;
}

/** The stops are the landings of the farol's staircase (/farol). */
async function openFromFarol(page: Page, slug: string) {
  await page.getByRole("button", { name: labelOf(stopOf(slug)), exact: true }).click({ timeout: 20_000 });
  await expect(page).toHaveURL(new RegExp(`/parada/forest-animals/${slug}$`));
}

/**
 * Finishing a stop lands on the start page (?volta=<stop>); the next stop is entered from the farol again, all by
 * client-side navigation (pin, "Entrar no farol"), so a screen the router keeps alive is covered too.
 */
async function backToFarol(page: Page) {
  await expect(page.locator('[data-testid="star"]:visible')).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Voltar ao farol" }).click();
  await expect(page).toHaveURL(/\/\?volta=forest-animals%2F/);
  await page.getByRole("button", { name: "Farol das Línguas" }).click({ timeout: 60_000 });
  await page.getByRole("button", { name: "Entrar no farol" }).click({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/farol$/);
  await expect(page.locator('.nz-hit[data-status="current"], .nz-hit[data-status="done"]').first()).toBeVisible({ timeout: 20_000 });
}

/** A lesson played through. `wrongAt` is the index of an exercise answered wrong, then wrong again, then right. */
async function playLesson(page: Page, net: Net, slug: string, wrongAt?: number) {
  const stop = stopOf(slug);
  if (stop.kind !== "lesson") throw new Error("not a lesson");
  await openFromFarol(page, slug);
  await page.getByRole("button", { name: "Começar" }).click();
  for (let i = 0; i < stop.exercises.length; i++) {
    const ex = stop.exercises[i];
    if (i === wrongAt && ex.kind === "listenTap") {
      const wrong = ex.optionIds.find((id) => id !== ex.answerId)!;
      await card(page, wrong).click({ timeout: 20_000 });
      await expect(sheet(page)).toHaveAttribute("data-kind", "retry");
      await expect(sheet(page)).toContainText("Opa! Vamos tentar de novo.");
      await expect.poll(() => lines.retry.every((s) => net.requested.includes(segmentId(s)))).toBe(true);
      await expect(sheet(page)).toHaveCount(0, { timeout: 20_000 }); // the retry hands the exercise back
      await card(page, wrong).click();
      await expect(sheet(page)).toHaveAttribute("data-kind", "hint");
      await expect(card(page, ex.answerId)).toHaveAttribute("data-state", "hint"); // the right card glows
    }
    await solve(page, ex);
  }
  if (wrongAt !== undefined) {
    // The exercise answered wrong comes back once, at the end.
    const again = stop.exercises[wrongAt];
    await expect(card(page, (again as Extract<Exercise, { kind: "listenTap" }>).answerId)).toBeVisible({ timeout: 20_000 });
    await solve(page, again);
  }
  return memoryRound(page);
}

test("one full unit: song, three lessons, story, challenge, memory and persistence", async ({ page }) => {
  test.setTimeout(900_000);
  const start = new Date(2026, 10, 12, 10, 0, 0);
  await page.clock.install({ time: start });
  await instrument(page);
  const net = watchAudio(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await test.step("the island, the farol pin, then up the staircase", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: "Farol das Línguas" }).click();
    await page.getByRole("button", { name: "Entrar no farol" }).click();
    await expect(page).toHaveURL(/\/farol$/);
    await expect(page.getByRole("button", { name: labelOf(stopOf("song")), exact: true })).toHaveAttribute("data-status", "current");
    // A locked stop (the next one up the stairs) does not open: the card says what to do instead.
    await page.getByRole("button", { name: labelOf(stopOf("lesson-1")), exact: true }).click({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/farol$/);
    await expect(page.locator('[data-testid="nino-card"]:visible')).toContainText("Essa parada ainda está trancada. Termine a anterior primeiro!");
  });

  await test.step("back from the farol the island is usable again (no veil, pins clickable)", async () => {
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole("button", { name: "Farol das Línguas" }).click({ timeout: 20_000 });
    await page.getByRole("button", { name: "Entrar no farol" }).click();
    await expect(page).toHaveURL(/\/farol$/);
  });

  await test.step("leaving a stop with the ✕ goes back to the farol", async () => {
    await openFromFarol(page, "song");
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/farol$/);
  });

  await test.step("Música: karaoke, 3 exercises, star", async () => {
    const song = stopOf("song");
    if (song.kind !== "song") throw new Error("song expected");
    await openFromFarol(page, "song");
    await page.getByRole("button", { name: "Cantar" }).click();
    await expect(page.locator('[data-state="current"][data-line]:visible')).toBeVisible({ timeout: 30_000 });
    await expect.poll(() => net.requested.includes("song-forest-animals")).toBe(true);
    await page.getByRole("button", { name: "Continuar" }).click({ timeout: 120_000 });
    for (const ex of song.exercises) await solve(page, ex);
    await backToFarol(page);
  });

  await test.step("a finished stop opened again starts fresh (the kept-alive screen is reset), and quitting it does not replay the return", async () => {
    await openFromFarol(page, "song");
    await expect(page.getByRole("button", { name: "Cantar" })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-testid="star"]:visible')).toHaveCount(0);
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/farol$/);
  });

  await test.step("Lição 1 with one deliberate wrong answer, then the memory round", async () => {
    const cards = await playLesson(page, net, "lesson-1", 1);
    expect(cards).toBe(3);
    // 3 right on the first tap: "Yes! You remembered!" and memoryDone[3].
    for (const id of idsOf(lines.memoryPraise)) expect(net.requested).toContain(id);
    for (const id of idsOf(lines.memoryDone[3])) expect(net.requested).toContain(id);
    await backToFarol(page);
  });

  await test.step("the day rolls over on an open nest and the training shows its cards", async () => {
    await page.goto("/ninho");
    const memory = page.getByRole("region", { name: "Treino de memória" });
    await expect(memory.getByText("Tudo em dia!")).toBeVisible(); // today's cards were just trained: none is due
    await page.clock.fastForward("24:00:00");
    await expect(memory.getByText("cartões prontos hoje")).toBeVisible({ timeout: 10_000 }); // no reload needed
    await expect(memory.getByText("3", { exact: true })).toBeVisible();
    await memory.getByRole("button", { name: "Treinar" }).click();
    await expect(page).toHaveURL(/\/memoria$/);
    await expect(page.locator(".k-mem-count:visible")).toContainText("cartões prontos hoje");
    for (const id of idsOf(lines.memoryHome)) await expect.poll(() => net.requested.includes(id)).toBe(true);
    await page.getByRole("button", { name: "Treinar" }).click();
    expect(await memoryRound(page)).toBe(3);
    await expect(page.getByText("Próximo treino: em 3 dias").locator("visible=true")).toBeVisible({ timeout: 20_000 }); // box 2: three days
    await page.getByRole("button", { name: "Voltar ao ninho" }).click();
    await expect(page).toHaveURL(/\/ninho$/);
    await expect(memory.getByText("Tudo em dia!")).toBeVisible();
    await page.getByRole("button", { name: "Voltar para a ilha" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/farol");
  });

  await test.step("Lição 2 and Lição 3", async () => {
    await playLesson(page, net, "lesson-2");
    await backToFarol(page);
    await playLesson(page, net, "lesson-3");
    await backToFarol(page);
  });

  await test.step("História: 6 pages and a hotspot", async () => {
    const story = stopOf("story");
    if (story.kind !== "story") throw new Error("story expected");
    expect(story.pages).toHaveLength(6);
    await openFromFarol(page, "story");
    await page.getByRole("button", { name: "Começar" }).click();
    await solve(page, story.warmup);
    for (let i = 0; i < story.pages.length; i++) {
      const hotspot = story.pages[i].hotspots[0];
      if (i === 1 && hotspot) {
        const say = unit.words.find((w) => w.id === hotspot.wordId)!.say;
        await page.locator(`button[data-hotspot="${hotspot.wordId}"]:visible`).click({ timeout: 20_000 });
        for (const id of idsOf(say)) await expect.poll(() => net.requested.includes(id)).toBe(true);
      }
      await page.getByRole("button", { name: "Avançar" }).click({ timeout: 60_000 });
    }
    await solve(page, story.question);
    await backToFarol(page);
  });

  await test.step("Desafio, chest and sticker", async () => {
    const challenge = stopOf("challenge");
    if (challenge.kind !== "challenge") throw new Error("challenge expected");
    await openFromFarol(page, "challenge");
    await page.getByRole("button", { name: "Começar" }).click();
    for (const ex of challenge.exercises) await solve(page, ex);
    await expect(page.locator('[data-testid="star"]:visible')).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Abrir o baú" }).click();
    await expect(page.locator('[data-art="bear"][data-earned="true"]:visible')).toBeVisible();
    await expect.poll(() => net.requested.includes("sfx/chest")).toBe(true);
    await page.getByRole("button", { name: "Voltar ao farol" }).click();
    await expect(page).toHaveURL(/\/\?volta=forest-animals%2Fchallenge$/);
  });

  const checkEverything = async () => {
    await page.goto("/farol");
    await expect(page.locator('.nz-hit[data-status="done"]')).toHaveCount(6);
    await expect(page.locator('[data-testid="nino-card"]:visible')).toContainText("6 de 6");
    await page.goto("/ninho");
    await expect(page.locator('[data-art="bear"][data-earned="true"]:visible')).toBeVisible();
  };

  await test.step("the farol shows 6 done stops and the nest the sticker", checkEverything);
  await test.step("reloading keeps everything", async () => {
    await page.reload();
    await expect(page.locator('[data-art="bear"][data-earned="true"]:visible')).toBeVisible();
    await checkEverything();
  });

  await test.step("every line had a file: no browser voice, no failed audio request", async () => {
    expect(await spokenCount(page)).toBe(0);
    expect(net.failed).toEqual([]);
    expect(errors).toEqual([]);
  });
});

// Review Focus 5: phone portrait and tablet landscape, no horizontal scroll, big enough buttons and tiles.
for (const vp of [
  { name: "phone portrait", width: 390, height: 844 },
  { name: "tablet landscape", width: 1024, height: 768 },
  { name: "phone landscape", width: 844, height: 390 },
]) {
  test(`fits ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await instrument(page);

    const measure = async (label: string, expectTiles = false) => {
      await page.waitForTimeout(500);
      const m = await page.evaluate(() => {
        const bad: string[] = [];
        const de = document.scrollingElement!;
        const tiles: number[] = [];
        for (const el of document.querySelectorAll<HTMLElement>("button, a")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue; // not in the visible area
          const isTile = el.hasAttribute("data-card");
          if (isTile) tiles.push(Math.round(Math.min(r.width, r.height)));
          const min = isTile ? (innerHeight <= 520 ? 96 : 120) : 64; // a phone on its side fits cards of 96 px and up
          if (r.width < min - 0.5 || r.height < min - 0.5) bad.push(`${el.getAttribute("aria-label") ?? el.textContent} is ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
        return { scrollWidth: de.scrollWidth, scrollHeight: de.scrollHeight, innerWidth, innerHeight, bad, tiles };
      });
      expect(m.scrollWidth, `${label}: horizontal scroll`).toBeLessThanOrEqual(m.innerWidth);
      if (m.innerHeight <= 520) expect(m.scrollHeight, `${label}: vertical scroll on a phone on its side`).toBeLessThanOrEqual(m.innerHeight + 1);
      expect(m.bad, `${label}: small controls`).toEqual([]);
      if (expectTiles) expect(m.tiles.length, `${label}: tiles`).toBe(4);
    };

    await page.goto("/");
    await expect(page.getByRole("button", { name: "Farol das Línguas" })).toBeVisible();
    await measure("island");
    await page.goto("/farol");
    await expect(page.locator(".nz-hit").first()).toBeAttached();
    await measure("farol");
    await page.goto("/parada/forest-animals/lesson-2?revisao=1");
    await page.getByRole("button", { name: "Começar" }).waitFor();
    await measure("lesson opening");
    await page.getByRole("button", { name: "Começar" }).click();
    const lesson = stopOf("lesson-2");
    if (lesson.kind !== "lesson") throw new Error("lesson expected");
    for (const ex of lesson.exercises) {
      if (ex.kind === "listenTap" && ex.optionIds.length === 4) {
        await expect(card(page, ex.answerId)).toBeVisible({ timeout: 20_000 });
        await measure("exercise with 4 tiles", true);
        break;
      }
      await solve(page, ex);
    }
    await page.goto("/parada/forest-animals/story?revisao=1");
    await page.getByRole("button", { name: "Começar" }).click();
    const story = stopOf("story");
    if (story.kind !== "story") throw new Error("story expected");
    await solve(page, story.warmup);
    await page.getByRole("button", { name: "Avançar" }).waitFor({ timeout: 60_000 });
    await measure("story page");
  });
}
