#!/usr/bin/env python3
# v36 (user): BOLT crits 1/4, 2/4, 3/4 at levels 1-3; level 4 = MASTER BOLT: fires 35% faster (keeps 3 of 4 crits)
# and looks different: gold twin-barrel with a star body, a spiked crown, gold shots.
import sys
P_IN, P_OUT = '/home/claude/live/v36/base.html', '/home/claude/live/v36/shatterline.html'
src = open(P_IN, encoding='utf-8').read()
def rep(old, new):
    global src
    n = src.count(old)
    if n != 1: sys.exit(f'anchor found {n}x:\n{old[:160]}')
    src = src.replace(old, new)
rep("const BUILD = 'v35';", "const BUILD = 'v36';")
rep("""  // v35 (user): crits follow a pattern instead of a 10% chance. crits = how many of every 4 shots crit (the last ones
  // in each group of 4): level 1 every 4th shot, each upgrade one more, level 4 every shot. A crit does x2.5 damage.
  bolt:   { name:'BOLT',   color:'#2ef2ff', sides:4, cost:50,  critMul:2.5, unlock:1, desc:'Rapid laser. Every 4th shot crits; each upgrade crits one more. Level 4: every shot.',""",
"""  // v35 (user): crits follow a pattern instead of a 10% chance. crits = how many of every 4 shots crit (the last ones
  // in each group of 4): level 1 every 4th shot, level 2 the 3rd and 4th, level 3 the 2nd to 4th. A crit does x2.5 damage.
  // v36 (user): level 4 is the MASTER BOLT: it keeps 3 of 4 crits, fires 35% faster and looks different (gold, twin barrels).
  bolt:   { name:'BOLT',   color:'#2ef2ff', sides:4, cost:50,  critMul:2.5, unlock:1, desc:'Rapid laser. Every 4th shot crits; each upgrade crits one more. Level 4: MASTER BOLT, 35% faster.',""")
rep("                 { cost:200, dmg:9.98, rate:2.24, range:3.0, crits:4 } ] },",
    "                 { cost:200, dmg:9.98, rate:3.02, range:3.0, crits:3, master:true } ] },")
rep("bolt: '快速光弹。每第 4 发暴击，每次升级多一发暴击，4 级时发发暴击。',",
    "bolt: '快速光弹。每第 4 发暴击，每次升级多一发暴击。4 级：大师光弹，射速 +35%。',")
rep("bolt: 'Láser rápido. Cada 4.º disparo es crítico; cada mejora añade otro. Nivel 4: todos.',",
    "bolt: 'Láser rápido. Cada 4.º disparo es crítico; cada mejora añade otro. Nivel 4: RAYO MAESTRO, 35% más rápido.',")
for old, new in [("tower_lv: 'LEVEL {0}',", "tower_lv: 'LEVEL {0}', master_bolt: 'MASTER BOLT',"),
                 ("tower_lv: '{0} 级',", "tower_lv: '{0} 级', master_bolt: '大师光弹',"),
                 ("tower_lv: 'NIVEL {0}',", "tower_lv: 'NIVEL {0}', master_bolt: 'RAYO MAESTRO',")]:
    rep(old, new)
# ---- shots: gold, alternating between the two barrels
rep("""    const crit = ((tw.shots - 1) % 4) >= 4 - (L.crits || 0);
    G.shots.push({ x: mx, y: my, tg, lx: tg.x, ly: tg.y, dmg: L.dmg * boost * (crit ? d.critMul : 1), crit, color: c, sp: 560, vx: 0, vy: 0, src: tw.type });
    FX.flash(mx, my, 14, c, 0.08);""",
"""    const crit = ((tw.shots - 1) % 4) >= 4 - (L.crits || 0);
    let sx = mx, sy = my, sc = c;
    if (L.master) { tw.tube ^= 1; const sd = tw.tube ? 3 : -3; sx = mx - Math.sin(tw.aim) * sd; sy = my + Math.cos(tw.aim) * sd; sc = MASTER_GOLD; }   // twin barrels
    G.shots.push({ x: sx, y: sy, tg, lx: tg.x, ly: tg.y, dmg: L.dmg * boost * (crit ? d.critMul : 1), crit, color: sc, sp: L.master ? 640 : 560, vx: 0, vy: 0, src: tw.type });
    FX.flash(sx, sy, 14, sc, 0.08);""")
# ---- the upgrade to level 4 gets its own moment
rep("  FX.text(tw.x, tw.y - 26, tr('tower_lv', tw.lv + 1), c, 12, { font: FONT_D, life: 0.9 });\n",
    "  if (TOWERS[tw.type].lv[tw.lv].master) {                   // v36: MASTER BOLT\n"
    "    FX.text(tw.x, tw.y - 28, tr('master_bolt'), MASTER_GOLD, 13, { font: FONT_D, life: 1.4 });\n"
    "    FX.ring(tw.x, tw.y, 12, 70, MASTER_GOLD, 0.6, 4); FX.flash(tw.x, tw.y, 80, MASTER_GOLD, 0.35); FX.shards(tw.x, tw.y, MASTER_GOLD, 14, 170, 3.5);\n"
    "    addShake(0.25);\n"
    "  } else FX.text(tw.x, tw.y - 26, tr('tower_lv', tw.lv + 1), c, 12, { font: FONT_D, life: 0.9 });\n")
