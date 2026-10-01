// v42: play both new labs start to finish with lots of towers (lives set high) to catch crashes
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(500);
  const res = await p.evaluate(() => {
    localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true;
    const T = __TD, G = T.G, out = {};
    for (const n of [111, 112]) {
      T.startLevel(n); G.gold = 1e6; G.lives = 1e6; G.maxLives = 1e6;
      const types = ['bolt', 'nova', 'arc', 'emp', 'flak', 'prism', 'frost', 'tide'];
      let k = 0; for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r) && k < 26) { const tw = T.buildTower(types[k % types.length], c, r); if (tw) { T.upgradeTower(tw); T.upgradeTower(tw); T.upgradeTower(tw); } k++; }
      const seen = new Set(); let steps = 0, maxEn = 0;
      while (!G.over && steps < 30 * 60 * 25) {
        if (G.awaiting || (G.nextTimer !== null && G.waveNum < G.waves.length)) T.startWave(G.waveNum > 0);
        T.update(1 / 30); steps++;
        for (const e of G.enemies) if (e.alive) seen.add(e.type);
        maxEn = Math.max(maxEn, G.enemies.filter(e => e.alive).length);
      }
      out[n] = { leakTypes: G.leakTypes, over: G.over, result: G.result, wave: G.waveNum, of: G.waves.length, minutes: +(steps / 30 / 60).toFixed(1), leaks: G.leaks, maxEnemies: maxEn, bossesSeen: [...seen].filter(t => t.startsWith('boss_')).length, types: [...seen].sort().join(' ') };
    }
    return out;
  });
  console.log(JSON.stringify(res, null, 1)); console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
