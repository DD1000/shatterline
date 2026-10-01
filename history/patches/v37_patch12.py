# v37: ARC upgrades fire faster; level 4 = LIVE WIRE (electrifies its whole road); electrified enemies feed on it.
# Also: long tower descriptions wrap in the build tooltip and the NEW TOWER popup.
import sys
p = 'shatterline.html'; s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit(f'anchor count {c} != {n}: {a[:80]!r}')
    s = s.replace(a, b)

rep("const BUILD = 'v36';", "const BUILD = 'v37';")

# ---- ARC data -------------------------------------------------------------
rep("""  arc:    { name:'ARC',    color:'#ffe23d', sides:3, cost:85,  unlock:9, desc:'Lightning that chains between enemies. Electrified enemies supercharge it.',
            lv:[ { dmg:17.5, rate:0.9,  range:2.3, chains:3 },
                 { cost:100, dmg:19.25, rate:0.9,  range:2.4, chains:4 },
                 { cost:170, dmg:21.18, rate:0.9, range:2.6, chains:6 },
                 { cost:260, dmg:23.29, rate:0.9,  range:2.8, chains:8 } ] },""",
"""  // v37 (user): each upgrade fires 20% faster (0.9 / 1.08 / 1.3 zaps a second). Level 4 transforms into the LIVE WIRE:
  // no more chain zaps; it electrifies the whole route(s) passing through its range and hits every ground enemy on
  // them, always at level 3's rate (supercharge and snow don't change it). Electrified enemies feed on it instead (ELEC.wire*).
  arc:    { name:'ARC',    color:'#ffe23d', sides:3, cost:85,  unlock:9, desc:'Chain lightning; each upgrade fires faster. Electrified enemies supercharge it. Level 4: LIVE WIRE, electrifies its whole road.',
            lv:[ { dmg:17.5, rate:0.9,  range:2.3, chains:3 },
                 { cost:100, dmg:19.25, rate:1.08, range:2.4, chains:4 },
                 { cost:170, dmg:21.18, rate:1.3, range:2.6, chains:6 },
                 { cost:260, dmg:23.29, rate:1.3, range:2.8, wire:true } ] },""")

rep("const ELEC = { r: 1.3, time: 4, off: 4, arcRate: 1.6, arcChains: 3, arcJump: 2.2 };",
    "const ELEC = { r: 1.3, time: 4, off: 4, arcRate: 1.6, arcChains: 3, arcJump: 2.2,\n"
    "  wireR: 2, wireSpeed: 1.2, wireHp: 1.2 };   // v37: on a LIVE WIRE road an electrified enemy reaches 2 more tiles, moves 20% faster and gains 20% health (once)")

# ---- descriptions ------------------------------------------------------------
rep("arc: '在敌人之间连锁的闪电。带电敌人会让它超载。'",
    "arc: '连锁闪电，每次升级射速更快。带电敌人会让它超载。4 级：高压电网，让整条道路带电。'")
rep("arc: 'Relámpago que salta entre enemigos. Los eléctricos lo sobrecargan.'",
    "arc: 'Relámpago en cadena; cada mejora dispara más rápido. Los eléctricos lo sobrecargan. Nivel 4: ALTA TENSIÓN, electrifica todo su camino.'")
rep("desc:'Electrified: towers right next to it shut down for 4s. ARC gets supercharged instead. EMP shorts it out.' },",
    "desc:'Electrified: towers right next to it shut down for 4s. ARC gets supercharged instead. EMP shorts it out. A LIVE WIRE road charges it up.' },")
rep("volt: '带电：紧挨着它的塔会短路 4 秒。电弧塔反而会超载。电磁能让它短路。',",
    "volt: '带电：紧挨着它的塔会短路 4 秒。电弧塔反而会超载。电磁能让它短路。高压电网的道路会让它充能。',")
