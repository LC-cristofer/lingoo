import { expect, test, type Page } from "@playwright/test";
import { segmentId } from "../src/domain/trail/audio-id";
import { getLines } from "../src/domain/trail/content";

const V1_KEY = "lingoo:progress:v1";
const V2_KEY = "lingoo:progress:v2";
const V3_KEY = "lingoo:progress:v3";
const BACKUP_KEY = "lingoo:progress:v3:backup";
const AT = "2026-11-01T12:00:00.000Z";
const lines = getLines();

const V1 = JSON.stringify({ completedLessons: { "forest-animals": AT }, stickers: { "sticker-fox": AT } });
const MEMORY = { "forest-animals:bear": { box: 1, due: "2026-11-02" } };
const V2 = JSON.stringify({
  completedStops: { "forest-animals/song": AT, "forest-animals/lesson-1": AT },
  stickers: {},
  daysPlayed: ["2026-11-01"],
  memory: MEMORY,
});

/**
 * Before the page loads: writes the given keys once per tab (a reload must see what the app left, not the seed
 * again) and swaps speechSynthesis for a fake that records speak() calls (the browser voice must never be needed).
 */
async function prepare(page: Page, seed: Record<string, string>) {
  await page.addInitScript((entries: Record<string, string>) => {
    if (!sessionStorage.getItem("__seeded")) {
      for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v);
      sessionStorage.setItem("__seeded", "1");
    }
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
  }, seed);
}

function recordAudio(page: Page): () => string[] {
  const ids: string[] = [];
  page.on("request", (r) => {
    const m = new URL(r.url()).pathname.match(/^\/audio\/(.+)\.mp3$/);
    if (m) ids.push(m[1]);
  });
  return () => ids;
}

const read = (page: Page, key: string) => page.evaluate((k) => localStorage.getItem(k), key);
const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);
const stop = (page: Page, label: string) => page.getByRole("button", { name: label, exact: true });

test("progress from older builds: the trail keeps v2 and its memory, the album keeps the v1 fox, old keys untouched", async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 10, 3, 10, 0, 0) });
  await prepare(page, { [V1_KEY]: V1, [V2_KEY]: V2 });
  const audio = recordAudio(page);

  await page.goto("/farol", { waitUntil: "networkidle" });
  await expect(stop(page, "Música")).toHaveAttribute("data-status", "done");
  await expect(stop(page, "Lição 1")).toHaveAttribute("data-status", "done");
  await expect(stop(page, "Lição 2")).toHaveAttribute("data-status", "current");
  // The v1 lesson gave no extra stop.
  await expect(stop(page, "Lição 3")).toHaveAttribute("data-status", "locked");
  // The memory card carried over from v2 is due: the nest shows it, with Treinar.
  await page.goto("/album", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/ninho$/); // the old album address leads to the nest
  await expect(page.getByRole("region", { name: "Treino de memória" })).toContainText("1");
  await expect(page.getByRole("button", { name: "Treinar" })).toBeVisible();
  const special = page.getByRole("region", { name: "Figurinhas especiais" });
  await expect(special).toBeVisible();
  const fox = page.locator('[data-sticker="sticker-fox"]');
  await expect(fox).toHaveAttribute("data-earned", "true");
  await expect(fox.locator("img")).toHaveJSProperty("complete", true);
  expect(await fox.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await fox.click();
  await expect.poll(audio).toEqual(expect.arrayContaining(lines.legacyFox.map(segmentId)));
  await special.getByRole("button", { name: "Figurinhas especiais" }).click();
  await expect.poll(audio).toEqual(expect.arrayContaining(lines.legacySection.map(segmentId)));

  expect(await read(page, V1_KEY)).toBe(V1);
  expect(await read(page, V2_KEY)).toBe(V2);
  expect(JSON.parse((await read(page, V3_KEY))!)).toMatchObject({
    version: 3,
    completedStops: JSON.parse(V2).completedStops,
    memory: MEMORY,
    legacy: JSON.parse(V1),
  });

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator('[data-sticker="sticker-fox"]')).toBeVisible();
  expect(await read(page, V1_KEY)).toBe(V1);
  expect(await read(page, V2_KEY)).toBe(V2);
  expect(await spoken(page)).toEqual([]);
});

test("v1 alone: no stop credit on the trail, the fox kept in the album", async ({ page }) => {
  await prepare(page, { [V1_KEY]: V1 });
  await page.goto("/farol", { waitUntil: "networkidle" });
  await expect(stop(page, "Música")).toHaveAttribute("data-status", "current");
  await expect(stop(page, "Lição 1")).toHaveAttribute("data-status", "locked");
  await page.goto("/ninho", { waitUntil: "networkidle" });
  await expect(page.locator('[data-sticker="sticker-fox"]')).toBeVisible();
  expect(await read(page, V1_KEY)).toBe(V1);
  expect(await read(page, V2_KEY)).toBeNull();
});

test("a corrupt v3 is backed up and the progress is rebuilt from v2", async ({ page }) => {
  await prepare(page, { [V3_KEY]: "{oops", [V2_KEY]: V2 });
  await page.goto("/farol", { waitUntil: "networkidle" });
  await expect(stop(page, "Lição 2")).toHaveAttribute("data-status", "current");
  expect(await read(page, BACKUP_KEY)).toBe("{oops");
  expect(await read(page, V2_KEY)).toBe(V2);
  expect(JSON.parse((await read(page, V3_KEY))!)).toMatchObject({ version: 3, completedStops: JSON.parse(V2).completedStops });
});
