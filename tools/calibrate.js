// Bot playtests: finds, per level, the enemy-HP multiplier at which a strong bot
// just barely clears the level without losing a life. Usage:
//   node tools/calibrate.js search            -> prints the flawless threshold per level
//   node tools/calibrate.js check             -> runs smart + casual bots at the current LEVEL_CAL
const { chromium } = require('playwright');
const path = require('path');
const MODE = process.argv[2] || 'search';
const ONLY = process.argv[3] ? process.argv[3].split(',').map(Number) : null;

const BOT = String.raw`
window.__bot = function (n, cal, opts) {
  const T = __TD, G = T.G;
  let seed = (opts.seed || 1) * 99991 + n * 7;
  Math.random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  if (cal != null) T.LEVEL_CAL[n - 1] = cal;
  Sound.setEnabled(false);
  T.Save.d.max = Math.max(n, 1);
  const LV = T.LEVELS[n - 1];
  let unlocked = ['nova', 'bolt', 'arc', 'frost', 'prism', 'rail'].filter(t => T.TOWERS[t].unlock <= n);
  const slots = slotsFor(n);
  // required towers for condition levels; opts.skip drops some (to test playing without them)
  const skip = opts.skipNeeds ? ['mint', 'flak', 'emp'] : (opts.skip || []);
  // shield answer: EMP by default, or PRISM (opts.shieldTool / SHIELD_TOOL) once it is unlocked
  const shieldT = (opts.shieldTool || 'emp') === 'prism' && n >= 17 ? 'prism' : 'emp';
  const needs = [LV.noBounty && 'mint', LV.air && 'flak', LV.shielded && n >= 12 && !opts.oldShield && shieldT].filter(t => t && !skip.includes(t) && !(t === shieldT && skip.includes('emp')));
  unlocked = unlocked.filter(t => !needs.includes(t)).slice(0, slots - needs.length).concat(needs);        // required towers take the last slots
  T.Save.d.loadout = (opts.loadout || unlocked).filter(t => T.TOWERS[t].unlock <= n).slice(0, slots);
  T.startLevel(n); G.paused = true; G.tutorial = false;
  const lo = G.loadout;
  const pathTiles = [];
  for (const k of T.MAP.tiles) pathTiles.push([k % 9, Math.floor(k / 9)]);
  const cover = (c, r, range) => pathTiles.reduce((a, t) => a + ((t[0] - c) ** 2 + (t[1] - r) ** 2 <= range * range ? 1 : 0), 0);
  // spread: value lane tiles that no tower covers yet (levels 41+ use this, so second lanes get defended)
  const spread = opts.spread != null ? opts.spread : (n > 40 || LV.air || LV.noBounty);
  const defended = t => G.towers.reduce((a, tw) => { const rg = T.TOWERS[tw.type].lv[tw.lv].range || 0; return a + ((tw.c - t[0]) ** 2 + (tw.r - t[1]) ** 2 <= rg * rg ? 1 : 0); }, 0);
  const coverW = (c, r, range) => pathTiles.reduce((a, t) => a + ((t[0] - c) ** 2 + (t[1] - r) ** 2 <= range * range ? 1 / (1 + 0.6 * defended(t)) : 0), 0);
  const flightPts = [];
  for (const f of T.MAP.flights) for (let d = 0; d < f.len; d += 10) { const q = f.at(d); flightPts.push([(q.x - 20) / 40, (q.y - 20) / 40]); }
  const flakCover = (c, r, range) => flightPts.reduce((a, t) => a + ((t[0] - c) ** 2 + (t[1] - r) ** 2 <= range * range ? 1 / (1 + 0.8 * G.towers.filter(tw => tw.type === 'flak' && (tw.c - t[0]) ** 2 + (tw.r - t[1]) ** 2 <= 9).length) : 0), 0);
  const pick = type => {
    const range = T.TOWERS[type].lv[0].range || 2;
    if (type === 'mint' || type === 'flak') {
      const free = [];
      for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r) && !G.grid[r * 9 + c]) free.push([c, r, type === 'mint' ? -cover(c, r, 2.3) : flakCover(c, r, range)]);
      free.sort((a, b) => b[2] - a[2]);
      const top = free.slice(0, Math.max(1, Math.min(opts.top || 1, 4)));
      return top[Math.floor(Math.random() * top.length)];
    }
    if (type === 'rail') {          // rail: the tile whose best firing line crosses the most path
      const free = [];
      for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r) && !G.grid[r * 9 + c]) { const d = bestRailDir(c, r, range); free.push([c, r, railTiles(c, r, d, range).filter(([cc, rr]) => T.MAP.tiles.has(rr * 9 + cc)).length + 0.01 * cover(c, r, 2)]); }
      free.sort((a, b) => b[2] - a[2]);
      const top = free.slice(0, opts.top || 1);
      return top[Math.floor(Math.random() * top.length)];
    }
    if (type === 'beacon') {        // support: next to as many damage towers as possible
      const rg = T.TOWERS.beacon.lv[0].range, free = [];
      for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r) && !G.grid[r * 9 + c]) free.push([c, r, G.towers.filter(tw => !T.TOWERS[tw.type].support && !T.TOWERS[tw.type].eco && (tw.c - c) ** 2 + (tw.r - r) ** 2 <= rg * rg + 1e-6).reduce((a, tw) => a + 1 + tw.lv, 0)]);
      free.sort((a, b) => b[2] - a[2]);
      const top = free.slice(0, Math.max(1, Math.min(opts.top || 1, 3)));
      return top[Math.floor(Math.random() * top.length)];
    }
    const free = [];
    // EMP: favour lane tiles no other EMP reaches yet (so every lane gets shield-stripping), near damage towers
    const inR = (c, r, t, rg) => (t[0] - c) ** 2 + (t[1] - r) ** 2 <= rg * rg;
    const empW = (c, r) => aegisLaneSet.reduce((a, L) => {
      // big bonus for reaching a shielded lane that no EMP reaches yet
      const lt = laneTiles[L];
      if (G.towers.some(tw => tw.type === 'emp' && lt.some(t => inR(tw.c, tw.r, t, T.TOWERS.emp.lv[tw.lv].range)))) return a;
      return a + 6 * lt.filter(t => inR(c, r, t, range)).length;
    }, 0) + pathTiles.reduce((a, t) => {
      if ((t[0] - c) ** 2 + (t[1] - r) ** 2 > range * range) return a;
      let em = 0, dm = 0;
      for (const tw of G.towers) { const rg = T.TOWERS[tw.type].lv[tw.lv].range || 0; if ((tw.c - t[0]) ** 2 + (tw.r - t[1]) ** 2 <= rg * rg) { if (tw.type === 'emp') em++; else dm++; } }
      return a + (1 / (1 + 1.5 * em)) * (1 + 0.3 * Math.min(3, dm));
    }, 0);
    for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r) && !G.grid[r * 9 + c]) free.push([c, r, type === 'emp' ? empW(c, r) : spread ? coverW(c, r, range) : cover(c, r, range)]);
    free.sort((a, b) => b[2] - a[2]);
    const top = free.slice(0, opts.top || 1);
    return top[Math.floor(Math.random() * top.length)];
  };
  let bi = 0;
  // like a player reading the card: get an EMP up just before the first shielded wave, one per shielded lane
  // shielded enemies: this level's shield types plus the Aegis (dome in v11, own shield in v10)
  const shSet = new Set([...(LV.shieldTypes || []), 'aegis']);
  const hasAegis = w => w >= 0 && w < LV.waves.length && LV.waves[w].some(x => shSet.has(x[0]));
  const aegisSoon = () => hasAegis(G.waveNum - 1) || hasAegis(G.waveNum) || hasAegis(G.waveNum + 1);
  const aegisLater = () => LV.waves.some((g, i) => i >= G.waveNum - 1 && hasAegis(i));
  const laneTiles = T.MAP.paths.map(pth => { const st = new Set(); for (let d = 0; d < pth.len; d += 8) { const q = pth.at(d); st.add(Math.floor(q.y / 40) * 9 + Math.floor(q.x / 40)); } return [...st].map(k => [k % 9, Math.floor(k / 9)]); });
  const aegisLaneSet = [...new Set(LV.waves.flatMap(g => g.filter(x => shSet.has(x[0])).flatMap(x => x[3] === -1 ? T.MAP.paths.map((_, i) => i) : [Math.min(x[3] || 0, T.MAP.paths.length - 1)])))];
  const aegisLanes = () => Math.min(2, aegisLaneSet.length);
  const act = () => {
    for (let g = 0; g < 6; g++) {
      const up = G.towers.filter(tw => T.upgradeCost(tw) != null).sort((a, b) => (LV.noBounty && !opts.skipNeeds ? (b.type === 'mint') - (a.type === 'mint') : 0) || a.lv - b.lv || T.upgradeCost(a) - T.upgradeCost(b))[0];
      const wantUp = up && G.towers.length >= (opts.minTowers || 4) && (bi % 2 === 1 || G.towers.length >= 14);
      if (wantUp) { if (G.gold >= T.upgradeCost(up)) { T.upgradeTower(up); bi++; continue; } return; }
      let type = lo[Math.floor(bi / 2) % lo.length];
      const count = k => G.towers.filter(tw => tw.type === k).length;
      if (lo.includes('mint') && LV.noBounty && (count('mint') < 2 && G.towers.length >= 1 || count('mint') < 3 && G.towers.length >= 4)) type = 'mint';
      else if (lo.includes('flak') && LV.air && count('flak') < 1 && G.towers.length >= 2) type = 'flak';
      else if (needs.includes(shieldT) && aegisSoon() && count(shieldT) < aegisLanes() && G.towers.length >= 1) type = shieldT;
      else if (type === 'mint' || type === 'flak') { if (count(type) >= Math.ceil(G.towers.length / 2.5)) type = lo[0]; }
      else if (type === 'emp') { if (!aegisLater() || count('emp') >= Math.ceil(G.towers.length / 3.5)) type = lo[0]; }
      if (type === 'beacon' && (G.towers.length < 4 || count('beacon') >= Math.ceil(G.towers.length / 5))) type = lo.find(t => t !== 'beacon') || lo[0];
      if (G.gold >= T.TOWERS[type].cost) { const tl = pick(type); if (tl && T.buildTower(type, tl[0], tl[1])) { bi++; continue; } }
      return;
    }
  };
  act(); T.startWave(false);
  let t = 0, steps = 0;
  while (!G.over && t < 900) {
    T.update(1 / 60); t += 1 / 60; steps++;
    if (steps % 15 === 0) act();
  }
  const res = { n, win: G.result === 'win', lives: G.lives, time: Math.round(t), towers: G.towers.length, gold: Math.floor(G.gold), wave: G.waveNum };
  G.paused = true;
  return res;
};`;