rep("volt: 'Eléctrico: las torres junto a él se apagan 4 s. ARCO se sobrecarga. EMP lo cortocircuita.',",
    "volt: 'Eléctrico: las torres junto a él se apagan 4 s. ARCO se sobrecarga. EMP lo cortocircuita. Un camino de ALTA TENSIÓN lo carga.',")
rep("elec_note: 'Electrified here: towers right next to it shut down for 4s. ARC gets supercharged. EMP shorts it out.',",
    "elec_note: 'Electrified here: towers right next to it shut down for 4s. ARC gets supercharged. EMP shorts it out. A LIVE WIRE road charges it up.',")
rep("elec_note: '本关带电：紧挨着它的塔会短路 4 秒。电弧塔反而会超载。电磁能让它短路。',",
    "elec_note: '本关带电：紧挨着它的塔会短路 4 秒。电弧塔反而会超载。电磁能让它短路。高压电网的道路会让它充能。',")
rep("elec_note: 'Eléctrico aquí: las torres junto a él se apagan 4 s. ARCO se sobrecarga. EMP lo cortocircuita.',",
    "elec_note: 'Eléctrico aquí: las torres junto a él se apagan 4 s. ARCO se sobrecarga. EMP lo cortocircuita. Un camino de ALTA TENSIÓN lo carga.',")

# ---- strings ---------------------------------------------------------------------
rep("master_bolt: 'MASTER BOLT',",
    "master_bolt: 'MASTER BOLT', live_wire: 'LIVE WIRE', wire_line: 'Electrifies its whole road: {0} damage to everything on it, {1} times a second. Electrified enemies feed on it.', charged: 'CHARGED',")
rep("master_bolt: '大师光弹',",
    "master_bolt: '大师光弹', live_wire: '高压电网', wire_line: '让整条道路带电：路上所有敌人每秒受到 {1} 次 {0} 伤害。带电敌人会从中充能。', charged: '充能',")
rep("master_bolt: 'RAYO MAESTRO',",
    "master_bolt: 'RAYO MAESTRO', live_wire: 'ALTA TENSIÓN', wire_line: 'Electrifica todo su camino: {0} de daño a todo lo que haya en él, {1} veces por segundo. Los eléctricos se alimentan de él.', charged: 'CARGADO',")

# ---- tower glyph -----------------------------------------------------------------
rep("const MASTER_GOLD = '#ffd23d';",
    "const MASTER_GOLD = '#ffd23d';\nconst WIRE_BLUE = '#8fe9ff';        // v37: LIVE WIRE accent")
rep("  const master = !!(d.lv[lv] && d.lv[lv].master), c = master ? MASTER_GOLD : d.color;   // v36: MASTER BOLT turns gold",
    "  const master = !!(d.lv[lv] && d.lv[lv].master), c = master ? MASTER_GOLD : d.color;   // v36: MASTER BOLT turns gold\n"
    "  const wire = !!(d.lv[lv] && d.lv[lv].wire);                                          // v37: ARC level 4, the LIVE WIRE")
rep("  ctx.lineWidth = master ? 2 : 1.2; ctx.strokeStyle = hexA(c, master ? 0.85 : 0.4); ctx.stroke();",
    "  ctx.lineWidth = master || wire ? 2 : 1.2; ctx.strokeStyle = hexA(c, master || wire ? 0.85 : 0.4); ctx.stroke();\n"
    "  if (wire) { roundRect(x - 12.5 * s, y - 12.5 * s, 25 * s, 25 * s, 5 * s); ctx.lineWidth = 1; ctx.strokeStyle = hexA(WIRE_BLUE, 0.55); ctx.stroke(); }")
