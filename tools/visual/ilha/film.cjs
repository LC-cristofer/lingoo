// node film.cjs [check|full] — check: grab a frame every 0.5 s at 1x; full: every frame at 2x for the video
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const mode = process.argv[2] || 'check', FPS = 30;
  const dir = path.join(__dirname, 'out', mode === 'full' ? 'frames' : 'check');
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const b = await chromium.launch({ proxy });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: mode === 'full' ? 2 : 1 });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await p.goto('file://' + path.join(__dirname, 'out', 'film.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => { window.__dirDone = false; window.director(window.NESTOY).catch(e => { window.__dirErr = String(e && e.stack || e); window.__dirDone = true; }); });
  let i = 0, tail = -1, n = 0;
  for (; ; i++) {
    const t = i * 1000 / FPS;
    const done = await p.evaluate(t => { window.NESTOY.frame(t); return new Promise(r => setTimeout(() => { window.NESTOY.render(t); r(window.__dirDone); }, 0)); }, t);
    if (done && tail < 0) tail = i + FPS * 1.2;
    const grab = mode === 'full' || i % (FPS / 2) === 0;
    if (grab) { await p.screenshot({ path: path.join(dir, String(n).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 }); n++; }
    if (tail >= 0 && i >= tail) break;
    if (i > FPS * 150) { errs.push('timeout'); break; }
  }
  const log = await p.evaluate(() => ({ audio: window.NESTOY.audioLog, err: window.__dirErr || null }));
  fs.writeFileSync(path.join(__dirname, 'out', mode + '-audio.json'), JSON.stringify(log.audio));
  console.log('frames', n, 'seconds', (i / FPS).toFixed(1), log.err || '', errs.slice(0, 8).join('\n'));
  await b.close();
})();
