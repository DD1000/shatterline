// =====================================================================
//  IN-LEVEL UI: HUD, control bar, radial menus, pause, results (canvas)
// =====================================================================
const hits = [];
function hit(x, y, w, h, cb) { hits.push({ x, y, w, h, cb }); }
function handleTap(x, y) {
  for (let i = hits.length - 1; i >= 0; i--) {
    const h = hits[i];
    if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) { h.cb(x, y); return; }
  }
}
G.clock = 0;
const MODES = ['first', 'strong', 'close'];
const MODE_LABEL = new Proxy({}, { get: (_, k) => tr('mode_' + k) });

function pillButton(cx, cy, w, h, label, color, cb, o = {}) {
  const pulse = o.pulse ? Math.sin(G.clock * 5) * 0.5 + 0.5 : 0;
  const dis = !!o.disabled;
  if (!dis) { additive(true); glow(cx, cy, w * 0.75, color, 0.18 + pulse * 0.25); additive(false); }
  roundRect(cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = dis ? 'rgba(16,14,34,0.9)' : hexA(color, 0.13 + pulse * 0.12); ctx.fill();
  ctx.fillStyle = 'rgba(6,5,16,0.55)'; if (!dis) ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = dis ? '#35315a' : color; ctx.stroke();
  if (o.progress != null) {
    ctx.save(); roundRect(cx - w / 2, cy - h / 2, w, h, h / 2); ctx.clip();
    ctx.fillStyle = hexA(color, 0.22); ctx.fillRect(cx - w / 2, cy - h / 2, w * o.progress, h); ctx.restore();
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  setFont(o.size || 16, FONT_D, 400);
  ctx.fillStyle = dis ? '#6d6894' : '#ffffff';
  ctx.fillText(label, cx, cy + (o.sub ? -6 : 1));
  if (o.sub) { setFont(10, FONT_UI); spacing(1); ctx.fillStyle = dis ? '#6d6894' : color; ctx.fillText(o.sub, cx, cy + 11); spacing(0); }
  if (!dis && cb) hit(cx - w / 2, cy - h / 2, w, h, cb);
}

function circleButton(cx, cy, r, icon, cb, active) {
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
  ctx.fillStyle = active ? 'rgba(46,242,255,0.16)' : 'rgba(14,12,32,0.9)'; ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = active ? '#2ef2ff' : hexA(theme().edge, 0.9); ctx.stroke();
  ctx.fillStyle = '#e8e6ff'; ctx.strokeStyle = '#e8e6ff';
  if (icon === 'pause') { ctx.fillRect(cx - 6, cy - 7, 4, 14); ctx.fillRect(cx + 2, cy - 7, 4, 14); }
  else if (icon === 'sound' || icon === 'muted') {
    ctx.beginPath(); ctx.moveTo(cx - 9, cy - 4); ctx.lineTo(cx - 5, cy - 4); ctx.lineTo(cx, cy - 9); ctx.lineTo(cx, cy + 9); ctx.lineTo(cx - 5, cy + 4); ctx.lineTo(cx - 9, cy + 4); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    if (icon === 'sound') { ctx.beginPath(); ctx.arc(cx + 1, cy, 5, -0.9, 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(cx + 1, cy, 9, -0.9, 0.9); ctx.stroke(); }
    else { ctx.strokeStyle = '#ff5a6a'; ctx.beginPath(); ctx.moveTo(cx + 4, cy - 4); ctx.lineTo(cx + 10, cy + 4); ctx.moveTo(cx + 10, cy - 4); ctx.lineTo(cx + 4, cy + 4); ctx.stroke(); }
    ctx.lineCap = 'butt';
  } else if (icon === 'close') {
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 6); ctx.lineTo(cx + 6, cy + 6); ctx.moveTo(cx + 6, cy - 6); ctx.lineTo(cx - 6, cy + 6); ctx.stroke(); ctx.lineCap = 'butt';
  } else {
    setFont(15, FONT_UI); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = active ? '#2ef2ff' : '#e8e6ff'; ctx.fillText(icon, cx, cy + 1);
  }
  hit(cx - r - 4, cy - r - 4, r * 2 + 8, r * 2 + 8, cb);
}

function drawStar(x, y, r, filled, color = '#ffd23d') {
  starPath(x, y, r, r * 0.45, 5, 0);
  ctx.fillStyle = filled ? hexA(color, 0.95) : 'rgba(20,18,40,0.9)'; ctx.fill();
  neon(filled ? color : '#4a4570', Math.max(1.2, r * 0.1));
}

// ----------------------------------------------------------------- HUD
function drawHud() {
  ctx.fillStyle = 'rgba(5,4,14,0.8)'; ctx.fillRect(0, 0, LW, HUD_H);
  ctx.fillStyle = hexA(theme().edge, 0.55); ctx.fillRect(0, HUD_H - 1, LW, 1);
  const conds = G.level ? ['noBounty', 'air', 'shielded'].filter(k => G.level[k]) : [];
  drawGoldCounter(MAP_X + 20, HUD_H / 2 - (conds.length ? 4 : 0));
  if (conds.length) {
    setFont(8, FONT_UI); spacing(1.5); ctx.textAlign = 'left';
    let tx = MAP_X + 12;
    for (const ck of conds) {
      ctx.fillStyle = CONDITIONS[ck].color; const t = condTag(ck);
      ctx.fillText(t, tx, HUD_H - 8); tx += ctx.measureText(t).width + 8;
    }
    spacing(0);
  }
  const lx = MAP_X + W / 2 - 16, ly = HUD_H / 2, b = G.livesBump;
  const f = G.lives / G.maxLives, lc = f > 0.5 ? '#bff8ff' : f > 0.25 ? '#ffd27a' : '#ff4a5a';
  additive(true); glow(lx, ly, 18 + b * 10, b > 0 ? '#ff2e4d' : lc, 0.5); additive(false);
  polyPath(lx, ly, 8 + b * 3, 4, 0); ctx.fillStyle = '#0a0817'; ctx.fill(); neon(b > 0.3 ? '#ff5a6a' : lc, 1.8);
  setFont(19 + b * 4, FONT_UI); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = b > 0.3 ? '#ff7a86' : '#ffffff'; ctx.fillText(String(G.lives), lx + 14, ly + 1);
  ctx.textAlign = 'right';
  setFont(9, FONT_UI); spacing(2); ctx.fillStyle = 'rgba(230,230,255,0.65)'; ctx.fillText(tr('level_n', G.levelNum), MAP_X + W - 14, 15); spacing(0);
  setFont(18, FONT_UI); ctx.fillStyle = '#ffffff';
  ctx.fillText(`${Math.max(1, G.waveNum)}/${G.waves.length}`, MAP_X + W - 14, 33);
}

// --------------------------------------------------------- control bar
function drawBar() {
  const y0 = LH - BAR_H, cy = y0 + BAR_H / 2 - 3;
  ctx.fillStyle = 'rgba(5,4,14,0.84)'; ctx.fillRect(0, y0, LW, BAR_H);
  ctx.fillStyle = hexA(theme().edge, 0.55); ctx.fillRect(0, y0, LW, 1);
  circleButton(MAP_X + 28, cy, 19, 'pause', () => { if (!G.over) { G.paused = true; G.menu = null; G.confirm = null; Sound.play('tap'); } });
  circleButton(MAP_X + 76, cy, 19, G.speed === 2 ? '2×' : '1×', () => { G.speed = G.speed === 1 ? 2 : 1; Sound.play('tap'); }, G.speed === 2);
  circleButton(MAP_X + W - 28, cy, 19, Sound.muted ? 'muted' : 'sound', () => { Sound.setMuted(!Sound.muted); Sound.play('tap'); saveMute(); });
  const bx = MAP_X + 200, bw = 152, bh = 50;
  if (G.over) return;
  if (G.awaiting) {
    pillButton(bx, cy, bw, bh, tr('start'), '#7dffb0', () => startWave(false), { pulse: true, size: 18, sub: tr('send_wave', G.waveNum + 1) });
  } else if (G.nextTimer !== null) {
    const bonus = Math.ceil(G.nextTimer * ECON.earlyBonus);
    pillButton(bx, cy, bw, bh, tr('next_wave'), theme().flow, () => startWave(true), { size: 15, sub: tr('next_sub', bonus, Math.ceil(G.nextTimer)), progress: 1 - G.nextTimer / ECON.nextDelay });
  } else if (G.waveNum >= G.waves.length) {
    pillButton(bx, cy, bw, bh, tr('final_wave'), '#ff2e4d', null, { disabled: true, size: 14 });
  } else {
    pillButton(bx, cy, bw, bh, tr('wave', G.waveNum), '#ffffff', null, { disabled: true, size: 15, sub: tr('incoming') });
  }
}

function drawBossBar() {
  const bosses = G.enemies.filter(e => e.alive && e.rc.boss);
  if (!bosses.length) return false;
  const hp = bosses.reduce((s, e) => s + Math.max(0, e.hp), 0), max = bosses.reduce((s, e) => s + e.maxHp, 0);
  const w = 220, x = MAP_X + W / 2 - w / 2, y = HUD_H + 14;
  setFont(9, FONT_UI); spacing(2); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ff7a8a';
  ctx.fillText(bosses.length > 1 ? tr('warden_x', bosses.length) : tr('warden'), x, y - 7); spacing(0);
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(x - 1, y - 1, w + 2, 7);
  ctx.fillStyle = '#ff2e4d'; ctx.fillRect(x, y, w * hp / max, 5);
  additive(true); glow(x + w * hp / max, y + 2, 12, '#ff2e4d', 0.8); additive(false);
  return true;
}

// ------------------------------------------------------- radial menus
function menuAnchor(m) { return m.kind === 'tower' ? { c: m.tw.c, r: m.tw.r } : { c: m.c, r: m.r }; }
// Thumb-aware radial menu: options fan out in an arc ABOVE the finger (a thumb always
// reaches up from below), and the arc leans away from the thumb doing the pressing.
// hand: -1 = left thumb (lean right), +1 = right thumb (lean left), 0 = mouse (centered).
const THUMB = { setting: 'auto', last: 1 };
try { const t = localStorage.getItem('shatterline.thumb'); if (t === 'left' || t === 'right' || t === 'auto') THUMB.setting = t; } catch (e) {}
function thumbFor(x, pointerType) {
  if (THUMB.setting === 'left') return -1;
  if (THUMB.setting === 'right') return 1;
  if (pointerType === 'mouse' || pointerType === 'pen') return 0;
  const rel = (x - MAP_X) / W;               // left side of the screen: usually the left thumb
  if (rel < 0.42) THUMB.last = -1; else if (rel > 0.58) THUMB.last = 1;
  return THUMB.last;
}
function menuLayout(m, full) {
  const { c, r } = menuAnchor(m);
  const cx = MAP_X + c * TILE + TILE / 2, cy = MAP_Y + r * TILE + TILE / 2;
  let ids;
  if (m.kind === 'build') ids = G.loadout.slice();
  else {
    const d = TOWERS[m.tw.type];
    ids = d.eco || d.support || d.pulse ? ['sell', 'up'] : d.line ? ['sell', 'up', 'turn'] : ['sell', 'up', 'mode'];
    if (m.hand < 0) ids.reverse();             // keep Sell on the outside, away from the thumb's reach
  }
  if (m.hand < 0) ids.unshift('close'); else ids.push('close');     // the X sits on the thumb's side
  const n = ids.length, gap = 52, R = 22, half = (n - 1) / 2;
  const lift = Math.min(64, Math.max(44, cy - 28));        // how far above the finger the arc sits
  const lean = -(m.hand || 0) * 26;
  let opts = ids.map((id, i) => {
    const k = half ? (i - half) / half : 0;
    return { id, dx: lean + (i - half) * gap, dy: -lift + k * k * 12, dis: id === 'up' && upgradeCost(m.tw) == null };
  });
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const o of opts) { minX = Math.min(minX, cx + o.dx - R); maxX = Math.max(maxX, cx + o.dx + R); minY = Math.min(minY, cy + o.dy - R); maxY = Math.max(maxY, cy + o.dy + R + 14); }
  let sx = 0;
  if (minX < MAP_X + 2) sx = MAP_X + 2 - minX; if (maxX > MAP_X + W - 2) sx = MAP_X + W - 2 - maxX;
  const e = full ? 1 : easeOutBack(m.t);
  return { cx, cy, opts: opts.map(o => ({ ...o, x: cx + (o.dx + sx) * e, y: cy + o.dy * e })), top: minY, bottom: maxY, left: minX + sx, right: maxX + sx };
}

// Radial menu: press a tile to open it. Slide onto an option and let go to use it, or just
// let go and the menu stays open so you can tap an option. The X option closes it.
function tapMap(x, y) {
  if (G.state !== 'play' || G.over) return;
  const c = Math.floor((x - MAP_X) / TILE), r = Math.floor((y - MAP_Y) / TILE);
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
  const tw = G.grid[r * COLS + c], m = G.menu;
  if (m) {                                          // same tile again: keep the menu, slide from here
    const a = menuAnchor(m);
    if (a.c === c && a.r === r) { m.sel = null; G.press = { kind: 'tile', x, y, moved: false, t0: performance.now() }; return; }
  }
  const hand = thumbFor(x, G.pointerType);
  if (tw) G.menu = { kind: 'tower', tw, sel: null, t: 0, shake: 0, hand };
  else if (isBuildable(c, r)) G.menu = { kind: 'build', c, r, sel: null, t: 0, shake: 0, hand };
  else return;                                      // path tiles don't open (or close) anything
  G.press = { kind: 'tile', x, y, moved: false, t0: performance.now() };
  Sound.play('tap');
}

function menuOptionAt(x, y) {
  const m = G.menu; if (!m) return null;
  let best = null, bd = 31 * 31;
  for (const o of menuLayout(m, true).opts) {
    if (o.dis) continue;
    const d = (o.x - x) ** 2 + (o.y - y) ** 2;
    if (d < bd) { bd = d; best = o.id; }
  }
  return best;
}
function pressOption(m, id) { m.sel = id; G.press = { kind: 'option', x: 0, y: 0, moved: true }; Sound.play('tap'); }
function pressMove(x, y) {
  const p = G.press, m = G.menu; if (!p || !m) return;
  if (Math.hypot(x - p.x, y - p.y) > 10) p.moved = true;
  const id = menuOptionAt(x, y);
  if (id !== m.sel && (id || p.moved)) { m.sel = id; if (id) Sound.play('tap'); }
}
function pressEnd(x, y) {
  const p = G.press, m = G.menu; G.press = null;
  if (!m) return;
  const id = menuOptionAt(x, y);
  m.sel = null;                                    // letting go on nothing: the menu stays open
  if (!id) return;
  if (id === 'close') { G.menu = null; Sound.play('swoosh'); return; }
  if (commitOption(m, id) && G.menu === m) G.menu = null;   // done: close. Failed or a toggle: stay open
}
function menuTileCenter(m) { const a = menuAnchor(m); return { x: a.c * TILE + TILE / 2, y: a.r * TILE + TILE / 2 }; }
function commitOption(m, id) {
  const at = menuTileCenter(m);
  // returns true when the action happened (the menu then closes); false keeps it open
  const needGold = n => { Sound.play('deny'); m.sel = id; m.shake = 1; FX.text(at.x, at.y - 26, tr('need_gold', n), '#ff8a96', 11, { life: 1.1, vy: -20 }); return false; };
  if (m.kind === 'build') {
    const d = TOWERS[id];
    if (G.gold >= d.cost) { buildTower(id, m.c, m.r); return true; }
    return needGold(d.cost - G.gold);
  }
  const tw = m.tw;
  if (id === 'turn') {                              // toggles keep the menu open so you can keep turning
    tw.dir = (tw.dir + 1) % 4; tw.aim = railAngle(tw.dir); tw.kick = 1;
    FX.text(tw.x, tw.y - 26, tr('aim', ARROWS[tw.dir]), TOWERS[tw.type].color, 12, { life: 0.8 });
    Sound.play('tap'); return false;
  }
  if (id === 'mode') {
    tw.mode = MODES[(MODES.indexOf(tw.mode) + 1) % MODES.length]; tw.target = null;
    FX.text(tw.x, tw.y - 26, tr('target_x', MODE_LABEL[tw.mode]), TOWERS[tw.type].color, 11, { life: 0.8 });
    Sound.play('tap'); return false;
  }
  if (id === 'up') {
    const cost = upgradeCost(tw);
    if (cost == null) { Sound.play('deny'); return false; }
    if (G.gold >= cost) { upgradeTower(tw); return true; }
    return needGold(cost - G.gold);
  }
  if (id === 'sell') { sellTower(tw); return true; }
  return false;
}

// Tile-based range preview: every square the tower can reach lights up.
// Lanes (where enemies walk) light up brighter. `skip` hides tiles inside a smaller range.
function gridRange(c0, r0, range, color, o = {}) {
  const inR = (c, r, rg) => c >= 0 && r >= 0 && c < COLS && r < ROWS && (c - c0) ** 2 + (r - r0) ** 2 <= rg * rg + 1e-6;
  const pulse = 0.8 + Math.sin(G.clock * 4) * 0.2;
  const lo = Math.ceil(range);
  for (let r = r0 - lo; r <= r0 + lo; r++) for (let c = c0 - lo; c <= c0 + lo; c++) {
    if (!inR(c, r, range) || (c === c0 && r === r0)) continue;
    if (o.skip != null && inR(c, r, o.skip)) continue;
    const lane = MAP.tiles.has(r * COLS + c);
    ctx.fillStyle = hexA(color, (lane ? 0.34 : 0.11) * pulse);
    roundRect(c * TILE + 2, r * TILE + 2, TILE - 4, TILE - 4, 5); ctx.fill();
    if (lane) { ctx.lineWidth = 1; ctx.strokeStyle = hexA(color, 0.55 * pulse); ctx.stroke(); }
  }
  ctx.beginPath();
  for (let r = r0 - lo; r <= r0 + lo; r++) for (let c = c0 - lo; c <= c0 + lo; c++) {
    if (!inR(c, r, range)) continue;
    const x = c * TILE, y = r * TILE;
    if (!inR(c, r - 1, range)) { ctx.moveTo(x, y); ctx.lineTo(x + TILE, y); }
    if (!inR(c, r + 1, range)) { ctx.moveTo(x, y + TILE); ctx.lineTo(x + TILE, y + TILE); }
    if (!inR(c - 1, r, range)) { ctx.moveTo(x, y); ctx.lineTo(x, y + TILE); }
    if (!inR(c + 1, r, range)) { ctx.moveTo(x + TILE, y); ctx.lineTo(x + TILE, y + TILE); }
  }
  ctx.setLineDash(o.dashed ? [5, 4] : []);
  ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = hexA(color, 0.95); ctx.stroke();
  ctx.setLineDash([]); ctx.lineCap = 'butt';
}

function rangeCircle(x, y, r, color, dashed) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  if (!dashed) { ctx.fillStyle = hexA(color, 0.06); ctx.fill(); }
  ctx.setLineDash(dashed ? [6, 5] : []); ctx.lineWidth = 2; ctx.strokeStyle = hexA(color, 0.9); ctx.stroke(); ctx.setLineDash([]);
}
const ARROWS = ['↑', '→', '↓', '←'];
// Rail range: the squares along its fixed firing line
function lineRange(c, r, dir, range, color, dashed) {
  const pulse = 0.8 + Math.sin(G.clock * 4) * 0.2, [dx, dy] = RAIL_DIRS[dir];
  for (const [cc, rr] of railTiles(c, r, dir, range)) {
    const lane = MAP.tiles.has(rr * COLS + cc);
    ctx.fillStyle = hexA(color, (dashed ? 0.12 : lane ? 0.36 : 0.13) * pulse);
    roundRect(cc * TILE + 2, rr * TILE + 2, TILE - 4, TILE - 4, 5); ctx.fill();
    ctx.setLineDash(dashed ? [4, 4] : []); ctx.lineWidth = lane ? 1.6 : 1; ctx.strokeStyle = hexA(color, lane ? 0.8 : 0.45); ctx.stroke(); ctx.setLineDash([]);
  }
  const x = c * TILE + TILE / 2, y = r * TILE + TILE / 2;
  ctx.beginPath(); ctx.moveTo(x + dx * 16, y + dy * 16); ctx.lineTo(x + dx * range * TILE, y + dy * range * TILE);
  ctx.setLineDash(dashed ? [6, 5] : []); ctx.lineWidth = 2; ctx.strokeStyle = hexA(color, 0.9); ctx.stroke(); ctx.setLineDash([]);
}
drawMenuUnder = function () {
  const m = G.menu;
  if (!m || G.state !== 'play') return;
  if (m.kind === 'build') {
    const x = m.c * TILE + TILE / 2, y = m.r * TILE + TILE / 2, sel = m.sel === 'close' ? null : m.sel;
    if (sel && TOWERS[sel].line) lineRange(m.c, m.r, bestRailDir(m.c, m.r, TOWERS[m.sel].lv[0].range), TOWERS[m.sel].lv[0].range, TOWERS[m.sel].color);
    else if (sel && TOWERS[sel].lv[0].range) {
      gridRange(m.c, m.r, TOWERS[sel].lv[0].range, TOWERS[sel].color);
      rangeCircle(x, y, TOWERS[sel].lv[0].range * TILE, TOWERS[sel].color);
    }
    roundRect(m.c * TILE + 2, m.r * TILE + 2, TILE - 4, TILE - 4, 7);
    ctx.lineWidth = 1.5; ctx.strokeStyle = hexA('#ffffff', 0.5 + Math.sin(G.clock * 8) * 0.3); ctx.stroke();
    if (sel) drawTowerGlyph(sel, x, y, { lv: 0, t: G.clock, alpha: 0.45, ghost: true });
  } else {
    const tw = m.tw, d = TOWERS[tw.type], cur = d.lv[tw.lv].range, nxt = d.lv[tw.lv + 1] && d.lv[tw.lv + 1].range;
    if (!cur) return;
    if (d.line) {
      if (m.sel === 'turn') lineRange(tw.c, tw.r, (tw.dir + 1) % 4, cur, '#ffffff', true);
      if (m.sel === 'up' && nxt) lineRange(tw.c, tw.r, tw.dir, nxt, '#ffffff', true);
      lineRange(tw.c, tw.r, tw.dir, cur, d.color);
      return;
    }
    if (m.sel === 'up' && nxt && nxt > cur) gridRange(tw.c, tw.r, nxt, '#ffffff', { skip: cur, dashed: true });
    gridRange(tw.c, tw.r, cur, d.color);
    rangeCircle(tw.x, tw.y, cur * TILE, d.color);
    if (m.sel === 'up' && nxt && nxt > cur) rangeCircle(tw.x, tw.y, nxt * TILE, '#ffffff', true);
  }
};

