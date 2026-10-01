// noshield_edge: node tools/noshield_edge.js <levels csv> -> lowest HP multiplier at which EVERY no-EMP/no-PRISM strategy loses
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const levels = process.argv[2].split(',').map(Number);
const CORES = [['nova', 'bolt', 'arc', 'frost'], ['nova', 'arc', 'rail', 'bolt'], ['bolt', 'nova', 'rail', 'beacon'], ['arc', 'nova', 'rail', 'frost'], ['nova', 'arc', 'bolt', 'beacon'], ['bolt', 'arc', 'nova', 'rail']];
(async () => {
  const b = await chromium.launch(); const pages = [];
  const cs = fs.readFileSync('tools/calibrate.js', 'utf8'), BOT = cs.slice(cs.indexOf('String.raw`') + 11, cs.indexOf('};`;') + 2);
  for (let i = 0; i < 2; i++) { const p = await b.newPage(); await p.goto('file://' + path.resolve(process.env.DIST || 'dist/index.html')); await p.waitForTimeout(300); await p.evaluate(BOT); pages.push(p); }
  const out = {}; let next = 0;
  await Promise.all(pages.map(async p => { while (next < levels.length) { const n = levels[next++];
    const anyWin = c => p.evaluate(([n, c, CORES]) => {
      const L = __TD.LEVELS[n - 1], extra = [L.noBounty && 'mint', L.air && 'flak'].filter(Boolean);
      for (const core of CORES) for (const [seed, top] of [[1, 1], [2, 2]]) {
        const lo = core.filter(t => __TD.TOWERS[t].unlock <= n).slice(0, (n >= 20 ? 4 : 3) - extra.length).concat(extra);
        if (__bot(n, c, { seed, top, loadout: lo, skip: ['emp'] }).win) return true;
      }
      return false;
    }, [n, c, CORES]);
    let lo = 0.03, hi = 2;                // anyWin(lo) true, anyWin(hi) false
    for (let it = 0; it < 9; it++) { const mid = Math.sqrt(lo * hi); if (await anyWin(mid)) lo = mid; else hi = mid; }
    out[n] = +hi.toFixed(3); console.log(`L${n} no-shield-tool strategies all lose from ${hi.toFixed(3)}`);
  } }));
  fs.writeFileSync(`tools/noshield_edge${process.env.TAG ? '_' + process.env.TAG : ''}.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
