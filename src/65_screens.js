// =====================================================================
//  SCREENS: title, level map (saga), level card with enemies + loadout
// =====================================================================
const SAGA = { scroll: 0, vel: 0, drag: null, card: null, info: null, fresh: [], shake: 0, deco: null, target: null };
const NODE_GAP = 96;

const WORLD_GAP = 46;          // extra room between worlds for the world banner
function sagaHeight() { return 250 + (LEVELS.length - 1) * NODE_GAP + (THEMES.length - 1) * WORLD_GAP + 250; }
function nodePos(n) {
  const amp = Math.min(104, LW * 0.27);
  return { x: LW / 2 + Math.sin((n - 1) * 0.9) * amp, y: sagaHeight() - 250 - (n - 1) * NODE_GAP - Math.floor((n - 1) / LEVELS_PER_WORLD) * WORLD_GAP };
}
function clampScroll(s) { return clamp(s, 0, Math.max(0, sagaHeight() - LH)); }
function scrollToLevel(n, instant) {
  const s = clampScroll(nodePos(n).y - LH * 0.56);
  if (instant) { SAGA.scroll = s; SAGA.target = null; } else SAGA.target = s;
}
function worldBand(w) {        // y-range (content space) of a world's section
  const first = w * LEVELS_PER_WORLD + 1, last = Math.min(LEVELS.length, first + LEVELS_PER_WORLD - 1);
  const bottom = w === 0 ? sagaHeight() : nodePos(first).y + (NODE_GAP + WORLD_GAP) / 2;
  const top = last >= LEVELS.length ? 0 : nodePos(last).y - (NODE_GAP + WORLD_GAP) / 2;
  return { top, bottom };
}

function toMap() {
  G.state = 'map'; G.paused = false; G.menu = null; SAGA.card = null;
  startDemo(); G.state = 'map';
  G.theme = LEVELS[Math.min(Save.d.max, LEVELS.length) - 1].world;
  Sound.musicOff();
  scrollToLevel(G.mapAnim ? G.mapAnim.level : Save.d.max, true);
  FX.clear();
}

function openCard(n, fromLevel) {
  if (fromLevel || G.state !== 'map') { toMap(); }
  SAGA.fresh = Save.syncLoadout();
  SAGA.card = { n, t: 0 }; SAGA.info = null; SAGA.confirm = null;
  scrollToLevel(n);
  Sound.play('swoosh');
}

// ------------------------------------------------------------- title
function drawLogo(cx, cy) {
  const glitch = (G.clock % 3.2) < 0.12, j = glitch ? 5 : 1.6;
  setFont(52, FONT_D, 400); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  additive(true);
  ctx.fillStyle = hexA('#ff3d9a', 0.85); ctx.fillText('SHATTER', cx - j, cy + (glitch ? 2 : 0));
  ctx.fillStyle = hexA('#2ef2ff', 0.85); ctx.fillText('SHATTER', cx + j, cy - (glitch ? 2 : 0));
  additive(false);
  ctx.fillStyle = '#ffffff'; ctx.fillText('SHATTER', cx, cy);
  const lw = 250, ly = cy + 34, px = cx - lw / 2 + ((G.clock * 0.5) % 1) * lw;
  ctx.fillStyle = hexA(theme().edge, 0.9); ctx.fillRect(cx - lw / 2, ly - 1, lw, 2);
  additive(true); glow(px, ly, 26, theme().flow, 0.9); additive(false);
  setFont(40, FONT_D, 400);
  ctx.lineWidth = 1.6; ctx.strokeStyle = theme().flow;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '10px';     // logo keeps its spacing in every language
  ctx.strokeText('LINE', cx + 5, cy + 70); spacing(0);
}