(async () => {
  const b = await chromium.launch();
  const N = +(process.env.PAGES || 4), pages = [];
  for (let i = 0; i < N; i++) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    p.on('pageerror', e => console.log('PAGEERROR', e.message));
    await p.goto('file://' + path.resolve(__dirname, '../dist/' + (process.env.DIST || 'index.html')));
    await p.waitForTimeout(400);
    await p.evaluate(BOT);
    pages.push(p);
  }
  const levels = ONLY || Array.from({ length: 80 }, (_, i) => i + 1);
  const results = {};
  let next = 0;
  await Promise.all(pages.map(async p => {
    while (next < levels.length) {
      const n = levels[next++];
      if (MODE === 'search') {
        // SEARCH_AROUND=1 brackets the current LEVEL_CAL (faster, for relative re-calibration)
        const cur = await p.evaluate(n => __TD.LEVEL_CAL[n - 1], n);
        let lo = process.env.SEARCH_AROUND ? cur * 0.25 : 0.1, hi = process.env.SEARCH_AROUND ? cur * 2.5 : 6;
        const its = process.env.SEARCH_AROUND ? 8 : 10, bopts = { seed: 1, oldShield: !!process.env.OLD_SHIELD, shieldTool: process.env.SHIELD_TOOL };
        // ROBUST=1: pass = at least 2 of 3 varied runs flawless (much less noisy than one run)
        const passes = async c => {
          if (!process.env.ROBUST) { const r = await p.evaluate(([n, c, o]) => __bot(n, c, o), [n, c, bopts]); return r.win && r.lives === 10; }
          let ok = 0;
          for (const seed of [1, 2, 3]) { const r = await p.evaluate(([n, c, o]) => __bot(n, c, o), [n, c, { ...bopts, seed, top: seed === 1 ? 1 : 2 }]); if (r.win && r.lives === 10) ok++; if (ok >= 2 || ok + (3 - seed) < 2) break; }
          return ok >= 2;
        };
        for (let it = 0; it < its; it++) {
          const mid = Math.sqrt(lo * hi);
          if (await passes(mid)) lo = mid; else hi = mid;
        }
        const r = await p.evaluate(([n, c, o]) => __bot(n, c, o), [n, lo, bopts]);
        results[n] = { flawless: +lo.toFixed(3), time: r.time };
        console.log(`L${n} flawless<=${lo.toFixed(3)} time=${r.time}s towers=${r.towers}`);
      } else {
        const smart = await p.evaluate(n => __bot(n, null, { seed: 1 }), n);
        const casual = [];
        for (let s = 1; s <= 4; s++) casual.push(await p.evaluate(([n, s]) => __bot(n, null, { seed: s, top: 10 }), [n, s]));
        const poor = await p.evaluate(n => __bot(n, null, { seed: 3, top: 45 }), n);
        const LVn = await p.evaluate(n => { const l = __TD.LEVELS[n - 1]; return { nb: l.noBounty, air: l.air, sh: l.shielded && n >= 12 }; }, n);
        const without = {};
        for (const [k, t] of [['nb', 'mint'], ['air', 'flak'], ['sh', 'emp']]) if (LVn[k]) without[t] = await p.evaluate(([n, t]) => __bot(n, null, { seed: 1, skip: [t] }), [n, t]);
        results[n] = { smart, casual, poor, without };
        const cw = casual.filter(r => r.win).length;
        const wo = Object.entries(without).map(([t, r]) => ` | NO ${t.toUpperCase()}: ${r.win ? 'W' + r.lives : 'L@' + r.wave}`).join('');
        console.log(`L${n} smart ${smart.win ? 'W' : 'L'}${smart.lives} t=${smart.time}s | casual ${cw}/4 wins lives=[${casual.map(r => r.win ? r.lives : 'x' + r.wave).join(',')}] | poor ${poor.win ? 'W' + poor.lives : 'L@' + poor.wave}${wo}`);
      }
    }
  }));
  require('fs').writeFileSync(path.resolve(__dirname, `cal_${MODE}${process.env.TAG ? '_' + process.env.TAG : ''}.json`), JSON.stringify(results, null, 1));
  await b.close();
})();
