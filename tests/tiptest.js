const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  await p.evaluate(() => { localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang('en'); });
  for (const [lang, lvUp] of [['en', 2], ['en', 1], ['zh', 2], ['es', 2]]) {
    await p.evaluate(([lang, lvUp]) => {
      setLang(lang); const T = __TD, G = T.G; T.startLevel(3); G.gold = 99999;
      let spot = null; for (let r = 4; r < 13 && !spot; r++) for (let c = 0; c < 9 && !spot; c++) if (T.isBuildable(c, r)) spot = [c, r];
      T.buildTower('bolt', spot[0], spot[1]); const tw = G.towers[0]; for (let k = 0; k < lvUp; k++) T.upgradeTower(tw);
      G.menu = { kind: 'tower', tw, sel: 'up', t: 1, shake: 0, hand: 0 };
    }, [lang, lvUp]);
    await p.waitForTimeout(500); await p.screenshot({ path: `shots/tip-${lang}-${lvUp}.png`, clip: { x: 0, y: 60, width: 390, height: 300 } });
  }
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
