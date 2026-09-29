// =====================================================================
//  GLOWFORMS RENDERER: recipes -> glowing geometry
// =====================================================================
const cvs = document.getElementById('game');
let ctx = cvs.getContext('2d');          // `let`: sprite builders briefly point it at an offscreen canvas
let DPR = 1, SCALE = 1, LW = W, LH = MIN_H, MAP_X = 0, MAP_Y = HUD_H;
const TAU = Math.PI * 2;
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const CJK = '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei"';
const FONT_D = `"Bungee", ${CJK}, "Arial Black", Impact, sans-serif`;
const FONT_UI = `"Chakra Petch", ${CJK}, "Trebuchet MS", system-ui, sans-serif`;

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutBack = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeOut = t => 1 - Math.pow(1 - t, 3);

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}
function mixHex(a, b, t) {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(x >> 16 & 255, y >> 16 & 255, t));
  const g = Math.round(lerp(x >> 8 & 255, y >> 8 & 255, t));
  const bl = Math.round(lerp(x & 255, y & 255, t));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}

// ---- Performance -------------------------------------------------------------------
// QUALITY adapts to the device: if frames get slow during a level, first thin out particle
// effects, then render at a lower pixel density (sharp phones draw up to 4x the pixels).
const QUALITY = { dpr: 2, fx: 1, ema: 16, base: 16, t: 0, slow: 0 };

// Floating text is drawn from cached sprites: font parsing, stroking and filling text every
// frame was one of the most expensive things on screen.
const textCache = new Map();
function textSprite(str, size, color, font, outline) {
  const k = DPR * SCALE * 1.25, key = k.toFixed(2) + '|' + font + '|' + size + '|' + color + '|' + (outline ? 1 : 0) + '|' + str;
  let c = textCache.get(key);
  if (c) return c;
  if (textCache.size > 500) textCache.clear();
  const cv = document.createElement('canvas'), g = cv.getContext('2d'), f = `700 ${size}px ${font}`;
  g.font = f;
  const w = Math.ceil(g.measureText(str).width) + 8, h = Math.ceil(size * 1.5) + 6;
  cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k);
  g.scale(k, k); g.font = f; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  if (outline) { g.lineWidth = 3; g.strokeStyle = 'rgba(5,4,12,0.85)'; g.strokeText(str, w / 2, h / 2); }
  g.fillStyle = color; g.fillText(str, w / 2, h / 2);
  c = { cv, w, h }; textCache.set(key, c); return c;
}
if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => { textCache.clear(); if (typeof glowTextCache !== 'undefined') glowTextCache.clear(); });

