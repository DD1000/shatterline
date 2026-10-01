#!/usr/bin/env python3
# v28: run analytics for every finished level, COMPLETED stamps on won labs, SEND LAB ANALYTICS
import re, sys

src = open('/home/claude/live/v28/base.html', encoding='utf-8').read()

def rep(old, new, count=1):
    global src
    n = src.count(old)
    if n != count:
        sys.exit(f'anchor found {n}x (want {count}):\n{old[:200]}')
    src = src.replace(old, new)

# ---- build tag
rep("const LEVELS_PER_WORLD = 10;\n",
    "const LEVELS_PER_WORLD = 10;\nconst BUILD = 'v28';          // shown in lab analytics reports\n")

# ---- strings
rep("pw_ok: 'UNLOCK', pw_cancel: 'CANCEL',\n",
    "pw_ok: 'UNLOCK', pw_cancel: 'CANCEL',\n"
    "    lab_done: 'COMPLETED', an_send: 'SEND LAB ANALYTICS', an_sub: '{0}/{1} COMPLETED · COPIES A REPORT FOR CHAT', an_title: 'LAB ANALYTICS',\n"
    "    an_lead: 'Copy this and paste it into the chat.', an_copy: 'COPY', an_copied: 'COPIED! PASTE IT IN THE CHAT', an_copy_fail: 'SELECT ALL THE TEXT AND COPY IT', an_close: 'CLOSE',\n")
rep("pw_ok: '解锁', pw_cancel: '取消',\n",
    "pw_ok: '解锁', pw_cancel: '取消',\n"
    "    lab_done: '已完成', an_send: '发送实验数据', an_sub: '已完成 {0}/{1} · 复制报告发到聊天', an_title: '实验数据',\n"
    "    an_lead: '复制下面的内容，粘贴到聊天中。', an_copy: '复制', an_copied: '已复制！粘贴到聊天中', an_copy_fail: '请全选文字并复制', an_close: '关闭',\n")
rep("pw_ok: 'DESBLOQUEAR', pw_cancel: 'CANCELAR',\n",
    "pw_ok: 'DESBLOQUEAR', pw_cancel: 'CANCELAR',\n"
    "    lab_done: 'COMPLETADO', an_send: 'ENVIAR DATOS DEL LAB', an_sub: '{0}/{1} COMPLETADOS · COPIA UN INFORME PARA EL CHAT', an_title: 'DATOS DEL LAB',\n"
    "    an_lead: 'Cópialo y pégalo en el chat.', an_copy: 'COPIAR', an_copied: '¡COPIADO! PÉGALO EN EL CHAT', an_copy_fail: 'SELECCIONA TODO EL TEXTO Y CÓPIALO', an_close: 'CERRAR',\n")

# ---- sound: the stamp slam
rep("    thunder() {                                // RAINSTORM: a crack and a long rumble\n",
    "    stamp() {                                  // lab COMPLETED stamp: a sharp crack and a heavy thud\n"
    "      noise({ dur:0.05, vol:0.4, type:'highpass', f0:2800 });\n"
    "      noise({ dur:0.55, vol:0.5, type:'lowpass', f0:1900, f1:70, q:0.8 });\n"
    "      tone({ type:'sine', f0:160, f1:36, dur:0.5, vol:0.75 }); tone({ type:'square', f0:95, f1:44, dur:0.12, vol:0.12 });\n"
    "    },\n"
    "    thunder() {                                // RAINSTORM: a crack and a long rumble\n")

# ---- save: a lab counts as completed on its first win (per lab version, so a reworked lab opens up again)
rep("const r = this.labRec(n); r.plays++; if (stars > 0) r.wins++; r.stars = Math.max(r.stars || 0, stars);\n",
    "const r = this.labRec(n); r.plays++; if (stars > 0) r.wins++; r.stars = Math.max(r.stars || 0, stars);\n"
    "      const v = levelOf(n).lab.v || 1; if (stars > 0 && r.doneV !== v) { r.doneV = v; r.stamped = false; }   // v28: COMPLETED (the stamp slams down next time you see the lab)\n")

# ---- run tracking state
rep("const waveStat = w => G.waveStats[w] || (G.waveStats[w] = { alive: 0, toSpawn: 0, cleared: false });\n",
    "const waveStat = w => G.waveStats[w] || (G.waveStats[w] = { alive: 0, toSpawn: 0, cleared: false });\n"
    "// v28 run analytics: what the player did this run (saved when the level ends; see recordRun)\n"
    "const newRun = () => ({ built: {}, ups: {}, sold: {}, burned: {}, spend: {}, dmg: {}, killBy: {}, waves: [], early: 0, earlyGold: 0,\n"
    "  refund: 0, g0: 0, peakGold: 0, peakTowers: 0, shields: 0, ignited: 0, doused: 0, lo: [], t0: Date.now(), recorded: false });\n"
    "const bump = (o, k, v = 1) => { o[k] = (o[k] || 0) + v; };\n"
    "const tracking = () => !G.demo && !!G.run;\n")
