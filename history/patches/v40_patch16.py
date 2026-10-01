# v40 (user): LIVE WIRE (ARC level 4) targets the enemy in front, and every attack sends a pulse down all tracks from
# where it hit, dealing 2.3 to each enemy it passes. The every-4th-hit lightning bolts (v39) are replaced by this.
import sys
p = 'shatterline.html'; s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit(f'anchor count {c} != {n}: {a[:80]!r}')
    s = s.replace(a, b)

rep("const BUILD = 'v39';", "const BUILD = 'v40';")

# ---- data + text -------------------------------------------------------------------------------
rep("""  // v39 (user): the LIVE WIRE's electrified road is gone. It chain-zaps like the other levels, and every 4th hit an enemy
  // takes from that tower calls down a lightning bolt (bolt damage, x beacon boost) on it.""",
"""  // v39 (user): the LIVE WIRE's electrified road is gone.
  // v40 (user): the LIVE WIRE zaps the enemy in front (always 'first', no chain), and every zap sends a pulse down all
  // tracks from that enemy that deals trackDmg (x beacon boost) to each ground enemy it passes (see PULSE).""")
rep("                 { cost:260, dmg:23.29, rate:1.56, range:2.8, chains:8, bolt:20, boltEvery:4, wire:true } ] },",
    "                 { cost:260, dmg:23.29, rate:1.56, range:2.8, chains:1, trackDmg:2.3, wire:true } ] },")
rep("Level 4: LIVE WIRE, every 4th hit on an enemy calls down a lightning bolt.',",
    "Level 4: LIVE WIRE, zaps the enemy in front and sends a pulse down every track.',")
rep("4 级：高压电网，同一敌人每被击中 4 次就召来一道闪电。'", "4 级：高压电网，攻击最前面的敌人，并沿所有道路发出脉冲。'")
rep("Nivel 4: ALTA TENSIÓN, cada 4.º golpe a un enemigo invoca un rayo.'", "Nivel 4: ALTA TENSIÓN, ataca al de delante y lanza un pulso por todos los caminos.'")
rep("wire_line: 'Zaps faster ({0}/s) and chains to {1}. Every 4th hit on the same enemy calls down a {2}-damage lightning bolt.',",
    "wire_line: 'Zaps the enemy in front ({0}/s). Each zap sends a pulse down every track that deals {1} to each enemy it passes.',")
rep("wire_line: '射速更快（每秒 {0} 次），连锁 {1} 个敌人。同一敌人每被击中 4 次，就会召来一道 {2} 伤害的闪电。',",
    "wire_line: '攻击最前面的敌人（每秒 {0} 次）。每次攻击都会沿所有道路发出一道脉冲，经过每个敌人时造成 {1} 伤害。',")
rep("wire_line: 'Dispara más rápido ({0}/s) y encadena {1}. Cada 4.º golpe al mismo enemigo invoca un rayo de {2} de daño.',",
    "wire_line: 'Ataca al enemigo de delante ({0}/s). Cada ataque lanza un pulso por todos los caminos que hace {1} de daño a cada enemigo que cruza.',")
rep("line2 = tr('wire_line', W4.rate, W4.chains, W4.bolt); }   // v37/v39",
    "line2 = tr('wire_line', W4.rate, W4.trackDmg); }   // v37/v40")

# ---- targeting: always the enemy in front; no target-mode button at level 4 ------------------------------------
rep("    const v = tw.mode === 'first' ? e.dist / e.path.len * 1e4",
    "    const mode = TOWERS[tw.type].lv[tw.lv].wire ? 'first' : tw.mode;          // v40: the LIVE WIRE always takes the enemy in front\n"
    "    const v = mode === 'first' ? e.dist / e.path.len * 1e4")
rep("tw.mode === 'strong' ? e.hp + e.shield : -((e.x - tw.x) ** 2 + (e.y - tw.y) ** 2);",
    "mode === 'strong' ? e.hp + e.shield : -((e.x - tw.x) ** 2 + (e.y - tw.y) ** 2);")
