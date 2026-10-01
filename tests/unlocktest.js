const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  for (const l of ['en', 'zh', 'es']) {
    await p.evaluate((l) => { localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang(l);
      const T = __TD, G = T.G; T.Save.d.max = 8; T.Save.store(); T.startLevel(8); G.lives = 10; G.maxLives = 10; endGame(true); }, l);
    await p.waitForTimeout(2600); await p.screenshot({ path: `shots/unlock-${l}.png` });
    console.log(l, await p.evaluate(() => __TD.G.unlockedTower));
  }
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
