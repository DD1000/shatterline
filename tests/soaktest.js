// v47: TIDE soaks enemies for good (ARC +20%, PYRO -20%, FROST freezes soaked enemies: 3 / 2 supercharged / 2 at L4 /
// 1 at L4 supercharged). AUTO BUILD is only offered with the same set of towers as the lost try.
const { chromium } = require('playwright');
const SP = process.argv[2] || 'shots';
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  await p.evaluate(() => {
    localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang('en');
    window.__setup = (type, lvUp, lvl = 12, frac = 0.5) => {
      const T = __TD, G = T.G; T.startLevel(lvl); G.gold = 99999; G.lives = 1e6;
      const pth = MAP.paths[0]; let best = null, bd = 1e9;
      for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) {
        const x = c * 40 + 20, y = r * 40 + 20;
        for (let d = 0; d < pth.len; d += 5) { const q = pth.at(d); const dd = (q.x - x) ** 2 + (q.y - y) ** 2; const score = dd + Math.abs(d - frac * pth.len) * 3; if (dd < 42 * 42 && score < bd) { bd = score; best = { c, r, d }; } }
      }
      T.buildTower(type, best.c, best.r); const tw = G.towers[G.towers.length - 1];
      for (let k = 0; k < lvUp; k++) T.upgradeTower(tw);
      return { tw, d: best.d };
    };
    window.__park = (type, d) => { const e = __TD.spawnEnemy(type, 1, 0, d); e.hp = e.maxHp = 1e6; e.speed = 0; e.age = 1; return e; };
  });
  const out = {};
  // 1) TIDE soaks: 3 grunts in range get soaked (jets go for dry ones first) and stay soaked after walking away
  out.soak = await p.evaluate(() => {
    const G = __TD.G; const { tw, d } = __setup('tide', 0);
    const es = [-20, 0, 20].map(o => __park('grunt', d + o));
    let t = 0, all = null; for (let i = 0; i < 30 * 6; i++) { __TD.update(1 / 30); t += 1 / 30; if (all == null && es.every(e => e.soaked)) all = +t.toFixed(2); }
    G.towers.length = 0; es.forEach(e => { e.speed = 40; }); for (let i = 0; i < 30 * 8; i++) __TD.update(1 / 30);
    return { allSoakedAt: all, stillSoakedAfterWalking: es.filter(e => e.alive).every(e => e.soaked), alive: es.filter(e => e.alive).length };
  });
  // 2) damage multipliers through damage(): ARC x1.2, PYRO x0.8, others x1 (on an unarmored grunt)
  out.mult = await p.evaluate(() => {
    __setup('bolt', 0); const res = {};
    for (const src of ['arc', 'pyro', 'bolt', 'nova']) {
      const dry = __park('grunt', 100), wet = __park('grunt', 140); wet.soaked = true;
      DMG_SRC = src; damage(dry, 10, { quiet: true }); damage(wet, 10, { quiet: true }); DMG_SRC = null;
      res[src] = +((1e6 - wet.hp) / (1e6 - dry.hp)).toFixed(3);
    }
    return res;
  });
  // 3) in play: an ARC L1 and a PYRO L1 against a dry vs a soaked grunt (10 s each)
  out.play = await p.evaluate(() => {
    const res = {};
    for (const type of ['arc', 'pyro']) for (const wet of [false, true]) {
      const { tw, d } = __setup(type, 0); const e = __park('grunt', d); e.soaked = wet;
      for (let i = 0; i < 30 * 10; i++) __TD.update(1 / 30);
      res[type + (wet ? '_wet' : '_dry')] = Math.round(1e6 - e.hp);
    }
    res.arcRatio = +(res.arc_wet / res.arc_dry).toFixed(3); res.pyroRatio = +(res.pyro_wet / res.pyro_dry).toFixed(3);
    return res;
  });
  // 4) FROST: blasts until the first freeze, and freezes in 12 blasts, for each case
  out.frost = await p.evaluate(() => {
    const res = {};
    const cases = [['L1 dry', 0, false, false], ['L1 dry supercharged', 0, false, true], ['L1 soaked', 0, true, false], ['L1 soaked supercharged', 0, true, true],
                   ['L4 dry', 3, false, false], ['L4 soaked', 3, true, false], ['L4 soaked supercharged', 3, true, true], ['L3 soaked', 2, true, false]];
    for (const [name, lv, wet, sup] of cases) {
      const { tw, d } = __setup('frost', lv); const e = __park('grunt', d); e.soaked = wet;
      let blasts = 0, first = null, freezes = 0, was = false;
      const of = window.fire; window.fire = (a, bb) => { const r = of(a, bb); if (a === tw) { blasts++; if (e.iceLock > 0 && !was) { freezes++; if (first == null) first = blasts; } } return r; };
      for (let i = 0; i < 30 * 30 && blasts < 12; i++) { if (sup) tw.chillT = 99; was = e.iceLock > 0; __TD.update(1 / 30); }
      window.fire = of;
      res[name] = { firstFreezeOnBlast: first, freezesIn12: freezes };
    }
    return res;
  });
  // 5) AUTO BUILD: same towers (any order) -> asked; different towers -> not asked; a pre-v47 try -> asked only if it
  //    built nothing outside the loadout
  out.auto = await p.evaluate(() => {
    const T = __TD, G = T.G, LV = 12; Save.d.max = Math.max(Save.d.max, 60);
    const rec = [{ k: 'b', w: 0, t: 1, type: 'bolt', c: 0, r: 0 }, { k: 'b', w: 1, t: 1, type: 'frost', c: 1, r: 0 }];
    const ask = (lo, saved) => { Save.d.loadout = lo.slice(); Save.d.replays = { [LV]: Object.assign({ rec, reached: 3, waves: 7, at: Date.now() }, saved) }; T.startLevel(LV); return { loadout: G.loadout.slice(), asked: !!G.autoAsk }; };
    return {
      same: ask(['bolt', 'frost', 'nova'], { lo: ['bolt', 'frost', 'nova'] }),
      sameOtherOrder: ask(['nova', 'bolt', 'frost'], { lo: ['bolt', 'frost', 'nova'] }),
      swapped: ask(['bolt', 'frost', 'arc'], { lo: ['bolt', 'frost', 'nova'] }),
      fewer: ask(['bolt', 'frost'], { lo: ['bolt', 'frost', 'nova'] }),
      legacyOk: ask(['bolt', 'frost', 'arc'], {}),
      legacyMissing: ask(['bolt', 'nova', 'arc'], {}),
    };
  });
  // 6) the lost try saves its loadout
  out.saves = await p.evaluate(() => {
    const T = __TD, G = T.G; Save.d.loadout = ['bolt', 'frost', 'nova']; Save.d.replays = {}; T.startLevel(12); G.lives = 1e6;
    T.buildTower('bolt', 0, 0); playerWave(false); for (let i = 0; i < 30 * 3; i++) T.update(1 / 30); endGame(false);
    const R = Save.d.replays[12]; return { saved: !!R, lo: R && R.lo };
  });
  console.log(JSON.stringify(out, null, 1));
  // visual: soaked vs dry enemies, one frozen with 2 pips (L4 FROST), TIDE spraying
  await p.evaluate(() => {
    const G = __TD.G; Save.d.replays = {}; const { tw, d } = __setup('tide', 3);
    const list = []; for (let o = -160; o <= 160; o += 26) list.push(__park(o % 52 === 0 ? 'brute' : 'grunt', d + o));
    for (let i = 0; i < 30 * 4; i++) __TD.update(1 / 30);
    const dry = __park('grunt', d + 260); const dry2 = __park('scout', d + 290);
  });
  await p.waitForTimeout(700); await p.screenshot({ path: `${SP}/soak-board.png` });
  // build-menu tip for TIDE in EN/ZH/ES
  for (const l of ['en', 'zh', 'es']) {
    await p.evaluate(l => {
      setLang(l); const T = __TD, G = T.G; Save.d.max = Math.max(Save.d.max, 60); Save.d.loadout = ['tide', 'frost', 'arc', 'pyro']; T.startLevel(55); G.gold = 9999;
      let spot = null; for (let r = 4; r < 13 && !spot; r++) for (let c = 0; c < 9 && !spot; c++) if (T.isBuildable(c, r)) spot = [c, r];
      G.menu = { kind: 'build', c: spot[0], r: spot[1], sel: 'tide', t: 1, shake: 0, hand: 0 };
    }, l);
    await p.waitForTimeout(500); await p.screenshot({ path: `${SP}/soak-tip-${l}.png` });
  }
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
