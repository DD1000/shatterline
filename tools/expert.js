// expert: stands in for a player who plans well and retries. 12 varied strategies (6 loadouts x 2 placements).
//   node tools/expert.js edge <levels csv> [start json]   -> highest HP multiplier where >= NEED strategies win keeping >= KEEP lives
//   node tools/expert.js eval <levels csv>                -> at the current LEVEL_CAL: expert wins, smart/casual results
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const MODE = process.argv[2], levels = process.argv[3].split(',').map(Number);
const START = process.argv[4] ? JSON.parse(fs.readFileSync(process.argv[4], 'utf8')) : null;
const KEEP = +(process.env.KEEP || 7), NEED = +(process.env.NEED || 2);
const CORES = [null, ['nova', 'arc', 'prism', 'rail'], ['bolt', 'nova', 'prism', 'beacon'], ['arc', 'nova', 'rail', 'frost'], ['nova', 'prism', 'arc', 'beacon'], ['pyro', 'bolt', 'arc', 'nova']];
const STRATS = CORES.flatMap(core => [{ core, seed: 1, top: 1 }, { core, seed: 2, top: 2, tide: false }]);     // (v23: half the plans bring TIDE on fire levels)
(async () => {
  const b = await chromium.launch(); const N = +(process.env.PAGES || 2), pages = [];
  const src = fs.readFileSync('tools/calibrate.js', 'utf8'), BOT = src.slice(src.indexOf('String.raw`') + 11, src.indexOf('};`;') + 2);
  for (let i = 0; i < N; i++) { const p = await b.newPage(); await p.goto('file://' + path.resolve(process.env.DIST || 'dist/index.html')); await p.waitForTimeout(300); await p.evaluate(BOT); await p.evaluate(S => { window.__STRATS = S; }, STRATS); pages.push(p); }
  const out = {}; let next = 0;
  await Promise.all(pages.map(async p => { while (next < levels.length) { const n = levels[next++];
    if (MODE === 'edge') {
      const passes = c => p.evaluate(([n, c, K, NEED]) => { let ok = 0, i = 0; for (const s of __STRATS) { const r = __bot(n, c, s); if (r.win && r.lives >= K) ok++; i++; if (ok >= NEED) return true; if (ok + (__STRATS.length - i) < NEED) return false; } return false; }, [n, c, KEEP, NEED]);
      let lo = START ? START[n].flawless * 0.8 : 0.1, hi = lo * 4;
      if (!(await passes(lo))) { lo = lo / 2; }
      for (let it = 0; it < 9; it++) { const mid = Math.sqrt(lo * hi); if (await passes(mid)) lo = mid; else hi = mid; }
      out[n] = { expert: +lo.toFixed(3), ratio: START ? +(lo / START[n].flawless).toFixed(2) : null };
      console.log(`L${n} expert=${lo.toFixed(3)}${START ? ` (x${(lo / START[n].flawless).toFixed(2)} of flawless)` : ''}`);
    } else {
      const r = await p.evaluate(n => {
        const f = r => r.win ? r.lives : -r.wave;
        const ex = __STRATS.map(s => f(__bot(n, null, s)));
        const smart = f(__bot(n, null, { seed: 1 }));
        const casual = [1, 2, 3, 4].map(seed => f(__bot(n, null, { seed, top: 10 })));
        const L = __TD.LEVELS[n - 1], wo = {};
        for (const [k, t] of [['noBounty', 'mint'], ['air', 'flak'], ['shielded', 'emp']]) if (L[k] && (t !== 'emp' || n >= 12)) {
          // without the required tower: the best any expert strategy can do
          wo[t] = Math.max(...__STRATS.map(s => f(__bot(n, null, { ...s, skip: [t], core: (s.core || []).filter(x => x !== t && !(t === 'emp' && x === 'prism')) }))));
        }
        return { ex, smart, casual, wo };
      }, n);
      out[n] = r;
      const exWin = r.ex.filter(x => x > 0).length, best = Math.max(...r.ex);
      console.log(`L${n} expert ${exWin}/12 wins best=${best} lives [${r.ex}] | smart ${r.smart} | casual [${r.casual}]${Object.entries(r.wo).map(([t, v]) => ` | NO ${t.toUpperCase()} best ${v}`).join('')}`);
    }
  } }));
  fs.writeFileSync(`tools/expert_${MODE}${process.env.TAG ? '_' + process.env.TAG : ''}.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
