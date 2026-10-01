import sys
p = 'shatterline.html'; s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit(f'anchor count {c} != {n}: {a[:70]!r}')
    s = s.replace(a, b)
rep("""      title = tr('up_title', tw.lv + 2, cost); line2 = statLine(d.lv[tw.lv], d.lv[tw.lv + 1]);""",
    """      title = tr('up_title', tw.lv + 2, cost); line2 = statLine(d.lv[tw.lv], d.lv[tw.lv + 1]);
      if (d.lv[tw.lv + 1].master) { title = `${tr('master_bolt')}  ·  ${cost}`; color = MASTER_GOLD; }   // v36""")
open(p, 'w', encoding='utf-8').write(s); print('ok')
