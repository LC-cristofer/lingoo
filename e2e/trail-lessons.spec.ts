import { expect, test } from "@playwright/test";
import { audioSrc } from "../src/domain/trail/audio-id";
import { installFakeSpeech, recordAudio, spoken } from "./support/fake-speech";
import { readStorage, seedStorage, todayKey, V2_KEY, v2Progress } from "./support/progress";
import { lessonStop, lines, playStop, stopsBefore } from "./support/unit";

type StoredV2 = { completedStops: Record<string, string>; stickers: Record<string, string>; daysPlayed: string[] };
const stored = async (page: import("@playwright/test").Page) => JSON.parse((await readStorage(page, V2_KEY)) ?? "null") as StoredV2;

test.beforeEach(async ({ page }) => {
  await installFakeSpeech(page);
});

test.afterEach(async ({ page }) => {
  // Every line came from its mp3: the browser voice was never needed.
  expect(await spoken(page)).toEqual([]);
});

test("lesson-1 with a mistake: retry, hint, review at the end, star and saved progress", async ({ page }) => {
  await seedStorage(page, { [V2_KEY]: v2Progress(stopsBefore("lesson-1")) });
  const audio = recordAudio(page);
  await page.goto("/parada/forest-animals/lesson-1", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Começar", exact: true })).toBeVisible();
  expect(audio()).toEqual([]); // no audio before the first touch

  const stop = lessonStop("lesson-1");
  expect(stop.exercises[1].kind).toBe("listenTap");
  const result = await playStop(page, stop, { wrongTwiceAt: 1 });

  expect(result.hintSeen).toBe(true);
  expect(result.answered).toBe(stop.exercises.length + 1); // the wrong one came back once
  expect(audio()).toContain(audioSrc(lines.retry[0]));
  await expect(page.getByTestId("star")).toBeVisible();
  expect(Object.keys((await stored(page)).completedStops)).toContain("forest-animals/lesson-1");

  await page.reload({ waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/parada\/forest-animals\/lesson-1$/);
  await expect(page.getByRole("button", { name: "Começar", exact: true })).toBeVisible();
});

test("challenge: closing, chest, sticker and saved sticker", async ({ page }) => {
  await seedStorage(page, { [V2_KEY]: v2Progress(stopsBefore("challenge")) });
  await page.goto("/parada/forest-animals/challenge", { waitUntil: "networkidle" });
  await playStop(page, lessonStop("challenge"));

  await expect(page.getByTestId("star")).toBeVisible();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Abrir o baú" }).click();
  await expect(page.locator('[data-art][data-earned="true"]')).toBeVisible();

  const p = await stored(page);
  expect(Object.keys(p.completedStops)).toContain("forest-animals/challenge");
  expect(Object.keys(p.stickers)).toContain("sticker-forest-bear");
});

test("a locked stop goes back to the map", async ({ page }) => {
  await page.goto("/parada/forest-animals/lesson-2");
  await expect(page).toHaveURL(/\/mapa$/);
});

test("leaving mid-stop gives no credit but marks the day", async ({ page }) => {
  await seedStorage(page, { [V2_KEY]: v2Progress(stopsBefore("lesson-2")) });
  await page.goto("/parada/forest-animals/lesson-2", { waitUntil: "networkidle" });
  await playStop(page, lessonStop("lesson-2"), { stopAfter: 2 });
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/mapa$/);

  const p = await stored(page);
  expect(Object.keys(p.completedStops)).not.toContain("forest-animals/lesson-2");
  expect(p.daysPlayed).toContain(await todayKey(page));
});