// Pre-rendered soft glow sprite per color (much cheaper than shadowBlur on phones)
const glowCache = new Map();
function glowSprite(color) {
  let c = glowCache.get(color);
  if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, hexA(color, 0.95)); gr.addColorStop(0.22, hexA(color, 0.5));
  gr.addColorStop(0.55, hexA(color, 0.14)); gr.addColorStop(1, hexA(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  glowCache.set(color, c); return c;
}
function glow(x, y, r, color, a = 1) {
  if (a <= 0) return;
  const pa = ctx.globalAlpha;
  ctx.globalAlpha = pa * Math.min(1, a);
  ctx.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = pa;
}
function additive(on) { ctx.globalCompositeOperation = on ? 'lighter' : 'source-over'; }

function polyPath(x, y, r, sides, rot) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rot + i * TAU / sides - Math.PI / 2;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function starPath(x, y, r, ri, pts, rot) {
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const a = rot + i * Math.PI / pts - Math.PI / 2, rr = i % 2 ? ri : r;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function shapePath(x, y, r, sides, star, rot) {
  if (!sides) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
  else if (star) starPath(x, y, r, r * 0.52, sides, rot);
  else polyPath(x, y, r, sides, rot);
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
// A neon tube: colored stroke with a hot white core
function neon(color, w = 2.2) {
  ctx.lineJoin = 'round';
  ctx.lineWidth = w; ctx.strokeStyle = color; ctx.stroke();
  ctx.lineWidth = Math.max(0.7, w * 0.38); ctx.strokeStyle = 'rgba(255,255,255,0.78)'; ctx.stroke();
}

// ---- Enemy glyph ------------------------------------------------------
// In the game world, enemy bodies (dark fill + neon outline) come from a sprite cached per type
// and colour, drawn rotated: one image instead of building and stroking paths every frame.
const glyphCache = new Map();
function glyphBody(rc, col) {
  const k = DPR * SCALE * 1.3, key = rc.name + '|' + col + '|' + k.toFixed(2);
  let c = glyphCache.get(key);
  if (c) return c;
  const half = rc.r + 4, cv = document.createElement('canvas');
  cv.width = cv.height = Math.ceil(half * 2 * k);
  const g = cv.getContext('2d'); g.scale(k, k);
  const main = ctx; ctx = g;
  try {
    shapePath(half, half, rc.r, rc.sides, rc.star, 0);
    ctx.fillStyle = '#0a0817'; ctx.fill(); ctx.fillStyle = hexA(rc.color, 0.22); ctx.fill();
    neon(col, rc.thick ? 3.2 : 2.2);
  } finally { ctx = main; }
  c = { cv, half }; glyphCache.set(key, c); return c;
}
// o: { rot, rot2, scale, flash, dir, t, blink, frozen, alpha }
function drawGlyph(rc, x, y, o) {
  const s = o.scale == null ? 1 : o.scale;
  if (s <= 0.01) return;
  const r = rc.r * s;
  const col = o.flash > 0 ? '#ffffff' : rc.color;
  if (rc.flying) {                       // shadow on the ground, body hovering above it
    ctx.beginPath(); ctx.ellipse(x + 3, y + 12, r * 0.95, r * 0.4, 0, 0, TAU);
    ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill();
    y -= 4 + Math.sin(o.t * 3) * 2;
  }
  if (!o.noGlow) { additive(true); glow(x, y, r * (rc.boss ? 3.4 : 3.0), rc.color, rc.boss ? 0.8 : 0.7); additive(false); }
  if (rc.flying) {                       // flapping wings
    const flap = 0.65 + 0.35 * Math.sin(o.t * 14), dx = Math.cos(o.dir), dy = Math.sin(o.dir), nx = -dy, ny = dx;
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + dx * r * 0.3, y + dy * r * 0.3);
      ctx.lineTo(x + nx * sd * r * 2 * flap - dx * r * 0.7, y + ny * sd * r * 2 * flap - dy * r * 0.7);
      ctx.lineTo(x - dx * r * 0.8, y - dy * r * 0.8);
      ctx.closePath(); ctx.fillStyle = hexA(rc.color, 0.28); ctx.fill();
      ctx.lineWidth = 1.4; ctx.strokeStyle = col; ctx.stroke();
    }
  }
  if (rc.orbit) {
    for (let i = 0; i < rc.orbit; i++) {
      const a = o.t * 2.2 + i * TAU / rc.orbit, d = r * 1.6;
      const ox = x + Math.cos(a) * d, oy = y + Math.sin(a) * d;
      ctx.beginPath(); ctx.arc(ox, oy, Math.max(1.6, r * 0.15), 0, TAU);
      ctx.fillStyle = col; ctx.fill();
    }
  }
  const rot = rc.point ? o.dir + Math.PI / 2 : o.rot;
  if (o.fast) {                           // world: cached sprite
    const b = glyphBody(rc, col), hs = b.half * s;
    ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(b.cv, -hs, -hs, hs * 2, hs * 2); ctx.rotate(-rot); ctx.translate(-x, -y);
  } else {                                // cards and menus: exact vector drawing at any size
    shapePath(x, y, r, rc.sides, rc.star, rot);
    ctx.fillStyle = '#0a0817'; ctx.fill();
    ctx.fillStyle = hexA(rc.color, 0.22); ctx.fill();
    neon(col, rc.thick ? 3.2 : 2.2);
  }
  if (rc.inner) {
    shapePath(x, y, r * rc.inner.scale, rc.inner.sides, false, o.rot2 || 0);
    ctx.lineWidth = 1.4; ctx.strokeStyle = hexA(rc.color, 0.9); ctx.stroke();
  }
  if (o.frozen) {
    shapePath(x, y, r + 3.5, rc.sides, rc.star, rot);
    ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(190,210,255,0.85)'; ctx.stroke();
  }
  if (rc.plus) {
    const pr = r * 0.5, pw = r * 0.2, pc = o.flash > 0 ? '#ffffff' : rc.color;
    additive(true); glow(x, y, r * 1.6, rc.color, 0.4 + Math.sin(o.t * 5) * 0.2); additive(false);
    ctx.fillStyle = pc; ctx.fillRect(x - pr, y - pw, pr * 2, pw * 2); ctx.fillRect(x - pw, y - pr, pw * 2, pr * 2);
  }
  if (o.shield > 0) {
    const ping = Math.max(0, o.ping || 0) * 5;
    if (ping > 0) { additive(true); glow(x, y, r * 3.2, '#9fd6ff', ping * 0.6); additive(false); }
    polyPath(x, y, r + 6, 6, o.t * 0.8);
    ctx.lineWidth = 1 + 2 * o.shield + ping; ctx.strokeStyle = hexA(ping > 0 ? '#ffffff' : '#9fd6ff', 0.25 + 0.65 * o.shield); ctx.stroke();
    ctx.fillStyle = hexA(rc.color, 0.08 * o.shield + ping * 0.1); ctx.fill();
  }
  if (rc.eye) {
    const er = Math.max(1.8, r * 0.34);
    const ex = x + Math.cos(o.dir) * r * 0.16, ey = y + Math.sin(o.dir) * r * 0.16;
    if (o.blink) {
      ctx.save(); ctx.translate(ex, ey); ctx.scale(1, 0.12);
      ctx.beginPath(); ctx.arc(0, 0, er, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.restore();
    } else {                              // open eye: no save/restore needed
      ctx.beginPath(); ctx.arc(ex, ey, er, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.arc(ex + Math.cos(o.dir) * er * 0.42, ey + Math.sin(o.dir) * er * 0.42, er * 0.52, 0, TAU);
      ctx.fillStyle = '#0a0817'; ctx.fill();
    }
  }
  if (o.elec) drawElecHalo(x, y, r, o.t, o.elec);
  if (o.ice) drawIceHalo(x, y, r, o.t);
  if (o.lock > 0) {                      // frozen solid: a block of ice around it
    polyPath(x, y, r + 5, 6, 0.3);
    ctx.fillStyle = 'rgba(205,240,255,0.42)'; ctx.fill();
    ctx.lineWidth = 1.8; ctx.strokeStyle = 'rgba(245,252,255,0.95)'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r * 0.5, y - r * 0.2); ctx.lineTo(x - r * 0.1, y - r * 0.6); ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke();
  }
  if (o.marks > 0) {                     // FROST marks: 3 freeze the enemy
    for (let i = 0; i < 3; i++) {
      const px = x + (i - 1) * 7, py = y - r - 11;
      polyPath(px, py, 2.8, 4, Math.PI / 4);
      ctx.fillStyle = i < o.marks ? '#e8fbff' : 'rgba(20,30,60,0.8)'; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = '#a3b8ff'; ctx.stroke();
    }
  }
}

// Electrified: little bolts of lightning crackling around the body (live = 1, shorted out = 0.3)
function drawElecHalo(x, y, r, t, a) {
  const R = r + 5, c = a >= 1 ? '#f6ff3d' : '#8a8760';
  additive(true);
  if (a >= 1) glow(x, y, r * 2.6, '#f6ff3d', 0.35 + 0.2 * Math.sin(t * 20));
  ctx.lineWidth = 1.5; ctx.strokeStyle = c; ctx.globalAlpha = a >= 1 ? 1 : 0.5;
  const n = 3, seed = Math.floor(t * 12);
  for (let i = 0; i < n; i++) {
    const a0 = (seed * 1.7 + i * TAU / n) % TAU;
    ctx.beginPath();
    for (let k = 0; k <= 3; k++) {
      const an = a0 + k * 0.28, rr = R + ((seed + i + k) % 2 ? 3 : -2);
      const px = x + Math.cos(an) * rr, py = y + Math.sin(an) * rr;
      k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  additive(false);
}
// Iced: a ring of small ice crystals turning around the body
function drawIceHalo(x, y, r, t) {
  const R = r + 6;
  ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(210,245,255,0.45)'; ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const an = t * 0.9 + i * TAU / 5;
    polyPath(x + Math.cos(an) * R, y + Math.sin(an) * R, 2.6, 4, an);
    ctx.fillStyle = '#e8fbff'; ctx.fill();
  }
}

// ---- Tower glyph: crystals that grow with level ---------------------
// o: { lv, aim, kick, t, scale, alpha, ghost }
function drawTowerGlyph(type, x, y, o) {
  const d = TOWERS[type], c = d.color, lv = o.lv || 0, t = o.t || 0;
  const s = o.scale == null ? 1 : o.scale;
  const k = 1 + (o.kick || 0) * 0.14;
  const pa = ctx.globalAlpha;
  ctx.globalAlpha = pa * (o.alpha == null ? 1 : o.alpha);
  additive(true); glow(x, y, (26 + lv * 6) * s, c, 0.2 + lv * 0.08 + (o.kick || 0) * 0.25); additive(false);
  // plate
  roundRect(x - 15 * s, y - 15 * s, 30 * s, 30 * s, 7 * s);
  ctx.fillStyle = '#0b0a1a'; ctx.fill();
  ctx.lineWidth = 1.2; ctx.strokeStyle = hexA(c, 0.4); ctx.stroke();
  // LV2+: rotating outer ring
  if (lv >= 1) {
    shapePath(x, y, 14.5 * s, d.sides === 3 ? 6 : d.sides, false, t * 0.5 * (type === 'frost' ? -1 : 1));
    ctx.lineWidth = 1.3; ctx.strokeStyle = hexA(c, 0.75); ctx.stroke();
  }
  const aim = o.aim == null ? -Math.PI / 2 : o.aim;
  const ax = Math.cos(aim), ay = Math.sin(aim);
  if (type === 'bolt') {
    const back = (o.kick || 0) * 3;
    ctx.beginPath(); ctx.moveTo(x - ax * back, y - ay * back); ctx.lineTo(x + ax * (14 - back) * s, y + ay * (14 - back) * s);
    ctx.lineCap = 'round'; neon(c, 3.2); ctx.lineCap = 'butt';
    shapePath(x, y, 8 * s * k, 4, false, aim + Math.PI / 2);
    ctx.fillStyle = hexA(c, 0.3); ctx.fill(); neon(c, 2);
    if (lv >= 2) { ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); }
  } else if (type === 'arc') {
    shapePath(x, y, 10 * s, 3, false, 0);
    ctx.fillStyle = hexA(c, 0.2); ctx.fill(); neon(c, 2);
    const pr = (3.6 + lv * 0.8) * k * s;
    additive(true); glow(x, y + 1, pr * 3.5, c, 0.7 + Math.random() * 0.3); additive(false);
    ctx.beginPath(); ctx.arc(x, y + 1, pr, 0, TAU); ctx.fillStyle = '#fffbe0'; ctx.fill();
  } else if (type === 'nova') {
    const back = (o.kick || 0) * 4;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + ax * (13 - back) * s, y + ay * (13 - back) * s);
    ctx.lineCap = 'round'; ctx.lineWidth = 7 * s; ctx.strokeStyle = '#0b0a1a'; ctx.stroke();
    neon(c, 4.5 * s); ctx.lineCap = 'butt';
    shapePath(x, y, 9.5 * s * k, 6, false, Math.PI / 6);
    ctx.fillStyle = '#0b0a1a'; ctx.fill(); ctx.fillStyle = hexA(c, 0.28); ctx.fill(); neon(c, 2);
    ctx.beginPath(); ctx.arc(x, y, 3 + lv, 0, TAU); ctx.fillStyle = hexA(c, 0.9); ctx.fill();
  } else if (type === 'frost') {
    starPath(x, y, 10.5 * s * k, 4 * s, 6, t * (1.2 + (o.kick || 0) * 4));
    ctx.fillStyle = hexA(c, 0.22); ctx.fill(); neon(c, 1.8);
    ctx.beginPath(); ctx.arc(x, y, 2.6 + lv * 0.6, 0, TAU); ctx.fillStyle = '#eef3ff'; ctx.fill();
  }
  else if (type === 'flak') {
    for (const sd of [-3.2, 3.2]) {
      const nx = -ay, ny = ax, back = (o.kick || 0) * 3;
      ctx.beginPath();
      ctx.moveTo(x + nx * sd - ax * back, y + ny * sd - ay * back);
      ctx.lineTo(x + nx * sd + ax * (13 - back) * s, y + ny * sd + ay * (13 - back) * s);
      ctx.lineCap = 'round'; ctx.lineWidth = 4.5 * s; ctx.strokeStyle = '#0b0a1a'; ctx.stroke(); neon(c, 2.6 * s); ctx.lineCap = 'butt';
    }
    shapePath(x, y, 9 * s * k, 3, false, aim + Math.PI / 2);
    ctx.fillStyle = '#0b0a1a'; ctx.fill(); ctx.fillStyle = hexA(c, 0.28); ctx.fill(); neon(c, 1.8);
    ctx.beginPath(); ctx.arc(x, y, 2.4 + lv * 0.5, 0, TAU); ctx.fillStyle = '#ffe4e0'; ctx.fill();
  } else if (type === 'emp') {
    polyPath(x, y, 10 * s * k, 5, t * 0.3);
    ctx.fillStyle = '#0b0a1a'; ctx.fill(); ctx.fillStyle = hexA(c, 0.25); ctx.fill(); neon(c, 1.8);
    for (let i = 0; i < 3; i++) {                        // spinning coil arcs
      const a = t * 3 + i * TAU / 3;
      ctx.beginPath(); ctx.arc(x, y, 6.5 * s, a, a + 1.2); ctx.lineWidth = 1.8; ctx.strokeStyle = '#b8d0ff'; ctx.stroke();
    }
    additive(true); glow(x, y, 10 + (o.kick || 0) * 14, c, 0.8); additive(false);
    ctx.beginPath(); ctx.arc(x, y, 2.6 + lv * 0.5, 0, TAU); ctx.fillStyle = '#e8f0ff'; ctx.fill();
  } else if (type === 'mint') {
    if (o.charge != null) {
      ctx.beginPath(); ctx.arc(x, y, 15.5 * s, -Math.PI / 2, -Math.PI / 2 + TAU * o.charge);
      ctx.lineWidth = 2.2; ctx.strokeStyle = hexA(c, 0.35 + 0.6 * o.charge); ctx.stroke();
    }
    polyPath(x, y, 10 * s * k, 6, t * 0.4);
    ctx.fillStyle = '#2a1e02'; ctx.fill(); ctx.fillStyle = hexA(c, 0.25); ctx.fill(); neon(c, 2);
    ctx.beginPath(); ctx.arc(x, y, 4.5 * s, 0, TAU); ctx.fillStyle = hexA(c, 0.85); ctx.fill();
    const gl = (t * 0.7) % 1;
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, 4.5 * s, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x - 6 + gl * 12, y - 6, 2.5, 12); ctx.restore();
  } else if (type === 'prism') {
    const heat = o.heat || 0;
    additive(true); glow(x, y, 14 + heat * 10, c, 0.3 + heat * 0.5); additive(false);
    starPath(x, y, 11 * s * k, 4.5 * s, 4, aim + Math.PI / 4);
    ctx.fillStyle = hexA(c, 0.25 + heat * 0.3); ctx.fill(); neon(c, 1.8);
    ctx.beginPath(); ctx.arc(x, y, 2.6 + heat * 1.5, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
  } else if (type === 'rail') {
    const back = (o.kick || 0) * 5, nx = -ay, ny = ax;
    ctx.lineCap = 'round';
    for (const sd of [-2.6, 2.6]) {
      ctx.beginPath();
      ctx.moveTo(x + nx * sd - ax * back, y + ny * sd - ay * back);
      ctx.lineTo(x + nx * sd + ax * (17 - back) * s, y + ny * sd + ay * (17 - back) * s);
      neon(c, 2.2);
    }
    ctx.lineCap = 'butt';
    polyPath(x, y, 7.5 * s * k, 4, aim + Math.PI / 4);
    ctx.fillStyle = '#0b0a1a'; ctx.fill(); ctx.fillStyle = hexA(c, 0.3); ctx.fill(); neon(c, 1.8);
  } else if (type === 'beacon') {
    const p = (t * 0.8) % 1;
    ctx.beginPath(); ctx.arc(x, y, 6 + p * 12, 0, TAU); ctx.lineWidth = 1.5; ctx.strokeStyle = hexA(c, 0.7 * (1 - p)); ctx.stroke();
    polyPath(x, y, 9 * s * k, 8, Math.PI / 8);
    ctx.fillStyle = hexA(c, 0.15); ctx.fill(); neon(c, 1.8);
    ctx.beginPath(); ctx.arc(x, y, 3.2 + Math.sin(t * 4) * 0.8, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
  }
  // LV3: orbiting shards
  if (lv >= 2) {
    for (let i = 0; i < 3; i++) {
      const a = t * 1.8 + i * TAU / 3, ox = x + Math.cos(a) * 19, oy = y + Math.sin(a) * 19;
      polyPath(ox, oy, 3, 4, a); ctx.fillStyle = c; ctx.fill();
    }
  }
  // level pips
  if (!o.ghost) {
    for (let i = 0; i <= lv; i++) {
      ctx.beginPath(); ctx.arc(x + (i - lv / 2) * 6, y + 19.5, 1.7, 0, TAU);
      ctx.fillStyle = c; ctx.fill();
    }
  }
  ctx.globalAlpha = pa;
}

function drawCoin(x, y, r, a = 1) {
  const pa = ctx.globalAlpha;
  ctx.globalAlpha = pa * a;
  additive(true); glow(x, y, r * 3, '#ffd23d', 0.5); additive(false);
  polyPath(x, y, r, 6, 0); ctx.fillStyle = '#3a2a05'; ctx.fill(); neon('#ffd23d', 1.6);
  ctx.globalAlpha = pa;
}

// jagged lightning between points
function drawLightning(pts, color, a) {
  const seg = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i], q = pts[i + 1];
    const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
    const n = Math.max(2, Math.floor(len / 11)), nx = -dy / len, ny = dx / len;
    seg.push([p.x, p.y]);
    for (let j = 1; j < n; j++) {
      const off = rand(-7, 7) * Math.sin(Math.PI * j / n);
      seg.push([p.x + dx * j / n + nx * off, p.y + dy * j / n + ny * off]);
    }
  }
  const e = pts[pts.length - 1]; seg.push([e.x, e.y]);
  additive(true);
  ctx.beginPath(); seg.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.lineJoin = 'round';
  ctx.globalAlpha = a * 0.45; ctx.lineWidth = 6; ctx.strokeStyle = color; ctx.stroke();
  ctx.globalAlpha = a; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.lineWidth = 1; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  ctx.globalAlpha = 1;
  for (const p of pts) glow(p.x, p.y, 14, color, a * 0.8);
  additive(false);
}

