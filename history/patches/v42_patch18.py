# v42 (user): electrified enemies are immune to ARC (ARC still gets supercharged); EMP can't be shut down by them;
# bosses can carry the same modifiers as enemies; a boss version of all 12 regular enemies; two new labs to test them.
import sys
p = 'shatterline.html'; s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit(f'anchor count {c} != {n}: {a[:90]!r}')
    s = s.replace(a, b)
def insert_after_line(prefix, text):
    global s
    lines = s.split('\n'); idx = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    if len(idx) != 1: sys.exit(f'line prefix count {len(idx)}: {prefix!r}')
    lines.insert(idx[0] + 1, text); s = '\n'.join(lines)

rep("const BUILD = 'v41';", "const BUILD = 'v42';")

# ---- the 12 boss versions ------------------------------------------------------------------------------
BOSSES = r"""// ---- v42 (user): a boss version of every regular enemy (lab-only for now: intro 999 keeps them out of the campaign).
// Each is a giant of its kind with a crown, boss rules (boss music, big shatter, the boss health bar) and its base's trick
// turned up. summon.n = how many it calls each time. elecR / iceR / fireR / fireEvery: bigger auras than the normal ones.
Object.assign(ENEMIES, {
  boss_grunt:    { name:'Block King',   baseOf:'grunt',    sides:4, r:20, color:'#ff3d9a', speed:0.6,  hp:520,  gold:70,  armor:3,  leak:5, spin:0.4, eye:true, thick:true, inner:{ sides:4, scale:0.55, spin:-0.6 },
                   boss:true, crown:true, intro:999, summon:{ every:3.5, types:['grunt'], n:3 },
                   desc:'Boss. A giant Block with thick armor. Calls in Blocks as it walks.' },
  boss_scout:    { name:'Dart Queen',   baseOf:'scout',    sides:3, r:17, color:'#8cff3d', speed:1.35, hp:300,  gold:60,  armor:1,  leak:5, spin:0, eye:true, point:true, trail:true, orbit:2,
                   boss:true, crown:true, intro:999, summon:{ every:3, types:['scout'], n:3 },
                   desc:'Boss. Fast and fragile for a boss. Calls in Darts as it runs.' },
  boss_splitter: { name:'Spore Mother', baseOf:'splitter', sides:0, r:22, color:'#35ffb5', speed:0.6,  hp:480,  gold:70,  armor:0,  leak:5, spin:0, eye:true, orbit:6, inner:{ sides:0, scale:0.62, spin:0 },
                   split:{ type:'splitter', n:4 }, boss:true, crown:true, intro:999, summon:{ every:3, types:['mite'], n:3 },
                   desc:'Boss. Drops Mites as it walks and bursts into 4 Spores when destroyed.' },
  boss_brute:    { name:'Fortress',     baseOf:'brute',    sides:6, r:24, color:'#a066ff', speed:0.42, hp:700,  gold:90,  armor:10, leak:6, spin:0.25, eye:true, thick:true, inner:{ sides:6, scale:0.6, spin:-0.5 },
                   boss:true, crown:true, intro:999, summon:{ every:6, types:['brute'], n:2 },
                   desc:'Boss. Enormous armor: small hits barely scratch it. Calls in Bulwarks.' },
  boss_aegis:    { name:'Bastion',      baseOf:'aegis',    sides:5, r:20, color:'#4aa8ff', speed:0.55, hp:420,  gold:80,  armor:0,  leak:5, spin:0.4, eye:true, inner:{ sides:5, scale:0.55, spin:-0.8 },
                   dome:{ r:2.6, hp:500 }, boss:true, crown:true, intro:999, summon:{ every:4, types:['grunt'], n:2 },
                   desc:'Boss. Its huge dome covers everything nearby (they take 20% damage). EMP pops it. Calls in Blocks.' },
  boss_blink:    { name:'Phantom',      baseOf:'blink',    sides:4, r:18, color:'#f4f2ff', speed:0.65, hp:380,  gold:70,  armor:0,  leak:5, spin:0, eye:true, inner:{ sides:4, scale:0.5, spin:1.2 },
                   blink:{ every:2.4, dist:2.2 }, boss:true, crown:true, intro:999, summon:{ every:5, types:['blink'], n:2 },
                   desc:'Boss. Teleports far ahead every few seconds. Calls in Blinks.' },
  boss_mender:   { name:'Lifebloom',    baseOf:'mender',   sides:0, r:20, color:'#ff9ce0', speed:0.55, hp:420,  gold:80,  armor:0,  leak:5, spin:0, plus:true, orbit:4,
                   heal:{ every:2, radius:2.8, pct:0.1 }, boss:true, crown:true, intro:999, summon:{ every:4, types:['grunt'], n:2 },
                   desc:'Boss. Heals every enemy around it every 2 seconds. Calls in Blocks.' },
  boss_titan:    { name:'Colossus',     baseOf:'titan',    sides:8, r:27, color:'#ff8a3d', speed:0.33, hp:1100, gold:120, armor:9,  leak:8, spin:0.15, eye:true, thick:true, inner:{ sides:4, scale:0.5, spin:0.6 },
                   boss:true, crown:true, intro:999,
                   desc:'Boss. Huge, slow and very heavily armored. Takes 8 lives if it reaches the core.' },
  boss_glider:   { name:'Stormwing',    baseOf:'glider',   sides:3, r:19, color:'#9fe8ff', speed:0.7,  hp:420,  gold:80,  armor:0,  leak:5, spin:0, eye:true, point:true, flying:true,
                   boss:true, crown:true, intro:999, summon:{ every:4, types:['glider'], n:2 },
                   desc:'Boss. Flies straight over the path; only FLAK can hit it. Calls in Gliders.' },
  boss_volt:     { name:'Overload',     baseOf:'volt',     sides:3, star:true, r:19, color:'#f6ff3d', speed:0.75, hp:420, gold:80, armor:0, leak:5, spin:1.2, eye:true, inner:{ sides:3, scale:0.45, spin:-1.6 },
                   elec:true, elecR:2.5, boss:true, crown:true, intro:999, summon:{ every:5, types:['volt'], n:1 },
                   desc:'Boss. Electrified with a huge reach: towers within 2.5 tiles shut down (not EMP). Immune to ARC. Calls in Volts.' },
  boss_yeti:     { name:'Frost Giant',  baseOf:'yeti',     sides:6, star:true, r:22, color:'#6fd8ff', speed:0.5, hp:700, gold:90, armor:3, leak:6, spin:0.3, eye:true, thick:true, inner:{ sides:6, scale:0.45, spin:-0.8 },
                   ice:true, iceR:3, boss:true, crown:true, intro:999, summon:{ every:7, types:['yeti'], n:1 },
                   desc:'Boss. Iced: throws snowballs at every tower within 3 tiles. Calls in Yetis.' },
  boss_scorch:   { name:'Inferno',      baseOf:'scorch',   sides:4, star:true, r:20, color:'#ff7a1a', speed:0.7, hp:480, gold:80, armor:0, leak:5, spin:1, eye:true, inner:{ sides:4, scale:0.45, spin:-1.4 },
                   fire:true, fireR:2.6, fireEvery:1.75, boss:true, crown:true, intro:999, summon:{ every:6, types:['scorch'], n:1 },
                   desc:'Boss. On fire: tosses fireballs twice as often and further. Calls in Scorches.' },
});
const BOSS_VERSIONS = ['boss_grunt', 'boss_scout', 'boss_splitter', 'boss_brute', 'boss_aegis', 'boss_blink', 'boss_mender', 'boss_titan', 'boss_glider', 'boss_volt', 'boss_yeti', 'boss_scorch'];
"""
rep("// Carriers pay for what's inside (user, v27):", BOSSES + "// Carriers pay for what's inside (user, v27):")
rep("const ENEMY_ORDER = ['grunt', 'scout', 'splitter', 'brute', 'boss', 'aegis', 'blink', 'mender', 'titan', 'glider', 'volt', 'yeti', 'scorch'];",
    "const ENEMY_ORDER = ['grunt', 'scout', 'splitter', 'brute', 'boss', 'aegis', 'blink', 'mender', 'titan', 'glider', 'volt', 'yeti', 'scorch'].concat(BOSS_VERSIONS);")
