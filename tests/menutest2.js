// Radial menu: lift on nothing keeps it open, tap an option to use it, X closes it; slide-and-release still works.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await p.addInitScript(() => { try { if (!localStorage.getItem('shatterline.lang')) localStorage.setItem('shatterline.lang', 'en'); } catch (e) {} });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('file://' + require('path').resolve('dist/index.html'));
  await p.waitForTimeout(600);
  await p.evaluate(() => { const T = __TD; T.Save.d.max = 12; T.Save.d.loadout = ['bolt', 'frost', 'nova']; T.startLevel(12); T.G.gold = 400; T.G.tutorial = false; });
  await p.waitForTimeout(300);
  const [S, MX, MY] = await p.evaluate(() => [SCALE, MAP_X, MAP_Y]);
  const px = (c, r) => [(MX + c * 40 + 20) * S, (MY + r * 40 + 20) * S];
  const st = () => p.evaluate(() => ({ menu: __TD.G.menu ? __TD.G.menu.kind : null, towers: __TD.G.towers.map(t => t.type + t.lv), gold: __TD.G.gold }));
  const tiles = await p.evaluate(() => { const out = []; for (let r = 3; r < 11; r++) for (let c = 2; c < 7; c++) if (__TD.isBuildable(c, r)) out.push([c, r]); return out; });
  const path = await p.evaluate(() => { const k = [...__TD.MAP.tiles][6]; return [k % 9, Math.floor(k / 9)]; });
  const opt = id => p.evaluate(id => { const o = menuLayout(__TD.G.menu, true).opts.find(o => o.id === id); return [o.x * SCALE, o.y * SCALE]; }, id);
  const tap = async (x, y) => { await p.mouse.move(x, y); await p.mouse.down(); await p.waitForTimeout(60); await p.mouse.up(); await p.waitForTimeout(120); };
  const [t1, t2] = [tiles[0], tiles[tiles.length - 1]];
  let [x, y] = px(...t1);
  await p.mouse.move(x, y); await p.mouse.down(); const down = await st(); await p.mouse.up(); await p.waitForTimeout(150);
  console.log('tap tile: while down', down.menu, '| after lift', (await st()).menu, '(stays open)');
  console.log('options:', JSON.stringify(await p.evaluate(() => menuLayout(__TD.G.menu, true).opts.map(o => o.id))));
  await p.screenshot({ path: process.argv[2] + '/r1-pinned.png' });
  const farPath = await p.evaluate(([x, y, S]) => { const opts = menuLayout(__TD.G.menu, true).opts; let best = null, bd = -1;
    for (const k of __TD.MAP.tiles) { const c = k % 9, r = Math.floor(k / 9), cx = MAP_X + c * 40 + 20, cy = MAP_Y + r * 40 + 20;
      const d = Math.min(...opts.map(o => Math.hypot(o.x - cx, o.y - cy))); if (d > bd) { bd = d; best = [c, r]; } } return best; }, [x, y, S]);
  await tap(...px(...farPath)); console.log('tap a path tile away from the menu:', (await st()).menu, '(still open)');
  await tap(...(await opt('close'))); console.log('tap X:', JSON.stringify(await st()));
  await tap(x, y); await tap(...(await opt('nova'))); console.log('tap tile, then tap NOVA:', JSON.stringify(await st()));
  // classic hold + slide still works
  [x, y] = px(...t2);
  await p.mouse.move(x, y); await p.mouse.down(); await p.waitForTimeout(150);
  let [ox, oy] = await opt('bolt'); await p.mouse.move(ox, oy, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(120);
  console.log('hold + slide to BOLT:', JSON.stringify(await st()));
  // tower menu: can't afford upgrade -> stays open; mode toggles stay open; X closes
  await p.evaluate(() => { __TD.G.gold = 10; });
  [x, y] = px(...t1); await tap(x, y); await tap(...(await opt('up')));
  console.log('upgrade without gold:', JSON.stringify(await st()), '(stays open)');
  const m0 = await p.evaluate(() => __TD.G.towers[0].mode); await tap(...(await opt('mode')));
  console.log('mode toggle:', m0, '->', await p.evaluate(() => __TD.G.towers[0].mode), '| menu', (await st()).menu);
  await p.screenshot({ path: process.argv[2] + '/r2-tower.png' });
  await p.evaluate(() => { __TD.G.gold = 500; }); await tap(...(await opt('up'))); console.log('upgrade with gold:', JSON.stringify(await st()));
  await tap(x, y); await tap(...(await opt('close'))); console.log('tower menu X:', JSON.stringify(await st()));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
