const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  for (const l of ['en', 'zh', 'es']) {
    await p.evaluate(l => { localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang(l);
      Save.d.replays = { 12: { rec: [{ k: 'b', w: 0, t: 0.5, type: 'bolt', c: 0, r: 0 }], reached: 2, waves: 7, at: Date.now() } };
      const T = __TD, G = T.G; T.startLevel(12); beginReplay(2); G.gold = 5; for (let i = 0; i < 30; i++) T.update(1 / 30); }, l);
    await p.waitForTimeout(300); await p.screenshot({ path: `shots/pill-${l}.png`, clip: { x: 0, y: 50, width: 390, height: 90 } });
  }
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