// =====================================================================
//  MAP GEOMETRY (one or more lanes into one core)
// =====================================================================
function makeLane(turnPts) {
  const pts = turnPts.map(([c, r]) => ({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 }));
  const segs = []; let len = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], l = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({ a, b, l, start: len, ang: Math.atan2(b.y - a.y, b.x - a.x) }); len += l;
  }
  function at(d) {
    d = clamp(d, 0, len);
    for (const s of segs) {
      if (d <= s.start + s.l) { const t = (d - s.start) / s.l; return { x: lerp(s.a.x, s.b.x, t), y: lerp(s.a.y, s.b.y, t), ang: s.ang }; }
    }
    const s = segs[segs.length - 1]; return { x: s.b.x, y: s.b.y, ang: s.ang };
  }
  return { tp: turnPts, pts, segs, len, at, start: pts[0], end: pts[pts.length - 1] };
}
// paths: full routes enemies walk (portal -> core). lanes: what gets drawn (branches stop at the merge).
const MAP = { paths: [], lanes: [], tiles: new Set(), core: { x: 0, y: 0 }, portals: [] };
function setMap(paths, lanes) {
  lanes = lanes || paths;
  MAP.paths = paths.map(makeLane);
  MAP.lanes = lanes.map(makeLane);
  MAP.tiles = new Set();
  for (const p of lanes) for (const [c, r] of expandTiles(p)) MAP.tiles.add(r * COLS + c);
  MAP.core = MAP.paths[0].end;
  MAP.portals = MAP.paths.map(p => p.start);
  // flyers ignore the track: a straight flight line from each portal to the core
  MAP.flights = MAP.paths.map(p => makeLane([p.tp[0], p.tp[p.tp.length - 1]]));
}

