#!/usr/bin/env python3
# v32 (user): every tower's base damage +25%; each upgrade adds 10% of the CURRENT damage (x1.1, x1.21, x1.331);
# all lab COMPLETED stamps cleared (every lab's version bumped)
import re, sys
P_IN, P_OUT = '/home/claude/live/v32/base.html', '/home/claude/live/v32/shatterline.html'
src = open(P_IN, encoding='utf-8').read()
def rep(old, new):
    global src
    n = src.count(old)
    if n != 1: sys.exit(f'anchor found {n}x:\n{old[:160]}')
    src = src.replace(old, new)
rep("const BUILD = 'v31';", "const BUILD = 'v32';")
rep("""// v31 (user): an upgrade adds a flat +10% damage (+10% / +20% / +30% over the tower you built) and no longer
// makes it fire faster. Range, splash, chains, beams, FROST's slow and PRISM's heat-up still improve; costs are unchanged.
// (Before v31 each upgrade added about +70-100% damage per second.)
""", """// v31 (user): upgrades no longer make a tower fire faster. Range, splash, chains, beams, FROST's slow and PRISM's
// heat-up still improve; costs are unchanged. (Before v31 each upgrade added about +70-100% damage per second.)
// v32 (user): every tower's base damage is 25% higher than in v31, and each upgrade adds 10% of the tower's
// current damage: level 2 = x1.1, level 3 = x1.21, level 4 = x1.331 of the level-1 damage.
""")
lines = src.split('\n'); out = []; i = 0; changed = []
num = r'(-?\d+(?:\.\d+)?)'
fmt = lambda v: ('%.2f' % v).rstrip('0').rstrip('.')
while i < len(lines):
    ln = lines[i]
    if 'lv:[ {' in ln and ('dmg:' in ln or 'dps:' in ln):
        key = 'dmg' if 'dmg:' in ln else 'dps'
        b = float(re.search(r'\b' + key + r':' + num, ln).group(1)) * 1.25
        block = [ln] + lines[i + 1:i + 4]
        for k, L in enumerate(block):
            new = re.sub(r'\b' + key + r':' + num, key + ':' + fmt(b * 1.1 ** k), L, count=1)
            changed.append((L.strip(), new.strip())); out.append(new)
        i += 4; continue
    out.append(ln); i += 1
src = '\n'.join(out)
print(len(changed) // 4, 'towers rewritten')
for a, b in changed[:8]: print(' ', a, '\n->', b)
# clear the COMPLETED stamps: bump every lab's version (labDone compares r.doneV with lab.v)
start = src.index('const LAB_DEFS = [')
end = src.index('];\nconst LAB = LAB_DEFS.map(')
body = src[start:end]
def bump(m):
    rest = m.group(2)
    vm = re.match(r' v: (\d+),', rest)
    if vm: return m.group(1) + ' v: %d,' % (int(vm.group(1)) + 1) + rest[vm.end():]
    return m.group(1) + ' v: 2,' + rest
body2, n = re.subn(r"(\{ id: '\w+',)((?: v: \d+,)?)", bump, body)
print('labs bumped', n)
src = src[:start] + '// v32 (user): every lab\'s version was bumped to clear the COMPLETED stamps after the v29-v32 rebalance\n' + body2 + src[end:]
open(P_OUT, 'w', encoding='utf-8').write(src)
