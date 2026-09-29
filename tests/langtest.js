// Language picker + Chinese UI + shield mechanics. Usage: node langtest.js <shot dir>
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
  p.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL') && !m.text().includes('fonts.g')) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + require('path').resolve('dist/index.html'));
  await p.waitForTimeout(1200);
  const S = await p.evaluate(() => SCALE);
  const tapL = async (x, y) => { await p.mouse.click(x * S, y * S); await p.waitForTimeout(400); };
  console.log('first launch:', JSON.stringify(await p.evaluate(() => ({ LANG, LANG_CHOSEN }))));
  await p.screenshot({ path: SP + '/l1-picker.png' });
  const { LWv, LHv } = await p.evaluate(() => ({ LWv: LW, LHv: LH }));
  await tapL(LWv / 2, LHv * 0.58 - 40 + 104);        // 中文
  console.log('after tap:', JSON.stringify(await p.evaluate(() => ({ LANG, LANG_CHOSEN, saved: localStorage.getItem('shatterline.lang'), html: document.documentElement.lang }))));
  await p.waitForTimeout(1200);
  await p.screenshot({ path: SP + '/l2-title-zh.png' });

  // map + level 12 card (Aegis + EMP arrive together)
  await p.evaluate(() => { const Sv = __TD.Save; Sv.d.max = 20; for (let i = 1; i < 20; i++) Sv.d.stars[i] = 2; Sv.d.loadout = ['bolt', 'frost', 'nova']; Sv.d.known = ['bolt', 'frost', 'nova', 'arc', 'emp', 'mint', 'prism']; __TD.toMap(); });
  await p.waitForTimeout(700);
  await p.screenshot({ path: SP + '/l3-map-zh.png' });
  await p.evaluate(() => __TD.openCard(19));
  await p.waitForTimeout(700);
  await p.screenshot({ path: SP + '/l4-card19-zh.png' });
  await p.evaluate(() => { const h = hits.find(h => h.w === 220 && h.h === 56); h.cb(); });
  await p.waitForTimeout(450);
  await p.screenshot({ path: SP + '/l5-confirm-zh.png' });
  await p.evaluate(() => { const h = hits.filter(h => h.h === 46).pop(); h.cb(); });     // ADD
  await p.waitForTimeout(300);
  console.log('loadout after ADD:', JSON.stringify(await p.evaluate(() => __TD.Save.d.loadout)));

  // play level 18 with EMP + prism in Chinese, look at HUD + zaps
  await p.evaluate(() => { const T = __TD, G = T.G; T.Save.d.loadout = ['emp', 'prism', 'nova']; T.startLevel(19); G.gold = 3000; G.tutorial = false; Sound.setEnabled(true);
    const spots = []; for (let r = 1; r < 12; r++) for (let c = 0; c < 9; c++) if (T.isBuildable(c, r)) spots.push([c, r, [...T.MAP.tiles].filter(k => ((k % 9) - c) ** 2 + (Math.floor(k / 9) - r) ** 2 <= 4).length]);
    spots.sort((a, b) => b[2] - a[2]);
    ['emp', 'prism', 'emp', 'nova', 'prism', 'nova'].forEach((t, i) => spots[i] && T.buildTower(t, spots[i][0], spots[i][1]));
    T.startWave(false); G.speed = 2; });
  await p.waitForTimeout(1400);
  await p.screenshot({ path: SP + '/l6-banner-zh.png' });
  // fast-forward to a wave with Aegis
  await p.evaluate(() => { const G = __TD.G; G.paused = true; let t = 0; while (t < 400 && !G.enemies.some(e => e.alive && e.rc === __TD.ENEMIES.aegis && e.dist > 120)) { __TD.update(1 / 60); t += 1 / 60; if (G.awaiting) __TD.startWave(false); } G.paused = false; G.speed = 1; });
  await p.waitForTimeout(900);
  await p.screenshot({ path: SP + '/l7-aegis-zh.png' });
  // hold a tower to see the Chinese tooltip
  const tw = await p.evaluate(() => { const t = __TD.G.towers.find(t => t.type === 'emp'); return { x: t.x, y: t.y }; });
  await p.evaluate(({ x, y }) => { const G = __TD.G; G.menu = { kind: 'tower', tw: G.towers.find(t => t.type === 'emp'), sel: 'up', t: 1, shake: 0, hand: 1 }; }, tw);
  await p.waitForTimeout(300);
  await p.screenshot({ path: SP + '/l8-tooltip-zh.png' });
  await p.evaluate(() => { const G = __TD.G; G.menu = null; G.paused = true; });
  await p.waitForTimeout(400);
  await p.screenshot({ path: SP + '/l9-pause-zh.png' });
  await p.evaluate(() => { const G = __TD.G; G.paused = false; G.lives = 0; G.leakTypes = { aegis: 5 }; endGame(false); });
  await p.waitForTimeout(3500);
  await p.screenshot({ path: SP + '/l10-lose-zh.png' });
  // back to title and switch to English
  await p.evaluate(() => { __TD.G.state = 'title'; });
  await p.waitForTimeout(300);
  await p.evaluate(() => { const h = hits.find(h => h.w === 92 && h.h === 34); h.cb(); });
  await p.waitForTimeout(500);
  console.log('toggle:', JSON.stringify(await p.evaluate(() => ({ LANG, saved: localStorage.getItem('shatterline.lang') }))));
  await p.screenshot({ path: SP + '/l11-title-en.png' });
  await p.evaluate(() => { __TD.toMap(); __TD.openCard(19); });
  await p.waitForTimeout(700);
  await p.screenshot({ path: SP + '/l12-card19-en.png' });
  // reload: choice persists, no picker
  await p.reload(); await p.waitForTimeout(800);
  console.log('after reload:', JSON.stringify(await p.evaluate(() => ({ LANG, LANG_CHOSEN }))));
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
