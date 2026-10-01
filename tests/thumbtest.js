const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await p.addInitScript(() => { try { if (!localStorage.getItem('shatterline.lang')) localStorage.setItem('shatterline.lang', 'en'); } catch (e) {} });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('file://' + require('path').resolve('index.html'));
  await p.waitForTimeout(600);
  await p.evaluate(() => { const T = __TD; T.Save.d.max = 20; T.Save.d.loadout = ['bolt', 'frost', 'nova', 'arc']; T.startLevel(20); T.G.gold = 200; T.G.tutorial = false; });
  // synthetic touch presses through the real input path
  const press = (c, r, move) => p.evaluate(([c, r, move]) => {
    const rect = cvs.getBoundingClientRect(), x = (MAP_X + c * 40 + 20) * SCALE + rect.left, y = (MAP_Y + r * 40 + 20) * SCALE + rect.top;
    cvs.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, bubbles: true }));
    if (move) { const G = __TD.G; const o = menuLayout(G.menu, true).opts.find(o => o.id === move); cvs.dispatchEvent(new PointerEvent('pointermove', { pointerId: 7, pointerType: 'touch', clientX: o.x * SCALE + rect.left, clientY: o.y * SCALE + rect.top, bubbles: true })); }
    return { hand: __TD.G.menu && __TD.G.menu.hand, opts: __TD.G.menu && menuLayout(__TD.G.menu, true).opts.map(o => [o.id, Math.round(o.x - (MAP_X + c * 40 + 20)), Math.round(o.y - (MAP_Y + r * 40 + 20))]) };
  }, [c, r, move]);
  const release = () => p.evaluate(() => { cvs.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 7, pointerType: 'touch', bubbles: true })); });
  const shots = [];
  const cases = [[0, 6, 'frost'], [8, 6, 'nova'], [3, 0, 'bolt'], [5, 12, 'arc']];
  for (const [c, r, mv] of cases) {
    const ok = await p.evaluate(([c, r]) => __TD.isBuildable(c, r), [c, r]);
    let cc = c, rr = r;
    if (!ok) { const alt = await p.evaluate(([c, r]) => { for (let d = 1; d < 5; d++) for (const [dc, dr] of [[0, d], [0, -d], [d, 0], [-d, 0]]) if (__TD.isBuildable(c + dc, r + dr)) return [c + dc, r + dr]; }, [c, r]); [cc, rr] = alt; }
    const info = await press(cc, rr, mv);
    await p.waitForTimeout(350);
    const f = SP + `/th_${cc}_${rr}.png`; await p.screenshot({ path: f }); shots.push(f);
    console.log(`tile ${cc},${rr}`, JSON.stringify(info));
    await release(); await p.waitForTimeout(100);
  }
  // tower menu with each thumb
  await p.evaluate(() => { const T = __TD; T.G.gold = 900; for (let r = 5; r < 9; r++) for (let c = 1; c < 8; c++) if (T.isBuildable(c, r) && !T.G.towers.length) T.buildTower('bolt', c, r); });
  const tw = await p.evaluate(() => [__TD.G.towers[0].c, __TD.G.towers[0].r]);
  const info = await press(tw[0], tw[1], 'up'); await p.waitForTimeout(350);
  const f = SP + '/th_tower.png'; await p.screenshot({ path: f }); shots.push(f);
  console.log('tower', JSON.stringify(info));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  require('fs').writeFileSync(SP + '/th_list.txt', shots.join('\n'));
  await b.close();
})();
