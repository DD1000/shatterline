// Adaptive music: intensity rises with the waves, boss theme takes over, kill notes land on the grid in the chord.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.addInitScript(() => localStorage.setItem('shatterline.lang', 'en'));
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_')) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve('dist/index.html')); await p.waitForTimeout(500);
  await p.mouse.click(100, 100); await p.evaluate(() => Sound.init());
  // level 20 (boss level), strong towers so it plays through; sample music state per wave
  await p.evaluate(() => { const T = __TD, G = T.G; T.Save.d.max = 30; T.Save.d.loadout = ['nova', 'bolt', 'arc', 'prism']; T.startLevel(20); G.gold = 9000; G.tutorial = false; Sound.setEnabled(true);
    const spots = []; for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) spots.push([c, r, [...T.MAP.tiles].filter(k => ((k % 9) - c) ** 2 + (Math.floor(k / 9) - r) ** 2 <= 5).length]);
    spots.sort((a, b) => b[2] - a[2]); spots.slice(0, 10).forEach(([c, r], i) => { const tw = T.buildTower(['nova', 'bolt', 'arc', 'prism'][i % 4], c, r); if (tw) { T.upgradeTower(tw); T.upgradeTower(tw); } });
    T.startWave(false); G.speed = 2; });
  const log = [];
  for (let i = 0; i < 70; i++) {
    await p.waitForTimeout(500);
    const s = await p.evaluate(() => { const m = Sound._music(), G = __TD.G; if (G.awaiting && !G.over && G.waveNum < G.waves.length) __TD.startWave(false);
      return { w: G.waveNum, int: +m.int.toFixed(2), tgt: +m.target.toFixed(2), bpm: Math.round(m.bpm), boss: m.boss, alive: G.enemies.filter(e => e.alive).length, over: G.over }; });
    log.push(s); if (s.over) break;
  }
  const byWave = {}; for (const s of log) (byWave[s.w] = byWave[s.w] || []).push(s);
  for (const w in byWave) { const a = byWave[w]; console.log(`wave ${w}: intensity max ${Math.max(...a.map(s => s.int))} avg ${(a.reduce((x, s) => x + s.int, 0) / a.length).toFixed(2)} bpm ${Math.max(...a.map(s => s.bpm))} boss ${a.some(s => s.boss)} alive max ${Math.max(...a.map(s => s.alive))}`); }
  // jump ahead to the boss wave and let the music settle
  await p.evaluate(() => { const T = __TD, G = T.G; G.paused = true; let t = 0;
    while (!G.over && !G.enemies.some(e => e.alive && e.rc.boss) && t < 900) { T.update(1 / 60); t += 1 / 60; if (G.awaiting && G.waveNum < G.waves.length) T.startWave(false); }
    G.paused = false; G.speed = 1; });
  await p.waitForTimeout(3500);
  console.log('boss fight:', JSON.stringify(await p.evaluate(() => { const m = Sound._music(), G = __TD.G; return { wave: G.waveNum, bossAlive: G.enemies.some(e => e.alive && e.rc.boss), boss: m.boss, bpm: Math.round(m.bpm) }; })));
  await p.evaluate(() => { const G = __TD.G; for (const e of G.enemies) if (e.alive && e.rc.boss) kill(e); });
  await p.waitForTimeout(3000);
  console.log('after boss:', JSON.stringify(await p.evaluate(() => { const m = Sound._music(); return { boss: m.boss, bpm: Math.round(m.bpm) }; })));
  // kill notes: on the 16th grid and in the chord
  const notes = await p.evaluate(() => { const m = Sound._music(); const spb = 60 / m.bpm / 4; return (m.notes || []).map(n => ({ inChord: n.chord.map(c => ((c % 12) + 12) % 12).includes(((n.semi % 12) + 12) % 12), step: n.step })); });
  console.log('kill notes logged:', notes.length, ' all chord tones:', notes.every(n => n.inChord));
  console.log(errs.length ? errs : 'no errors'); await b.close();
})();
