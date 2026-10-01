# v38 (user): LIVE WIRE (ARC level 4) does 90% less damage on the road: 23.29 -> 2.33 per tick
import sys
p = 'shatterline.html'; s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit(f'anchor count {c} != {n}: {a[:80]!r}')
    s = s.replace(a, b)
rep("const BUILD = 'v37';", "const BUILD = 'v38';")
rep("                 { cost:260, dmg:23.29, rate:1.3, range:2.8, wire:true } ] },",
    "                 { cost:260, dmg:2.33, rate:1.3, range:2.8, wire:true } ] },   // v38 (user): road current -90% (was 23.29)")
rep("line2 = tr('wire_line', Math.round(W4.dmg), W4.rate);", "line2 = tr('wire_line', Math.round(W4.dmg * 10) / 10, W4.rate);")
open(p, 'w', encoding='utf-8').write(s); print('ok')
