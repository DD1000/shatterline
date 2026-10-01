# v39 (user): the electrified road is gone. ARC level 4 (still called LIVE WIRE, same look) is chain lightning again:
# faster (1.56 zaps a second) with 8 chains, and every 4th hit an enemy takes from that tower calls down a 20-damage
# lightning bolt on it. Electrified enemies no longer feed on anything (no road).
import sys
p = 'shatterline.html'; s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit(f'anchor count {c} != {n}: {a[:80]!r}')
    s = s.replace(a, b)

rep("const BUILD = 'v38';", "const BUILD = 'v39';")

# ---- data -----------------------------------------------------------------------------
rep("""  // v37 (user): each upgrade fires 20% faster (0.9 / 1.08 / 1.3 zaps a second). Level 4 transforms into the LIVE WIRE:
  // no more chain zaps; it electrifies the whole route(s) passing through its range and hits every ground enemy on
  // them, always at level 3's rate (supercharge and snow don't change it). Electrified enemies feed on it instead (ELEC.wire*).""",
"""  // v37 (user): each upgrade fires 20% faster (0.9 / 1.08 / 1.3 / 1.56 zaps a second). Level 4 is the LIVE WIRE (its own look).
  // v39 (user): the LIVE WIRE's electrified road is gone. It chain-zaps like the other levels, and every 4th hit an enemy
  // takes from that tower calls down a lightning bolt (bolt damage, x beacon boost) on it.""")
rep("desc:'Chain lightning; each upgrade fires faster. Electrified enemies supercharge it. Level 4: LIVE WIRE, electrifies its whole road.',",
    "desc:'Chain lightning; each upgrade fires faster. Electrified enemies supercharge it. Level 4: LIVE WIRE, every 4th hit on an enemy calls down a lightning bolt.',")
rep("                 { cost:260, dmg:2.33, rate:1.3, range:2.8, wire:true } ] },   // v38 (user): road current -90% (was 23.29)",
    "                 { cost:260, dmg:23.29, rate:1.56, range:2.8, chains:8, bolt:20, boltEvery:4, wire:true } ] },")
rep("const ELEC = { r: 1.3, time: 4, off: 4, arcRate: 1.6, arcChains: 3, arcJump: 2.2,\n"
    "  wireR: 2, wireSpeed: 1.2, wireHp: 1.2 };   // v37: on a LIVE WIRE road an electrified enemy reaches 2 more tiles, moves 20% faster and gains 20% health (once)",
    "const ELEC = { r: 1.3, time: 4, off: 4, arcRate: 1.6, arcChains: 3, arcJump: 2.2 };")

# ---- text -----------------------------------------------------------------------------------
rep(" A LIVE WIRE road charges it up.' },", "' },")
rep(" EMP shorts it out. A LIVE WIRE road charges it up.',", " EMP shorts it out.',")
rep("电磁能让它短路。高压电网的道路会让它充能。',", "电磁能让它短路。',", 2)
rep(" EMP lo cortocircuita. Un camino de ALTA TENSIÓN lo carga.',", " EMP lo cortocircuita.',", 2)
rep("arc: '连锁闪电，每次升级射速更快。带电敌人会让它超载。4 级：高压电网，让整条道路带电。'",
    "arc: '连锁闪电，每次升级射速更快。带电敌人会让它超载。4 级：高压电网，同一敌人每被击中 4 次就召来一道闪电。'")
rep("Nivel 4: ALTA TENSIÓN, electrifica todo su camino.'", "Nivel 4: ALTA TENSIÓN, cada 4.º golpe a un enemigo invoca un rayo.'")
rep("wire_line: 'Electrifies its whole road: {0} damage to everything on it, {1} times a second. Electrified enemies feed on it.', charged: 'CHARGED',",
    "wire_line: 'Zaps faster ({0}/s) and chains to {1}. Every 4th hit on the same enemy calls down a {2}-damage lightning bolt.',")
rep("wire_line: '让整条道路带电：路上所有敌人每秒受到 {1} 次 {0} 伤害。带电敌人会从中充能。', charged: '充能',",
    "wire_line: '射速更快（每秒 {0} 次），连锁 {1} 个敌人。同一敌人每被击中 4 次，就会召来一道 {2} 伤害的闪电。',")
rep("wire_line: 'Electrifica todo su camino: {0} de daño a todo lo que haya en él, {1} veces por segundo. Los eléctricos se alimentan de él.', charged: 'CARGADO',",
    "wire_line: 'Dispara más rápido ({0}/s) y encadena {1}. Cada 4.º golpe al mismo enemigo invoca un rayo de {2} de daño.',")
rep("if (d.lv[tw.lv + 1].wire) { const W4 = d.lv[tw.lv + 1]; title = `${tr('live_wire')}  ·  ${cost}`; color = WIRE_BLUE; line2 = tr('wire_line', Math.round(W4.dmg * 10) / 10, W4.rate); }   // v37",
    "if (d.lv[tw.lv + 1].wire) { const W4 = d.lv[tw.lv + 1]; title = `${tr('live_wire')}  ·  ${cost}`; color = WIRE_BLUE; line2 = tr('wire_line', W4.rate, W4.chains, W4.bolt); }   // v37/v39")

