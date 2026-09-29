// =====================================================================
//  MAIN LOOP + INPUT
// =====================================================================
function toLogical(ev) {
  const r = cvs.getBoundingClientRect();
  return { x: (ev.clientX - r.left) / SCALE, y: (ev.clientY - r.top) / SCALE };
}
cvs.addEventListener('pointerdown', ev => {
  ev.preventDefault();
  Sound.init();
  const p = toLogical(ev);
  if (G.state === 'map' && !SAGA.card) {          // the level map scrolls with a drag
    SAGA.drag = { id: ev.pointerId, y0: p.y, s0: SAGA.scroll, x: p.x, y: p.y, moved: false, ly: p.y, lt: performance.now() };
    SAGA.vel = 0; SAGA.target = null;
    try { cvs.setPointerCapture(ev.pointerId); } catch (e) {}
    return;
  }
  G.pointerType = ev.pointerType;
  handleTap(p.x, p.y);
  if (G.press) { G.press.pid = ev.pointerId; try { cvs.setPointerCapture(ev.pointerId); } catch (e) {} }
}, { passive: false });
cvs.addEventListener('pointermove', ev => {
  if (G.press && G.press.pid === ev.pointerId) { const p = toLogical(ev); pressMove(p.x, p.y); return; }
  const d = SAGA.drag; if (!d || d.id !== ev.pointerId) return;
  const p = toLogical(ev), now = performance.now();
  if (Math.abs(p.y - d.y0) > 7) d.moved = true;
  if (d.moved) {
    SAGA.scroll = clampScroll(d.s0 - (p.y - d.y0));
    const dt = Math.max(1, now - d.lt);
    SAGA.vel = lerp(SAGA.vel, -(p.y - d.ly) / dt * 1000, 0.5);
  }
  d.ly = p.y; d.lt = now;
});
const endDrag = ev => {
  if (G.press && G.press.pid === ev.pointerId) {
    if (ev.type === 'pointercancel') { G.press = null; if (G.menu) G.menu.sel = null; return; }
    const p = toLogical(ev); pressEnd(p.x, p.y); return;
  }
  const d = SAGA.drag; if (!d || d.id !== ev.pointerId) return;
  SAGA.drag = null;
  if (!d.moved) handleTap(d.x, d.y);
  else if (performance.now() - d.lt > 80) SAGA.vel = 0;
};
cvs.addEventListener('pointerup', endDrag);
cvs.addEventListener('pointercancel', endDrag);
cvs.addEventListener('wheel', ev => { if (G.state === 'map' && !SAGA.card) { ev.preventDefault(); SAGA.target = null; SAGA.scroll = clampScroll(SAGA.scroll + ev.deltaY); } }, { passive: false });
cvs.addEventListener('contextmenu', ev => ev.preventDefault());

window.addEventListener('keydown', ev => {
  if (G.state !== 'play' || G.over) return;
  if (ev.code === 'Space') { ev.preventDefault(); if (G.awaiting) startWave(false); else if (G.nextTimer !== null) startWave(true); }
  else if (ev.key === 'p' || ev.key === 'Escape') { G.paused = !G.paused; G.menu = null; G.confirm = null; }
  else if (ev.key === 'm') { Sound.setMuted(!Sound.muted); saveMute(); }
  else if (ev.key === 'f') G.speed = G.speed === 1 ? 2 : 1;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (G.state === 'play' && !G.over) { G.paused = true; G.menu = null; } Sound.suspend(); }
  else Sound.resume();
});

// Watch the frame time during play. It learns this device's normal speed at the start of a level
// (so a phone capped at 30fps isn't mistaken for a slow one) and steps quality down if a busy wave
// keeps it well below that: fewer particles first, then fewer pixels.
function tuneQuality(rdt) {
  const Q = QUALITY;
  if (G.state !== 'play' || G.paused || G.over || document.hidden || rdt <= 0) return;
  Q.t += rdt; Q.ema += (rdt * 1000 - Q.ema) * 0.06;
  if (Q.t < 2.5) { Q.base = Q.ema; return; }
  if (Q.ema > Math.max(24, Q.base * 1.35)) Q.slow += rdt; else Q.slow = Math.max(0, Q.slow - rdt * 0.5);
  if (Q.slow > 1.2) {
    Q.slow = 0; Q.ema = Q.base;
    if (Q.fx > 0.5) Q.fx = 0.5;
    else if (DPR > 1.01) { Q.dpr = Math.max(1, DPR - 0.25); layout(); }
  }
}
let lastT = performance.now();
function frame(now) {
  const rdt = Math.min(0.05, Math.max(0, (now - lastT) / 1000)); lastT = now;
  tuneQuality(rdt);
  G.clock += rdt;
  const k = DPR * SCALE;
  if (G.state === 'map') {
    updateSaga(rdt);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    drawUI(rdt);
    requestAnimationFrame(frame);
    return;
  }
  let ts = 1; if (G.slowT > 0) { G.slowT -= rdt; ts = 0.3; }
  const running = G.state === 'title' || (G.state === 'play' && !G.paused);
  const gdt = running ? rdt * ts * (G.state === 'play' ? G.speed : 1) : 0;
  if (gdt > 0) {
    const steps = Math.max(1, Math.ceil(gdt / (1 / 60)));
    for (let i = 0; i < steps; i++) update(gdt / steps);
  }
  if (G.state === 'play' && G.over) { G.endT -= rdt; if (G.endT <= 0) { G.state = 'end'; G.endShow = 0; G.unlockSnd = false; } }
  if (G.state === 'end') G.endShow += rdt;
  updateVisuals(G.state === 'end' ? rdt * ts : gdt, rdt);
  if (G.menu) G.menu.t = Math.min(1, G.menu.t + rdt * 7);
  drawWorld();
  ctx.setTransform(k, 0, 0, k, 0, 0);
  drawUI(rdt);
  requestAnimationFrame(frame);
}

// ---- boot ------------------------------------------------------------
function snapshot() { return { muted: Sound.muted }; }
function start(data) {
  data = data || {};
  Save.load();
  try { if (localStorage.getItem('shatterline.muted') === '1') Sound.setMuted(true); } catch (e) {}
  if (data.muted) Sound.setMuted(true);
  G.theme = LEVELS[Save.d.max - 1].world;
  layout();
  startDemo(); G.state = 'title';
  buildBackground(theme());
  window.addEventListener('resize', () => { layout(); if (G.state !== 'map') buildBackground(theme()); SAGA.deco = null; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => buildBackground(theme()));
  requestAnimationFrame(frame);
}
try { window.claude && window.claude.hot && window.claude.hot.snapshot && window.claude.hot.snapshot(snapshot); } catch (e) {}
if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
else start((window.claude && window.claude.hot && window.claude.hot.data) || {});

// handles for automated playtests
window.__TD = { G, Save, LEVELS, startLevel, buildTower, upgradeTower, sellTower, upgradeCost, startWave, update, isBuildable, MAP, TOWERS, ENEMIES, ECON, LEVEL_CAL, toMap, openCard };