function statLine(a, b) {
  const s = [];
  const f = (k, lab, fmt = v => v) => { if (a[k] != null && b[k] != null && a[k] !== b[k]) s.push(`${lab} ${fmt(a[k])}→${fmt(b[k])}`); };
  f('dmg', tr('s_dmg')); f('dps', tr('s_dps')); f('gold', tr('s_gold')); f('every', tr('s_every'), v => v + tr('sec')); f('shield', tr('s_shield')); f('buff', tr('s_boost'), v => '+' + Math.round(v * 100) + '%');
  f('chains', tr('s_chain')); f('slow', tr('s_slow'), v => Math.round(v * 100) + '%'); f('splash', tr('s_blast'));
  if (s.length < 2) f('range', tr('s_range'));
  if (b.brittle && !a.brittle) s.push(tr('s_brittle'));
  return s.slice(0, 3).join('  ·  ');
}

function drawTooltip(L, m) {
  let title, color, line2, line3, bad = false;
  if (m.kind === 'build') {
    const d = TOWERS[m.sel]; color = d.color; title = `${tName(m.sel)}  ·  ${d.cost}`; line2 = tDesc(m.sel);
    bad = G.gold < d.cost; line3 = bad ? tr('need_gold', d.cost - G.gold) : tr('letgo_build');
  } else {
    const tw = m.tw, d = TOWERS[tw.type]; color = d.color;
    if (m.sel === 'up') {
      const cost = upgradeCost(tw);
      title = tr('up_title', tw.lv + 2, cost); line2 = statLine(d.lv[tw.lv], d.lv[tw.lv + 1]);
      bad = G.gold < cost; line3 = bad ? tr('need_gold', cost - G.gold) : tr('letgo_upgrade');
    } else if (m.sel === 'turn') {
      title = tr('turn_to', ARROWS[(tw.dir + 1) % 4]);
      line2 = tr('rail_turn');
      line3 = tr('letgo_turn');
    } else if (m.sel === 'mode') {
      const nx = MODES[(MODES.indexOf(tw.mode) + 1) % MODES.length];
      title = tr('target_title', MODE_LABEL[tw.mode], MODE_LABEL[nx]);
      line2 = tr('mdesc_' + nx);
      line3 = tr('letgo_switch');
    } else { title = tr('sell_x', tName(tw.type)); line2 = tr('refund', sellValue(tw)); line3 = tr('letgo_sell'); color = '#ffd23d'; }
  }
  const w = 250, h = 58;
  const x = clamp(L.cx - w / 2, MAP_X + 4, MAP_X + W - w - 4);
  let y = L.top - h - 8;
  if (y < 4) y = LH - BAR_H - h - 8;
  roundRect(x, y, w, h, 10); ctx.fillStyle = 'rgba(6,5,16,0.94)'; ctx.fill();
  ctx.lineWidth = 1.4; ctx.strokeStyle = hexA(color, 0.8); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  setFont(14, FONT_D, 400); ctx.fillStyle = color; ctx.fillText(title, x + w / 2, y + 15);
  setFont(11, FONT_UI, 500); ctx.fillStyle = '#d9d6f5'; ctx.fillText(line2, x + w / 2, y + 32);
  setFont(10, FONT_UI); spacing(1.5); ctx.fillStyle = bad ? '#ff6a78' : hexA('#ffffff', 0.55 + Math.sin(G.clock * 6) * 0.3);
  ctx.fillText(line3, x + w / 2, y + 47); spacing(0);
}

