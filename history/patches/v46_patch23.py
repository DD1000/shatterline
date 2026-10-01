# v46 (user): NOVA level 4 becomes the SUPERNOVA: a big mortar hole loaded with 4 shells. Same fire rate; each volley
# lobs the main shell (normal damage and blast) plus 3 smaller shells spread to cover as many other enemies as it can.
import sys
p = 'shatterline.html'; s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit(f'anchor count {c} != {n}: {a[:90]!r}')
    s = s.replace(a, b)

rep("const BUILD = 'v45';", "const BUILD = 'v46';")

# ---- data -------------------------------------------------------------------------------------------------------
rep("""  nova:   { name:'NOVA',   color:'#ff7a2e', sides:6, cost:110, unlock:6, desc:'Plasma bomb. Splash, pierces armor.',""",
"""  // v46 (user): level 4 is the SUPERNOVA: same rate, the main shell as before plus `extra` smaller shells (extraDmg x damage,
  // extraSplash tiles of blast) aimed to cover as many other enemies in range as possible.
  nova:   { name:'NOVA',   color:'#ff7a2e', sides:6, cost:110, unlock:6, desc:'Plasma bomb. Splash, pierces armor. Level 4: SUPERNOVA, lobs 3 extra smaller shells to cover more enemies.',""")
rep("                 { cost:300, dmg:29.95, rate:0.29, range:3.8, splash:1.35 } ] },",
    "                 { cost:300, dmg:29.95, rate:0.29, range:3.8, splash:1.35, extra:3, extraDmg:0.2, extraSplash:0.6, supernova:true } ] },")
rep("nova: '等离子炸弹，范围伤害，无视护甲。'", "nova: '等离子炸弹，范围伤害，无视护甲。4 级：超新星，额外抛射 3 发小炮弹覆盖更多敌人。'")
rep("nova: 'Bomba de plasma. Daño en área, atraviesa armadura.'", "nova: 'Bomba de plasma. Daño en área, atraviesa armadura. Nivel 4: SUPERNOVA, lanza 3 proyectiles extra más pequeños para cubrir más enemigos.'")
rep("master_bolt: 'MASTER BOLT',", "master_bolt: 'MASTER BOLT', supernova: 'SUPERNOVA', supernova_line: 'Lobs 4 shells: the main one at full damage, plus 3 smaller ones spread to hit as many enemies as possible ({0}% damage, smaller blast).',")
rep("master_bolt: '大师光弹',", "master_bolt: '大师光弹', supernova: '超新星', supernova_line: '一次抛射 4 发：主炮造成全额伤害，另外 3 发小炮弹分散落下，尽量覆盖更多敌人（{0}% 伤害，爆炸范围更小）。',")
rep("master_bolt: 'RAYO MAESTRO',", "master_bolt: 'RAYO MAESTRO', supernova: 'SUPERNOVA', supernova_line: 'Lanza 4 proyectiles: el principal con daño completo y 3 más pequeños repartidos para alcanzar a todos los enemigos posibles ({0}% de daño, explosión menor).',")

# ---- firing: the main shell, then the 3 spread shells ---------------------------------------------------------------
rep("""  } else if (tw.type === 'nova') {
    const flight = 0.75;
    const slow = tg.slowT > 0 ? 1 - tg.slowAmt : 1;
    const p = tg.path.at(tg.dist + tg.speed * slow * flight);
    G.shells.push({ sx: mx, sy: my, tx: p.x, ty: p.y, t: 0, dur: flight, dmg: L.dmg * boost, splash: L.splash * TILE, color: c, src: tw.type });
    FX.flash(mx, my, 22, c, 0.12);""", """  } else if (tw.type === 'nova') {
    const flight = 0.75;
    const lead = (e, fl) => { const sl = e.slowT > 0 ? 1 - e.slowAmt : 1; return e.path.at(e.dist + e.speed * sl * fl); };
    const p = lead(tg, flight);
    const ox = L.supernova ? tw.x : mx, oy = L.supernova ? tw.y : my;          // the SUPERNOVA lobs out of its hole
    G.shells.push({ sx: ox, sy: oy, tx: p.x, ty: p.y, t: 0, dur: flight, dmg: L.dmg * boost, splash: L.splash * TILE, color: c, src: tw.type });
    if (L.extra) supernovaVolley(tw, L, p, boost, ox, oy, lead);
    FX.flash(ox, oy, 22, c, 0.12);""")
