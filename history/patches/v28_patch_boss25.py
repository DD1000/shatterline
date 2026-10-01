#!/usr/bin/env python3
# v28 (user): every boss level is 25 waves long (campaign levels 10..80 and the three boss labs)
import sys
P = '/home/claude/live/v28/shatterline.html'
src = open(P, encoding='utf-8').read()

def rep(old, new, count=1):
    global src
    n = src.count(old)
    if n != count:
        sys.exit(f'anchor found {n}x (want {count}):\n{old[:200]}')
    src = src.replace(old, new)

# ---- campaign: boss levels are always 25 waves
rep("const waveCount = L => { const base = Math.min(20, Math.round(5 + (L - 1) * 15 / 79)); return L % LEVELS_PER_WORLD === 0 ? Math.min(25, base + 5) : base; };",
    "// v28 (user): every boss level (10, 20 ... 80) is 25 waves long\n"
    "const BOSS_WAVES = 25;\n"
    "const waveCount = L => L % LEVELS_PER_WORLD === 0 ? BOSS_WAVES : Math.min(20, Math.round(5 + (L - 1) * 15 / 79));")
rep("  // v23: levels get longer as you go: 5 waves at level 1 up to 20 by level 80; boss levels add 5 (up to 25)\n",
    "  // v23: levels get longer as you go: 5 waves at level 1 up to 20 by level 80; v28: boss levels are always 25\n")

# ---- labs: authored toughness grows 4% a wave up to the old length, then 2% a wave over the added waves
rep("  lv.hp = base ? (w => base.hp(w) / LEVEL_CAL[d.clone - 1] * lv.cal) : (w => levelHp(lv.ref) * (1 + 0.04 * (w - 1)) * lv.cal);",
    "  const k = d.grewAt ? d.grewAt - 1 : 1e9;        // v28: waves added past the old length toughen more gently\n"
    "  lv.hp = base ? (w => base.hp(w) / LEVEL_CAL[d.clone - 1] * lv.cal) : (w => levelHp(lv.ref) * (1 + 0.04 * Math.min(w - 1, k) + 0.02 * Math.max(0, w - 1 - k)) * lv.cal);")

# WARDEN TRIAL: 15 -> 25 waves. Wardens at 8 and 16, two at the end.
old_w = src[src.index("  { id: 'warden', map: 70,"):src.index("  // ---- v26: six more hand-made labs")]
new_w = """  // v28 (user: every boss level is 25 waves): Wardens at 8 and 16, two at the end (waves 15-24 are new)
  { id: 'warden', v: 2, grewAt: 15, map: 70, ref: 70, world: 7, econ: ECON_LEAN50, gold: 400, cal: 0.31, boss: true, bossPhases: true, waves: [
    [['grunt', 20, 0.5, -1]],
    [['scout', 22, 0.3, 0], ['grunt', 12, 0.5, 1]],
    [['brute', 6, 1.3, -1], ['grunt', 12, 0.45, 0]],
    [['splitter', 10, 0.8, 1], ['blink', 8, 0.8, 0]],
    [['aegis', 2, 3.0, 0], ['grunt', 24, 0.35, -1]],
    [['titan', 2, 3.2, 1], ['scout', 24, 0.25, 0]],
    [['mender', 4, 1.2, 0], ['brute', 8, 1.0, 0], ['volt', 3, 1.2, 1]],
    [['grunt', 16, 0.5, 1], ['boss', 1, 6, 0]],
    [['yeti', 3, 1.8, 0], ['blink', 14, 0.6, 1]],
    [['scorch', 4, 1.3, 1], ['splitter', 12, 0.7, 0]],
    [['titan', 3, 2.8, -1], ['aegis', 3, 2.2, 0]],
    [['scout', 40, 0.18, -1], ['brute', 8, 1.0, 0, { elec: 1 }]],
    [['mender', 5, 1.1, 1], ['titan', 3, 2.6, 1], ['grunt', 30, 0.25, 0]],
    [['aegis', 4, 1.8, -1], ['blink', 20, 0.45, 0], ['yeti', 3, 1.6, 1]],
    [['brute', 10, 0.9, -1], ['scorch', 4, 1.2, 1], ['scout', 24, 0.22, 0]],
    [['aegis', 2, 2.6, 0], ['grunt', 20, 0.35, 1], ['boss', 1, 6, 0]],
    [['yeti', 4, 1.5, -1], ['splitter', 14, 0.55, 0]],
    [['volt', 5, 1.0, 1], ['blink', 18, 0.45, 0, { elec: 1 }]],
    [['titan', 3, 2.5, 0], ['mender', 5, 1.1, 0], ['scout', 30, 0.2, 1]],
    [['brute', 12, 0.8, -1, { shield: 1 }], ['aegis', 3, 2.0, 1]],
    [['scorch', 6, 0.9, 0], ['splitter', 16, 0.5, 1], ['grunt', 30, 0.22, -1]],
    [['titan', 4, 2.3, -1], ['yeti', 3, 1.5, 0], ['blink', 20, 0.4, 1]],
    [['mender', 6, 1.0, -1], ['brute', 12, 0.8, 0], ['scout', 40, 0.16, 1]],
    [['aegis', 4, 1.8, -1], ['titan', 4, 2.2, 0], ['volt', 5, 1.0, 1], ['grunt', 36, 0.2, -1]],
    [['brute', 10, 1.0, -1], ['aegis', 3, 2.0, 0], ['scout', 30, 0.2, 1], ['boss', 2, 6, -1]],
  ] },
"""
src = src.replace(old_w, new_w)

