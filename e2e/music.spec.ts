import { expect, test, type Page } from "@playwright/test";

/** Counts the loop sources the page starts and stops (Web Audio), and records every music request. */
async function instrument(page: Page) {
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

const toggle = (page: Page, name: "Música ligada" | "Música desligada") => page.getByRole("button", { name, exact: true });

test("music follows the screens: map, lesson (silent), album and Memória", async ({ page }) => {
  await instrument(page);
  const seen = watch(page);

  await test.step("the start screen is silent, even after a tap", async () => {
    await page.goto("/");
    await page.getByRole("heading", { name: "Lingoo" }).click();
    await page.waitForTimeout(800);
    expect(seen.music).toEqual([]);
  });

  await test.step("Jogar: the map's loop is requested and plays", async () => {
    await page.getByRole("button", { name: "Jogar" }).click();
    await expect(page).toHaveURL(/\/mapa$/);
    await expect.poll(() => seen.music).toContain("trail");
    await expect.poll(async () => (await playing(page)).live).toBe(1);
    await expect(toggle(page, "Música ligada")).toBeVisible();
  });

  await test.step("inside a stop there is no music and none is requested", async () => {
    const before = seen.music.length;
    await page.getByRole("button", { name: "Música", exact: true }).click();
    await expect(page).toHaveURL(/\/parada\//);
    await expect.poll(async () => (await playing(page)).live).toBe(0);
    await page.waitForTimeout(1200);
    expect(seen.music).toHaveLength(before);
    await expect(page.getByRole("button", { name: /^Música (ligada|desligada)$/ })).toHaveCount(0);
  });

  await test.step("back on the map it plays again; the album switches track, Memória keeps it", async () => {
    await page.goto("/mapa"); // a reload: needs a tap again
    await page.locator("body").click({ position: { x: 5, y: 300 } });
    await expect.poll(async () => (await playing(page)).live).toBe(1);
    const nav = page.getByRole("navigation", { name: "Navegação" });
    await nav.getByRole("link", { name: /Álbum/ }).click();
    await expect(page).toHaveURL(/\/album$/);
    await expect.poll(() => seen.music).toContain("album");
    await expect.poll(async () => (await playing(page)).started, { timeout: 5000 }).toBe(2); // trail, then album (crossfade)
    await expect.poll(async () => (await playing(page)).live).toBe(1);
    const started = (await playing(page)).started;
    await nav.getByRole("link", { name: /Memória/ }).click();
    await expect(page).toHaveURL(/\/memoria$/);
    await page.waitForTimeout(1000);
    expect((await playing(page)).started).toBe(started); // the same track: not restarted
    expect((await playing(page)).live).toBe(1);
    await expect(toggle(page, "Música ligada")).toBeVisible();
  });

  expect(seen.problems).toEqual([]);
});

test("the parent switch flips, stops the music, and survives a reload", async ({ page }) => {
  await instrument(page);
  const seen = watch(page);
  await page.goto("/mapa");
  await toggle(page, "Música ligada").click(); // a tap on the switch is itself the first gesture
  const requestedBeforeOff = seen.music.length;
  await expect(toggle(page, "Música desligada")).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => localStorage.getItem("lingoo:music"))).toBe("off");

  await page.reload();
  await expect(toggle(page, "Música desligada")).toBeVisible();
  await page.locator("body").click({ position: { x: 5, y: 300 } });
  await page.waitForTimeout(1000);
  expect(seen.music).toHaveLength(requestedBeforeOff); // no new request while it is off
  expect((await playing(page)).started).toBe(0);

  await toggle(page, "Música desligada").click();
  await expect(toggle(page, "Música ligada")).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("lingoo:music"))).toBe("on");
  await expect.poll(async () => (await playing(page)).live).toBe(1);

  // switching off while playing stops the source
  await toggle(page, "Música ligada").click();
  await expect.poll(async () => (await playing(page)).live).toBe(0);
  expect(seen.problems).toEqual([]);
});

for (const vp of [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 1024, height: 768 },
]) {
  test(`the switch is 64 px and covers nothing on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const url of ["/mapa", "/album", "/memoria"]) {
      await page.goto(url);
      const button = page.getByRole("button", { name: /^Música (ligada|desligada)$/ });
      await expect(button).toBeVisible();
      const box = (await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(64);
      expect(box.height).toBeGreaterThanOrEqual(64);
      expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
      expect(box.y).toBeGreaterThanOrEqual(0);
      // the chips of the top row stay clear of it
      for (const chip of await page.locator(".k-chip").all()) {
        const c = (await chip.boundingBox())!;
        const overlap = c.x < box.x + box.width && c.x + c.width > box.x && c.y < box.y + box.height && c.y + c.height > box.y;
        expect(overlap, `${url}: a chip under the switch`).toBe(false);
      }
      // and the switch is the topmost thing at its centre (nothing lies over it)
      const top = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest("button")?.getAttribute("aria-pressed") ?? null, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
      expect(top).not.toBeNull();
    }
  });
}
