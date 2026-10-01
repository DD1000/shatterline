# v47 (user):
#  1) AUTO BUILD is only offered when the loadout is the same set of towers as on the try that was lost.
#  2) TIDE soaks enemies for good. Soaked: ARC +20% damage, PYRO -20% damage, and FROST freezes them even without its
#     snowball supercharge: every 3 blasts, 2 if FROST is supercharged, 2 at level 4, 1 at level 4 and supercharged.
import sys
p = 'shatterline.html'; s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit(f'anchor count {c} != {n}: {a[:90]!r}')
    s = s.replace(a, b)

rep("const BUILD = 'v46';", "const BUILD = 'v47';")

# ---- 1) AUTO BUILD only with the same towers -------------------------------------------------------------------------
rep("  all[n] = { rec: G.rec.slice(), reached: G.waveNum, waves: G.waves.length, at: Date.now() };",
    "  all[n] = { rec: G.rec.slice(), reached: G.waveNum, waves: G.waves.length, at: Date.now(), lo: (G.loadout || []).slice() };")
rep("""  G.autoAsk = RP && RP.rec && RP.rec.length && RP.reached >= 1 ? { R: RP, sel: Math.min(RP.reached, G.waves.length) } : null;""",
"""  G.autoAsk = RP && RP.rec && RP.rec.length && RP.reached >= 1 && sameTowers(RP) ? { R: RP, sel: Math.min(RP.reached, G.waves.length) } : null;""")
rep("""function recAct(k, o) {""",
"""// v47 (user): only offered when you picked the same towers as on that try (in any order). A try saved before v47 has no
// loadout on record, so it counts as the same when every tower it built is in the loadout.
function sameTowers(R) {
  const lo = G.loadout || [];
  if (!R.lo) return R.rec.every(a => a.k !== 'b' || lo.includes(a.type));
  return R.lo.length === lo.length && R.lo.every(t => lo.includes(t));
}
function recAct(k, o) {""")
rep("//  taken, whose tower is gone or not in your loadout. What it builds is recorded again, so a longer next try keeps it all.",
    "//  taken or whose tower is gone. What it builds is recorded again, so a longer next try keeps it all. It is only offered\n"
    "//  when the loadout is the same set of towers as on that try.")

# ---- 2) SOAKED -------------------------------------------------------------------------------------------------------
rep("""const FIRE = { r: 1.95, every: 3.5, burn: 30, refund: 0.25 };""",
"""const FIRE = { r: 1.95, every: 3.5, burn: 30, refund: 0.25 };
// v47 (user): SOAKED enemies. A TIDE jet soaks an enemy for the rest of its trip. Soaked enemies take 20% more damage from
// ARC (water conducts) and 20% less from PYRO, and FROST freezes them even without its snowball supercharge: every
// SOAK.freeze blasts, one fewer when FROST is supercharged and one fewer at level 4 (so 3 / 2 / 2 / 1).
const SOAK = { arc: 1.2, pyro: 0.8, freeze: 3 };""")
rep("e.doused = false; e.fireT = rand(1, 1.8);", "e.doused = false; e.soaked = false; e.markNeed = 0; e.fireT = rand(1, 1.8);")
rep("""  if (e.brittle) amt *= 1.2;
  e.lastHit = G.time; e.flash = 0.07;""",
"""  if (e.brittle) amt *= 1.2;
  if (e.soaked) { if (DMG_SRC === 'arc') amt *= SOAK.arc; else if (DMG_SRC === 'pyro') amt *= SOAK.pyro; }   // v47
  e.lastHit = G.time; e.flash = 0.07;""")

# FROST: soaked enemies freeze without the supercharge
rep("""      if (tw.chillT > 0 && e.iceLock <= 0 && !e.rc.flying) {          // supercharged by snowballs: mark, then freeze
        e.marks = Math.min(ICE.marks, e.marks + 1);
        if (e.marks >= ICE.marks) freezeEnemy(e);
      }""",
"""      const need = frostNeed(tw, e);                                    // supercharged by snowballs, or a soaked enemy
      if (need && e.iceLock <= 0 && !e.rc.flying) {                       // mark, then freeze
        e.marks = Math.min(ICE.marks, e.marks + 1); e.markNeed = need;
        if (e.marks >= need) freezeEnemy(e);
      }""")
rep("""// TIDE: water jets. Burning towers in range first (most burnt first), then burning enemies (out for good), then the rest""",
"""// How many FROST blasts freeze this enemy (0 = this blast can't). Dry: 3, and only while FROST is supercharged by
// snowballs. v47 soaked: 3, one fewer when supercharged, one fewer at level 4 (never under 1).
function frostNeed(tw, e) {
  const sup = tw.chillT > 0;
  if (!e.soaked) return sup ? ICE.marks : 0;
  return Math.max(1, SOAK.freeze - (sup ? 1 : 0) - (tw.lv >= 3 ? 1 : 0));
}
// TIDE: water jets. Burning towers in range first (most burnt first), then burning enemies (out for good), then enemies
// that aren't soaked yet (v47), then the rest. Every enemy a jet hits is soaked for good.""")
rep("""    const wants = e => e.fire && !e.doused ? 1 : 0;""",
    """    const wants = e => e.fire && !e.doused ? 2 : e.soaked ? 0 : 1;""")