# BOSS RUSH: 12 -> 25 waves. A Warden every 4 waves, two at 20, two at the end.
old_b = src[src.index("  // 8 BOSS RUSH:"):src.index("  // 9 SPLIT PUSH:")]
new_b = """  // 8 BOSS RUSH: a Warden every 4 waves, two at wave 20 and two at the end, all with the shield and rage phases
  //   (v28, user: every boss level is 25 waves; it was 12, with Wardens at 4, 8 and two at 12)
  { id: 'bossrush', v: 2, grewAt: 12, map: 75, ref: 70, world: 6, econ: ECON_LEAN, gold: 450, cal: 0.27, boss: true, bossPhases: true, waves: [
    [['grunt', 20, 0.5, -1]],
    [['scout', 20, 0.3, 0], ['brute', 4, 1.4, 1]],
    [['splitter', 10, 0.8, -1], ['grunt', 14, 0.4, 1]],
    [['grunt', 14, 0.5, 0], ['boss', 1, 6, 0]],
    [['aegis', 2, 3.0, 1], ['blink', 12, 0.6, -1]],
    [['titan', 2, 3.0, 0], ['scout', 24, 0.25, 1]],
    [['mender', 3, 1.3, 1], ['brute', 8, 1.0, 1], ['grunt', 16, 0.4, 0]],
    [['scout', 16, 0.35, 0], ['boss', 1, 6, 1]],
    [['yeti', 3, 1.8, 0], ['splitter', 12, 0.7, 1]],
    [['titan', 3, 2.8, -1], ['volt', 4, 1.1, 0]],
    [['aegis', 3, 2.2, -1], ['blink', 18, 0.45, 0], ['scorch', 3, 1.3, 1]],
    [['brute', 8, 1.0, -1], ['grunt', 18, 0.35, 0], ['boss', 1, 6, 1]],
    [['splitter', 14, 0.6, 0], ['mender', 4, 1.2, 1], ['scout', 22, 0.25, 1]],
    [['titan', 3, 2.6, 1], ['brute', 8, 1.0, 0, { shield: 1 }]],
    [['yeti', 3, 1.6, -1], ['blink', 18, 0.45, 0], ['grunt', 24, 0.3, 1]],
    [['aegis', 2, 2.6, 0], ['scout', 26, 0.22, 1], ['boss', 1, 6, 0]],
    [['scorch', 5, 1.1, -1], ['splitter', 14, 0.55, 1]],
    [['titan', 3, 2.5, 0], ['volt', 5, 1.0, 1], ['grunt', 28, 0.25, -1]],
    [['mender', 5, 1.1, -1], ['brute', 10, 0.9, 0], ['blink', 20, 0.4, 1]],
    [['grunt', 24, 0.3, -1], ['boss', 2, 8, -1]],
    [['aegis', 3, 2.0, -1], ['scout', 36, 0.18, 0], ['yeti', 3, 1.5, 1]],
    [['titan', 4, 2.3, -1], ['splitter', 16, 0.5, 0], ['scorch', 4, 1.0, 1]],
    [['brute', 12, 0.8, 0, { shield: 1 }], ['mender', 5, 1.0, 1], ['volt', 5, 1.0, 1]],
    [['aegis', 4, 1.8, -1], ['blink', 22, 0.38, 0], ['titan', 3, 2.2, 1], ['grunt', 30, 0.22, -1]],
    [['brute', 10, 0.9, -1], ['grunt', 24, 0.3, 0], ['boss', 2, 8, -1]],
  ] },
"""
src = src.replace(old_b, new_b)

