#!/usr/bin/env python3
# v35 (user): BOLT crits on a fixed pattern. Every 4th shot crits at level 1; each upgrade makes the shot before it
# crit too (level 2: shots 3-4 of every 4, level 3: shots 2-4), and at level 4 every shot crits. Crit = x2.5 damage.
import sys
P_IN, P_OUT = '/home/claude/live/v35/base.html', '/home/claude/live/v35/shatterline.html'
src = open(P_IN, encoding='utf-8').read()
def rep(old, new):
    global src
    n = src.count(old)
    if n != 1: sys.exit(f'anchor found {n}x:\n{old[:160]}')
    src = src.replace(old, new)
rep("const BUILD = 'v34';", "const BUILD = 'v35';")
rep("""  bolt:   { name:'BOLT',   color:'#2ef2ff', sides:4, cost:50,  crit:0.1, unlock:1, desc:'Rapid laser. Can crit.',
            lv:[ { dmg:7.5,  rate:2.24, range:2.3 },
                 { cost:60,  dmg:8.25, rate:2.24, range:2.5 },
                 { cost:120, dmg:9.08, rate:2.24, range:2.8 },
                 { cost:200, dmg:9.98, rate:2.24, range:3.0 } ] },""",
"""  // v35 (user): crits follow a pattern instead of a 10% chance. crits = how many of every 4 shots crit (the last ones
  // in each group of 4): level 1 every 4th shot, each upgrade one more, level 4 every shot. A crit does x2.5 damage.
  bolt:   { name:'BOLT',   color:'#2ef2ff', sides:4, cost:50,  critMul:2.5, unlock:1, desc:'Rapid laser. Every 4th shot crits; each upgrade crits one more. Level 4: every shot.',
            lv:[ { dmg:7.5,  rate:2.24, range:2.3, crits:1 },
                 { cost:60,  dmg:8.25, rate:2.24, range:2.5, crits:2 },
                 { cost:120, dmg:9.08, rate:2.24, range:2.8, crits:3 },
                 { cost:200, dmg:9.98, rate:2.24, range:3.0, crits:4 } ] },""")
rep("""    const crit = Math.random() < d.crit;
    G.shots.push({ x: mx, y: my, tg, lx: tg.x, ly: tg.y, dmg: L.dmg * boost * (crit ? 2.5 : 1), crit,""",
"""    tw.shots = (tw.shots || 0) + 1;                                    // v35: shot k of every 4 crits if k > 4 - crits
    const crit = ((tw.shots - 1) % 4) >= 4 - (L.crits || 0);
    G.shots.push({ x: mx, y: my, tg, lx: tg.x, ly: tg.y, dmg: L.dmg * boost * (crit ? d.critMul : 1), crit,""")
# descriptions
rep("bolt: '快速光弹，可暴击。',", "bolt: '快速光弹。每第 4 发暴击，每次升级多一发暴击，4 级时发发暴击。',")
rep("bolt: 'Láser rápido. Puede hacer críticos.',", "bolt: 'Láser rápido. Cada 4.º disparo es crítico; cada mejora añade otro. Nivel 4: todos.',")
# upgrade preview line: CRIT 1/4 -> 2/4
rep("s_rate: 'RATE', sec: 's',", "s_rate: 'RATE', s_crit: 'CRIT', sec: 's',")
rep("s_rate: '射速', sec: '秒',", "s_rate: '射速', s_crit: '暴击', sec: '秒',")
rep("s_rate: 'RITMO', sec: 's',", "s_rate: 'RITMO', s_crit: 'CRÍTICO', sec: 's',")
rep("  f('beams', tr('s_beams')); f('chains', tr('s_chain'));",
    "  f('crits', tr('s_crit'), v => v + '/4'); f('beams', tr('s_beams')); f('chains', tr('s_chain'));")
open(P_OUT, 'w', encoding='utf-8').write(src)
print('ok')
