# v41 (user): LIVE WIRE keeps the original chain (8 chains, normal targeting and target-mode button). The track pulse
# (2.3 to every enemy it passes) is the only new thing at level 4.
import sys
p = 'shatterline.html'; s = open(p, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit(f'anchor count {c} != {n}: {a[:80]!r}')
    s = s.replace(a, b)

rep("const BUILD = 'v40';", "const BUILD = 'v41';")
rep("""  // v40 (user): the LIVE WIRE zaps the enemy in front (always 'first', no chain), and every zap sends a pulse down all
  // tracks from that enemy that deals trackDmg (x beacon boost) to each ground enemy it passes (see PULSE).""",
"""  // v40/v41 (user): the LIVE WIRE chains like level 3 (8 chains, normal targeting), and every zap also sends a pulse down all
  // tracks from the first enemy it hit that deals trackDmg (x beacon boost) to each ground enemy it passes (see PULSE).""")
rep("{ cost:260, dmg:23.29, rate:1.56, range:2.8, chains:1, trackDmg:2.3, wire:true } ] },",
    "{ cost:260, dmg:23.29, rate:1.56, range:2.8, chains:8, trackDmg:2.3, wire:true } ] },")
rep("    const mode = TOWERS[tw.type].lv[tw.lv].wire ? 'first' : tw.mode;          // v40: the LIVE WIRE always takes the enemy in front\n",
    "    const mode = tw.mode;\n")
rep("    ids = d.eco || d.support || d.pulse || d.beams || (d.lv[m.tw.lv] && d.lv[m.tw.lv].wire) ? ['sell', 'up']",
    "    ids = d.eco || d.support || d.pulse || d.beams ? ['sell', 'up']")
# text
rep("Level 4: LIVE WIRE, zaps the enemy in front and sends a pulse down every track.',",
    "Level 4: LIVE WIRE, each zap also sends a pulse down every track.',")
rep("4 级：高压电网，攻击最前面的敌人，并沿所有道路发出脉冲。'", "4 级：高压电网，每次攻击还会沿所有道路发出脉冲。'")
rep("Nivel 4: ALTA TENSIÓN, ataca al de delante y lanza un pulso por todos los caminos.'",
    "Nivel 4: ALTA TENSIÓN, cada ataque también lanza un pulso por todos los caminos.'")
rep("wire_line: 'Zaps the enemy in front ({0}/s). Each zap sends a pulse down every track that deals {1} to each enemy it passes.',",
    "wire_line: 'Zaps faster ({0}/s) and chains to {1}. Each zap also sends a pulse down every track that deals {2} to each enemy it passes.',")
rep("wire_line: '攻击最前面的敌人（每秒 {0} 次）。每次攻击都会沿所有道路发出一道脉冲，经过每个敌人时造成 {1} 伤害。',",
    "wire_line: '射速更快（每秒 {0} 次），连锁 {1} 个敌人。每次攻击还会沿所有道路发出一道脉冲，经过每个敌人时造成 {2} 伤害。',")
rep("wire_line: 'Ataca al enemigo de delante ({0}/s). Cada ataque lanza un pulso por todos los caminos que hace {1} de daño a cada enemigo que cruza.',",
    "wire_line: 'Dispara más rápido ({0}/s) y encadena {1}. Cada ataque también lanza un pulso por todos los caminos que hace {2} de daño a cada enemigo que cruza.',")
rep("line2 = tr('wire_line', W4.rate, W4.trackDmg); }   // v37/v40",
    "line2 = tr('wire_line', W4.rate, W4.chains, W4.trackDmg); }   // v37/v41")
open(p, 'w', encoding='utf-8').write(s); print('ok')