rep("""  } else if (type === 'arc') {
    shapePath(x, y, 10 * s, 3, false, 0);""",
"""  } else if (type === 'arc' && wire) {                  // LIVE WIRE: a spinning hexagram coil with a white-blue storm core
    shapePath(x, y, 12.5 * s * k, 3, false, t * 0.8);
    ctx.fillStyle = hexA(c, 0.16); ctx.fill(); neon(c, 2);
    shapePath(x, y, 12.5 * s * k, 3, false, -t * 0.8 + Math.PI);
    ctx.fillStyle = hexA(WIRE_BLUE, 0.1); ctx.fill(); neon(WIRE_BLUE, 1.5);
    ctx.beginPath(); ctx.arc(x, y, 8 * s, 0, TAU); ctx.lineWidth = 1.2; ctx.strokeStyle = hexA(c, 0.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 5.2 * s, 0, TAU); ctx.strokeStyle = hexA(WIRE_BLUE, 0.9); ctx.stroke();
    additive(true);
    ctx.lineWidth = 1.1; ctx.strokeStyle = hexA('#ffffff', 0.85);
    for (let i = 0; i < 3; i++) {                          // crackles from the core out to the coil
      const a = t * 2.2 + i * TAU / 3 + Math.sin(t * 13 + i) * 0.4, r1 = 11.5 * s;
      const mx = x + Math.cos(a + 0.35) * r1 * 0.5 + Math.sin(t * 31 + i * 7) * 1.6, my = y + Math.sin(a + 0.35) * r1 * 0.5 + Math.cos(t * 29 + i * 5) * 1.6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(mx, my); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.stroke();
    }
    glow(x, y, (12 + (o.kick || 0) * 8 + Math.sin(t * 7) * 2) * s, WIRE_BLUE, 0.95);
    additive(false);
    ctx.beginPath(); ctx.arc(x, y, (3 + Math.sin(t * 7) * 0.6 + (o.kick || 0) * 1.2) * s, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
  } else if (type === 'arc') {
    shapePath(x, y, 10 * s, 3, false, 0);""")
rep("  if (lv >= 2 && !master) {", "  if (lv >= 2 && !master && !wire) {")
rep("  if (lv >= 3 && !master) {", "  if (lv >= 3 && !master && !wire) {")
rep("""  // LV4: a bright crown ring and a second, counter-turning set of shards
""",
"""  // LIVE WIRE: three blue pylons joined by a crackling ring, inside a dashed yellow crown
  if (wire) {
    additive(true); glow(x, y, 38, c, 0.3 + Math.sin(t * 4) * 0.1); glow(x, y, 26, WIRE_BLUE, 0.16); additive(false);
    ctx.beginPath(); ctx.arc(x, y, 23.5, 0, TAU); ctx.setLineDash([4, 3]); ctx.lineDashOffset = -t * 20;
    ctx.lineWidth = 1.4; ctx.strokeStyle = hexA(c, 0.8); ctx.stroke(); ctx.setLineDash([]);
    const py = [];
    for (let i = 0; i < 3; i++) { const a = t * 0.6 + i * TAU / 3 - Math.PI / 2; py.push([x + Math.cos(a) * 19.5, y + Math.sin(a) * 19.5, a]); }
    additive(true); ctx.lineWidth = 1.1; ctx.strokeStyle = hexA(WIRE_BLUE, 0.75);
    for (let i = 0; i < 3; i++) {                          // jagged current between the pylons
      const [x1, y1] = py[i], [x2, y2] = py[(i + 1) % 3];
      ctx.beginPath(); ctx.moveTo(x1, y1);
      for (let j = 1; j < 4; j++) { const f = j / 4; ctx.lineTo(lerp(x1, x2, f) + Math.sin(t * 37 + i * 3 + j * 5) * 2.2, lerp(y1, y2, f) + Math.cos(t * 41 + i * 2 + j * 7) * 2.2); }
      ctx.lineTo(x2, y2); ctx.stroke();
    }
    additive(false);
    for (const [ox, oy, a] of py) { polyPath(ox, oy, 3.4, 4, a); ctx.fillStyle = WIRE_BLUE; ctx.fill(); ctx.beginPath(); ctx.arc(ox, oy, 1.2, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); }
  }
  // LV4: a bright crown ring and a second, counter-turning set of shards
""")

