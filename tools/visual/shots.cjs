#!/usr/bin/env node
// Full-page screenshot of a local HTML file with Playwright's preinstalled Chromium.
//   node tools/visual/shots.cjs <html> <png> [scale]
// scale is the deviceScaleFactor (default 2). Animations are disabled so the shot is stable.
/* eslint-disable @typescript-eslint/no-require-imports -- a plain CommonJS script for node */
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

async function main() {
  const [html, png, scaleArg] = process.argv.slice(2);
  if (!html || !png) {
    console.error("usage: node tools/visual/shots.cjs <html> <png> [scale]");
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
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor });
    await page.goto(pathToFileURL(path.resolve(html)).href, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    await page.setViewportSize({ width, height: 800 });
    const fonts = await page.evaluate(() => {
      const loaded = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, ""));
      return ["Baloo 2", "Nunito"].map((f) => `${f}: ${loaded.includes(f) ? "loaded" : "MISSING"}`);
    });
    fs.mkdirSync(path.dirname(path.resolve(png)), { recursive: true });
    await page.screenshot({ path: png, fullPage: true, animations: "disabled" });
    console.log(`wrote ${png} (${width}px wide, @${deviceScaleFactor}x; ${fonts.join(", ")})`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