// =====================================================================
//  EFFECTS: particles, rings, lightning, floating text
// =====================================================================
const FX = {
  parts: [], rings: [], zaps: [], texts: [], lines: [],
  add(p) {                                  // particle budget (smaller when the device is struggling)
    const n = this.parts.length;
    if (n >= 340 * QUALITY.fx || (QUALITY.fx < 1 && n > 120 && Math.random() > QUALITY.fx)) return;
    this.parts.push(p);
  },
  spark(x, y, color, n, sp = 160, life = 0.35) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), v = rand(sp * 0.3, sp);
      this.add({ k: 0, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(life * 0.5, life), max: life, color, w: rand(1, 2) });
    }
  },
  shards(x, y, color, n, sp = 150, size = 4) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), v = rand(sp * 0.35, sp);
      this.add({ k: 1, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: rand(0, TAU), vr: rand(-12, 12), s: rand(size * 0.5, size), life: rand(0.45, 0.8), max: 0.8, color });
    }
  },
  dot(x, y, color, size = 3, life = 0.3, vx = 0, vy = 0) {
    this.add({ k: 2, x, y, vx, vy, s: size, life, max: life, color });
  },
  flash(x, y, r, color, life = 0.18) { this.add({ k: 3, x, y, r, life, max: life, color }); },
  ring(x, y, r0, r1, color, life = 0.4, w = 3) { if (this.rings.length > 80) this.rings.shift(); this.rings.push({ x, y, r0, r1, color, life, max: life, w }); },
  line(x1, y1, x2, y2, color, life = 0.3, w = 5) { this.lines.push({ x1, y1, x2, y2, color, life, max: life, w }); },
  zap(pts, color, life = 0.16) { this.zaps.push({ pts, color, life, max: life, t: 0 }); },
  text(x, y, str, color, size = 11, opts = {}) {
    if (this.texts.length > 36) this.texts.shift();
    this.texts.push({ x, y, str, color, size, life: opts.life || 0.75, max: opts.life || 0.75, vy: opts.vy || -38, pop: 1, font: opts.font || FONT_UI });
  },
  shatter(x, y, color, r, big) {
    this.flash(x, y, r * (big ? 7 : 4.2), color, big ? 0.45 : 0.2);
    this.ring(x, y, r * 0.6, r * (big ? 6 : 3), color, big ? 0.7 : 0.35, big ? 5 : 2.5);
    this.shards(x, y, color, big ? 46 : Math.round(7 + r * 0.5), big ? 300 : 150, big ? 7 : Math.max(3, r * 0.45));
    this.spark(x, y, '#ffffff', big ? 24 : 4, big ? 380 : 190, 0.3);
  },
  update(dt) {
    const P = this.parts; let j = 0;                 // update and compact in one pass (no splice)
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      p.life -= dt;
      if (p.life <= 0) continue;
      p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt;
      if (p.k === 0) { p.vx *= 1 - 2.5 * dt; p.vy *= 1 - 2.5 * dt; }
      else if (p.k === 1) { p.vx *= 1 - 3.2 * dt; p.vy *= 1 - 3.2 * dt; p.rot += p.vr * dt; }
      else if (p.k === 2) { p.vx *= 1 - 2 * dt; p.vy *= 1 - 2 * dt; }
      P[j++] = p;
    }
    P.length = j;
    for (let i = this.rings.length - 1; i >= 0; i--) { const r = this.rings[i]; r.life -= dt; if (r.life <= 0) this.rings.splice(i, 1); }
    for (let i = this.zaps.length - 1; i >= 0; i--) { const z = this.zaps[i]; z.life -= dt; if (z.life <= 0) this.zaps.splice(i, 1); }
    for (let i = this.lines.length - 1; i >= 0; i--) { const l = this.lines[i]; l.life -= dt; if (l.life <= 0) this.lines.splice(i, 1); }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i]; t.life -= dt; t.y += t.vy * dt; t.vy *= 1 - 2.2 * dt; t.pop = Math.max(0, t.pop - dt * 6);
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  },
  draw() {
    additive(true);
    ctx.lineCap = 'round';
    for (const l of this.lines) {
      const a = l.life / l.max;
      ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2);
      ctx.globalAlpha = a * 0.35; ctx.lineWidth = l.w * 2.6 * (0.5 + a * 0.5); ctx.strokeStyle = l.color; ctx.stroke();
      ctx.globalAlpha = a; ctx.lineWidth = l.w * a; ctx.stroke();
      ctx.lineWidth = Math.max(0.8, l.w * 0.35 * a); ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
    ctx.lineCap = 'butt'; ctx.globalAlpha = 1;
    for (const r of this.rings) {
      const f = 1 - r.life / r.max, rad = lerp(r.r0, r.r1, easeOut(f));
      ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, TAU);
      ctx.globalAlpha = (1 - f) * 0.9; ctx.lineWidth = r.w * (1 - f * 0.6); ctx.strokeStyle = r.color; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const p of this.parts) {
      const a = p.life / p.max;
      if (p.k === 0) {
        ctx.globalAlpha = a; ctx.lineWidth = p.w; ctx.strokeStyle = p.color;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035); ctx.stroke();
      } else if (p.k === 1) {
        ctx.globalAlpha = Math.min(1, a * 1.4); ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(p.rot) * p.s, p.y + Math.sin(p.rot) * p.s);
        ctx.lineTo(p.x + Math.cos(p.rot + 2.3) * p.s * 0.6, p.y + Math.sin(p.rot + 2.3) * p.s * 0.6);
        ctx.lineTo(p.x + Math.cos(p.rot + 3.9) * p.s * 0.7, p.y + Math.sin(p.rot + 3.9) * p.s * 0.7);
        ctx.closePath(); ctx.fill();
      } else if (p.k === 2) {
        glow(p.x, p.y, p.s * 2.2, p.color, a * 0.9);
      } else if (p.k === 3) {
        glow(p.x, p.y, p.r * (0.6 + 0.4 * (1 - a)), p.color, a);
      }
    }
    ctx.globalAlpha = 1;
    additive(false);
    for (const z of this.zaps) drawLightning(z.pts, z.color, z.life / z.max);
    for (const t of this.texts) {
      const a = Math.min(1, t.life / (t.max * 0.4)), sc = 1 + t.pop * 0.5, sp = textSprite(t.str, t.size, t.color, t.font, true);
      ctx.globalAlpha = a; ctx.drawImage(sp.cv, t.x - sp.w * sc / 2, t.y - sp.h * sc / 2, sp.w * sc, sp.h * sc);
    }
    ctx.globalAlpha = 1;
  },
  clear() { this.parts.length = 0; this.rings.length = 0; this.zaps.length = 0; this.texts.length = 0; this.lines.length = 0; },
};

