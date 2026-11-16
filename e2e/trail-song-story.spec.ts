import { expect, test, type Page } from "@playwright/test";
import { audioSrc } from "../src/domain/trail/audio-id";
import type { SongStop, StoryStop } from "../src/domain/trail/schema";
import { installFakeSpeech, recordAudio, spoken } from "./support/fake-speech";
import { readStorage, seedStorage, V2_KEY, v2Progress } from "./support/progress";
import { playExercises, stopsBefore, unit } from "./support/unit";

const song = unit.stops[0] as SongStop;
const story = unit.stops[4] as StoryStop;
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

test("story: warm-up, six told pages with a tappable animal, the question and the star", async ({ page }) => {
  await seedStorage(page, { [V2_KEY]: v2Progress(stopsBefore("story")) });
  const audio = recordAudio(page);
  await page.goto("/parada/forest-animals/story", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Começar", exact: true }).click();
  await playExercises(page, [story.warmup]);

  for (let i = 0; i < story.pages.length; i++) {
    await expect(page.locator(`[data-scene="${story.pages[i].scene}"]`)).toBeVisible();
    if (i === 1) {
      await page.locator('button[data-hotspot="bear"]').click();
      const bear = unit.words.find((w) => w.id === "bear")!;
      await expect.poll(() => audio()).toContain(audioSrc(bear.say[0]));
    }
    await page.getByRole("button", { name: "Avançar", exact: true }).click({ timeout: 30_000 });
  }

  await playExercises(page, [story.question]);
  await expect(page.getByTestId("star")).toBeVisible();
  expect(await doneStops(page)).toContain("forest-animals/story");
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