# ---- upgrade: the transformation -------------------------------------------------------
rep("""    addShake(0.25);
  } else FX.text(tw.x, tw.y - 26, tr('tower_lv', tw.lv + 1), c, 12, { font: FONT_D, life: 0.9 });""",
"""    addShake(0.25);
  } else if (TOWERS[tw.type].lv[tw.lv].wire) {               // v37: ARC becomes the LIVE WIRE; the road lights up from the tower outward
    FX.text(tw.x, tw.y - 28, tr('live_wire'), WIRE_BLUE, 13, { font: FONT_D, life: 1.4 });
    FX.ring(tw.x, tw.y, 12, 70, '#fff36a', 0.6, 4); FX.ring(tw.x, tw.y, 6, 46, WIRE_BLUE, 0.45, 2.5);
    FX.flash(tw.x, tw.y, 80, '#fff36a', 0.35); FX.shards(tw.x, tw.y, WIRE_BLUE, 12, 170, 3);
    tw.wireOn = 0; wireRoutes(tw);
    if (tw.wireNear) FX.zap([{ x: tw.x, y: tw.y }, tw.wireNear], '#ffffff', 0.35);
    G.flashA = Math.max(G.flashA || 0, 0.25); G.flashCol = '#fff7c8';
    addShake(0.25); snd('charge');
  } else FX.text(tw.x, tw.y - 26, tr('tower_lv', tw.lv + 1), c, 12, { font: FONT_D, life: 0.9 });""")

