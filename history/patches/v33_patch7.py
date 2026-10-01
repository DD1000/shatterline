#!/usr/bin/env python3
# v33: a reworked lab (new lab version) starts completely fresh on the lab screen: no stamp, no stars, no last result,
# no wins/plays. Its old runs stay in the analytics.
import sys
P_IN, P_OUT = '/home/claude/live/v33/base.html', '/home/claude/live/v33/shatterline.html'
src = open(P_IN, encoding='utf-8').read()
def rep(old, new):
    global src
    n = src.count(old)
    if n != 1: sys.exit(f'anchor found {n}x:\n{old[:160]}')
    src = src.replace(old, new)
rep("const BUILD = 'v32';", "const BUILD = 'v33';")
rep("  labRec(n) { this.d.lab = this.d.lab || {}; return this.d.lab[n] || (this.d.lab[n] = { stars: 0, plays: 0, wins: 0 }); },",
    "  labRec(n) { this.d.lab = this.d.lab || {}; return this.d.lab[n] || (this.d.lab[n] = { stars: 0, plays: 0, wins: 0, v: labVer(n) }); },\n"
    "  // v33 (user: \"the playtests still aren't cleared\"): a lab whose version changed starts over completely.\n"
    "  // Stars, wins, plays, last result and the COMPLETED stamp reset; the old runs stay for the analytics report.\n"
    "  freshLabs() {\n"
    "    const L = this.d.lab || {};\n"
    "    for (const lv of LAB) {\n"
    "      const r = L[lv.n], v = lv.lab.v || 1;\n"
    "      if (r && (r.v || 1) !== v) L[lv.n] = { stars: 0, plays: 0, wins: 0, v, runs: r.runs || [] };\n"
    "    }\n"
    "    this.d.lab = L;\n"
    "  },")
rep("    this.d.max = clamp(this.d.max | 0, 1, LEVELS.length);\n",
    "    this.d.max = clamp(this.d.max | 0, 1, LEVELS.length);\n    this.freshLabs(); this.store();\n")
rep("const isLab = n => n >= LAB_START;\n",
    "const isLab = n => n >= LAB_START;\nconst labVer = n => (levelOf(n).lab.v || 1);\n")
open(P_OUT, 'w', encoding='utf-8').write(src)
print('ok')

# the analytics button and report still count a reset lab's older runs
src = open(P_OUT, encoding='utf-8').read()
def rep2(old, new):
    global src
    n = src.count(old)
    if n != 1: sys.exit(f'anchor found {n}x:\n{old[:160]}')
    src = src.replace(old, new)
rep2("function labPlays() { return LAB.reduce((a, lv) => a + (((Save.d.lab || {})[lv.n] || {}).plays || 0), 0); }",
     "function labPlays() { return LAB.reduce((a, lv) => { const r = (Save.d.lab || {})[lv.n] || {}; return a + (r.plays || 0) + (r.runs || []).length; }, 0); }")
rep2("    if (!r || !r.plays) { out.push('not played yet'); return; }\n    out.push(`${r.wins} wins / ${r.plays} plays${r.quits ? ` · quit ${r.quits}x` : ''} · best ${starStr(r.stars)}`);",
     "    if (!r || (!r.plays && !(r.runs || []).length)) { out.push('not played yet'); return; }\n    out.push(`this version: ${r.wins} wins / ${r.plays} plays${r.quits ? ` · quit ${r.quits}x` : ''} · best ${starStr(r.stars)}${!r.plays ? ' (older runs below are from before the reset)' : ''}`);")
open(P_OUT, 'w', encoding='utf-8').write(src)
print('ok2')
