const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  // pretend this player already beat level 40 on the old 40-level version
  await ctx.addInitScript(() => { const st = {}; for (let i = 1; i <= 40; i++) st[i] = 2; localStorage.setItem('shatterline.save', JSON.stringify({ max: 40, stars: st, loadout: ['nova', 'prism', 'rail', 'beacon'], known: ['bolt','frost','nova','arc','mint','prism','rail','beacon'], done: true })); localStorage.setItem('shatterline.lang', 'en'); });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
  p.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL')) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + require('path').resolve('dist/index.html'));
  await p.waitForTimeout(900);
  console.log('after migration:', JSON.stringify(await p.evaluate(() => ({ max: __TD.Save.d.max, done: __TD.Save.d.done, levels: __TD.LEVELS.length }))));
  await p.screenshot({ path: SP + '/n1-title.png' });
  await p.evaluate(() => { __TD.toMap(); });
  await p.waitForTimeout(600);
  await p.screenshot({ path: SP + '/n2-map41.png' });
  await p.evaluate(() => { SAGA.scroll = clampScroll(nodePos(58).y - LH * 0.5); });
  await p.waitForTimeout(300);
  await p.screenshot({ path: SP + '/n3-map58.png' });
  await p.evaluate(() => { __TD.Save.d.testAll = true; SAGA.scroll = 0; });
  await p.waitForTimeout(300);
  await p.screenshot({ path: SP + '/n4-maptop.png' });
  await p.evaluate(() => { __TD.openCard(80); });
  await p.waitForTimeout(700);
  await p.screenshot({ path: SP + '/n5-card80.png' });
  await p.evaluate(() => { const T = __TD, G = T.G; T.startLevel(66); G.gold = 3000;
    for (const [c, r] of [[2,2],[4,4],[6,6],[3,8],[5,10],[1,5],[7,3]]) if (T.isBuildable(c, r)) { const tw = T.buildTower(G.loadout[(c + r) % G.loadout.length], c, r); if (tw) T.upgradeTower(tw); }
    T.startWave(false); G.speed = 2; });
  await p.waitForTimeout(9000);
  await p.screenshot({ path: SP + '/n6-play66.png' });
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