rep("""// TIDE: water jets. Burning towers in range first""", """// v46: SUPERNOVA's spread shells. Each one goes where its small blast covers the most enemies that no shell of this volley
// covers yet (ties: the spot farthest from the other impacts), so the volley reaches as many enemies as it can. Spots are
// where in-range enemies will be when it lands, plus points along the road in range. With nobody left uncovered, the rest
// fan out over the road as wide as they can (they never stack on the main target, so a lone enemy only takes the main shell).
function supernovaVolley(tw, L, main, boost, ox, oy, lead) {
  const R = L.range * TILE, rx = L.extraSplash * TILE, rMain = L.splash * TILE;
  const ground = G.enemies.filter(e => e.alive && !e.rc.flying && e.age >= 0.15);
  const road = [];
  for (const pth of MAP.paths) for (let d = 0; d <= pth.len; d += 10) {
    const q = pth.at(d); if (Math.hypot(q.x - tw.x, q.y - tw.y) <= R) road.push({ e: null, p: q });
  }
  const impacts = [{ x: main.x, y: main.y }];
  const covered = new Set();
  const hits = (o, x, y, r) => Math.hypot(o.p.x - x, o.p.y - y) <= r + o.e.rc.r * 0.5;
  for (let k = 0; k < L.extra; k++) {
    const fl = 0.75 + 0.07 * (k + 1);                                        // they land one after another
    const at = ground.map(e => ({ e, p: lead(e, fl) }));
    if (!k) for (const o of at) if (hits(o, main.x, main.y, rMain)) covered.add(o.e);
    let best = null, bv = -1;
    for (const c of at.filter(o => inRange(tw, o.e, R)).concat(road)) {
      let n = 0; for (const o of at) if (!covered.has(o.e) && hits(o, c.p.x, c.p.y, rx)) n++;
      const spread = Math.min(...impacts.map(q => Math.hypot(q.x - c.p.x, q.y - c.p.y)));
      const v = n * 1e4 + spread;
      if (v > bv) { bv = v; best = c; }
    }
    if (!best) break;
    impacts.push({ x: best.p.x, y: best.p.y });
    for (const o of at) if (hits(o, best.p.x, best.p.y, rx)) covered.add(o.e);
    G.shells.push({ sx: ox, sy: oy, tx: best.p.x, ty: best.p.y, t: 0, dur: fl, dmg: L.dmg * L.extraDmg * boost, splash: rx, color: '#ffb347', src: tw.type, small: true });
  }
  FX.ring(ox, oy, 6, 26, '#ffb347', 0.35, 3);
  for (let i = 0; i < 6; i++) FX.dot(ox, oy, '#ffd9a8', 2.6, 0.4, rand(-50, 50), rand(-70, -20));
}
// TIDE: water jets. Burning towers in range first""")

# ---- shell flight and impact: the small ones are smaller in every way ----------------------------------------------------
rep("""    s.x = lerp(s.sx, s.tx, f); s.y = lerp(s.sy, s.ty, f); s.h = Math.sin(Math.PI * f) * 46;
    if (Math.random() < 0.7) FX.dot(s.x, s.y - s.h, '#ff9a5c', 2.4, 0.3);""",
"""    s.x = lerp(s.sx, s.tx, f); s.y = lerp(s.sy, s.ty, f); s.h = Math.sin(Math.PI * f) * (s.small ? 40 : 46);
    if (Math.random() < (s.small ? 0.45 : 0.7)) FX.dot(s.x, s.y - s.h, s.small ? '#ffc48a' : '#ff9a5c', s.small ? 1.8 : 2.4, 0.3);""")
rep("""        if (d <= s.splash + e.rc.r * 0.5) damage(e, s.dmg * (1 - 0.4 * Math.min(1, d / s.splash)), { pierce: true, big: true });
      }
      FX.flash(s.tx, s.ty, s.splash * 2.2, s.color, 0.3);
      FX.ring(s.tx, s.ty, 4, s.splash, s.color, 0.4, 4);
      FX.ring(s.tx, s.ty, 2, s.splash * 0.55, '#ffffff', 0.25, 2);
      FX.spark(s.tx, s.ty, '#ffc08a', 12, 240, 0.4);
      FX.shards(s.tx, s.ty, s.color, 6, 160, 3);
      addShake(0.16); snd('boom', false);""",
"""        if (d <= s.splash + e.rc.r * 0.5) damage(e, s.dmg * (1 - 0.4 * Math.min(1, d / s.splash)), { pierce: true, big: !s.small });
      }
      FX.flash(s.tx, s.ty, s.splash * 2.2, s.color, s.small ? 0.2 : 0.3);
      FX.ring(s.tx, s.ty, 4, s.splash, s.color, 0.4, s.small ? 2.5 : 4);
      FX.ring(s.tx, s.ty, 2, s.splash * 0.55, '#ffffff', 0.25, 2);
      FX.spark(s.tx, s.ty, '#ffc08a', s.small ? 6 : 12, s.small ? 170 : 240, 0.4);
      if (!s.small) FX.shards(s.tx, s.ty, s.color, 6, 160, 3);
      if (s.small) { addShake(0.05); snd('flakHit'); } else { addShake(0.16); snd('boom', false); }""")
