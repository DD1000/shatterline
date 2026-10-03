// v48: every tower has its own level 4 look (BOLT, ARC and NOVA already did; the other nine and LANCE's DEADEYE are new).
// Checks that each level 4 reaches well outside the tower's plate (where level 3 only has three small shards), and saves
// two pictures: shots/l4-gallery.png (all 13 at level 4) and shots/l4-progression.png (every tower, levels 1-4).
const { chromium } = require('playwright');
const fs = require('fs');
const SP = process.argv[2] || 'shots';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(800);
  const res = await p.evaluate(() => {
    const onto = (W, H, S, draw) => {                       // draw with the game's own ctx pointed at an offscreen canvas
      const cv = document.createElement('canvas'); cv.width = W * S; cv.height = H * S;
      const g = cv.getContext('2d'); g.scale(S, S); const old = ctx; ctx = g;
      try { draw(g); } finally { ctx = old; }
      return cv;
    };
    const aimOf = t => t === 'rail' ? -Math.PI / 2 : -Math.PI / 4;
    // 1) bright pixels outside the plate (radius 17 to 30) for levels 3 and 4
    const outside = (type, lv) => {
      const cv = onto(64, 64, 1, g => { g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64); drawTowerGlyph(type, 32, 32, { lv, t: 1.7, aim: aimOf(type), ghost: true }); });
      const d = cv.getContext('2d').getImageData(0, 0, 64, 64).data; let n = 0;
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const r = Math.hypot(x - 31.5, y - 31.5), i = (y * 64 + x) * 4; if (r > 17 && r < 30 && d[i] + d[i + 1] + d[i + 2] > 240) n++; }
      return n;
    };
    const ring = {}; for (const t of TOWER_ORDER) ring[t] = [outside(t, 2), outside(t, 3)];
    // 2) the pictures
    const bg = (g, W, H) => { const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7); gr.addColorStop(0, '#15103a'); gr.addColorStop(1, '#07061a'); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
    const glyph = (type, x, y, lv, z, t) => { ctx.save(); ctx.translate(x, y); ctx.scale(z, z); drawTowerGlyph(type, 0, 0, { lv, t, aim: aimOf(type), kick: 0, heat: 0.55, charge: 0.65 }); ctx.restore(); };
    const label = (str, x, y, size, color, face) => { ctx.font = `${face ? 400 : 700} ${size}px ${face || FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(str, x, y); };
    const special = { bolt: 'MASTER BOLT', arc: 'LIVE WIRE', nova: 'SUPERNOVA', lance: 'DEADEYE' };
    const cols = 4, cw = 150, chh = 170, rows = Math.ceil(TOWER_ORDER.length / cols), W1 = cols * cw + 40, H1 = rows * chh + 90;
    const gal = onto(W1, H1, 2, g => {
      bg(g, W1, H1); label('LEVEL 4', W1 / 2, 40, 26, '#ffffff', FONT_D);
      TOWER_ORDER.forEach((t, i) => {
        const r = Math.floor(i / cols), inRow = Math.min(cols, TOWER_ORDER.length - r * cols), x = W1 / 2 + (i % cols - (inRow - 1) / 2) * cw, y = 90 + r * chh + 62;
        glyph(t, x, y, 3, 2.3, 1.7 + i * 0.37);
        label(TOWERS[t].name, x, y + 72, 15, TOWERS[t].color, FONT_D);
        if (special[t]) label(special[t], x, y + 90, 10, 'rgba(255,255,255,0.6)');
      });
    });
    const pw = 4 * 96 + 130, ph = TOWER_ORDER.length * 86 + 60;
    const prog = onto(pw, ph, 2, g => {
      bg(g, pw, ph);
      for (let lv = 0; lv < 4; lv++) label('LEVEL ' + (lv + 1), 130 + lv * 96 + 48, 26, 12, 'rgba(255,255,255,0.7)');
      TOWER_ORDER.forEach((t, i) => { const y = 100 + i * 86; label(TOWERS[t].name, 62, y, 14, TOWERS[t].color, FONT_D); for (let lv = 0; lv < 4; lv++) glyph(t, 178 + lv * 96, y, lv, 1.45, 1.7 + i * 0.37); });
    });
    return { ring, gal: gal.toDataURL('image/png'), prog: prog.toDataURL('image/png') };
  });
  fs.writeFileSync(`${SP}/l4-gallery.png`, Buffer.from(res.gal.split(',')[1], 'base64'));
  fs.writeFileSync(`${SP}/l4-progression.png`, Buffer.from(res.prog.split(',')[1], 'base64'));
  // the towers in play at level 4, at real size
  await p.evaluate(() => {
    localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang('en');
    const T = __TD, G = T.G; T.startLevel(25); G.gold = 1e6; G.tutorial = false;
    const spots = []; for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) spots.push([c, r]);
    TOWER_ORDER.forEach((t, i) => { const s = spots[Math.floor(i * spots.length / TOWER_ORDER.length)]; const tw = T.buildTower(t, s[0], s[1]); for (let k = 0; k < 3; k++) T.upgradeTower(tw); });
    for (let i = 0; i < 30 * 4; i++) T.update(1 / 30);
  });
  await p.waitForTimeout(2500); await p.screenshot({ path: `${SP}/l4-board.png` });
  const bad = Object.entries(res.ring).filter(([, [l3, l4]]) => l4 < 60 || l4 < l3 + 25);
  console.log('bright pixels outside the plate, level 3 -> level 4:', Object.entries(res.ring).map(([t, [a, c]]) => `${t} ${a}->${c}`).join(', '));
  console.log(bad.length ? 'LOOK CHECK FAILED: ' + bad.map(x => x[0]).join(', ') : 'looks ok');
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