rep("  const pool = ENEMY_ORDER.filter(k => k !== 'boss' && !ENEMIES[k].flying",
    "  const pool = ENEMY_ORDER.filter(k => !ENEMIES[k].boss && !ENEMIES[k].flying")

# ---- per-boss auras -------------------------------------------------------------------------------------
rep("const elecReach = () => ELEC.r * TILE;", "const elecReach = e => ((e && e.rc.elecR) || ELEC.r) * TILE;       // v42: Overload reaches further")
rep("        const R2 = (ICE.r * TILE) ** 2; let n = 0;", "        const R2 = ((e.rc.iceR || ICE.r) * TILE) ** 2; let n = 0;")
rep("    const R2 = (FIRE.r * TILE) ** 2; let best = null, bd = R2;", "    const R2 = ((e.rc.fireR || FIRE.r) * TILE) ** 2; let best = null, bd = R2;")
rep("    if (best) { throwFire(e, best); e.fireT = FIRE.every * rand(0.9, 1.1); } else e.fireT = 0.3;",
    "    if (best) { throwFire(e, best); e.fireT = (e.rc.fireEvery || FIRE.every) * rand(0.9, 1.1); } else e.fireT = 0.3;")
rep("    ctx.beginPath(); ctx.arc(e.x, e.y, FIRE.r * TILE, 0, TAU);", "    ctx.beginPath(); ctx.arc(e.x, e.y, (e.rc.fireR || FIRE.r) * TILE, 0, TAU);")
rep("        const n = ref >= 50 ? 3 : 2;", "        const n = S.n || (ref >= 50 ? 3 : 2);")
rep("          if (!o.alive || o.hp >= o.maxHp || (o.x - e.x) ** 2 + (o.y - e.y) ** 2 > R2) continue;",
    "          if (!o.alive || o.hp >= o.maxHp || (o === e && e.rc.boss) || (o.x - e.x) ** 2 + (o.y - e.y) ** 2 > R2) continue;   // (Lifebloom doesn't heal itself)")
