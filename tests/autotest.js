// v43: AUTO BUILD. Play a scripted run, lose on wave 3, restart: the prompt appears (game frozen), the replay rebuilds
// everything at the same moments and tiles until the chosen wave, and a win clears the saved run.
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  const LV = 12;
  const out = {};
  out.orig = await p.evaluate((LV) => {
    localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang('en');
    const T = __TD, G = T.G; Save.d.replays = {};
    T.startLevel(LV); G.gold = 600; G.lives = 1e6;
    const spots = []; for (let r = 0; r < 13 && spots.length < 4; r++) for (let c = 0; c < 9 && spots.length < 4; c++) if (T.isBuildable(c, r)) spots.push([c, r]);
    const until = (cond, max = 30 * 120) => { for (let i = 0; i < max && !cond(); i++) T.update(1 / 30); };
    const lo = G.loadout.slice();
    const [A, B, C, D] = spots, tA = lo[0], tB = lo[1] || lo[0], tC = lo[2] || lo[0];
    until(() => G.time >= 1.0); T.buildTower(tA, A[0], A[1]);
    until(() => G.time >= 2.0); T.buildTower(tB, B[0], B[1]);
    until(() => G.time >= 3.0); playerWave(false);                                   // wave 1
    until(() => G.time - G.waveT0 >= 4.0); T.upgradeTower(G.grid[A[1] * 9 + A[0]]);
    until(() => G.nextTimer !== null && G.nextTimer < ECON.nextDelay - 2); playerWave(true);     // wave 2, early
    until(() => G.time - G.waveT0 >= 2.0); T.buildTower(tC, C[0], C[1]);
    until(() => G.time - G.waveT0 >= 3.0); T.sellTower(G.grid[B[1] * 9 + B[0]]);
    until(() => G.nextTimer !== null && G.nextTimer < ECON.nextDelay - 1); playerWave(true);     // wave 3, early
    until(() => G.time - G.waveT0 >= 1.5); T.buildTower(tA, D[0], D[1]);              // (after wave 3 began: not replayed until 3)
    endGame(false);
    return { lo, rec: G.rec, saved: !!Save.d.replays[LV], reached: Save.d.replays[LV] && Save.d.replays[LV].reached };
  }, LV);
  // restart: the prompt, game frozen while it's up
  await p.evaluate(LV => { __TD.startLevel(LV); }, LV);
  await p.waitForTimeout(900);
  out.ask = await p.evaluate(() => ({ asking: !!__TD.G.autoAsk, sel: __TD.G.autoAsk && __TD.G.autoAsk.sel, frozenTime: __TD.G.time }));
  await p.screenshot({ path: `${SP}/auto-ask-en.png` });
  for (const l of ['zh', 'es']) { await p.evaluate(l => setLang(l), l); await p.waitForTimeout(300); await p.screenshot({ path: `${SP}/auto-ask-${l}.png` }); }
  await p.evaluate(() => setLang('en'));
  // pick wave 3 by tapping its cell and the big button (through the real hit regions)
  out.pick = await p.evaluate(() => {
    const A = __TD.G.autoAsk; const big = hits.filter(h => h.h === 54); const cells = hits.filter(h => h.h === hits[hits.length - 1].h && false);
    A.sel = 2; const before = A.sel;
    big[big.length - 1].cb();                                                      // AUTO BUILD UNTIL WAVE 2 ... then check
    return { before, replay: !!__TD.G.replay, until: __TD.G.replay && __TD.G.replay.until };
  });
  // run the replay (until wave 2) and compare with the original
  out.replay2 = await p.evaluate((orig) => {
    const T = __TD, G = T.G; G.lives = 1e6;
    for (let i = 0; i < 30 * 120 && G.replay; i++) T.update(1 / 30);
    const want = orig.rec.filter(a => !(a.w >= 2 || (a.k === 'w' && a.w >= 1)));
    const got = G.rec.slice(0, want.length);
    const diffs = want.map((a, i) => { const g = got[i] || {}; return g.k === a.k && g.w === a.w && g.c === a.c && g.r === a.r && Math.abs(g.t - a.t) <= 0.04 ? null : { want: a, got: g }; }).filter(Boolean);
    return { waveNow: G.waveNum, replayOver: !G.replay, toast: G.toast && G.toast.text, wanted: want.length, recorded: G.rec.length, diffs };
  }, out.orig);
  // again, until wave 3: every action before wave 3 began (incl. the wave 2 early call) is repeated, the wave 3 call is not
  await p.evaluate(LV => { __TD.startLevel(LV); }, LV);
  out.replay3 = await p.evaluate((orig) => {
    const T = __TD, G = T.G; G.lives = 1e6; beginReplay(3);
    let pillShot = false;
    for (let i = 0; i < 30 * 120 && G.replay; i++) { T.update(1 / 30); if (!pillShot && G.waveNum === 1) { pillShot = true; window.__pill = true; } }
    const want = orig.rec.filter(a => !(a.w >= 3 || (a.k === 'w' && a.w >= 2)));
    const got = G.rec.slice(0, want.length);
    const diffs = want.map((a, i) => { const g = got[i] || {}; return g.k === a.k && g.w === a.w && g.c === a.c && g.r === a.r && Math.abs(g.t - a.t) <= 0.04 ? null : { want: a, got: g }; }).filter(Boolean);
    const towers = G.towers.map(t => [t.type, t.c, t.r, t.lv]);
    return { waveNow: G.waveNum, awaitingOrTimer: G.nextTimer !== null || G.awaiting, wanted: want.length, diffs, towers };
  }, out.orig);
  // the pill (and waiting for gold): replay with too little gold
  await p.evaluate(LV => { const T = __TD, G = T.G; T.startLevel(LV); beginReplay(3); G.gold = 10; for (let i = 0; i < 30 * 1.5; i++) T.update(1 / 30); }, LV);
  await p.waitForTimeout(300);
  out.wait = await p.evaluate(() => ({ wait: __TD.G.replay && __TD.G.replay.wait, towers: __TD.G.towers.length }));
  await p.screenshot({ path: `${SP}/auto-pill-wait.png` });
  out.afterGold = await p.evaluate(() => { const T = __TD, G = T.G; G.gold = 600; for (let i = 0; i < 30 * 1.2; i++) T.update(1 / 30); return { wait: G.replay && G.replay.wait, towers: G.towers.length }; });
  await p.waitForTimeout(250); await p.screenshot({ path: `${SP}/auto-pill.png` });
  // stop button on the pill
  out.stop = await p.evaluate(() => { const h = hits.filter(h => h.h === 34); if (h.length) h[h.length - 1].cb(); return { replay: !!__TD.G.replay, toast: __TD.G.toast && __TD.G.toast.text }; });
  // START FRESH, space key blocked while asking, then a win clears the saved run
  await p.evaluate(LV => { __TD.startLevel(LV); }, LV); await p.waitForTimeout(300);
  out.fresh = await p.evaluate(LV => {
    const T = __TD, G = T.G;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    const waveAfterSpace = G.waveNum;
    const small = hits.filter(h => h.h === 42); small[small.length - 1].cb();
    const r = { asking: !!G.autoAsk, replay: !!G.replay, waveAfterSpace };
    endGame(true); r.clearedOnWin = !Save.d.replays[LV];
    T.startLevel(LV); r.askAfterWin = !!G.autoAsk;
    return r;
  }, LV);
  console.log(JSON.stringify({ ...out, orig: { lo: out.orig.lo, n: out.orig.rec.length, saved: out.orig.saved, reached: out.orig.reached, rec: out.orig.rec } }, null, 1));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
