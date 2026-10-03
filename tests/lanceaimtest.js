// v49: LANCE's AIR target mode (the toughest flyer in range; with no flyers, the toughest ground enemy), and its no-repeat
// rule: it never shoots the same enemy twice in a row unless that is the only one it can shoot (in AIR, the only flyer) or a
// boss. Plus EMP's damage: 3.3x, then doubled, then 30% less (4.62x v48).
const { chromium } = require('playwright');
const SP = process.argv[2] || 'shots';
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  await p.evaluate(() => {
    localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang('en');
    window.__setup = (type, lvUp, mode) => {
      const T = __TD, G = T.G; T.startLevel(45); G.gold = 99999; G.lives = 1e6; G.tutorial = false;
      let best = null, bd = 1e9;
      for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) { const d = (c - 4) ** 2 + (r - 6) ** 2; if (d < bd) { bd = d; best = { c, r }; } }
      const tw = T.buildTower(type, best.c, best.r); for (let k = 0; k < lvUp; k++) T.upgradeTower(tw);
      tw.spawn = 1; tw.cd = 0; if (mode) tw.mode = mode; return tw;
    };
    window.__park = (type, tw, tiles, hp) => {
      const e = __TD.spawnEnemy(type, 1, 0, 0), path = e.path;
      let bd = 1e9, bdist = 0;
      for (let d = 0; d < path.len; d += 2) { const q = path.at(d), k = Math.abs(Math.hypot(q.x - tw.x, q.y - tw.y) - tiles * TILE); if (k < bd) { bd = k; bdist = d; } }
      e.dist = bdist; const q = path.at(bdist); e.x = q.x; e.y = q.y; e.speed = 0; e.age = 1; e.hp = e.maxHp = hp;
      return e;
    };
    // which of `es` each of the next n shots hits (one shot every 2.5 s; the first goes off at once)
    window.__shots = (es, n) => {
      const seq = [];
      for (let k = 0; k < n; k++) {
        const before = es.map(e => e.hp);
        for (let i = 0; i < (k ? 75 : 9); i++) __TD.update(1 / 30);
        const hit = es.map((e, j) => before[j] - e.hp > 0.5 ? j : -1).filter(j => j >= 0);
        seq.push(hit.length === 1 ? hit[0] : hit.length ? hit.join('+') : '-');
      }
      return seq.join(' ');
    };
  });
  const out = {};
  // 1) LANCE's modes, in tap order; other towers keep the usual three
  out.modes = await p.evaluate(() => {
    const tw = __setup('lance', 0), r = { lance: modesOf(tw).join(' '), start: tw.mode, bolt: modesOf(__setup('bolt', 0)).join(' ') };
    const t2 = __setup('lance', 0), seq = [t2.mode];
    for (let i = 0; i < 4; i++) { commitOption({ kind: 'tower', tw: t2 }, 'mode'); seq.push(t2.mode); }
    r.taps = seq.join(' > '); return r;
  });
  // 2) AIR: two Gliders and a much tougher grunt. It alternates between the Gliders (toughest first) and never shoots the grunt
  out.airTwo = await p.evaluate(() => {
    const tw = __setup('lance', 0, 'air'), g = __park('grunt', tw, 2, 50000), a = __park('glider', tw, 3, 8000), b2 = __park('glider', tw, 4, 3000);
    return __shots([g, a, b2], 5);                // 0 = grunt, 1 = tough Glider, 2 = weak Glider
  });
  // 3) AIR with one Glider: it is the only flyer, so it takes every shot
  out.airOne = await p.evaluate(() => { const tw = __setup('lance', 0, 'air'), g = __park('grunt', tw, 2, 50000), a = __park('glider', tw, 3, 8000); return __shots([g, a], 4); });
  // 4) AIR with no flyers: the toughest ground enemy, then the other one (no repeat)
  out.airNone = await p.evaluate(() => { const tw = __setup('lance', 0, 'air'), s = __park('grunt', tw, 2, 50000), w = __park('grunt', tw, 4, 5000); return __shots([s, w], 4); });
  // 5) STRONG (the default) also alternates; a lone enemy takes every shot; a boss takes every shot
  out.strong = await p.evaluate(() => { const tw = __setup('lance', 0), s = __park('grunt', tw, 2, 50000), w = __park('grunt', tw, 4, 5000); return __shots([s, w], 4); });
  out.lone = await p.evaluate(() => { const tw = __setup('lance', 0), s = __park('grunt', tw, 3, 50000); return __shots([s], 3); });
  out.boss = await p.evaluate(() => { const tw = __setup('lance', 0), w = __park('boss', tw, 3, 1e6), s = __park('grunt', tw, 2, 50000); return __shots([w, s], 4); });
  out.first = await p.evaluate(() => { const tw = __setup('lance', 0, 'first'), a = __park('grunt', tw, 2, 50000), c = __park('grunt', tw, 4, 50000); return __shots([a, c], 4); });
  // 6) EMP: 4.62x v48's damage (one laser a shot on a lone grunt, 1.1 shots a second)
  out.emp = await p.evaluate(() => {
    const r = { dmg: TOWERS.emp.lv.map(l => l.dmg).join(' / ') };
    const tw = __setup('emp', 0), e = __park('grunt', tw, 1.2, 1e6);
    for (let i = 0; i < 300; i++) __TD.update(1 / 30); r.lone10s = +(1e6 - e.hp).toFixed(1);
    return r;
  });
  // 7) text: the AIR line fits a tooltip (4 lines at 260px) in every language
  out.fit = await p.evaluate(() => { const r = {}; for (const l of ['en', 'zh', 'es']) { setLang(l); setFont(11, FONT_UI, 500); r[l] = wrapLines(tr('mdesc_air'), 260).length; } setLang('en'); return r; });
  // screenshots: the mode tooltip (STRONG -> AIR) in each language, and the AIR button with LANCE sighting a Glider
  for (const l of ['en', 'zh', 'es']) {
    await p.evaluate((l) => {
      setLang(l); const tw = __setup('lance', 1); __park('glider', tw, 3, 1e6); __park('grunt', tw, 2, 1e6);
      for (let i = 0; i < 20; i++) __TD.update(1 / 30);
      __TD.G.menu = { kind: 'tower', tw, sel: 'mode', t: 1, shake: 0, hand: 1 };
    }, l);
    await p.waitForTimeout(300); await p.screenshot({ path: `${SP}/lance-mode-${l}.png` });
  }
  await p.evaluate(() => {
    setLang('en'); const tw = __setup('lance', 3, 'air'); __park('glider', tw, 3, 1e6); __park('grunt', tw, 2, 1e6);
    for (let i = 0; i < 50; i++) __TD.update(1 / 30);
    __TD.G.menu = { kind: 'tower', tw, sel: null, t: 1, shake: 0, hand: 1 };
  });
  await p.waitForTimeout(300); await p.screenshot({ path: `${SP}/lance-air-button.png` });
  console.log(JSON.stringify(out, null, 1));
  const ok = out.modes.lance === 'first strong air close' && out.modes.start === 'strong' && out.modes.bolt === 'first strong close' &&
    out.modes.taps === 'strong > air > close > first > strong' &&
    out.airTwo === '1 2 1 2 1' && out.airOne === '1 1 1 1' && out.airNone === '0 1 0 1' && out.strong === '0 1 0 1' &&
    out.lone === '0 0 0' && out.boss === '0 0 0 0' && out.first === '0 1 0 1' &&
    out.emp.dmg === '5.78 / 6.37 / 6.97 / 7.67' && Math.abs(out.emp.lone10s - 63.6) < 0.3 && Object.values(out.fit).every(n => n <= 4);
  console.log(ok ? 'lance aim ok' : 'LANCE AIM CHECK FAILED');
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
