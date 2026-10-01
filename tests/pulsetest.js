// v41: LIVE WIRE (ARC level 4) chains to 8 like before; every zap also sends a pulse down all tracks (2.3 to each enemy it passes).
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  await p.evaluate(() => {
    localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang('en');
    // an ARC beside route `ri`, at fraction `frac` of the way along it
    window.__setup = (lvl, lvUp, ri = 0, frac = 0.5) => {
      const T = __TD, G = T.G; T.startLevel(lvl); G.gold = 99999; G.lives = 1e6;
      const pth = MAP.paths[ri]; let best = null, bd = 1e9;
      for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) {
        const x = c * 40 + 20, y = r * 40 + 20;
        for (let d = 0; d < pth.len; d += 5) { const q = pth.at(d); const dd = (q.x - x) ** 2 + (q.y - y) ** 2; const score = dd + Math.abs(d - frac * pth.len) * 3; if (dd < 42 * 42 && score < bd) { bd = score; best = { c, r, d }; } }
      }
      T.buildTower('arc', best.c, best.r); const tw = G.towers[G.towers.length - 1];
      for (let k = 0; k < lvUp; k++) T.upgradeTower(tw);
      return { tw, d: best.d };
    };
    window.__park = (type, d, lane = 0) => { const e = __TD.spawnEnemy(type, 1, 0 + lane, d); e.hp = e.maxHp = 1e6; e.speed = 0; e.age = 1; return e; };
  });
  const out = {};
  // 1) three grunts in range: only the one in front gets zapped; the others only get pulse damage
  out.front = await p.evaluate(() => {
    const { tw, d } = __setup(12, 3);
    const back = __park('grunt', d - 25), mid = __park('grunt', d), front = __park('grunt', d + 25);
    let zaps = 0; const of = window.fire; window.fire = (a, bb) => { if (a === tw) zaps++; return of(a, bb); };
    for (let i = 0; i < 30 * 10; i++) __TD.update(1 / 30);
    window.fire = of;
    const t = e => +(1e6 - e.hp).toFixed(1);
    return { zaps, front: t(front), mid: t(mid), back: t(back), frontExpect: +(zaps * 23.29).toFixed(1), midExpect: +(zaps * (23.29 * 0.85 + 2.3)).toFixed(1), backExpect: +(zaps * (23.29 * 0.7225 + 2.3)).toFixed(1) };
  });
  // 2) far enemies on the same track, ahead and behind, get 2.3 per pulse; a flyer gets nothing
  out.far = await p.evaluate(() => {
    const { tw, d } = __setup(12, 3, 0, 0.5); const L = MAP.paths[0].len;
    const tg = __park('grunt', d), nearPortal = __park('grunt', 20), nearCore = __park('grunt', L - 20), fly = __TD.spawnEnemy('glider', 1, 0, L * 0.3);
    fly.hp = fly.maxHp = 1e6; fly.speed = 0; fly.age = 1;
    let zaps = 0; const of = window.fire; window.fire = (a, bb) => { if (a === tw) zaps++; return of(a, bb); };
    for (let i = 0; i < 30 * 10; i++) __TD.update(1 / 30);
    window.fire = of;
    // let the pulses in flight finish
    const z = zaps; for (let i = 0; i < 30 * 5; i++) { __TD.G.towers.length = 0; __TD.update(1 / 30); }
    const t = e => +(1e6 - e.hp).toFixed(1);
    return { zaps: z, nearPortal: t(nearPortal), nearCore: t(nearCore), expect: +(z * 2.3).toFixed(1), flyer: t(fly), target: t(tg) };
  });
  // 3) pulse speed: time from the first zap to a far enemy's first hit ~= road tiles / 12
  out.speed = await p.evaluate(() => {
    const G = __TD.G; const { tw, d } = __setup(12, 3, 0, 0.5); const L = MAP.paths[0].len;
    const tg = __park('grunt', d), far = __park('grunt', 20);
    let t0 = null, t1 = null, t = 0;
    for (let i = 0; i < 30 * 8 && t1 == null; i++) { __TD.update(1 / 30); t += 1 / 30; if (t0 == null && tg.hp < 1e6) t0 = t; if (t1 == null && far.hp < 1e6) t1 = t; }
    return { tiles: +((d - 20) / 40).toFixed(1), seconds: +(t1 - t0).toFixed(2), expectSec: +((d - 20) / 40 / 12).toFixed(2) };
  });
  // 4) two lanes: the pulse runs down every track, including the other branch
  out.lanes = await p.evaluate(() => {
    let lvl = null;
    for (let n = 2; n < 80 && lvl == null; n++) { __TD.startLevel(n); if (MAP.paths.length > 1) lvl = n; }
    const { tw, d } = __setup(lvl, 3, 0, 0.25);
    const tg = __park('grunt', d, 0), other = __park('grunt', 30, 1), trunk = __park('grunt', MAP.paths[0].len - 30, 0);
    let zaps = 0; const of = window.fire; window.fire = (a, bb) => { if (a === tw) zaps++; return of(a, bb); };
    for (let i = 0; i < 30 * 8; i++) __TD.update(1 / 30);
    window.fire = of;
    const z = zaps; for (let i = 0; i < 30 * 5; i++) { __TD.G.towers.length = 0; __TD.update(1 / 30); }
    return { level: lvl, lanes: MAP.paths.length, zaps: z, otherBranch: +(1e6 - other.hp).toFixed(1), trunk: +(1e6 - trunk.hp).toFixed(1), expect: +(z * 2.3).toFixed(1) };
  });
  // 5) armor: a Titan takes the 30% floor (0.69) per pulse
  out.armor = await p.evaluate(() => {
    const { tw, d } = __setup(12, 3); const tg = __park('grunt', d), ti = __park('titan', 20);
    let zaps = 0; const of = window.fire; window.fire = (a, bb) => { if (a === tw) zaps++; return of(a, bb); };
    for (let i = 0; i < 30 * 6; i++) __TD.update(1 / 30);
    window.fire = of; const z = zaps; for (let i = 0; i < 30 * 5; i++) { __TD.G.towers.length = 0; __TD.update(1 / 30); }
    return { zaps: z, titan: +(1e6 - ti.hp).toFixed(2), perPulse: +((1e6 - ti.hp) / z).toFixed(2) };
  });
  // 6) level 4 has no target-mode button; level 3 still does
  out.menu = await p.evaluate(() => {
    const G = __TD.G; const { tw } = __setup(12, 3); const t3 = __setup(12, 2).tw;
    const ids = t => { G.menu = { kind: 'tower', tw: t, sel: null, t: 1, shake: 0, hand: 1 }; return menuLayout(G.menu).opts.map(o => o.id); };
    let r4, r3; try { r4 = ids(tw); r3 = ids(t3); } catch (e) { r4 = 'ERR ' + e.message; }
    G.menu = null; return { lv4: r4, lv3: r3 };
  });
  // 7) pictures: pulses racing down the road
  await p.evaluate(() => {
    const { tw, d } = __setup(12, 3, 0, 0.45); const L = MAP.paths[0].len;
    for (let i = 0; i < 14; i++) { const e = __TD.spawnEnemy('grunt', 1, 0, d + 20 - i * (L / 16)); if (e.dist < 0) continue; e.hp = e.maxHp = 1e5; e.speed = 0; e.age = 1; }
    for (let i = 0; i < 30 * 1.3; i++) __TD.update(1 / 30);
  });
  for (let i = 0; i < 4; i++) { await p.waitForTimeout(120); await p.screenshot({ path: `${SP}/pulse-${i}.png` }); }
  for (const l of ['en', 'zh', 'es']) {
    await p.evaluate((l) => { setLang(l); const G = __TD.G; const { tw } = __setup(12, 2); G.menu = { kind: 'tower', tw, sel: 'up', t: 1, shake: 0, hand: 0 }; }, l);
    await p.waitForTimeout(300); await p.screenshot({ path: `${SP}/pulse-tip-${l}.png` });
  }
  await p.evaluate(() => { setLang('en'); __TD.G.menu = null; });
  console.log(JSON.stringify(out, null, 1));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
