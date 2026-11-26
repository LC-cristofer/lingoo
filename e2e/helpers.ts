import type { Page } from "@playwright/test";

export const PROFILE_KEY = "lingoo:profile:v1";

/**
 * Before the page loads: an install that has already put the cadastro off (`onboarding: "skipped"`), so a test
 * starting from "/" goes straight to the opening or the island. Written once, never over a stored profile.
 */
export async function skipOnboarding(page: Page) {
  await page.addInitScript((key: string) => {
    try {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify({ version: 1, name: "", age: null, english: null, onboarding: "skipped", createdAt: null, islands: { descoberta: { letras: { levels: {} } } } }));
      }
    } catch {
      /* storage blocked: the app falls back to the cadastro */
    }
  }, PROFILE_KEY);
}
