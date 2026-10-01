#!/usr/bin/env python3
# v34 (user): show the version number (title screen footer and the Playtest Lab header)
import sys
P_IN, P_OUT = '/home/claude/live/v34/base.html', '/home/claude/live/v34/shatterline.html'
src = open(P_IN, encoding='utf-8').read()
def rep(old, new):
    global src
    n = src.count(old)
    if n != 1: sys.exit(f'anchor found {n}x:\n{old[:160]}')
    src = src.replace(old, new)
rep("const BUILD = 'v33';          // shown in lab analytics reports",
    "const BUILD = 'v34';          // the game's version: shown on the title screen, the lab screen and in lab analytics reports")
rep("  ctx.fillText(tr('title_footer', LEVELS.length, THEMES.length, TOWER_ORDER.length), cx, LH - 30);\n",
    "  ctx.fillText(tr('title_footer', LEVELS.length, THEMES.length, TOWER_ORDER.length), cx, LH - 30);\n"
    "  setFont(10, FONT_UI, 600); spacing(1); ctx.fillStyle = 'rgba(230,230,255,0.42)'; ctx.fillText(BUILD, cx, LH - 13); spacing(0);   // v34 (user): version number\n")
rep("  glowText(tr('lab'), cx, 36, 22, '#ffd23d', FONT_D, 12);\n",
    "  glowText(tr('lab'), cx, 36, 22, '#ffd23d', FONT_D, 12);\n"
    "  setFont(10, FONT_UI, 600); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(230,230,255,0.45)'; ctx.fillText(BUILD, x0 + cw - 6, 34); ctx.textAlign = 'center';   // version number\n")
open(P_OUT, 'w', encoding='utf-8').write(src)
print('ok')
