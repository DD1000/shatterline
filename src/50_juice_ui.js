// =====================================================================
//  JUICE OVERLAYS (screen space): combo, shouts, banners, toasts, flash
// =====================================================================
function setFont(size, face = FONT_UI, weight = 700) { ctx.font = `${weight} ${size}px ${face}`; }
function spacing(px) { if ('letterSpacing' in ctx) ctx.letterSpacing = (LANG === 'zh' ? px * 0.25 : px) + 'px'; }
// Glowing titles are rendered once (shadowBlur is very slow) and then drawn as a cached image.
const glowTextCache = new Map();
function glowText(str, x, y, size, color, face = FONT_D, blur = 14) {
  const k = DPR * SCALE, ls = ('letterSpacing' in ctx && ctx.letterSpacing) || '0px', sz = Math.round(size * 2) / 2;
  const key = k.toFixed(2) + '|' + face + '|' + sz + '|' + color + '|' + blur + '|' + ls + '|' + str;
  let c = glowTextCache.get(key);
  if (!c) {
    if (glowTextCache.size > 240) glowTextCache.clear();
    const cv = document.createElement('canvas'), g = cv.getContext('2d'), f = `400 ${sz}px ${face}`;
    g.font = f; if ('letterSpacing' in g) g.letterSpacing = ls;
    const pad = blur / k * 2.2 + 4, w = Math.ceil(g.measureText(str).width + pad * 2), h = Math.ceil(sz * 1.4 + pad * 2);
    cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k);
    g.scale(k, k); g.font = f; if ('letterSpacing' in g) g.letterSpacing = ls; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = color; g.shadowBlur = blur;                 // device pixels, same as before
    g.fillStyle = color; g.fillText(str, w / 2, h / 2);
    g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,0.85)'; g.globalAlpha = 0.55; g.fillText(str, w / 2, h / 2);
    c = { cv, w, h }; glowTextCache.set(key, c);
  }
  ctx.drawImage(c.cv, x - c.w / 2, y - c.h / 2, c.w, c.h);
  setFont(size, face, 400); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
}

function drawCombo() {
  if (G.combo < 3 || G.comboT <= 0) return;
  const cx = MAP_X + W / 2, cy = HUD_H + 24;
  const a = Math.min(1, G.comboT / 0.4);
  const hue = (190 + G.combo * 9) % 360, col = `hsl(${hue},100%,66%)`;
  ctx.save(); ctx.globalAlpha = a;
  const s = 22 + Math.min(14, G.combo * 0.25) + G.comboPop * 9;
  glowText(`x${G.combo}`, cx, cy, s, col, FONT_D, 16);
  setFont(9, FONT_UI); spacing(3); ctx.fillStyle = 'rgba(235,235,255,0.8)'; ctx.fillText(tr('combo'), cx, cy + s * 0.62 + 2); spacing(0);
  const w = 54 * Math.max(0, G.comboT / 1.6);
  ctx.fillStyle = col; ctx.fillRect(cx - w / 2, cy + s * 0.62 + 10, w, 2);
  ctx.restore();
}

function drawShout() {
  const b = G.shout; if (!b) return;
  const f = b.t / b.dur, cx = MAP_X + W / 2, cy = MAP_Y + ROWS * TILE * (G.banner ? 0.24 : 0.36);
  const inT = Math.min(1, b.t / 0.18), a = f > 0.75 ? (1 - f) / 0.25 : 1;
  const s = 30 * (0.6 + 0.4 * easeOutBack(inT));
  ctx.save(); ctx.globalAlpha = a;
  glowText(b.text, cx, cy, s, b.color, FONT_D, 22);
  if (b.sub) { setFont(11, FONT_UI); spacing(2); ctx.fillStyle = '#ffffff'; ctx.fillText(b.sub, cx, cy + 26); spacing(0); }
  ctx.restore();
}

