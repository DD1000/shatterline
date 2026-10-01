// EMP lasers, electrified + iced enemies, supercharged ARC / FROST. Usage: node mechtest.js <shot dir>
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !m.text().includes('fonts.g') && !m.text().includes('ERR_')) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + require('path').resolve('index.html'));
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => {
    const T = __TD, out = {};
    const setup = n => {
      T.startLevel(n); const G = T.G; G.paused = true; G.tutorial = false; G.gold = 99999; G.enemies = [];
      Sound.setEnabled(false);
      return G;
    };
    // a path tile with buildable tiles next to it
    const spot = () => {
      const P = T.MAP.paths[0];
      for (let d = 120; d < P.len - 120; d += 20) {
        const q = P.at(d), c = Math.floor(q.x / 40), r = Math.floor(q.y / 40);
        const nb = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]].filter(([cc, rr]) => T.isBuildable(cc, rr));
        if (nb.length >= 2) return { d, q, nb };
      }
    };
    const hold = (type, dist) => { const e = spawnEnemy(type, 1, 0, dist); e.speed = 0; e.age = 1; return e; };
    const run = (G, sec) => { for (let i = 0; i < sec * 60; i++) T.update(1 / 60); };

    // ---- EMP: 4 lasers, shielded first, tiny damage
    let G = setup(45); let s = spot();
    const emp = T.buildTower('emp', s.nb[0][0], s.nb[0][1]); emp.spawn = 1;
    const es = [];
    for (let i = 0; i < 6; i++) { const e = hold('grunt', s.d - 30 + i * 12); if (i % 2 === 0) { e.shield = e.shieldMax = e.maxHp * 0.6; } es.push(e); }
    const hp0 = es.map(e => e.hp);
    const lines0 = FX.lines.length; emp.cd = 0; emp.target = es[0];
    fire(emp, es[0]);
    out.emp = { lasers: FX.lines.length - lines0, stripped: es.filter((e, i) => i % 2 === 0 && e.shieldMax === 0).length, shieldedLeft: es.filter(e => e.shieldMax > 0).length,
      plainHit: es.filter((e, i) => i % 2 === 1 && e.hp < hp0[i]).length, dmg: +Math.max(...es.map((e, i) => hp0[i] - e.hp)).toFixed(2), gruntHp: Math.round(hp0[1]) };

    // ---- Electric: a Volt next to a BOLT and an ARC
    G = setup(45); s = spot();
    const bolt = T.buildTower('bolt', s.nb[0][0], s.nb[0][1]), arc = T.buildTower('arc', s.nb[1][0], s.nb[1][1]); bolt.spawn = arc.spawn = 1;
    const target = hold('titan', s.d + 10); target.hp = target.maxHp = 1e9;    // something to shoot at
    let shots = 0, zaps = 0; const of = fire;
    window.__countFire = true;
    const v = hold('volt', s.d); v.hp = v.maxHp = 1e9;
    const countShots = sec => { let n0 = G.shots.length, sh = 0, zp = 0, z0 = FX.zaps.length; for (let i = 0; i < sec * 60; i++) { const a = G.shots.length, zz = FX.zaps.length; T.update(1 / 60); sh += Math.max(0, G.shots.length - a); zp += Math.max(0, FX.zaps.filter(z => z.max > 0.12).length - FX.zaps.filter(z => z.max > 0.12 && z.life < z.max - 1 / 60 + 1e-9).length); } return sh; };
    run(G, 0.5);
    out.elec = { boltZapT: +bolt.zapT.toFixed(2), arcZapT: +arc.zapT.toFixed(2), live: isLiveElec(v) };
    const s1 = countShots(3);
    out.elec.boltShotsWhileShorted = s1;
    kill(v); run(G, 3.8); out.elec.boltStillOffAfter3_8s = bolt.zapT > 0;
    run(G, 0.4); out.elec.boltBackAfter4_2s = bolt.zapT <= 0;
    out.elec.boltShotsAfter = countShots(2);
    // ARC fire rate supercharged vs normal
    const arcFires = sec => { let n = 0; const f0 = arc.cd; for (let i = 0; i < sec * 60; i++) { const before = arc.cd; T.update(1 / 60); if (arc.cd > before + 0.05) n++; } return n; };
    out.elec.arcFiresNormal4s = arcFires(4);
    const v2 = hold('volt', s.d); v2.hp = v2.maxHp = 1e9; run(G, 0.3);
    out.elec.arcFiresSupercharged4s = arcFires(4);
    // EMP shorts the Volt out
    // an EMP a little way back from the path (out of the Volt's short-out range, inside laser range)
    let best = null;
    for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) { const dd = Math.hypot(c * 40 + 20 - v2.x, r * 40 + 20 - v2.y) / 40; if (T.isBuildable(c, r) && !G.grid[r * 9 + c] && dd > 1.45 && dd < 2.2) best = best || [c, r, dd]; }
    const emp2 = best && T.buildTower('emp', best[0], best[1]);
    out.elec.empAt = best && +best[2].toFixed(2);
    if (emp2) { emp2.spawn = 1; emp2.cd = 0; run(G, 0.2); out.elec.voltShortedByEmp = v2.elecOff > 0; out.elec.empShorted = emp2.zapT > 0; run(G, 1); out.elec.boltOffDuringShort = bolt.zapT > 0 ? +bolt.zapT.toFixed(1) : 0; }

    // ---- Ice: a Yeti next to a BOLT and a FROST
    G = setup(45); s = spot();
    const bolt2 = T.buildTower('bolt', s.nb[0][0], s.nb[0][1]), frost = T.buildTower('frost', s.nb[1][0], s.nb[1][1]); bolt2.spawn = frost.spawn = 1;
    const tgt = hold('titan', s.d + 10); tgt.hp = tgt.maxHp = 1e9;
    const baseShots = countShots(3);
    const y = hold('yeti', s.d - 20); y.hp = y.maxHp = 1e9;
    run(G, 1.6);
    out.ice = { boltChill: +bolt2.chillT.toFixed(2), frostChill: +frost.chillT.toFixed(2), boltShotsNormal3s: baseShots };
    out.ice.boltShotsChilled3s = countShots(3);
    // FROST supercharged: 3 blasts freeze, marks reset after thawing
    const g = hold('grunt', s.d); g.hp = g.maxHp = 1e9;
    const marks = [];
    let frozeAt = null, thawMarks = null;
    for (let i = 0; i < 6 * 60; i++) {
      T.update(1 / 60);
      if (g.marks !== (marks[marks.length - 1] || 0) || (g.iceLock > 0 && frozeAt === null)) marks.push(g.marks);
      if (g.iceLock > 0 && frozeAt === null) frozeAt = +(i / 60).toFixed(2);
      if (frozeAt !== null && thawMarks === null && g.iceLock <= 0) thawMarks = g.marks;
    }
    out.ice.markSeq = marks.slice(0, 8).join(','); out.ice.frozeAt = frozeAt; out.ice.marksAfterThaw = thawMarks;
    // a frozen enemy doesn't move
    const e2 = spawnEnemy('grunt', 1, 0, s.d); e2.age = 1; e2.iceLock = 0.5; const d0 = e2.dist; run(G, 0.3); out.ice.frozenMoved = +(e2.dist - d0).toFixed(1);
    return out;
  });
  console.log(JSON.stringify(r, null, 1));

  // screenshots: an electric + ice fight, and the level cards
  await p.evaluate(() => {
    const T = __TD, G = T.G;
    T.Save.d.max = 80; T.Save.d.loadout = ['arc', 'frost', 'emp', 'bolt'];
    T.startLevel(53); G.tutorial = false; G.gold = 5000; Sound.setEnabled(false);
    const spots = []; for (let r = 0; r < 13; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) spots.push([c, r, [...T.MAP.tiles].filter(k => ((k % 9) - c) ** 2 + (Math.floor(k / 9) - r) ** 2 <= 2).length]);
    spots.sort((a, b) => b[2] - a[2]);
    ['bolt', 'arc', 'frost', 'emp', 'nova', 'bolt', 'frost', 'arc'].forEach((t, i) => spots[i] && T.buildTower(t, spots[i][0], spots[i][1]));
    G.paused = true; let t = 0;
    T.startWave(false);
    while (t < 300 && !(G.enemies.some(e => e.alive && isLiveElec(e) && e.dist > 150) && G.enemies.some(e => e.alive && e.ice && e.dist > 150))) { T.update(1 / 60); t += 1 / 60; if (G.awaiting || G.nextTimer !== null) T.startWave(false); }
    G.paused = false;
  });
  await p.waitForTimeout(900);
  await p.screenshot({ path: SP + '/m1-fight.png' });
  await p.evaluate(() => { __TD.G.paused = true; });
  await p.evaluate(() => { __TD.toMap(); __TD.openCard(37); });
  await p.waitForTimeout(700); await p.screenshot({ path: SP + '/m2-card37.png' });
  await p.evaluate(() => { __TD.openCard(51); });
  await p.waitForTimeout(700); await p.screenshot({ path: SP + '/m3-card51.png' });
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