// =====================================================================
//  BACKGROUND (pre-rendered once per layout / world)
// =====================================================================
let bgCanvas = document.createElement('canvas');
function buildBackground(theme) {
  bgCanvas.width = cvs.width; bgCanvas.height = cvs.height;
  const g = bgCanvas.getContext('2d'), k = DPR * SCALE;
  g.setTransform(k, 0, 0, k, 0, 0);
  const cx = MAP_X + W / 2, cy = MAP_Y + ROWS * TILE / 2;
  const gr = g.createRadialGradient(cx, cy, 20, cx, cy, Math.max(LW, LH) * 0.75);
  gr.addColorStop(0, theme.bg2); gr.addColorStop(1, theme.bg);
  g.fillStyle = gr; g.fillRect(0, 0, LW, LH);
  // lattice of dots across the whole screen, aligned to the map grid
  g.fillStyle = hexA(theme.grid, 0.55);
  const ox = MAP_X % TILE, oy = MAP_Y % TILE;
  for (let x = ox - TILE; x < LW + TILE; x += TILE)
    for (let y = oy - TILE; y < LH + TILE; y += TILE) g.fillRect(x - 1, y - 1, 2, 2);
  // buildable tiles
  g.save(); g.translate(MAP_X, MAP_Y);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (MAP.tiles.has(r * COLS + c)) continue;
    const x = c * TILE, y = r * TILE;
    g.fillStyle = theme.tile;
    g.beginPath(); g.roundRect ? g.roundRect(x + 3, y + 3, TILE - 6, TILE - 6, 6) : g.rect(x + 3, y + 3, TILE - 6, TILE - 6); g.fill();
    g.strokeStyle = hexA(theme.grid, 0.9); g.lineWidth = 1;
    const m = 5;
    g.beginPath();
    g.moveTo(x + 3, y + 3 + m); g.lineTo(x + 3, y + 3); g.lineTo(x + 3 + m, y + 3);
    g.moveTo(x + TILE - 3 - m, y + TILE - 3); g.lineTo(x + TILE - 3, y + TILE - 3); g.lineTo(x + TILE - 3, y + TILE - 3 - m);
    g.stroke();
  }
  // path channel
  g.lineJoin = 'round'; g.lineCap = 'round';
  const trace = () => { g.beginPath(); for (const ln of MAP.lanes) ln.pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); };
  trace(); g.globalAlpha = 0.18; g.lineWidth = 42; g.strokeStyle = theme.edge; g.stroke();
  trace(); g.globalAlpha = 1; g.lineWidth = 31; g.strokeStyle = theme.edge; g.stroke();
  trace(); g.lineWidth = 27.5; g.strokeStyle = theme.path; g.stroke();
  trace(); g.globalAlpha = 0.35; g.lineWidth = 1; g.strokeStyle = theme.edge; g.setLineDash([2, 6]); g.stroke(); g.setLineDash([]);
  g.globalAlpha = 1;
  g.restore();
  // vignette
  const vg = g.createRadialGradient(cx, cy, Math.min(LW, LH) * 0.35, cx, cy, Math.max(LW, LH) * 0.8);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = vg; g.fillRect(0, 0, LW, LH);
}