function drawMenu() {
  const m = G.menu;
  if (!m || G.state !== 'play' || G.over || G.paused) return;
  if (m.kind === 'tower' && !G.towers.includes(m.tw)) { G.menu = null; return; }
  m.shake = Math.max(0, (m.shake || 0) - 0.08);
  const L = menuLayout(m);
  for (const o of L.opts) {
    const sel = m.sel === o.id;
    let color = '#ffffff', cost = null, label = null, afford = true, dis = false;
    if (o.id === 'close') {                       // the X: closes the menu
      const x = o.x, y = o.y, r = sel ? 20 : 17;
      if (sel) { additive(true); glow(x, y, 38, '#ff6a78', 0.5); additive(false); }
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = 'rgba(8,6,22,0.94)'; ctx.fill();
      ctx.lineWidth = sel ? 2.4 : 1.6; ctx.strokeStyle = sel ? '#ff6a78' : 'rgba(255,255,255,0.55)'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6); ctx.moveTo(x + 6, y - 6); ctx.lineTo(x - 6, y + 6);
      ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.strokeStyle = sel ? '#ff6a78' : '#ffffff'; ctx.stroke(); ctx.lineCap = 'butt';
      hit(x - 24, y - 24, 48, 48, () => pressOption(m, o.id));
      continue;
    }
    if (m.kind === 'build') { const d = TOWERS[o.id]; color = d.color; cost = d.cost; afford = G.gold >= cost; }
    else if (o.id === 'up') { cost = upgradeCost(m.tw); color = '#7dffb0'; if (cost == null) { dis = true; label = tr('max'); } else afford = G.gold >= cost; }
    else if (o.id === 'sell') { color = '#ffd23d'; label = `+${sellValue(m.tw)}`; }
    else if (o.id === 'turn') { color = TOWERS[m.tw.type].color; label = tr('aim', ARROWS[m.tw.dir]); }
    else { color = TOWERS[m.tw.type].color; label = MODE_LABEL[m.tw.mode]; }
    const shx = sel && m.shake > 0 ? Math.sin(m.shake * 40) * 4 * m.shake : 0;
    const x = o.x + shx, y = o.y, r = sel ? 24 : 21;
    if (sel) { additive(true); glow(x, y, 46, color, 0.55); additive(false); }
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = 'rgba(8,6,22,0.94)'; ctx.fill();
    ctx.lineWidth = sel ? 2.6 : 1.8; ctx.strokeStyle = dis ? '#4a4570' : afford ? color : hexA(color, 0.35); ctx.stroke();
    ctx.globalAlpha = afford && !dis ? 1 : 0.6;
    if (m.kind === 'build') drawTowerGlyph(o.id, x, y, { lv: 0, t: G.clock, scale: 0.62, ghost: true });
    else if (o.id === 'up') {
      ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 8, y + 1); ctx.lineTo(x + 3, y + 1); ctx.lineTo(x + 3, y + 8); ctx.lineTo(x - 3, y + 8); ctx.lineTo(x - 3, y + 1); ctx.lineTo(x - 8, y + 1); ctx.closePath();
      ctx.fillStyle = hexA(color, 0.3); ctx.fill(); neon(color, 1.6);
    } else if (o.id === 'sell') drawCoin(x, y - 1, 8);
    else if (o.id === 'turn') {
      ctx.beginPath(); ctx.arc(x, y, 8, -Math.PI * 0.9, Math.PI * 0.55);
      ctx.lineWidth = 2; ctx.strokeStyle = color; ctx.stroke();
      const ex = x + Math.cos(Math.PI * 0.55) * 8, ey = y + Math.sin(Math.PI * 0.55) * 8;
      ctx.beginPath(); ctx.moveTo(ex - 5, ey - 1); ctx.lineTo(ex, ey + 1); ctx.lineTo(ex - 1, ey - 5); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.moveTo(x + 3, y); ctx.arc(x, y, 3, 0, TAU);
      ctx.moveTo(x - 12, y); ctx.lineTo(x - 5, y); ctx.moveTo(x + 5, y); ctx.lineTo(x + 12, y); ctx.moveTo(x, y - 12); ctx.lineTo(x, y - 5); ctx.moveTo(x, y + 5); ctx.lineTo(x, y + 12);
      ctx.lineWidth = 1.6; ctx.strokeStyle = color; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (cost != null) costPill(x, y + r + 5, cost, afford);
    else if (label) {
      setFont(11, FONT_UI); const tw = ctx.measureText(label).width + 14;
      roundRect(x - tw / 2, y + r - 4, tw, 17, 8.5); ctx.fillStyle = 'rgba(6,5,16,0.95)'; ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = color; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
      ctx.fillText(label, x, y + r + 4.5);
    }
    hit(x - 26, y - 26, 52, 52 + 10, dis ? () => Sound.play('deny') : () => pressOption(m, o.id));
  }
  if (m.sel && m.sel !== 'close') drawTooltip(L, m);
  else if (G.tutorial && m.kind === 'build') {
    setFont(11, FONT_UI); spacing(2); ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
    ctx.fillText(tr('slide_letgo'), L.cx, L.top - 10 < HUD_H + 8 ? L.bottom + 12 : L.top - 10); spacing(0);
  }
}

