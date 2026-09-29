// =====================================================================
//  STYLE SAMPLE: the game's engine running a self-playing battle
// =====================================================================
G.theme = 0;
newGame(true);
G.gold = 0; G.dispGold = 0; G.lives = ECON.startLives;
let bossT = 6, tapped = false;
const SPECIMENS = ['grunt', 'scout', 'brute', 'splitter', 'boss'];

function drawSampleHud() {
  ctx.fillStyle = 'rgba(5,4,14,0.78)'; ctx.fillRect(0, 0, LW, HUD_H);
  ctx.fillStyle = hexA(theme().edge, 0.5); ctx.fillRect(0, HUD_H - 1, LW, 1);
  drawGoldCounter(MAP_X + 20, HUD_H / 2);
  glowText('GLOWFORMS', MAP_X + W / 2, 19, 15, theme().flow, FONT_D, 10);
  setFont(9, FONT_UI); spacing(3); ctx.fillStyle = 'rgba(230,230,255,0.7)'; ctx.fillText('STYLE SAMPLE', MAP_X + W / 2, 37); spacing(0);
  setFont(10, FONT_UI); ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(230,230,255,0.6)'; ctx.fillText('WORLD', MAP_X + W - 12, 17);
  setFont(15, FONT_UI); ctx.fillStyle = theme().flow; ctx.fillText(theme().name, MAP_X + W - 12, 34);
}

function drawSpecimens() {
  const y0 = LH - BAR_H;
  ctx.fillStyle = 'rgba(5,4,14,0.8)'; ctx.fillRect(0, y0, LW, BAR_H);
  ctx.fillStyle = hexA(theme().edge, 0.5); ctx.fillRect(0, y0, LW, 1);
  SPECIMENS.forEach((k, i) => {
    const rc = ENEMIES[k], x = MAP_X + 36 + i * 72, y = y0 + 30;
    const sc = k === 'boss' ? 0.62 : 1.15;
    drawGlyph(rc, x, y, { rot: G.time * rc.spin, rot2: G.time * (rc.inner ? rc.inner.spin : 0), scale: sc, dir: Math.sin(G.time * 0.8 + i) * 0.6, t: G.time + i, blink: (G.time * 0.7 + i * 0.37) % 3 < 0.1 });
    setFont(10, FONT_UI); spacing(1.5); ctx.textAlign = 'center'; ctx.fillStyle = hexA(rc.color, 0.95);
    ctx.fillText(rc.name.toUpperCase(), x, y0 + 62); spacing(0);
  });
}

function drawHint() {
  const a = 0.55 + Math.sin(G.time * 3) * 0.25;
  setFont(11, FONT_UI); spacing(2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = `rgba(235,235,255,${a})`;
  ctx.fillText(tapped ? 'TAP TO CHANGE WORLD' : 'TAP TO TURN ON SOUND', LW / 2, LH - BAR_H - 14);
  spacing(0);
}

cvs.addEventListener('pointerdown', ev => {
  ev.preventDefault();
  Sound.init();
  if (!tapped) { tapped = true; G.demoSound = true; Sound.setLevel(8, false); Sound.musicOn(); return; }
  G.theme = (G.theme + 1) % THEMES.length; buildBackground(theme());
  Sound.play('upgrade');
}, { passive: false });

let lastT = performance.now();
function frame(now) {
  const rdt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  let ts = 1; if (G.slowT > 0) { G.slowT -= rdt; ts = 0.3; }
  const gdt = rdt * ts;
  bossT -= gdt;
  if (bossT <= 0 && !bossAlive()) { spawnEnemy('boss', 3); bossT = 24; }
  const steps = Math.max(1, Math.ceil(gdt / (1 / 60)));
  for (let i = 0; i < steps; i++) update(gdt / steps);
  updateVisuals(gdt, rdt);
  drawWorld();
  ctx.setTransform(DPR * SCALE, 0, 0, DPR * SCALE, 0, 0);
  drawCoins(); drawSampleHud(); drawSpecimens(); drawCombo(); drawShout(); drawHint(); drawFlash();
  requestAnimationFrame(frame);
}
window.addEventListener('resize', layout);
layout();
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => buildBackground(theme()));
requestAnimationFrame(frame);
