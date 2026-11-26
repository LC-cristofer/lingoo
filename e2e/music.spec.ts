import { expect, test, type Page } from "@playwright/test";
import { skipOnboarding } from "./helpers";

/** Counts the loop sources the page starts and stops (Web Audio), and records every music request. */
async function instrument(page: Page) {
  await skipOnboarding(page);
  await page.addInitScript(() => {
    const state = { started: 0, stopped: 0 };
    (window as unknown as { __music: typeof state }).__music = state;
    const proto = AudioBufferSourceNode.prototype;
    const start = proto.start;
    const stop = proto.stop;
    proto.start = function (...args: Parameters<typeof start>) {
      state.started++;
      return start.apply(this, args);
    };
    proto.stop = function (...args: Parameters<typeof stop>) {
      state.stopped++;
      return stop.apply(this, args);
    };
  });
}

const playing = (page: Page) => page.evaluate(() => {
  const m = (window as unknown as { __music: { started: number; stopped: number } }).__music;
  return { started: m.started, stopped: m.stopped, live: m.started - m.stopped };
});

function watch(page: Page) {
  const music: string[] = [];
  const problems: string[] = [];
  page.on("request", (r) => {
    const m = new URL(r.url()).pathname.match(/^\/audio\/music\/(.+)\.mp3$/);
    if (m) music.push(m[1]);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return { music, problems };
}

/** Press and hold the gate button for 2 s. */
async function openParents(page: Page) {
  const hold = page.getByRole("button", { name: "Segure para entrar" });
  await hold.waitFor();
  const box = (await hold.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2200);
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "Fechar" })).toBeVisible();
}

test("music follows the screens: island, lesson (silent), nest and Memória", async ({ page }) => {
  await instrument(page);
  const seen = watch(page);

  await test.step("the island: nothing plays before a tap, then the trail loop is requested and plays", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: "Farol das Línguas" }).waitFor();
    await page.waitForTimeout(800);
    expect(seen.music).toEqual([]);
    await page.locator("body").click({ position: { x: 5, y: 300 } });
    await expect.poll(() => seen.music).toContain("trail");
    await expect.poll(async () => (await playing(page)).live).toBe(1);
  });

  await test.step("inside a stop there is no music and none is requested", async () => {
    await page.getByRole("button", { name: "Farol das Línguas" }).click();
    await page.getByRole("button", { name: "Entrar no farol" }).click();
    await expect(page).toHaveURL(/\/farol$/);
    await expect.poll(async () => (await playing(page)).live).toBe(1); // the farol keeps the trail loop
    const before = seen.music.length;
    await page.getByRole("button", { name: "Música", exact: true }).click();
    await expect(page).toHaveURL(/\/parada\//);
    await expect.poll(async () => (await playing(page)).live).toBe(0);
    await page.waitForTimeout(1200);
    expect(seen.music).toHaveLength(before);
    await expect(page.getByRole("button", { name: /^Música (ligada|desligada)$/ })).toHaveCount(0);
  });

  await test.step("back on the island it plays again; the nest crossfades to the album track, Memória keeps it", async () => {
    await page.goto("/"); // a reload: needs a tap again
    await page.locator("body").click({ position: { x: 5, y: 300 } });
    await expect.poll(async () => (await playing(page)).live).toBe(1);
    const before = (await playing(page)).started;
    await page.getByRole("button", { name: "Voltar ao ninho" }).click();
    await expect(page).toHaveURL(/\/ninho$/);
    await expect.poll(() => seen.music).toContain("album");
    await expect.poll(async () => (await playing(page)).started).toBe(before + 1); // one crossfade: the album loop starts once
    await expect.poll(async () => (await playing(page)).live).toBe(1);
    await expect(page.getByRole("button", { name: /^Música (ligada|desligada)$/ })).toHaveCount(0); // the switch lives in the parents' area
  });

  expect(seen.problems).toEqual([]);
});

test("the parent switch flips, stops the music, and survives a reload", async ({ page }) => {
  await instrument(page);
  const seen = watch(page);
  const on = () => page.getByRole("button", { name: "Ligada", exact: true });
  const off = () => page.getByRole("button", { name: "Desligada", exact: true });
  await page.goto("/responsaveis");
  await openParents(page);
  await on().click(); // a press on the sheet is itself the first gesture; the music is already on
  await off().click();
  await expect(off()).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("lingoo:music"))).toBe("off");

  await page.goto("/ninho");
  await page.locator("body").click({ position: { x: 5, y: 300 } });
  await page.waitForTimeout(1000);
  expect(seen.music).not.toContain("album"); // nothing requested while it is off
  expect((await playing(page)).started).toBe(0);

  await page.goto("/responsaveis");
  await openParents(page);
  await expect(off()).toHaveAttribute("aria-pressed", "true"); // survived the reload
  await on().click();
  await expect(on()).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("lingoo:music"))).toBe("on");
  expect(seen.problems).toEqual([]);
});

for (const vp of [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "landscape phone", width: 844, height: 390 },
]) {
  test(`the music switch and the gate are 64 px and inside the screen on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/responsaveis");
    const hold = (await page.getByRole("button", { name: "Segure para entrar" }).boundingBox())!;
    expect(hold.height).toBeGreaterThanOrEqual(64);
    await openParents(page);
    const button = page.getByRole("button", { name: "Desligada", exact: true });
    await button.scrollIntoViewIfNeeded();
    const box = (await button.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(64);
    expect(box.height).toBeGreaterThanOrEqual(64);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
    expect(box.x).toBeGreaterThanOrEqual(0);
  });
}
