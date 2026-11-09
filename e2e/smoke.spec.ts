import { expect, test, type Page } from "@playwright/test";
import lesson from "../content/lessons/forest-animals.json";

async function drag(page: Page, word: string, targetId: string) {
  const from = await page.getByRole("button", { name: word, exact: true }).boundingBox();
  const to = await page.locator(`[data-drop-target="${targetId}"]`).boundingBox();
  if (!from || !to) throw new Error("drag elements not found");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();
}

test("plays the whole forest-animals lesson and earns the fox sticker", async ({ page }) => {
  // No voice: narrator falls back to resolving immediately (Review Focus 4).
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Começar" }).click();
  await expect(page).toHaveURL(/\/mapa$/);

  const place = page.getByRole("button", { name: "Animais da floresta" });
  await place.click();
  await expect(page).toHaveURL(/\/licao\/forest-animals$/);

  const advance = page.getByRole("button", { name: "Avançar" });

  // song
  await advance.click();
  // story
  for (let i = 0; i < 4; i++) await advance.click();

  // tap
  const tap = lesson.steps.find((s) => s.kind === "tap") as { rounds: { answerId: string }[] } | undefined;
  if (!tap) throw new Error("tap step missing");
  for (const round of tap.rounds) {
    await page.getByRole("button", { name: round.answerId, exact: true }).click();
    await page.waitForTimeout(1500);
  }

  // drag
  for (const id of ["bear", "fox", "owl", "rabbit", "frog"]) {
    await drag(page, id, id);
    await expect(page.locator(`[data-drop-target="${id}"]`)).toHaveAttribute("data-matched", "true");
  }

  // repeat (5 cards)
  for (let i = 0; i < 5; i++) await advance.click({ timeout: 10_000 });

  // sticker -> final screen
  const back = page.getByRole("button", { name: "Voltar ao mapa" });
  await expect(back).toBeVisible({ timeout: 10_000 });
  await back.click();
  await expect(page).toHaveURL(/\/mapa$/);
  await expect(page.getByRole("button", { name: "Animais da floresta" })).toHaveAttribute("data-status", "done");

  await page.getByRole("button", { name: "Álbum" }).click();
  await expect(page).toHaveURL(/\/album$/);
  const slot = page.locator('[data-earned="true"]');
  await expect(slot).toHaveCount(1);

  // progress survives a reload
  await page.reload();
  await expect(page.locator('[data-earned="true"]')).toHaveCount(1);
  await page.goto("/mapa");
  await expect(page.getByRole("button", { name: "Animais da floresta" })).toHaveAttribute("data-status", "done");
});
