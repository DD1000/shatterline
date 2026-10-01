// v28: run analytics, COMPLETED stamp, SEND LAB ANALYTICS. Usage: node antest.js <shot dir>
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve('dist/index.html')); await p.waitForTimeout(600);
  await p.evaluate(() => { localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang('en'); const S = __TD.Save; S.d.lab = {}; S.d.runs = []; S.store(); });
  const out = {};

  // 1) play part of lab 2 with a few towers, then win it
  out.lab = await p.evaluate(() => {
    const T = __TD, G = T.G; T.startLevel(102); G.gold = 5000;
    const spots = []; for (let r = 0; r < 13 && spots.length < 8; r++) for (let c = 0; c < 9 && spots.length < 8; c++) if (T.isBuildable(c, r)) spots.push([c, r]);
    const types = ['nova', 'bolt', 'arc', 'frost'];
    spots.forEach(([c, r], i) => T.buildTower(types[i % 4], c, r));
    T.upgradeTower(G.towers[0]); T.upgradeTower(G.towers[0]); T.upgradeTower(G.towers[1]);
    T.sellTower(G.towers[G.towers.length - 1]);
    G.lives = 1e6;
    for (let w = 0; w < 3; w++) { T.startWave(w > 0); for (let i = 0; i < 30 * 40 && !(G.waveStats[G.waveNum] && G.waveStats[G.waveNum].alive === 0 && G.waveStats[G.waveNum].toSpawn === 0 && G.spawners.every(s => s.i >= s.list.length)); i++) T.update(1 / 30); }
    G.lives = 8; G.maxLives = 10; endGame(true);
    const r = T.Save.d.lab[102];
    return { plays: r.plays, wins: r.wins, doneV: r.doneV, stamped: r.stamped, run: r.runs && r.runs[0] };
  });
  // 2) the lab screen: the stamp slams down (screens through the animation)
  await p.evaluate(() => { __TD.toLab(); });
  for (const [ms, name] of [[250, 'a-before'], [120, 'b-falling'], [170, 'c-impact'], [120, 'd-after'], [900, 'e-settled']]) { await p.waitForTimeout(ms); await p.screenshot({ path: `${SP}/an-${name}.png` }); }
  out.afterAnim = await p.evaluate(() => ({ stamped: __TD.Save.d.lab[102].stamped, hit: Object.keys(__TD.LABFX.hit) }));
  // 3) analytics overlay + copy
  out.btn = await p.evaluate(() => { const h = hits.filter(h => h.h === 50 && h.w === 300); if (h[0]) h[0].cb(); return h.length; });
  await p.waitForTimeout(300); await p.screenshot({ path: `${SP}/an-overlay.png` });
  await p.click('#an-yes'); await p.waitForTimeout(300);
  out.copy = await p.evaluate(async () => ({ msg: document.getElementById('an-msg').textContent, same: (await navigator.clipboard.readText()) === document.getElementById('an-txt').value }));
  out.report = await p.evaluate(() => document.getElementById('an-txt').value);
  await p.click('#an-no'); out.closed = await p.evaluate(() => !document.getElementById('an-box'));
  // 4) a campaign run abandoned mid-level is saved as a quit
  out.camp = await p.evaluate(() => {
    const T = __TD, G = T.G; T.startLevel(5); G.gold = 500;
    for (let r = 0; r < 13; r++) { let done = false; for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) { T.buildTower('bolt', c, r); done = true; break; } if (done) break; }
    T.startWave(false); for (let i = 0; i < 300; i++) T.update(1 / 30);
    G.paused = true; G.pauseMenu = true; retryLevel();
    const a = T.Save.d.runs; return { n: a.length, res: a[0] && a[0].res, built: a[0] && a[0].built, wave: a[0] && a[0].wave };
  });
  // 5) reload: the stamp is already down (no second slam), then the other languages
  await p.reload(); await p.waitForTimeout(500);
  await p.evaluate(() => { __TD.toLab(); }); await p.waitForTimeout(700); await p.screenshot({ path: `${SP}/an-reload.png` });
  out.reloadHits = await p.evaluate(() => Object.keys(__TD.LABFX.hit).length);
  for (const l of ['zh', 'es']) { await p.evaluate(l => setLang(l), l); await p.waitForTimeout(300); await p.screenshot({ path: `${SP}/an-${l}.png` }); }
  console.log(JSON.stringify({ ...out, report: undefined }, null, 1));
  console.log('----- REPORT -----\n' + out.report);
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
