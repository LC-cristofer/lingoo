import { expect, test, type Page } from "@playwright/test";
import { audioSrc } from "../src/domain/trail/audio-id";
import { installFakeSpeech, recordAudio, spoken } from "./support/fake-speech";
import { readStorage, seedStorage, V1_KEY, V2_KEY, v2Progress } from "./support/progress";
import { lines } from "./support/unit";

const V3_KEY = "lingoo:progress:v3";
const BACKUP_KEY = "lingoo:progress:v3:backup";
const AT = "2026-11-01T12:00:00.000Z";
const V1 = JSON.stringify({ completedLessons: { "forest-animals": AT }, stickers: { "sticker-fox": AT } });
const V2 = v2Progress(["forest-animals/song", "forest-animals/lesson-1"]);

const stopState = (page: Page, label: string) => page.getByRole("button", { name: label, exact: true });

test.beforeEach(async ({ page }) => {
  await installFakeSpeech(page);
});

test.afterEach(async ({ page }) => {
  expect(await spoken(page)).toEqual([]);
});

test("progress from an older build: the trail keeps v2, the album keeps the v1 fox, old keys untouched", async ({ page }) => {
  await seedStorage(page, { [V1_KEY]: V1, [V2_KEY]: V2 });
  const audio = recordAudio(page);
  await page.goto("/mapa", { waitUntil: "networkidle" });
  await expect(stopState(page, "Música")).toHaveAttribute("data-state", "done");
  await expect(stopState(page, "Lição 1")).toHaveAttribute("data-state", "done");
  await expect(stopState(page, "Lição 2")).toHaveAttribute("data-state", "current");

  await page.getByRole("link", { name: "Álbum" }).click();
  const fox = page.locator('[data-sticker="sticker-fox"]');
  await expect(page.getByRole("region", { name: "Figurinhas especiais" })).toBeVisible();
  await fox.click();
  await expect.poll(() => audio()).toContain(audioSrc(lines.legacyFox[0]));

  expect(await readStorage(page, V1_KEY)).toBe(V1);
  expect(await readStorage(page, V2_KEY)).toBe(V2);
  expect(JSON.parse((await readStorage(page, V3_KEY))!)).toMatchObject({ version: 3, legacy: JSON.parse(V1) });

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator('[data-sticker="sticker-fox"]')).toBeVisible();
  expect(await readStorage(page, V1_KEY)).toBe(V1);
  expect(await readStorage(page, V2_KEY)).toBe(V2);
});

test("a corrupt v3 is backed up and the progress is rebuilt from v2", async ({ page }) => {
  await seedStorage(page, { [V3_KEY]: "{oops", [V2_KEY]: V2 });
  await page.goto("/mapa", { waitUntil: "networkidle" });
  await expect(stopState(page, "Lição 2")).toHaveAttribute("data-state", "current");
  expect(await readStorage(page, BACKUP_KEY)).toBe("{oops");
  expect(await readStorage(page, V2_KEY)).toBe(V2);
});
