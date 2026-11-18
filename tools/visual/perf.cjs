#!/usr/bin/env node
// Chrome trace of the first opening (full, ~14 s) on a running production build, then the long tasks in it.
// Prints: tasks over 50 ms / 100 ms after the load event, layouts and style recalculations during the opening,
// and the frame cost of the stage (average and worst task on the renderer main thread).
//   node tools/visual/perf.cjs [baseUrl] [width] [height]
/* eslint-disable @typescript-eslint/no-require-imports -- a plain CommonJS script for node */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require("playwright");

const BASE = process.argv[2] ?? "http://localhost:3300";
const W = Number(process.argv[3] ?? 390), H = Number(process.argv[4] ?? 844);

(async () => {
  const sandboxChromium = process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
  const browser = await chromium.launch(fs.existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {});
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, reducedMotion: "no-preference" });
  // What does the page change while the opening plays? Every DOM mutation, counted by kind.
  await ctx.addInitScript(() => {
    window.__mut = {};
    const note = (k) => (window.__mut[k] = (window.__mut[k] ?? 0) + 1);
    const start = () => {
      new MutationObserver((list) => {
        for (const m of list) {
          if (m.type === "attributes") note(`attr:${m.attributeName}`);
          else if (m.type === "childList") note("childList");
          else note(m.type);
        }
      }).observe(document, { subtree: true, attributes: true, childList: true, characterData: true });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  });
  const page = await ctx.newPage();
  const file = path.join(os.tmpdir(), `nestoy-trace-${W}x${H}.json`);
  await browser.startTracing(page, { path: file, categories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "blink.user_timing", "v8"] });
  await page.goto(`${BASE}/`);
  const loadAt = await page.evaluate(() => performance.timing.loadEventEnd - performance.timing.navigationStart);
  await page.locator('[data-testid="island"][data-ready="true"]').waitFor({ timeout: 40000 }); // the opening has ended
  await page.waitForTimeout(1500);
  const mut = await page.evaluate(() => window.__mut);
  await browser.stopTracing();
  await browser.close();

  const trace = JSON.parse(fs.readFileSync(file, "utf8"));
  const events = trace.traceEvents ?? trace;
  const main = events.find((e) => e.name === "thread_name" && e.args?.name === "CrRendererMain");
  const tasks = events.filter((e) => e.ph === "X" && e.name === "RunTask" && e.pid === main.pid && e.tid === main.tid);
  const t0 = Math.min(...tasks.map((t) => t.ts));
  const loadTs = (events.find((e) => e.name === "loadEventEnd" || e.name === "firstContentfulPaint")?.ts ?? t0) ;
  const after = tasks.filter((t) => t.ts >= loadTs);
  const ms = (t) => t.dur / 1000;
  const over = (arr, n) => arr.filter((t) => ms(t) > n);
  const sum = (arr) => arr.reduce((a, t) => a + ms(t), 0);
  const count = (name) => events.filter((e) => e.name === name && e.pid === main.pid && e.tid === main.tid && e.ts >= loadTs).length;
  const longest = [...after].sort((a, b) => b.dur - a.dur).slice(0, 5).map((t) => `${ms(t).toFixed(1)} ms @ +${((t.ts - loadTs) / 1000).toFixed(0)} ms`);
  console.log(`${W}x${H}: load event at ${loadAt} ms (navigation start)`);
  console.log(`  main-thread tasks after load: ${after.length}, total ${sum(after).toFixed(0)} ms over ${((Math.max(...after.map((t) => t.ts + t.dur)) - loadTs) / 1e6).toFixed(1)} s`);
  console.log(`  tasks > 50 ms: ${over(after, 50).length}; tasks > 100 ms: ${over(after, 100).length}`);
  console.log(`  longest: ${longest.join("; ")}`);
  console.log(`  average task ${(sum(after) / after.length).toFixed(2)} ms`);
  console.log(`  Layout events: ${count("Layout")}, UpdateLayoutTree (style recalc): ${count("UpdateLayoutTree")}, Paint: ${count("Paint")}`);
  const top = Object.entries(mut).sort((a, b) => b[1] - a[1]);
  console.log(`  DOM mutations during the opening (kind: count): ${top.map(([k, n]) => `${k}: ${n}`).join(", ")}`);
  fs.unlinkSync(file);
})();