rep("""    ctx.beginPath(); ctx.ellipse(s.x, s.y, 6 * (1 - s.h / 70), 3 * (1 - s.h / 70), 0, 0, TAU);""",
    """    const k = s.small ? 0.65 : 1;
    ctx.beginPath(); ctx.ellipse(s.x, s.y, 6 * k * (1 - s.h / 70), 3 * k * (1 - s.h / 70), 0, 0, TAU);""")
rep("""    glow(s.x, y, 16, s.color, 0.9);
    ctx.beginPath(); ctx.arc(s.x, y, 3.2, 0, TAU); ctx.fillStyle = '#fff4e0'; ctx.fill();""",
"""    glow(s.x, y, s.small ? 10 : 16, s.color, 0.9);
    ctx.beginPath(); ctx.arc(s.x, y, s.small ? 2.2 : 3.2, 0, TAU); ctx.fillStyle = '#fff4e0'; ctx.fill();""")

# ---- the SUPERNOVA look: a big mortar hole with 4 shells loaded round its rim ------------------------------------------
rep("  const wire = !!(d.lv[lv] && d.lv[lv].wire);                                          // v37: ARC level 4, the LIVE WIRE",
    "  const wire = !!(d.lv[lv] && d.lv[lv].wire);                                          // v37: ARC level 4, the LIVE WIRE\n"
    "  const sn = !!(d.lv[lv] && d.lv[lv].supernova);                                       // v46: NOVA level 4, the SUPERNOVA")
rep("  ctx.lineWidth = master || wire ? 2 : 1.2; ctx.strokeStyle = hexA(c, master || wire ? 0.85 : 0.4); ctx.stroke();",
    "  ctx.lineWidth = master || wire || sn ? 2 : 1.2; ctx.strokeStyle = hexA(c, master || wire || sn ? 0.85 : 0.4); ctx.stroke();")
rep("""  } else if (type === 'nova') {
    const back = (o.kick || 0) * 4;""", """  } else if (type === 'nova' && sn) {                  // SUPERNOVA: a big round mortar hole, 4 shells loaded round its rim
    const kk = o.kick || 0;
    ctx.beginPath(); ctx.arc(x, y, 12.8 * s, 0, TAU); ctx.fillStyle = '#0b0a1a'; ctx.fill();
    ctx.lineWidth = 3 * s; ctx.strokeStyle = hexA(c, 0.95); ctx.stroke();
    const hg = ctx.createRadialGradient(x, y, 0, x, y, 9 * s);
    hg.addColorStop(0, kk > 0.05 ? '#fff1c8' : '#05040a'); hg.addColorStop(0.55, kk > 0.05 ? hexA('#ffb347', 0.9) : '#120808'); hg.addColorStop(1, hexA(c, 0.55));
    ctx.beginPath(); ctx.arc(x, y, 9 * s, 0, TAU); ctx.fillStyle = hg; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = hexA('#ffd9a8', 0.6); ctx.stroke();
    for (let i = 0; i < 6; i++) {                          // rifling inside the hole
      const a = t * 0.4 + i * TAU / 6;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 4 * s, y + Math.sin(a) * 4 * s); ctx.lineTo(x + Math.cos(a + 0.5) * 8.4 * s, y + Math.sin(a + 0.5) * 8.4 * s);
      ctx.lineWidth = 1; ctx.strokeStyle = hexA(c, 0.35); ctx.stroke();
    }
    additive(true); glow(x, y, (10 + kk * 18) * s, kk > 0.05 ? '#fff1c8' : c, 0.35 + kk * 0.6 + Math.sin(t * 3) * 0.08); additive(false);
    const load = Math.max(0, 1 - kk * 1.6);                // the shells leave the rim when it fires and reload after
    for (let i = 0; i < 4; i++) {
      const a = t * 0.5 + i * TAU / 4 + Math.PI / 4, sx2 = x + Math.cos(a) * 12.8 * s, sy2 = y + Math.sin(a) * 12.8 * s;
      ctx.globalAlpha = pa * (o.alpha == null ? 1 : o.alpha) * load;
      additive(true); glow(sx2, sy2, 7 * s, i ? '#ffb347' : '#ff7a2e', 0.9); additive(false);
      ctx.beginPath(); ctx.arc(sx2, sy2, (i ? 2.6 : 3.2) * s, 0, TAU); ctx.fillStyle = '#fff4e0'; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = i ? '#ffb347' : c; ctx.stroke();
      ctx.globalAlpha = pa * (o.alpha == null ? 1 : o.alpha);
    }
  } else if (type === 'nova') {
    const back = (o.kick || 0) * 4;""")
