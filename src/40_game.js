// =====================================================================
//  PROGRESS (saved on this device)
// =====================================================================
const Save = {
  d: { max: 1, stars: {}, loadout: ['bolt'], known: ['bolt'], done: false },
  load() {
    try {
      const d = JSON.parse(localStorage.getItem('shatterline.save') || 'null');
      if (d && d.max) this.d = Object.assign(this.d, d);
    } catch (e) {}
    this.d.max = clamp(this.d.max | 0, 1, LEVELS.length);
    // players who had cleared the old final level carry on into the new ones
    if (this.d.done && this.d.max < LEVELS.length && this.stars(this.d.max) > 0) { this.d.max += 1; this.d.done = false; }
  },
  // highest level you can open: your progress, or everything while test mode is on
  open() { return this.d.testAll ? LEVELS.length : this.d.max; },
  store() { try { localStorage.setItem('shatterline.save', JSON.stringify(this.d)); } catch (e) {} },
  stars(n) { return this.d.stars[n] || 0; },
  total() { return Object.values(this.d.stars).reduce((a, b) => a + b, 0); },
  unlockedTowers() { return TOWER_ORDER.filter(t => TOWERS[t].unlock <= this.open()); },
  complete(n, stars) {
    const prev = this.stars(n);
    if (stars > prev) this.d.stars[n] = stars;
    let first = false;
    if (stars > 0 && n === this.d.max) { first = true; if (n < LEVELS.length) this.d.max = n + 1; else this.d.done = true; }
    this.store();
    return { first, prev };
  },
  // new towers go straight into the loadout so you try them
  syncLoadout() {
    const slots = slotsFor(this.open()), fresh = [];
    for (const t of this.unlockedTowers()) if (!this.d.known.includes(t)) { this.d.known.push(t); fresh.push(t); }
    let lo = this.d.loadout.filter(t => TOWERS[t] && TOWERS[t].unlock <= this.open());
    for (const t of fresh) { if (lo.includes(t)) continue; if (lo.length >= slots) lo.pop(); lo.push(t); }
    for (const t of this.unlockedTowers()) if (lo.length < Math.min(slots, this.unlockedTowers().length) && !lo.includes(t)) lo.push(t);
    this.d.loadout = lo.slice(0, slots);
    this.store();
    return fresh;
  },
};