rep("  G.endT = 0; G.slowT = 0; G.flashA = 0; G.demoT = 0; G.endShow = 0; G.starSnd = 0;\n  FX.clear();\n}\n",
    "  G.endT = 0; G.slowT = 0; G.flashA = 0; G.demoT = 0; G.endShow = 0; G.starSnd = 0;\n  G.run = newRun();\n  FX.clear();\n}\n")
rep("  if (!G.loadout.length) G.loadout = ['bolt'];\n",
    "  if (!G.loadout.length) G.loadout = ['bolt'];\n"
    "  Object.assign(G.run, { g0: lv.gold, peakGold: lv.gold, lo: G.loadout.slice(), t0: Date.now() });\n")

# ---- waves: gold / lives / towers when each wave starts, early calls
rep("  if (G.over || G.waveNum >= G.waves.length) return;\n  if (early && G.nextTimer !== null) {\n",
    "  if (G.over || G.waveNum >= G.waves.length) return;\n  const wasEarly = !!(early && G.nextTimer !== null);\n  if (early && G.nextTimer !== null) {\n")
rep("      gain(bonus); G.goldBump = 1;\n",
    "      gain(bonus); G.goldBump = 1;\n      if (tracking()) { G.run.early++; G.run.earlyGold += bonus; }\n")
rep("  G.awaiting = false; G.nextTimer = null; G.waveNum++;\n",
    "  G.awaiting = false; G.nextTimer = null; G.waveNum++;\n"
    "  if (tracking()) G.run.waves.push([G.waveNum, Math.floor(G.gold), G.lives, G.towers.length, wasEarly ? 1 : 0]);\n")

# ---- towers: builds, upgrades, sales, burn-outs, where the gold went
rep("  const tw = placeTower(type, c, r);\n  FX.ring(tw.x, tw.y, 8, 34, d.color, 0.45, 3);\n",
    "  const tw = placeTower(type, c, r);\n"
    "  if (tracking()) { bump(G.run.built, type); bump(G.run.spend, type, d.cost); G.run.peakTowers = Math.max(G.run.peakTowers, G.towers.length); }\n"
    "  FX.ring(tw.x, tw.y, 8, 34, d.color, 0.45, 3);\n")
rep("  G.gold -= cost; G.spent = (G.spent || 0) + cost; tw.lv++; tw.spent += cost; tw.kick = 1;\n",
    "  G.gold -= cost; G.spent = (G.spent || 0) + cost; tw.lv++; tw.spent += cost; tw.kick = 1;\n"
    "  if (tracking()) { bump(G.run.ups, tw.type); bump(G.run.spend, tw.type, cost); }\n")
rep("function gain(v) { G.gold += v; G.earned = (G.earned || 0) + v; }\n",
    "function gain(v) { G.gold += v; G.earned = (G.earned || 0) + v; if (G.run && G.gold > G.run.peakGold) G.run.peakGold = G.gold; }\n")
rep("  const v = sellValue(tw);\n  G.gold += v;\n",
    "  const v = sellValue(tw);\n  G.gold += v;\n"
    "  if (tracking()) { bump(G.run.sold, tw.type); G.run.refund += v; G.run.peakGold = Math.max(G.run.peakGold, G.gold); }\n")
rep("  const v = Math.floor(tw.spent * FIRE.refund);\n  G.gold += v;\n",
    "  const v = Math.floor(tw.spent * FIRE.refund);\n  G.gold += v;\n"
    "  if (tracking()) { bump(G.run.burned, tw.type); G.run.refund += v; G.run.peakGold = Math.max(G.run.peakGold, G.gold); }\n")
rep("  tw.burning = true;\n  FX.flash(tw.x, tw.y, 40, '#ff6a1a', 0.25);",
    "  tw.burning = true; if (tracking()) G.run.ignited++;\n  FX.flash(tw.x, tw.y, 40, '#ff6a1a', 0.25);")
rep("  if (!tw.burning) return;\n  tw.burning = false;\n",
    "  if (!tw.burning) return;\n  tw.burning = false; if (tracking()) G.run.doused++;\n")
rep("function shieldShatter(e) {\n  e.shield = 0;\n",
    "function shieldShatter(e) {\n  e.shield = 0; if (tracking()) G.run.shields++;\n")
rep("  a.dome = 0; if (byEmp) a.domeDead = true;\n",
    "  a.dome = 0; if (byEmp) a.domeDead = true; if (tracking()) G.run.shields++;\n")

