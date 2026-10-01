// Sound effects follow the music: pitched effects use the chord that's playing, and land on the grid.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.addInitScript(() => localStorage.setItem('shatterline.lang', 'en'));
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(500);
  await p.mouse.click(100, 100); await p.evaluate(() => Sound.init());
  await p.evaluate(() => { const T = __TD, G = T.G; T.Save.d.max = 40; T.Save.d.loadout = ['bolt', 'nova', 'arc', 'mint']; T.startLevel(36); G.gold = 5000; G.tutorial = false; Sound.setEnabled(true);
    const spots = []; for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) spots.push([c, r, [...T.MAP.tiles].filter(k => ((k % 9) - c) ** 2 + (Math.floor(k / 9) - r) ** 2 <= 5).length]);
    spots.sort((a, b) => b[2] - a[2]); spots.slice(0, 9).forEach(([c, r], i) => T.buildTower(['bolt', 'nova', 'arc', 'mint', 'bolt', 'bolt'][i % 6], c, r));
    T.startWave(false); G.speed = 1; });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__sfxLog = []; window.__stepLog = []; });
  await p.waitForTimeout(9000);
  const r = await p.evaluate(() => {
    const L = window.__sfxLog, S = window.__stepLog.sort((a, b) => a.t - b.t);
    const pc = f => ((Math.round(12 * Math.log2(f / 440)) % 12) + 12) % 12;
    let inChord = 0, total = 0, onGrid = 0, timed = 0;
    const spb = S.length > 1 ? S[1].t - S[0].t : 0.14;
    for (const e of L) {
      if (e.t < S[0].t || e.t > S[S.length - 1].t) continue;
      let k = 0; while (k + 1 < S.length && S[k + 1].t <= e.t + 1e-4) k++;
      const chord = S[k].ch.map(n => ((n % 12) + 12) % 12);
      total++; if (chord.includes(pc(e.f0))) inChord++;
      const off = (e.t - S[k].t) / spb; timed++; if (Math.min(Math.abs(off % 0.5), Math.abs(0.5 - off % 0.5)) < 0.08) onGrid++;
    }
    return { sfxNotes: total, inChordPct: Math.round(100 * inChord / total), onGridPct: Math.round(100 * onGrid / timed) };
  });
  console.log(JSON.stringify(r));
  console.log(errs.length ? errs : 'no errors'); await b.close();
})();
