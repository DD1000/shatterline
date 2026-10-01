// v36: MASTER BOLT check — crit pattern per level, fire rate, gold twin shots, and a visual of L1..L4
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  await p.evaluate(() => { localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang('en'); });
  const out = await p.evaluate(() => {
    const T = __TD, G = T.G; const res = {};
    for (let lv = 0; lv < 4; lv++) {
      T.startLevel(3); G.gold = 99999; G.lives = 1e6;
      let spot = null; for (let r = 0; r < 13 && !spot; r++) for (let c = 0; c < 9 && !spot; c++) if (T.isBuildable(c, r)) spot = [c, r];
      T.buildTower('bolt', spot[0], spot[1]); const tw = G.towers[0];
      for (let k = 0; k < lv; k++) T.upgradeTower(tw);
      // count shots over 10 s against a very tanky enemy parked in range
      const seen = []; const origPush = G.shots.push.bind(G.shots);
      G.shots.push = (...a) => { a.forEach(s => { if (s.src === 'bolt') seen.push(s); }); return origPush(...a); };
      T.startWave(false);
      let t = 0; for (let i = 0; i < 30 * 40; i++) { G.enemies.forEach(e => { e.hp = e.maxHp = 1e9; }); T.update(1 / 30); t += 1 / 30; if (seen.length >= 1 && !res['t0' + lv]) res['t0' + lv] = t; }
      const first = seen.findIndex(() => true);
      const n = seen.length;
      res['L' + (lv + 1)] = { rate: T.TOWERS ? undefined : undefined, level: tw.lv, shots: n, pattern: seen.slice(0, 12).map(s => s.crit ? 'C' : '.').join(''), colors: [...new Set(seen.map(s => s.color))], speeds: [...new Set(seen.map(s => s.sp))], sides: [...new Set(seen.slice(0, 6).map(s => Math.round(s.x * 10) / 10))].length };
    }
    return res;
  });
  console.log(JSON.stringify(out, null, 1));
  // visual: 4 bolts L1..L4 on one board
  await p.evaluate(() => {
    const T = __TD, G = T.G; T.startLevel(3); G.gold = 99999;
    const spots = []; for (let r = 0; r < 13 && spots.length < 4; r++) for (let c = 0; c < 9 && spots.length < 4; c++) if (T.isBuildable(c, r)) spots.push([c, r]);
    spots.forEach(([c, r], i) => { T.buildTower('bolt', c, r); const tw = G.towers[G.towers.length - 1]; for (let k = 0; k < i; k++) T.upgradeTower(tw); });
  });
  await p.waitForTimeout(1200); await p.screenshot({ path: `${SP}/master-board.png` });
  // select the master tower to see its stat card
  await p.evaluate(() => { const G = __TD.G; const tw = G.towers[3]; if (__TD.selectTower) __TD.selectTower(tw); else G.sel = tw; });
  await p.waitForTimeout(500); await p.screenshot({ path: `${SP}/master-card.png` });
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
