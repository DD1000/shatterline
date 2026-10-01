const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await p.addInitScript(() => { try { if (!localStorage.getItem('shatterline.lang')) localStorage.setItem('shatterline.lang', 'en'); } catch (e) {} });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
  await p.goto('file://' + require('path').resolve('index.html'));
  await p.waitForTimeout(600);
  // 1) No Bounty card + confirm
  await p.evaluate(() => { const S = __TD.Save; S.d.max = 36; S.d.loadout = ['bolt', 'frost', 'nova', 'arc']; S.d.known = ['bolt','frost','nova','arc','mint','prism','rail','beacon','flak']; __TD.toMap(); __TD.openCard(14); });
  await p.waitForTimeout(700);
  await p.screenshot({ path: SP + '/f1-card14.png' });
  await p.evaluate(() => { const h = hits.find(h => h.w === 220 && h.h === 56); h.cb(); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: SP + '/f2-confirm.png' });
  await p.evaluate(() => { const h = hits.filter(h => h.h === 46).pop(); h.cb(); });
  await p.waitForTimeout(300);
  console.log('loadout after ADD:', JSON.stringify(await p.evaluate(() => __TD.Save.d.loadout)));
  // 2) play level 14 with mints: gold only from mints
  const r2 = await p.evaluate(() => { const T = __TD, G = T.G; T.startLevel(14); G.paused = true; Sound.setEnabled(false);
    const free = []; for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) free.push([c, r]);
    T.buildTower('mint', ...free[0]); T.buildTower('mint', ...free[free.length - 1]); T.buildTower('nova', ...free[Math.floor(free.length / 2)]);
    const g0 = G.gold; T.startWave(false); let t = 0; while (t < 20) { T.update(1 / 60); t += 1 / 60; }
    return { g0, g1: G.gold, kills: G.kills, pulses: G.towers.filter(t => t.type === 'mint').length }; });
  console.log('no bounty:', JSON.stringify(r2));
  await p.evaluate(() => { __TD.G.paused = false; Sound.setEnabled(true); });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: SP + '/f3-mint.png' });
  // 3) Air raid: level 32 — ground towers must ignore gliders, flak must hit them
  const r3 = await p.evaluate(() => { const T = __TD, G = T.G; T.Save.d.loadout = ['flak', 'bolt', 'nova', 'rail']; T.startLevel(32); G.gold = 5000; G.paused = true; Sound.setEnabled(false);
    const f = T.MAP.flights[0]; const mid = f.at(f.len * 0.5); const c = Math.round((mid.x - 20) / 40), r = Math.round((mid.y - 20) / 40);
    let placed = null; for (let d = 0; d < 3 && !placed; d++) for (const [dc, dr] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[2,0],[-2,0]]) if (!placed && T.isBuildable(c + dc, r + dr)) placed = T.buildTower('flak', c + dc, r + dr);
    const bolt = (() => { for (let rr = 2; rr < 12; rr++) for (let cc = 1; cc < 8; cc++) if (T.isBuildable(cc, rr) && !G.grid[rr * 9 + cc]) return T.buildTower('bolt', cc, rr); })();
    T.startWave(false); let t = 0, flyerHitByGround = false, flakShots = 0;
    const origDamage = window.damage;
    window.damage = (e, a, o) => { if (e.rc.flying && G.missiles.length === 0 && !o.fromFlak) {} return origDamage(e, a, o); };
    while (t < 40) { T.update(1 / 60); t += 1 / 60; flakShots += G.missiles.length ? 0 : 0; }
    window.damage = origDamage;
    const bs = G.towers.filter(t => t.type === 'bolt');
    return { flak: !!placed, lanes: T.MAP.flights.length, gliders: G.enemies.filter(e => e.rc.flying).length, kills: G.kills, leaks: G.leakTypes, boltTargetFlyer: bs.some(b => b.target && b.target.rc.flying) };
  });
  console.log('air raid:', JSON.stringify(r3));
  await p.evaluate(() => { const T = __TD, G = T.G; T.startLevel(32); G.gold = 5000; Sound.setEnabled(true);
    const f = T.MAP.flights[0]; for (const k of [0.35, 0.6]) { const q = f.at(f.len * k); const c = Math.round((q.x - 20) / 40), r = Math.round((q.y - 20) / 40);
      for (const [dc, dr] of [[1,0],[-1,0],[0,1],[0,-1],[1,1]]) if (T.isBuildable(c + dc, r + dr)) { T.buildTower('flak', c + dc, r + dr); break; } }
    T.startWave(false); G.speed = 2; });
  await p.waitForTimeout(7000);
  await p.screenshot({ path: SP + '/f4-air.png' });
  // 4) Rail: fixed direction, preview + turn
  const r4 = await p.evaluate(() => { const T = __TD, G = T.G; T.startLevel(22); G.gold = 2000;
    let tw = null; for (let r = 2; r < 11 && !tw; r++) for (let c = 0; c < 9 && !tw; c++) if (T.isBuildable(c, r)) { const d = bestRailDir(c, r, 4.5); if (railTiles(c, r, d, 4.5).filter(([cc, rr]) => T.MAP.tiles.has(rr * 9 + cc)).length >= 3) tw = T.buildTower('rail', c, r); }
    G.menu = { kind: 'tower', tw, sel: 'turn', t: 1, shake: 0, hand: 1 };
    return { dir: tw.dir, c: tw.c, r: tw.r, dmg: T.TOWERS.rail.lv.map(l => l.dmg) }; });
  console.log('rail:', JSON.stringify(r4));
  await p.waitForTimeout(400);
  await p.screenshot({ path: SP + '/f5-rail.png' });
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
