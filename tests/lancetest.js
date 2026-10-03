// v48: LANCE, the long-range sniper. Hits ground and air, aims at the toughest enemy by default, big hits shrug off armor,
// and level 4 (DEADEYE) shatters any non-boss enemy its shot leaves under 25% health. Plus its text, sounds and unlock.
const { chromium } = require('playwright');
const SP = process.argv[2] || 'shots';
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  await p.evaluate(() => {
    localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang('en'); window.__TD_DEBUG = true;
    // a tower on the buildable tile nearest the middle of the map
    window.__setup = (type, lvUp, lvl = 45) => {
      const T = __TD, G = T.G; T.startLevel(lvl); G.gold = 99999; G.lives = 1e6; G.tutorial = false;
      let best = null, bd = 1e9;
      for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) { const d = (c - 4) ** 2 + (r - 6) ** 2; if (d < bd) { bd = d; best = { c, r }; } }
      const tw = T.buildTower(type, best.c, best.r); for (let k = 0; k < lvUp; k++) T.upgradeTower(tw);
      tw.spawn = 1; tw.cd = 0; return tw;
    };
    // park an enemy on its path at the spot closest to `tiles` away from the tower
    window.__park = (type, tw, tiles, hp = 1e6) => {
      const e = __TD.spawnEnemy(type, 1, 0, 0), path = e.path;
      let bd = 1e9, bdist = 0;
      for (let d = 0; d < path.len; d += 2) { const q = path.at(d), k = Math.abs(Math.hypot(q.x - tw.x, q.y - tw.y) - tiles * TILE); if (k < bd) { bd = k; bdist = d; } }
      e.dist = bdist; const q = path.at(bdist); e.x = q.x; e.y = q.y; e.speed = 0; e.age = 1; e.hp = e.maxHp = hp;
      return e;
    };
    window.__run = (sec) => { for (let i = 0; i < Math.round(sec * 30); i++) __TD.update(1 / 30); };
    window.__dist = (tw, e) => +(Math.hypot(e.x - tw.x, e.y - tw.y) / TILE).toFixed(2);
  });
  const out = {};
  // 1) data: unlocks at level 40 (in the gap between FLAK at 32 and PYRO at 47), costs and stats
  out.data = await p.evaluate(() => ({ unlock: TOWERS.lance.unlock, order: TOWER_ORDER.indexOf('lance'), level40New: LEVELS[39].newTower,
    lv: TOWERS.lance.lv.map(l => [l.cost || TOWERS.lance.cost, l.dmg, l.rate, l.range]), dps: TOWERS.lance.lv.map(l => +(l.dmg * l.rate).toFixed(1)) }));
  // 2) it hits flyers (a BOLT next to it does not), one shot every 2.5 s
  out.air = await p.evaluate(() => {
    const tw = __setup('lance', 0), g = __park('glider', tw, 3), r = {};
    __run(3.1); r.lanceDmgIn3s = Math.round(1e6 - g.hp); r.gliderDist = __dist(tw, g);
    const tb = __setup('bolt', 0), g2 = __park('glider', tb, 1.5); __run(3); r.boltDmg = Math.round(1e6 - g2.hp);
    return r;
  });
  // 3) default target mode is the toughest enemy; damage per hit on a grunt and through a Titan's armor (7)
  out.target = await p.evaluate(() => {
    const tw = __setup('lance', 0), weak = __park('grunt', tw, 2, 5000), strong = __park('grunt', tw, 4, 50000);
    __run(0.2);
    return { mode: tw.mode, hitStrongFirst: strong.hp < 50000 && weak.hp === 5000, perHitGrunt: Math.round(50000 - strong.hp) };
  });
  out.armor = await p.evaluate(() => { const tw = __setup('lance', 0), t = __park('titan', tw, 3); __run(0.2); return { perHitTitan: Math.round(1e6 - t.hp) }; });
  // 4) range: 6 tiles at level 1 (7.5 at level 4)
  out.range = await p.evaluate(() => {
    const r = {};
    let tw = __setup('lance', 0), e = __park('grunt', tw, 5.6); __run(0.5); r.at = __dist(tw, e); r.hitInside = e.hp < 1e6;
    tw = __setup('lance', 0); e = __park('grunt', tw, 6.9); __run(0.5); r.out = __dist(tw, e); r.hitOutside = e.hp < 1e6;
    tw = __setup('lance', 3); e = __park('grunt', tw, 7.2); __run(0.5); r.l4at = __dist(tw, e); r.l4hit = e.hp < 1e6;
    return r;
  });
  // 5) DEADEYE: a hit that leaves a non-boss under 25% shatters it; healthy enemies and bosses just take the hit
  out.deadeye = await p.evaluate(() => {
    const T = __TD, G = T.G, r = {};
    let tw = __setup('lance', 3), e = __park('grunt', tw, 3, 400); e.hp = 150; __run(0.2);
    r.lowGruntDead = !e.alive; r.executes = G.run.executes; r.l4name = TOWERS.lance.lv[3].deadeye;
    tw = __setup('lance', 3); e = __park('grunt', tw, 3, 400); __run(0.2); r.fullGruntHp = Math.round(e.hp); r.fullGruntAlive = e.alive;
    tw = __setup('lance', 3); e = __park('boss', tw, 3, 2000); e.hp = 300; __run(0.2); r.bossAlive = e.alive; r.bossHp = Math.round(e.hp);
    tw = __setup('lance', 2); e = __park('grunt', tw, 3, 400); e.hp = 150; __run(0.2); r.level3NoExecute = e.alive;
    return r;
  });
  // 6) sounds play without errors
  await p.mouse.click(5, 5);
  out.sound = await p.evaluate(() => { Sound.init(); Sound.setEnabled(true); for (const k of ['snipe', 'deadeye', 'crack']) Sound.play(k, true); return 'played'; });
  // 7) text fits in 4 lines: every tower's text in tooltips (260px at 11px) and in the unlock popup (218px at 10px), DEADEYE's line
  out.fit = await p.evaluate(() => {
    const res = { over: [] };
    for (const l of ['en', 'zh', 'es']) {
      setLang(l);
      for (const t of TOWER_ORDER) {
        setFont(11, FONT_UI, 500); const tip = wrapLines(tDesc(t), 260).length;
        setFont(10, FONT_UI, 500); const pop = wrapLines(tDesc(t), 300 - 82).length;
        if (tip > 4 || pop > 4) res.over.push(`${l} ${t} tooltip ${tip} popup ${pop}`);
      }
      setFont(11, FONT_UI, 500); res['deadeye_' + l] = wrapLines(tr('deadeye_line', 25, 7.5), 260).length;
    }
    setLang('en'); return res;
  });
  // screenshots: LANCE at level 4 sighting a Glider mid-charge, then its build and DEADEYE tooltips in each language
  await p.evaluate(() => {
    const T = __TD, G = T.G; T.Save.d.max = 45; G.loadout = ['bolt', 'lance', 'flak', 'emp'];
    const tw = __setup('lance', 3); G.loadout = ['bolt', 'lance', 'flak', 'emp'];
    const g = __park('glider', tw, 3.5, 1e6); g.shield = g.shieldMax = 200; __park('titan', tw, 5, 1e6);
    tw.mode = 'first'; __run(0.2); tw.mode = 'strong'; G.paused = false; window.__tw = tw;
    for (let i = 0; i < 36; i++) T.update(1 / 30);          // the sight half-charged
  });
  await p.waitForTimeout(250); await p.screenshot({ path: `${SP}/lance-sight.png` });
  for (const l of ['en', 'zh', 'es']) {
    await p.evaluate((l) => { setLang(l); const G = __TD.G; let c = 0, r = 0;
      for (let rr = 12; rr >= 0; rr--) for (let cc = 0; cc < 9; cc++) if (__TD.isBuildable(cc, rr) && !G.grid[rr * 9 + cc] && !c) { c = cc; r = rr; }
      G.menu = { kind: 'build', c, r, sel: 'lance', t: 1, shake: 0, hand: 1 }; }, l);
    await p.waitForTimeout(250); await p.screenshot({ path: `${SP}/lance-build-${l}.png` });
    await p.evaluate(() => { const G = __TD.G, tw = window.__tw; tw.lv = 2; G.menu = { kind: 'tower', tw, sel: 'up', t: 1, shake: 0, hand: 1 }; });
    await p.waitForTimeout(250); await p.screenshot({ path: `${SP}/lance-deadeye-tip-${l}.png` });
    await p.evaluate(() => { window.__tw.lv = 3; __TD.G.menu = null; });
  }
  // the unlock popup after beating level 39, and level 40's card with 13 towers in the loadout grid
  for (const l of ['en', 'zh', 'es']) {
    await p.evaluate((l) => { setLang(l); const T = __TD, G = T.G; T.Save.d.max = 39; T.Save.store(); T.startLevel(39); G.lives = 10; G.maxLives = 10; endGame(true); }, l);
    await p.waitForTimeout(2600); await p.screenshot({ path: `${SP}/lance-unlock-${l}.png` });
    out['unlocked_' + l] = await p.evaluate(() => __TD.G.unlockedTower);
  }
  await p.evaluate(() => { setLang('en'); const S = __TD.Save; S.d.max = 40; S.d.loadout = ['bolt', 'lance', 'flak', 'emp']; __TD.toMap(); __TD.openCard(40); });
  await p.waitForTimeout(700); await p.screenshot({ path: `${SP}/lance-card40.png` });
  await p.setViewportSize({ width: 360, height: 640 }); await p.waitForTimeout(500); await p.screenshot({ path: `${SP}/lance-card40-small.png` });
  console.log(JSON.stringify(out, null, 1));
  const ok = out.air.lanceDmgIn3s === 120 && out.air.boltDmg === 0 && out.target.mode === 'strong' && out.target.hitStrongFirst && out.target.perHitGrunt === 60 &&
    out.armor.perHitTitan === 53 && out.range.hitInside && !out.range.hitOutside && out.range.l4hit && out.deadeye.lowGruntDead && out.deadeye.executes === 1 &&
    out.deadeye.fullGruntAlive && out.deadeye.bossAlive && out.deadeye.level3NoExecute && out.unlocked_en === 'lance' && out.data.level40New === 'lance' &&
    !out.fit.over.length && ['en', 'zh', 'es'].every(l => out.fit['deadeye_' + l] <= 4);
  console.log(ok ? 'lance ok' : 'LANCE CHECK FAILED');
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
