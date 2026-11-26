import { expect, test, type Locator, type Page } from "@playwright/test";
import { PROFILE_KEY, skipOnboarding } from "./helpers";
import { getUnit } from "../src/domain/trail/content";
import { resolve } from "../src/domain/nestoy/level";
import type { Exercise, Stop, StopExercise } from "../src/domain/trail/schema";

const unit = getUnit("letras-1")!;
const stopOf = (slug: string): Stop => unit.stops.find((s) => s.id === `letras-1/${slug}`)!;

/**
 * Before the page loads: a child who put the cadastro off but said "no English yet" (the tree starts at branch 1),
 * a fake speechSynthesis (no browser voice is ever needed) and audio files played at 16x.
 */
async function instrument(page: Page) {
  await page.addInitScript((key: string) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify({ version: 1, name: "", age: null, english: "none", onboarding: "skipped", createdAt: null, islands: { descoberta: { letras: { levels: {} } } } }));
    }
  }, PROFILE_KEY);
  await skipOnboarding(page); // writes nothing over the profile above
  await page.addInitScript(() => {
    const spoken: string[] = [];
    (window as unknown as { __spoken: string[] }).__spoken = spoken;
    const fake = {
      speaking: false, pending: false, paused: false, onvoiceschanged: null,
      speak(u: SpeechSynthesisUtterance) {
        spoken.push(u.text);
        setTimeout(() => u.onend?.(new Event("end") as SpeechSynthesisEvent), 0);
      },
      cancel() {}, pause() {}, resume() {}, getVoices: () => [], addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true,
    };
    Object.defineProperty(window, "speechSynthesis", { value: fake, configurable: true });
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      this.playbackRate = 16;
      return play.call(this);
    };
  });
}

const card = (page: Page, id: string): Locator => page.locator(`button[data-card="${id}"]:visible`).first();
const word = (page: Page, id: string): Locator => page.locator(`button[data-word="${id}"]:visible`).first();
const sheetContinue = (page: Page): Locator => page.locator('[data-testid="feedback-area"]:visible button[aria-label="Continuar"]');
const sheet = (page: Page): Locator => page.locator('[data-testid="feedback-area"]:visible [data-kind]');
const thread = (page: Page, i: number): Locator => page.locator(`#Lisl .thread[data-i="${i}"]`);

async function continueSheet(page: Page) {
  await sheetContinue(page).click({ timeout: 20_000 });
  await expect(sheetContinue(page)).toHaveCount(0);
}

/** Answers one exercise right. An adaptive slot keeps its answer at every level, so level 1 says what to tap. */
async function solve(page: Page, slot: StopExercise) {
  const ex: Exercise = resolve(slot, 1);
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

/** The lesson's memory round: flip every card, then tap each asked letter. */
async function memoryRound(page: Page): Promise<number> {
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
    // every option is a letter card (the check asks among letters)
    for (const id of await page.locator("button[data-card]:visible").evaluateAll((els) => els.map((e) => e.getAttribute("data-card")))) expect(id).toMatch(/^letter-/);
    await card(page, `letter-${asked.toLowerCase()}`).click();
    await continueSheet(page);
  }
  await page.getByRole("button", { name: "Continuar" }).click({ timeout: 20_000 }); // the summary
  return total;
}