function drawTitle() {
  dim(0.62); blocker();
  const cx = LW / 2;
  drawLogo(cx, LH * 0.22);
  setFont(11, FONT_UI); spacing(3); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(230,230,255,0.75)';
  ctx.fillText(tr('subtitle'), cx, LH * 0.22 + 112); spacing(0);
  const py = LH * 0.58, started = Save.d.max > 1 || Save.total() > 0;
  if (!LANG_CHOSEN) { drawLangPick(cx, py); return; }
  // language switch, top-right
  pillButton(LW - 58, 34, 92, 34, LANG === 'zh' ? 'English' : '中文', '#8a84b8', () => {
    setLang(LANG === 'zh' ? 'en' : 'zh'); Sound.init(); Sound.play('tap');
  }, { size: 13 });
  pillButton(cx, py, 210, 62, started ? tr('continue') : tr('play'), '#7dffb0', () => {
    Sound.init(); Sound.play('build'); toMap();
    if (!started) openCard(1);
  }, { pulse: true, size: started ? 22 : 26, sub: started ? tr('level_n', Save.d.max) : null });
  if (started) {
    setFont(13, FONT_UI); spacing(2); ctx.textAlign = 'center'; ctx.fillStyle = '#ffe38a';
    ctx.fillText(`★ ${Save.total()} / ${LEVELS.length * 3}`, cx, py + 62); spacing(0);
  }
  setFont(11, FONT_UI, 500); ctx.fillStyle = 'rgba(230,230,255,0.6)'; ctx.textAlign = 'center';
  ctx.fillText(tr('title_footer', LEVELS.length, THEMES.length, TOWER_ORDER.length), cx, LH - 30);
  // playtest helper: open every level without touching real progress
  pillButton(cx, py + (started ? 104 : 86), 196, 40, Save.d.testAll ? tr('test_on') : tr('test_off'), Save.d.testAll ? '#ffd23d' : '#8a84b8', () => {
    Save.d.testAll = !Save.d.testAll; Save.store(); Sound.init(); Sound.play('tap');
  }, { size: 12, sub: Save.d.testAll ? tr('test_sub_on', LEVELS.length) : tr('test_sub_off') });
}

// First launch: pick a language before anything else. Both prompts are shown in both languages.
function drawLangPick(cx, py) {
  const y = py - 40;
  setFont(13, FONT_UI); spacing(2); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(230,230,255,0.8)';
  ctx.fillText('CHOOSE LANGUAGE  ·  选择语言', cx, y - 18); spacing(0);
  const pick = l => () => { setLang(l); Sound.init(); Sound.play('build'); };
  pillButton(cx, y + 34, 210, 56, 'ENGLISH', '#7dffb0', pick('en'), { size: 20, pulse: true });
  pillButton(cx, y + 104, 210, 56, '中文', '#ff5fc8', pick('zh'), { size: 22, pulse: true, sub: '简体中文' });
}

// ---------------------------------------------------------- level map
function sagaDeco() {
  if (SAGA.deco && SAGA.deco.w === LW) return SAGA.deco.items;
  const R = seeded(99), items = [], H = sagaHeight();
  const kinds = ['grunt', 'scout', 'splitter', 'brute', 'aegis', 'blink', 'mender', 'titan', 'mite'];
  for (let i = 0; i < Math.round(70 * LEVELS.length / 40); i++) items.push({ x: R() * LW, y: R() * H, k: kinds[Math.floor(R() * kinds.length)], s: 0.7 + R() * 1.2, ph: R() * 6, sp: 0.2 + R() * 0.6 });
  SAGA.deco = { w: LW, items };
  return items;
}

