// =====================================================================
//  WORLD RENDER (map space)
// =====================================================================
function layout() {
  const rect = cvs.getBoundingClientRect();
  const vw = Math.max(1, rect.width), vh = Math.max(1, rect.height);
  DPR = Math.min(2, window.devicePixelRatio || 1, QUALITY.dpr);
  glyphCache.clear(); textCache.clear(); if (typeof glowTextCache !== 'undefined') glowTextCache.clear();   // sprites are per pixel density
  cvs.width = Math.round(vw * DPR); cvs.height = Math.round(vh * DPR);
  SCALE = Math.min(vw / W, vh / MIN_H);
  LW = vw / SCALE; LH = vh / SCALE;
  MAP_X = (LW - W) / 2;
  const avail = LH - HUD_H - BAR_H;
  MAP_Y = HUD_H + Math.max(0, (avail - ROWS * TILE) / 2);
  buildBackground(theme());
}

let drawMenuUnder = null;   // hook: the UI draws range previews under towers

function drawWorld() {
  const th = theme(), k = DPR * SCALE;
  const sh = G.shake * G.shake * 10, sx = rand(-sh, sh), sy = rand(-sh, sh);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = th.bg; ctx.fillRect(0, 0, cvs.width, cvs.height);
  ctx.drawImage(bgCanvas, sx * k, sy * k);
  ctx.setTransform(k, 0, 0, k, (MAP_X + sx) * k, (MAP_Y + sy) * k);

  drawPathFlow(th, G.time);
  if ((G.level && G.level.air) || G.enemies.some(e => e.rc.flying)) drawFlightLines(G.time);
  drawPortals(G.time, G.portalPulse);
  drawCore(G.time, G.demo ? G.maxLives : G.lives, G.maxLives, G.coreHit);
  if (drawMenuUnder) drawMenuUnder();

  // beacon links
  for (const b of G.towers) {
    if (b.type !== 'beacon') continue;
    const L = TOWERS.beacon.lv[b.lv];
    for (const t of G.towers) {
      if (t === b || t.buff <= 0 || (t.c - b.c) ** 2 + (t.r - b.r) ** 2 > L.range * L.range + 1e-6) continue;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(t.x, t.y);
      ctx.setLineDash([2, 5]); ctx.lineDashOffset = -G.time * 20;
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(244,240,255,0.45)'; ctx.stroke(); ctx.setLineDash([]);
    }
  }
  for (const tw of G.towers) {
    const sp = tw.spawn;
    const charge = tw.type === 'mint' && !G.awaiting && G.waveNum > 0 ? 1 - clamp(tw.cd / TOWERS.mint.lv[tw.lv].every, 0, 1) : null;
    drawTowerGlyph(tw.type, tw.x, tw.y, { lv: tw.lv, aim: tw.aim, kick: tw.kick, t: G.time, heat: tw.heat, charge, scale: 1 + (1 - easeOut(sp)) * 0.8, alpha: Math.min(1, sp * 1.5) });
    if (tw.buff > 0) { ctx.beginPath(); ctx.arc(tw.x + 12, tw.y - 12, 3, 0, TAU); ctx.fillStyle = '#f4f0ff'; ctx.fill(); }
  }
  // nova shell shadows
  for (const s of G.shells) {
    ctx.beginPath(); ctx.ellipse(s.x, s.y, 6 * (1 - s.h / 70), 3 * (1 - s.h / 70), 0, 0, TAU);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
  }
  // Aegis domes: a soft bubble that travels with the Aegis (drawn under the enemies)
  for (const a of G.enemies) {
    if (!a.alive || !a.domeMax || a.domeDead) continue;
    const f = a.dome / a.domeMax;
    const R = a.rc.dome.r * TILE * (a.age < 0.4 ? easeOutBack(a.age / 0.4) : 1), ping = Math.max(0, a.domePing || 0) * 6;
    if (f <= 0) {                                           // broken: faint outline while it regrows
      ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.arc(a.x, a.y, R, 0, TAU);
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(159,214,255,0.25)'; ctx.stroke(); ctx.setLineDash([]);
      continue;
    }
    const gr = ctx.createRadialGradient(a.x, a.y, R * 0.2, a.x, a.y, R);
    gr.addColorStop(0, 'rgba(74,168,255,0)'); gr.addColorStop(0.75, hexA('#4aa8ff', 0.06 + 0.08 * f + ping * 0.05)); gr.addColorStop(1, hexA('#9fd6ff', 0.18 + 0.2 * f + ping * 0.1));
    ctx.beginPath(); ctx.arc(a.x, a.y, R, 0, TAU); ctx.fillStyle = gr; ctx.fill();
    ctx.lineWidth = 1.2 + 1.8 * f + ping; ctx.strokeStyle = hexA(ping > 0 ? '#ffffff' : '#9fd6ff', 0.35 + 0.5 * f); ctx.stroke();
    // slowly turning hex rim, so it reads as a force field rather than a range circle
    const t = G.time * 0.6 + a.id;
    ctx.lineWidth = 1; ctx.strokeStyle = hexA('#9fd6ff', 0.25 + 0.35 * f);
    for (let i = 0; i < 12; i++) {
      const an = t + i * TAU / 12;
      polyPath(a.x + Math.cos(an) * R * 0.86, a.y + Math.sin(an) * R * 0.86, 4.5, 6, an); ctx.stroke();
    }
  }
  // all ground-enemy glows in one additive pass, then the bodies
  additive(true);
  for (const e of G.enemies) {
    if (e.rc.flying) continue;
    const sc = (e.age < 0.3 ? easeOutBack(e.age / 0.3) : 1) * (1 + e.punch * 0.5);
    if (sc > 0.01) glow(e.x, e.y, e.rc.r * sc * (e.rc.boss ? 3.4 : 3.0), e.rc.color, e.rc.boss ? 0.8 : 0.7);
  }
  additive(false);
  for (const e of G.enemies) {
    const sp = e.age < 0.3 ? easeOutBack(e.age / 0.3) : 1;
    drawGlyph(e.rc, e.x, e.y, { rot: e.rot, rot2: e.rot2, scale: sp * (1 + e.punch * 0.5), flash: e.flash, dir: e.dir, t: G.time + e.id, blink: e.blink > 0, frozen: e.slowT > 0, shield: e.shieldMax ? e.shield / e.shieldMax : 0, ping: e.shieldPing, fast: true, noGlow: !e.rc.flying });
    if (e.hp < e.maxHp && !e.rc.boss) {
      const w = Math.max(14, e.rc.r * 2.2), f = Math.max(0, e.hp / e.maxHp), y = e.y - e.rc.r - 7;
      ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(e.x - w / 2 - 1, y - 1, w + 2, 4);
      ctx.fillStyle = e.rc.color; ctx.fillRect(e.x - w / 2, y, w * f, 2);
    }
  }
  // prism beams
  additive(true);
  ctx.lineCap = 'round';
  for (const tw of G.towers) {
    const tg = tw.beamT;
    if (tw.type !== 'prism' || !tg || !tg.alive) continue;
    const h = tw.heat, c = TOWERS.prism.color, fl = 0.8 + Math.random() * 0.2;
    ctx.beginPath(); ctx.moveTo(tw.x, tw.y); ctx.lineTo(tg.x, tg.y);
    ctx.globalAlpha = 0.3 * fl; ctx.lineWidth = 6 + h * 8; ctx.strokeStyle = c; ctx.stroke();
    ctx.globalAlpha = fl; ctx.lineWidth = 2 + h * 3; ctx.stroke();
    ctx.lineWidth = 1 + h; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.globalAlpha = 1;
    glow(tg.x, tg.y, 12 + h * 12, c, 0.8);
  }
  ctx.lineCap = 'butt';
  // bolts
  for (const s of G.shots) {
    const n = Math.hypot(s.vx, s.vy) || 1, bx = s.x - s.vx / n * (s.crit ? 16 : 11), by = s.y - s.vy / n * (s.crit ? 16 : 11);
    const c = s.crit ? '#fff36a' : s.color;
    glow(s.x, s.y, s.crit ? 14 : 9, c, 0.8);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(s.x, s.y);
    ctx.lineWidth = s.crit ? 4 : 3; ctx.strokeStyle = c; ctx.stroke();
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.lineCap = 'butt';
  }
  for (const m of G.missiles) {
    const a = Math.atan2(m.vy, m.vx), cx = Math.cos(a), cy = Math.sin(a);
    glow(m.x, m.y, 11, m.color, 0.8);
    ctx.beginPath(); ctx.moveTo(m.x + cx * 5, m.y + cy * 5); ctx.lineTo(m.x - cx * 4 - cy * 2.5, m.y - cy * 4 + cx * 2.5); ctx.lineTo(m.x - cx * 4 + cy * 2.5, m.y - cy * 4 - cx * 2.5); ctx.closePath();
    ctx.fillStyle = '#ffe4e0'; ctx.fill();
  }
  for (const s of G.shells) {
    const y = s.y - s.h;
    glow(s.x, y, 16, s.color, 0.9);
    ctx.beginPath(); ctx.arc(s.x, y, 3.2, 0, TAU); ctx.fillStyle = '#fff4e0'; ctx.fill();
  }
  additive(false);
  FX.draw();
}

function drawCoins() {
  for (const c of G.coins) if (c.t >= 0) drawCoin(c.x, c.y, 4.2, 1);
}

// Air Raid levels: dotted flight lines from each portal straight to the core
function drawFlightLines(t) {
  ctx.save();
  for (const f of MAP.flights) {
    const a = f.start, b = f.end, ang = Math.atan2(b.y - a.y, b.x - a.x), len = f.len;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.setLineDash([2, 8]); ctx.lineDashOffset = -t * 25;
    ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(159,232,255,0.35)'; ctx.stroke(); ctx.setLineDash([]);
    for (let d = (t * 40) % 60; d < len - 20; d += 60) {         // drifting chevrons show the direction
      const p = f.at(d), cx = Math.cos(ang), cy = Math.sin(ang);
      ctx.beginPath();
      ctx.moveTo(p.x - cx * 4 - cy * 5, p.y - cy * 4 + cx * 5); ctx.lineTo(p.x + cx * 3, p.y + cy * 3); ctx.lineTo(p.x - cx * 4 + cy * 5, p.y - cy * 4 - cx * 5);
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(159,232,255,0.45)'; ctx.stroke();
    }
  }
  ctx.restore();
}
