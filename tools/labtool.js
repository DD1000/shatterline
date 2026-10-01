// Lab tuning: node tools/labtool.js stats 101,102   -> 12 expert strategies at the current cal: wins, lives, gold earned / spent / left
//             node tools/labtool.js edge 105,106    -> highest cal where >= NEED (4) strategies win keeping >= KEEP (5) lives
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const path = require('path'), fs = require('fs');
const MODE = process.argv[2], ids = process.argv[3].split(',').map(Number);
const KEEP = +(process.env.KEEP || 5), NEED = +(process.env.NEED || 4);
const CORES = [null, ['nova', 'arc', 'prism', 'rail'], ['bolt', 'nova', 'prism', 'beacon'], ['arc', 'nova', 'rail', 'frost'], ['nova', 'prism', 'arc', 'beacon'], ['pyro', 'bolt', 'arc', 'nova']];
const STRATS = CORES.flatMap(core => [{ core, seed: 1, top: 1 }, { core, seed: 2, top: 2, tide: false }]);
const CALS = process.env.CALS ? JSON.parse(process.env.CALS) : {};
(async () => {
  const src = fs.readFileSync(path.join(__dirname, 'calibrate.js'), 'utf8'), BOT = src.slice(src.indexOf('String.raw`') + 11, src.indexOf('};`;') + 2);
  const b = await chromium.launch(), N = +(process.env.PAGES || 4), pages = [];
  for (let i = 0; i < N; i++) {
    const p = await b.newPage(); p.on('pageerror', e => console.log('PAGEERROR', e.message));
    await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await p.goto('file://' + path.resolve(process.env.DIST || 'index.html')); await p.waitForTimeout(300);
    await p.evaluate(BOT); await p.evaluate(S => { window.__STRATS = S; }, STRATS); if (process.env.PRE) await p.evaluate(process.env.PRE); pages.push(p);
  }
  const out = {}; let next = 0;
  const jobs = MODE === 'stats' ? ids.flatMap(n => STRATS.map((s, i) => ({ n, s, i }))) : ids.map(n => ({ n }));
  const t0 = Date.now();
  await Promise.all(pages.map(async p => { while (next < jobs.length) { const j = jobs[next++];
    if (MODE === 'stats') {
      const r = await p.evaluate(([n, s, c]) => __bot(n, c, s), [j.n, j.s, CALS[j.n] != null ? CALS[j.n] : null]);
      (out[j.n] = out[j.n] || [])[j.i] = r;
    } else {
      const n = j.n;
      const passes = c => p.evaluate(([n, c, K, NEED]) => { let ok = 0, i = 0; for (const s of __STRATS) { const r = __bot(n, c, s); if (r.win && r.lives >= K) ok++; i++; if (ok >= NEED) return true; if (ok + (__STRATS.length - i) < NEED) return false; } return false; }, [n, c, KEEP, NEED]);
      let lo = +(process.env.LO || 0.12), hi = +(process.env.HI || 0.9);
      if (!(await passes(lo))) { out[n] = { edge: null }; console.log(`L${n} fails even at ${lo}`); continue; }
      for (let it = 0; it < +(process.env.ITS || 8); it++) { const mid = Math.sqrt(lo * hi); if (await passes(mid)) lo = mid; else hi = mid; }
      out[n] = { edge: +lo.toFixed(3), cal: +(0.95 * lo).toFixed(3) };
      console.log(`L${n} edge=${lo.toFixed(3)} -> cal ${(0.95 * lo).toFixed(3)}  (${Math.round((Date.now() - t0) / 1000)}s)`);
    }
  } }));
  if (MODE === 'stats') for (const n of ids) {
    const rs = out[n], w = rs.filter(r => r.win), avg = (a, k) => a.length ? Math.round(a.reduce((x, r) => x + r[k], 0) / a.length) : '-';
    console.log(`L${n} wins ${w.length}/12 lives [${rs.map(r => r.win ? r.lives : 'x' + r.wave).join(',')}] | winners: earned ${avg(w, 'earned')} spent ${avg(w, 'spent')} left ${avg(w, 'gold')} | all: earned ${avg(rs, 'earned')} time ${avg(rs, 'time')}s`);
  }
  fs.writeFileSync(path.join(__dirname, `lab_${MODE}${process.env.TAG ? '_' + process.env.TAG : ''}.json`), JSON.stringify(out, null, 1));
  console.log('done in', Math.round((Date.now() - t0) / 1000), 's');
  await b.close();
})();
