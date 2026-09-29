// Prism hum: plays the chord root, vibrato wobbles on the music's 16th grid, fades when the beam stops.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.addInitScript(() => localStorage.setItem('shatterline.lang', 'en'));
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').resolve('dist/index.html')); await p.waitForTimeout(500);
  await p.mouse.click(100, 100); await p.evaluate(() => Sound.init());
  await p.evaluate(() => { const T = __TD, G = T.G; T.Save.d.max = 30; T.Save.d.loadout = ['prism', 'bolt', 'nova']; T.startLevel(25); G.gold = 3000; G.tutorial = false; Sound.setEnabled(true);
    const tiles = [...T.MAP.tiles]; const mid = tiles[Math.floor(tiles.length * 0.3)];
    for (const [dc, dr] of [[1,0],[-1,0],[0,1],[0,-1]]) if (T.isBuildable(mid % 9 + dc, Math.floor(mid / 9) + dr)) { T.buildTower('prism', mid % 9 + dc, Math.floor(mid / 9) + dr); break; }
    const len = T.MAP.paths[0].len; for (let i = 0; i < 14; i++) spawnEnemy('titan', 3, 0, len * 0.2 + i * 6);
    T.startWave(false); });
  await p.waitForTimeout(1800);
  const r = await p.evaluate(() => new Promise(res => {
    const H = Sound._hum(), v = H.v, m = Sound._music(), vals = []; const t0 = performance.now();
    const iv = setInterval(() => { vals.push(v.vib ? v.vib.offset.value : 0);
      if (performance.now() - t0 > 1500) { clearInterval(iv);
        let flips = 0; for (let i = 1; i < vals.length; i++) if (Math.sign(vals[i]) !== Math.sign(vals[i - 1]) && vals[i] !== 0) flips++;
        const sixteenthsPerSec = m.bpm / 15;
        res({ beaming: __TD.G.towers.some(t => t.beamT), gain: +v.out.gain.value.toFixed(3), hz: +v.o1.frequency.value.toFixed(1), subHz: +v.o2.frequency.value.toFixed(1), bpm: Math.round(m.bpm),
              vibratoPeak: +Math.max(...vals.map(Math.abs)).toFixed(1), vibratoCyclesPerSec: +(flips / 2 / 1.5).toFixed(1), sixteenthsPerSec: +sixteenthsPerSec.toFixed(1) }); } }, 8);
  }));
  // hum pitch should be a chord root (A, F, C or G two octaves down)
  const pcs = { 110: 'A', 87.3: 'F', 130.8: 'C', 98: 'G' };
  const name = Object.entries(pcs).find(([f]) => Math.abs(+f - r.hz) / +f < 0.03);
  console.log(JSON.stringify(r), '| root note:', name ? name[1] : 'OFF-KEY');
  await p.evaluate(() => { __TD.G.paused = true; }); await p.waitForTimeout(700);
  console.log('gain after pause:', await p.evaluate(() => +Sound._hum().v.out.gain.value.toFixed(5)));
  console.log(errs.length ? errs : 'no errors'); await b.close();
})();