// =====================================================================
//  GAME SIMULATION
// =====================================================================
const G = {
  state: 'title', demo: true, paused: false, over: false, result: null, speed: 1, time: 0,
  theme: 0, gold: 0, lives: 0, maxLives: ECON.startLives, waveNum: 0, awaiting: true, nextTimer: null,
  levelNum: 0, level: null, waves: [], loadout: ['bolt'], stars: 0,
  spawners: [], waveStats: {}, enemies: [], towers: [], shots: [], shells: [], domes: [],
  grid: new Array(COLS * ROWS).fill(null), eid: 0,
  combo: 0, comboT: 0, comboPop: 0, bestCombo: 0, kills: 0, leaks: 0, leakTypes: {},
  shake: 0, flashA: 0, flashCol: '#fff', slowT: 0, coreHit: 0, portalPulse: 0,
  banner: null, toast: null, shout: null, menu: null, coins: [],
  dispGold: 0, goldBump: 0, livesBump: 0, endT: 0, demoT: 0, tutorial: false,
};
const theme = () => THEMES[G.theme];
const waveStat = w => G.waveStats[w] || (G.waveStats[w] = { alive: 0, toSpawn: 0, cleared: false });
const snd = (name, ...a) => { if (!G.demo || G.demoSound) Sound.play(name, ...a); };
const isBuildable = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS && !MAP.tiles.has(r * COLS + c);
const bossAlive = () => G.enemies.some(e => e.alive && e.rc.boss);
const towerRange = tw => (TOWERS[tw.type].lv[tw.lv].range || 0) * TILE;
function addShake(v) { G.shake = Math.min(1, G.shake + v * (REDUCED ? 0.3 : 1)); }
function vibrate(p) { try { if (!G.demo && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

function resetRun() {
  G.over = false; G.result = null; G.paused = false; G.speed = 1; G.time = 0; G.stars = 0;
  G.lives = G.maxLives = ECON.startLives; G.waveNum = 0; G.awaiting = true; G.nextTimer = null;
  G.spawners = []; G.waveStats = {}; G.enemies = []; G.towers = []; G.shots = []; G.shells = []; G.missiles = []; G.snow = []; G.noBounty = false;
  G.grid.fill(null); G.combo = 0; G.comboT = 0; G.bestCombo = 0; G.kills = 0; G.leaks = 0; G.leakTypes = {}; G.shieldLeaks = 0; G.domes = [];
  G.banner = null; G.toast = null; G.shout = null; G.menu = null; G.press = null; G.coins = []; G.confirm = null;
  G.endT = 0; G.slowT = 0; G.flashA = 0; G.demoT = 0; G.endShow = 0; G.starSnd = 0;
  FX.clear();
}

function startDemo() {
  G.demo = true; G.level = null; G.levelNum = 0; G.waves = [];
  setMap([DEMO_PATH]);
  resetRun();
  G.gold = 0; G.dispGold = 0;
  [['bolt', 2, 3, 2], ['arc', 4, 6, 1], ['nova', 4, 9, 1], ['frost', 6, 3, 0], ['prism', 5, 11, 1], ['rail', 0, 6, 0]]
    .forEach(([t, c, r, lv]) => { const tw = placeTower(t, c, r); tw.lv = lv; tw.spawn = 1; });
}

function startLevel(n) {
  QUALITY.fx = 1; QUALITY.t = 0; QUALITY.slow = 0; QUALITY.ema = 16;
  if (QUALITY.dpr < 2 && DPR < Math.min(2, window.devicePixelRatio || 1)) { QUALITY.dpr = Math.min(2, DPR + 0.25); layout(); }   // try one step sharper each level
  Sound.setBoss(false); Sound.setIntensity(0.1, true);
  const lv = LEVELS[n - 1];
  G.demo = false; G.demoSound = false; G.level = lv; G.levelNum = n; G.waves = lv.waves; G.theme = lv.world;
  setMap(lv.paths, lv.lanes);
  resetRun();
  G.gold = lv.gold; G.dispGold = lv.gold; G.noBounty = !!lv.noBounty;
  G.loadout = Save.d.loadout.filter(t => TOWERS[t].unlock <= Save.open()).slice(0, slotsFor(Save.open()));
  if (!G.loadout.length) G.loadout = ['bolt'];
  G.tutorial = n === 1 && Save.stars(1) === 0;
  G.state = 'play';
  buildBackground(theme());
}

// ---------------------------------------------------------------- waves
function buildSpawns(w) {
  const list = [], nl = MAP.paths.length, tl = new Array(nl).fill(0);
  for (const [type, count, gap, lane] of G.waves[w - 1]) {
    const lanes = lane < 0 ? [...Array(nl).keys()] : [Math.min(lane, nl - 1)];
    const t0 = Math.max(...lanes.map(i => tl[i]));
    for (let i = 0; i < count; i++) list.push({ type, at: t0 + i * gap, lane: lanes[i % lanes.length] });
    const end = t0 + (count - 1) * gap + ECON.groupGap;
    for (const i of lanes) tl[i] = end;
  }
  return list.sort((a, b) => a.at - b.at);
}
// How hard the music should push (0..1): bigger waves later in the level, more enemies on
// screen and the final wave all raise it. Boss fights switch to the boss theme on top of this.
function musicIntensity() {
  if (!G.level || !G.waveNum) return 0.1;
  const n = G.waves.length, waveFrac = (G.waveNum - 1) / Math.max(1, n - 1);
  let alive = 0; for (const e of G.enemies) if (e.alive) alive += e.rc.boss ? 6 : e.rc.leak;
  for (const sp of G.spawners) alive += (sp.list.length - sp.i) * 0.5;          // the rest of the wave is coming
  const crowd = Math.min(1, alive / 22);
  const x = 0.12 + 0.4 * waveFrac + 0.45 * crowd + (G.waveNum === n ? 0.1 : 0) + Math.min(0.08, G.levelNum / 500);
  return Math.min(1, x);
}
function isBossWave(w) { return w >= 1 && w <= G.waves.length && G.waves[w - 1].some(g => g[0] === 'boss'); }

function startWave(early) {
  if (G.over || G.waveNum >= G.waves.length) return;
  if (early && G.nextTimer !== null) {
    const bonus = G.noBounty ? 0 : Math.ceil(G.nextTimer * ECON.earlyBonus);
    if (bonus > 0) {
      G.gold += bonus; G.goldBump = 1;
      G.toast = { text: tr('early_call', bonus), color: '#ffd23d', t: 0, dur: 1.4 };
      snd('coin');
    }
  }
  G.awaiting = false; G.nextTimer = null; G.waveNum++;
  const w = G.waveNum, list = buildSpawns(w);
  G.spawners.push({ wave: w, list, i: 0, t: -0.8 });
  const ws = waveStat(w); ws.toSpawn = list.length;
  const boss = isBossWave(w), last = w === G.waves.length;
  const cond = w === 1 && G.level ? (G.level.noBounty ? tr('cond_noBounty') : G.level.air ? tr('cond_air') : G.level.shielded ? tr('cond_shielded') : '') : '';
  G.banner = { text: tr('wave', w), sub: boss ? tr('boss_incoming') : last ? tr('final_wave') : cond, color: boss ? '#ff2e4d' : theme().flow, t: 0, dur: cond ? 2.2 : 1.7 };
  snd(boss ? 'boss' : 'wave');
  Sound.setBoss(bossAlive());
  Sound.musicOn();
}

function spawnEnemy(type, wave, lane = 0, dist = 0, jitter = 0) {
  const rc = ENEMIES[type];
  const mul = G.demo ? 1.6 : G.level.hp(wave) * (ECON.hpScale || 1);
  const li = Math.min(lane, MAP.paths.length - 1), path = rc.flying ? MAP.flights[li] : MAP.paths[li];
  const e = {
    id: ++G.eid, type, rc, wave, lane, path, hp: rc.hp * mul, maxHp: rc.hp * mul, dist, speed: rc.speed * TILE,
    x: 0, y: 0, dir: 0, rot: rand(0, TAU), rot2: 0, flash: 0, punch: 0, slowT: 0, slowAmt: 0, brittle: false,
    age: jitter ? 0.3 : 0, blinkT: rand(1, 5), blink: 0, trailT: 0, alive: true, off: jitter,
    shield: 0, shieldMax: 0, lastHit: -9, dome: 0, domeMax: 0, domeHit: -9, domePing: 0, domeDead: false,
    elec: false, elecOff: 0, ice: false, snowT: rand(0.4, 1), marks: 0, iceLock: 0,
    warpT: rc.blink ? rc.blink.every * rand(0.7, 1.1) : 0, healT: rc.heal ? rc.heal.every * rand(0.5, 1) : 0,
  };
  const p = path.at(dist); e.x = p.x; e.y = p.y; e.dir = p.ang;
  // shields: this level's shielded types wear their own; an Aegis carries a dome for everyone near it
  if (!G.demo && G.level && G.level.shieldTypes.includes(type)) e.shield = e.shieldMax = e.maxHp * (G.level.shielded ? SHIELD_PCT : SHIELD_PCT_LIGHT);
  if (rc.dome) e.dome = e.domeMax = rc.dome.hp * mul;
  // electric / ice: the Volt and Yeti always are; on some levels a random enemy type is too
  e.elec = !!rc.elec || (!G.demo && !!G.level && (G.level.elecTypes || []).includes(type));
  e.ice = !!rc.ice || (!G.demo && !!G.level && (G.level.iceTypes || []).includes(type));
  G.enemies.push(e); waveStat(wave).alive++;
  if (!jitter) G.portalPulse = 1;
  if (rc.boss && !G.demo) {
    G.shout = { text: tr('warden'), sub: tr('armored_boss'), color: rc.color, t: 0, dur: 1.6 };
    addShake(0.35); Sound.setBoss(true);
  }
  return e;
}

// --------------------------------------------------------------- towers
function placeTower(type, c, r) {
  const tw = { type, c, r, x: c * TILE + TILE / 2, y: r * TILE + TILE / 2, lv: 0, cd: 0.3, aim: -Math.PI / 2,
    kick: 0, spawn: 0, mode: 'first', spent: TOWERS[type].cost, retT: 0, target: null, idleT: rand(0, 2),
    buff: 0, heat: 0, beamT: null, acc: 0, accT: 0, dir: 1, tube: 0, zapT: 0, chillT: 0 };
  if (type === 'rail') { tw.dir = bestRailDir(c, r, TOWERS.rail.lv[0].range); tw.aim = railAngle(tw.dir); }
  if (type === 'mint') tw.cd = TOWERS.mint.lv[0].every;
  G.towers.push(tw); G.grid[r * COLS + c] = tw; return tw;
}

// ---- Rail: fires down one fixed line (up / right / down / left) ----
const RAIL_DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const railAngle = d => Math.atan2(RAIL_DIRS[d][1], RAIL_DIRS[d][0]);
function railTiles(c, r, dir, range) {
  const out = [], [dx, dy] = RAIL_DIRS[dir];
  for (let k = 1; k <= Math.floor(range + 1e-6); k++) {
    const cc = c + dx * k, rr = r + dy * k;
    if (cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS) break;
    out.push([cc, rr]);
  }
  return out;
}
function bestRailDir(c, r, range) {
  let best = 1, bv = -1;
  for (let d = 0; d < 4; d++) {
    const n = railTiles(c, r, d, range).filter(([cc, rr]) => MAP.tiles.has(rr * COLS + cc)).length;
    if (n > bv) { bv = n; best = d; }
  }
  return best;
}
function railVictims(tw) {
  const range = TOWERS.rail.lv[tw.lv].range * TILE, [ax, ay] = RAIL_DIRS[tw.dir], v = [];
  for (const e of G.enemies) {
    if (!e.alive || e.rc.flying || e.age < 0.15) continue;
    const px = e.x - tw.x, py = e.y - tw.y, along = px * ax + py * ay;
    if (along < 0 || along > range + e.rc.r) continue;
    if (Math.abs(px * ay - py * ax) <= e.rc.r + 6) v.push(e);
  }
  return v;
}
function fireRail(tw, victims) {
  const d = TOWERS.rail, L = d.lv[tw.lv], c = d.color, range = L.range * TILE, [ax, ay] = RAIL_DIRS[tw.dir];
  tw.cd = 1 / L.rate; tw.kick = 1;
  const mx = tw.x + ax * 14, my = tw.y + ay * 14;
  for (const e of victims) { FX.spark(e.x, e.y, c, 5, 200, 0.3); damage(e, L.dmg * (1 + tw.buff), { big: true }); }
  FX.line(mx, my, tw.x + ax * range, tw.y + ay * range, c, 0.34, 5);
  FX.flash(mx, my, 30, c, 0.15);
  addShake(0.1); snd('rail');
}

// ---- Mint: pulses out gold while a wave is running ----
function mintPulse(tw) {
  const L = TOWERS.mint.lv[tw.lv];
  tw.cd = L.every; tw.kick = 1;
  G.gold += L.gold;
  FX.ring(tw.x, tw.y, 8, 42, '#ffd23d', 0.55, 3);
  FX.ring(tw.x, tw.y, 4, 24, '#fff3b0', 0.35, 1.5);
  FX.flash(tw.x, tw.y, 42, '#ffd23d', 0.22);
  FX.text(tw.x, tw.y - 22, `+${L.gold}`, '#ffe38a', 13, { font: FONT_D, life: 0.9 });
  spawnCoins(tw.x, tw.y, 2 + tw.lv);
  snd('mint');
}
function buildTower(type, c, r) {
  const d = TOWERS[type];
  if (!isBuildable(c, r) || G.grid[r * COLS + c] || G.gold < d.cost) return null;
  G.gold -= d.cost;
  const tw = placeTower(type, c, r);
  FX.ring(tw.x, tw.y, 8, 34, d.color, 0.45, 3);
  FX.shards(tw.x, tw.y, d.color, 10, 130, 3.5);
  FX.flash(tw.x, tw.y, 60, d.color, 0.25);
  addShake(0.12); snd('build'); vibrate(15);
  G.tutorial = false;
  return tw;
}
function upgradeCost(tw) { const n = TOWERS[tw.type].lv[tw.lv + 1]; return n ? n.cost : null; }
function upgradeTower(tw) {
  const cost = upgradeCost(tw);
  if (cost == null || G.gold < cost) return false;
  G.gold -= cost; tw.lv++; tw.spent += cost; tw.kick = 1;
  const c = TOWERS[tw.type].color;
  FX.ring(tw.x, tw.y, 10, 44, c, 0.5, 3.5); FX.ring(tw.x, tw.y, 4, 26, '#ffffff', 0.3, 2);
  for (let i = 0; i < 14; i++) FX.dot(tw.x + rand(-14, 14), tw.y + rand(-6, 10), c, 2.5, rand(0.4, 0.8), 0, rand(-90, -40));
  FX.text(tw.x, tw.y - 26, tr('tower_lv', tw.lv + 1), c, 12, { font: FONT_D, life: 0.9 });
  addShake(0.1); snd('upgrade'); vibrate(20);
  return true;
}
function sellValue(tw) { return Math.floor(tw.spent * ECON.sellRate); }
function sellTower(tw) {
  const v = sellValue(tw);
  G.gold += v;
  G.towers.splice(G.towers.indexOf(tw), 1); G.grid[tw.r * COLS + tw.c] = null;
  const c = TOWERS[tw.type].color;
  FX.shatter(tw.x, tw.y, c, 10, false);
  FX.text(tw.x, tw.y - 18, `+${v}`, '#ffd23d', 13);
  spawnCoins(tw.x, tw.y, 4);
  snd('sell');
}

function inRange(tw, e, range) {
  const rr = range + e.rc.r * 0.5;
  return (e.x - tw.x) ** 2 + (e.y - tw.y) ** 2 <= rr * rr;
}
function findTarget(tw, range) {
  let best = null, bestV = -Infinity;
  const air = !!TOWERS[tw.type].air;
  for (const e of G.enemies) {
    if (!e.alive || e.age < 0.15 || !!e.rc.flying !== air || !inRange(tw, e, range)) continue;
    const v = tw.mode === 'first' ? e.dist / e.path.len * 1e4 : tw.mode === 'strong' ? e.hp + e.shield : -((e.x - tw.x) ** 2 + (e.y - tw.y) ** 2);
    if (v > bestV) { bestV = v; best = e; }
  }
  return best;
}

function computeBuffs() {
  for (const t of G.towers) t.buff = 0;
  for (const b of G.towers) {
    if (b.type !== 'beacon' || b.spawn < 1 || b.zapT > 0) continue;
    const L = TOWERS.beacon.lv[b.lv];
    for (const t of G.towers) {
      if (t === b || TOWERS[t.type].support || TOWERS[t.type].eco) continue;
      if ((t.c - b.c) ** 2 + (t.r - b.r) ** 2 <= L.range * L.range + 1e-6) t.buff = Math.max(t.buff, L.buff);
    }
  }
}

function fire(tw, tg) {
  const d = TOWERS[tw.type], L = d.lv[tw.lv], c = d.color, boost = 1 + tw.buff;
  tw.cd = 1 / L.rate; tw.kick = 1;
  tw.aim = Math.atan2(tg.y - tw.y, tg.x - tw.x);
  const mx = tw.x + Math.cos(tw.aim) * 14, my = tw.y + Math.sin(tw.aim) * 14;
  if (tw.type === 'bolt') {
    const crit = Math.random() < d.crit;
    G.shots.push({ x: mx, y: my, tg, lx: tg.x, ly: tg.y, dmg: L.dmg * boost * (crit ? 2.5 : 1), crit, color: c, sp: 560, vx: 0, vy: 0 });
    FX.flash(mx, my, 14, c, 0.08);
    snd('bolt');
  } else if (tw.type === 'arc') {
    const pts = [{ x: tw.x, y: tw.y + 1 }], hit = new Set(), up = tw.zapT > 0;     // supercharged by electrified enemies
    let cur = tg, dmg = L.dmg * boost;
    for (let i = 0; i < L.chains + (up ? ELEC.arcChains : 0) && cur; i++) {
      hit.add(cur); pts.push({ x: cur.x, y: cur.y });
      FX.spark(cur.x, cur.y, c, 3, 140, 0.25);
      damage(cur, dmg, { color: c });
      dmg *= 0.85;
      let nxt = null, nd = ((up ? ELEC.arcJump : 1.7) * TILE) ** 2;
      for (const e of G.enemies) {
        if (!e.alive || e.rc.flying || hit.has(e)) continue;
        const dd = (e.x - cur.x) ** 2 + (e.y - cur.y) ** 2;
        if (dd < nd) { nd = dd; nxt = e; }
      }
      cur = nxt;
    }
    FX.zap(pts, up ? '#fff7a8' : c, up ? 0.22 : 0.17);
    snd('arc');
  } else if (tw.type === 'nova') {
    const flight = 0.75;
    const slow = tg.slowT > 0 ? 1 - tg.slowAmt : 1;
    const p = tg.path.at(tg.dist + tg.speed * slow * flight);
    G.shells.push({ sx: mx, sy: my, tx: p.x, ty: p.y, t: 0, dur: flight, dmg: L.dmg * boost, splash: L.splash * TILE, color: c });
    FX.flash(mx, my, 22, c, 0.12);
    for (let i = 0; i < 4; i++) FX.dot(mx, my, '#ffb47a', 3, 0.35, rand(-30, 30), rand(-30, 30));
    snd('launch');
  } else if (tw.type === 'frost') {
    const range = L.range * TILE;
    FX.ring(tw.x, tw.y, 6, range, tw.chillT > 0 ? '#e8fbff' : c, 0.5, tw.chillT > 0 ? 4.5 : 3);
    FX.ring(tw.x, tw.y, 4, range * 0.6, '#ffffff', 0.35, 1.5);
    for (const e of G.enemies) {
      if (!e.alive || e.rc.flying || !inRange(tw, e, range)) continue;
      e.slowT = 1.3; e.slowAmt = Math.max(e.slowAmt, L.slow); if (L.brittle) e.brittle = true;
      for (let i = 0; i < 2; i++) FX.dot(e.x + rand(-6, 6), e.y + rand(-6, 6), '#dfe8ff', 2.2, 0.4, 0, -20);
      if (tw.chillT > 0 && e.iceLock <= 0 && !e.rc.flying) {          // supercharged by snowballs: mark, then freeze
        e.marks = Math.min(ICE.marks, e.marks + 1);
        if (e.marks >= ICE.marks) freezeEnemy(e);
      }
      damage(e, L.dmg * boost, { pierce: true, quiet: true });
    }
    snd('frost');
  } else if (tw.type === 'emp') {
    // up to L.beams lasers: shielded, domed and electrified enemies first, then whoever is closest to the core
    const range = L.range * TILE, list = [];
    // (an Aegis counts as in range as soon as the edge of its dome is)
    for (const e of G.enemies) if (e.alive && !e.rc.flying && e.age >= 0.15 && inRange(tw, e, range + (e.domeMax > 0 && !e.domeDead ? e.rc.dome.r * TILE * 0.5 : 0))) list.push(e);
    list.sort((a, b) => (empWants(b) - empWants(a)) || (b.dist / b.path.len - a.dist / a.path.len));
    const hitList = list.slice(0, L.beams);
    if (hitList.length) tw.aim = Math.atan2(hitList[0].y - tw.y, hitList[0].x - tw.x);
    for (const e of hitList) {
      const want = empWants(e);
      FX.line(tw.x, tw.y, e.x, e.y, want ? '#8fc0ff' : c, 0.16, want ? 3 : 2);
      FX.flash(e.x, e.y, want ? 20 : 12, c, 0.12);
      empHit(e, L.dmg * boost);
    }
    FX.flash(tw.x, tw.y, 22, c, 0.12);
    snd('emp');
  } else if (tw.type === 'flak') {
    tw.tube ^= 1;
    const sd = tw.tube ? 3.2 : -3.2, sx = mx - Math.sin(tw.aim) * sd, sy = my + Math.cos(tw.aim) * sd;
    G.missiles.push({ x: sx, y: sy, vx: Math.cos(tw.aim) * 150, vy: Math.sin(tw.aim) * 150, tg, dmg: L.dmg * boost, splash: L.splash * TILE, color: c, t: 0 });
    FX.flash(sx, sy, 16, c, 0.1);
    snd('flak');
  }
}

// ------------------------------------------------------ damage & death
function damage(e, amt, o = {}) {
  if (!e.alive) return;
  if (e.rc.armor && !o.pierce) amt = Math.max(amt * 0.3, amt - e.rc.armor);
  if (e.brittle) amt *= 1.2;
  e.lastHit = G.time; e.flash = 0.07;
  const dm = o.throughShield || e.rc.flying ? null : domeOver(e);
  if (dm) {                                 // inside an Aegis dome: the dome soaks the hit first
    const hit = amt * SHIELD_FACTOR;
    dm.domePing = 0.15; dm.domeHit = G.time;
    if (hit < dm.dome) {
      dm.dome -= hit;
      if (!o.quiet && Math.random() < 0.4) FX.text(e.x + rand(-6, 6), e.y - e.rc.r - 4, `${Math.max(1, Math.round(hit))}`, '#8fc8ff', 9, { life: 0.45 });
      if (Math.random() < 0.3) FX.spark(e.x, e.y, '#9fd6ff', 2, 90, 0.2);
      return;
    }
    amt -= dm.dome / SHIELD_FACTOR; domeShatter(dm, false);
    if (amt <= 0) return;
  }
  if (e.shield > 0 && !o.throughShield) {
    const hit = amt * SHIELD_FACTOR;
    e.shieldPing = 0.15;
    if (hit < e.shield) {                  // the shield soaks it up
      e.shield -= hit;
      if (!o.quiet && Math.random() < 0.5) FX.text(e.x + rand(-6, 6), e.y - e.rc.r - 4, `${Math.max(1, Math.round(hit))}`, '#8fc8ff', 9, { life: 0.45 });
      if (Math.random() < 0.4) FX.spark(e.x, e.y, '#9fd6ff', 2, 90, 0.2);
      return;
    }
    amt -= e.shield / SHIELD_FACTOR;
    shieldShatter(e);
    if (amt <= 0) return;
  }
  e.hp -= amt; e.punch = Math.min(0.4, e.punch + 0.16);
  if (!o.quiet) {
    const n = Math.max(1, Math.round(amt));
    if (o.crit) FX.text(e.x + rand(-5, 5), e.y - e.rc.r - 6, `${n}!`, '#fff36a', 15, { life: 0.8, vy: -55 });
    else {                                  // small hits add up into one number every ~0.15s per enemy
      e.numAcc = (e.numAcc || 0) + amt;
      if (o.big || G.time - (e.numT || -9) >= 0.15) {
        FX.text(e.x + rand(-6, 6), e.y - e.rc.r - 4, `${Math.max(1, Math.round(e.numAcc))}`, o.big ? '#ffd0a8' : 'rgba(235,235,255,0.9)', o.big ? 13 : 10, { life: 0.6 });
        e.numAcc = 0; e.numT = G.time;
      }
    }
  }
  if (e.hp <= 0) kill(e);
}

const MILESTONES = { 10: 'NICE', 25: 'AWESOME', 50: 'UNREAL', 100: 'LEGENDARY', 200: 'GODLIKE' };
function shieldShatter(e) {
  e.shield = 0;
  FX.shards(e.x, e.y, '#9fd6ff', 12, 180, 3.5); FX.ring(e.x, e.y, e.rc.r, e.rc.r * 3, '#9fd6ff', 0.35, 2);
  snd('shield');
}
function domeOver(e) {
  for (const a of G.domes) {
    if (!a.alive || a.dome <= 0) continue;
    const R = a.rc.dome.r * TILE;
    if ((e.x - a.x) ** 2 + (e.y - a.y) ** 2 <= R * R) return a;
  }
  return null;
}
function domeShatter(a, byEmp) {
  const R = a.rc.dome.r * TILE;
  a.dome = 0; if (byEmp) a.domeDead = true;
  FX.ring(a.x, a.y, R * 0.9, R * 1.4, '#9fd6ff', 0.45, 3); FX.shards(a.x, a.y, '#9fd6ff', 18, 220, 3.5);
  if (a.alive) FX.text(a.x, a.y - R * 0.6, tr('dome_down'), '#9fd6ff', 10, { font: FONT_D, life: 0.8 });
  snd('shield'); addShake(0.06);
}
// EMP: does this enemy carry something a laser should take off? (shield, Aegis dome, live electricity)
const isLiveElec = e => e.elec && e.elecOff <= 0;
const empWants = e => (e.shieldMax > 0 || (e.domeMax > 0 && !e.domeDead) || isLiveElec(e)) ? 1 : 0;
function empHit(e, dmg) {
  if (e.shieldMax > 0) {                               // strip the shield for good
    e.shield = 0; e.shieldMax = 0;
    FX.shards(e.x, e.y, '#9fd6ff', 10, 170, 3); FX.ring(e.x, e.y, e.rc.r, e.rc.r * 3, '#9fd6ff', 0.35, 2);
    FX.text(e.x, e.y - e.rc.r - 8, tr('stripped'), '#9fd6ff', 9, { font: FONT_D, life: 0.6 });
    snd('shield');
  }
  if (e.domeMax > 0 && !e.domeDead) domeShatter(e, true);      // pop the Aegis dome for good
  if (isLiveElec(e)) {                                 // short out the electricity for a while
    e.elecOff = ELEC.off;
    FX.spark(e.x, e.y, '#fff7a8', 6, 160, 0.3); FX.ring(e.x, e.y, e.rc.r, ELEC.r * TILE, '#f6ff3d', 0.3, 1.5);
    FX.text(e.x, e.y - e.rc.r - 8, tr('shorted'), '#f6ff3d', 9, { font: FONT_D, life: 0.6 });
  }
  damage(e, dmg, { pierce: true, quiet: true });
}
function towerZapped(tw) {
  const up = tw.type === 'arc';
  FX.spark(tw.x, tw.y, up ? '#fff7a8' : '#f6ff3d', 8, 170, 0.3);
  FX.text(tw.x, tw.y - 24, tr(up ? 'supercharged' : 'shorted'), up ? '#fff36a' : '#c9c6e8', 10, { font: FONT_D, life: 0.8 });
  snd(up ? 'charge' : 'short');
}
function throwSnow(e, tw) {
  const d = Math.hypot(tw.x - e.x, tw.y - e.y);
  G.snow.push({ sx: e.x, sy: e.y, x: e.x, y: e.y, h: 0, t: 0, dur: 0.3 + d / 420, arc: 12 + d * 0.15, tw });
}
function snowHit(tw) {
  const up = tw.type === 'frost';
  FX.shards(tw.x, tw.y - 4, '#f2fbff', 7, 110, 3); FX.flash(tw.x, tw.y, 24, '#dff6ff', 0.15);
  if (tw.chillT <= 0) { FX.text(tw.x, tw.y - 24, tr(up ? 'supercharged' : 'chilled'), up ? '#e8fbff' : '#a9d8ff', 10, { font: FONT_D, life: 0.8 }); if (up) snd('charge'); }
  tw.chillT = ICE.time;
}
function freezeEnemy(e) {
  e.iceLock = ICE.freeze;
  FX.shards(e.x, e.y, '#e8fbff', 8, 120, 3); FX.ring(e.x, e.y, e.rc.r, e.rc.r * 2.4, '#e8fbff', 0.3, 2);
  FX.text(e.x, e.y - e.rc.r - 8, tr('frozen'), '#e8fbff', 9, { font: FONT_D, life: 0.6 });
  snd('freeze');
}

function kill(e) {
  if (e.dome > 0) domeShatter(e, false);
  e.alive = false; G.kills++;
  waveStat(e.wave).alive--;
  const big = !!e.rc.boss;
  FX.shatter(e.x, e.y, e.rc.color, e.rc.r, big || e.rc.r >= 17);
  G.combo = G.comboT > 0 ? G.combo + 1 : 1; G.comboT = 1.6; G.comboPop = 1;
  G.bestCombo = Math.max(G.bestCombo, G.combo);
  snd('kill', G.combo);
  if (!G.noBounty) {
    G.gold += e.rc.gold;
    spawnCoins(e.x, e.y, big ? 18 : Math.min(5, Math.ceil(e.rc.gold / 3)));
  }
  const m = MILESTONES[G.combo];
  if (m) {
    const bonus = G.noBounty ? 0 : Math.floor(G.combo / 2);
    G.gold += bonus;
    G.shout = { text: tr('m_' + G.combo), sub: bonus ? tr('combo_gold', G.combo, bonus) : tr('combo_only', G.combo), color: `hsl(${(190 + G.combo * 9) % 360},100%,65%)`, t: 0, dur: 1.3 };
    snd('combo', Object.keys(MILESTONES).indexOf(String(G.combo)));
    addShake(0.15);
  }
  addShake(big ? 0.9 : e.rc.r > 12 ? 0.15 : 0.04);
  if (e.rc.split) {
    for (let i = 0; i < e.rc.split.n; i++) {
      const m2 = spawnEnemy(e.rc.split.type, e.wave, e.lane, Math.max(0, e.dist - i * 9), 1);
      m2.x = e.x; m2.y = e.y;
    }
  }
  if (big) {
    G.slowT = 0.9; G.flashA = 0.6; G.flashCol = '#ffffff';
    snd('bossDie'); vibrate([60, 40, 120]);
    FX.shatter(e.x, e.y, '#ffffff', 16, false);
    G.shout = { text: tr('shattered'), sub: G.noBounty ? tr('warden_down') : tr('warden_down_gold', e.rc.gold), color: e.rc.color, t: 0, dur: 1.6 };
    Sound.setBoss(bossAlive());
  }
}

function flakBurst(m) {
  for (const e of G.enemies) {
    if (!e.alive || !e.rc.flying) continue;
    const d = Math.hypot(e.x - m.x, e.y - 5 - m.y);
    if (d <= m.splash + e.rc.r * 0.5) damage(e, e === m.tg ? m.dmg : m.dmg * 0.6, {});
  }
  FX.flash(m.x, m.y, m.splash * 1.8, m.color, 0.2);
  FX.ring(m.x, m.y, 3, m.splash, m.color, 0.3, 2.5);
  FX.spark(m.x, m.y, '#ffd0c8', 7, 180, 0.3);
  snd('flakHit');
}

function leak(e) {
  e.alive = false; waveStat(e.wave).alive--;
  const { x, y } = MAP.core;
  FX.shatter(x, y, '#ff3b4f', 10, false);
  if (G.demo) return;
  G.lives = Math.max(0, G.lives - e.rc.leak); G.leaks += e.rc.leak;
  G.leakTypes[e.type] = (G.leakTypes[e.type] || 0) + e.rc.leak;
  if (e.shieldMax > 0 || e.domeMax > 0 || domeOver(e)) G.shieldLeaks += e.rc.leak;
  G.coreHit = 1; G.livesBump = 1; G.flashA = 0.35; G.flashCol = '#ff2e4d';
  G.comboT = 0;
  addShake(0.45); snd('leak'); vibrate(80);
  FX.text(x, y - 30, `-${e.rc.leak}`, '#ff5a6a', 18, { font: FONT_D, life: 1 });
  if (G.lives <= 0) endGame(false);
}

function endGame(win) {
  if (G.over) return;
  G.over = true; G.result = win ? 'win' : 'lose'; G.endT = win ? 1.4 : 2.0; G.menu = null;
  G.stars = win ? starsForLives(G.lives, G.maxLives) : 0;
  Sound.musicOff();
  if (G.demo) return;
  const n = G.levelNum, wasMax = Save.d.max;
  const r = Save.complete(n, G.stars);
  G.firstClear = r.first; G.prevStars = r.prev;
  G.unlockedTower = r.first && Save.d.max > wasMax ? TOWER_ORDER.find(t => TOWERS[t].unlock === Save.d.max) || null : null;
  G.unlockedSlot = r.first && Save.d.max === SLOT_UNLOCK_LEVEL && wasMax < SLOT_UNLOCK_LEVEL;
  if (r.first) G.mapAnim = { level: Save.d.max, t: 0 };
  if (win) {
    snd('win');
    for (let i = 0; i < 6; i++) setTimeout(() => {
      const x = rand(40, W - 40), y = rand(60, ROWS * TILE - 80), c = ['#2ef2ff', '#ffe23d', '#ff7a2e', '#a3b8ff', '#ff3d9a', '#8cff3d'][i];
      FX.shatter(x, y, c, 14, false); FX.ring(x, y, 4, 80, c, 0.8, 3); Sound.play('boom', false);
    }, i * 220);
  } else {
    const { x, y } = MAP.core;
    FX.shatter(x, y, '#ff2e4d', 26, true); FX.shatter(x, y, '#bff8ff', 14, true);
    G.slowT = 1.2; G.flashA = 0.7; G.flashCol = '#ff2e4d'; addShake(1);
    snd('lose'); vibrate([100, 60, 200]);
  }
}

function spawnCoins(wx, wy, n) {
  for (let i = 0; i < n; i++) {
    if (G.coins.length > 70) break;
    G.coins.push({ x: MAP_X + wx, y: MAP_Y + wy, vx: rand(-90, 90), vy: rand(-190, -70), t: -i * 0.025 });
  }
}

// ------------------------------------------------------------- update
function update(dt) {
  G.time += dt;
  if (G.over) return;
  if (G.demo) {
    G.demoT -= dt;
    if (G.demoT <= 0 && G.enemies.length < 14) {
      const pool = ['grunt', 'grunt', 'scout', 'scout', 'brute', 'splitter', 'aegis', 'blink', 'mender', 'titan', 'volt', 'yeti'];
      spawnEnemy(pool[Math.floor(Math.random() * pool.length)], 3);
      G.demoT = rand(0.35, 0.9);
    }
  }
  // wave spawners
  for (let i = G.spawners.length - 1; i >= 0; i--) {
    const sp = G.spawners[i]; sp.t += dt;
    while (sp.i < sp.list.length && sp.list[sp.i].at <= sp.t) {
      const s = sp.list[sp.i];
      spawnEnemy(s.type, sp.wave, s.lane); sp.i++; waveStat(sp.wave).toSpawn--;
    }
    if (sp.i >= sp.list.length) {
      G.spawners.splice(i, 1);
      if (sp.wave === G.waveNum && G.waveNum < G.waves.length && !G.demo) G.nextTimer = ECON.nextDelay;
    }
  }
  if (G.nextTimer !== null) { G.nextTimer -= dt; if (G.nextTimer <= 0) startWave(false); }
  G.musT = (G.musT || 0) - dt;
  if (G.musT <= 0 && !G.demo) { G.musT = 0.25; Sound.setIntensity(musicIntensity()); }
  // enemies
  G.domes = G.enemies.filter(a => a.alive && a.domeMax > 0);
  for (const e of G.enemies) {
    if (!e.alive) continue;
    e.age += dt;
    if (e.elecOff > 0) e.elecOff -= dt;
    if (e.iceLock > 0) {                              // frozen solid: stays put, then thaws and its frost marks reset
      e.iceLock -= dt;
      if (e.iceLock <= 0) { e.marks = 0; FX.shards(e.x, e.y, '#e8fbff', 5, 90, 2.5); }
    }
    const held = e.iceLock > 0;
    if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) { e.slowAmt = 0; e.brittle = false; } }
    const sl = e.slowT > 0 ? 1 - e.slowAmt : 1;
    if (!held) e.dist += e.speed * sl * dt;
    // Blink: teleport ahead
    let warped = false;
    if (e.rc.blink && e.age > 0.8 && !held) {
      e.warpT -= dt;
      if (e.warpT <= 0) {
        e.warpT = e.rc.blink.every * rand(0.8, 1.2);
        const nd = Math.min(e.path.len - 30, e.dist + e.rc.blink.dist * TILE);
        if (nd > e.dist) {
          FX.flash(e.x, e.y, 26, e.rc.color, 0.25); FX.ring(e.x, e.y, 3, 18, e.rc.color, 0.3, 2);
          for (let i = 0; i < 5; i++) FX.dot(e.x + rand(-5, 5), e.y + rand(-5, 5), e.rc.color, 2, 0.4);
          e.dist = nd; warped = true; snd('blink');
        }
      }
    }
    if (e.dist >= e.path.len) { leak(e); continue; }
    const p = e.path.at(e.dist);
    const k = e.off && !warped ? Math.min(1, dt * 10) : 1;
    e.x = lerp(e.x, p.x, k); e.y = lerp(e.y, p.y, k);
    if (warped) { FX.flash(e.x, e.y, 30, e.rc.color, 0.25); FX.ring(e.x, e.y, 18, 3, '#ffffff', 0.25, 2); }
    let da = p.ang - e.dir; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
    e.dir += da * Math.min(1, dt * 12);
    e.rot += (e.rc.spin || 0) * dt; if (e.rc.inner) e.rot2 += e.rc.inner.spin * dt;
    e.flash -= dt; e.punch = Math.max(0, e.punch - dt * 2.5);
    e.blinkT -= dt; if (e.blinkT <= 0) { e.blink = 0.12; e.blinkT = rand(2, 5); } if (e.blink > 0) e.blink -= dt;
    if (e.rc.trail) { e.trailT -= dt; if (e.trailT <= 0) { e.trailT = QUALITY.fx < 1 ? 0.12 : 0.07; FX.dot(e.x, e.y, e.rc.color, 2.2, 0.25); } }
    if (e.slowT > 0 && Math.random() < dt * 6) FX.dot(e.x + rand(-8, 8), e.y + rand(-8, 8), '#dfe8ff', 1.6, 0.35, 0, -15);
    // shields regrow when left alone (never after an EMP has stripped them)
    if (e.shieldPing > 0) e.shieldPing -= dt;
    if (e.shieldMax && e.shield < e.shieldMax && G.time - e.lastHit > 2) e.shield = Math.min(e.shieldMax, e.shield + e.shieldMax * 0.35 * dt);
    if (e.domeMax) {
      if (e.domePing > 0) e.domePing -= dt;
      if (!e.domeDead && e.dome < e.domeMax && G.time - e.domeHit > 3) {
        const was = e.dome; e.dome = Math.min(e.domeMax, e.dome + e.domeMax * 0.3 * dt);
        if (was <= 0) FX.ring(e.x, e.y, 6, e.rc.dome.r * TILE, '#9fd6ff', 0.4, 2);
      }
    }
    // Mender: heal pulse
    if (e.rc.heal && !held) {
      e.healT -= dt;
      if (e.healT <= 0) {
        e.healT = e.rc.heal.every;
        const R2 = (e.rc.heal.radius * TILE) ** 2;
        let healed = 0;
        for (const o of G.enemies) {
          if (!o.alive || o.hp >= o.maxHp || (o.x - e.x) ** 2 + (o.y - e.y) ** 2 > R2) continue;
          o.hp = Math.min(o.maxHp, o.hp + o.maxHp * e.rc.heal.pct); healed++;
          FX.text(o.x, o.y - o.rc.r - 6, '+', e.rc.color, 14, { life: 0.5 });
        }
        FX.ring(e.x, e.y, 4, e.rc.heal.radius * TILE, e.rc.color, 0.55, 2.5);
        if (healed) snd('heal');
      }
    }
    // Iced: a snowball at every tower in range, once a second
    if (e.ice && !held && e.age > 0.5) {
      e.snowT -= dt;
      if (e.snowT <= 0) {
        e.snowT = ICE.every;
        const R2 = (ICE.r * TILE) ** 2; let n = 0;
        for (const tw of G.towers) if ((tw.x - e.x) ** 2 + (tw.y - e.y) ** 2 <= R2) { throwSnow(e, tw); n++; }
        if (n) snd('snow');
      }
    }
  }
  // Electrified enemies short out the towers right next to them (ARC gets supercharged instead).
  // The effect lasts ELEC.time seconds after the last contact and restarts on every new contact.
  let volts = null;
  for (const e of G.enemies) if (e.alive && e.age > 0.3 && isLiveElec(e)) (volts = volts || []).push(e);
  if (volts) {
    const R2 = (ELEC.r * TILE) ** 2;
    for (const tw of G.towers) {
      if (!volts.some(e => (e.x - tw.x) ** 2 + (e.y - tw.y) ** 2 <= R2)) continue;
      if (tw.zapT <= 0) towerZapped(tw);
      tw.zapT = ELEC.time;
    }
  }
  // towers
  computeBuffs();
  for (const tw of G.towers) {
    if (tw.zapT > 0) tw.zapT -= dt;
    if (tw.chillT > 0) tw.chillT -= dt;
    const off = tw.zapT > 0 && tw.type !== 'arc';                                   // shorted out
    const rm = off ? 0 : (tw.zapT > 0 ? ELEC.arcRate : 1) * (tw.chillT > 0 && tw.type !== 'frost' ? ICE.slow : 1);
    tw.cd -= dt * rm; tw.kick = Math.max(0, tw.kick - dt * 5); tw.spawn = Math.min(1, tw.spawn + dt * 4);
    const d = TOWERS[tw.type];
    if (d.eco) {
      if (G.awaiting || G.waveNum === 0 || G.demo) tw.cd += dt * rm;     // only pays while waves run
      else if (tw.cd <= 0 && tw.spawn >= 1 && !off) mintPulse(tw);
      continue;
    }
    if (d.support) continue;
    if (off) { tw.beamT = null; tw.heat = 0; continue; }
    if (tw.type === 'rail') {
      tw.aim = railAngle(tw.dir);
      if (tw.cd <= 0 && tw.spawn >= 1) { const v = railVictims(tw); if (v.length) fireRail(tw, v); }
      continue;
    }
    const range = towerRange(tw);
    tw.retT -= dt;
    const sticky = tw.type === 'prism' && tw.target && tw.target.alive && inRange(tw, tw.target, range);
    if (!sticky && (tw.retT <= 0 || !tw.target || !tw.target.alive)) { tw.target = findTarget(tw, range); tw.retT = 0.1; }
    const tg = tw.target;
    if (tg && tw.type !== 'frost' && tw.type !== 'arc') {
      const want = Math.atan2(tg.y - tw.y, tg.x - tw.x);
      let da = want - tw.aim; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      tw.aim += da * Math.min(1, dt * 14);
    }
    if (tw.type === 'prism') {
      const L = d.lv[tw.lv];
      if (tg && tg.alive && inRange(tw, tg, range) && tw.spawn >= 1) {
        if (tw.beamT !== tg) { tw.beamT = tg; tw.heat = 0; }
        tw.heat = Math.min(1, tw.heat + dt / 2.5);
        const dmg = L.dps * (1 + (L.heat - 1) * tw.heat) * (1 + tw.buff) * (tw.chillT > 0 ? ICE.slow : 1) * dt;
        tw.acc += dmg; tw.accT -= dt;
        if (tw.accT <= 0) { if (tw.acc >= 1) FX.text(tg.x + rand(-5, 5), tg.y - tg.rc.r - 5, `${Math.round(tw.acc)}`, '#ffb3f7', 10 + tw.heat * 4, { life: 0.5 }); tw.acc = 0; tw.accT = 0.3; }
        if (Math.random() < dt * 25) FX.spark(tg.x, tg.y, d.color, 1, 140, 0.2);
        snd('beam', tw.heat);
        damage(tg, dmg, { pierce: true, quiet: true, throughShield: true });
      } else { tw.beamT = null; tw.heat = Math.max(0, tw.heat - dt * 2); }
      continue;
    }
    if (tg && tw.cd <= 0 && tw.spawn >= 1) fire(tw, tg);
    if (tw.type === 'arc') { tw.idleT -= dt; if (tw.idleT <= 0) { tw.idleT = rand(0.4, 1.4); FX.zap([{ x: tw.x, y: tw.y + 1 }, { x: tw.x + rand(-13, 13), y: tw.y + rand(-13, 13) }], '#ffe23d', 0.08); } }
  }
  // snowballs: arc over to their tower
  for (let i = G.snow.length - 1; i >= 0; i--) {
    const b = G.snow[i]; b.t += dt;
    const f = Math.min(1, b.t / b.dur);
    b.x = lerp(b.sx, b.tw.x, f); b.y = lerp(b.sy, b.tw.y, f); b.h = Math.sin(Math.PI * f) * b.arc;
    if (f >= 1) { G.snow.splice(i, 1); if (G.towers.includes(b.tw)) snowHit(b.tw); }
  }
  // bolts
  for (let i = G.shots.length - 1; i >= 0; i--) {
    const s = G.shots[i];
    if (s.tg.alive) { s.lx = s.tg.x; s.ly = s.tg.y; }
    const dx = s.lx - s.x, dy = s.ly - s.y, dd = Math.hypot(dx, dy), step = s.sp * dt;
    if (dd <= step + (s.tg.alive ? s.tg.rc.r * 0.6 : 2)) {
      if (s.tg.alive) {
        damage(s.tg, s.dmg, { crit: s.crit });
        FX.spark(s.lx, s.ly, s.color, s.crit ? 7 : 3, s.crit ? 220 : 140, 0.22);
        if (s.crit) { FX.flash(s.lx, s.ly, 26, '#fff36a', 0.12); snd('crit'); } else snd('hit');
      }
      G.shots.splice(i, 1); continue;
    }
    s.vx = dx / dd * s.sp; s.vy = dy / dd * s.sp; s.x += s.vx * dt; s.y += s.vy * dt;
  }
  // nova shells
  for (let i = G.shells.length - 1; i >= 0; i--) {
    const s = G.shells[i]; s.t += dt;
    const f = Math.min(1, s.t / s.dur);
    s.x = lerp(s.sx, s.tx, f); s.y = lerp(s.sy, s.ty, f); s.h = Math.sin(Math.PI * f) * 46;
    if (Math.random() < 0.7) FX.dot(s.x, s.y - s.h, '#ff9a5c', 2.4, 0.3);
    if (f >= 1) {
      G.shells.splice(i, 1);
      for (const e of G.enemies) {
        if (!e.alive || e.rc.flying) continue;
        const d = Math.hypot(e.x - s.tx, e.y - s.ty);
        if (d <= s.splash + e.rc.r * 0.5) damage(e, s.dmg * (1 - 0.4 * Math.min(1, d / s.splash)), { pierce: true, big: true });
      }
      FX.flash(s.tx, s.ty, s.splash * 2.2, s.color, 0.3);
      FX.ring(s.tx, s.ty, 4, s.splash, s.color, 0.4, 4);
      FX.ring(s.tx, s.ty, 2, s.splash * 0.55, '#ffffff', 0.25, 2);
      FX.spark(s.tx, s.ty, '#ffc08a', 12, 240, 0.4);
      FX.shards(s.tx, s.ty, s.color, 6, 160, 3);
      addShake(0.16); snd('boom', false);
    }
  }
  // FLAK missiles: home in on flyers, burst with a small anti-air splash
  for (let i = G.missiles.length - 1; i >= 0; i--) {
    const m = G.missiles[i]; m.t += dt;
    if (!m.tg || !m.tg.alive) {
      m.tg = null; let bd = 130 * 130;
      for (const e of G.enemies) if (e.alive && e.rc.flying) { const dd = (e.x - m.x) ** 2 + (e.y - m.y) ** 2; if (dd < bd) { bd = dd; m.tg = e; } }
    }
    const sp = Math.min(430, 150 + m.t * 700);
    if (m.tg) {
      const dx = m.tg.x - m.x, dy = m.tg.y - 5 - m.y, dd = Math.hypot(dx, dy);
      if (dd < m.tg.rc.r + 6) { flakBurst(m); G.missiles.splice(i, 1); continue; }
      let cur = Math.atan2(m.vy, m.vx), da = Math.atan2(dy, dx) - cur;
      while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      cur += clamp(da, -10 * dt, 10 * dt);
      m.vx = Math.cos(cur) * sp; m.vy = Math.sin(cur) * sp;
    }
    m.x += m.vx * dt; m.y += m.vy * dt;
    if (Math.random() < 0.85) FX.dot(m.x, m.y, '#ffb3aa', 1.8, 0.3);
    if (m.t > 2.2) { FX.spark(m.x, m.y, m.color, 4, 120, 0.25); G.missiles.splice(i, 1); }
  }
  if (G.enemies.some(e => !e.alive)) G.enemies = G.enemies.filter(e => e.alive);
  if (!G.demo) {
    for (let w = 1; w <= G.waveNum; w++) {
      const ws = G.waveStats[w];
      if (ws && !ws.cleared && ws.toSpawn <= 0 && ws.alive <= 0) {
        ws.cleared = true;
        if (G.waveNum === G.waves.length && Object.values(G.waveStats).every(s => s.cleared)) { endGame(true); break; }
        const b = G.noBounty ? 0 : ECON.clearBonus(w);
        G.gold += b; G.goldBump = 1;
        G.toast = { text: b ? tr('wave_clear_gold', w, b) : tr('wave_clear', w), color: '#7dffb0', t: 0, dur: 1.6 };
        snd('clear');
      }
    }
  }
  if (G.comboT > 0) G.comboT -= dt;
}

// visual-only timers that should run even when the sim is paused/over
function updateVisuals(dt, rdt) {
  FX.update(dt);
  G.shake = Math.max(0, G.shake - rdt * 1.8);
  G.flashA = Math.max(0, G.flashA - rdt * 1.6);
  G.coreHit = Math.max(0, G.coreHit - rdt * 3);
  G.portalPulse = Math.max(0, G.portalPulse - rdt * 4);
  G.goldBump = Math.max(0, G.goldBump - rdt * 5);
  G.livesBump = Math.max(0, G.livesBump - rdt * 3);
  G.comboPop = Math.max(0, G.comboPop - rdt * 5);
  G.dispGold += (G.gold - G.dispGold) * Math.min(1, rdt * 12);
  if (Math.abs(G.gold - G.dispGold) < 0.5) G.dispGold = G.gold;
  for (const k of ['banner', 'toast', 'shout']) { const b = G[k]; if (b) { b.t += rdt; if (b.t >= b.dur) G[k] = null; } }
  const tx = MAP_X + 20, ty = HUD_H / 2;
  for (let i = G.coins.length - 1; i >= 0; i--) {
    const c = G.coins[i]; c.t += rdt;
    if (c.t < 0) continue;
    if (c.t < 0.3) { c.vy += 620 * rdt; c.x += c.vx * rdt; c.y += c.vy * rdt; }
    else {
      const k = Math.min(1, rdt * (5 + (c.t - 0.3) * 30));
      c.x += (tx - c.x) * k; c.y += (ty - c.y) * k;
      if (Math.hypot(tx - c.x, ty - c.y) < 7 || c.t > 1.6) {
        G.coins.splice(i, 1);
        G.goldBump = 1; snd('coin');
      }
    }
  }
}
