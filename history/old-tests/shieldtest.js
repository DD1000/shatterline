// Shield rework v11: per-level shield types, Aegis dome, EMP strips on crossing. Usage: node shieldtest.js <shot dir>
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await p.addInitScript(() => { try { if (!localStorage.getItem('shatterline.lang')) localStorage.setItem('shatterline.lang', 'en'); } catch (e) {} });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
  await p.goto('file://' + require('path').resolve('index.html'));
  await p.waitForTimeout(600);
  // card for a level with Aegis + a shielded type
  await p.evaluate(() => { const S = __TD.Save; S.d.max = 40; S.d.loadout = ['bolt', 'nova', 'arc', 'frost']; S.d.known = ['bolt','frost','nova','arc','emp','mint','prism','rail','beacon','flak']; __TD.toMap(); __TD.openCard(37); });
  await p.waitForTimeout(700);
  await p.screenshot({ path: SP + '/v1-card37.png' });
  // mechanics
  const m = await p.evaluate(() => {
    const T = __TD, G = T.G; T.Save.d.loadout = ['bolt', 'emp', 'prism', 'nova']; T.startLevel(37); G.paused = true; Sound.setEnabled(false);
    const lv = G.level, st = lv.shieldTypes[0];
    const e1 = spawnEnemy(st, 3, 0, 40); const personal = { type: st, shield: +e1.shield.toFixed(1), hp: +e1.maxHp.toFixed(1) };
    const s0 = e1.shield; damage(e1, 10, {}); personal.boltHit = +(s0 - e1.shield).toFixed(2);
    const a = spawnEnemy('aegis', 3, 0, 200), g = spawnEnemy('grunt', 3, 0, 210), far = spawnEnemy('grunt', 3, 0, 400);
    G.domes = G.enemies.filter(x => x.alive && x.domeMax > 0);
    const gh = g.hp, d0 = a.dome; damage(g, 10, {}); const inDome = { gruntHpLost: +(gh - g.hp).toFixed(2), domeLost: +(d0 - a.dome).toFixed(2) };
    const fh = far.hp; damage(far, 10, {}); inDome.outsideHpLost = +(fh - far.hp).toFixed(2);
    const ph = g.hp; damage(g, 10, { pierce: true, quiet: true, throughShield: true }); inDome.prismHpLost = +(ph - g.hp).toFixed(2);
    // EMP field strips both for good
    const tw = { type: 'emp', lv: 0, x: e1.x, y: e1.y, c: 0, r: 0, kick: 0 };
    empField(tw, 80);
    const strip = { personalAfter: e1.shield, personalMax: e1.shieldMax };
    const tw2 = { type: 'emp', lv: 0, x: a.x + 60, y: a.y, kick: 0 }; empField(tw2, 80);
    strip.domeAfter = a.dome; strip.domeDead = a.domeDead;
    // no regrowth afterwards
    for (let i = 0; i < 400; i++) { T.update(1 / 60); }
    strip.domeLater = a.alive ? +a.dome.toFixed(1) : 'dead'; strip.personalLater = e1.alive ? e1.shield : 'dead';
    return { personal, inDome, strip };
  });
  console.log(JSON.stringify(m));
  // live: aegis domes walking into an EMP
  await p.evaluate(() => { const T = __TD, G = T.G; T.startLevel(37); G.gold = 5000; G.tutorial = false; Sound.setEnabled(true);
    const tiles = [...T.MAP.tiles]; const mid = tiles[Math.floor(tiles.length * 0.55)]; const mc = mid % 9, mr = Math.floor(mid / 9);
    let placed = false; for (let d = 1; d < 3 && !placed; d++) for (const [dc, dr] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) if (!placed && T.isBuildable(mc + dc * d, mr + dr * d)) placed = !!T.buildTower('emp', mc + dc * d, mr + dr * d);
    const len = T.MAP.paths[0].len;
    for (let i = 0; i < 3; i++) spawnEnemy('aegis', 3, 0, len * 0.25 + i * 70);
    for (let i = 0; i < 10; i++) spawnEnemy(i % 3 ? 'grunt' : G.level.shieldTypes[0], 3, 0, len * 0.22 + i * 20);
    for (const [c, r] of [[1, 2], [7, 3], [2, 9]]) if (T.isBuildable(c, r)) T.buildTower('bolt', c, r);
    G.waveNum = 3; G.awaiting = false; });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: SP + '/v2-domes.png' });
  await p.waitForTimeout(2600);
  await p.screenshot({ path: SP + '/v3-emp.png' });
  // Chinese card
  await p.evaluate(() => { setLang('zh'); __TD.G.state = 'map'; __TD.toMap(); __TD.openCard(37); });
  await p.waitForTimeout(700);
  await p.screenshot({ path: SP + '/v4-card37-zh.png' });
  await p.evaluate(() => setLang('en'));
  // light shield level plays straight away; heavy one asks "are you sure?"
  for (const n of [47, 49]) {
    await p.evaluate(n => { const S = __TD.Save; S.d.max = 60; S.d.loadout = ['bolt', 'nova', 'arc', 'frost']; SAGA.confirm = null; __TD.G.state = 'map'; __TD.toMap(); __TD.openCard(n); }, n);
    await p.waitForTimeout(400);
    console.log(`L${n}`, JSON.stringify(await p.evaluate(() => { const L = __TD.LEVELS[SAGA.card.n - 1], h = hits.find(h => h.w === 220 && h.h === 56); h.cb(); return { heavy: L.shielded, types: L.shieldTypes, share: +L.shieldShare.toFixed(2), started: __TD.G.state === 'play', prompt: !!SAGA.confirm }; })));
  }
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