# ---- remove the road: mechanics, feeding, drawing ---------------------------------------------------
a = s.index("// ---- LIVE WIRE (v37) ----")
b = s.index("const elecReach = e => (ELEC.r + (e.charged ? ELEC.wireR : 0)) * TILE;")
end = b + len("const elecReach = e => (ELEC.r + (e.charged ? ELEC.wireR : 0)) * TILE;")
s = s[:a] + """// ---- LIVE WIRE bolts (v39) ------------------------------------------------------------------
// A lightning bolt from the sky onto an enemy (ARC level 4: every 4th hit an enemy takes from that tower).
function skyBolt(e, amt) {
  const top = e.y - 150, pts = [{ x: e.x + rand(-24, 24), y: top }];
  for (let y = top + 30; y < e.y - 12; y += 30) pts.push({ x: e.x + rand(-10, 10), y });
  pts.push({ x: e.x, y: e.y });
  FX.zap(pts, '#ffffff', 0.24); FX.zap(pts.map(q => ({ x: q.x + rand(-3, 3), y: q.y })), WIRE_BLUE, 0.2);
  FX.flash(e.x, e.y, 34, '#fff36a', 0.32); FX.ring(e.x, e.y, 4, 28, '#fff36a', 0.35, 2);
  FX.spark(e.x, e.y, WIRE_BLUE, 6, 180, 0.3);
  damage(e, amt, { crit: true, color: '#fff36a' });
}
const elecReach = () => ELEC.r * TILE;""" + s[end:]

rep("""  G.wire = wireTiles();
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
    }
""", """  for (const e of G.enemies) {
    if (!e.alive) continue;
    e.age += dt;
    if (e.elecOff > 0) e.elecOff -= dt;
""")
rep("    if (!held) e.dist += e.speed * sl * dt * (e.charged ? ELEC.wireSpeed : 1);", "    if (!held) e.dist += e.speed * sl * dt;")
rep("""      if (isWireTw(tw)) continue;                                                  // the LIVE WIRE runs at a fixed rate
""", "")
rep("""    if (isWireTw(tw)) { wireUpdate(tw, dt); continue; }
""", "")
rep("""  drawWire(G.time);
""", "")
rep("""    ctx.lineWidth = e.charged ? 1.8 : 1.2; ctx.strokeStyle = e.charged ? 'rgba(255,247,120,0.6)' : 'rgba(246,255,61,0.35)'; ctx.stroke();""",
    """    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(246,255,61,0.35)'; ctx.stroke();""")
rep("""    tw.wireOn = 0; wireRoutes(tw);
    if (tw.wireNear) FX.zap([{ x: tw.x, y: tw.y }, tw.wireNear], '#ffffff', 0.35);
""", """    { const pts = [{ x: tw.x + rand(-20, 20), y: tw.y - 160 }];      // a bolt from the sky onto the tower
      for (let y = tw.y - 130; y < tw.y - 14; y += 30) pts.push({ x: tw.x + rand(-9, 9), y });
      pts.push({ x: tw.x, y: tw.y }); FX.zap(pts, '#ffffff', 0.35); }
""")
rep("} else if (TOWERS[tw.type].lv[tw.lv].wire) {               // v37: ARC becomes the LIVE WIRE; the road lights up from the tower outward",
    "} else if (TOWERS[tw.type].lv[tw.lv].wire) {               // v37: ARC becomes the LIVE WIRE (lightning strikes it)")

# ---- the bolts: every 4th hit an enemy takes from this ARC ----------------------------------------------------
rep("""      FX.spark(cur.x, cur.y, c, 3, 140, 0.25);
      damage(cur, dmg, { color: c });
      dmg *= 0.85;""",
"""      FX.spark(cur.x, cur.y, c, 3, 140, 0.25);
      damage(cur, dmg, { color: c });
      if (L.bolt) {                                                     // v39: LIVE WIRE, every 4th hit on this enemy calls a bolt
        const hits = tw.hits || (tw.hits = new WeakMap()), n = (hits.get(cur) || 0) + 1;
        hits.set(cur, n);
        if (n % L.boltEvery === 0 && cur.alive) { skyBolt(cur, L.bolt * boost); bolts++; }
      }
      dmg *= 0.85;""")
rep("""    let cur = tg, dmg = L.dmg * boost;
    for (let i = 0; i < L.chains + (up ? ELEC.arcChains : 0) && cur; i++) {""",
"""    let cur = tg, dmg = L.dmg * boost, bolts = 0;
    for (let i = 0; i < L.chains + (up ? ELEC.arcChains : 0) && cur; i++) {""")
rep("""    FX.zap(pts, up ? '#fff7a8' : c, up ? 0.22 : 0.17);
    snd('arc');""",
"""    FX.zap(pts, up ? '#fff7a8' : L.wire ? WIRE_BLUE : c, up ? 0.22 : 0.17);
    snd('arc'); if (bolts) { snd('thunder'); addShake(0.04); }""")

for gone in ['wireTiles', 'wireUpdate', 'drawWire', 'wireRoutes', 'isWireTw', 'G.wire', 'e.charged', 'wireR', 'wireHp', 'wireSpeed', "tr('charged')"]:
    if gone in s: sys.exit('left over: ' + gone)
open(p, 'w', encoding='utf-8').write(s); print('ok')
