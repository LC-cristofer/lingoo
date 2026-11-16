import { expect, test, type Page } from "@playwright/test";
import { audioSrc } from "../src/domain/trail/audio-id";
import type { SongStop } from "../src/domain/trail/schema";
import { installFakeSpeech, recordAudio, spoken } from "./support/fake-speech";
import { readStorage, V2_KEY } from "./support/progress";
import { playExercises, unit } from "./support/unit";

const song = unit.stops[0] as SongStop;
const doneStops = async (page: Page) =>
  Object.keys((JSON.parse((await readStorage(page, V2_KEY)) ?? "{}") as { completedStops?: object }).completedStops ?? {});
const currentLine = (page: Page) => page.locator("[data-line][data-current='true']").getAttribute("data-line");

test.beforeEach(async ({ page }) => {
  await installFakeSpeech(page);
});

test.afterEach(async ({ page }) => {
  expect(await spoken(page)).toEqual([]);
});

test("song: the karaoke follows the music, then the exercises give the star", async ({ page }) => {
  await page.goto("/parada/forest-animals/song", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Começar", exact: true }).click();

  await expect.poll(() => currentLine(page), { timeout: 20_000 }).toBe("1");
  await page.getByRole("button", { name: "Continuar", exact: true }).click({ timeout: 60_000 });
  await playExercises(page, song.exercises);

  await expect(page.getByTestId("star")).toBeVisible();
  expect(await doneStops(page)).toContain("forest-animals/song");
});

test("song: when the music file fails, each line is narrated and the stop completes", async ({ page }) => {
  await page.route("**/audio/song-*.mp3", (route) => route.abort());
  const audio = recordAudio(page);
  await page.goto("/parada/forest-animals/song", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Começar", exact: true }).click();

  await page.getByRole("button", { name: "Continuar", exact: true }).click({ timeout: 60_000 });
  const firstOfEachLine = song.lyrics.map((l) => audioSrc(l.say[0]));
  const requested = audio().filter((p) => firstOfEachLine.includes(p));
  expect([...new Set(requested)]).toEqual([...new Set(firstOfEachLine)]);

  await playExercises(page, song.exercises);
  await expect(page.getByTestId("star")).toBeVisible();
  expect(await doneStops(page)).toContain("forest-animals/song");
});