rep("  if (lv >= 2 && !master && !wire) {", "  if (lv >= 2 && !master && !wire && !sn) {")
rep("  if (lv >= 3 && !master && !wire) {", "  if (lv >= 3 && !master && !wire && !sn) {")
rep("""  // LIVE WIRE: three blue pylons joined by a crackling ring, inside a dashed yellow crown""",
"""  // SUPERNOVA: four heat fins at the corners, a slow ember ring and a pulsing outer glow
  if (sn) {
    additive(true); glow(x, y, 40, c, 0.28 + Math.sin(t * 2.4) * 0.1); additive(false);
    for (let i = 0; i < 4; i++) {
      const a = i * TAU / 4 + Math.PI / 4, r1 = 17, r2 = 23;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2);
      ctx.lineCap = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = '#0b0a1a'; ctx.stroke(); ctx.lineWidth = 2.2; ctx.strokeStyle = hexA(c, 0.9); ctx.stroke(); ctx.lineCap = 'butt';
    }
    ctx.beginPath(); ctx.arc(x, y, 21, 0, TAU); ctx.setLineDash([2, 5]); ctx.lineDashOffset = -t * 9;
    ctx.lineWidth = 1.3; ctx.strokeStyle = hexA('#ffb347', 0.7); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < 4; i++) {
      const a = -t * 1.1 + i * TAU / 4, ex = x + Math.cos(a) * 21, ey = y + Math.sin(a) * 21;
      additive(true); glow(ex, ey, 6, '#ffb347', 0.8); additive(false);
      ctx.beginPath(); ctx.arc(ex, ey, 1.6, 0, TAU); ctx.fillStyle = '#fff1c8'; ctx.fill();
    }
  }
  // LIVE WIRE: three blue pylons joined by a crackling ring, inside a dashed yellow crown""")

# ---- the upgrade moment and the upgrade tooltip ----------------------------------------------------------------------
rep("""  } else if (TOWERS[tw.type].lv[tw.lv].wire) {               // v37: ARC becomes the LIVE WIRE (lightning strikes it)""",
"""  } else if (TOWERS[tw.type].lv[tw.lv].supernova) {          // v46: NOVA becomes the SUPERNOVA
    FX.text(tw.x, tw.y - 28, tr('supernova'), '#ffb347', 13, { font: FONT_D, life: 1.4 });
    FX.ring(tw.x, tw.y, 12, 74, '#ff7a2e', 0.6, 4); FX.ring(tw.x, tw.y, 6, 48, '#fff1c8', 0.4, 2.5);
    FX.flash(tw.x, tw.y, 90, '#ffb347', 0.4); FX.shards(tw.x, tw.y, '#ff7a2e', 14, 180, 3.5);
    for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + Math.PI / 4; FX.dot(tw.x, tw.y, '#fff1c8', 3.2, 0.6, Math.cos(a) * 120, Math.sin(a) * 120 - 40); }
    addShake(0.3); snd('boom', false);
  } else if (TOWERS[tw.type].lv[tw.lv].wire) {               // v37: ARC becomes the LIVE WIRE (lightning strikes it)""")
rep("""      if (d.lv[tw.lv + 1].wire) {""",
"""      if (d.lv[tw.lv + 1].supernova) { const N4 = d.lv[tw.lv + 1]; title = `${tr('supernova')}  ·  ${cost}`; color = '#ffb347'; line2 = tr('supernova_line', Math.round(N4.extraDmg * 100)); }   // v46
      if (d.lv[tw.lv + 1].wire) {""")

open(p, 'w', encoding='utf-8').write(s); print('ok')