# THE GAUNTLET: 16 -> 25 waves. Waves 16-24 are new; the Warden still closes it out.
old_g = src[src.index("  // 10 THE GAUNTLET:"):src.index("];\nconst LAB = LAB_DEFS.map(")]
new_g = """  // 10 THE GAUNTLET: every threat in the game, flyers and shields included, and a Warden to finish
  //   (v28, user: every boss level is 25 waves; it was 16, waves 16-24 are new)
  { id: 'gauntlet', v: 2, grewAt: 16, map: 80, ref: 70, world: 0, econ: ECON_LEAN, gold: 560, cal: 0.2, boss: true, bossPhases: true, waves: [
    [['grunt', 20, 0.45, -1]],
    [['scout', 24, 0.26, 0], ['glider', 5, 1.0, 1]],
    [['brute', 6, 1.2, 0, { shield: 1 }], ['grunt', 14, 0.4, 1]],
    [['splitter', 12, 0.7, -1], ['mender', 2, 1.6, 0]],
    [['aegis', 1, 3.0, 0], ['grunt', 12, 0.5, 0], ['blink', 12, 0.6, 1]],
    [['scorch', 4, 1.2, 1], ['grunt', 22, 0.3, 0]],
    [['yeti', 3, 1.8, 0], ['scout', 26, 0.22, 1]],
    [['volt', 4, 1.1, 1], ['brute', 7, 1.0, 0, { elec: 1 }]],
    [['titan', 2, 3.0, -1], ['glider', 12, 0.5, -1]],
    [['blink', 16, 0.5, 0, { fire: 1 }], ['aegis', 3, 2.2, 1]],
    [['mender', 5, 1.1, 0], ['titan', 3, 2.6, 0], ['splitter', 12, 0.6, 1]],
    [['scout', 40, 0.18, -1], ['yeti', 3, 1.6, 1], ['glider', 14, 0.45, 0]],
    [['brute', 10, 0.9, 0, { shield: 1 }], ['volt', 5, 1.0, 1], ['scorch', 5, 1.0, 0]],
    [['titan', 4, 2.3, -1], ['aegis', 3, 2.0, -1], ['grunt', 36, 0.2, 0]],
    [['blink', 20, 0.4, -1, { elec: 1 }], ['glider', 18, 0.4, -1], ['splitter', 16, 0.5, 1]],
    [['splitter', 14, 0.55, 0, { ice: 1 }], ['glider', 12, 0.5, 1], ['mender', 4, 1.2, 0]],
    [['scorch', 6, 0.9, -1], ['brute', 10, 0.9, 1, { shield: 1 }]],
    [['glider', 24, 0.35, -1], ['grunt', 30, 0.22, 0]],
    [['yeti', 4, 1.5, 0], ['titan', 3, 2.5, 1, { fire: 1 }], ['scout', 30, 0.2, -1]],
    [['aegis', 4, 1.8, -1], ['blink', 22, 0.38, 0], ['volt', 5, 1.0, 1]],
    [['mender', 6, 1.0, -1], ['brute', 12, 0.8, 0, { elec: 1 }], ['glider', 16, 0.4, 1]],
    [['titan', 4, 2.2, -1], ['splitter', 18, 0.45, 0], ['scorch', 5, 1.0, 1]],
    [['scout', 44, 0.16, -1], ['yeti', 4, 1.4, 0], ['glider', 20, 0.35, -1]],
    [['aegis', 4, 1.7, -1], ['brute', 12, 0.8, 1, { shield: 1 }], ['titan', 3, 2.2, 0], ['volt', 5, 1.0, 0]],
    [['brute', 12, 0.8, -1], ['scorch', 5, 1.0, 1], ['mender', 5, 1.1, 0], ['glider', 16, 0.4, -1], ['boss', 1, 6, 0]],
  ] },
"""
src = src.replace(old_g, new_g)