rep("    if (e.rc.boss && G.level && G.level.bossPhases && !G.demo) wardenPhase(e);",
    "    if (e.type === 'boss' && G.level && G.level.bossPhases && !G.demo) wardenPhase(e);")
rep("G.waves[w - 1].some(g => g[0] === 'boss'); }", "G.waves[w - 1].some(g => ENEMIES[g[0]].boss); }")

# ---- boss shouts and the boss bar name the boss ---------------------------------------------------------------
rep("    G.shout = { text: tr('warden'), sub: tr('armored_boss'), color: rc.color, t: 0, dur: 1.6 };",
    "    G.shout = type === 'boss' ? { text: tr('warden'), sub: tr('armored_boss'), color: rc.color, t: 0, dur: 1.6 }\n"
    "      : { text: eName(type).toUpperCase(), sub: tr('boss_word'), color: rc.color, t: 0, dur: 1.6 };")
rep("    G.shout = { text: tr('shattered'), sub: G.noBounty ? tr('warden_down') : tr('warden_down_gold', e.rc.gold), color: e.rc.color, t: 0, dur: 1.6 };",
    "    const bn = eName(e.type).toUpperCase();\n"
    "    G.shout = { text: tr('shattered'), sub: e.type === 'boss' ? (G.noBounty ? tr('warden_down') : tr('warden_down_gold', e.rc.gold)) : (G.noBounty ? tr('boss_down', bn) : tr('boss_down_gold', bn, e.rc.gold)), color: e.rc.color, t: 0, dur: 1.6 };")
rep("  ctx.fillText(bosses.length > 1 ? tr('warden_x', bosses.length) : tr('warden'), x, y - 7); spacing(0);",
    "  const one = bosses.every(b => b.type === bosses[0].type), bn = bosses[0].type === 'boss' ? tr('warden') : eName(bosses[0].type).toUpperCase();\n"
    "  ctx.fillText(!one ? tr('bosses_x', bosses.length) : bosses[0].type === 'boss' ? (bosses.length > 1 ? tr('warden_x', bosses.length) : bn) : bosses.length > 1 ? `${bn} ×${bosses.length}` : bn, x, y - 7); spacing(0);")

# ---- the crown ------------------------------------------------------------------------------------------------
rep("function drawGlyph(rc, x, y, o) {",
"""// v42: boss versions wear a crown: a ring of spikes turning slowly, and a faint halo
function drawCrown(x, y, r, t, col) {
  const n = 7, a0 = t * 0.35;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = a0 + i * TAU / n, w = 0.2;
    ctx.moveTo(x + Math.cos(a - w) * (r + 3), y + Math.sin(a - w) * (r + 3));
    ctx.lineTo(x + Math.cos(a) * (r + 10), y + Math.sin(a) * (r + 10));
    ctx.lineTo(x + Math.cos(a + w) * (r + 3), y + Math.sin(a + w) * (r + 3));
  }
  ctx.fillStyle = hexA(col, 0.85); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r + 13, 0, TAU); ctx.setLineDash([2, 5]); ctx.lineDashOffset = -t * 10;
  ctx.lineWidth = 1.2; ctx.strokeStyle = hexA(col, 0.45); ctx.stroke(); ctx.setLineDash([]);
}
function drawGlyph(rc, x, y, o) {""")
rep("""  if (rc.inner) {
    shapePath(x, y, r * rc.inner.scale, rc.inner.sides, false, o.rot2 || 0);""",
"""  if (rc.crown) drawCrown(x, y, r, o.t || 0, col);
  if (rc.inner) {
    shapePath(x, y, r * rc.inner.scale, rc.inner.sides, false, o.rot2 || 0);""")

