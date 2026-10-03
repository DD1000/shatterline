// v48: VAULT MINTS and SKY SHIELDS, two new Playtest Labs.
// VAULT MINTS (level 25 with its own campaign economy): each MINT holds a vault of 2.5x the gold spent on it, pays it out at
// the usual speed and then shatters. Upgrades top the vault up; selling refunds only the share still in the vault. Campaign
// MINTs and NO BOUNTY levels are unchanged. SKY SHIELDS: shielded Gliders; EMP strips shields in the air; LANCE hits flyers.
const { chromium } = require('playwright');
const SP = process.argv[2] || 'shots';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  await p.evaluate(() => {
    localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang('en');
    window.__lab = id => LAB_START + LAB.findIndex(l => l.lab.id === id);
    // a MINT on the first free tile; play the level (enemies die halfway along) until the MINT is gone or `sec` run out
    window.__mintRun = (n, sec, ups = 0) => {
      const T = __TD, G = T.G; T.startLevel(n); G.gold = 9999; G.lives = 1e6; G.tutorial = false;
      let tw = null;
      for (let r = 0; r < 13 && !tw; r++) for (let c = 0; c < 9 && !tw; c++) if (T.isBuildable(c, r)) tw = T.buildTower('mint', c, r);
      for (let k = 0; k < ups; k++) T.upgradeTower(tw);
      const v0 = tw.vault; let t = 0, goneAt = null;
      while (t < sec) {
        if (G.awaiting && G.waveNum < G.waves.length) T.startWave(false);
        for (const e of G.enemies) if (e.alive && e.dist > 0.5 * e.path.len) damage(e, 1e12, { quiet: true });
        T.update(1 / 30); t += 1 / 30;
        if (goneAt == null && !G.towers.includes(tw)) goneAt = +t.toFixed(1);
        if (goneAt != null) break;
      }
      return { vault0: v0, mintGold: G.run.mintGold, dried: G.run.dried, goneAt, gridFree: !G.grid[tw.r * 9 + tw.c], tw };
    };
  });
  const out = {};
  // 1) the two labs
  out.labs = await p.evaluate(() => {
    const v = levelOf(__lab('vault')), s = levelOf(__lab('skyguard'));
    return { count: LAB.length, vaultN: v.n, sameWavesAs25: JSON.stringify(v.waves) === JSON.stringify(LEVELS[24].waves), vaultGold: v.gold, econ: v.econ.key,
      killRate: v.econ.bounty, skyN: s.n, skyAir: s.air, skyShieldTypes: s.shieldTypes, skyEcon: s.econ.key };
  });
  // 2) a level 1 MINT pays exactly its 200-gold vault, then shatters and frees its tile
  out.l1 = await p.evaluate(() => { const r = __mintRun(__lab('vault'), 400); delete r.tw; return r; });
  // 3) an upgrade tops the vault up by 2.5x its cost; selling refunds only the share still in the vault
  out.upSell = await p.evaluate(() => {
    const T = __TD, G = T.G; T.startLevel(__lab('vault')); G.gold = 9999;
    let tw = null; for (let r = 0; r < 13 && !tw; r++) for (let c = 0; c < 9 && !tw; c++) if (T.isBuildable(c, r)) tw = T.buildTower('mint', c, r);
    const r = { l1Vault: tw.vault, l1Sell: sellValue(tw) };
    T.upgradeTower(tw); r.l2Vault = tw.vault; r.l2VaultMax = tw.vaultMax;
    tw.vault = tw.vaultMax / 2; r.l2SellHalf = sellValue(tw);
    G.noBounty = true; r.noBountyVaultOff = !vaultOn(); r.noBountySell = sellValue(tw); G.noBounty = false;
    return r;
  });
  // 4) the campaign is unchanged: on level 25 a MINT keeps paying past 200 and still sells for 70%
  out.campaign = await p.evaluate(() => { const r = __mintRun(25, 200); const res = { mintGold: r.mintGold, stillThere: r.goneAt == null, sell: sellValue(r.tw), vaultOn: vaultOn() }; return res; });
  // 5) the report and the condition
  out.report = await p.evaluate(() => {
    const T = __TD, G = T.G, n = __lab('vault'); __mintRun(n, 400); recordRun('lose');
    const txt = labReport(); return { econ: /VAULT MINTS \(kills 90%\)/.test(txt), mintLine: /MINT paid 200 gold · MINTs run dry 1/.test(txt), conds: levelNeeds(levelOf(n)).map(c => c.key) };
  });
  // 6) SKY SHIELDS: a shielded Glider wears a heavy shield; FLAK and LANCE only chip it (20%); an EMP laser strips it
  out.sky = await p.evaluate(() => {
    const T = __TD, G = T.G, n = __lab('skyguard'), res = {};
    const near = (type, ups) => {            // the free tile nearest the first flight line, and a Glider parked at the closest point
      T.startLevel(n); G.gold = 99999; G.lives = 1e6; G.tutorial = false;
      const fl = MAP.flights[0]; let best = null, bd = 1e9;
      for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) for (let d = 0; d < fl.len; d += 4) { const q = fl.at(d), k = (q.x - (c * 40 + 20)) ** 2 + (q.y - (r * 40 + 20)) ** 2; if (k < bd) { bd = k; best = { c, r, d }; } }
      const tw = T.buildTower(type, best.c, best.r); for (let k = 0; k < ups; k++) T.upgradeTower(tw); tw.spawn = 1; tw.cd = 0;
      const e = T.spawnEnemy('glider', 3, 0, best.d, 0, { shield: 1 }); e.speed = 0; e.age = 1; e.hp = e.maxHp = 1000; e.shield = e.shieldMax = 900;
      return { tw, e };
    };
    let { e } = near('emp', 0); res.shieldPct = 0.9;
    for (let i = 0; i < 45; i++) T.update(1 / 30); res.empStripped = e.shield === 0;
    ({ e } = near('lance', 0)); for (let i = 0; i < 10; i++) T.update(1 / 30); res.lanceIntoShield = Math.round(900 - e.shield); res.lanceHp = Math.round(e.hp);
    ({ e } = near('flak', 0)); for (let i = 0; i < 60; i++) T.update(1 / 30); res.flakIntoShield = Math.round(900 - e.shield); res.flakHp = Math.round(e.hp);
    // authored wave 3 really sends shielded Gliders
    T.startLevel(n); G.lives = 1e6; for (let w = 0; w < 3; w++) { G.awaiting = true; T.startWave(false); }
    for (let i = 0; i < 30 * 6; i++) T.update(1 / 30);
    const gl = G.enemies.filter(x => x.alive && x.type === 'glider'); res.wave3Gliders = gl.length; res.wave3Shielded = gl.filter(x => x.shieldMax > 0).length;
    return res;
  });
  // 7) every level condition's line fits its row on the level card (it may shrink, but not below 7.5px)
  out.condFit = await p.evaluate(() => {
    const bad = [], avail = Math.min(344, LW - 20) - 76;
    for (const l of ['en', 'zh', 'es']) { setLang(l); for (const k of Object.keys(CONDITIONS)) { setFont(10, FONT_UI, 500); const w = ctx.measureText(condLine(k, LAB[0])).width; if (w > avail && 10 * avail / w < 7.5) bad.push(l + ' ' + k); } }
    setLang('en'); return bad;
  });
  // screenshots: the vault gauge, the lab screen (14 labs) at two sizes, the vault card in each language, SKY SHIELDS in play
  await p.evaluate(() => {
    const T = __TD, G = T.G; T.startLevel(__lab('vault')); G.gold = 9999; G.lives = 1e6; G.tutorial = false;
    const spots = []; for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) spots.push([c, r]);
    [[0, 1], [3, 0.6], [6, 0.3], [9, 0.12]].forEach(([i, f], k) => { const tw = T.buildTower('mint', spots[i][0], spots[i][1]); for (let u = 0; u < k; u++) T.upgradeTower(tw); tw.vault = tw.vaultMax * f; });
    T.startWave(false); for (let i = 0; i < 60; i++) T.update(1 / 30);
  });
  await p.waitForTimeout(400); await p.screenshot({ path: `${SP}/vault-gauge.png` });
  await p.evaluate(() => { const G = __TD.G; const tw = G.towers.find(t => t.vault / t.vaultMax < 0.2); tw.vault = 1; tw.cd = 0; for (let i = 0; i < 4; i++) __TD.update(1 / 30); });
  await p.waitForTimeout(150); await p.screenshot({ path: `${SP}/vault-dry.png` });
  for (const [w, h] of [[390, 844], [360, 640]]) {
    await p.setViewportSize({ width: w, height: h });
    await p.evaluate(() => { __TD.toLab(); }); await p.waitForTimeout(900); await p.screenshot({ path: `${SP}/lab-screen-${w}.png` });
  }
  await p.setViewportSize({ width: 390, height: 844 });
  for (const l of ['en', 'zh', 'es']) {
    await p.evaluate((l) => { setLang(l); __TD.openCard(__lab('vault')); }, l); await p.waitForTimeout(700); await p.screenshot({ path: `${SP}/vault-card-${l}.png` });
    await p.evaluate((l) => { __TD.openCard(__lab('skyguard')); }, l); await p.waitForTimeout(700); await p.screenshot({ path: `${SP}/sky-card-${l}.png` });
  }
  await p.evaluate(() => {
    setLang('en'); const T = __TD, G = T.G; T.startLevel(__lab('skyguard')); G.gold = 9999; G.lives = 1e6; G.tutorial = false;
    G.loadout = ['emp', 'flak', 'lance', 'mint'];
    const fl = MAP.flights[0]; const spots = [];
    for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) { let bd = 1e9; for (let d = 0; d < fl.len; d += 6) { const q = fl.at(d); bd = Math.min(bd, (q.x - (c * 40 + 20)) ** 2 + (q.y - (r * 40 + 20)) ** 2); } spots.push([c, r, bd]); }
    spots.sort((a, b) => a[2] - b[2]);
    ['emp', 'flak', 'lance', 'emp', 'flak'].forEach((t, i) => { const tw = T.buildTower(t, spots[i * 2][0], spots[i * 2][1]); if (t === 'lance') { T.upgradeTower(tw); T.upgradeTower(tw); T.upgradeTower(tw); } });
    for (let w = 0; w < 3; w++) { G.awaiting = true; T.startWave(false); }
    for (let i = 0; i < 30 * 7; i++) T.update(1 / 30);
  });
  await p.waitForTimeout(300); await p.screenshot({ path: `${SP}/sky-play.png` });
  console.log(JSON.stringify(out, null, 1));
  const ok = out.labs.count === 14 && out.labs.sameWavesAs25 && out.labs.econ === 'vault' && out.labs.skyAir &&
    out.l1.vault0 === 200 && out.l1.mintGold === 200 && out.l1.dried === 1 && out.l1.goneAt != null && out.l1.gridFree &&
    out.upSell.l1Vault === 200 && out.upSell.l1Sell === 56 && out.upSell.l2Vault === 425 && out.upSell.l2SellHalf === 59 && out.upSell.noBountyVaultOff && out.upSell.noBountySell === Math.floor(170 * 0.7) &&
    out.campaign.mintGold > 200 && out.campaign.stillThere && out.campaign.sell === 56 && !out.campaign.vaultOn &&
    out.report.econ && out.report.mintLine && out.report.conds.includes('vault') &&
    !out.condFit.length && out.sky.empStripped && out.sky.lanceIntoShield === 12 && out.sky.lanceHp === 1000 && out.sky.flakIntoShield > 0 && out.sky.flakHp === 1000 && out.sky.wave3Shielded > 0;
  console.log(ok ? 'vault ok' : 'VAULT CHECK FAILED');
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