rep("""        FX.text(e.x, e.y - e.rc.r - 8, tr('doused'), '#bff8ff', 9, { font: FONT_D, life: 0.6 });
      }
      damage(e, L.dmg * boost, { quiet: true });""",
"""        FX.text(e.x, e.y - e.rc.r - 8, tr('doused'), '#bff8ff', 9, { font: FONT_D, life: 0.6 });
      }
      if (!e.soaked) {                                                      // v47: soaked for good
        e.soaked = true;
        FX.ring(e.x, e.y, e.rc.r, e.rc.r * 2.2, '#7ff0e0', 0.3, 2);
        for (let i = 0; i < 5; i++) FX.dot(e.x + rand(-5, 5), e.y + rand(-5, 5), '#7ff0e0', 2, 0.45, rand(-40, 40), rand(-50, -10));
      }
      damage(e, L.dmg * boost, { quiet: true });""")

# look: a film of water and drips; the frost pips show how many blasts this enemy needs
rep("""      elec: e.elec ? (isLiveElec(e) ? 1 : 0.3) : 0, ice: e.ice, lock: e.iceLock, marks: e.marks, fire: e.fire && !e.doused ? 1 : 0 });""",
    """      elec: e.elec ? (isLiveElec(e) ? 1 : 0.3) : 0, ice: e.ice, lock: e.iceLock, marks: e.marks, need: e.markNeed, fire: e.fire && !e.doused ? 1 : 0, wet: e.soaked });""")
rep("""  if (o.ice) drawIceHalo(x, y, r, o.t);
  if (o.lock > 0) {""",
"""  if (o.ice) drawIceHalo(x, y, r, o.t);
  if (o.wet) drawWetFilm(x, y, r, o.t || 0);
  if (o.lock > 0) {""")
rep("""  if (o.marks > 0) {                     // FROST marks: 3 freeze the enemy
    for (let i = 0; i < 3; i++) {
      const px = x + (i - 1) * 7, py = y - r - 11;""",
"""  if (o.marks > 0) {                     // FROST marks: 3 freeze the enemy (v47: fewer for a soaked one)
    const n = Math.max(1, Math.min(3, o.need || 3));
    for (let i = 0; i < n; i++) {
      const px = x + (i - (n - 1) / 2) * 7, py = y - r - 11;""")
rep("""// Electrified: little bolts of lightning crackling around the body (live = 1, shorted out = 0.3)""",
"""// v47 soaked by TIDE: a film of water hugging the underside, a glint up top, and drops falling off it
function drawWetFilm(x, y, r, t) {
  ctx.beginPath(); ctx.arc(x, y, r + 2.5, 0.12 * Math.PI, 0.88 * Math.PI);
  ctx.lineWidth = 1.8; ctx.strokeStyle = 'rgba(127,240,224,0.85)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r + 2.5, 1.18 * Math.PI, 1.36 * Math.PI);
  ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(225,255,250,0.75)'; ctx.stroke();
  const ga = ctx.globalAlpha; ctx.fillStyle = '#7ff0e0';
  for (let i = 0; i < 2; i++) {
    const ph = (t * 1.1 + i * 0.5) % 1, dx = x + (i ? 0.45 : -0.4) * r, dy = y + r + 3 + ph * 7;
    ctx.globalAlpha = ga * (1 - ph);
    ctx.beginPath(); ctx.arc(dx, dy, 1.4, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(dx - 1.2, dy - 0.5); ctx.lineTo(dx, dy - 3); ctx.lineTo(dx + 1.2, dy - 0.5); ctx.fill();
  }
  ctx.globalAlpha = ga;
}
// Electrified: little bolts of lightning crackling around the body (live = 1, shorted out = 0.3)""")

# ---- text ------------------------------------------------------------------------------------------------------------
rep("""// TIDE's water also puts an enemy's flames out for good.""",
    """// TIDE's water also puts an enemy's flames out for good, and (v47) soaks every enemy it hits (see SOAK).""")
rep("// TIDE (water): water jets that go for burning enemies first and put their flames out for good. Tiny damage.",
    "// TIDE (water): water jets that go for burning enemies first and put their flames out for good. Tiny damage.\n"
    "// v47 (user): every enemy a jet hits is SOAKED for good (ARC +20%, PYRO -20%, FROST freezes it; see SOAK).")
rep("desc:'Water jets that put out burning towers, and burning enemies for good. Barely any damage.',",
    "desc:'Soaks enemies for good: ARC deals +20% to them, PYRO -20%, and FROST freezes them every 3 blasts (fewer when supercharged or at level 4). Puts out fires.',")
rep("tide: '水柱扑灭着火的塔，并将着火的敌人永久浇灭。几乎没有伤害。',",
    "tide: '水柱让敌人永久浸湿：电弧对其伤害 +20%，烈焰 -20%，冰霜每 3 次冲击将其冻住（被强化或 4 级时更快）。能灭火。',")
rep("tide: 'Chorros de agua que apagan torres en llamas, y a los enemigos en llamas para siempre. Casi sin daño.',",
    "tide: 'Empapa a los enemigos para siempre: ARCO les hace +20%, PIRO -20%, y HIELO los congela cada 3 golpes (menos si está potenciado o en nivel 4). Apaga fuegos.',")

open(p, 'w', encoding='utf-8').write(s); print('ok')