# ---- level card: crowded enemy rows only name the one you tapped ---------------------------------------------
rep("    ctx.fillText(eName(k).toUpperCase(), ex, ey + 26 + (ens.length > 7 && i % 2 ? 10 : 0));   // stagger names when crowded",
    "    if (gap >= 34 || sel) ctx.fillText(eName(k).toUpperCase(), ex, ey + 26 + (ens.length > 7 && i % 2 && !sel ? 10 : 0));   // stagger names when crowded; a very crowded row names only the tapped one")

# ---- defeat tip: a boss version uses its base enemy's tip -------------------------------------------------------
rep("    const wt = worst && worst[0], variantTip = wt && G.level ? ((G.level.elecTypes || []).includes(wt) ? 'volt' : (G.level.iceTypes || []).includes(wt) ? 'yeti' : (G.level.fireTypes || []).includes(wt) ? 'scorch' : wt) : wt;",
    "    const w0 = worst && worst[0], wt = w0 && ((ENEMIES[w0] && ENEMIES[w0].baseOf) || w0), variantTip = wt && G.level ? ((G.level.elecTypes || []).includes(w0) ? 'volt' : (G.level.iceTypes || []).includes(w0) ? 'yeti' : (G.level.fireTypes || []).includes(w0) ? 'scorch' : wt) : wt;")

# ---- ARC can't hurt electrified enemies (it still gets supercharged by them) ----------------------------------------
rep("    if (!e.alive || e.age < 0.15 || !!e.rc.flying !== air || !inRange(tw, e, range)) continue;",
    "    if (!e.alive || e.age < 0.15 || !!e.rc.flying !== air || !inRange(tw, e, range)) continue;\n"
    "    if (tw.type === 'arc' && isLiveElec(e)) continue;                 // v42: electrified enemies are immune to ARC")
rep("""      FX.spark(cur.x, cur.y, c, 3, 140, 0.25);
      damage(cur, dmg, { color: c });""",
"""      FX.spark(cur.x, cur.y, c, 3, 140, 0.25);
      if (isLiveElec(cur)) immunePop(cur); else damage(cur, dmg, { color: c });""")
rep("        if (!e.alive || e.rc.flying || hit.has(e)) continue;\n        const dd = (e.x - cur.x) ** 2 + (e.y - cur.y) ** 2;",
    "        if (!e.alive || e.rc.flying || hit.has(e) || isLiveElec(e)) continue;\n        const dd = (e.x - cur.x) ** 2 + (e.y - cur.y) ** 2;")
rep("""      P.hit.add(e);
      damage(e, P.dmg, { color: WIRE_BLUE });""",
"""      P.hit.add(e);
      if (isLiveElec(e)) { immunePop(e); continue; }                   // v42: the pulse passes through electrified enemies
      damage(e, P.dmg, { color: WIRE_BLUE });""")
rep("function towerZapped(tw) {",
"""function immunePop(e) {                                           // v42: ARC hit an electrified enemy (at most once a second each)
  if (G.time - (e.immT || -9) < 1) return;
  e.immT = G.time; FX.text(e.x + rand(-5, 5), e.y - e.rc.r - 6, tr('immune'), '#c9c6e8', 9, { font: FONT_D, life: 0.6 });
}
function towerZapped(tw) {""")
# EMP can't be shut down by electrified enemies
rep("""    for (const tw of G.towers) {
      if (!volts.some(e => (e.x - tw.x) ** 2 + (e.y - tw.y) ** 2 <= elecReach(e) ** 2)) continue;""",
"""    for (const tw of G.towers) {
      if (tw.type === 'emp') continue;                                  // v42: EMP keeps working next to them
      if (!volts.some(e => (e.x - tw.x) ** 2 + (e.y - tw.y) ** 2 <= elecReach(e) ** 2)) continue;""")

# ---- text: EN -------------------------------------------------------------------------------------------------------
rep("desc:'Chain lightning; each upgrade fires faster. Electrified enemies supercharge it. Level 4:",
    "desc:'Chain lightning; each upgrade fires faster. Electrified enemies supercharge it but are immune to it. Level 4:")
rep("shorts out electrified enemies. Barely any damage.',\n",
    "shorts out electrified enemies. Barely any damage. Electrified enemies can\\'t shut it down.',\n")