rep("    ids = d.eco || d.support || d.pulse || d.beams ? ['sell', 'up']",
    "    ids = d.eco || d.support || d.pulse || d.beams || (d.lv[m.tw.lv] && d.lv[m.tw.lv].wire) ? ['sell', 'up']")

# ---- fire: drop the bolts, launch a pulse ---------------------------------------------------------------------
rep("""    let cur = tg, dmg = L.dmg * boost, bolts = 0;""", """    let cur = tg, dmg = L.dmg * boost;""")
rep("""      if (L.bolt) {                                                     // v39: LIVE WIRE, every 4th hit on this enemy calls a bolt
        const hits = tw.hits || (tw.hits = new WeakMap()), n = (hits.get(cur) || 0) + 1;
        hits.set(cur, n);
        if (n % L.boltEvery === 0 && cur.alive) { skyBolt(cur, L.bolt * boost); bolts++; }
      }
""", "")
rep("""    FX.zap(pts, up ? '#fff7a8' : L.wire ? WIRE_BLUE : c, up ? 0.22 : 0.17);
    snd('arc'); if (bolts) { snd('thunder'); addShake(0.04); }""",
"""    FX.zap(pts, up ? '#fff7a8' : L.wire ? WIRE_BLUE : c, up ? 0.22 : 0.17);
    if (L.trackDmg) launchPulse(tw, tg, L.trackDmg * boost);           // v40: LIVE WIRE pulse down every track
    snd('arc');""")

