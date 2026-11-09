import { expect, test, type Page } from "@playwright/test";
import lesson from "../content/lessons/forest-animals.json";

// A recording fake speechSynthesis, so the e2e can hear audio bugs (final review I1-I4).
// It queues utterances like a real engine, fires onend after a hold, logs speak/cancel/end,
// and drops an utterance spoken in the same task as cancel(), as Chrome and Safari do.

type FakeOptions = { holdMs: number; holdByText?: Record<string, number> };
type FakeWindow = Window & { __spoken: string[]; __log: string[]; __holdMs: number };

function installFakeSpeech({ holdMs, holdByText = {} }: FakeOptions) {
  const w = window as unknown as FakeWindow;
  w.__spoken = [];
  w.__log = [];
  w.__holdMs = holdMs;

  class FakeUtterance {
    lang = "";
    rate = 1;
    volume = 1;
    voice: unknown = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public text: string) {}
  }

  const queue: FakeUtterance[] = [];
  let current: FakeUtterance | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelledThisTask = false;

  const startNext = () => {
    current = queue.shift() ?? null;
    const u = current;
    if (!u) return;
    timer = setTimeout(() => {
      if (current !== u) return;
      current = null;
      w.__log.push(`end:${u.text}`);
      u.onend?.();
      startNext();
    }, holdByText[u.text] ?? w.__holdMs);
  };

  const synth = {
    get speaking() {
      return current !== null;
    },
    get pending() {
      return queue.length > 0;
    },
    paused: false,
    getVoices: () => [],
    speak(u: FakeUtterance) {
      if (cancelledThisTask) {
        w.__log.push(`dropped:${u.text}`);
        return;
      }
      w.__log.push(`speak:${u.text}`);
      if (u.text) w.__spoken.push(u.text);
      queue.push(u);
      if (!current) startNext();
    },
    cancel() {
      w.__log.push(`cancel:${current?.text ?? ""}`);
      queue.length = 0;
      current = null;
      clearTimeout(timer);
      cancelledThisTask = true;
      queueMicrotask(() => {
        cancelledThisTask = false;
      });
    },
    pause() {},
    resume() {},
    addEventListener() {},
    removeEventListener() {},
  };

  Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, writable: true, value: FakeUtterance });
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synth });
}

const spoken = (page: Page) => page.evaluate(() => (window as unknown as FakeWindow).__spoken);
const log = (page: Page) => page.evaluate(() => (window as unknown as FakeWindow).__log);

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
