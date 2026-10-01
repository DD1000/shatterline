// noreq_edge: node tools/noreq_edge.js <tower> <levels csv> -> lowest HP multiplier at which EVERY expert strategy
// without that tower loses (mint on No Bounty, flak on Air Raid, emp (+prism) on heavy shields)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const T = process.argv[2], levels = process.argv[3].split(',').map(Number);
const src = fs.readFileSync('tools/expert.js', 'utf8');
const CORES = eval(src.match(/const CORES = (\[[\s\S]*?\]);\n/)[1]);
const STRATS = CORES.flatMap(core => [{ core, seed: 1, top: 1 }, { core, seed: 2, top: 2, tide: false }]).map(s => ({ ...s, skip: [T], core: (s.core || []).filter(x => x !== T && !(T === 'emp' && x === 'prism')) }));
(async () => {
  const b = await chromium.launch(); const pages = [];
  const cs = fs.readFileSync('tools/calibrate.js', 'utf8'), BOT = cs.slice(cs.indexOf('String.raw`') + 11, cs.indexOf('};`;') + 2);
  for (let i = 0; i < 2; i++) { const p = await b.newPage(); await p.goto('file://' + path.resolve(process.env.DIST || 'dist/index.html')); await p.waitForTimeout(300); await p.evaluate(BOT); await p.evaluate(S => { window.__NS = S; }, STRATS); pages.push(p); }
  const out = {}; let next = 0;
  await Promise.all(pages.map(async p => { while (next < levels.length) { const n = levels[next++];
    const anyWin = c => p.evaluate(([n, c]) => __NS.some(s => __bot(n, c, s).win), [n, c]);
    let lo = 0.02, hi = 2;
    for (let it = 0; it < 9; it++) { const mid = Math.sqrt(lo * hi); if (await anyWin(mid)) lo = mid; else hi = mid; }
    out[n] = +hi.toFixed(3); console.log(`L${n} without ${T}: all strategies lose from ${hi.toFixed(3)}`);
  } }));
  fs.writeFileSync(`tools/noreq_${T}${process.env.TAG ? '_' + process.env.TAG : ''}.json`, JSON.stringify(out, null, 1));
  await b.close();
})();
