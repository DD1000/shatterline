#!/usr/bin/env python3
# v30 (user): NOVA does 30% less damage per hit and fires 15% slower; every enemy has 10% more health
import sys
P_IN, P_OUT = '/home/claude/live/v30/base.html', '/home/claude/live/v30/shatterline.html'
src = open(P_IN, encoding='utf-8').read()
def rep(old, new):
    global src
    n = src.count(old)
    if n != 1: sys.exit(f'anchor found {n}x:\n{old[:160]}')
    src = src.replace(old, new)
rep("const BUILD = 'v29';", "const BUILD = 'v30';")
rep("""  // v27 (user): NOVA fires 35% slower (was 0.52 / 0.57 / 0.63 / 0.7 shots a second)
  nova:   { name:'NOVA',   color:'#ff7a2e', sides:6, cost:110, unlock:6, desc:'Plasma bomb. Splash, pierces armor.',
            lv:[ { dmg:26, rate:0.34, range:3.0, splash:0.9 },
                 { cost:120, dmg:46, rate:0.37, range:3.2, splash:1.02 },
                 { cost:200, dmg:78, rate:0.41, range:3.5, splash:1.2 },
                 { cost:300, dmg:120, rate:0.46, range:3.8, splash:1.35 } ] },""",
"""  // v27 (user): NOVA fires 35% slower (was 0.52 / 0.57 / 0.63 / 0.7 shots a second)
  // v30 (user): 30% less damage per hit (was 26 / 46 / 78 / 120) and 15% slower again (was 0.34 / 0.37 / 0.41 / 0.46)
  nova:   { name:'NOVA',   color:'#ff7a2e', sides:6, cost:110, unlock:6, desc:'Plasma bomb. Splash, pierces armor.',
            lv:[ { dmg:18, rate:0.29, range:3.0, splash:0.9 },
                 { cost:120, dmg:32, rate:0.31, range:3.2, splash:1.02 },
                 { cost:200, dmg:55, rate:0.35, range:3.5, splash:1.2 },
                 { cost:300, dmg:84, rate:0.39, range:3.8, splash:1.35 } ] },""")
rep("  hpScale: 1,             // global difficulty knob (1.2 = 20% tougher enemies)",
    "  hpScale: 1.1,           // global difficulty knob (1.2 = 20% tougher enemies). v30 (user): every enemy +10% health")
open(P_OUT, 'w', encoding='utf-8').write(src)
print('ok')
