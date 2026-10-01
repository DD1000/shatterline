# v43 (user): AUTO BUILD. After a loss, starting that level again asks "AUTO BUILD UNTIL WAVE…" (a wave grid with each
# wave's enemies as a memory aid), then replays the last try's tower actions and wave calls at the same moments and tiles
# until the chosen wave begins.
import sys
p = 'shatterline.html'; s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit(f'anchor count {c} != {n}: {a[:90]!r}')
    s = s.replace(a, b)

rep("const BUILD = 'v42';", "const BUILD = 'v43';")

# ---- recording ----------------------------------------------------------------------------------------------------
rep("""  G.run = newRun();
  FX.clear();
}""", """  G.run = newRun();
  G.rec = []; G.waveT0 = 0; G.replay = null; G.autoAsk = null;     // v43: auto build (record this run, no replay yet)
  FX.clear();
}""")
rep("  G.awaiting = false; G.nextTimer = null; G.waveNum++;", "  G.awaiting = false; G.nextTimer = null; G.waveNum++; G.waveT0 = G.time;")
rep("""  if (type === 'arc' && G.level && G.level.rain) lightningStrike(tw);
  return tw;
}""", """  if (type === 'arc' && G.level && G.level.rain) lightningStrike(tw);
  recAct('b', { type, c, r });
  return tw;
}""")
rep("""  G.gold -= cost; G.spent = (G.spent || 0) + cost; tw.lv++; tw.spent += cost; tw.kick = 1;""",
    """  G.gold -= cost; G.spent = (G.spent || 0) + cost; tw.lv++; tw.spent += cost; tw.kick = 1;
  recAct('u', { c: tw.c, r: tw.r, type: tw.type });""")
rep("""function sellTower(tw) {
  const v = sellValue(tw);""", """function sellTower(tw) {
  recAct('s', { c: tw.c, r: tw.r, type: tw.type });
  const v = sellValue(tw);""")
rep("""    tw.dir = (tw.dir + 1) % 4; tw.aim = railAngle(tw.dir); tw.kick = 1;""",
    """    tw.dir = (tw.dir + 1) % 4; tw.aim = railAngle(tw.dir); tw.kick = 1; recAct('t', { c: tw.c, r: tw.r, type: tw.type, dir: tw.dir });""")
rep("""    tw.mode = MODES[(MODES.indexOf(tw.mode) + 1) % MODES.length]; tw.target = null;""",
    """    tw.mode = MODES[(MODES.indexOf(tw.mode) + 1) % MODES.length]; tw.target = null; recAct('m', { c: tw.c, r: tw.r, type: tw.type, mode: tw.mode });""")
rep("tr('start'), '#7dffb0', () => startWave(false), {", "tr('start'), '#7dffb0', () => playerWave(false), {")
rep("tr('next_wave'), theme().flow, () => startWave(true), {", "tr('next_wave'), theme().flow, () => playerWave(true), {")
rep("  if (ev.code === 'Space') { ev.preventDefault(); if (G.awaiting) startWave(false); else if (G.nextTimer !== null) startWave(true); }",
    "  if (G.autoAsk) return;\n  if (ev.code === 'Space') { ev.preventDefault(); if (G.awaiting) playerWave(false); else if (G.nextTimer !== null) playerWave(true); }")

# ---- save the run on a loss, forget it on a win --------------------------------------------------------------------------
rep("""  recordRun(win ? 'win' : 'lose');""", """  recordRun(win ? 'win' : 'lose');
  saveReplay(n, win);""")

# ---- ask at the start of the level --------------------------------------------------------------------------------------
rep("""  G.tutorial = n === 1 && Save.stars(1) === 0;
  G.state = 'play';""", """  G.tutorial = n === 1 && Save.stars(1) === 0;
  const RP = (Save.d.replays || {})[n];              // v43: lost here last time? offer to rebuild that try
  G.autoAsk = RP && RP.rec && RP.rec.length && RP.reached >= 1 ? { R: RP, sel: Math.min(RP.reached, G.waves.length) } : null;
  G.state = 'play';""")
rep("  const running = G.state === 'title' || G.state === 'lab' || (G.state === 'play' && !G.paused);",
    "  const running = G.state === 'title' || G.state === 'lab' || (G.state === 'play' && !G.paused && !G.autoAsk);")
