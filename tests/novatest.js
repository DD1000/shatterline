// v46: SUPERNOVA (NOVA level 4): 4 shells per volley, main one unchanged, 3 small ones spread over different enemies,
// same fire rate; glyph L1..L4 on one board; L3->L4 upgrade tooltip in EN/ZH/ES.
const { chromium } = require('playwright');
const SP = process.argv[2] || 'shots';
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  await p.evaluate(() => {
    localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang('en');
    window.__setup = (lvl, lvUp, ri = 0, frac = 0.5) => {
      const T = __TD, G = T.G; T.startLevel(lvl); G.gold = 99999; G.lives = 1e6;
      const pth = MAP.paths[ri]; let best = null, bd = 1e9;
      for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) {
        const x = c * 40 + 20, y = r * 40 + 20;
        for (let d = 0; d < pth.len; d += 5) { const q = pth.at(d); const dd = (q.x - x) ** 2 + (q.y - y) ** 2; const score = dd + Math.abs(d - frac * pth.len) * 3; if (dd < 42 * 42 && score < bd) { bd = score; best = { c, r, d }; } }
      }
      T.buildTower('nova', best.c, best.r); const tw = G.towers[G.towers.length - 1];
      for (let k = 0; k < lvUp; k++) T.upgradeTower(tw);
      return { tw, d: best.d };
    };
    window.__park = (type, d, lane = 0) => { const e = __TD.spawnEnemy(type, 1, lane, d); e.hp = e.maxHp = 1e6; e.speed = 0; e.age = 1; return e; };
    window.__spy = () => { const seen = []; const G = __TD.G, op = G.shells.push.bind(G.shells); G.shells.push = (...a) => { seen.push(...a); return op(...a); }; return seen; };
  });
  const out = {};
  // 1) four parked clusters of grunts in range: one volley = 1 main + 3 small, each small one on a different cluster
  out.volley = await p.evaluate(() => {
    const { tw, d } = __setup(12, 3); const G = __TD.G;
    const R = TOWERS.nova.lv[3].range * TILE, offs = [];
    for (let o = -400; o <= 400; o += 10) { const q = MAP.paths[0].at(d + o); if (Math.hypot(q.x - tw.x, q.y - tw.y) < R - 8) offs.push(o); }
    // pick 4 cluster centres spread across the in-range stretch
    const lo = offs[0], hi = offs[offs.length - 1], cl = [0, 1, 2, 3].map(i => Math.round(lo + (hi - lo) * i / 3));
    const enemies = []; cl.forEach(c => [-6, 0, 6].forEach(j => enemies.push({ e: __park('grunt', d + c + j), c })));
    const seen = __spy();
    for (let i = 0; i < 30 * 4 && !seen.length; i++) __TD.update(1 / 30);
    __TD.update(1 / 30);
    const shells = seen.map(s => ({ dmg: +s.dmg.toFixed(2), splash: +(s.splash / TILE).toFixed(2), small: !!s.small, from: [Math.round(s.sx - tw.x), Math.round(s.sy - tw.y)], at: [Math.round(s.tx), Math.round(s.ty)], dur: +s.dur.toFixed(2) }));
    const clusterOf = s => { let bc = null, bd = 1e9; enemies.forEach(o => { const dd = Math.hypot(o.e.x - s.at[0], o.e.y - s.at[1]); if (dd < bd) { bd = dd; bc = o.c; } }); return bc; };
    const hitClusters = new Set(shells.map(clusterOf));
    // let them land and see who took damage
    for (let i = 0; i < 30 * 1.5; i++) { G.towers[0].cd = 99; __TD.update(1 / 30); }
    const hurt = enemies.filter(o => o.e.hp < 1e6).length;
    return { inRangeStretch: [lo, hi], clusters: cl, shells, distinctClusters: hitClusters.size, enemies: enemies.length, hurt };
  });
  // 2) a lone grunt: extras fan out over the road; the lone grunt only takes the main shell
  out.lone = await p.evaluate(() => {
    const { tw, d } = __setup(12, 3); const G = __TD.G;
    const g = __park('grunt', d); const seen = __spy();
    for (let i = 0; i < 30 * 4 && !seen.length; i++) __TD.update(1 / 30);
    for (let i = 0; i < 30 * 1.5; i++) { G.towers[0].cd = 99; __TD.update(1 / 30); }
    const pts = seen.map(s => [s.tx, s.ty]); let minGap = 1e9;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) minGap = Math.min(minGap, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
    return { shells: seen.length, minGapTiles: +(minGap / TILE).toFixed(2), took: +(1e6 - g.hp).toFixed(2), mainDmg: TOWERS.nova.lv[3].dmg };
  });
  // 3) fire rate: L3 vs L4 volleys in 30 s (should match)
  out.rate = await p.evaluate(() => {
    const res = {};
    for (const lv of [2, 3]) {
      const { tw, d } = __setup(12, lv); __park('grunt', d);
      let n = 0; const of = window.fire; window.fire = (a, bb) => { if (a === tw) n++; return of(a, bb); };
      for (let i = 0; i < 30 * 30; i++) __TD.update(1 / 30);
      window.fire = of; res['L' + (lv + 1)] = { volleys: n, rate: TOWERS.nova.lv[lv].rate };
    }
    return res;
  });
  // 4) damage to a crowd in 20 s, L3 vs L4 (extra coverage = a bit more total damage)
  out.crowd = await p.evaluate(() => {
    const res = {};
    for (const lv of [2, 3]) {
      const { tw, d } = __setup(12, lv); const list = [];
      for (let o = -200; o <= 200; o += 22) list.push(__park('grunt', d + o));
      for (let i = 0; i < 30 * 20; i++) __TD.update(1 / 30);
      res['L' + (lv + 1)] = { total: Math.round(list.reduce((a, e) => a + 1e6 - e.hp, 0)), enemiesHit: list.filter(e => e.hp < 1e6).length, of: list.length };
    }
    return res;
  });
  console.log(JSON.stringify(out, null, 1));
  // visual: NOVA L1..L4 on one board, next to a crowd so the L4 fires
  await p.evaluate(() => {
    const T = __TD, G = T.G; T.startLevel(12); G.gold = 99999; G.lives = 1e6;
    const spots = []; for (let r = 2; r < 13 && spots.length < 4; r++) for (let c = 0; c < 9 && spots.length < 4; c++) if (T.isBuildable(c, r) && !spots.some(([a, b2]) => Math.abs(a - c) + Math.abs(b2 - r) < 2)) spots.push([c, r]);
    spots.forEach(([c, r], i) => { T.buildTower('nova', c, r); const tw = G.towers[G.towers.length - 1]; for (let k = 0; k < i; k++) T.upgradeTower(tw); });
    window.__spots = spots;
  });
  await p.waitForTimeout(1500); await p.screenshot({ path: `${SP}/nova-board.png` });
  // zoomed crop around the 4 towers
  const box = await p.evaluate(() => { const c = document.querySelector('canvas').getBoundingClientRect(); return { x: c.x, y: c.y, w: c.width, h: c.height }; });
  // in action: L4 firing at a crowd
  await p.evaluate(() => {
    const { tw, d } = __setup(12, 3);
    for (let o = -220; o <= 220; o += 16) { const e = __TD.spawnEnemy('grunt', 1, 0, d + o); e.hp = e.maxHp = 1e6; e.speed = 0; e.age = 1; }
    for (let i = 0; i < 30 * 3.2; i++) __TD.update(1 / 30);
    tw.cd = 0.02;
  });
  await p.waitForTimeout(420); await p.screenshot({ path: `${SP}/nova-volley.png` });
  for (const l of ['en', 'zh', 'es']) {
    await p.evaluate((l) => { setLang(l); const G = __TD.G; const { tw } = __setup(12, 2); G.menu = { kind: 'tower', tw, sel: 'up', t: 1, shake: 0, hand: 0 }; }, l);
    await p.waitForTimeout(500); await p.screenshot({ path: `${SP}/nova-tip-${l}.png` });
  }
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