# ---- LIVE WIRE mechanics -------------------------------------------------------------------
rep("""function towerZapped(tw) {""",
"""// ---- LIVE WIRE (v37) ------------------------------------------------------------------------
// ARC level 4 electrifies every route (portal -> core) that passes through its range (the nearest one if none does).
// Every WIRE tick, all ground enemies standing on those road tiles take its damage. Live electrified enemies don't:
// they feed on it (see ELEC.wire*).
const isWireTw = tw => tw.type === 'arc' && !!TOWERS.arc.lv[tw.lv].wire;
const tileKey = e => Math.floor(e.y / TILE) * COLS + Math.floor(e.x / TILE);
function routeTiles(i) {
  const pth = MAP.paths[i];
  return pth.tileSet || (pth.tileSet = new Set(expandTiles(pth.tp).map(([c, r]) => r * COLS + c)));
}
function wireRoutes(tw) {
  if (tw.wireRoutes && tw.wireMap === MAP.paths) return tw.wireRoutes;
  const R2 = towerRange(tw) ** 2, out = [], d0 = {};
  let near = null, nd = Infinity, bestI = 0, bestD = Infinity;
  MAP.paths.forEach((pth, i) => {
    let hit = false, md = Infinity, mdist = 0;
    for (let d = 0; d <= pth.len; d += 6) {
      const q = pth.at(d), dd = (q.x - tw.x) ** 2 + (q.y - tw.y) ** 2;
      if (dd < md) { md = dd; mdist = d; }
      if (dd < nd) { nd = dd; near = { x: q.x, y: q.y }; }
    }
    for (const [c, r] of expandTiles(pth.tp)) if (((c + 0.5) * TILE - tw.x) ** 2 + ((r + 0.5) * TILE - tw.y) ** 2 <= R2) { hit = true; break; }
    d0[i] = mdist;
    if (hit) out.push(i);
    if (md < bestD) { bestD = md; bestI = i; }
  });
  if (!out.length && MAP.paths.length) out.push(bestI);
  tw.wireRoutes = out; tw.wireD0 = d0; tw.wireNear = near; tw.wireMap = MAP.paths;
  return out;
}
function wireTiles() {                                         // every tile charged by any LIVE WIRE (null if none)
  let set = null;
  for (const tw of G.towers) {
    if (!isWireTw(tw)) continue;
    set = set || new Set();
    for (const i of wireRoutes(tw)) for (const k of routeTiles(i)) set.add(k);
  }
  return set;
}
function wireUpdate(tw, dt) {
  const L = TOWERS.arc.lv[tw.lv];
  tw.wireOn = Math.min(1, (tw.wireOn == null ? 1 : tw.wireOn) + dt * 1.4);
  tw.wirePulse = Math.max(0, (tw.wirePulse || 0) - dt * 3);
  tw.wireT = (tw.wireT || 0) - dt;                             // a fixed rate: supercharge and snowballs don't change it
  if (tw.wireT > 0 || tw.spawn < 1) return;
  const tiles = new Set();
  for (const i of wireRoutes(tw)) for (const k of routeTiles(i)) tiles.add(k);
  const dmg = L.dmg * (1 + tw.buff);
  let n = 0;
  for (const e of G.enemies) {
    if (!e.alive || e.rc.flying || isLiveElec(e) || !tiles.has(tileKey(e))) continue;
    damage(e, dmg, { color: '#fff36a' });
    n++;
    if (Math.random() < 0.6) FX.spark(e.x, e.y, Math.random() < 0.5 ? '#fff36a' : WIRE_BLUE, 2, 120, 0.22);
  }
  if (!n) { tw.wireT = 0; return; }                          // nobody on the road yet: strike the moment someone steps on
  tw.wireT = 1 / L.rate; tw.wirePulse = 1; tw.kick = 1;
  snd('arc');
}
// the charged road: a glowing band, current racing toward the core, and crackling lightning along it
function drawWire(t) {
  const spans = new Map();                                     // route -> [[from, to], ...] (the part lit so far)
  let pulse = 0;
  for (const tw of G.towers) {
    if (!isWireTw(tw)) continue;
    const on = tw.wireOn == null ? 1 : tw.wireOn, e = on * on * (3 - 2 * on);
    pulse = Math.max(pulse, tw.wirePulse || 0);
    for (const i of wireRoutes(tw)) {
      const L = MAP.paths[i].len, reach = e * L;
      (spans.get(i) || spans.set(i, []).get(i)).push([tw.wireD0[i] - reach, tw.wireD0[i] + reach]);
    }
  }
  if (!spans.size) return;
  const lo = QUALITY.fx < 1;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  additive(true);
  for (const [i, sp] of spans) {
    const pth = MAP.paths[i], step = 9, lines = [];
    let cur = null;
    for (let d = 0; d <= pth.len + step - 1; d += step) {
      const dd = Math.min(d, pth.len);
      if (sp.some(([a, b]) => dd >= a && dd <= b)) { const q = pth.at(dd); (cur = cur || []).push(q); }
      else if (cur) { lines.push(cur); cur = null; }
    }
    if (cur) lines.push(cur);
    for (const pts of lines) {
      if (pts.length < 2) continue;
      const trace = () => { ctx.beginPath(); pts.forEach((q, j) => j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); };
      trace(); ctx.lineWidth = 24; ctx.strokeStyle = hexA('#ffe23d', 0.07 + pulse * 0.1); ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = hexA('#fff36a', 0.3 + pulse * 0.4); ctx.stroke();
      ctx.setLineDash([5, 19]); ctx.lineDashOffset = -t * 150;
      ctx.lineWidth = 2.2; ctx.strokeStyle = hexA('#ffffff', 0.7); ctx.stroke(); ctx.setLineDash([]);
      for (let z = 0; z < (lo ? 1 : 2); z++) {                // two jittery lightning threads, redrawn every frame
        ctx.beginPath();
        pts.forEach((q, j) => {
          const a = q.ang + Math.PI / 2, o = (Math.random() - 0.5) * (7 + pulse * 4);
          const px = q.x + Math.cos(a) * o, py = q.y + Math.sin(a) * o;
          j ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        });
        ctx.lineWidth = 1.1 + pulse * 0.6; ctx.strokeStyle = hexA(z ? '#fff36a' : WIRE_BLUE, 0.5 + pulse * 0.4); ctx.stroke();
      }
    }
  }
  // each LIVE WIRE feeds the road with a flickering bolt
  for (const tw of G.towers) {
    if (!isWireTw(tw) || !tw.wireNear) continue;
    const a = tw.wireNear, n = 5;
    ctx.beginPath(); ctx.moveTo(tw.x, tw.y);
    for (let j = 1; j < n; j++) { const f = j / n; ctx.lineTo(lerp(tw.x, a.x, f) + rand(-3.5, 3.5), lerp(tw.y, a.y, f) + rand(-3.5, 3.5)); }
    ctx.lineTo(a.x, a.y);
    ctx.lineWidth = 1.6 + pulse; ctx.strokeStyle = hexA('#ffffff', 0.55 + pulse * 0.4); ctx.stroke();
    glow(a.x, a.y, 12 + pulse * 8, '#fff36a', 0.5 + pulse * 0.4);
  }
  additive(false);
  ctx.restore();
}
const elecReach = e => (ELEC.r + (e.charged ? ELEC.wireR : 0)) * TILE;
function towerZapped(tw) {""")

