const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await p.addInitScript(() => { try { if (!localStorage.getItem('shatterline.lang')) localStorage.setItem('shatterline.lang', 'en'); } catch (e) {} });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  p.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL')) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + require('path').resolve('dist/index.html'));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: SP + '/s1-title.png' });
  const S = await p.evaluate(() => SCALE);
  const tapL = async (x, y) => { await p.mouse.click(x * S, y * S); await p.waitForTimeout(350); };
  const LHv = await p.evaluate(() => LH);
  await tapL(195 / S * S / S * 1, 0); // noop
  await tapL(await p.evaluate(() => LW / 2), LHv * 0.58);   // PLAY -> map + card for level 1
  await p.waitForTimeout(600);
  await p.screenshot({ path: SP + '/s2-card.png' });
  await p.evaluate(() => { __TD.G.state; });
  // close card, look at map
  await p.evaluate(() => { SAGA.card = null; });
  await p.waitForTimeout(300);
  await p.screenshot({ path: SP + '/s3-map.png' });
  // pretend progress to see a mid-game map + a level-17 card
  await p.evaluate(() => { const s = __TD.Save; s.d.max = 17; for (let i = 1; i < 17; i++) s.d.stars[i] = 1 + (i % 3); __TD.toMap(); __TD.openCard(17); });
  await p.waitForTimeout(900);
  await p.screenshot({ path: SP + '/s4-card17.png' });
  // start level 17 and play a bit with towers
  await p.evaluate(() => { const T = __TD, G = T.G; T.startLevel(17); G.gold = 2000;
    T.buildTower('prism', 4, 6) || 0; for (const [c, r] of [[2,2],[6,4],[3,8],[5,10],[1,6],[7,7]]) { if (T.isBuildable(c, r)) T.buildTower(G.loadout[(c + r) % G.loadout.length], c, r); }
    T.startWave(false); G.speed = 2; });
  await p.waitForTimeout(9000);
  await p.screenshot({ path: SP + '/s5-play17.png' });
  const st = await p.evaluate(() => ({ lv: __TD.G.levelNum, wave: __TD.G.waveNum, enemies: __TD.G.enemies.length, towers: __TD.G.towers.map(t => t.type), gold: __TD.G.gold, lives: __TD.G.lives, lanes: __TD.MAP.paths.length }));
  console.log(JSON.stringify(st));
  // force a win to see results
  await p.evaluate(() => { const G = __TD.G; G.lives = 9; endGame(true); });
  await p.waitForTimeout(4500);
  await p.screenshot({ path: SP + '/s6-win.png' });
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
