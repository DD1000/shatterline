# v45 (user): the TIP box on the end screen grows to fit its text (it was a fixed 64px: long tips spilled out)
import sys
p = 'shatterline.html'; s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit(f'anchor count {c} != {n}: {a[:90]!r}')
    s = s.replace(a, b)
rep("const BUILD = 'v44';", "const BUILD = 'v45';")
rep("""    const bw = Math.min(310, LW - 32), bh = 64;
    roundRect(cx - bw / 2, y + 70, bw, bh, 12); ctx.fillStyle = 'rgba(8,6,22,0.95)'; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#ffd23d'; ctx.stroke();
    setFont(10, FONT_UI); spacing(2); ctx.fillStyle = '#ffd23d'; ctx.fillText(tr('tip'), cx, y + 86); spacing(0);
    setFont(11, FONT_UI, 500); ctx.fillStyle = '#e8e6ff';
    wrapText(tip, cx, y + 104, bw - 24, 14);
    y += 150;""",
"""    const bw = Math.min(330, LW - 24);
    setFont(11, FONT_UI, 500);
    const lines = wrapLines(tip, bw - 28), bh = 36 + lines.length * 14 + 6;     // v45: the box grows with the tip
    roundRect(cx - bw / 2, y + 70, bw, bh, 12); ctx.fillStyle = 'rgba(8,6,22,0.95)'; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#ffd23d'; ctx.stroke();
    setFont(10, FONT_UI); spacing(2); ctx.fillStyle = '#ffd23d'; ctx.fillText(tr('tip'), cx, y + 86); spacing(0);
    setFont(11, FONT_UI, 500); ctx.fillStyle = '#e8e6ff';
    lines.forEach((ln, i) => ctx.fillText(ln, cx, y + 104 + i * 14));
    y += 70 + bh + 16;""")
open(p, 'w', encoding='utf-8').write(s); print('ok')
