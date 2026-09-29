const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctxb = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p = await ctxb.newPage();
  await p.addInitScript(() => { try { if (!localStorage.getItem('shatterline.lang')) localStorage.setItem('shatterline.lang', 'en'); } catch (e) {} });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  p.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL')) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + require('path').resolve('dist/index.html'));
  await p.waitForTimeout(800);
  const S = await p.evaluate(() => SCALE);
  const tapL = async (x, y) => { await p.touchscreen.tap(x * S, y * S); await p.waitForTimeout(300); };
  // new player: PLAY -> card L1 -> PLAY
  await tapL(await p.evaluate(() => LW / 2), await p.evaluate(() => LH * 0.58));
  await p.waitForTimeout(500);
  const playY = await p.evaluate(() => Math.max(8, (LH - 560) / 2) + 560 - 44);
  await tapL(await p.evaluate(() => LW / 2), playY);
  await p.waitForTimeout(800);
  await p.screenshot({ path: SP + '/t1-level1.png' });
  const st1 = await p.evaluate(() => ({ state: __TD.G.state, lvl: __TD.G.levelNum, tut: __TD.G.tutorial, lo: __TD.G.loadout }));
  // simulate progress: beat level 2 so Frost unlocks, check result screen
  await p.evaluate(() => { const T = __TD; T.startLevel(2); T.G.lives = 10; endGame(true); });
  await p.waitForTimeout(3600);
  await p.screenshot({ path: SP + '/t2-unlock.png' });
  // lose screen with tip on level 21 (mender)
  await p.evaluate(() => { const T = __TD; T.Save.d.max = 21; T.startLevel(21); T.G.leakTypes = { mender: 4 }; T.G.waveNum = 5; T.G.lives = 0; endGame(false); });
  await p.waitForTimeout(3200);
  await p.screenshot({ path: SP + '/t3-lose.png' });
  // map scrolled mid-way, drag test
  await p.evaluate(() => { const s = __TD.Save; s.d.max = 24; for (let i = 1; i < 24; i++) s.d.stars[i] = 1 + (i * 7 % 3); __TD.toMap(); });
  await p.waitForTimeout(500);
  const before = await p.evaluate(() => SAGA.scroll);
  await p.mouse.move(195, 500); await p.mouse.down(); await p.mouse.move(195, 560, { steps: 5 }); await p.mouse.move(195, 640, { steps: 5 }); await p.mouse.up();
  await p.waitForTimeout(700);
  const after = await p.evaluate(() => SAGA.scroll);
  await p.screenshot({ path: SP + '/t4-map.png' });
  // two-lane level in play
  await p.evaluate(() => { const T = __TD, G = T.G; T.Save.d.max = 27; T.Save.d.loadout = ['nova', 'prism', 'rail', 'beacon']; T.startLevel(27); G.gold = 3000;
    const spots = [[4,4],[4,5],[5,4],[2,8],[6,9],[3,6]]; const types = ['beacon','nova','rail','prism','nova','rail'];
    spots.forEach(([c, r], i) => { if (T.isBuildable(c, r)) { const tw = T.buildTower(types[i], c, r); if (tw) { T.upgradeTower(tw); } } });
    T.startWave(false); G.speed = 2; });
  await p.waitForTimeout(12000);
  await p.evaluate(() => { const G = __TD.G; const tw = G.towers.find(t => t.type === 'beacon'); if (tw) G.menu = { kind: 'tower', tw, sel: 'up', t: 1, shake: 0 }; });
  await p.waitForTimeout(400);
  await p.screenshot({ path: SP + '/t5-lanes.png' });
  const st5 = await p.evaluate(() => ({ lanes: __TD.MAP.paths.length, towers: __TD.G.towers.map(t => t.type + t.lv + (t.buff ? '+' : '')), wave: __TD.G.waveNum, lives: __TD.G.lives, enemies: [...new Set(__TD.G.enemies.map(e => e.type))] }));
  console.log(JSON.stringify({ st1, before, after, st5 }));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
