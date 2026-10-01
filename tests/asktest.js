const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  for (const [l, size] of [['en', [390, 844]], ['zh', [390, 844]], ['es', [390, 844]], ['en', [360, 640]]]) {
    await p.setViewportSize({ width: size[0], height: size[1] });
    await p.evaluate(l => { localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang(l);
      Save.d.replays = { 111: { rec: [{ k: 'b', w: 0, t: 1, type: 'bolt', c: 0, r: 0 }, { k: 'b', w: 4, t: 1, type: 'nova', c: 1, r: 0 }, { k: 'u', w: 6, t: 2, type: 'bolt', c: 0, r: 0 }], reached: 12, waves: 25, at: Date.now() } };
      __TD.startLevel(111); __TD.G.autoAsk.sel = 9; }, l);
    await p.waitForTimeout(500); await p.screenshot({ path: `shots/ask25-${l}-${size[1]}.png` });
  }
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