# ---- update: wire tiles, feeding, speed ------------------------------------------------------
rep("""  G.domes = G.enemies.filter(a => a.alive && a.domeMax > 0);
  for (const e of G.enemies) {
    if (!e.alive) continue;
    e.age += dt;
    if (e.elecOff > 0) e.elecOff -= dt;""",
"""  G.domes = G.enemies.filter(a => a.alive && a.domeMax > 0);
  G.wire = wireTiles();
  for (const e of G.enemies) {
    if (!e.alive) continue;
    e.age += dt;
    if (e.elecOff > 0) e.elecOff -= dt;
    // v37: a live electrified enemy on a LIVE WIRE road feeds on it: bigger reach and +20% speed while on it, +20% health once
    e.charged = !!G.wire && !e.rc.flying && isLiveElec(e) && G.wire.has(tileKey(e));
    if (e.charged && !e.fed) {
      e.fed = true; e.maxHp *= ELEC.wireHp; e.hp *= ELEC.wireHp;
      FX.text(e.x, e.y - e.rc.r - 8, tr('charged'), '#fff36a', 10, { font: FONT_D, life: 0.8 });
      FX.ring(e.x, e.y, e.rc.r, elecReach(e), '#f6ff3d', 0.4, 2);
    }""")
rep("    if (!held) e.dist += e.speed * sl * dt;",
    "    if (!held) e.dist += e.speed * sl * dt * (e.charged ? ELEC.wireSpeed : 1);")
rep("""    const R2 = (ELEC.r * TILE) ** 2;
    for (const tw of G.towers) {
      if (!volts.some(e => (e.x - tw.x) ** 2 + (e.y - tw.y) ** 2 <= R2)) continue;""",
"""    for (const tw of G.towers) {
      if (isWireTw(tw)) continue;                                                  // the LIVE WIRE runs at a fixed rate
      if (!volts.some(e => (e.x - tw.x) ** 2 + (e.y - tw.y) ** 2 <= elecReach(e) ** 2)) continue;""")
rep("""    if (off) { tw.beamT = null; tw.heat = 0; continue; }
    if (tw.type === 'rail') {""",
"""    if (off) { tw.beamT = null; tw.heat = 0; continue; }
    if (isWireTw(tw)) { wireUpdate(tw, dt); continue; }
    if (tw.type === 'rail') {""")

# ---- drawing: charged road, bigger halos ------------------------------------------------------
rep("""  drawPathFlow(th, G.time);
  if ((G.level""", """  drawPathFlow(th, G.time);
  drawWire(G.time);
  if ((G.level""")
rep("""    ctx.beginPath(); ctx.arc(e.x, e.y, ELEC.r * TILE, 0, TAU);
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(246,255,61,0.35)'; ctx.stroke();""",
"""    ctx.beginPath(); ctx.arc(e.x, e.y, elecReach(e), 0, TAU);
    ctx.lineWidth = e.charged ? 1.8 : 1.2; ctx.strokeStyle = e.charged ? 'rgba(255,247,120,0.6)' : 'rgba(246,255,61,0.35)'; ctx.stroke();""")

