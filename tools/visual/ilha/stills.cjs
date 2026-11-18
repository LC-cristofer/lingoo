const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const out = path.join(__dirname, 'out', 'stills'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
  async function open(file) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await p.goto('file://' + path.join(__dirname, 'out', file), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    p.t = 0;
    p.adv = async ms => { const end = p.t + ms; while (p.t < end) { p.t += 1000 / 30; await p.evaluate(t => { NESTOY.frame(t); return new Promise(r => setTimeout(() => { NESTOY.render(t); r(); }, 0)); }, p.t); } };
    p.shot = async name => p.screenshot({ path: path.join(out, name + '.png') });
    return p;
  }
  const p = await open('film.html');
  await p.evaluate(() => { NESTOY.start("reduced"); }); await p.adv(1500); await p.shot('ilha-dia');
  await p.evaluate(() => { NESTOY.env.night = 1; }); await p.adv(300); await p.shot('ilha-noite');
  await p.evaluate(() => { NESTOY.env.night = 0; }); await p.adv(100);
  await p.evaluate(() => NESTOY.openParents(true)); await p.adv(200); await p.shot('responsaveis');
  await p.evaluate(() => NESTOY.openParents(false));
  await p.evaluate(() => { NESTOY.pauseReminder(); }); await p.adv(4200); await p.shot('pausa');
  const v = await open('vision.html');
  await v.evaluate(() => { NESTOY.start("reduced"); }); await v.adv(1500); await v.shot('ilha-visao');
  await v.evaluate(() => { NESTOY.env.night = 1; }); await v.adv(300); await v.shot('ilha-visao-noite');
  await b.close();
  console.log('ok');
})();