rep("desc:'Electrified: towers right next to it shut down for 4s. ARC gets supercharged instead. EMP shorts it out.' },",
    "desc:'Electrified: towers right next to it shut down for 4s (not EMP; ARC gets supercharged). Immune to ARC. EMP shorts it out.' },")
rep("elec_note: 'Electrified here: towers right next to it shut down for 4s. ARC gets supercharged. EMP shorts it out.',",
    "elec_note: 'Electrified here: towers right next to it shut down for 4s (not EMP; ARC gets supercharged). Immune to ARC. EMP shorts it out.',")
rep("info_elec: 'Some enemies are electrified: towers right next to them shut down. ARC and EMP help.',",
    "info_elec: 'Some enemies are electrified: towers right next to them shut down, and ARC can\\'t hurt them. EMP keeps working and shorts them out.',")
rep("  volt: 'Electrified enemies short out towers right next to them. Keep an EMP a little further back to short them out first, or bring ARC: electricity supercharges it.',",
    "  volt: 'Electrified enemies short out towers right next to them, and ARC can\\'t hurt them. EMP keeps working right beside them: short them out with it and every tower can hit them.',")
rep("master_bolt: 'MASTER BOLT',",
    "master_bolt: 'MASTER BOLT', boss_word: 'BOSS', boss_down: '{0} DOWN', boss_down_gold: '{0} DOWN  +{1}', bosses_x: 'BOSSES ×{0}', immune: 'IMMUNE',")
insert_after_line("    lab_tests_gauntlet: 'Every threat",
    "    lab_name_bosszoo: 'BOSS ZOO I', lab_name_bosszoo2: 'BOSS ZOO II',\n"
    "    lab_tests_bosszoo: 'Six new bosses, one at a time: Block King, Dart Queen, Spore Mother, Fortress, Bastion and Phantom. Later they return with shields, fire, ice and electricity.',\n"
    "    lab_tests_bosszoo2: 'Six more: Lifebloom, Colossus, Stormwing (bring FLAK), Overload, Frost Giant and Inferno. Electrified enemies are immune to ARC; EMP keeps working next to them.',")

# ---- text: ZH -------------------------------------------------------------------------------------------------------
rep("带电敌人会让它超载。4 级：高压电网", "带电敌人会让它超载，但免疫它的伤害。4 级：高压电网")
rep("emp: '最多 4 道激光专找护盾：剥除护盾、击破护罩、让带电敌人短路。几乎没有伤害。',",
    "emp: '最多 4 道激光专找护盾：剥除护盾、击破护罩、让带电敌人短路。几乎没有伤害。带电敌人无法让它短路。',")
rep("紧挨着它的塔会短路 4 秒。电弧塔反而会超载。电磁能让它短路。", "紧挨着它的塔会短路 4 秒（电磁除外，电弧塔反而会超载）。免疫电弧。电磁能让它短路。", 2)
rep("info_elec: '部分敌人带电：紧挨着它们的塔会短路。电弧和电磁有帮助。',",
    "info_elec: '部分敌人带电：紧挨着它们的塔会短路，电弧也伤不了它们。电磁不受影响，还能让它们短路。',")
rep("    volt: '带电的敌人会让紧挨着它的塔短路。把电磁塔放远一点先让它们短路，或带上电弧塔：电会让它超载。',",
    "    volt: '带电的敌人会让紧挨着它的塔短路，电弧也伤不了它们。电磁塔在它们旁边照常工作：先用电磁让它们短路，其他塔就都能打了。',")
rep("master_bolt: '大师光弹',",
    "master_bolt: '大师光弹', boss_word: '首领', boss_down: '{0} 被击碎', boss_down_gold: '{0} 被击碎  +{1}', bosses_x: '首领 ×{0}', immune: '免疫',")
rep("scorch: '灼焰' },",
    "scorch: '灼焰', boss_grunt: '方块之王', boss_scout: '飞镖女王', boss_splitter: '孢子之母', boss_brute: '堡垒', boss_aegis: '神盾主宰', boss_blink: '幻影', boss_mender: '生命之花', boss_titan: '巨像', boss_glider: '风暴之翼', boss_volt: '超载者', boss_yeti: '冰霜巨人', boss_scorch: '炼狱' },")