function bestHintTile() {
  let best = null, bv = -1;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!isBuildable(c, r)) continue;
    let n = 0; for (const k of MAP.tiles) { const tc = k % COLS, tr = (k - tc) / COLS; if ((tc - c) ** 2 + (tr - r) ** 2 <= 2.3 * 2.3) n++; }
    if (n > bv) { bv = n; best = { c, r }; }
  }
  return best;
}

function drawTutorial() {
  if (G.state !== 'play' || G.paused || G.over) return;
  if (G.tutorial && !G.menu && G.towers.length === 0) {
    const h = G.hintTile || (G.hintTile = bestHintTile());
    const x = MAP_X + h.c * TILE + TILE / 2, y = MAP_Y + h.r * TILE + TILE / 2, p = (G.clock * 1.2) % 1;
    ctx.beginPath(); ctx.arc(x, y, 10 + p * 22, 0, TAU); ctx.lineWidth = 2; ctx.strokeStyle = hexA('#ffffff', 1 - p); ctx.stroke();
    roundRect(x - 18, y - 18, 36, 36, 7); ctx.lineWidth = 1.5; ctx.strokeStyle = hexA('#ffffff', 0.6 + Math.sin(G.clock * 6) * 0.3); ctx.stroke();
    setFont(11, FONT_UI); spacing(2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff';
    ctx.fillText(tr('tut_hold'), MAP_X + W / 2, clamp(y - 34, HUD_H + 14, LH - BAR_H - 14)); spacing(0);
  } else if (G.awaiting && G.waveNum === 0 && G.towers.length > 0 && !G.menu && G.levelNum <= 2) {
    setFont(11, FONT_UI); spacing(2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = hexA('#7dffb0', 0.6 + Math.sin(G.clock * 5) * 0.35);
    ctx.fillText(tr('tut_send'), MAP_X + 200, LH - BAR_H - 14); spacing(0);
  }
}

// ------------------------------------------------------------ overlays
function dim(a) { ctx.fillStyle = hexA(theme().bg, a); ctx.fillRect(0, 0, LW, LH); }
function blocker() { hit(0, 0, LW, LH, () => {}); }

function drawPause() {
  dim(0.8); blocker();
  const cx = LW / 2, y = LH * 0.28;
  glowText(tr('paused'), cx, y, 34, theme().flow, FONT_D, 18);
  setFont(12, FONT_UI); spacing(2); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(230,230,255,0.7)';
  ctx.fillText(tr('pause_sub', G.levelNum, G.waveNum, G.waves.length), cx, y + 36); spacing(0);
  pillButton(cx, y + 110, 210, 54, tr('resume'), '#7dffb0', () => { G.paused = false; G.confirm = null; Sound.play('tap'); }, { size: 20 });
  pillButton(cx, y + 180, 210, 50, G.confirm === 'restart' ? tr('tap_confirm') : tr('restart'), '#ffd23d', () => {
    if (G.confirm === 'restart') { G.confirm = null; startLevel(G.levelNum); Sound.play('build'); }
    else { G.confirm = 'restart'; Sound.play('tap'); }
  }, { size: 15 });
  pillButton(cx, y + 244, 210, 50, G.confirm === 'quit' ? tr('tap_confirm') : tr('level_map'), '#ff5fc8', () => {
    if (G.confirm === 'quit') { G.confirm = null; toMap(); } else { G.confirm = 'quit'; Sound.play('tap'); }
  }, { size: 15 });
  const lab = tr('thumb_' + THUMB.setting);
  pillButton(cx, y + 316, 210, 46, tr('menu_thumb', lab), theme().flow, () => {
    THUMB.setting = { auto: 'left', left: 'right', right: 'auto' }[THUMB.setting];
    try { localStorage.setItem('shatterline.thumb', THUMB.setting); } catch (e) {}
    Sound.play('tap');
  }, { size: 13, sub: THUMB.setting === 'auto' ? tr('thumb_sub_auto') : tr('thumb_sub_fixed') });
}

const TIPS = {
  glider: 'Gliders fly straight to your core. Only FLAK towers can hit them. Build FLAK under the flight line.',
  nobounty: 'No Bounty level: enemies drop no gold. Build Mints early and upgrade them. They are your only income.',
  grunt: 'Build at bends in the path. One tower there covers two lanes.',
  scout: 'Darts are fast. Frost slows them so your towers get more shots.',
  splitter: 'Spores split into Mites. Nova splash and Arc chains clean them up.',
  mite: 'Mites come from Spores. Splash damage handles swarms best.',
  brute: 'Bulwarks are armored. Nova, Prism and Rail hit hard enough to break it.',
  boss: 'Wardens are armored bosses. Prism beams heat up and ignore armor.',
  aegis: 'An Aegis dome makes everyone inside take only 20% damage. Put an EMP where it walks by to pop it, or snipe the Aegis with PRISM.',
  shield: 'Enemies with a blue ring wear shields and take only 20% damage. Put an EMP where they walk in, or burn through with PRISM.',
  blink: 'Blinks teleport ahead. Spread your towers along the whole path.',
  mender: 'Menders heal their friends. Set a tower to target STRONG, or snipe with Rail.',
  titan: 'Titans are huge and armored. Stack upgraded towers near one bend.',
};

function drawEnd() {
  const t = G.endShow || 0;
  dim(Math.min(0.84, t * 2)); blocker();
  const cx = LW / 2, win = G.result === 'win', a = Math.min(1, t * 3);
  let y = LH * 0.2;
  ctx.save(); ctx.globalAlpha = a;
  setFont(12, FONT_UI); spacing(4); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(230,230,255,0.75)';
  ctx.fillText(tr('level_n', G.levelNum), cx, y - 30); spacing(0);
  glowText(win ? tr('complete') : tr('core_shattered'), cx, y, win ? 32 : 26, win ? '#7dffb0' : '#ff2e4d', FONT_D, 20);
  if (win) {
    for (let i = 0; i < 3; i++) {
      const tt = t - 0.35 - i * 0.32, on = i < G.stars && tt > 0;
      if (on && G.starSnd <= i) { G.starSnd = i + 1; Sound.play('star', i); }
      const s = on ? 1 + Math.max(0, 0.35 - tt) * 2 : 1;
      if (on && tt < 0.4) { additive(true); glow(cx + (i - 1) * 62, y + 64 - (i === 1 ? 10 : 0), 60 * (1 - tt), '#ffd23d', 1 - tt * 2); additive(false); }
      drawStar(cx + (i - 1) * 62, y + 64 - (i === 1 ? 10 : 0), 22 * s, on);
    }
    setFont(12, FONT_UI); spacing(2); ctx.fillStyle = 'rgba(230,230,255,0.8)'; ctx.textAlign = 'center';
    ctx.fillText(tr('end_stats', G.lives, G.maxLives, G.kills, G.bestCombo), cx, y + 112); spacing(0);
    y += 130;
    if (G.unlockedTower || G.unlockedSlot) {
      const d = G.unlockedTower && TOWERS[G.unlockedTower];
      const col = d ? d.color : '#7dffb0', bw = Math.min(300, LW - 32), bh = 74;
      roundRect(cx - bw / 2, y, bw, bh, 12); ctx.fillStyle = 'rgba(8,6,22,0.95)'; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = col; ctx.stroke();
      if (d) {
        drawTowerGlyph(G.unlockedTower, cx - bw / 2 + 38, y + bh / 2, { lv: 0, t: G.clock, ghost: true });
        ctx.textAlign = 'left'; setFont(10, FONT_UI); spacing(2); ctx.fillStyle = '#ffffff'; ctx.fillText(tr('new_tower_unlocked'), cx - bw / 2 + 70, y + 20); spacing(0);
        setFont(17, FONT_D, 400); ctx.fillStyle = col; ctx.fillText(tName(G.unlockedTower), cx - bw / 2 + 70, y + 40);
        setFont(10, FONT_UI, 500); ctx.fillStyle = '#d9d6f5'; ctx.fillText(tDesc(G.unlockedTower), cx - bw / 2 + 70, y + 58);
      } else {
        ctx.textAlign = 'center'; setFont(16, FONT_D, 400); ctx.fillStyle = col; ctx.fillText(tr('plus_slot'), cx, y + 30);
        setFont(11, FONT_UI, 500); ctx.fillStyle = '#d9d6f5'; ctx.fillText(tr('plus_slot_line'), cx, y + 52);
      }
      if (!G.unlockSnd && t > 1.4) { G.unlockSnd = true; Sound.play('unlock'); }
      y += bh + 14;
    } else y += 6;
  } else {
    setFont(13, FONT_UI); spacing(2); ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
    ctx.fillText(tr('reached_wave', G.waveNum, G.waves.length), cx, y + 44); spacing(0);
    const worst = Object.entries(G.leakTypes).sort((p, q) => q[1] - p[1])[0];
    const noMint = G.level && G.level.noBounty && !G.towers.some(t => t.type === 'mint');
    const noShieldTool = G.level && G.level.hasShields && !G.towers.some(t => t.type === 'emp' || t.type === 'prism') && G.shieldLeaks >= Math.max(2, G.leaks * 0.3);
    const tk = noMint ? 'nobounty' : noShieldTool ? (G.level.hasAegis && !G.level.shieldTypes.length ? 'aegis' : 'shield') : worst ? worst[0] : 'grunt', tip = LANG === 'zh' ? ZH.tips[tk] || TIPS[tk] : TIPS[tk];
    const bw = Math.min(310, LW - 32), bh = 64;
    roundRect(cx - bw / 2, y + 70, bw, bh, 12); ctx.fillStyle = 'rgba(8,6,22,0.95)'; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#ffd23d'; ctx.stroke();
    setFont(10, FONT_UI); spacing(2); ctx.fillStyle = '#ffd23d'; ctx.fillText(tr('tip'), cx, y + 86); spacing(0);
    setFont(11, FONT_UI, 500); ctx.fillStyle = '#e8e6ff';
    wrapText(tip, cx, y + 104, bw - 24, 14);
    y += 150;
  }
  ctx.restore();
  if (t > 0.7) {
    const n = G.levelNum;
    if (win) {
      if (n < LEVELS.length) pillButton(cx, y + 34, 220, 56, tr('next_level'), '#7dffb0', () => { toMap(); openCard(n + 1); }, { pulse: true, size: 19 });
      else pillButton(cx, y + 34, 220, 56, tr('all_clear'), '#ffd23d', () => toMap(), { pulse: true, size: 19 });
      pillButton(cx - 58, y + 100, 108, 44, tr('retry'), '#ffd23d', () => { openCard(n, true); }, { size: 13 });
      pillButton(cx + 58, y + 100, 108, 44, tr('map'), theme().flow, () => toMap(), { size: 13 });
    } else {
      pillButton(cx, y + 34, 220, 56, tr('try_again'), '#7dffb0', () => { openCard(n, true); }, { pulse: true, size: 19 });
      pillButton(cx, y + 100, 160, 44, tr('map'), theme().flow, () => toMap(), { size: 13 });
    }
  }
}

// Line-wraps centered text. Latin words stay whole; each Chinese character can break,
// but closing punctuation (，。) never starts a line.
function wrapTokens(str) {
  const out = [], re = /[　-鿿＀-￯]|[^\s　-鿿＀-￯]+|\s+/g;
  let m;
  while ((m = re.exec(str))) {
    const t = m[0];
    if (/^\s+$/.test(t)) { out.push({ t: ' ', sp: true }); continue; }
    if (/^[，。、；：？！）」』]$/.test(t) && out.length && !out[out.length - 1].sp) { out[out.length - 1].t += t; continue; }
    out.push({ t });
  }
  return out;
}
function wrapText(str, cx, y, maxW, lh) {
  let line = '', yy = y;
  ctx.textAlign = 'center';
  for (const k of wrapTokens(str)) {
    if (k.sp) { if (line) line += ' '; continue; }
    const t = line + k.t;
    if (ctx.measureText(t.trim()).width > maxW && line.trim()) { ctx.fillText(line.trim(), cx, yy); line = k.t; yy += lh; } else line = t;
  }
  if (line.trim()) ctx.fillText(line.trim(), cx, yy);
}

function drawRotateHint() {
  if (LW < LH * 1.1 || !(window.matchMedia && matchMedia('(pointer: coarse)').matches)) return;
  setFont(11, FONT_UI); spacing(2); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(tr('upright'), LW / 2, HUD_H + 12); spacing(0);
}

function saveMute() { try { localStorage.setItem('shatterline.muted', Sound.muted ? '1' : '0'); } catch (e) {} }

function drawPlayUI() {
  hit(0, 0, LW, LH, () => {});                  // taps off the map don't close the menu: use its X
  hit(MAP_X, MAP_Y, W, ROWS * TILE, tapMap);
  drawCoins();
  drawHud();
  drawBar();
  const boss = drawBossBar();
  if (boss) { ctx.save(); ctx.translate(0, 26); drawCombo(); ctx.restore(); } else drawCombo();
  drawToast();
  drawBanner();
  drawShout();
  drawMenu();
  drawTutorial();
  drawRotateHint();
  if (G.state === 'end') drawEnd();
  else if (G.paused) drawPause();
}