function drawBanner() {
  const b = G.banner; if (!b) return;
  const t = b.t, d = b.dur, cy = MAP_Y + ROWS * TILE * 0.5;
  let off = 0;
  if (t < 0.3) off = (1 - easeOut(t / 0.3)) * LW; else if (t > d - 0.3) off = -easeOut((t - (d - 0.3)) / 0.3) * LW;
  const a = t < 0.15 ? t / 0.15 : t > d - 0.15 ? (d - t) / 0.15 : 1;
  ctx.save(); ctx.globalAlpha = Math.max(0, a);
  ctx.fillStyle = 'rgba(5,4,14,0.72)'; ctx.fillRect(0, cy - 34, LW, 68);
  ctx.fillStyle = hexA(b.color[0] === '#' ? b.color : '#ffffff', 0.9); ctx.fillRect(0, cy - 34, LW, 1.5); ctx.fillRect(0, cy + 32.5, LW, 1.5);
  glowText(b.text, LW / 2 + off, cy - (b.sub ? 6 : 0), 30, b.color, FONT_D, 18);
  if (b.sub) { setFont(11, FONT_UI); spacing(4); ctx.fillStyle = '#ffffff'; ctx.fillText(b.sub, LW / 2 - off * 0.6, cy + 20); spacing(0); }
  ctx.restore();
}

function drawToast() {
  const b = G.toast; if (!b) return;
  const f = b.t / b.dur, a = f < 0.1 ? f / 0.1 : f > 0.8 ? (1 - f) / 0.2 : 1;
  const cy = LH - BAR_H - 30 - easeOut(Math.min(1, b.t / 0.3)) * 8;
  ctx.save(); ctx.globalAlpha = a;
  setFont(14, FONT_UI); spacing(2);
  const w = ctx.measureText(b.text).width + 28;
  roundRect(LW / 2 - w / 2, cy - 14, w, 28, 14); ctx.fillStyle = 'rgba(5,4,14,0.8)'; ctx.fill();
  ctx.lineWidth = 1.2; ctx.strokeStyle = b.color; ctx.stroke();
  ctx.fillStyle = b.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.text, LW / 2, cy + 1);
  spacing(0); ctx.restore();
}

function drawFlash() {
  if (G.flashA <= 0) return;
  ctx.fillStyle = hexA(G.flashCol, G.flashA * 0.5); ctx.fillRect(0, 0, LW, LH);
}

function drawGoldCounter(x, y) {
  const b = G.goldBump;
  drawCoin(x, y, 7 + b * 2.5);
  setFont(19 + b * 3, FONT_UI); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = b > 0.1 ? '#fff7cf' : '#ffe38a';
  ctx.fillText(String(Math.floor(G.dispGold)), x + 14, y + 1);
}

// Price tag: solid gold when you can afford it, dark red when you can't
function costPill(cx, cy, cost, afford, size = 12) {
  setFont(size, FONT_UI, 700);
  const txt = String(cost), tw = ctx.measureText(txt).width, w = tw + size + 14, h = size + 7;
  const x = cx - w / 2, y = cy - h / 2;
  if (afford) { additive(true); glow(cx, cy, w * 0.7, '#ffd23d', 0.35); additive(false); }
  roundRect(x, y, w, h, h / 2);
  ctx.fillStyle = afford ? '#ffd23d' : '#3a0f18'; ctx.fill();
  ctx.lineWidth = 1.2; ctx.strokeStyle = afford ? '#fff3b0' : '#ff5a6a'; ctx.stroke();
  // coin mark
  const ix = x + h / 2 + 1, ir = size * 0.34;
  polyPath(ix, cy, ir, 6, 0);
  ctx.lineWidth = 1.4; ctx.strokeStyle = afford ? '#5a3d00' : '#ff5a6a'; ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = afford ? '#1b1203' : '#ffa3ad';
  ctx.fillText(txt, ix + ir + 4, cy + 0.5);
}