# ---- damage and kills by tower type (DMG_SRC = the tower type whose shot is landing right now)
rep("// ------------------------------------------------------ damage & death\nfunction damage(e, amt, o = {}) {\n",
    "// ------------------------------------------------------ damage & death\n"
    "let DMG_SRC = null;                         // v28: which tower type the damage being dealt right now comes from\n"
    "const credit = v => { if (DMG_SRC && v > 0 && tracking()) G.run.dmg[DMG_SRC] = (G.run.dmg[DMG_SRC] || 0) + v; };\n"
    "function damage(e, amt, o = {}) {\n")
rep("    if (hit < dm.dome) {\n      dm.dome -= hit;\n",
    "    if (hit < dm.dome) {\n      dm.dome -= hit; credit(hit);\n")
rep("    amt -= dm.dome / SHIELD_FACTOR; domeShatter(dm, false);\n",
    "    credit(dm.dome); amt -= dm.dome / SHIELD_FACTOR; domeShatter(dm, false);\n")
rep("    if (hit < e.shield) {                  // the shield soaks it up\n      e.shield -= hit;\n",
    "    if (hit < e.shield) {                  // the shield soaks it up\n      e.shield -= hit; credit(hit);\n")
rep("    amt -= e.shield / SHIELD_FACTOR;\n    shieldShatter(e);\n",
    "    credit(e.shield); amt -= e.shield / SHIELD_FACTOR;\n    shieldShatter(e);\n")
rep("  e.hp -= amt; e.punch = Math.min(0.4, e.punch + 0.16);\n",
    "  credit(Math.min(amt, Math.max(0, e.hp))); e.hp -= amt; e.punch = Math.min(0.4, e.punch + 0.16);\n")
rep("  e.alive = false; G.kills++;\n",
    "  e.alive = false; G.kills++; if (DMG_SRC && tracking()) bump(G.run.killBy, DMG_SRC);\n")
rep("function update(dt) {\n  G.time += dt;\n",
    "function update(dt) {\n  G.time += dt; DMG_SRC = null;\n")
rep("  let burnt = null;\n  for (const tw of G.towers) {\n",
    "  let burnt = null;\n  for (const tw of G.towers) {\n    DMG_SRC = tw.type;\n")
rep("  if (burnt) for (const tw of burnt) burnDown(tw);\n",
    "  DMG_SRC = null;\n  if (burnt) for (const tw of burnt) burnDown(tw);\n")
rep("dmg: L.dmg * boost * (crit ? 2.5 : 1), crit, color: c, sp: 560, vx: 0, vy: 0 });",
    "dmg: L.dmg * boost * (crit ? 2.5 : 1), crit, color: c, sp: 560, vx: 0, vy: 0, src: tw.type });")
rep("dur: flight, dmg: L.dmg * boost, splash: L.splash * TILE, color: c });",
    "dur: flight, dmg: L.dmg * boost, splash: L.splash * TILE, color: c, src: tw.type });")
rep("tg, dmg: L.dmg * boost, splash: L.splash * TILE, color: c, t: 0 });",
    "tg, dmg: L.dmg * boost, splash: L.splash * TILE, color: c, t: 0, src: tw.type });")
rep("      if (s.tg.alive) {\n        damage(s.tg, s.dmg, { crit: s.crit });\n",
    "      if (s.tg.alive) {\n        DMG_SRC = s.src; damage(s.tg, s.dmg, { crit: s.crit });\n")
rep("      G.shells.splice(i, 1);\n      for (const e of G.enemies) {\n",
    "      G.shells.splice(i, 1); DMG_SRC = s.src;\n      for (const e of G.enemies) {\n")
rep("function flakBurst(m) {\n",
    "function flakBurst(m) {\n  DMG_SRC = m.src;\n")

# ---- record the run when the level ends (win / lose), or when you quit or restart mid-level
rep("  G.firstClear = r.first; G.prevStars = r.prev;\n",
    "  G.firstClear = r.first; G.prevStars = r.prev;\n  recordRun(win ? 'win' : 'lose');\n")
rep("function retryLevel() {\n",
    "function retryLevel() {\n  abandonRun();\n")
rep("if (G.confirm === 'quit') { G.confirm = null; leaveLevel(); }",
    "if (G.confirm === 'quit') { G.confirm = null; abandonRun(); leaveLevel(); }")

