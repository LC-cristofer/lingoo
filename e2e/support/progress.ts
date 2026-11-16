import type { Page } from "@playwright/test";

export const V1_KEY = "lingoo:progress:v1";
export const V2_KEY = "lingoo:progress:v2";

/**
 * Puts raw values in localStorage before the app loads. Each key is written only if it is
 * absent, so a reload inside the test keeps what the app saved instead of re-seeding.
 */
export async function seedStorage(page: Page, entries: Record<string, string>): Promise<void> {
  await page.addInitScript((e: Record<string, string>) => {
    for (const [k, v] of Object.entries(e)) if (localStorage.getItem(k) === null) localStorage.setItem(k, v);
  }, entries);
}

export function readStorage(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => localStorage.getItem(k), key);
}

/** A v2 progress value with the given stops done (dates are fixed: only presence matters). */
export function v2Progress(stopIds: string[], stickers: string[] = [], daysPlayed: string[] = []): string {
  const at = "2026-11-10T12:00:00.000Z";
  return JSON.stringify({
    completedStops: Object.fromEntries(stopIds.map((id) => [id, at])),
    stickers: Object.fromEntries(stickers.map((id) => [id, at])),
    daysPlayed,
  });
}

/** Today in the device's local time, as the app stores it in `daysPlayed`. */
export function todayKey(page: Page): Promise<string> {
  return page.evaluate(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}