rep("  G.time += dt; DMG_SRC = null;", "  G.time += dt; DMG_SRC = null;\n  if (G.replay) replayStep();")
rep("""  drawMenu();
  drawTutorial();""", """  drawReplayPill();
  drawMenu();
  drawTutorial();""")
rep("""  else if (G.paused && G.pauseMenu) { if (G.langPick) drawLangOverlay(); else drawPause(); }
}""", """  else if (G.paused && G.pauseMenu) { if (G.langPick) drawLangOverlay(); else drawPause(); }
  if (G.autoAsk && G.state === 'play') drawAutoAsk();
}""")

# ---- the engine and the screens ------------------------------------------------------------------------------------------
ENGINE = r"""
// =====================================================================
//  AUTO BUILD (v43, user). Every tower action (build, upgrade, sell, rail turn, target mode) and every wave you call is
//  recorded, anchored to the wave it happened in: w = the wave number then, t = seconds since that wave began (before
//  wave 1: since the level began). Lose, start the level again, pick a wave, and the replay repeats those actions at the
//  same moments on the same tiles until that wave begins. It waits when gold is short, and skips an action whose tile is
//  taken, whose tower is gone or not in your loadout. What it builds is recorded again, so a longer next try keeps it all.
// =====================================================================
function recAct(k, o) {
  if (G.demo || !G.level || !G.rec || G.over) return;
  G.rec.push(Object.assign({ k, w: G.waveNum, t: Math.round((G.time - (G.waveT0 || 0)) * 100) / 100 }, o));
}
function playerWave(early) {
  if (G.autoAsk || G.over || G.waveNum >= G.waves.length) return;
  recAct('w', { early: !!early });
  startWave(early);
}
function saveReplay(n, win) {
  const all = Save.d.replays || (Save.d.replays = {});
  if (win) { if (all[n]) { delete all[n]; Save.store(); } return; }
  if (!G.rec || !G.rec.length) return;
  all[n] = { rec: G.rec.slice(), reached: G.waveNum, waves: G.waves.length, at: Date.now() };
  Object.keys(all).sort((a, b) => all[b].at - all[a].at).slice(5).forEach(k => delete all[k]);   // the 5 latest levels
  Save.store();
}
// an action belongs to the replay if it happened before wave `until` began (the call that starts `until` is yours)
const replayStops = (a, until) => a.w >= until || (a.k === 'w' && a.w >= until - 1);
function beginReplay(until) {
  const A = G.autoAsk; if (!A) return;
  G.replay = { rec: A.R.rec.slice(), until, i: 0, wait: false };
  G.autoAsk = null; Sound.play('tap');
}
function endReplay(msg) {
  G.replay = null;
  G.toast = { text: tr(msg), color: '#7dffb0', t: 0, dur: 2 };
}
function replayStep() {
  const R = G.replay; if (!R || G.over) return;
  for (let guard = 0; guard < 40; guard++) {
    if (R.i >= R.rec.length) { endReplay('auto_done'); return; }
    const a = R.rec[R.i];
    if (replayStops(a, R.until)) { endReplay('auto_done'); return; }
    const due = G.waveNum > a.w || (G.waveNum === a.w && G.time - G.waveT0 >= a.t - 1e-6);
    if (!due) { R.wait = false; return; }
    const res = replayDo(a);
    R.wait = res === 'gold';
    if (res === 'gold' || res === 'later') return;
    R.i++;
  }
}
// 'ok' done, 'skip' can't be done (moved on), 'gold' not enough gold yet, 'later' the wave can't be called yet
function replayDo(a) {
  const at = G.grid[a.r * COLS + a.c];
  const mine = at && at.type === a.type ? at : null;
  if (a.k === 'b') {
    if (!G.loadout.includes(a.type) || at || !isBuildable(a.c, a.r)) return 'skip';
    if (G.gold < TOWERS[a.type].cost) return 'gold';
    const tw = buildTower(a.type, a.c, a.r); if (tw) FX.text(tw.x, tw.y - 24, tr('auto_tag'), '#7dffb0', 9, { font: FONT_D, life: 0.7 });
    return 'ok';
  }
  if (a.k === 'u') {
    const cost = mine && upgradeCost(mine);
    if (cost == null) return 'skip';
    if (G.gold < cost) return 'gold';
    upgradeTower(mine); return 'ok';
  }
  if (a.k === 's') { if (!mine) return 'skip'; sellTower(mine); return 'ok'; }
  if (a.k === 't') { if (!mine) return 'skip'; mine.dir = a.dir; mine.aim = railAngle(a.dir); recAct('t', { c: a.c, r: a.r, type: a.type, dir: a.dir }); return 'ok'; }
  if (a.k === 'm') { if (!mine) return 'skip'; mine.mode = a.mode; mine.target = null; recAct('m', { c: a.c, r: a.r, type: a.type, mode: a.mode }); return 'ok'; }
  if (a.k === 'w') {
    if (G.waveNum !== a.w) return 'skip';
    if (G.awaiting) { playerWave(false); return 'ok'; }
    if (G.nextTimer !== null) { playerWave(true); return 'ok'; }
    return 'later';
  }
  return 'skip';
}
// what a replay until `until` would do
function replayCounts(rec, until) {
  const c = { b: 0, u: 0, s: 0, miss: new Set() };
  for (const a of rec) {
    if (replayStops(a, until)) break;
    if (c[a.k] != null) c[a.k]++;
    if (a.k === 'b' && !G.loadout.includes(a.type)) c.miss.add(a.type);
  }
  return c;
}
// a wave's enemies, biggest threats first (bosses, then the largest groups)
function waveLineup(w) {
  const m = new Map();
  for (const [type, count] of G.waves[w - 1] || []) m.set(type, (m.get(type) || 0) + count);
  const score = ([t, n]) => (ENEMIES[t].boss ? 1e6 : 0) + n;
  return [...m.entries()].sort((a, b) => score(b) - score(a));
}
function drawAutoAsk() {
  const A = G.autoAsk, R = A.R, N = G.waves.length, reach = Math.min(R.reached, N);
  dim(0.9); blocker();
  const cx = LW / 2, cw = Math.min(360, LW - 16), x0 = cx - cw / 2;
  const cols = 5, rows = Math.ceil(N / cols), gap = 6, cellW = (cw - gap * (cols - 1)) / cols;
  const cellH = clamp(Math.floor((LH - 360) / rows) - gap, 38, 58);
  const total = 88 + rows * (cellH + gap) + 92 + 118;
  const y0 = Math.max(8, (LH - total) / 2);
  glowText(tr('auto_title'), cx, y0 + 22, 26, '#7dffb0', FONT_D, 14);
  setFont(11, FONT_UI, 500); ctx.fillStyle = 'rgba(230,230,255,0.8)'; wrapText(tr('auto_sub'), cx, y0 + 50, cw - 16, 14);
  const gy = y0 + 84;
  for (let w = 1; w <= N; w++) {
    const i = w - 1, x = x0 + (i % cols) * (cellW + gap), y = gy + Math.floor(i / cols) * (cellH + gap);
    const ok = w <= reach, sel = w === A.sel, boss = isBossWave(w);
    ctx.save(); ctx.globalAlpha = ok ? 1 : 0.3;
    if (sel) { additive(true); glow(x + cellW / 2, y + cellH / 2, cellW * 0.8, '#7dffb0', 0.35); additive(false); }
    roundRect(x, y, cellW, cellH, 9); ctx.fillStyle = sel ? 'rgba(16,40,28,0.96)' : 'rgba(10,8,26,0.95)'; ctx.fill();
    ctx.lineWidth = sel ? 2.4 : 1.2; ctx.strokeStyle = sel ? '#7dffb0' : boss ? '#ff5a6a' : 'rgba(170,160,255,0.35)'; ctx.stroke();
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; setFont(10, FONT_UI, 700); ctx.fillStyle = sel ? '#7dffb0' : '#ffffff'; ctx.fillText(w, x + 6, y + 10);
    if (w === reach) { ctx.textAlign = 'right'; setFont(7.5, FONT_UI, 700); ctx.fillStyle = '#ff6a78'; ctx.fillText(tr('auto_lost'), x + cellW - 5, y + 10); }
    const gs = waveLineup(w).slice(0, 3), iw = cellW / Math.max(1, gs.length);
    gs.forEach(([type, n], j) => {
      const rc = ENEMIES[type], ex = x + iw * (j + 0.5), ey = y + cellH * 0.52;
      drawGlyph(rc, ex, ey, { rot: G.clock * (rc.spin || 0) * 0.5, rot2: 0, scale: Math.min(0.9, (cellH < 48 ? 6 : 7.5) / rc.r), dir: rc.flying ? -Math.PI / 2 : 0, t: G.clock + j, noGlow: true });
      ctx.textAlign = 'center'; setFont(7.5, FONT_UI, 600); ctx.fillStyle = 'rgba(230,230,255,0.85)'; ctx.fillText('×' + n, ex, y + cellH - 7);
    });
    ctx.restore();
    if (ok) hit(x, y, cellW, cellH, () => { A.sel = w; Sound.play('tap'); });
  }
  // the chosen wave in full, and what the replay will do before it
  const dy = gy + rows * (cellH + gap) + 2, c = replayCounts(R.rec, A.sel);
  roundRect(x0, dy, cw, 84, 10); ctx.fillStyle = 'rgba(10,8,26,0.95)'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(125,255,176,0.5)'; ctx.stroke();
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; setFont(11, FONT_UI, 700); spacing(2); ctx.fillStyle = '#7dffb0'; ctx.fillText(tr('wave', A.sel), x0 + 12, dy + 14); spacing(0);
  ctx.textAlign = 'right'; setFont(9.5, FONT_UI, 600); ctx.fillStyle = 'rgba(230,230,255,0.75)'; ctx.fillText(tr('auto_counts', c.b, c.u, c.s), x0 + cw - 12, dy + 14);
  const all = waveLineup(A.sel), step = Math.min(44, (cw - 20) / Math.max(1, all.length));
  all.forEach(([type, n], j) => {
    const rc = ENEMIES[type], ex = x0 + 10 + step * (j + 0.5), ey = dy + 44;
    drawGlyph(rc, ex, ey, { rot: G.clock * (rc.spin || 0), rot2: G.clock * (rc.inner ? rc.inner.spin : 0), scale: Math.min(1, 10 / rc.r), dir: rc.flying ? -Math.PI / 2 : 0, t: G.clock + j });
    ctx.textAlign = 'center'; setFont(8.5, FONT_UI, 700); ctx.fillStyle = hexA(rc.color, 0.95); ctx.fillText('×' + n, ex, dy + 72);
  });
  if (c.miss.size) { ctx.textAlign = 'center'; setFont(9, FONT_UI, 600); ctx.fillStyle = '#ffb46a'; ctx.fillText(tr('auto_missing', [...c.miss].map(tName).join(', ')), cx, dy + 94); }
  pillButton(cx, dy + 128, Math.min(310, cw), 54, tr('auto_go', A.sel), '#7dffb0', () => beginReplay(A.sel), { pulse: true, size: 16 });
  pillButton(cx, dy + 186, 200, 42, tr('auto_fresh'), theme().flow, () => { G.autoAsk = null; Sound.play('tap'); }, { size: 13 });
}
// while it replays: a pill over the board (tap the X to stop and play it yourself)
function drawReplayPill() {
  const R = G.replay; if (!R || G.over || G.state !== 'play') return;
  const label = tr('auto_pill', R.until) + (R.wait ? '  ·  ' + tr('auto_wait') : '');
  setFont(9.5, FONT_UI, 700); spacing(1.2);
  const room = Math.min(LW, W + 20) - 70, tw0 = ctx.measureText(label).width;
  if (tw0 > room) { spacing(0.4); setFont(Math.max(7, 9.5 * room / (tw0 + 1)), FONT_UI, 700); }      // shrink to fit a narrow screen
  const w = Math.min(ctx.measureText(label).width, room) + 54, h = 26, x = LW / 2 - w / 2, y = Math.max(HUD_H + 26, MAP_Y - 32);
  roundRect(x, y, w, h, 13); ctx.fillStyle = 'rgba(6,24,16,0.92)'; ctx.fill();
  ctx.lineWidth = 1.4; ctx.strokeStyle = hexA('#7dffb0', 0.55 + Math.sin(G.clock * 4) * 0.3); ctx.stroke();
  const ix = x + 15, iy = y + h / 2, a0 = G.clock * 4;             // a turning "replay" arrow
  ctx.beginPath(); ctx.arc(ix, iy, 5.5, a0, a0 + Math.PI * 1.5); ctx.lineWidth = 1.8; ctx.strokeStyle = '#7dffb0'; ctx.stroke();
  const ax = ix + Math.cos(a0 + Math.PI * 1.5) * 5.5, ay = iy + Math.sin(a0 + Math.PI * 1.5) * 5.5;
  ctx.beginPath(); ctx.arc(ax, ay, 2, 0, TAU); ctx.fillStyle = '#7dffb0'; ctx.fill();
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = R.wait ? '#ffd23d' : '#dfffe9'; ctx.fillText(label, x + 26, iy + 0.5); spacing(0);
  const bx = x + w - 14;
  ctx.beginPath(); ctx.arc(bx, iy, 8, 0, TAU); ctx.fillStyle = 'rgba(125,255,176,0.18)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(bx - 3, iy - 3); ctx.lineTo(bx + 3, iy + 3); ctx.moveTo(bx + 3, iy - 3); ctx.lineTo(bx - 3, iy + 3);
  ctx.lineWidth = 1.6; ctx.strokeStyle = '#dfffe9'; ctx.stroke();
  hit(x, y - 4, w, h + 8, () => { endReplay('auto_stopped'); Sound.play('tap'); });
}
"""
rep("// --------------------------------------------------------------- towers\nfunction placeTower(", ENGINE + "\n// --------------------------------------------------------------- towers\nfunction placeTower(")