RECORD = r'''
// ---------------------------------------------------- run analytics (v28)
// Every level you finish (won, lost, or quit after the first wave) is summed up and saved: towers,
// gold, lives, damage by tower, leaks, and a line per wave. Labs keep their last RUNS_PER_LAB runs,
// the campaign its last RUNS_KEPT. The lab screen's SEND LAB ANALYTICS copies a report for the chat.
const RUNS_PER_LAB = 5, RUNS_KEPT = 20;
function runSummary(result) {
  const R = G.run, lv = G.level, round = o => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, Math.round(v)]));
  return {
    t: Date.now(), n: G.levelNum, lab: lv.lab ? lv.lab.id : null, lv: lv.lab ? (lv.lab.v || 1) : null, build: BUILD,
    res: result, stars: result === 'win' ? G.stars : 0, lives: G.lives, max: G.maxLives, wave: G.waveNum, waves: G.waves.length,
    g0: R.g0, earned: Math.round(G.earned || 0), spent: Math.round(G.spent || 0), refund: Math.round(R.refund), left: Math.floor(G.gold), peak: Math.floor(R.peakGold),
    lo: R.lo, built: R.built, ups: R.ups, sold: R.sold, burned: R.burned, spend: R.spend,
    board: G.towers.map(t => t.type + (t.lv + 1)), peakTowers: Math.max(R.peakTowers, G.towers.length),
    dmg: round(R.dmg), killBy: R.killBy, kills: G.kills, combo: G.bestCombo, leaks: G.leaks, leakTypes: round(G.leakTypes),
    early: R.early, earlyGold: R.earlyGold, shields: R.shields, ignited: R.ignited, doused: R.doused,
    wv: R.waves.map(x => x.concat(Math.round((G.waveStats[x[0]] && G.waveStats[x[0]].leaked) || 0))),
    secs: Math.round((Date.now() - R.t0) / 1000), sim: Math.round(G.time),
  };
}
function recordRun(result) {
  if (G.demo || !G.level || !G.run || G.run.recorded) return;
  G.run.recorded = true;
  const s = runSummary(result);
  if (isLab(G.levelNum)) {
    const r = Save.labRec(G.levelNum), a = r.runs = r.runs || [];
    a.push(s); if (a.length > RUNS_PER_LAB) a.splice(0, a.length - RUNS_PER_LAB);
    if (result === 'quit') r.quits = (r.quits || 0) + 1;
  } else {
    const a = Save.d.runs = Save.d.runs || [];
    a.push(s); if (a.length > RUNS_KEPT) a.splice(0, a.length - RUNS_KEPT);
  }
  Save.store();
}
// leaving a level part-way (restart, or back to the map) still counts once a wave has been sent
function abandonRun() { if (G.state === 'play' && !G.over && !G.demo && G.waveNum > 0) recordRun('quit'); }

// The report (always in English, for the developer)
const TNAME = t => TOWERS[t] ? TOWERS[t].name : t, ENAME = t => ENEMIES[t] ? ENEMIES[t].name : t;
const kfmt = v => v >= 10000 ? Math.round(v / 1000) + 'k' : v >= 1000 ? (v / 1000).toFixed(1) + 'k' : String(Math.round(v));
function fmtDate(t) { const d = new Date(t), p = x => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; }
const fmtSecs = s => `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`;
const starStr = n => '★'.repeat(n || 0) + '☆'.repeat(3 - (n || 0));
function countStr(o, name = TNAME) {
  const e = Object.entries(o || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  return e.length ? e.map(([k, v]) => `${name(k)} ${v}`).join(' · ') : '-';
}
function boardStr(board) {
  const c = {}; for (const b of board || []) c[b] = (c[b] || 0) + 1;
  const e = Object.entries(c).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  return e.length ? e.map(([k, v]) => `${TNAME(k.replace(/\d+$/, ''))} L${k.match(/\d+$/)[0]}${v > 1 ? ' x' + v : ''}`).join(', ') : '-';
}
function dmgStr(dmg) {
  const e = Object.entries(dmg || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]), tot = e.reduce((a, [, v]) => a + v, 0);
  return tot ? e.map(([k, v]) => `${TNAME(k)} ${Math.round(v / tot * 100)}% (${kfmt(v)})`).join(' · ') : '-';
}
function runLines(r, label) {
  const res = r.res === 'win' ? `WON ${starStr(r.stars)}` : r.res === 'lose' ? 'LOST' : 'QUIT';
  return [
    `-- ${label} · ${fmtDate(r.t)} · ${res} · lives ${r.lives}/${r.max} · wave ${r.wave}/${r.waves} · ${fmtSecs(r.secs)}${r.build !== BUILD ? ' · game ' + r.build : ''}`,
    `gold: start ${r.g0} · earned ${r.earned} · spent ${r.spent} · refunds ${r.refund} · left ${r.left} · peak ${r.peak}`,
    `loadout: ${(r.lo || []).map(TNAME).join(', ') || '-'}`,
    `built: ${countStr(r.built)} | upgrades: ${countStr(r.ups)} | sold: ${countStr(r.sold)} | burned down: ${countStr(r.burned)}`,
    `gold into: ${countStr(r.spend)}`,
    `board at end (${(r.board || []).length}, most ${r.peakTowers}): ${boardStr(r.board)}`,
    `damage: ${dmgStr(r.dmg)}`,
    `kills ${r.kills}: ${countStr(r.killBy)} · best combo ${r.combo}`,
    `lives leaked ${r.leaks}: ${countStr(r.leakTypes, ENAME)}`,
    `early calls ${r.early} (+${r.earlyGold} gold) · shields/domes broken ${r.shields} · towers set alight ${r.ignited} · fires put out ${r.doused}`,
    `waves (wave:gold/lives/towers at its start, -N lives leaked in it, e = called early): ${(r.wv || []).map(w => `${w[0]}:${w[1]}/${w[2]}/${w[3]}${w[5] ? '-' + w[5] : ''}${w[4] ? 'e' : ''}`).join(' ') || '-'}`,
  ];
}
function labReport() {
  const labs = Save.d.lab || {}, out = [];
  const runs = LAB.reduce((a, lv) => a + ((labs[lv.n] && labs[lv.n].runs) || []).length, 0);
  out.push('SHATTERLINE LAB ANALYTICS');
  out.push(`game ${BUILD} · sent ${fmtDate(Date.now())} · ${LAB.filter(labDone).length}/${LAB.length} labs completed · ${runs} run${runs === 1 ? '' : 's'} saved (last ${RUNS_PER_LAB} per lab)`);
  LAB.forEach((lv, i) => {
    const r = labs[lv.n], d = lv.lab, econ = lv.econ.key === 'payday' ? 'PAYDAY' : `LEAN ${Math.round(lv.econ.bounty * 100)}%`;
    out.push('');
    out.push(`== LAB ${i + 1} · ${STR.en['lab_name_' + d.id]} [${d.id}${d.v ? ' v' + d.v : ''}] · ${econ} · ${lv.waves.length} waves · start ${lv.gold} gold${labDone(lv) ? ' · COMPLETED' : ''}`);
    if (!r || !r.plays) { out.push('not played yet'); return; }
    out.push(`${r.wins} wins / ${r.plays} plays${r.quits ? ` · quit ${r.quits}x` : ''} · best ${starStr(r.stars)}`);
    const a = r.runs || [];
    if (!a.length && r.last) out.push(`last (before tracking): ${r.last.win ? 'WON' : 'LOST'} · lives ${r.last.lives} · wave ${r.last.wave}/${r.last.waves} · gold earned ${r.last.earned} spent ${r.last.spent} left ${Math.floor(r.last.left)}`);
    a.slice().reverse().forEach((x, k) => out.push(...runLines(x, k === 0 ? 'latest run' : `${k + 1} runs back`)));
  });
  const camp = (Save.d.runs || []).slice(-10).reverse();
  if (camp.length) {
    out.push('');
    out.push(`== RECENT CAMPAIGN LEVELS (last ${camp.length})`);
    for (const x of camp) {
      out.push(`L${x.n} · ${fmtDate(x.t)} · ${x.res === 'win' ? 'WON ' + starStr(x.stars) : x.res === 'lose' ? 'LOST' : 'QUIT'} · lives ${x.lives}/${x.max} · wave ${x.wave}/${x.waves} · gold earned ${x.earned} spent ${x.spent} left ${x.left} peak ${x.peak} · ${fmtSecs(x.secs)}`);
      out.push(`   board: ${boardStr(x.board)} · damage: ${dmgStr(x.dmg)} · leaked: ${countStr(x.leakTypes, ENAME)}`);
    }
  }
  return out.join('\n');
}
// The copy box: a real DOM textarea + COPY button, so copying works on phones and inside the Claude app
function showAnalytics() {
  if (document.getElementById('an-box')) return;
  const text = labReport(), F = "'Chakra Petch',system-ui,sans-serif";
  const box = document.createElement('div'); box.id = 'an-box';
  box.style.cssText = 'position:fixed;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;background:rgba(5,4,14,0.84);touch-action:auto;-webkit-user-select:text;user-select:text';
  box.innerHTML = `<div style="box-sizing:border-box;width:min(440px,92vw);max-height:88vh;display:flex;flex-direction:column;padding:18px 16px 14px;border-radius:18px;background:#0b0918;border:2px solid #ffd23d;box-shadow:0 0 40px rgba(255,210,61,0.25);font-family:${F};color:#e8e6ff">`
    + `<div id="an-t" style="font:400 18px Bungee,'Arial Black',sans-serif;color:#ffd23d;letter-spacing:1px;text-align:center"></div>`
    + `<div id="an-l" style="text-align:center;font-size:12px;font-weight:600;color:rgba(230,230,255,0.75);margin:6px 0 10px"></div>`
    + `<textarea id="an-txt" readonly spellcheck="false" style="box-sizing:border-box;width:100%;height:46vh;min-height:160px;padding:10px;border-radius:10px;border:1.5px solid #5a48e0;background:#07060f;color:#d9d6f5;font:11px/1.4 ui-monospace,Menlo,Consolas,monospace;resize:none;-webkit-user-select:text;user-select:text;outline:none"></textarea>`
    + `<div id="an-msg" style="min-height:18px;margin:9px 0 7px;text-align:center;font-weight:700;font-size:12px;letter-spacing:1px"></div>`
    + `<div style="display:flex;gap:10px"><button type="button" id="an-no" style="flex:1;padding:12px;border-radius:24px;border:1.5px solid #8a84b8;background:transparent;color:#e8e6ff;font:700 13px ${F}"></button>`
    + `<button type="button" id="an-yes" style="flex:1.4;padding:12px;border-radius:24px;border:1.5px solid #7dffb0;background:rgba(125,255,176,0.16);color:#fff;font:700 14px ${F}"></button></div></div>`;
  document.body.appendChild(box);
  const $ = id => box.querySelector('#' + id), ta = $('an-txt'), msg = $('an-msg');
  $('an-t').textContent = tr('an_title'); $('an-l').textContent = tr('an_lead'); $('an-no').textContent = tr('an_close'); $('an-yes').textContent = tr('an_copy');
  ta.value = text;
  const say = ok => { msg.textContent = ok ? tr('an_copied') : tr('an_copy_fail'); msg.style.color = ok ? '#7dffb0' : '#ffb347'; if (ok) Sound.play('build'); else Sound.play('deny'); };
  const viaSelect = () => {                   // the old way: select the text and copy it (works where the clipboard API is blocked)
    let ok = false;
    try { ta.readOnly = false; ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length); ok = document.execCommand('copy'); } catch (e) {}
    ta.readOnly = true; try { ta.blur(); } catch (e) {}
    return ok;
  };
  const copy = quiet => {
    const fallback = () => { const ok = viaSelect(); if (ok || !quiet) say(ok); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(() => say(true), fallback); return; }
    } catch (e) {}
    fallback();
  };
  $('an-yes').onclick = () => copy(false);
  $('an-no').onclick = () => { box.remove(); Sound.play('tap'); };
  if (G.pointerType === 'mouse') copy(true);   // with a mouse the click that opened this can copy straight away
}
'''
rep("// ------------------------------------------------------ playtest lab\n",
    RECORD + "\n// ------------------------------------------------------ playtest lab\n")