insert_after_line("    scorch: '着火：每隔几秒",
    "    boss_grunt: '首领。巨大的方块，护甲厚重。行进时召唤方块。', boss_scout: '首领。作为首领速度很快但较脆弱。奔跑时召唤飞镖。',\n"
    "    boss_splitter: '首领。行进时放出螨虫，被摧毁时炸成 4 个孢子。', boss_brute: '首领。护甲极厚，小伤害几乎无效。召唤壁垒。',\n"
    "    boss_aegis: '首领。巨大的护罩覆盖附近所有敌人（只受 20% 伤害）。电磁可将其击破。召唤方块。', boss_blink: '首领。每隔几秒向前远距离瞬移。召唤闪烁。',\n"
    "    boss_mender: '首领。每 2 秒治疗周围所有敌人。召唤方块。', boss_titan: '首领。巨大、缓慢、护甲极重。抵达核心会扣 8 条命。',\n"
    "    boss_glider: '首领。直线飞越道路，只有防空塔能击中。召唤滑翔者。', boss_volt: '首领。带电且范围极大：2.5 格内的塔会短路（电磁除外）。免疫电弧。召唤伏特。',\n"
    "    boss_yeti: '首领。冰霜：向 3 格内所有塔扔雪球。召唤雪怪。', boss_scorch: '首领。着火：扔火球的频率和距离都翻倍。召唤灼焰。',")
insert_after_line("    lab_tests_gauntlet: '25 波里",
    "    lab_name_bosszoo: '首领图鉴 I', lab_name_bosszoo2: '首领图鉴 II',\n"
    "    lab_tests_bosszoo: '六个新首领逐一登场：方块之王、飞镖女王、孢子之母、堡垒、神盾主宰和幻影。之后它们会带着护盾、火焰、冰霜和电再次出现。',\n"
    "    lab_tests_bosszoo2: '另外六个：生命之花、巨像、风暴之翼（带上防空塔）、超载者、冰霜巨人和炼狱。带电敌人免疫电弧；电磁在它们旁边照常工作。',")

# ---- text: ES -------------------------------------------------------------------------------------------------------
rep("Los eléctricos lo sobrecargan. Nivel 4: ALTA TENSIÓN", "Los eléctricos lo sobrecargan pero son inmunes a él. Nivel 4: ALTA TENSIÓN")
rep("emp: 'Hasta 4 láseres que buscan escudos: los quita, rompe cúpulas y cortocircuita a los eléctricos. Casi sin daño.',",
    "emp: 'Hasta 4 láseres que buscan escudos: los quita, rompe cúpulas y cortocircuita a los eléctricos. Casi sin daño. Los eléctricos no pueden apagarlo.',")
rep("las torres junto a él se apagan 4 s. ARCO se sobrecarga. EMP lo cortocircuita.", "las torres junto a él se apagan 4 s (menos EMP; ARCO se sobrecarga). Inmune a ARCO. EMP lo cortocircuita.", 2)
rep("info_elec: 'Algunos enemigos están electrificados: las torres junto a ellos se apagan. ARCO y EMP ayudan.',",
    "info_elec: 'Algunos enemigos están electrificados: las torres junto a ellos se apagan y ARCO no les hace daño. EMP sigue funcionando y los cortocircuita.',")
rep("    volt: 'Los enemigos eléctricos apagan las torres de al lado. Pon un EMP un poco apartado para cortocircuitarlos antes, o lleva ARCO: la electricidad lo sobrecarga.',",
    "    volt: 'Los enemigos eléctricos apagan las torres de al lado y ARCO no les hace daño. EMP sigue funcionando a su lado: úsalo para cortocircuitarlos y todas las torres podrán dañarlos.',")
rep("master_bolt: 'RAYO MAESTRO',",
    "master_bolt: 'RAYO MAESTRO', boss_word: 'JEFE', boss_down: '{0} DERRIBADO', boss_down_gold: '{0} DERRIBADO  +{1}', bosses_x: 'JEFES ×{0}', immune: 'INMUNE',")
rep("scorch: 'Brasa' },",
    "scorch: 'Brasa', boss_grunt: 'Rey Bloque', boss_scout: 'Reina Dardo', boss_splitter: 'Madre Espora', boss_brute: 'Fortaleza', boss_aegis: 'Bastión', boss_blink: 'Fantasma', boss_mender: 'Flor de Vida', boss_titan: 'Coloso', boss_glider: 'Ala Tormenta', boss_volt: 'Sobrecarga', boss_yeti: 'Gigante Helado', boss_scorch: 'Infierno' },")
