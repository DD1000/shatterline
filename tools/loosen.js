// loosen: node tools/loosen.js <levels csv> -> for each level, lowers LEVEL_CAL in 8% steps until >= MINW of the
// 12 expert strategies win and the best keeps >= 8 lives. Prints the new values.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const levels = process.argv[2].split(',').map(Number), MINW = +(process.env.MINW || 4), BEST = +(process.env.BEST || 8);
const src = fs.readFileSync('tools/expert.js', 'utf8');
const CORES = eval(src.match(/const CORES = (\[[\s\S]*?\]);\n/)[1]);
const STRATS = CORES.flatMap(core => [{ core, seed: 1, top: 1 }, { core, seed: 2, top: 2, tide: false }]);
(async () => {
  const b = await chromium.launch(); const pages = [];
  const cs = fs.readFileSync('tools/calibrate.js', 'utf8'), BOT = cs.slice(cs.indexOf('String.raw`') + 11, cs.indexOf('};`;') + 2);
  for (let i = 0; i < 2; i++) { const p = await b.newPage(); await p.goto('file://' + path.resolve('dist/index.html')); await p.waitForTimeout(300); await p.evaluate(BOT); await p.evaluate(S => { window.__STRATS = S; }, STRATS); pages.push(p); }
  const out = {}; let next = 0;
  await Promise.all(pages.map(async p => { while (next < levels.length) { const n = levels[next++];
    let c = await p.evaluate(n => __TD.LEVEL_CAL[n - 1], n), res;
    for (let k = 0; k < 6; k++) {
      res = await p.evaluate(([n, c]) => __STRATS.map(s => { const r = __bot(n, c, s); return r.win ? r.lives : -r.wave; }), [n, c]);
      if (res.filter(x => x > 0).length >= MINW && Math.max(...res) >= BEST) break;
      c = +(c * 0.92).toFixed(3);
    }
    out[n] = +c.toFixed(2); console.log(`L${n} -> ${out[n]} [${res}]`);
  } }));
  console.log(JSON.stringify(out)); await b.close();
})();
