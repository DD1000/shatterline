#!/usr/bin/env python3
# v31 (user): an upgrade adds a flat +10% damage (+10/+20/+30% over the built tower) and no longer raises fire rate.
# Range, splash, chains, beams, FROST slow/brittle and PRISM heat still improve. Costs unchanged.
import re, sys
P_IN, P_OUT = '/home/claude/live/v31/base.html', '/home/claude/live/v31/shatterline.html'
src = open(P_IN, encoding='utf-8').read()
def rep(old, new):
    global src
    n = src.count(old)
    if n != 1: sys.exit(f'anchor found {n}x:\n{old[:160]}')
    src = src.replace(old, new)
rep("const BUILD = 'v30';", "const BUILD = 'v31';")
rep("""// ---- Tower recipes -------------------------------------------------
// lv[0] is the base tower, lv[1] and lv[2] are upgrades (with their own cost).
// range in tiles, rate = shots per second. unlock = first level you can bring it.
""", """// ---- Tower recipes -------------------------------------------------
// lv[0] is the base tower, lv[1..3] are upgrades (with their own cost).
// range in tiles, rate = shots per second. unlock = first level you can bring it.
// v31 (user): an upgrade adds a flat +10% damage (+10% / +20% / +30% over the tower you built) and no longer
// makes it fire faster. Range, splash, chains, beams, FROST's slow and PRISM's heat-up still improve; costs are unchanged.
// (Before v31 each upgrade added about +70-100% damage per second.)
""")
lines = src.split('\n'); out = []; i = 0; changed = []
num = r'(-?\d+(?:\.\d+)?)'
fmt = lambda v: ('%.2f' % v).rstrip('0').rstrip('.')
while i < len(lines):
    ln = lines[i]
    if 'lv:[ {' in ln and ('dmg:' in ln or 'dps:' in ln):
        base = ln
        bd = re.search(r'\bdmg:' + num, base); bp = re.search(r'\bdps:' + num, base); br = re.search(r'\brate:' + num, base)
        out.append(ln); i += 1
        for k in (1, 2, 3):
            L = lines[i]
            if bd: L = re.sub(r'\bdmg:' + num, 'dmg:' + fmt(float(bd.group(1)) * (1 + 0.1 * k)), L, count=1)
            if bp: L = re.sub(r'\bdps:' + num, 'dps:' + fmt(float(bp.group(1)) * (1 + 0.1 * k)), L, count=1)
            if br: L = re.sub(r'\brate:' + num, 'rate:' + br.group(1), L, count=1)
            changed.append((lines[i].strip(), L.strip())); out.append(L); i += 1
        continue
    out.append(ln); i += 1
src = '\n'.join(out)
for a, b in changed: print(' ', a, '\n->', b)
print(len(changed) // 3, 'towers rewritten')
open(P_OUT, 'w', encoding='utf-8').write(src)