# ---- the pulse ---------------------------------------------------------------------------------------------
a = s.index("// ---- LIVE WIRE bolts (v39) ----")
b = s.index("const elecReach = () => ELEC.r * TILE;")
s = s[:a] + """// ---- LIVE WIRE pulse (v40) -----------------------------------------------------------------------
// Each LIVE WIRE zap sends a pulse out from the enemy it hit, along the road in both directions and into every branch
// (the road is a graph: consecutive tiles of each route are linked, and routes join where they share tiles). The pulse
// front moves PULSE.speed tiles a second and deals its damage once to every ground enemy it passes.
const PULSE = { speed: 12, band: 1 };
function roadGraph() {
  if (MAP.graph && MAP.graph.paths === MAP.paths) return MAP.graph;
  const nb = new Map(), routes = [];
  const link = (a, b) => { (nb.get(a) || nb.set(a, new Set()).get(a)).add(b); };
  for (const pth of MAP.paths) {
    const t = expandTiles(pth.tp), keys = t.map(([c, r]) => r * COLS + c), dist = [0];
    for (let i = 1; i < t.length; i++) dist.push(dist[i - 1] + Math.hypot(t[i][0] - t[i - 1][0], t[i][1] - t[i - 1][1]) * TILE);
    for (let i = 0; i < keys.length - 1; i++) { link(keys[i], keys[i + 1]); link(keys[i + 1], keys[i]); }
    routes.push({ pth, keys, dist });
  }
  return (MAP.graph = { paths: MAP.paths, nb, routes });
}
function launchPulse(tw, from, dmg) {
  if (from.rc.flying) return;
  const g = roadGraph(), k0 = Math.floor(from.y / TILE) * COLS + Math.floor(from.x / TILE);
  if (!g.nb.has(k0)) return;
  const D = new Map([[k0, 0]]), q = [k0];                        // tiles away from the start, following the road
  for (let i = 0; i < q.length; i++) for (const n of g.nb.get(q[i])) if (!D.has(n)) { D.set(n, D.get(q[i]) + 1); q.push(n); }
  let max = 0; for (const v of D.values()) max = Math.max(max, v);
  G.pulses.push({ D, s: 0, max, hit: new Set([from]), dmg, src: tw.type });
}
function pulseAt(g, D, ri, d) {                                  // road distance (tiles) from the pulse start to route ri at dist d
  const R = g.routes[ri]; let i = 0;
  while (i < R.dist.length - 2 && R.dist[i + 1] <= d) i++;
  const a = D.get(R.keys[i]), b = D.get(R.keys[i + 1]);
  if (a == null || b == null) return null;
  return lerp(a, b, clamp((d - R.dist[i]) / (R.dist[i + 1] - R.dist[i]), 0, 1));
}
function updatePulses(dt) {
  if (!G.pulses.length) return;
  const g = roadGraph();
  DMG_SRC = 'arc';
  for (let k = G.pulses.length - 1; k >= 0; k--) {
    const P = G.pulses[k];
    P.s += PULSE.speed * dt;
    const band = Math.max(PULSE.band, PULSE.speed * dt * 1.5);
    for (const e of G.enemies) {
      if (!e.alive || e.rc.flying || P.hit.has(e)) continue;
      const ri = g.routes.findIndex(R => R.pth === e.path);
      if (ri < 0) continue;
      const de = pulseAt(g, P.D, ri, e.dist);
      if (de == null || de > P.s || de < P.s - band) continue;
      P.hit.add(e);
      damage(e, P.dmg, { color: WIRE_BLUE });
      FX.spark(e.x, e.y, Math.random() < 0.5 ? '#ffffff' : WIRE_BLUE, 3, 130, 0.22);
    }
    if (P.s > P.max + 1) G.pulses.splice(k, 1);
  }
  DMG_SRC = null;
}
// the pulse: a bright comet racing along each track away from where it started
function drawPulses() {
  if (!G.pulses || !G.pulses.length) return;
  const g = roadGraph();
  additive(true);
  for (const P of G.pulses) {
    for (let t = 0; t < 3; t++) {
      const sv = P.s - t * 0.3, a = [1, 0.55, 0.3][t];
      if (sv < 0) continue;
      g.routes.forEach((R, ri) => {
        for (let i = 0; i < R.keys.length - 1; i++) {
          const da = P.D.get(R.keys[i]), db = P.D.get(R.keys[i + 1]);
          if (da == null || db == null || da === db || sv < Math.min(da, db) || sv > Math.max(da, db)) continue;
          const d = lerp(R.dist[i], R.dist[i + 1], (sv - da) / (db - da)), q = R.pth.at(d);
          glow(q.x, q.y, 14 - t * 3, WIRE_BLUE, 0.75 * a);
          if (!t) { ctx.beginPath(); ctx.arc(q.x, q.y, 3.2, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); }
        }
      });
    }
  }
  additive(false);
}
""" + s[b:]

# ---- wiring into the game loop, state and drawing ------------------------------------------------------------
rep("  spawners: [], waveStats: {}, enemies: [], towers: [], shots: [], shells: [], domes: [],",
    "  spawners: [], waveStats: {}, enemies: [], towers: [], shots: [], shells: [], domes: [], pulses: [],")
rep("G.spawners = []; G.waveStats = {}; G.enemies = []; G.towers = []; G.shots = []; G.shells = [];",
    "G.spawners = []; G.waveStats = {}; G.enemies = []; G.towers = []; G.shots = []; G.shells = []; G.pulses = [];")
rep("""  DMG_SRC = null;
  if (burnt) for (const tw of burnt) burnDown(tw);""",
"""  DMG_SRC = null;
  updatePulses(dt);                                             // v40: LIVE WIRE pulses
  if (burnt) for (const tw of burnt) burnDown(tw);""")
rep("""  drawPathFlow(th, G.time);
  if ((G.level""", """  drawPathFlow(th, G.time);
  drawPulses();
  if ((G.level""")

for gone in ['skyBolt', 'boltEvery', 'L.bolt', 'bolts = 0', 'bolts++']:
    if gone in s: sys.exit('left over: ' + gone)
open(p, 'w', encoding='utf-8').write(s); print('ok')
# follow-up: brighter, longer pulse comet (5 trail steps, glow 20) applied inline