/** From the island: the tree's pin, Nino walks there, "Entrar na árvore" dives into the trunk. */
async function enterTree(page: Page) {
  await page.getByRole("button", { name: "Árvore das Letras" }).click({ timeout: 60_000 });
  await expect(page.getByTestId("island").getByTestId("nino-card")).toContainText("Galho 1: ABC: A a M");
  await page.getByRole("button", { name: "Entrar na árvore" }).click({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/arvore$/);
}

/** A finished stop's "Voltar à árvore" opens the island's return on the tree. */
async function backFromStop(page: Page, slug: string) {
  await expect(page.locator('[data-testid="star"]:visible')).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Voltar à árvore" }).click();
  // the island swaps ?volta=letras-1%2F<slug> for "/" as soon as it reads it (a reload must not replay the return)
  await expect(page).toHaveURL(new RegExp(`/(\\?volta=letras-1%2F${slug})?$`));
  await expect(page.getByTestId("island")).toHaveAttribute("data-return", "arvore", { timeout: 20_000 });
  await expect(page.getByTestId("island")).toHaveAttribute("data-phase", "island", { timeout: 60_000 });
}

test("the tree on the island: enter, play, come back to the tree, the coral thread and the nest's section", async ({ page }) => {
  test.setTimeout(600_000);
  await page.clock.install({ time: new Date(2026, 10, 26, 10, 0, 0) });
  await instrument(page);
  const failed: string[] = [];
  page.on("response", (r) => {
    if (new URL(r.url()).pathname.startsWith("/audio/") && r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await test.step("the island: the tree is ready (no scaffold) and glows as the next step; no thread yet", async () => {
    await page.goto("/");
    const pin = page.getByRole("button", { name: "Árvore das Letras" });
    await expect(pin).toHaveAttribute("data-state", "pronto");
    await expect(page.locator("#Lisl .obra")).toHaveCount(0);
    await expect(page.locator("#Lisl .arvore-l2")).toHaveAttribute("opacity", /^0(\.0+)?$/); // level 1: a plain crown
    await expect(thread(page, 1)).toHaveAttribute("opacity", "0");
  });

  await test.step("tap the tree, enter: the inside opens on branch 1's song", async () => {
    await enterTree(page);
    await expect(page.locator('.nz-hit[data-stop="letras-1/song"]')).toHaveAttribute("data-status", "current", { timeout: 20_000 });
    await page.locator('.nz-hit[data-stop="letras-1/song"]').click();
    await expect(page).toHaveURL(/\/parada\/letras-1\/song$/);
  });

  await test.step("Música: karaoke and its exercises, then back on the island focused on the tree with the coral thread", async () => {
    const song = stopOf("song");
    if (song.kind !== "song") throw new Error("song expected");
    await page.getByRole("button", { name: "Cantar" }).click();
    await page.getByRole("button", { name: "Continuar" }).click({ timeout: 120_000 });
    for (const ex of song.exercises) await solve(page, ex);
    await backFromStop(page, "song");
    await expect(thread(page, 1)).toHaveAttribute("opacity", "1"); // Letras' coral thread
    await expect(thread(page, 0)).toHaveAttribute("opacity", "0"); // the farol was never played
  });

  await test.step("Lição 1 with one wrong answer, then right; the memory round asks letters", async () => {
    await enterTree(page);
    const hit = page.locator('.nz-hit[data-stop="letras-1/lesson-1"]');
    await expect(hit).toHaveAttribute("data-status", "current", { timeout: 20_000 });
    await hit.click();
    await expect(page).toHaveURL(/\/parada\/letras-1\/lesson-1$/);
    const lesson = stopOf("lesson-1");
    if (lesson.kind !== "lesson") throw new Error("lesson expected");
    await page.getByRole("button", { name: "Começar" }).click();
    let wrongAt = -1;
    for (let i = 0; i < lesson.exercises.length; i++) {
      const ex = resolve(lesson.exercises[i], 1);
      if (wrongAt < 0 && ex.kind === "listenTap") {
        wrongAt = i;
        await expect(card(page, ex.answerId)).toBeVisible({ timeout: 20_000 });
        const shown = await page.locator("button[data-card]:visible").evaluateAll((els) => els.map((e) => e.getAttribute("data-card")!));
        const wrong = shown.find((id) => id !== ex.answerId)!;
        await card(page, wrong).click();
        await expect(sheet(page)).toHaveAttribute("data-kind", "retry");
        await expect(sheet(page)).toContainText("Opa! Vamos tentar de novo.");
        await expect(sheet(page)).toHaveCount(0, { timeout: 20_000 }); // the retry hands the exercise back
      }
      await solve(page, lesson.exercises[i]);
    }
    expect(wrongAt).toBeGreaterThanOrEqual(0);
    expect(await memoryRound(page)).toBe(4);
    await backFromStop(page, "lesson-1");
    await expect(thread(page, 1)).toHaveAttribute("opacity", "1");
  });

  await test.step("the nest keeps the coral thread and shows the Árvore das Letras section", async () => {
    await page.getByRole("button", { name: "Ninho do Nino" }).first().click();
    await expect(page).toHaveURL(/\/ninho$/);
    const section = page.getByRole("region", { name: "Árvore das Letras" });
    await expect(section).toBeVisible();
    await expect(section.locator("button.nn-sticker")).toHaveCount(4);
    await expect(thread(page, 1)).toHaveAttribute("opacity", "1");
  });

  await test.step("replaying the finished song and finishing it again: no return on the island (no growth, no thread replay)", async () => {
    await page.goto("/parada/letras-1/song");
    await page.getByRole("button", { name: "Cantar" }).click();
    await page.getByRole("button", { name: "Continuar" }).click({ timeout: 120_000 });
    const song = stopOf("song");
    if (song.kind !== "song") throw new Error("song expected");
    for (const ex of song.exercises) await solve(page, ex);
    await expect(page.locator('[data-testid="star"]:visible')).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Voltar à árvore" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("island")).toHaveAttribute("data-phase", "island", { timeout: 20_000 });
    await expect(page.getByTestId("island")).toHaveAttribute("data-return", "none");
  });

  await test.step("every line had a file: no browser voice, no failed audio request, no page error", async () => {
    // (the first tap after a page load unlocks the voice with an empty utterance: that is not a line)
    expect(await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken.filter((t) => t !== ""))).toEqual([]);
    expect(failed).toEqual([]);
    expect(errors).toEqual([]);
  });
});
