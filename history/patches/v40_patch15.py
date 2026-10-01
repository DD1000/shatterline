# v40 (user): LIVE WIRE lightning bolts deal 5 damage (was 20)
import sys
p = 'shatterline.html'; s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit(f'anchor count {c} != {n}: {a[:80]!r}')
    s = s.replace(a, b)
rep("const BUILD = 'v39';", "const BUILD = 'v40';")
rep("chains:8, bolt:20, boltEvery:4, wire:true } ] },", "chains:8, bolt:5, boltEvery:4, wire:true } ] },   // v40 (user): bolt 5 (was 20)")
open(p, 'w', encoding='utf-8').write(s); print('ok')