// energy flowing along the path toward the core (drawn in map space)
function drawPathFlow(theme, t) {
  ctx.save();
  additive(true);
  ctx.beginPath(); for (const ln of MAP.lanes) ln.pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.setLineDash([3, 17]); ctx.lineDashOffset = -t * 42;
  ctx.globalAlpha = 0.6; ctx.lineWidth = 2.5; ctx.strokeStyle = theme.flow; ctx.stroke();
  ctx.setLineDash([]);
  additive(false);
  ctx.restore();
}

function drawPortals(t, pulse) { MAP.portals.forEach((p, i) => drawPortal(p, t + i * 1.7, pulse)); }
function drawPortal(pt, t, pulse) {
  const { x, y } = pt, c = '#ff3d9a';
  additive(true); glow(x, y, 34 + pulse * 14, c, 0.55 + pulse * 0.4); additive(false);
  for (let i = 0; i < 3; i++) {
    polyPath(x, y, 15 - i * 4 + pulse * 3, 5 - (i % 2), t * (i % 2 ? -1.6 : 1.1) + i);
    ctx.lineWidth = 1.6; ctx.strokeStyle = hexA(i ? '#a066ff' : c, 0.9 - i * 0.2); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(x, y, 3.5, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
}

function drawCore(t, lives, maxLives, hit) {
  const { x, y } = MAP.core;
  const f = Math.max(0, lives / maxLives);
  const c = f > 0.5 ? '#bff8ff' : f > 0.25 ? '#ffd27a' : '#ff4a5a';
  const s = 1 + Math.sin(t * 3) * 0.04 + hit * 0.25;
  additive(true); glow(x, y, 46 * s, c, 0.55 + hit * 0.5); additive(false);
  polyPath(x, y, 17 * s, 4, t * 0.4); ctx.fillStyle = '#0a0817'; ctx.fill(); ctx.fillStyle = hexA(c, 0.25); ctx.fill(); neon(c, 2.4);
  polyPath(x, y, 9 * s, 4, -t * 0.9); ctx.fillStyle = hexA(c, 0.6); ctx.fill(); neon('#ffffff', 1.2);
  // life ring
  ctx.beginPath(); ctx.arc(x, y, 23 * s, -Math.PI / 2, -Math.PI / 2 + TAU * f);
  ctx.lineWidth = 2; ctx.strokeStyle = hexA(c, 0.8); ctx.stroke();
}
