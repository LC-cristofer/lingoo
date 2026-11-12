#!/usr/bin/env node
// Screenshots every `[data-sheet]` section of a local HTML file into its own PNG.
//   node tools/visual/frames.cjs <html> <outDir> [scale]
// scale is the deviceScaleFactor (default 2). Animations are disabled so the shots are stable.
/* eslint-disable @typescript-eslint/no-require-imports -- a plain CommonJS script for node */
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

async function main() {
  const [html, outDir, scaleArg] = process.argv.slice(2);
  if (!html || !outDir) {
    console.error("usage: node tools/visual/frames.cjs <html> <outDir> [scale]");
    process.exit(2);
  }
  const deviceScaleFactor = scaleArg ? Number(scaleArg) : 2;
  // Chromium ignores HTTPS_PROXY by itself; pass it on so the Google Fonts can load.
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  // Sandbox-only, as in playwright.config.ts: use the preinstalled Chromium when present.
  const sandboxChromium = process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
  const browser = await chromium.launch({
    ...(fs.existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {}),
    ...(proxy ? { proxy: { server: proxy } } : {}),
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor });
    await page.goto(pathToFileURL(path.resolve(html)).href, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    await page.setViewportSize({ width, height: 900 });
    const fonts = await page.evaluate(() => {
      const loaded = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, ""));
      return ["Baloo 2", "Nunito"].map((f) => `${f}: ${loaded.includes(f) ? "loaded" : "MISSING"}`);
    });
    fs.mkdirSync(path.resolve(outDir), { recursive: true });
    const sheets = page.locator("[data-sheet]");
    const count = await sheets.count();
    for (let i = 0; i < count; i++) {
      const sheet = sheets.nth(i);
      const name = await sheet.getAttribute("data-sheet");
      const file = path.join(outDir, `${name}.png`);
      await sheet.screenshot({ path: file, animations: "disabled" });
      console.log(`wrote ${file}`);
    }
    console.log(`${count} sheet(s), @${deviceScaleFactor}x; ${fonts.join(", ")}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
