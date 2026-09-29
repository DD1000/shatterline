// Frame-time profile of a busy late-game wave, phone-sized screen, CPU throttled like a mid-range phone.
// node tools/perf.js [dist file] [throttle]   -> per-frame update/draw ms + CPU profile hot spots
const { chromium } = require('playwright');
const path = require('path');
const file = process.argv[2] || 'dist/index.html', THR = +(process.argv[3] || 4), DSF = +(process.env.DSF || 3), NT = +(process.env.TOWERS || 24), EXTRA = +(process.env.EXTRA || 0);
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DSF, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.addInitScript(() => localStorage.setItem('shatterline.lang', 'en'));
  await p.goto('file://' + path.resolve(file)); await p.waitForTimeout(600);
  const cdp = await ctx.newCDPSession(p);
  await p.mouse.click(100, 100);
  await p.evaluate(NT => { Sound.init();
    // time the parts of each frame
    const W = window; W.__pf = { upd: [], draw: [], ui: [], vis: [], frames: [] };
    for (const [name, key] of [['update', 'upd'], ['drawWorld', 'draw'], ['drawUI', 'ui'], ['updateVisuals', 'vis']]) {
      const f = W[name]; W[name] = function () { const t = performance.now(); const r = f.apply(this, arguments); W.__pf[key].push(performance.now() - t); return r; };
    }
    let last = performance.now(); (function tick(t) { W.__pf.frames.push(t - last); last = t; requestAnimationFrame(tick); })(last);
    const T = __TD, G = T.G; T.Save.d.max = 80; T.Save.d.loadout = ['nova', 'arc', 'prism', 'emp']; T.startLevel(63); G.gold = 99999; G.tutorial = false;
    const spots = []; for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) spots.push([c, r, [...T.MAP.tiles].filter(k => ((k % 9) - c) ** 2 + (Math.floor(k / 9) - r) ** 2 <= 5).length]);
    spots.sort((a, b) => b[2] - a[2]);
    spots.slice(0, NT).forEach(([c, r], i) => { const tw = T.buildTower(['nova', 'arc', 'prism', 'emp', 'bolt', 'frost', 'rail', 'beacon'][i % 8], c, r); if (tw) { T.upgradeTower(tw); if (i % 2) T.upgradeTower(tw); } });
    G.lives = 999; G.maxLives = 999;
    T.startWave(false); G.speed = 2;
  }, NT);
  // let it build up: keep calling waves early so the screen fills
  await p.waitForTimeout(2000);
  await p.evaluate(() => { const W = window; for (const k in W.__pf) W.__pf[k] = []; });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR });
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  let peak = 0;
  for (let i = 0; i < 16; i++) { await p.waitForTimeout(500); peak = Math.max(peak, await p.evaluate(EX => { const G = __TD.G; if (G.nextTimer !== null || G.awaiting) __TD.startWave(true); if (EX) for (let i = 0; i < 12; i++) spawnEnemy(['grunt', 'brute', 'splitter', 'aegis', 'scout'][i % 5], G.waveNum || 1, i % 2, i * 14, 1); return G.enemies.length; }, EXTRA)); }
  const { profile } = await cdp.send('Profiler.stop');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const r = await p.evaluate(() => { const P = window.__pf, avg = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length), p95 = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length * 0.95)] || 0; };
    const f = P.frames.slice(2); return { frames: f.length, fps: +(1000 / avg(f)).toFixed(1), frameP95: +p95(f).toFixed(1), updPerFrame: +(avg(P.upd) * P.upd.length / Math.max(1, f.length)).toFixed(2), draw: +avg(P.draw).toFixed(2), ui: +avg(P.ui).toFixed(2), vis: +avg(P.vis).toFixed(2), fx: { parts: FX.parts.length, texts: FX.texts.length, rings: FX.rings.length }, towers: __TD.G.towers.length }; });
  // hot functions (self time)
  const self = {}, byId = {}; for (const n of profile.nodes) byId[n.id] = n;
  const dt = {}; for (let i = 0; i < profile.samples.length; i++) dt[profile.samples[i]] = (dt[profile.samples[i]] || 0) + (profile.timeDeltas[i] || 0);
  for (const n of profile.nodes) { const k = (n.callFrame.functionName || '(anon)') + ':' + (n.callFrame.lineNumber + 1); self[k] = (self[k] || 0) + (dt[n.id] || 0); }
  const tot = Object.values(self).reduce((a, b) => a + b, 0);
  const top = Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 22).map(([k, v]) => `${(100 * v / tot).toFixed(1).padStart(5)}%  ${k}`);
  console.log(JSON.stringify({ ...r, peakEnemies: peak, cpuThrottle: THR }));
  console.log(top.join('\n'));
  await b.close();
})();
