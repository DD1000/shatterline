const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  await p.evaluate(() => { localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang('en'); Save.d.replays = {};
    const T = __TD, G = T.G; T.startLevel(5); G.gold = 500;
    for (let i = 0; i < 30; i++) T.update(1 / 30);
    let s = null; for (let r = 0; r < 13 && !s; r++) for (let c = 0; c < 9 && !s; c++) if (T.isBuildable(c, r)) s = [c, r];
    T.buildTower(G.loadout[0], s[0], s[1]); playerWave(false); for (let i = 0; i < 60; i++) T.update(1 / 30);
    G.lives = 1; endGame(false); });
  await p.waitForTimeout(3200);                       // the end screen appears
  const tapBtn = async (label) => p.evaluate(label => {
    // find the pill button whose label matches by re-drawing: pillButton registers hits in draw order; use the big pulse button
    const big = hits.filter(h => h.w >= 200 && h.h >= 50); big[big.length - 1].cb(); return big.length;
  }, label);
  const s1 = await p.evaluate(() => __TD.G.state);
  await tapBtn('try again'); await p.waitForTimeout(700);
  const s2 = await p.evaluate(() => ({ state: __TD.G.state, card: SAGA.card && SAGA.card.n }));
  await p.screenshot({ path: 'shots/flow-card.png' });
  await p.evaluate(() => { const big = hits.filter(h => h.w >= 200 && h.h >= 50); big[big.length - 1].cb(); });   // PLAY
  await p.waitForTimeout(700);
  const s3 = await p.evaluate(() => ({ state: __TD.G.state, level: __TD.G.levelNum, asking: !!__TD.G.autoAsk, sel: __TD.G.autoAsk && __TD.G.autoAsk.sel }));
  await p.screenshot({ path: 'shots/flow-ask.png' });
  console.log(JSON.stringify({ s1, s2, s3 })); console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