# ---- the lab screen: completed labs go grey under a COMPLETED stamp that slams down once
old_lab = src[src.index("function drawLab() {\n"):src.index("// First launch: pick a language before anything else.")]
NEW_LAB = r'''// Lab screen timing (v28): a completed lab's COMPLETED stamp slams down once, the first time you see it
const LABFX = { t0: 0, last: 0, hit: {}, fall: {} }, STAMP_FALL = 0.2;
function labDone(lv) { const r = (Save.d.lab || {})[lv.n]; return !!r && r.doneV === (lv.lab.v || 1); }
function labPlays() { return LAB.reduce((a, lv) => a + (((Save.d.lab || {})[lv.n] || {}).plays || 0), 0); }
function drawLab() {
  dim(0.8); blocker();
  const now = performance.now(), cardOpen = !!SAGA.card;
  if (now - LABFX.last > 400) { LABFX.t0 = now; LABFX.hit = {}; LABFX.fall = {}; }     // (re)entered the screen
  LABFX.last = cardOpen ? 0 : now;                     // a level card on top holds the stamps back until you can see them
  const lt = (now - LABFX.t0) / 1000;
  let amp = 0; for (const k in LABFX.hit) amp = Math.max(amp, 7 * Math.exp(-(lt - LABFX.hit[k]) * 9));
  ctx.save();
  if (amp > 0.3 && !REDUCED) ctx.translate(rand(-amp, amp), rand(-amp, amp));        // the slam shakes the screen
  const cx = LW / 2, cw = Math.min(344, LW - 20), x0 = (LW - cw) / 2;
  circleButton(x0 + 22, 34, 17, 'close', () => { SAGA.card = null; G.state = 'title'; Sound.play('tap'); });
  glowText(tr('lab'), cx, 36, 22, '#ffd23d', FONT_D, 12);
  setFont(10.5, FONT_UI, 500); ctx.fillStyle = 'rgba(230,230,255,0.75)'; wrapText(tr('lab_intro'), cx, 70, cw - 30, 13);
  // v26: ten labs in two columns of compact cards (what each one tests is on its card); v28: room for the analytics button
  const plays = labPlays(), btnRoom = plays ? 62 : 0;
  const cols = 2, rows = Math.ceil(LAB.length / cols), gap = 8, top = 100;
  const bw = (cw - gap) / cols, bh = Math.min(104, (LH - top - 16 - btnRoom) / rows - gap);
  const fit = (str, maxW, size, face = FONT_UI, weight = 700) => { setFont(size, face, weight); const w = ctx.measureText(str).width; if (w > maxW) setFont(Math.max(6.5, size * maxW / w), face, weight); };
  const stamps = []; let queue = 0;
  LAB.forEach((lv, i) => {
    const x = x0 + (i % cols) * (bw + gap), y = top + Math.floor(i / cols) * (bh + gap);
    const th = THEMES[lv.world], col = lv.boss ? '#ff5a6a' : th.flow, rec = (Save.d.lab || {})[lv.n];
    roundRect(x, y, bw, bh, 12); ctx.fillStyle = 'rgba(8,6,22,0.94)'; ctx.fill();
    ctx.fillStyle = hexA(th.bg2, 0.55); ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = hexA(col, 0.9); ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    setFont(8.5, FONT_UI); spacing(1.5); ctx.fillStyle = hexA(col, 0.9); ctx.fillText(levelLabel(lv.n), x + 11, y + 14); spacing(0);
    for (let k = 0; k < 3; k++) drawStar(x + bw - 44 + k * 15, y + 14, 5.5, rec && k < (rec.stars || 0));
    fit(tr('lab_name_' + lv.lab.id), bw - 22, 14, FONT_D, 400); ctx.fillStyle = '#ffffff'; ctx.fillText(tr('lab_name_' + lv.lab.id), x + 11, y + 36);
    // economy + wave count, then the last result
    const econ = lv.econ.key === 'payday' ? condTag('payday') : `${condTag('lean')} ${Math.round(lv.econ.bounty * 100)}%`;
    fit(`${econ}  ·  ${tr('lab_card_sub', lv.waves.length).split('·').pop().trim()}`, bw - 22, 8.5); ctx.fillStyle = '#ffe38a';
    ctx.fillText(`${econ}  ·  ${tr('lab_card_sub', lv.waves.length).split('·').pop().trim()}`, x + 11, y + 55);
    const L = rec && rec.last, res = !L ? tr('lab_never') : L.win ? tr('lab_won_s', L.lives, L.left) : tr('lab_lost_s', L.wave, L.waves);
    fit(res, bw - 22, 8.5); ctx.fillStyle = L ? (L.win ? '#7dffb0' : '#ff8a96') : 'rgba(230,230,255,0.45)'; ctx.fillText(res, x + 11, y + bh - 28);
    if (rec && rec.plays) { fit(tr('lab_plays', rec.wins, rec.plays), bw - 22, 8); ctx.fillStyle = 'rgba(230,230,255,0.5)'; ctx.fillText(tr('lab_plays', rec.wins, rec.plays), x + 11, y + bh - 13); }
    if (labDone(lv)) {
      // seconds since this card's stamp started falling: 9 = long since stamped, -1 = still waiting
      const k = rec.stamped ? 9 : cardOpen ? -1 : lt - (0.45 + (queue++) * 0.6);
      stamps.push({ lv, rec, x, y, k });
      if (k >= STAMP_FALL) greyCard(x, y, bw, bh, Math.min(1, (k - STAMP_FALL) / 0.12));
    }
    hit(x, y, bw, bh, () => openCard(lv.n));        // a completed lab can still be replayed
  });
  for (const s of stamps) drawLabStamp(s, bw, bh, lt);
  if (plays) {
    pillButton(cx, LH - 16 - 25, Math.min(300, cw), 50, tr('an_send'), '#ffd23d', () => { Sound.play('tap'); showAnalytics(); },
      { size: 15, sub: tr('an_sub', LAB.filter(labDone).length, LAB.length) });
  }
  ctx.restore();
}
// a finished card loses its colour and darkens
function greyCard(x, y, w, h, g) {
  ctx.save(); roundRect(x, y, w, h, 12); ctx.clip();
  ctx.globalAlpha = g; ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.52 * g; ctx.fillStyle = '#06050b'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.restore();
  roundRect(x, y, w, h, 12); ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(120,118,138,${0.9 * g})`; ctx.stroke();
}
// The stamp: falls in huge and see-through, slams down (crack, shockwave, debris, shake), wobbles, then stays
function drawLabStamp(s, bw, bh, lt) {
  const { lv, rec, x, y, k } = s;
  if (k < 0) return;
  const n = lv.n, col = '#7dffb0', w = Math.min(bw - 16, 152), h = Math.round(w * 0.3);
  const cx = x + bw / 2, cy = y + bh * 0.56, rot = -0.2 + (seeded(n * 977 + 13)() - 0.5) * 0.1;
  if (k < STAMP_FALL) {
    if (!LABFX.fall[n]) { LABFX.fall[n] = 1; Sound.play('swoosh'); }
    const p = k / STAMP_FALL, sc = 3.4 - 2.4 * p * p;             // speeds up as it drops
    ctx.save(); ctx.translate(cx + 8 * (1 - p), cy + 14 * (1 - p)); ctx.rotate(rot); ctx.scale(sc, sc);   // its shadow closes in under it
    roundRect(-w / 2, -h / 2, w, h, 7); ctx.fillStyle = `rgba(0,0,0,${0.5 * p})`; ctx.fill(); ctx.restore();
    stampGlyph(cx, cy, w, h, sc, rot - 0.4 * (1 - p), Math.min(1, p * 2.2), col, n);
    return;
  }
  const kk = k - STAMP_FALL;
  if (!LABFX.hit[n] && k < 2) {                                    // impact
    LABFX.hit[n] = lt - kk;
    Sound.play('stamp');
    try { if (navigator.vibrate) navigator.vibrate([35, 25, 70]); } catch (e) {}
  }
  drawCracks(cx, cy, w, h, rot, kk, n, x, y, bw, bh);
  if (kk < 0.6) {                                                  // flash, glow burst and shockwave
    const f = kk / 0.6;
    ctx.save(); roundRect(x, y, bw, bh, 12); ctx.clip(); ctx.fillStyle = `rgba(255,255,255,${0.75 * Math.exp(-kk * 11)})`; ctx.fillRect(x, y, bw, bh); ctx.restore();
    additive(true); glow(cx, cy, 30 + 90 * f, col, 0.9 * (1 - f)); additive(false);
    ctx.beginPath(); ctx.ellipse(cx, cy, 24 + kk * 330, 12 + kk * 200, rot, 0, TAU); ctx.lineWidth = 4 * (1 - f); ctx.strokeStyle = hexA(col, 0.75 * (1 - f)); ctx.stroke();
  }
  const sc = 1 - 0.16 * Math.exp(-kk * 11) * Math.cos(kk * 34);    // squash on impact, then a quick wobble
  stampGlyph(cx, cy, w, h, sc, rot, 1, col, n);
  if (kk < 0.8) {                                                  // chips flying off the edges
    const D = seeded(n * 31 + 7), f = kk / 0.8;
    for (let i = 0; i < 18; i++) {
      const a = D() * TAU, sp = 110 + D() * 230, sz = 1.6 + D() * 3.6, spin = (D() - 0.5) * 22, c2 = D() < 0.55 ? col : '#ffffff';
      const px = cx + Math.cos(a) * (w * 0.42 + sp * kk), py = cy + Math.sin(a) * (h * 0.5 + sp * kk * 0.75) + 300 * kk * kk;
      ctx.save(); ctx.translate(px, py); ctx.rotate(spin * kk); ctx.globalAlpha = 1 - f; ctx.fillStyle = c2; ctx.fillRect(-sz / 2, -sz * 0.3, sz, sz * 0.6); ctx.restore();
    }
  }
  if (!rec.stamped && kk > 1) { rec.stamped = true; Save.store(); }
}
function stampGlyph(cx, cy, w, h, sc, rot, a, col, seed) {
  const txt = tr('lab_done');
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha = a;
  roundRect(-w / 2, -h / 2, w, h, 7); ctx.fillStyle = 'rgba(4,18,10,0.78)'; ctx.fill();
  ctx.shadowColor = col; ctx.shadowBlur = 12;
  ctx.lineWidth = 3.2; ctx.strokeStyle = col; ctx.stroke();
  roundRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 4); ctx.lineWidth = 1.3; ctx.stroke();
  let fs = h * 0.5; setFont(fs, FONT_D, 400); spacing(1.5);
  const tw = ctx.measureText(txt).width; if (tw > w - 24) { fs *= (w - 24) / tw; setFont(fs, FONT_D, 400); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(txt, 0, 1.5);
  ctx.shadowBlur = 0; spacing(0);
  const R = seeded(seed * 53 + 5); ctx.fillStyle = 'rgba(4,18,10,0.85)';        // worn ink, like a real rubber stamp
  for (let i = 0; i < 30; i++) { const px = (R() - 0.5) * w, py = (R() - 0.5) * h, rr = 0.35 + R() * 1.25; ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawCracks(cx, cy, w, h, rot, kk, seed, x, y, bw, bh) {
  const R = seeded(seed * 7919 + 3), grow = Math.min(1, kk / 0.09);
  ctx.save(); roundRect(x, y, bw, bh, 12); ctx.clip();
  ctx.translate(cx, cy); ctx.rotate(rot); ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++) {
    const a0 = R() * TAU, segs = 3 + Math.floor(R() * 3), len = (12 + R() * 30) / segs;
    let px = Math.cos(a0) * w * 0.5, py = Math.sin(a0) * h * 0.56, ang = a0 + (R() - 0.5) * 0.8;
    const pts = [[px, py]];
    for (let j = 0; j < segs; j++) { ang += (R() - 0.5) * 1.1; px += Math.cos(ang) * len * grow; py += Math.sin(ang) * len * grow; pts.push([px, py]); }
    ctx.beginPath(); pts.forEach(([u, v], j) => j ? ctx.lineTo(u, v) : ctx.moveTo(u, v));
    ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke();
    ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(200,255,220,0.5)'; ctx.stroke();
  }
  ctx.restore();
}

'''
src = src.replace(old_lab, NEW_LAB)

# ---- test hooks
rep("FIRE, ELEC, igniteTower };", "FIRE, ELEC, igniteTower, labReport, recordRun, showAnalytics, labDone, LABFX };")

open('/home/claude/live/v28/shatterline.html', 'w', encoding='utf-8').write(src)
print('ok', len(src))
