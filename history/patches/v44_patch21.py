# v44 (user): EMP lasers reach flying enemies too (they still barely hurt: FLAK is still what brings flyers down).
import sys
p = 'shatterline.html'; s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit(f'anchor count {c} != {n}: {a[:90]!r}')
    s = s.replace(a, b)

rep("const BUILD = 'v43';", "const BUILD = 'v44';")
# targeting: EMP takes ground and air
rep("""  const air = !!TOWERS[tw.type].air;
  for (const e of G.enemies) {
    if (!e.alive || e.age < 0.15 || !!e.rc.flying !== air || !inRange(tw, e, range)) continue;""",
"""  const air = !!TOWERS[tw.type].air, both = tw.type === 'emp';            // v44: EMP lasers reach flyers as well
  for (const e of G.enemies) {
    if (!e.alive || e.age < 0.15 || (!both && !!e.rc.flying !== air) || !inRange(tw, e, range)) continue;""")
rep("    for (const e of G.enemies) if (e.alive && !e.rc.flying && e.age >= 0.15 && inRange(tw, e, range + (e.domeMax > 0 && !e.domeDead ? e.rc.dome.r * TILE * 0.5 : 0))) list.push(e);",
    "    for (const e of G.enemies) if (e.alive && e.age >= 0.15 && inRange(tw, e, range + (e.domeMax > 0 && !e.domeDead ? e.rc.dome.r * TILE * 0.5 : 0))) list.push(e);   // v44: flyers too")
rep("""      FX.line(tw.x, tw.y, e.x, e.y, want ? '#8fc0ff' : c, 0.16, want ? 3 : 2);
      FX.flash(e.x, e.y, want ? 20 : 12, c, 0.12);""",
"""      const ey = e.rc.flying ? e.y - 5 : e.y;                          // (a flyer hovers above its shadow)
      FX.line(tw.x, tw.y, e.x, ey, want ? '#8fc0ff' : c, 0.16, want ? 3 : 2);
      FX.flash(e.x, ey, want ? 20 : 12, c, 0.12);""")

# ---- text: EMP reaches the air; FLAK is still the one that brings flyers down -----------------------------------
rep("desc:'Up to 4 lasers that hunt shields. Strips them,", "desc:'Up to 4 lasers that hunt shields, on the ground or in the air. Strips them,")
rep("emp: '最多 4 道激光专找护盾：", "emp: '最多 4 道激光专找护盾，地面和空中都能打：")
rep("emp: 'Hasta 4 láseres que buscan escudos: los quita,", "emp: 'Hasta 4 láseres que buscan escudos, en tierra o en el aire: los quita,")

rep("desc:'Flies straight over the path. Only FLAK can hit it.' },", "desc:'Flies straight over the path. Only FLAK can bring it down (EMP lasers reach it but barely hurt).' },")
rep("desc:'Boss. Flies straight over the path; only FLAK can hit it. Calls in Gliders.' },", "desc:'Boss. Flies straight over the path; only FLAK can bring it down. Calls in Gliders.' },")
rep("// NO BOUNTY: enemies drop no gold (Mint is your income). AIR RAID: Gliders fly in (only FLAK hits them).",
    "// NO BOUNTY: enemies drop no gold (Mint is your income). AIR RAID: Gliders fly in (only FLAK brings them down; EMP reaches them).")
rep("line:'Gliders fly over the path. Only FLAK can hit them.' },", "line:'Gliders fly over the path. Only FLAK can bring them down.' },")
rep("desc:'Anti-air missiles. The only tower that hits flyers.',", "desc:'Anti-air missiles. The only tower that can bring flyers down.',")
rep("confirm_air: 'Gliders fly over the path and only {0} can hit them. Are you sure you want to play without it?',",
    "confirm_air: 'Gliders fly over the path and only {0} can bring them down. Are you sure you want to play without it?',")
rep("  glider: 'Gliders fly straight to your core. Only FLAK towers can hit them. Build FLAK under the flight line.',",
    "  glider: 'Gliders fly straight to your core. Only FLAK can bring them down. Build FLAK under the flight line.',")

rep("glider: '直线飞越道路。只有防空塔能击中。',", "glider: '直线飞越道路。只有防空塔能击落它（电磁激光能打到它，但几乎没有伤害）。',")
rep("boss_glider: '首领。直线飞越道路，只有防空塔能击中。召唤滑翔者。',", "boss_glider: '首领。直线飞越道路，只有防空塔能击落它。召唤滑翔者。',")
rep("air: ['空袭', '滑翔者飞越道路，只有防空塔能击中。'],", "air: ['空袭', '滑翔者飞越道路，只有防空塔能击落它们。'],")
rep("    glider: '滑翔者直线飞向核心。只有防空塔能击中它们。在飞行线下方建造防空塔。',", "    glider: '滑翔者直线飞向核心。只有防空塔能击落它们。在飞行线下方建造防空塔。',")
rep("confirm_air: '滑翔者会飞越道路，只有{0}能击中它们。确定不带就开始吗？',", "confirm_air: '滑翔者会飞越道路，只有{0}能击落它们。确定不带就开始吗？',")
rep("flak: '防空导弹。唯一能击中飞行敌人的塔。',", "flak: '防空导弹。唯一能击落飞行敌人的塔。',")

rep("glider: 'Vuela en línea recta sobre el camino. Solo FLAK lo alcanza.',", "glider: 'Vuela en línea recta sobre el camino. Solo FLAK puede derribarlo (los láseres de EMP lo alcanzan, pero apenas le hacen daño).',")
rep("boss_glider: 'Jefe. Vuela en línea recta sobre el camino; solo FLAK lo alcanza. Invoca Planeadores.',", "boss_glider: 'Jefe. Vuela en línea recta sobre el camino; solo FLAK puede derribarlo. Invoca Planeadores.',")
rep("air: ['ATAQUE AÉREO', 'Los planeadores vuelan sobre el camino. Solo FLAK los alcanza.'],", "air: ['ATAQUE AÉREO', 'Los planeadores vuelan sobre el camino. Solo FLAK puede derribarlos.'],")
rep("    glider: 'Los planeadores vuelan directos a tu núcleo. Solo FLAK los alcanza. Constrúyela bajo la línea de vuelo.',",
    "    glider: 'Los planeadores vuelan directos a tu núcleo. Solo FLAK puede derribarlos. Constrúyela bajo la línea de vuelo.',")
rep("confirm_air: 'Los planeadores vuelan sobre el camino y solo {0} puede alcanzarlos. ¿Seguro que quieres jugar sin ella?',",
    "confirm_air: 'Los planeadores vuelan sobre el camino y solo {0} puede derribarlos. ¿Seguro que quieres jugar sin ella?',")
rep("flak: 'Misiles antiaéreos. La única torre que alcanza a los voladores.',", "flak: 'Misiles antiaéreos. La única torre que puede derribar a los voladores.',")

open(p, 'w', encoding='utf-8').write(s); print('ok')
