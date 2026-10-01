// v44: EMP lasers reach flyers: a lone Glider gets targeted, a shielded / electrified flying boss gets stripped / shorted
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  const out = await p.evaluate(() => {
    localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang('en');
    const T = __TD, G = T.G, r = {};
    const nearFlight = (lvl, frac) => {                // a free tile close to the flight line
      const f = MAP.flights[0], q = f.at(f.len * frac); let best = null, bd = 1e9;
      for (let rr = 0; rr < 13; rr++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, rr) && !G.grid[rr * 9 + c]) { const d = Math.hypot(c * 40 + 20 - q.x, rr * 40 + 20 - q.y); if (d < bd) { bd = d; best = [c, rr]; } }
      return { spot: best, d: f.len * frac, tiles: +(bd / 40).toFixed(2) };
    };
    // 1) a lone Glider: EMP targets and lasers it (tiny damage); BOLT still ignores it
    T.startLevel(40); G.gold = 1e5; G.lives = 1e6;
    let s = nearFlight(40, 0.4); T.buildTower('emp', s.spot[0], s.spot[1]); const emp = G.towers[0];
    s = nearFlight(40, 0.4); T.buildTower('bolt', s.spot[0], s.spot[1]); const bolt = G.towers[1];
    const g = T.spawnEnemy('glider', 1, 0, MAP.flights[0].len * 0.4); g.speed = 0; g.age = 1; g.hp = g.maxHp = 1e4;
    for (let i = 0; i < 30 * 3; i++) T.update(1 / 30);
    r.glider = { empTargets: emp.target === g, boltTargets: bolt.target === g, hurt: +(1e4 - g.hp).toFixed(2), dist: s.tiles };
    // 2) Stormwing with a shield and electricity (lab 12 has both): EMP strips the shield and shorts it
    T.startLevel(112); G.gold = 1e5; G.lives = 1e6;
    const s2 = nearFlight(112, 0.35); T.buildTower('emp', s2.spot[0], s2.spot[1]); T.upgradeTower(G.towers[0]); T.upgradeTower(G.towers[0]);
    const w = T.spawnEnemy('boss_glider', 1, 0, MAP.flights[0].len * 0.35, 0, { shield: 1, elec: 1 }); w.speed = 0; w.age = 1;
    const sh0 = w.shield;
    for (let i = 0; i < 30 * 4; i++) T.update(1 / 30);
    r.stormwing = { shieldBefore: Math.round(sh0), shieldAfter: Math.round(w.shield), stripped: w.shieldMax === 0 || w.shield < sh0, shorted: w.elecOff > 0, empZapped: G.towers[0].zapT > 0 };
    return r;
  });
  await p.waitForTimeout(200); await p.screenshot({ path: 'shots/emp-air.png' });
  console.log(JSON.stringify(out, null, 1)); console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
