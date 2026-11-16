import { expect, test } from "@playwright/test";
import { audioSrc } from "../src/domain/trail/audio-id";
import { installFakeSpeech, recordAudio, spoken } from "./support/fake-speech";
import { seedStorage, V2_KEY, v2Progress } from "./support/progress";
import { lines, unit } from "./support/unit";

test.beforeEach(async ({ page }) => {
  await installFakeSpeech(page);
});

test.afterEach(async ({ page }) => {
  expect(await spoken(page)).toEqual([]);
});

test("start screen → map → the current stop opens, and ✕ comes back to the map", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Jogar" }).click();
  await expect(page).toHaveURL(/\/mapa$/);

  const song = page.getByRole("button", { name: "Música", exact: true });
  await expect(song).toHaveAttribute("data-state", "current");
  await expect(song).toBeInViewport();
  for (const label of ["Lição 1", "Lição 2", "Lição 3", "História", "Desafio"]) {
    await expect(page.getByRole("button", { name: label, exact: true })).toHaveAttribute("aria-disabled", "true");
  }

  await song.click();
  await expect(page).toHaveURL(/\/parada\/forest-animals\/song$/);
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/mapa$/);
});

test("opening /mapa directly: the first tap (on a stop) unlocks audio for the stop", async ({ page }) => {
  const audio = recordAudio(page);
  await page.goto("/mapa", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Música", exact: true }).click();
  await expect(page).toHaveURL(/\/parada\/forest-animals\/song$/);
  await expect.poll(() => audio()).toContain(audioSrc(unit.stops[0].opening[0]));
});

test("a locked stop says it is locked and stays on the map", async ({ page }) => {
  const audio = recordAudio(page);
  await page.goto("/mapa", { waitUntil: "networkidle" });
  // A child can tap a locked stop: force past Playwright's aria-disabled actionability wait.
  await page.getByRole("button", { name: "Lição 2", exact: true }).click({ force: true });
  await expect.poll(() => audio()).toContain(audioSrc(lines.lockedStop[0]));
  await expect(page).toHaveURL(/\/mapa$/);
});

test("progress shows on the map: done stops, the current one, the sign and the stars", async ({ page }) => {
  await seedStorage(page, { [V2_KEY]: v2Progress(["forest-animals/song", "forest-animals/lesson-1"]) });
  await page.goto("/mapa", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Música", exact: true })).toHaveAttribute("data-state", "done");
  await expect(page.getByRole("button", { name: "Lição 1", exact: true })).toHaveAttribute("data-state", "done");
  await expect(page.getByRole("button", { name: "Lição 2", exact: true })).toHaveAttribute("data-state", "current");
  await expect(page.getByText("2 de 6")).toBeVisible();
  await expect(page.getByLabel("2 estrelas")).toBeVisible();
});

test("the map never scrolls sideways", async ({ page }) => {
  await page.goto("/mapa", { waitUntil: "networkidle" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
