// Frame time with an empty board vs a crowded wave, to see how cost grows with "stuff".
const { chromium } = require('playwright');
const path = require('path');
const files = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const file of files) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    await p.addInitScript(() => localStorage.setItem('shatterline.lang', 'en'));
    await p.goto('file://' + path.resolve(file)); await p.waitForTimeout(500);
    await p.evaluate(ADAPT => { if (window.tuneQuality && !ADAPT) window.tuneQuality = function () {};
      const T = __TD, G = T.G; T.Save.d.max = 80; T.Save.d.loadout = ['nova', 'arc', 'prism', 'emp']; T.startLevel(63); G.gold = 99999; G.tutorial = false; G.lives = G.maxLives = 999;
      const spots = []; for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) spots.push([c, r, [...T.MAP.tiles].filter(k => ((k % 9) - c) ** 2 + (Math.floor(k / 9) - r) ** 2 <= 5).length]);
      spots.sort((a, b) => b[2] - a[2]); spots.slice(0, 14).forEach(([c, r], i) => { const tw = T.buildTower(['nova', 'arc', 'prism', 'emp', 'bolt', 'frost', 'rail'][i % 7], c, r); if (tw) T.upgradeTower(tw); });
      window.__ft = []; let last = performance.now(); (function tick(t) { window.__ft.push(t - last); last = t; requestAnimationFrame(tick); })(last); }, !!process.env.ADAPT);
    const avg = async () => p.evaluate(() => { const f = window.__ft.slice(2); window.__ft = []; return +(f.reduce((a, b) => a + b, 0) / f.length).toFixed(1); });
    await p.waitForTimeout(1500); await avg(); await p.waitForTimeout(2000);
    const empty = await avg();
    await p.evaluate(() => { __TD.startWave(false); __TD.G.speed = 2; });
    const rows = [];
    for (let i = 0; i < 12; i++) { await p.waitForTimeout(500); await p.evaluate(() => { const G = __TD.G; if (G.nextTimer !== null || G.awaiting) __TD.startWave(true); for (let i = 0; i < 14; i++) spawnEnemy(['grunt', 'brute', 'splitter', 'aegis', 'scout', 'titan', 'blink'][i % 7], G.waveNum || 1, i % 2, i * 12, 1); }); }
    await avg(); await p.waitForTimeout(3000);
    const busy = await avg(), n = await p.evaluate(() => ({ enemies: __TD.G.enemies.length, parts: FX.parts.length, texts: FX.texts.length }));
    console.log(path.basename(path.dirname(path.dirname(file))) + '/' + path.basename(file), '| empty board', empty, 'ms | crowded', busy, 'ms |', JSON.stringify(n), '| cost of the crowd', +(busy - empty).toFixed(1), 'ms');
    await ctx.close();
  }
  await b.close();
})();
