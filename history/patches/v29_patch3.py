#!/usr/bin/env python3
# v29 (user): BOLT and PRISM do 20% less damage per second
import sys
P_IN, P_OUT = '/home/claude/live/v29/base.html', '/home/claude/live/v29/shatterline.html'
src = open(P_IN, encoding='utf-8').read()
def rep(old, new):
    global src
    n = src.count(old)
    if n != 1: sys.exit(f'anchor found {n}x:\n{old[:160]}')
    src = src.replace(old, new)
rep("const BUILD = 'v28';", "const BUILD = 'v29';")
rep("""  bolt:   { name:'BOLT',   color:'#2ef2ff', sides:4, cost:50,  crit:0.1, unlock:1, desc:'Rapid laser. Can crit.',
            lv:[ { dmg:6,  rate:2.8,  range:2.3 },
                 { cost:60,  dmg:10, rate:3.2,  range:2.5 },
                 { cost:120, dmg:16, rate:3.8,  range:2.8 },
                 { cost:200, dmg:24, rate:4.4,  range:3.0 } ] },""",
"""  // v29 (user): BOLT does 20% less damage per second. It fires 20% slower (was 2.8 / 3.2 / 3.8 / 4.4 shots a second);
  // the damage per hit stays, so armor doesn't hit it any harder than before
  bolt:   { name:'BOLT',   color:'#2ef2ff', sides:4, cost:50,  crit:0.1, unlock:1, desc:'Rapid laser. Can crit.',
            lv:[ { dmg:6,  rate:2.24, range:2.3 },
                 { cost:60,  dmg:10, rate:2.56, range:2.5 },
                 { cost:120, dmg:16, rate:3.04, range:2.8 },
                 { cost:200, dmg:24, rate:3.52, range:3.0 } ] },""")
rep("""            lv:[ { dps:16, range:2.3, heat:3 },
                 { cost:130, dps:27, range:2.5, heat:3.5 },
                 { cost:200, dps:44, range:2.7, heat:4 },
                 { cost:300, dps:68, range:2.9, heat:4.5 } ] },""",
"""            // v29 (user): PRISM does 20% less damage per second (was 16 / 27 / 44 / 68 before heating up)
            lv:[ { dps:12.8, range:2.3, heat:3 },
                 { cost:130, dps:21.6, range:2.5, heat:3.5 },
                 { cost:200, dps:35.2, range:2.7, heat:4 },
                 { cost:300, dps:54.4, range:2.9, heat:4.5 } ] },""")
open(P_OUT, 'w', encoding='utf-8').write(src)
print('ok')
