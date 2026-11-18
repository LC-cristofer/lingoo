#!/usr/bin/env node
// Renders the NESTOY app icons from public/brand/nestoy-mark.svg with Playwright's Chromium.
//   node tools/visual/brand/render-icons.cjs
// Writes public/icons/icon-192.png, icon-512.png, maskable-512.png (mark at 62 % so it survives a circular mask),
// src/app/apple-icon.png (180) and src/app/icon.svg (the mark on a rounded square).
/* eslint-disable @typescript-eslint/no-require-imports -- a plain CommonJS script for node */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "../../..");
const BG = "#FFF6E8";
const markSvg = fs.readFileSync(path.join(ROOT, "public/brand/nestoy-mark.svg"), "utf8").trim();
const viewBox = /viewBox="([^"]+)"/.exec(markSvg)[1];
const inner = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(markSvg)[1].trim();
const [, , vbW, vbH] = viewBox.split(/\s+/).map(Number);

/** The mark centred in a size x size square, `fraction` of the square wide (height follows the mark's aspect ratio). */
function iconSvg(size, fraction, rounded) {
  const w = size * fraction;
  const h = (w * vbH) / vbW;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  const radius = rounded ? ` rx="${Math.round(size * 0.22)}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}"${radius} fill="${BG}"/><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${viewBox}">${inner}</svg></svg>`;
}

async function main() {
  const sandboxChromium = process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
  const browser = await chromium.launch(fs.existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {});
  try {
    const jobs = [
      { file: "public/icons/icon-192.png", size: 192, fraction: 0.86 },
      { file: "public/icons/icon-512.png", size: 512, fraction: 0.86 },
      { file: "public/icons/maskable-512.png", size: 512, fraction: 0.62 },
      { file: "src/app/apple-icon.png", size: 180, fraction: 0.86 },
    ];
    for (const { file, size, fraction } of jobs) {
      const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
      await page.setContent(`<!doctype html><html><body style="margin:0;background:${BG}">${iconSvg(size, fraction, false)}</body></html>`);
      const out = path.join(ROOT, file);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      await page.screenshot({ path: out, clip: { x: 0, y: 0, width: size, height: size } });
      await page.close();
      console.log(`wrote ${file}`);
    }
    fs.writeFileSync(path.join(ROOT, "src/app/icon.svg"), iconSvg(512, 0.86, true) + "\n");
    console.log("wrote src/app/icon.svg");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