function drawSaga(rdt) {
  const sc = SAGA.scroll, H = sagaHeight();
  // world bands
  for (let w = 0; w < THEMES.length; w++) {
    const b = worldBand(w), th = THEMES[w];
    const y0 = b.top - sc, y1 = b.bottom - sc;
    if (y1 < 0 || y0 > LH) continue;
    const gr = ctx.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, th.bg); gr.addColorStop(0.5, th.bg2); gr.addColorStop(1, th.bg);
    ctx.fillStyle = gr; ctx.fillRect(0, y0, LW, y1 - y0 + 1);
    ctx.fillStyle = hexA(th.grid, 0.6);
    const oy = (b.top - sc) % TILE;
    for (let x = (LW / 2) % TILE; x < LW; x += TILE) for (let y = Math.max(y0, oy); y < Math.min(y1, LH); y += TILE) ctx.fillRect(x - 1, y - 1, 2, 2);
  }
  // drifting glyphs
  for (const d of sagaDeco()) {
    const y = d.y - sc; if (y < -30 || y > LH + 30) continue;
    ctx.globalAlpha = 0.13;
    drawGlyph(ENEMIES[d.k], d.x + Math.sin(G.clock * d.sp + d.ph) * 10, y, { rot: G.clock * d.sp, rot2: -G.clock, scale: d.s, dir: d.ph, t: G.clock + d.ph });
    ctx.globalAlpha = 1;
  }
  // trail
  const pts = LEVELS.map(l => nodePos(l.n));
  const trace = (from, to) => {
    ctx.beginPath(); ctx.moveTo(pts[from].x, pts[from].y - sc);
    for (let i = from + 1; i <= to; i++) {
      const a = pts[i - 1], b = pts[i];
      ctx.bezierCurveTo(a.x, a.y - sc - NODE_GAP * 0.45, b.x, b.y - sc + NODE_GAP * 0.45, b.x, b.y - sc);
    }
  };
  ctx.lineCap = 'round';
  trace(0, pts.length - 1); ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(5,4,14,0.8)'; ctx.stroke();
  ctx.lineWidth = 2; ctx.setLineDash([3, 9]); ctx.strokeStyle = 'rgba(160,150,220,0.3)'; ctx.stroke(); ctx.setLineDash([]);
  const reach = Math.min(Save.d.max, LEVELS.length) - 1;
  if (reach > 0) {
    trace(0, reach);
    ctx.lineWidth = 7; ctx.strokeStyle = hexA(THEMES[LEVELS[reach].world].edge, 0.8); ctx.stroke();
    ctx.lineWidth = 2.5; ctx.strokeStyle = THEMES[LEVELS[reach].world].flow; ctx.setLineDash([4, 12]); ctx.lineDashOffset = G.clock * 30; ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.lineCap = 'butt';
  // world banners
  for (let w = 0; w < THEMES.length; w++) {
    const first = w * LEVELS_PER_WORLD + 1, th = THEMES[w];
    const y = (w === 0 ? nodePos(1).y + 62 : worldBand(w).bottom) - sc;
    if (y < -40 || y > LH + 40) continue;
    ctx.fillStyle = hexA(th.edge, 0.5); ctx.fillRect(0, y, LW, 1);
    roundRect(LW / 2 - 100, y - 17, 200, 34, 17); ctx.fillStyle = hexA(th.bg, 0.95); ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = th.edge; ctx.stroke();
    setFont(8.5, FONT_UI); spacing(1.5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(230,230,255,0.7)';
    ctx.fillText(first > Save.open() ? tr('world_from', w + 1, first) : tr('world_n', w + 1), LW / 2, y - 6); spacing(0);
    setFont(13, FONT_D, 400); ctx.fillStyle = th.flow; ctx.fillText(wName(w), LW / 2, y + 8);
  }
  // nodes
  for (const lv of LEVELS) {
    const p = pts[lv.n - 1], y = p.y - sc;
    if (y < -60 || y > LH + 60) continue;
    drawNode(lv, p.x, y);
  }
  // top of the map
  const ty = 60 - sc;
  if (ty > -40) {
    setFont(12, FONT_D, 400); ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(230,230,255,0.55)';
    ctx.fillText(tr('more_levels'), LW / 2, ty);
  }
}

function drawNode(lv, x, y) {
  const n = lv.n, th = THEMES[lv.world], st = Save.stars(n);
  const unlocked = n <= Save.open(), current = n === Save.d.max && !Save.d.done && st === 0;
  const anim = G.mapAnim && G.mapAnim.level === n ? G.mapAnim : null;
  let s = 1;
  if (anim) { const a = clamp((anim.t - 0.3) / 0.5, 0, 1); s = a <= 0 ? 0.6 : easeOutBack(a); }
  const r = (lv.boss ? 26 : 21) * s * (current ? 1 + Math.sin(G.clock * 4) * 0.05 : 1);
  if (current) { additive(true); glow(x, y, 70, th.flow, 0.5 + Math.sin(G.clock * 4) * 0.2); additive(false); }
  const col = lv.boss ? '#ff2e4d' : th.flow;
  if (lv.boss) starPath(x, y, r * 1.12, r * 0.72, 8, G.clock * 0.2); else { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
  ctx.fillStyle = unlocked ? '#0c0a1d' : '#08070f'; ctx.fill();
  if (unlocked) { ctx.fillStyle = hexA(col, st ? 0.35 : 0.18); ctx.fill(); }
  ctx.lineWidth = current ? 3 : 2; ctx.strokeStyle = unlocked ? col : '#34304f'; ctx.stroke();
  if (unlocked) { ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.stroke(); }
  setFont(lv.boss ? 16 : 15, FONT_D, 400); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = unlocked ? '#ffffff' : '#57527c'; ctx.fillText(String(n), x, y + 1);
  if (!unlocked) {       // padlock
    const lx = x + r * 0.72, ly = y + r * 0.62;
    ctx.fillStyle = '#57527c'; ctx.fillRect(lx - 4, ly - 1, 8, 6);
    ctx.beginPath(); ctx.arc(lx, ly - 1, 2.6, Math.PI, 0); ctx.lineWidth = 1.5; ctx.strokeStyle = '#57527c'; ctx.stroke();
  }
  if (st > 0 || (unlocked && !current)) for (let i = 0; i < 3; i++) drawStar(x + (i - 1) * 14, y - r - 9 + (i === 1 ? -3 : 0), 6.5, i < st);
  if (current) {        // "you are here" marker
    const by = y - r - 22 + Math.sin(G.clock * 5) * 4;
    polyPath(x, by, 7, 4, G.clock); ctx.fillStyle = '#0a0817'; ctx.fill(); neon('#bff8ff', 2);
  }
  // unlock badges
  const side = x > LW / 2 ? -1 : 1, bx = x + side * (r + 30);
  if (lv.newTower) {
    drawTowerGlyph(lv.newTower, bx, y, { lv: 0, t: G.clock, scale: 0.55, ghost: true, alpha: unlocked ? 1 : 0.45 });
    setFont(8, FONT_UI); spacing(1); ctx.textAlign = 'center'; ctx.fillStyle = TOWERS[lv.newTower].color; ctx.fillText(tr('badge_tower'), bx, y + 18); spacing(0);
  } else if (lv.newEnemy) {
    ctx.globalAlpha = unlocked ? 1 : 0.45;
    drawGlyph(ENEMIES[lv.newEnemy], bx, y - 2, { rot: G.clock * 0.6, rot2: -G.clock, scale: Math.min(1, 10 / ENEMIES[lv.newEnemy].r), dir: 0, t: G.clock });
    ctx.globalAlpha = 1;
    setFont(8, FONT_UI); spacing(1); ctx.textAlign = 'center'; ctx.fillStyle = ENEMIES[lv.newEnemy].color; ctx.fillText(tr('badge_enemy'), bx, y + 18); spacing(0);
  } else if (lv.twoPortals) {
    setFont(8, FONT_UI); spacing(1); ctx.textAlign = 'center'; ctx.fillStyle = '#ff3d9a'; ctx.fillText(tr('two_portals'), bx, y); spacing(0);
  } else if (lv.noBounty || lv.air || lv.shielded) {
    const k = lv.noBounty ? 'noBounty' : lv.air ? 'air' : 'shielded', cd = CONDITIONS[k];
    ctx.globalAlpha = unlocked ? 1 : 0.5; conditionIcon(k, bx, y - 4, cd.color); ctx.globalAlpha = 1;
    setFont(8, FONT_UI); spacing(1); ctx.textAlign = 'center'; ctx.fillStyle = cd.color; ctx.fillText(condTag(k), bx, y + 16); spacing(0);
  }
  hit(x - r - 10, y - r - 10, (r + 10) * 2, (r + 10) * 2, () => {
    if (unlocked) openCard(n);
    else { Sound.play('deny'); FX.text(x, y - r - 12, tr('beat_first', Save.d.max), '#ff8a96', 11, { life: 1 }); }
  });
}

function drawMapHud() {
  ctx.fillStyle = 'rgba(5,4,14,0.86)'; ctx.fillRect(0, 0, LW, HUD_H);
  ctx.fillStyle = hexA(theme().edge, 0.5); ctx.fillRect(0, HUD_H - 1, LW, 1);
  const x0 = Math.max(0, (LW - W) / 2);
  drawStar(x0 + 22, HUD_H / 2, 10, true);
  setFont(18, FONT_UI); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffe38a';
  ctx.fillText(`${Save.total()}`, x0 + 38, HUD_H / 2 + 1);
  const tw = ctx.measureText(String(Save.total())).width;
  setFont(11, FONT_UI); ctx.fillStyle = 'rgba(230,230,255,0.5)'; ctx.fillText(`/ ${LEVELS.length * 3}`, x0 + 42 + tw, HUD_H / 2 + 2);
  glowText('SHATTERLINE', LW / 2, HUD_H / 2 - (Save.d.testAll ? 5 : 0), 14, theme().flow, FONT_D, 8);
  if (Save.d.testAll) { setFont(8.5, FONT_UI); spacing(2); ctx.textAlign = 'center'; ctx.fillStyle = '#ffd23d'; ctx.fillText(tr('test_mode'), LW / 2, HUD_H / 2 + 12); spacing(0); }
  circleButton(LW - x0 - 28, HUD_H / 2, 17, Sound.muted ? 'muted' : 'sound', () => { Sound.setMuted(!Sound.muted); Sound.play('tap'); saveMute(); });
  // bottom play bar
  const y0 = LH - 84;
  const gr = ctx.createLinearGradient(0, y0 - 30, 0, LH); gr.addColorStop(0, 'rgba(5,4,14,0)'); gr.addColorStop(0.45, 'rgba(5,4,14,0.9)');
  ctx.fillStyle = gr; ctx.fillRect(0, y0 - 30, LW, LH - y0 + 30);
  const n = Save.d.max;
  pillButton(LW / 2, y0 + 40, 230, 58, Save.d.done && Save.stars(n) ? tr('replay') : tr('play_n', n), '#7dffb0', () => openCard(n), { pulse: true, size: 22, sub: LEVELS[n - 1].boss ? tr('boss_level') : tr('world_sub', LEVELS[n - 1].world + 1, wName(LEVELS[n - 1].world)) });
}

// ------------------------------------------------------- level card
function toggleLoadout(t) {
  const lo = Save.d.loadout, slots = slotsFor(Save.open());
  const i = lo.indexOf(t);
  if (i >= 0) {
    if (lo.length <= 1) { Sound.play('deny'); SAGA.shake = 1; SAGA.info = { kind: 'msg', text: tr('min_one') }; return; }
    lo.splice(i, 1); Sound.play('tap');
  } else if (lo.length >= slots) {
    Sound.play('deny'); SAGA.shake = 1; SAGA.info = { kind: 'msg', text: tr('loadout_full') }; return;
  } else { lo.push(t); Sound.play('build'); }
  SAGA.info = { kind: 'tower', key: t };
  Save.store();
}

function levelNeeds(lv) { return ['noBounty', 'air', 'shielded'].filter(k => lv[k]).map(k => ({ key: k, ...CONDITIONS[k] })); }
const needOf = cd => (Array.isArray(cd.need) ? cd.need : [cd.need]).filter(t => TOWERS[t].unlock <= Save.open());
const needMet = (cd, lo) => needOf(cd).some(t => lo.includes(t));
const needNames = cd => needOf(cd).map(t => tName(t)).join(' / ');
function conditionIcon(kind, x, y, color) {
  if (kind === 'noBounty') {
    drawCoin(x, y, 7);
    ctx.beginPath(); ctx.moveTo(x - 9, y + 9); ctx.lineTo(x + 9, y - 9); ctx.lineWidth = 2.4; ctx.strokeStyle = '#ff5a6a'; ctx.stroke();
  } else if (kind === 'shielded') {
    drawGlyph(ENEMIES.aegis, x, y, { rot: G.clock * 0.5, scale: 0.7, dir: 0, t: G.clock, shield: 1 });
  } else {
    drawGlyph(ENEMIES.glider, x, y + 3, { rot: 0, scale: 0.8, dir: -Math.PI / 2, t: G.clock });
  }
}

function drawCard(rdt) {
  const c = SAGA.card; if (!c) return;
  c.t = Math.min(1, c.t + rdt * 5);
  SAGA.shake = Math.max(0, SAGA.shake - rdt * 4);
  const lv = LEVELS[c.n - 1], th = THEMES[lv.world], needs = levelNeeds(lv);
  const CS = needs.length ? 44 * needs.length : 0;
  dim(0.72 * c.t); blocker();
  const cw = Math.min(344, LW - 20), ch = 524 + CS;
  const x0 = (LW - cw) / 2, y0 = Math.max(8, (LH - ch) / 2) + (1 - easeOutBack(c.t)) * 60;
  ctx.save(); ctx.globalAlpha = c.t;
  additive(true); glow(LW / 2, y0 + ch / 2, cw * 0.9, th.edge, 0.25); additive(false);
  roundRect(x0, y0, cw, ch, 18); ctx.fillStyle = '#0b0918'; ctx.fill();
  ctx.fillStyle = hexA(th.bg2, 0.8); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = lv.boss ? '#ff2e4d' : th.edge; ctx.stroke();
  const cx = LW / 2;
  circleButton(x0 + cw - 26, y0 + 26, 15, 'close', () => { SAGA.card = null; SAGA.confirm = null; Sound.play('tap'); });
  // header
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  glowText(tr('level_n', c.n), cx, y0 + 38, 28, lv.boss ? '#ff5a6a' : th.flow, FONT_D, 14);
  setFont(10, FONT_UI); spacing(3); ctx.fillStyle = 'rgba(230,230,255,0.7)';
  ctx.fillText(tr('card_sub', lv.world + 1, wName(lv.world), lv.boss ? tr('boss_suffix') : '', lv.waves.length), cx, y0 + 64); spacing(0);
  const st = Save.stars(c.n);
  for (let i = 0; i < 3; i++) drawStar(cx + (i - 1) * 34, y0 + 96 - (i === 1 ? 4 : 0), 13, i < st);
  setFont(10, FONT_UI, 500); ctx.fillStyle = 'rgba(230,230,255,0.65)';
  ctx.fillText(tr('star_rules'), cx, y0 + 122);
  ctx.fillStyle = hexA(th.edge, 0.4); ctx.fillRect(x0 + 16, y0 + 138, cw - 32, 1);
  const lo = Save.d.loadout;
  // level conditions (No Bounty / Air Raid)
  needs.forEach((cd, i) => {
    const py = y0 + 146 + i * 44, has = needMet(cd, lo), pulse = has ? 0 : 0.5 + Math.sin(G.clock * 5) * 0.5;
    roundRect(x0 + 14, py, cw - 28, 38, 10); ctx.fillStyle = hexA(cd.color, 0.1 + pulse * 0.08); ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = cd.color; ctx.stroke();
    conditionIcon(cd.key, x0 + 34, py + 19, cd.color);
    ctx.textAlign = 'left'; setFont(12, FONT_D, 400); ctx.fillStyle = cd.color; ctx.fillText(condTag(cd.key), x0 + 54, py + 12);
    setFont(10, FONT_UI, 500); ctx.fillStyle = '#e8e6ff'; ctx.fillText(condLine(cd.key), x0 + 54, py + 27);
    ctx.textAlign = 'right'; setFont(8.5, FONT_UI); spacing(1); ctx.fillStyle = has ? '#7dffb0' : '#ff8a96';
    const got = needOf(cd).find(t => lo.includes(t));
    ctx.fillText(has ? `${tName(got)} ✓` : `${tr('bring')} ${needNames(cd)}`, x0 + cw - 22, py + 12); spacing(0);
  });
  const Y = y0 + CS;          // everything below shifts down by the condition strip
  // enemies
  setFont(10, FONT_UI); spacing(3); ctx.textAlign = 'left'; ctx.fillStyle = '#ffffff'; ctx.fillText(tr('enemies'), x0 + 18, Y + 156); spacing(0);
  const ens = levelEnemies(lv), gap = Math.min(54, (cw - 30) / ens.length);
  ens.forEach((k, i) => {
    const rc = ENEMIES[k], ex = cx + (i - (ens.length - 1) / 2) * gap, ey = Y + 192;
    const sel = SAGA.info && SAGA.info.kind === 'enemy' && SAGA.info.key === k;
    if (sel) { ctx.beginPath(); ctx.arc(ex, ey, 20, 0, TAU); ctx.fillStyle = hexA(rc.color, 0.15); ctx.fill(); }
    const shielded = lv.shieldTypes.includes(k);
    if (rc.dome) {                         // Aegis: show its dome
      ctx.beginPath(); ctx.arc(ex, ey, 21, 0, TAU); ctx.fillStyle = hexA('#4aa8ff', 0.12); ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = hexA('#9fd6ff', 0.55 + Math.sin(G.clock * 3) * 0.2); ctx.stroke();
    }
    drawGlyph(rc, ex, ey, { rot: G.clock * (rc.spin || 0), rot2: G.clock * (rc.inner ? rc.inner.spin : 0), scale: Math.min(1.1, 12 / rc.r), dir: rc.flying ? -Math.PI / 2 : Math.sin(G.clock + i) * 0.5, t: G.clock + i, shield: shielded ? 1 : 0, ping: shielded ? Math.max(0, Math.sin(G.clock * 2.5 + i)) * 0.04 : 0 });
    setFont(8.5, FONT_UI); ctx.textAlign = 'center'; ctx.fillStyle = hexA(rc.color, 0.95);
    ctx.fillText(eName(k).toUpperCase(), ex, ey + 26 + (ens.length > 7 && i % 2 ? 10 : 0));   // stagger names when crowded
    let by = ey - 32;
    if (shielded || rc.dome) {             // blue SHIELD badge: this enemy is protected on this level
      const bw = LANG === 'zh' ? 28 : 40;
      roundRect(ex - bw / 2, by, bw, 13, 6.5); ctx.fillStyle = '#2a6fd6'; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = '#9fd6ff'; ctx.stroke();
      setFont(7.5, FONT_UI); ctx.fillStyle = '#ffffff'; ctx.fillText(tr('shield_badge'), ex, by + 6.5); by -= 15;
    }
    if (k === lv.newEnemy) {
      roundRect(ex - 15, by, 30, 13, 6.5); ctx.fillStyle = '#ff3d9a'; ctx.fill();
      setFont(8, FONT_UI); ctx.fillStyle = '#ffffff'; ctx.fillText(tr('new'), ex, by + 6.5);
    }
    hit(ex - gap / 2, ey - 24, gap, 54, () => { SAGA.info = { kind: 'enemy', key: k }; Sound.play('tap'); });
  });
  // info line
  let info = null, icol = '#d9d6f5';
  const I = SAGA.info;
  if (I && I.kind === 'enemy') { info = `${eName(I.key)}: ${eDesc(I.key)}${lv.shieldTypes.includes(I.key) ? '  ' + tr('shielded_note') : ''}`; icol = ENEMIES[I.key].color; }
  else if (I && I.kind === 'tower') { const d = TOWERS[I.key]; info = d.unlock > Save.open() ? tr('info_unlock', tName(I.key), d.unlock) : `${tName(I.key)}: ${tDesc(I.key)}`; icol = d.color; }
  else if (I && I.kind === 'msg') { info = I.text; icol = '#ff8a96'; }
  else if (lv.newEnemy) { info = tr('info_new', eName(lv.newEnemy), eDesc(lv.newEnemy)); icol = ENEMIES[lv.newEnemy].color; }
  else if (lv.newTower) { info = tr('info_new_tower', tName(lv.newTower), tDesc(lv.newTower)); icol = TOWERS[lv.newTower].color; }
  else if (lv.twoPortals) { info = tr('info_two'); icol = '#ff3d9a'; }
  else if (lv.boss) { info = tr('info_boss'); icol = '#ff5a6a'; }
  else if (lv.hasShields && !lv.shielded) { info = tr('info_light'); icol = '#9fd6ff'; }
  if (info) { setFont(10.5, FONT_UI, 500); ctx.fillStyle = icol; wrapText(info, cx, Y + 244, cw - 36, 13); }
  ctx.fillStyle = hexA(th.edge, 0.4); ctx.fillRect(x0 + 16, Y + 266, cw - 32, 1);
  // loadout
  const slots = slotsFor(Save.open());
  setFont(10, FONT_UI); spacing(3); ctx.textAlign = 'left'; ctx.fillStyle = '#ffffff'; ctx.fillText(tr('loadout'), x0 + 18, Y + 284); spacing(0);
  const shx = Math.sin(SAGA.shake * 30) * 4 * SAGA.shake;
  for (let i = 0; i < slots; i++) {
    const sx = x0 + cw - 18 - (slots - 1 - i) * 16 + shx;
    ctx.beginPath(); ctx.arc(sx - 4, Y + 284, 5, 0, TAU);
    ctx.fillStyle = i < lo.length ? TOWERS[lo[i]].color : 'rgba(0,0,0,0.5)'; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();
  }
  setFont(10, FONT_UI); ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(230,230,255,0.7)';
  ctx.fillText(`${lo.length}/${slots}`, x0 + cw - 18 - slots * 16 - 2 + shx, Y + 284.5);
  const COLS5 = 5, gw = (cw - 28) / COLS5, gh = 70;
  const needed = needs.filter(cd => !needMet(cd, lo)).flatMap(needOf);
  TOWER_ORDER.forEach((t, i) => {
    const d = TOWERS[t], gx = x0 + 14 + (i % COLS5) * gw, gy = Y + 298 + Math.floor(i / COLS5) * (gh + 8);
    const open = d.unlock <= Save.open(), on = lo.includes(t), fresh = SAGA.fresh.includes(t);
    const want = needed.includes(t) && !on && open;
    roundRect(gx + 2, gy, gw - 4, gh, 10);
    ctx.fillStyle = on ? hexA(d.color, 0.16) : 'rgba(6,5,16,0.7)'; ctx.fill();
    ctx.lineWidth = on || want ? 2 : 1;
    ctx.strokeStyle = on ? d.color : want ? hexA(d.color, 0.5 + Math.sin(G.clock * 6) * 0.5) : open ? '#3d3868' : '#221f3a'; ctx.stroke();
    const gcx = gx + gw / 2;
    if (open) {
      drawTowerGlyph(t, gcx, gy + 26, { lv: 0, t: G.clock, scale: 0.66, ghost: true, alpha: on ? 1 : 0.55 });
      setFont(9, FONT_UI); ctx.textAlign = 'center'; ctx.fillStyle = on ? '#ffffff' : 'rgba(230,230,255,0.6)';
      ctx.fillText(tName(t), gcx, gy + 50);
      setFont(8.5, FONT_UI); ctx.fillStyle = on ? '#ffe38a' : 'rgba(255,227,138,0.5)'; ctx.fillText(`⬡ ${d.cost}`, gcx, gy + 62);
      if (on) {
        ctx.beginPath(); ctx.arc(gx + gw - 11, gy + 10, 7, 0, TAU); ctx.fillStyle = d.color; ctx.fill();
        setFont(9, FONT_UI); ctx.fillStyle = '#0b0918'; ctx.fillText(String(lo.indexOf(t) + 1), gx + gw - 11, gy + 10.5);
      }
      if (fresh || want) {
        roundRect(gx + 5, gy + 4, 30, 13, 6.5); ctx.fillStyle = want ? d.color : '#ff3d9a'; ctx.fill();
        setFont(7.5, FONT_UI); ctx.fillStyle = want ? '#0b0918' : '#ffffff'; ctx.fillText(want ? tr('need') : tr('new'), gx + 20, gy + 10.5);
      }
    } else {
      ctx.globalAlpha = c.t * 0.18; drawTowerGlyph(t, gcx, gy + 26, { lv: 0, t: 0, scale: 0.66, ghost: true }); ctx.globalAlpha = c.t;
      ctx.fillStyle = '#57527c'; ctx.fillRect(gcx - 5, gy + 24, 10, 8);
      ctx.beginPath(); ctx.arc(gcx, gy + 24, 3.4, Math.PI, 0); ctx.lineWidth = 1.8; ctx.strokeStyle = '#57527c'; ctx.stroke();
      setFont(8.5, FONT_UI); ctx.textAlign = 'center'; ctx.fillStyle = '#6d6894'; ctx.fillText(tr('level_n', d.unlock), gcx, gy + 56);
    }
    hit(gx, gy, gw, gh, () => { if (SAGA.confirm) return; if (open) toggleLoadout(t); else { SAGA.info = { kind: 'tower', key: t }; Sound.play('deny'); } });
  });
  ctx.restore();
  const go = () => { Save.store(); SAGA.card = null; SAGA.confirm = null; G.mapAnim = null; startLevel(c.n); Sound.play('build'); };
  pillButton(cx, y0 + ch - 42, 220, 56, tr('play'), '#7dffb0', () => {
    const missing = needs.find(cd => needOf(cd).length && !needMet(cd, Save.d.loadout));
    if (missing) { SAGA.confirm = missing; Sound.play('deny'); } else go();
  }, { pulse: true, size: 24 });
  if (SAGA.confirm) drawNeedConfirm(SAGA.confirm, x0, y0, cw, ch, go);
}

// "Are you sure?" when a level needs a tower that isn't in the loadout
function drawNeedConfirm(cd, x0, y0, cw, ch, go) {
  roundRect(x0, y0, cw, ch, 18); ctx.fillStyle = 'rgba(5,4,14,0.78)'; ctx.fill();
  hit(x0, y0, cw, ch, () => {});
  const bw = cw - 36, bh = 230, bx = x0 + 18, by = y0 + (ch - bh) / 2, cx = x0 + cw / 2, first = needOf(cd)[0], name = tName(first);
  additive(true); glow(cx, by + bh / 2, bw * 0.8, cd.color, 0.3); additive(false);
  roundRect(bx, by, bw, bh, 16); ctx.fillStyle = '#0b0918'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = cd.color; ctx.stroke();
  conditionIcon(cd.key, cx, by + 30, cd.color);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  glowText(condTag(cd.key), cx, by + 60, 20, cd.color, FONT_D, 10);
  setFont(11.5, FONT_UI, 500); ctx.fillStyle = '#e8e6ff';
  const msg = tr('confirm_' + cd.key, needNames(cd));
  wrapText(msg, cx, by + 88, bw - 30, 15);
  pillButton(cx, by + 150, bw - 40, 46, `${tr('add')} ${name}`, cd.color, () => {
    const lo = Save.d.loadout, slots = slotsFor(Save.open());
    if (!lo.includes(first)) {
      if (lo.length >= slots) {                    // drop the last tower that isn't needed by another condition
        const keep = levelNeeds(LEVELS[SAGA.card.n - 1]).flatMap(needOf);
        let i = lo.length - 1; while (i > 0 && keep.includes(lo[i])) i--;
        lo.splice(i, 1);
      }
      lo.push(first);
    }
    Save.store(); SAGA.confirm = null; SAGA.info = { kind: 'tower', key: first }; Sound.play('build');
  }, { size: 16, pulse: true });
  pillButton(cx, by + 202, bw - 90, 36, tr('play_without'), '#8a84b8', go, { size: 11 });
}

function updateSaga(rdt) {
  if (G.mapAnim) {
    const a = G.mapAnim, before = a.t;
    a.t += rdt;
    if (before < 0.3 && a.t >= 0.3) {
      const p = nodePos(a.level); Sound.play('pop');
      FX.ring(p.x, p.y - SAGA.scroll, 10, 70, THEMES[LEVELS[a.level - 1].world].flow, 0.6, 4);
      FX.shards(p.x, p.y - SAGA.scroll, THEMES[LEVELS[a.level - 1].world].flow, 16, 200, 4);
    }
    if (a.t > 1.2) G.mapAnim = null;
  }
  if (!SAGA.drag) {
    if (SAGA.target != null) {
      SAGA.scroll += (SAGA.target - SAGA.scroll) * Math.min(1, rdt * 6);
      if (Math.abs(SAGA.target - SAGA.scroll) < 0.5) SAGA.target = null;
    } else if (Math.abs(SAGA.vel) > 1) {
      SAGA.scroll = clampScroll(SAGA.scroll + SAGA.vel * rdt);
      SAGA.vel *= Math.pow(0.04, rdt);
    }
  }
  FX.update(rdt);
}

// ---------------------------------------------------------- dispatcher
function drawUI(rdt) {
  hits.length = 0;
  if (G.state === 'title') { drawTitle(); drawFlash(); return; }
  if (G.state === 'map') {
    ctx.fillStyle = '#05040c'; ctx.fillRect(0, 0, LW, LH);
    drawSaga(rdt);
    FX.draw();
    drawMapHud();
    drawCard(rdt);
    return;
  }
  drawPlayUI();
  drawFlash();
}
