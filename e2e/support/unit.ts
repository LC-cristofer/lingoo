import { expect, type Page } from "@playwright/test";
import unitJson from "../../content/units/forest-animals.json";
import linesJson from "../../content/lines.json";
import type { Exercise, Lines, LessonStop, Unit } from "../../src/domain/trail/schema";

export const unit = unitJson as unknown as Unit;
export const lines = linesJson as unknown as Lines;

export function lessonStop(slug: string): LessonStop {
  const stop = unit.stops.find((s) => s.id === `${unit.id}/${slug}`);
  if (!stop || (stop.kind !== "lesson" && stop.kind !== "challenge")) throw new Error(`no lesson stop ${slug}`);
  return stop;
}

/** Every stop id before `slug`, in trail order (to seed them as done). */
export function stopsBefore(slug: string): string[] {
  const ids = unit.stops.map((s) => s.id);
  return ids.slice(0, ids.indexOf(`${unit.id}/${slug}`));
}

const card = (page: Page, id: string) => page.locator(`button[data-card="${id}"]`);

async function answerRight(page: Page, ex: Exercise) {
  switch (ex.kind) {
    case "intro":
      await page.getByRole("button", { name: "Continuar", exact: true }).click();
      return;
    case "listenTap":
      await card(page, ex.answerId).click();
      return;
    case "trueFalse":
      await page.getByRole("button", { name: ex.isTrue ? "Certo" : "Errado", exact: true }).click();
      return;
    case "matchPairs":
      for (const id of ex.wordIds) {
        await card(page, id).click();
        await page.locator(`button[data-word="${id}"]`).click();
      }
      return;
    case "tapRepeat":
      for (const item of ex.items) await card(page, item.wordId).click();
      await page.getByRole("button", { name: "Continuar", exact: true }).click();
      return;
    case "whatsMissing":
      await page.locator(`[data-row="options"] button[data-card="${ex.missingId}"]`).click();
      return;
  }
}

async function answerWrong(page: Page, ex: Exercise) {
  switch (ex.kind) {
    case "listenTap":
      await card(page, ex.optionIds.find((id) => id !== ex.answerId)!).click();
      return;
    case "trueFalse":
      await page.getByRole("button", { name: ex.isTrue ? "Errado" : "Certo", exact: true }).click();
      return;
    case "matchPairs":
      await card(page, ex.wordIds[0]).click();
      await page.locator(`button[data-word="${ex.wordIds[1]}"]`).click();
      return;
    case "whatsMissing":
      await page.locator(`[data-row="options"] button[data-card="${ex.optionIds.find((id) => id !== ex.missingId)!}"]`).click();
      return;
    default:
      throw new Error(`a ${ex.kind} exercise cannot be answered wrong`);
  }
}

export type PlayResult = { answered: number; hintSeen: boolean };

/** Taps "Começar" and plays the stop's exercises (see playExercises). */
export async function playStop(
  page: Page,
  stop: LessonStop,
  opts: { wrongTwiceAt?: number; stopAfter?: number } = {},
): Promise<PlayResult> {
  await page.getByRole("button", { name: "Começar", exact: true }).click();
  return playExercises(page, stop.exercises, opts);
}

/**
 * Answers the exercises in order, then the reviews the app queues. `wrongTwiceAt` answers that
 * exercise wrong twice (retry, then hint) before the right answer, so it must come back once at
 * the end. `stopAfter` returns after that many answered exercises.
 */
export async function playExercises(
  page: Page,
  exercises: Exercise[],
  opts: { wrongTwiceAt?: number; stopAfter?: number } = {},
): Promise<PlayResult> {
  const queue = exercises.map((ex, i) => ({ ex, wrongTwice: i === opts.wrongTwiceAt }));
  let hintSeen = false;
  let answered = 0;
  for (let i = 0; i < queue.length; i++) {
    const { ex, wrongTwice } = queue[i];
    if (wrongTwice) {
      await answerWrong(page, ex);
      const retry = page.locator('[data-kind="retry"]');
      await expect(retry).toBeVisible();
      await expect(retry).toBeHidden({ timeout: 20_000 }); // handed back after "Opa! Vamos tentar de novo."
      await answerWrong(page, ex);
      await expect(page.locator('[data-kind="hint"]')).toBeVisible();
      await expect(page.locator('[data-state="hint"], [data-glow="true"]').first()).toBeVisible();
      hintSeen = true;
      queue.push({ ex, wrongTwice: false }); // the review the app must play at the end
    }
    await answerRight(page, ex);
    await page.locator('[data-kind="correct"]').getByRole("button", { name: "Continuar" }).click();
    answered++;
    if (opts.stopAfter !== undefined && answered >= opts.stopAfter) break;
  }
  return { answered, hintSeen };
}