insert_after_line("    scorch: 'En llamas: cada pocos segundos",
    "    boss_grunt: 'Jefe. Un Bloque gigante con armadura gruesa. Invoca Bloques al avanzar.', boss_scout: 'Jefe. Rápida y frágil para ser jefa. Invoca Dardos mientras corre.',\n"
    "    boss_splitter: 'Jefe. Suelta Ácaros al avanzar y estalla en 4 Esporas al morir.', boss_brute: 'Jefe. Armadura enorme: los golpes pequeños apenas la rozan. Invoca Baluartes.',\n"
    "    boss_aegis: 'Jefe. Su gran cúpula cubre todo lo cercano (reciben un 20% del daño). EMP la rompe. Invoca Bloques.', boss_blink: 'Jefe. Se teletransporta muy lejos cada pocos segundos. Invoca Destellos.',\n"
    "    boss_mender: 'Jefe. Cura a todos los enemigos cercanos cada 2 segundos. Invoca Bloques.', boss_titan: 'Jefe. Enorme, lento y con muchísima armadura. Quita 8 vidas si llega al núcleo.',\n"
    "    boss_glider: 'Jefe. Vuela en línea recta sobre el camino; solo FLAK lo alcanza. Invoca Planeadores.', boss_volt: 'Jefe. Electrificado y con gran alcance: las torres a 2,5 casillas se apagan (menos EMP). Inmune a ARCO. Invoca Voltios.',\n"
    "    boss_yeti: 'Jefe. Helado: lanza bolas de nieve a todas las torres a 3 casillas. Invoca Yetis.', boss_scorch: 'Jefe. En llamas: lanza bolas de fuego el doble de a menudo y más lejos. Invoca Brasas.',")
insert_after_line("    lab_tests_gauntlet: 'Todas las amenazas",
    "    lab_name_bosszoo: 'ZOO DE JEFES I', lab_name_bosszoo2: 'ZOO DE JEFES II',\n"
    "    lab_tests_bosszoo: 'Seis jefes nuevos, uno a uno: Rey Bloque, Reina Dardo, Madre Espora, Fortaleza, Bastión y Fantasma. Luego vuelven con escudos, fuego, hielo y electricidad.',\n"
    "    lab_tests_bosszoo2: 'Seis más: Flor de Vida, Coloso, Ala Tormenta (lleva FLAK), Sobrecarga, Gigante Helado e Infierno. Los eléctricos son inmunes a ARCO; EMP sigue funcionando a su lado.',")