# ---- tooltips: the LIVE WIRE upgrade, and long lines wrap -------------------------------------------
rep("""      if (d.lv[tw.lv + 1].master) { title = `${tr('master_bolt')}  ·  ${cost}`; color = MASTER_GOLD; }   // v36""",
"""      if (d.lv[tw.lv + 1].master) { title = `${tr('master_bolt')}  ·  ${cost}`; color = MASTER_GOLD; }   // v36
      if (d.lv[tw.lv + 1].wire) { const W4 = d.lv[tw.lv + 1]; title = `${tr('live_wire')}  ·  ${cost}`; color = WIRE_BLUE; line2 = tr('wire_line', Math.round(W4.dmg), W4.rate); }   // v37""")
rep("""  const w = 250, h = 58;
  const x = clamp(L.cx - w / 2, MAP_X + 4, MAP_X + W - w - 4);""",
"""  const w = 280;
  setFont(11, FONT_UI, 500);
  const l2 = wrapLines(line2, w - 20).slice(0, 3), h = 58 + (l2.length - 1) * 13;   // v37: long lines wrap
  const x = clamp(L.cx - w / 2, MAP_X + 4, MAP_X + W - w - 4);""")
rep("""  setFont(11, FONT_UI, 500); ctx.fillStyle = '#d9d6f5'; ctx.fillText(line2, x + w / 2, y + 32);
  setFont(10, FONT_UI); spacing(1.5); ctx.fillStyle = bad ? '#ff6a78' : hexA('#ffffff', 0.55 + Math.sin(G.clock * 6) * 0.3);
  ctx.fillText(line3, x + w / 2, y + 47); spacing(0);""",
"""  setFont(11, FONT_UI, 500); ctx.fillStyle = '#d9d6f5'; l2.forEach((ln, i) => ctx.fillText(ln, x + w / 2, y + 32 + i * 13));
  setFont(10, FONT_UI); spacing(1.5); ctx.fillStyle = bad ? '#ff6a78' : hexA('#ffffff', 0.55 + Math.sin(G.clock * 6) * 0.3);
  ctx.fillText(line3, x + w / 2, y + 47 + (l2.length - 1) * 13); spacing(0);""")
rep("""function wrapText(str, cx, y, maxW, lh) {""",
"""function wrapLines(str, maxW) {                     // v37: word-wrap into lines with the current font
  const out = []; let line = '';
  for (const k of wrapTokens(String(str))) {
    if (k.sp) { if (line) line += ' '; continue; }
    const t = line + k.t;
    if (ctx.measureText(t.trim()).width > maxW && line.trim()) { out.push(line.trim()); line = k.t; } else line = t;
  }
  if (line.trim()) out.push(line.trim());
  return out.length ? out : [''];
}
function wrapText(str, cx, y, maxW, lh) {""")
# NEW TOWER popup: the description wraps onto up to 3 lines
rep("""      const col = d ? d.color : '#7dffb0', bw = Math.min(300, LW - 32), bh = 74;""",
"""      const bw = Math.min(300, LW - 32);
      setFont(10, FONT_UI, 500);
      const dl = d ? wrapLines(tDesc(G.unlockedTower), bw - 82).slice(0, 3) : [];
      const col = d ? d.color : '#7dffb0', bh = 74 + Math.max(0, dl.length - 1) * 12;""")
rep("""        setFont(10, FONT_UI, 500); ctx.fillStyle = '#d9d6f5'; ctx.fillText(tDesc(G.unlockedTower), cx - bw / 2 + 70, y + 58);""",
"""        setFont(10, FONT_UI, 500); ctx.fillStyle = '#d9d6f5'; dl.forEach((ln, i) => ctx.fillText(ln, cx - bw / 2 + 70, y + 58 + i * 12));""")

open(p, 'w', encoding='utf-8').write(s); print('ok')
# (follow-up tweaks were applied by the inline script in v37/tweak notes: shorter core crackles, pylons at r 21.5, crown r 25, road band alpha 0.12)
