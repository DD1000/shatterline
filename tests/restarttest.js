// Restart from the pause menu (and Retry on the end screen) opens the level's tower select with the used towers picked.
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  const out = {};
  for (const [n, lo] of [[30, ['nova', 'rail', 'arc', 'frost']], [102, ['pyro', 'tide', 'bolt', 'arc']]]) {
    await p.evaluate(([n, lo]) => { setLang('en'); const T = __TD, G = T.G; T.Save.d.max = 80; T.Save.d.testAll = false; T.Save.d.known = TOWER_ORDER.slice();
      if (n > 100) T.Save.d.labLoadout = lo; else T.Save.d.loadout = lo;
      T.startLevel(n); G.tutorial = false; Sound.setEnabled(false);
      // change the saved loadout behind the level's back: restart must bring back what was USED in the level
      if (n > 100) T.Save.d.labLoadout = ['bolt']; else T.Save.d.loadout = ['bolt'];
      T.startWave(false); for (let i = 0; i < 120; i++) T.update(1 / 60);
      G.paused = true; G.pauseMenu = true; }, [n, lo]);
    await p.waitForTimeout(300);
    await p.evaluate(() => { const h = hits.filter(h => h.w === 210 && h.h === 50)[0]; h.cb(); });   // RESTART
    await p.waitForTimeout(150);
    const armed = await p.evaluate(() => __TD.G.confirm);
    await p.evaluate(() => { const h = hits.filter(h => h.w === 210 && h.h === 50)[0]; h.cb(); });   // TAP TO CONFIRM
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${SP}/restart-${n}.png` });
    out[n] = await p.evaluate(() => ({ state: __TD.G.state, card: SAGA.card && SAGA.card.n, lo: __TD.Save.lo() }));
    out[n].armed = armed;
  }
  // end screen retry on a heatwave level: FROST was banned, so it isn't among the used towers
  out.heat = await p.evaluate(() => { const T = __TD, G = T.G; T.Save.d.loadout = ['frost', 'nova', 'bolt', 'arc']; T.startLevel(24); G.tutorial = false;
    const used = G.loadout.slice(); endGame(false); G.state = 'end'; retryLevel(); return { used, lo: T.Save.lo(), state: G.state, card: SAGA.card && SAGA.card.n }; });
  console.log(JSON.stringify(out));
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
