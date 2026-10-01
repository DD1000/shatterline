// Spore core damage = itself + the Mites inside. Usage: node sporetest.js <shot dir>
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    setLang('en'); const T = __TD, G = T.G; T.startLevel(30); G.paused = true; G.tutorial = false; Sound.setEnabled(false);
    const out = {};
    for (const t of ['splitter', 'mite', 'grunt', 'brute', 'titan']) { const L0 = G.lives; const e = spawnEnemy(t, 1, 0, 50); leak(e); out[t] = L0 - G.lives; G.lives = 10; G.over = false; }
    out.coreDamage = { splitter: coreDamage(ENEMIES.splitter), mite: coreDamage(ENEMIES.mite), boss: coreDamage(ENEMIES.boss) };
    out.leakTypes = G.leakTypes;
    return out;
  });
  console.log(JSON.stringify(r));
  await p.evaluate(() => { const T = __TD; T.Save.d.max = 4; T.toMap(); T.openCard(4); }); await p.waitForTimeout(800);
  await p.screenshot({ path: SP + '/spore-card4.png' });
  await p.evaluate(() => { SAGA.info = { kind: 'enemy', key: 'splitter' }; setLang('es'); }); await p.waitForTimeout(300);
  await p.screenshot({ path: SP + '/spore-card4-es.png' });
  await p.evaluate(() => setLang('en'));
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
