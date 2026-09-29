// Tower audit: flawless HP threshold (2 of 3 runs) for loadouts that differ in one slot.
// node tools/audit.js 30,42,52 'nova,bolt,arc,X' frost,prism,rail,beacon,mint,none
const { chromium } = require('playwright');
const path = require('path');
const levels = process.argv[2].split(',').map(Number), tmpl = process.argv[3], xs = process.argv[4].split(',');
const src = require('fs').readFileSync(path.resolve(__dirname, 'calibrate.js'), 'utf8');
const BOT = src.slice(src.indexOf('String.raw`') + 11, src.indexOf('};`;') + 2);
(async () => {
  const b = await chromium.launch();
  const jobs = []; for (const n of levels) for (const x of xs) jobs.push([n, x]);
  const res = {}; let next = 0;
  await Promise.all([0, 1].map(async () => {
    const p = await b.newPage(); await p.goto('file://' + path.resolve(__dirname, '../dist/index.html')); await p.waitForTimeout(300); await p.evaluate(BOT);
    while (next < jobs.length) {
      const [n, x] = jobs[next++];
      const lo = tmpl.split(',').map(t => t === 'X' ? x : t).filter(t => t !== 'none');
      const pass = async c => { let ok = 0; for (const seed of [1, 2, 3]) { const r = await p.evaluate(([n, c, o]) => __bot(n, c, o), [n, c, { seed, top: seed === 1 ? 1 : 2, loadout: lo, skipNeeds: true }]); if (r.win && r.lives === 10) ok++; if (ok >= 2 || ok + (3 - seed) < 2) break; } return ok >= 2; };
      let a = 0.05, z = 4; for (let i = 0; i < 9; i++) { const m = Math.sqrt(a * z); if (await pass(m)) a = m; else z = m; }
      (res[n] = res[n] || {})[x] = a;
    }
  }));
  console.log('level  ' + xs.map(x => x.padStart(7)).join(''));
  for (const n of levels) { const base = Math.max(...xs.map(x => res[n][x])); console.log(('L' + n).padEnd(7) + xs.map(x => (res[n][x] / base).toFixed(2).padStart(7)).join('') + '   best=' + base.toFixed(3)); }
  const avg = xs.map(x => levels.reduce((a, n) => a + res[n][x] / Math.max(...xs.map(y => res[n][y])), 0) / levels.length);
  console.log('avg    ' + avg.map(v => v.toFixed(2).padStart(7)).join(''));
  await b.close();
})();