# ---- what the lab cards say
for old, new in [
  ("lab_tests_warden: 'A Warden at wave 8, two at the end. At 60% health: shield. At 30%: enraged.'",
   "lab_tests_warden: 'A Warden at waves 8 and 16, two at the end of 25. At 60% health: shield. At 30%: enraged.'"),
  ("lab_tests_warden: '第 8 波一个守卫者，最后两个。60% 生命时开盾，30% 时狂暴。'",
   "lab_tests_warden: '第 8、16 波各一个守卫者，第 25 波最后两个。60% 生命时开盾，30% 时狂暴。'"),
  ("lab_tests_warden: 'Un Guardián en la oleada 8 y dos al final. Al 60%: escudo. Al 30%: furia.'",
   "lab_tests_warden: 'Un Guardián en las oleadas 8 y 16, y dos al final de la 25. Al 60%: escudo. Al 30%: furia.'"),
  ("lab_tests_bossrush: 'A Warden at waves 4 and 8, two at the end. Every one shields up at 60% and rages at 30%.'",
   "lab_tests_bossrush: 'A Warden every 4 waves, two at wave 20 and two more at the end. Each shields up at 60% and rages at 30%.'"),
  ("lab_tests_bossrush: '第 4、8 波各一个守卫者，最后两个。每个在 60% 时开盾，30% 时狂暴。'",
   "lab_tests_bossrush: '每 4 波一个守卫者，第 20 波两个，最后再来两个。每个在 60% 时开盾，30% 时狂暴。'"),
  ("lab_tests_bossrush: 'Un Guardián en las oleadas 4 y 8, y dos al final. Todos con escudo al 60% y furia al 30%.'",
   "lab_tests_bossrush: 'Un Guardián cada 4 oleadas, dos en la oleada 20 y dos más al final. Todos con escudo al 60% y furia al 30%.'"),
  ("lab_tests_gauntlet: 'Every threat in the game in 16 waves: flyers, shields, fire, ice, electricity, and a Warden.'",
   "lab_tests_gauntlet: 'Every threat in the game in 25 waves: flyers, shields, fire, ice, electricity, and a Warden.'"),
  ("lab_tests_gauntlet: '16 波里有游戏中所有威胁：飞行、护盾、火、冰、电，最后还有守卫者。'",
   "lab_tests_gauntlet: '25 波里有游戏中所有威胁：飞行、护盾、火、冰、电，最后还有守卫者。'"),
  ("lab_tests_gauntlet: 'Todas las amenazas del juego en 16 oleadas: voladores, escudos, fuego, hielo, electricidad y un Guardián.'",
   "lab_tests_gauntlet: 'Todas las amenazas del juego en 25 oleadas: voladores, escudos, fuego, hielo, electricidad y un Guardián.'"),
]:
    rep(old, new)


# ---- keep the longer boss levels about as hard as before for the bot testers (levels 20, 60, 70 got easier at 25 waves)
import re
m = re.search(r'const LEVEL_CAL = \[([\s\S]*?)\];', src)
vals = [x.strip() for x in m.group(1).split(',') if x.strip()]
for n, c in {20: '0.9', 60: '0.29', 70: '0.335'}.items(): vals[n - 1] = c
rows = ['  ' + ', '.join(vals[i:i + 10]) + ',' for i in range(0, len(vals), 10)]
src = src[:m.start()] + '// v28: boss levels are 25 waves; 20, 60 and 70 got easier for the bots, so they are toughened back (0.84 > 0.9, 0.27 > 0.29, 0.28 > 0.335)\nconst LEVEL_CAL = [\n' + '\n'.join(rows) + '\n];' + src[m.end():]

open(P, 'w', encoding='utf-8').write(src)
print('ok', len(src))
