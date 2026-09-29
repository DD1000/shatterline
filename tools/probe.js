// probe: node tools/probe.js '[[level, cal], ...]'  -> smart / casual x4 / without each required tower
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + path.resolve('dist/index.html'));
  await p.waitForTimeout(400);
  const src = require('fs').readFileSync('tools/calibrate.js', 'utf8');
  await p.evaluate(src.slice(src.indexOf('String.raw`') + 11, src.indexOf('};`;') + 2));
  for (const [n, cal] of JSON.parse(process.argv[2])) {
    const r = await p.evaluate(([n, c]) => {
      const f = r => r.win ? 'W' + r.lives : 'L@' + r.wave;
      const smart = f(__bot(n, c, { seed: 1 }));
      const casual = [1, 2, 3, 4].map(s => f(__bot(n, c, { seed: s, top: 10 })));
      const L = __TD.LEVELS[n - 1], wo = [];
      for (const [k, t] of [['noBounty', 'mint'], ['air', 'flak'], ['shielded', 'emp']]) if (L[k] && (t !== 'emp' || n >= 12)) wo.push(`NO ${t.toUpperCase()} ${f(__bot(n, c, { seed: 1, skip: [t] }))}`);
      return `L${n} cal=${c}: smart ${smart} | casual ${casual.join(',')} | ${wo.join(' | ')}`;
    }, [n, cal]);
    console.log(r);
  }
  await b.close();
})();