# ---- drawing
rep("""function drawTowerGlyph(type, x, y, o) {
  const d = TOWERS[type], c = d.color, lv = o.lv || 0, t = o.t || 0;""",
"""const MASTER_GOLD = '#ffd23d';
function drawTowerGlyph(type, x, y, o) {
  const d = TOWERS[type], lv = o.lv || 0, t = o.t || 0;
  const master = !!(d.lv[lv] && d.lv[lv].master), c = master ? MASTER_GOLD : d.color;   // v36: MASTER BOLT turns gold""")
rep("""  ctx.fillStyle = '#0b0a1a'; ctx.fill();
  ctx.lineWidth = 1.2; ctx.strokeStyle = hexA(c, 0.4); ctx.stroke();
  // LV2+: rotating outer ring""",
"""  ctx.fillStyle = '#0b0a1a'; ctx.fill();
  ctx.lineWidth = master ? 2 : 1.2; ctx.strokeStyle = hexA(c, master ? 0.85 : 0.4); ctx.stroke();
  // LV2+: rotating outer ring""")
rep("""  if (type === 'bolt') {
    const back = (o.kick || 0) * 3;""",
"""  if (master) {                                          // MASTER BOLT: twin gold barrels, a star body, the old cyan diamond at its heart
    const back = (o.kick || 0) * 3, nx = -ay, ny = ax, cy = d.color;
    ctx.lineCap = 'round';
    for (const sd of [-3.2, 3.2]) {
      ctx.beginPath(); ctx.moveTo(x + nx * sd - ax * back, y + ny * sd - ay * back);
      ctx.lineTo(x + nx * sd + ax * (16 - back) * s, y + ny * sd + ay * (16 - back) * s);
      ctx.lineWidth = 5 * s; ctx.strokeStyle = '#0b0a1a'; ctx.stroke(); neon(c, 2.6 * s);
    }
    ctx.lineCap = 'butt';
    starPath(x, y, 11.5 * s * k, 5 * s, 4, aim + Math.PI / 4);
    ctx.fillStyle = '#0b0a1a'; ctx.fill(); ctx.fillStyle = hexA(c, 0.35); ctx.fill(); neon(c, 2);
    shapePath(x, y, 5.5 * s * k, 4, false, aim + Math.PI / 2);
    ctx.fillStyle = hexA(cy, 0.55); ctx.fill(); neon(cy, 1.4);
    additive(true); glow(x, y, 9 + Math.sin(t * 6) * 2, '#ffffff', 0.9); additive(false);
    ctx.beginPath(); ctx.arc(x, y, 2.4 + Math.sin(t * 6) * 0.5, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
  } else if (type === 'bolt') {
    const back = (o.kick || 0) * 3;""")
rep("""  // LV3: orbiting shards
  if (lv >= 2) {""", """  // LV3: orbiting shards
  if (lv >= 2 && !master) {""")
rep("""  // LV4: a bright crown ring and a second, counter-turning set of shards
  if (lv >= 3) {""", """  // MASTER BOLT: a spiked gold crown, a cyan dashed halo and four white shards
  if (master) {
    additive(true); glow(x, y, 36, c, 0.32 + Math.sin(t * 3) * 0.1); additive(false);
    for (let i = 0; i < 4; i++) {
      const a = t * 0.9 + i * TAU / 4;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a - 0.24) * 17, y + Math.sin(a - 0.24) * 17);
      ctx.lineTo(x + Math.cos(a) * 24, y + Math.sin(a) * 24); ctx.lineTo(x + Math.cos(a + 0.24) * 17, y + Math.sin(a + 0.24) * 17); ctx.closePath();
      ctx.fillStyle = hexA(c, 0.95); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(x, y, 20.5, 0, TAU); ctx.setLineDash([2, 3]); ctx.lineDashOffset = t * 14;
    ctx.lineWidth = 1.3; ctx.strokeStyle = hexA(d.color, 0.8); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < 4; i++) {
      const a = -t * 1.6 + i * TAU / 4 + Math.PI / 4, ox = x + Math.cos(a) * 20.5, oy = y + Math.sin(a) * 20.5;
      polyPath(ox, oy, 2.2, 4, a); ctx.fillStyle = '#ffffff'; ctx.fill();
    }
  }
  // LV4: a bright crown ring and a second, counter-turning set of shards
  if (lv >= 3 && !master) {""")
open(P_OUT, 'w', encoding='utf-8').write(src)
print('ok')
