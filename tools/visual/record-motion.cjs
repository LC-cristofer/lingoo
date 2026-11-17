#!/usr/bin/env node
// Records the "ceu" prototype pages (see motion-prototype.tsx) as H.264 MP4s plus 2x stills.
//   npx tsx tools/visual/motion-prototype.tsx && node tools/visual/record-motion.cjs
// Playwright videos ignore deviceScaleFactor, so the page is recorded in a 780x1688 viewport with CSS zoom 2.
/* eslint-disable @typescript-eslint/no-require-imports -- a plain CommonJS script for node */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const dir = path.resolve(__dirname, ".out/motion-prototype");
const JOBS = [
  { page: "ceu-mapa", out: "video-b-ceu-mapa", seconds: 10 },
  { page: "ceu-licao", out: "video-b-ceu-licao", seconds: 8 },
  { page: "ceu-inicio", out: "video-b-ceu-inicio", seconds: 8 },
];

async function main() {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const sandboxChromium = process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
  const browser = await chromium.launch({
    ...(fs.existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {}),
    ...(proxy ? { proxy: { server: proxy } } : {}),
  });
  try {
    for (const job of JOBS) {
      const url = pathToFileURL(path.join(dir, `${job.page}.html`)).href;
      // still, 2x
      const sp = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
      await sp.goto(url, { waitUntil: "networkidle" });
      await sp.evaluate(() => document.fonts.ready);
      await sp.waitForTimeout(3000);
      await sp.screenshot({ path: path.join(dir, `${job.page}.png`) });
      await sp.close();
      // video
      const tmp = path.join(dir, `.tmp-${job.page}`);
      fs.rmSync(tmp, { recursive: true, force: true });
      const ctx = await browser.newContext({ viewport: { width: 780, height: 1688 }, recordVideo: { dir: tmp, size: { width: 780, height: 1688 } } });
      const t0 = Date.now();
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({ content: "html{zoom:2}" });
      const lead = (Date.now() - t0) / 1000;
      await page.waitForTimeout(job.seconds * 1000);
      const video = page.video();
      await ctx.close();
      const webm = await video.path();
      const mp4 = path.join(dir, `${job.out}.mp4`);
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", lead.toFixed(2), "-i", webm, "-t", String(job.seconds), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", mp4]);
      fs.rmSync(tmp, { recursive: true, force: true });
      console.log(`wrote ${mp4} (${(fs.statSync(mp4).size / 1e6).toFixed(2)} MB)`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
