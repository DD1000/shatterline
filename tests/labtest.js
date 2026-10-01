// Playtest Lab: title button, lab screen, lab card, wave preview, clean-wave bonus, lab results, Warden phases.
// Usage: node labtest.js <shot dir>
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  await p.evaluate(() => { setLang('en'); const S = __TD.Save; S.reset(); S.d.max = 3; S.d.stars[1] = 3; S.d.stars[2] = 2; S.store(); __TD.G.state = 'title'; });
  await p.waitForTimeout(400); await p.screenshot({ path: SP + '/lab1-title.png' });
  await p.evaluate(() => { const h = hits.find(h => h.w === 196 && h.h === 40); h.cb(); });        // PLAYTEST LAB
  await p.waitForTimeout(500); await p.screenshot({ path: SP + '/lab2-screen.png' });
  const st = await p.evaluate(() => ({ state: __TD.G.state, lab: !!__TD.Save.lab }));
  await p.evaluate(() => __TD.openCard(102)); await p.waitForTimeout(700); await p.screenshot({ path: SP + '/lab3-card102.png' });
  const card = await p.evaluate(() => ({ open: __TD.Save.open(), lo: __TD.Save.lo(), campaignLo: __TD.Save.d.loadout, max: __TD.Save.d.max }));
  await p.evaluate(() => __TD.openCard(104)); await p.waitForTimeout(700); await p.screenshot({ path: SP + '/lab4-card104.png' });
  // play 102: preview between waves, clean bonus
  const play = await p.evaluate(() => {
    const T = __TD, G = T.G; T.Save.d.labLoadout = ['nova', 'bolt', 'arc', 'pyro']; T.startLevel(102); G.tutorial = false; Sound.setEnabled(false);
    const out = { label: levelLabel(102), gold0: G.gold, econ: G.econ.key, loadout: G.loadout.slice() };
    const spots = []; for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) spots.push([c, r, [...T.MAP.tiles].filter(k => ((k % 9) - c) ** 2 + (Math.floor(k / 9) - r) ** 2 <= 4).length]);
    spots.sort((a, b) => b[2] - a[2]);
    ['nova', 'bolt', 'arc', 'nova', 'bolt'].forEach((t, i) => T.buildTower(t, spots[i][0], spots[i][1]));
    G.gold += 3000;
    T.startWave(false); let t = 0; while (t < 120 && !(G.nextTimer !== null && G.waveNum === 1 && G.waveStats[1] && G.waveStats[1].cleared)) { T.update(1 / 60); t += 1 / 60; }
    out.toast = G.toast && G.toast.text; out.earned = G.earned; out.spent = G.spent; out.waveStat = G.waveStats[1];
    G.paused = false; return out;
  });
  await p.evaluate(() => { __TD.G.paused = true; }); await p.waitForTimeout(100);
  await p.evaluate(() => { __TD.G.paused = false; __TD.G.speed = 1; }); await p.waitForTimeout(300);
  await p.evaluate(() => { __TD.G.paused = true; });
  await p.waitForTimeout(200); await p.screenshot({ path: SP + '/lab5-preview.png' });
  // a leak makes the next clear pay nothing (lean)
  const leak = await p.evaluate(() => {
    const T = __TD, G = T.G; G.paused = true; T.startWave(true); let t = 0;
    while (t < 60 && G.waveNum === 2 && !G.enemies.some(e => e.alive)) { T.update(1 / 60); t += 1 / 60; }
    const e = G.enemies.find(e => e.alive); leak(e); e.alive = false; waveStat(e.wave).alive--;
    const g0 = G.gold; while (t < 200 && !(G.waveStats[2] && G.waveStats[2].cleared)) { T.update(1 / 60); t += 1 / 60; }
    return { toast: G.toast && G.toast.text, leaked: G.waveStats[2].leaked };
  });
  // Warden phases on 104
  const boss = await p.evaluate(() => {
    const T = __TD, G = T.G; T.startLevel(104); G.paused = true; G.tutorial = false; Sound.setEnabled(false);
    const w = spawnEnemy('boss', 8, 0, 200); w.speed = 0; const hp = w.maxHp, sp0 = w.speed;
    w.hp = hp * 0.55; T.update(1 / 60); const a = { phase: w.phase, shield: Math.round(w.shield), brutes: G.enemies.filter(e => e.alive && e.type === 'brute').length, shout: G.shout && G.shout.text };
    w.hp = hp * 0.25; w.speed = 10; T.update(1 / 60); const c = { phase: w.phase, enraged: w.enraged, speedX: +(w.speed / 10).toFixed(2), shout: G.shout && G.shout.text };
    return { maxHp: Math.round(hp), a, c };
  });
  await p.evaluate(() => { __TD.G.paused = false; }); await p.waitForTimeout(500); await p.screenshot({ path: SP + '/lab6-rage.png' });
  // lab result screen + saved record
  const res = await p.evaluate(() => { const G = __TD.G; G.lives = 7; G.earned = 1500; G.spent = 1320; G.gold = 420; endGame(true); return __TD.Save.d.lab[104]; });
  await p.waitForTimeout(4200); await p.screenshot({ path: SP + '/lab7-result.png' });
  const back = await p.evaluate(() => { const h = hits.filter(h => h.w === 220 && h.h === 56).pop(); h.cb(); return { state: __TD.G.state, lab: __TD.Save.lab, max: __TD.Save.d.max }; });
  await p.waitForTimeout(500); await p.screenshot({ path: SP + '/lab8-after.png' });
  console.log(JSON.stringify({ st, card, play, leak, boss, res, back }, null, 1));
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
