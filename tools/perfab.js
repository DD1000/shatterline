// A/B: turn parts of the renderer off to see what costs frame time in a crowded wave.
const { chromium } = require('playwright');
const path = require('path');
const only = process.argv[2] ? process.argv[2].split(',') : null;
const variants = {
  baseline: 'window.tuneQuality = function(){};',
  adaptive: '',
  dpr1: 'window.tuneQuality = function(){}; QUALITY.dpr = 1; layout();',
  noGlow: 'window.glow = function(){};',
  noFXdraw: 'FX.draw = function(){};',
  noFXtext: 'const _d = FX.draw.bind(FX); FX.draw = function(){ const t = FX.texts; FX.texts = []; _d(); FX.texts = t; };',
  noEnemyGlyph: 'window.drawGlyph = function(){};',
  noUI: 'window.drawUI = function(){};',
  noBackground: 'const _di = CanvasRenderingContext2D.prototype.drawImage; window.__noBg = true;',
};
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const [name, code] of Object.entries(variants)) {
    if (only && !only.includes(name)) continue;
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    await p.addInitScript(() => localStorage.setItem('shatterline.lang', 'en'));
    await p.goto('file://' + path.resolve('dist/index.html')); await p.waitForTimeout(500);
    await p.evaluate(() => { const T = __TD, G = T.G; T.Save.d.max = 80; T.Save.d.loadout = ['nova', 'arc', 'prism', 'emp']; T.startLevel(63); G.gold = 99999; G.tutorial = false; G.lives = G.maxLives = 999;
      const spots = []; for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) spots.push([c, r, [...T.MAP.tiles].filter(k => ((k % 9) - c) ** 2 + (Math.floor(k / 9) - r) ** 2 <= 5).length]);
      spots.sort((a, b) => b[2] - a[2]); spots.slice(0, 14).forEach(([c, r], i) => { const tw = T.buildTower(['nova', 'arc', 'prism', 'emp', 'bolt', 'frost', 'rail'][i % 7], c, r); if (tw) T.upgradeTower(tw); });
      T.startWave(false); G.speed = 2; });
    await p.evaluate(code);
    await p.waitForTimeout(1500);
    await p.evaluate(() => { window.__ft = []; let last = performance.now(); (function tick(t) { window.__ft.push(t - last); last = t; requestAnimationFrame(tick); })(last); });
    for (let i = 0; i < 10; i++) { await p.waitForTimeout(500); await p.evaluate(() => { const G = __TD.G; if (G.nextTimer !== null || G.awaiting) __TD.startWave(true); for (let i = 0; i < 12; i++) spawnEnemy(['grunt', 'brute', 'splitter', 'aegis', 'scout'][i % 5], G.waveNum || 1, i % 2, i * 14, 1); }); }
    const r = await p.evaluate(() => { const f = window.__ft.slice(3); return { ms: +(f.reduce((a, b) => a + b, 0) / f.length).toFixed(1), enemies: __TD.G.enemies.length, parts: FX.parts.length, texts: FX.texts.length, dpr: DPR, fx: QUALITY.fx }; });
    console.log(name.padEnd(14), JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})();
