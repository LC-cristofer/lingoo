import { expect, test, type Page } from "@playwright/test";
import { PROFILE_KEY, skipOnboarding } from "./helpers";

const SETTINGS_KEY = "lingoo:settings:v1";
const PROGRESS_KEY = "lingoo:progress:v3";
const farol = (page: Page) => page.getByRole("button", { name: "Farol das Línguas" });
const saved = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), SETTINGS_KEY);

test.describe("the opening", () => {
  test.use({ reducedMotion: "no-preference", viewport: { width: 390, height: 844 } });

  test("the first visit shows Pular, which lands on the island; the same day again has no opening", async ({ page }) => {
    await skipOnboarding(page);
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
    await skipOnboarding(page);
    await page.goto("/");
    await expect(farol(page)).toBeVisible({ timeout: 1000 });
    await expect(page.getByRole("button", { name: "Pular" })).toHaveCount(0);
    await expect(page.getByTestId("nino-card")).toContainText("Vamos explorar?");
  });
});

const hold = async (page: Page) => {
  const box = (await page.getByRole("button", { name: "Segure para entrar" }).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2300);
  await page.mouse.up();
};
const profile = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), PROFILE_KEY);

test.describe("the cadastro", () => {
  test.use({ reducedMotion: "no-preference", viewport: { width: 390, height: 844 } });

  test("a new install: hold, name, age, English contact, Pronto!, then the opening; never again", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Chame um adulto!" })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: "Agora não" })).toHaveCount(0);
    await expect(farol(page)).toBeHidden();
    await hold(page);
    await page.getByLabel("Nome da criança").fill("Ana");
    await page.getByRole("button", { name: "Seguir" }).click();
    await page.getByRole("button", { name: "6", exact: true }).click();
    await page.getByRole("button", { name: "Conhece algumas palavras" }).click();
    await page.getByRole("button", { name: "Pronto!" }).click();
    await expect(page.getByRole("button", { name: "Pular" })).toBeVisible({ timeout: 5000 }); // the opening plays
    const p = await profile(page);
    expect(p).toMatchObject({ name: "Ana", age: 6, english: "words", onboarding: "done" });
    expect(p.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    await page.getByRole("button", { name: "Pular" }).click();
    await expect(farol(page)).toBeVisible({ timeout: 3000 });

    await page.reload();
    await expect(farol(page)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: "Chame um adulto!" })).toHaveCount(0);
  });

  test("an install with progress may say Agora não, once", async ({ page }) => {
    await page.addInitScript((k) => {
      if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify({ version: 3, completedStops: {}, stickers: {}, daysPlayed: ["2026-11-01"], memory: {}, legacy: null }));
    }, PROGRESS_KEY);
    await page.goto("/");
    await page.getByRole("button", { name: "Agora não" }).click();
    await page.getByRole("button", { name: "Pular" }).click({ timeout: 5000 }); // the opening still plays once
    await expect(farol(page)).toBeVisible({ timeout: 3000 });
    expect((await profile(page)).onboarding).toBe("skipped");
    await page.reload();
    await expect(farol(page)).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: "Agora não" })).toHaveCount(0);
  });
});