# ---- two new labs --------------------------------------------------------------------------------------------------
LABS = r"""  // ---- v42 (user): the new bosses, and bosses with modifiers ----
  // 11 BOSS ZOO I: Block King, Dart Queen, Spore Mother, Fortress, Bastion and Phantom, then again with shields, fire, ice, electricity
  { id: 'bosszoo', v: 1, map: 74, ref: 70, world: 2, econ: ECON_LEAN50, gold: 420, cal: 0.28, boss: true, waves: [
    [['grunt', 18, 0.5, -1]],
    [['scout', 20, 0.3, 0], ['grunt', 10, 0.5, 0]],
    [['grunt', 10, 0.5, 0], ['boss_grunt', 1, 6, 0]],
    [['brute', 6, 1.2, 0], ['scout', 16, 0.3, 0]],
    [['splitter', 10, 0.8, 0], ['grunt', 14, 0.4, 0]],
    [['scout', 16, 0.3, 0], ['boss_scout', 1, 6, 0]],
    [['brute', 8, 1.0, 0], ['grunt', 16, 0.4, 0]],
    [['splitter', 12, 0.7, 0], ['scout', 20, 0.28, 0]],
    [['grunt', 14, 0.45, 0], ['boss_splitter', 1, 6, 0]],
    [['brute', 8, 1.0, 0, { shield: 1 }], ['grunt', 20, 0.35, 0]],
    [['scout', 26, 0.25, 0], ['splitter', 10, 0.7, 0]],
    [['grunt', 12, 0.5, 0], ['boss_brute', 1, 6, 0]],
    [['brute', 10, 0.9, 0], ['scout', 24, 0.25, 0]],
    [['splitter', 14, 0.6, 0], ['grunt', 24, 0.3, 0]],
    [['grunt', 16, 0.4, 0], ['boss_aegis', 1, 6, 0]],
    [['scout', 30, 0.2, 0], ['brute', 8, 1.0, 0, { elec: 1 }]],
    [['brute', 10, 0.9, 0, { shield: 1 }], ['splitter', 12, 0.6, 0]],
    [['scout', 16, 0.35, 0], ['boss_blink', 1, 6, 0]],
    [['grunt', 30, 0.25, 0], ['brute', 10, 0.9, 0]],
    [['scout', 20, 0.3, 0], ['boss_grunt', 1, 6, 0, { shield: 1 }], ['boss_scout', 1, 6, 0, { fire: 1 }]],
    [['brute', 12, 0.8, 0], ['splitter', 16, 0.5, 0]],
    [['grunt', 20, 0.35, 0], ['boss_splitter', 1, 6, 0, { ice: 1 }], ['boss_blink', 1, 6, 0, { elec: 1 }]],
    [['scout', 36, 0.18, 0], ['brute', 12, 0.8, 0, { shield: 1 }]],
    [['grunt', 30, 0.25, 0], ['boss_brute', 1, 6, 0, { elec: 1 }], ['boss_aegis', 1, 6, 0, { fire: 1 }]],
    [['brute', 10, 0.9, 0], ['boss_grunt', 1, 5, 0], ['boss_scout', 1, 5, 0], ['boss_splitter', 1, 5, 0], ['boss_brute', 1, 5, 0], ['boss_aegis', 1, 5, 0], ['boss_blink', 1, 5, 0]],
  ] },
  // 12 BOSS ZOO II: Lifebloom, Colossus, Stormwing, Overload, Frost Giant and Inferno on a two-lane map, with electric waves
  //   to try ARC's immunity problem and EMP working right next to them
  { id: 'bosszoo2', v: 1, map: 78, ref: 70, world: 6, econ: ECON_LEAN50, gold: 460, cal: 0.28, boss: true, waves: [
    [['grunt', 18, 0.5, -1]],
    [['scout', 20, 0.3, -1], ['grunt', 10, 0.5, 0]],
    [['grunt', 12, 0.5, 0], ['boss_mender', 1, 6, 0]],
    [['volt', 3, 1.3, 0], ['grunt', 14, 0.45, 1]],
    [['brute', 6, 1.2, -1, { elec: 1 }], ['scout', 16, 0.3, 1]],
    [['brute', 6, 1.1, 0], ['boss_titan', 1, 6, 1]],
    [['glider', 8, 0.8, -1], ['grunt', 16, 0.4, 0]],
    [['scout', 22, 0.28, 1], ['glider', 8, 0.7, 0]],
    [['glider', 8, 0.8, 0], ['boss_glider', 1, 6, 0]],
    [['volt', 5, 1.0, -1], ['scout', 16, 0.3, 0, { elec: 1 }]],
    [['brute', 8, 1.0, 1], ['grunt', 20, 0.35, 0]],
    [['volt', 4, 1.1, 0], ['boss_volt', 1, 6, 0]],
    [['grunt', 20, 0.35, -1], ['glider', 10, 0.6, 1]],
    [['scout', 20, 0.28, 1, { ice: 1 }], ['brute', 8, 1.0, 0]],
    [['grunt', 14, 0.45, 1], ['boss_yeti', 1, 6, 1]],
    [['volt', 5, 1.0, 0], ['grunt', 16, 0.4, 1, { fire: 1 }]],
    [['glider', 12, 0.5, -1], ['scout', 24, 0.25, 0]],
    [['grunt', 14, 0.45, 0], ['boss_scorch', 1, 6, 0]],
    [['volt', 6, 0.9, -1], ['brute', 10, 0.9, 0, { elec: 1 }], ['glider', 12, 0.5, 1]],
    [['grunt', 20, 0.35, 1], ['boss_mender', 1, 6, 1, { shield: 1 }], ['boss_titan', 1, 6, 0, { elec: 1 }]],
    [['scout', 30, 0.2, -1], ['brute', 10, 0.9, 0, { shield: 1 }]],
    [['glider', 16, 0.4, -1], ['boss_glider', 1, 6, 1, { elec: 1 }], ['boss_volt', 1, 6, 0, { shield: 1 }]],
    [['brute', 12, 0.8, -1], ['volt', 6, 0.9, 0], ['scout', 30, 0.2, 1]],
    [['brute', 10, 0.9, -1, { elec: 1 }], ['boss_yeti', 1, 6, 0, { shield: 1 }], ['boss_scorch', 1, 6, 1, { elec: 1 }]],
    [['grunt', 20, 0.35, -1], ['boss_mender', 1, 5, 0], ['boss_titan', 1, 5, 1], ['boss_glider', 1, 5, 0], ['boss_volt', 1, 5, 1], ['boss_yeti', 1, 5, 0], ['boss_scorch', 1, 5, 1]],
  ] },
];
const LAB = LAB_DEFS.map((d, i) => {"""
rep("""];
const LAB = LAB_DEFS.map((d, i) => {""", LABS)

open(p, 'w', encoding='utf-8').write(s); print('ok')
# follow-up: crown spikes scale with the enemy (r*1.12..1.48, halo r*1.62) so card icons don't overlap