# ---- strings ---------------------------------------------------------------------------------------------------------
rep("master_bolt: 'MASTER BOLT',",
    "master_bolt: 'MASTER BOLT', auto_title: 'AUTO BUILD', auto_sub: 'Rebuild the towers from your last try, at the same moments and on the same tiles, until wave:', "
    "auto_go: 'AUTO BUILD UNTIL WAVE {0}', auto_fresh: 'START FRESH', auto_lost: 'LOST', auto_counts: '{0} built · {1} upgraded · {2} sold', "
    "auto_pill: 'AUTO BUILD · UNTIL WAVE {0}', auto_wait: 'WAITING FOR GOLD', auto_done: 'AUTO BUILD DONE · YOUR TURN', auto_stopped: 'AUTO BUILD STOPPED', "
    "auto_tag: 'AUTO', auto_missing: 'Not in your loadout (skipped): {0}',")
rep("master_bolt: '大师光弹',",
    "master_bolt: '大师光弹', auto_title: '自动建造', auto_sub: '按上次尝试的时间和位置自动重建你的塔，直到第几波：', "
    "auto_go: '自动建造到第 {0} 波', auto_fresh: '重新开始', auto_lost: '失败', auto_counts: '建造 {0} · 升级 {1} · 出售 {2}', "
    "auto_pill: '自动建造 · 到第 {0} 波', auto_wait: '等待金币', auto_done: '自动建造完成 · 轮到你了', auto_stopped: '已停止自动建造', "
    "auto_tag: '自动', auto_missing: '不在出战栏中（将跳过）：{0}',")
rep("master_bolt: 'RAYO MAESTRO',",
    "master_bolt: 'RAYO MAESTRO', auto_title: 'AUTOCONSTRUCCIÓN', auto_sub: 'Reconstruye las torres de tu último intento, en los mismos momentos y casillas, hasta la oleada:', "
    "auto_go: 'AUTOCONSTRUIR HASTA LA OLEADA {0}', auto_fresh: 'EMPEZAR DE CERO', auto_lost: 'PERDIDA', auto_counts: '{0} torres · {1} mejoras · {2} vendidas', "
    "auto_pill: 'AUTOCONSTRUCCIÓN · HASTA OLEADA {0}', auto_wait: 'ESPERANDO ORO', auto_done: 'AUTOCONSTRUCCIÓN LISTA · TE TOCA', auto_stopped: 'AUTOCONSTRUCCIÓN DETENIDA', "
    "auto_tag: 'AUTO', auto_missing: 'No están en tu equipo (se omiten): {0}',")

open(p, 'w', encoding='utf-8').write(s); print('ok')
