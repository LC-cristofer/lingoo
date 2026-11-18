// usage: node snap.cjs page.html out.png [width height] [selector]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [page, out, w = '1290', h = '900', sel] = process.argv.slice(2);
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const b = await chromium.launch({ proxy });
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve(page), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  if (sel) await (await p.$(sel)).screenshot({ path: out }); else await p.screenshot({ path: out, fullPage: true });
  console.log(errs.join('\n') || 'ok');
  await b.close();
})();
