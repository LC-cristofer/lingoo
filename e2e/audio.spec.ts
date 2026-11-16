import { expect, test, type Page } from "@playwright/test";
import lesson from "../content/lessons/forest-animals.json";
import { fakeSpeechScript as installFakeSpeech, log, spoken, type FakeWindow } from "./support/fake-speech";

// The recording fake speechSynthesis lives in ./support/fake-speech (shared with the trail specs).

const songStep = lesson.steps.find((s) => s.kind === "song") as { audio: { text: string } } | undefined;
if (!songStep) throw new Error("song step missing");
const SONG = songStep.audio.text;
/** The narrator's word-based safety timeout for the song: max(4000, 400 * words). */
const SONG_TIMEOUT_MS = Math.max(4000, 400 * SONG.trim().split(/\s+/).length);

/** Hard load of the lesson URL: audio is locked until the ▶ tap. */
async function openLessonByUrl(page: Page) {
  await page.goto("/licao/forest-animals");
  const start = page.getByRole("button", { name: "Começar" });
  await expect(start).toBeVisible();
  expect(await log(page)).toEqual([]); // no audio before the first touch
  await start.click();
}

test("a lesson opened by URL asks for one ▶ tap, then the song is heard", async ({ page }) => {
  await page.addInitScript(installFakeSpeech, { holdMs: 50 });
  await openLessonByUrl(page);
  await expect.poll(() => spoken(page)).toContain(SONG);
  // The silent primer went out inside the tap, before the song.
  const entries = await log(page);
  expect(entries[0]).toBe("speak:");
  expect(entries).toContain(`speak:${SONG}`);
});

test("opening /mapa directly: the first tap anywhere unlocks audio for the lesson", async ({ page }) => {
  await page.addInitScript(installFakeSpeech, { holdMs: 50 });
  await page.goto("/mapa", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Animais da floresta" }).click();
  await expect(page).toHaveURL(/\/licao\/forest-animals$/);
  await expect.poll(() => spoken(page)).toContain(SONG);
  await expect(page.getByRole("button", { name: "Começar" })).toHaveCount(0);
});

test("tap game: wrong, then right 100 ms later, says 'Great job!' and does not re-ask", async ({ page }) => {
  await page.addInitScript(installFakeSpeech, { holdMs: 50 });
  await openLessonByUrl(page);
  const advance = page.getByRole("button", { name: "Avançar" });
  await advance.click(); // song
  for (let i = 0; i < 4; i++) await advance.click(); // story pages

  const tap = lesson.steps.find((s) => s.kind === "tap") as
    | { rounds: { prompt: { text: string }; optionIds: string[]; answerId: string }[] }
    | undefined;
  if (!tap) throw new Error("tap step missing");
  const [first, second] = tap.rounds;
  const wrong = first.optionIds.find((id) => id !== first.answerId)!;

  await page.waitForFunction((t) => (window as unknown as FakeWindow).__log.includes(`end:${t}`), first.prompt.text, {
    timeout: 10_000,
  });
  // Lines now last long enough for the right tap to land during "Let's try again!".
  await page.evaluate(() => {
    const w = window as unknown as FakeWindow;
    w.__holdMs = 800;
    w.__spoken = [];
    w.__log = [];
  });

  await page.getByRole("button", { name: wrong, exact: true }).click();
  await page.waitForTimeout(100);
  await page.getByRole("button", { name: first.answerId, exact: true }).click();

  await page.waitForFunction((t) => (window as unknown as FakeWindow).__spoken.includes(t), second.prompt.text, {
    timeout: 10_000,
  });
  expect(await spoken(page)).toEqual(["Let's try again!", "Great job!", second.prompt.text]);
  const entries = await log(page);
  expect(entries).not.toContain("dropped:Great job!");
  expect(entries).not.toContain("cancel:Great job!");
  expect(entries.indexOf("end:Great job!")).toBeGreaterThan(-1);
  expect(entries.indexOf("end:Great job!")).toBeLessThan(entries.indexOf(`speak:${second.prompt.text}`));
});

test("the song is never cut off by the safety timeout", async ({ page }) => {
  // The fake holds onend well past the narrator's safety timeout for the song.
  const songHoldMs = SONG_TIMEOUT_MS + 2500;
  await page.addInitScript(installFakeSpeech, { holdMs: 50, holdByText: { [SONG]: songHoldMs } });
  await openLessonByUrl(page);

  // The timeout only unblocks the UI: "Avançar" shows while the song is still playing...
  await expect(page.getByRole("button", { name: "Avançar" })).toBeVisible({ timeout: songHoldMs });
  expect(await log(page)).not.toContain(`end:${SONG}`);

  // ...and the song plays to its end with no cancel before it.
  await page.waitForFunction((t) => (window as unknown as FakeWindow).__log.includes(`end:${t}`), SONG, {
    timeout: songHoldMs + 5000,
  });
  const entries = await log(page);
  const end = entries.indexOf(`end:${SONG}`);
  expect(entries.slice(0, end).filter((e) => e.startsWith("cancel"))).toEqual([]);
});
