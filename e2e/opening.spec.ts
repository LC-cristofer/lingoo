import { expect, test } from "@playwright/test";

const SETTINGS_KEY = "lingoo:settings:v1";
const farol = (page: import("@playwright/test").Page) => page.getByRole("button", { name: "Farol das Línguas" });
const saved = (page: import("@playwright/test").Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), SETTINGS_KEY);

test.describe("the opening", () => {
  test.use({ reducedMotion: "no-preference", viewport: { width: 390, height: 844 } });

  test("the first visit shows Pular, which lands on the island; the same day again has no opening", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByRole("button", { name: "Pular" });
    await expect(skip).toBeVisible({ timeout: 5000 });
    await expect(farol(page)).toBeHidden(); // the places have not appeared yet
    await skip.click();
    await expect(farol(page)).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("button", { name: "Pular" })).toHaveCount(0);
    await expect(page.getByTestId("nino-card")).toContainText("Vamos explorar?");
    const settings = await saved(page);
    expect(settings.openingSeen).toBe(true);
    expect(settings.lastVisit).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await page.reload();
    await expect(farol(page)).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("button", { name: "Pular" })).toHaveCount(0);
  });
});

test.describe("the opening with reduced motion", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });

  test("reaches the island within a second, with no Pular", async ({ page }) => {
    await page.goto("/");
    await expect(farol(page)).toBeVisible({ timeout: 1000 });
    await expect(page.getByRole("button", { name: "Pular" })).toHaveCount(0);
    await expect(page.getByTestId("nino-card")).toContainText("Vamos explorar?");
  });
});
