// v42: boss versions of every regular enemy, modifiers on bosses, ARC immunity, EMP immune to shutdown, the two new labs.
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  await p.evaluate(() => {
    localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang('en');
    window.__spot = (near, maxD = 42) => {              // a free tile next to the road near distance `near`
      const T = __TD, G = T.G, pth = MAP.paths[0]; let best = null, bs = 1e9;
      for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r) && !G.grid[r * 9 + c]) {
        const x = c * 40 + 20, y = r * 40 + 20; const q = pth.at(near); const dd = Math.hypot(q.x - x, q.y - y);
        if (dd < bs) { bs = dd; best = [c, r]; }
      }
      return best;
    };
    window.__park = (type, d, mods, lane = 0) => { const e = __TD.spawnEnemy(type, 1, lane, d, 0, mods || null); e.speed = 0; e.age = 1; return e; };
  });
  const out = {};
  // 0) labs exist, campaign untouched
  out.labs = await p.evaluate(() => ({ n: __TD.LAB.length, last: __TD.LAB.slice(-2).map(l => [l.n, l.lab.id, l.waves.length, l.boss, l.air, l.paths.length]),
    campaignHasNewBosses: __TD.LEVELS.some(l => l.waves.some(g => g.some(x => x[0].startsWith('boss_')))),
    everyBossInLabs: BOSS_VERSIONS.every(k => __TD.LAB.some(l => l.waves.some(g => g.some(x => x[0] === k)))) }));
  // 1) spawn each boss: shout, boss bar name, flags
  out.spawn = await p.evaluate(() => {
    const T = __TD, G = T.G, res = {};
    for (const k of BOSS_VERSIONS) {
      T.startLevel(111); G.lives = 1e6;
      const e = T.spawnEnemy(k, 5, 0, 60);
      res[k] = { shout: G.shout && G.shout.text, hp: Math.round(e.maxHp), boss: !!e.rc.boss, flying: !!e.rc.flying, elec: e.elec, ice: e.ice, fire: e.fire, dome: Math.round(e.domeMax) };
    }
    return res;
  });
  // 2) signature tricks
  out.tricks = await p.evaluate(() => {
    const T = __TD, G = T.G, r = {};
    // Block King calls Blocks
    T.startLevel(111); G.lives = 1e6; let e = __park('boss_grunt', 80); e.hp = e.maxHp = 1e7;
    for (let i = 0; i < 30 * 5; i++) T.update(1 / 30);
    r.kingSummons = G.enemies.filter(x => x.alive && x.type === 'grunt').length;
    // Spore Mother bursts into 4 Spores
    T.startLevel(111); G.lives = 1e6; e = __park('boss_splitter', 120); e.hp = 1; G.waveStats[1] = G.waveStats[1] || { alive: 1, toSpawn: 0 };
    DMG_SRC = null; damage(e, 5, {}); r.motherSpores = G.enemies.filter(x => x.alive && x.type === 'splitter').length;
    // Fortress armor: a 12-damage hit does only 3.6 (30% floor)
    T.startLevel(111); e = __park('boss_brute', 80); const h0 = e.hp; damage(e, 12, { quiet: true }); r.fortressTook = +(h0 - e.hp).toFixed(2);
    // Bastion dome covers a Block 2 tiles away
    T.startLevel(111); e = __park('boss_aegis', 200); const g = __park('grunt', 200 - 80); T.update(1 / 30); r.bastionDome = !!domeOver(g);
    // Phantom teleports
    T.startLevel(111); G.lives = 1e6; e = __TD.spawnEnemy('boss_blink', 1, 0, 40); e.age = 1; e.hp = e.maxHp = 1e7; const d0 = e.dist;
    for (let i = 0; i < 30 * 4; i++) T.update(1 / 30);
    r.phantomJump = Math.round((e.dist - d0) / 40 - e.speed / 40 * 4);   // tiles beyond walking
    // Lifebloom heals others, not itself
    T.startLevel(112); e = __park('boss_mender', 150); const o = __park('grunt', 150 - 30); e.hp = e.maxHp * 0.5; o.hp = o.maxHp * 0.5;
    for (let i = 0; i < 30 * 5; i++) T.update(1 / 30);
    r.bloomSelf = +(e.hp / e.maxHp).toFixed(2); r.bloomOther = +(o.hp / o.maxHp).toFixed(2);
    // Stormwing flies: FLAK targets it, BOLT doesn't
    T.startLevel(112); G.gold = 1e5; e = __park('boss_glider', 200); e.hp = e.maxHp = 1e7;
    let s = __spot(200); T.buildTower('bolt', s[0], s[1]); s = __spot(200); T.buildTower('flak', s[0], s[1]);
    for (let i = 0; i < 30 * 3; i++) T.update(1 / 30);
    r.stormwingHitBy = { bolt: !!G.towers[0].target, flak: !!G.towers[1].target, hurt: e.hp < e.maxHp };
    return r;
  });
  // 3) Overload: 2.5-tile reach shuts a BOLT down 2 tiles away; EMP stays on; ARC can't hurt it but is supercharged
  out.overload = await p.evaluate(() => {
    const T = __TD, G = T.G; T.startLevel(112); G.gold = 1e5; G.lives = 1e6;
    const e = __park('boss_volt', 200); e.hp = e.maxHp = 1e6;
    const q = MAP.paths[0].at(200); const tiles = [];
    for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) { const dd = Math.hypot(c * 40 + 20 - q.x, r * 40 + 20 - q.y) / 40; if (dd > 1.5 && dd < 2.4) tiles.push([c, r, dd]); }
    const [a, bb, cc] = tiles;
    T.buildTower('bolt', a[0], a[1]); T.buildTower('emp', bb[0], bb[1]); T.buildTower('arc', cc[0], cc[1]);
    const [bolt, emp, arc] = G.towers;
    for (let i = 0; i < 30 * 1; i++) T.update(1 / 30);
    const r = { dists: [a[2], bb[2], cc[2]].map(v => +v.toFixed(2)), boltShorted: bolt.zapT > 0, empShorted: emp.zapT > 0, arcSuper: arc.zapT > 0 };
    // ARC alone against the live Overload: no damage, no target
    const hp0 = e.hp; let arcTargets = 0;
    for (let i = 0; i < 30 * 1.5; i++) { T.update(1 / 30); if (arc.target === e) arcTargets++; }
    r.arcTargetsIt = arcTargets; r.shortedByEmp = e.elecOff > 0;
    // once the EMP has shorted it, ARC can hurt it
    const hpA = e.hp; G.towers.splice(G.towers.indexOf(bolt), 1); G.grid[a[1] * 9 + a[0]] = null;
    let hurtWhileShorted = false; for (let i = 0; i < 30 * 3; i++) { T.update(1 / 30); if (e.elecOff > 0 && arc.target === e) hurtWhileShorted = true; }
    r.arcHitsShorted = hurtWhileShorted;
    return r;
  });
  // 4) modifiers on bosses (lab waves say it per group)
  out.mods = await p.evaluate(() => {
    const T = __TD, G = T.G; T.startLevel(111);
    const sh = __park('boss_grunt', 60, { shield: 1 }), el = __park('boss_brute', 90, { elec: 1 }), ic = __park('boss_splitter', 120, { ice: 1 }), fi = __park('boss_aegis', 150, { fire: 1 });
    return { shield: Math.round(sh.shieldMax), elec: el.elec && isLiveElec(el), ice: ic.ice, fire: fi.fire, labTypes: { shield: T.LAB[10].shieldTypes, elec: T.LAB[10].elecTypes } };
  });
  // 5) a plain Volt: ARC never targets it; the chain skips it
  out.volt = await p.evaluate(() => {
    const T = __TD, G = T.G; T.startLevel(40); G.gold = 1e5; G.lives = 1e6;
    const v = __park('volt', 200); v.hp = v.maxHp = 1e6; const g = __park('grunt', 215); g.hp = g.maxHp = 1e6;
    const s = __spot(207); T.buildTower('arc', s[0], s[1]); const arc = G.towers[0];
    for (let i = 0; i < 30 * 4; i++) T.update(1 / 30);
    return { voltHurt: v.hp < v.maxHp, gruntHurt: g.hp < g.maxHp, arcSuper: arc.zapT > 0 };
  });
  // 6) pictures: the lab screen, both lab cards, and all 12 bosses on a road
  await p.evaluate(() => { __TD.toLab(); });
  await p.waitForTimeout(900); await p.screenshot({ path: `${SP}/boss-labs.png` });
  for (const n of [111, 112]) { await p.evaluate(n => __TD.openCard(n), n); await p.waitForTimeout(500); await p.screenshot({ path: `${SP}/boss-card-${n}.png` }); }
  await p.evaluate(() => {
    const T = __TD, G = T.G; T.startLevel(111); G.lives = 1e6; const L = MAP.paths[0].len;
    BOSS_VERSIONS.forEach((k, i) => { const e = T.spawnEnemy(k, 1, 0, 40 + i * (L - 80) / 11); e.speed = 0; e.age = 2; e.hp = e.maxHp = 1e7; if (e.rc.flying) { e.dist = 40 + i * (MAP.flights[0].len - 80) / 11; } });
    G.shout = null;
  });
  await p.waitForTimeout(700); await p.screenshot({ path: `${SP}/boss-gallery.png` });
  console.log(JSON.stringify(out, null, 1));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
