// match: node tools/match.js <target eval json> <levels csv> -> nudges LEVEL_CAL until each level's wins
// (12 expert strategies + 4 casual bots) are within LOW below / HIGH above the target build's wins. Prints new values.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const TGT = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), levels = process.argv[3].split(',').map(Number);
const LOW = +(process.env.LOW || 2), HIGH = +(process.env.HIGH || 3);
const src = fs.readFileSync('tools/expert.js', 'utf8');
const CORES = eval(src.match(/const CORES = (\[[\s\S]*?\]);\n/)[1]);
const STRATS = CORES.flatMap(core => [{ core, seed: 1, top: 1 }, { core, seed: 2, top: 2, tide: false }]);
(async () => {
  const b = await chromium.launch(); const pages = [];
  const cs = fs.readFileSync('tools/calibrate.js', 'utf8'), BOT = cs.slice(cs.indexOf('String.raw`') + 11, cs.indexOf('};`;') + 2);
  for (let i = 0; i < +(process.env.PAGES || 2); i++) { const p = await b.newPage(); await p.goto('file://' + path.resolve('dist/index.html')); await p.waitForTimeout(300); await p.evaluate(BOT); await p.evaluate(S => { window.__STRATS = S; }, STRATS); pages.push(p); }
  const out = {}; let next = 0;
  await Promise.all(pages.map(async p => { while (next < levels.length) { const n = levels[next++];
    const t = TGT[n], T = t.ex.filter(x => x > 0).length + t.casual.filter(x => x > 0).length;
    let c = await p.evaluate(n => __TD.LEVEL_CAL[n - 1], n), W, ex, cas, dir = 0;
    for (let k = 0; k < 6; k++) {
      [ex, cas] = await p.evaluate(([n, c]) => { const f = r => r.win ? r.lives : -r.wave;
        return [__STRATS.map(s => f(__bot(n, c, s))), [1, 2, 3, 4].map(seed => f(__bot(n, c, { seed, top: 10 })))]; }, [n, c]);
      W = ex.filter(x => x > 0).length + cas.filter(x => x > 0).length;
      const exW = ex.filter(x => x > 0).length, best = Math.max(...ex);
      const tooHard = W < T - LOW || exW < 4 || best < 8, tooEasy = W > T + HIGH && exW > 4;
      if (tooHard && dir <= 0) { dir = -1; c = +(c * 0.92).toFixed(3); continue; }
      if (tooEasy && dir >= 0) { dir = 1; c = +(c * 1.07).toFixed(3); continue; }
      break;
    }
    out[n] = +c.toFixed(2); console.log(`L${n} target ${T} -> ${W} at ${out[n]} ex[${ex}] cas[${cas}]`);
  } }));
  console.log(JSON.stringify(out)); fs.writeFileSync(`tools/match${process.env.TAG ? '_' + process.env.TAG : ''}.json`, JSON.stringify(out)); await b.close();
})();
