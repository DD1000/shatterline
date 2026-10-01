const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage();
  await p.addInitScript(() => { try { if (!localStorage.getItem('shatterline.lang')) localStorage.setItem('shatterline.lang', 'en'); } catch (e) {} });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL')) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve('index.html'));
  await p.waitForTimeout(500);
  const r = await p.evaluate(async () => {
    window.__TD_DEBUG = 1; Sound.init(); Sound.resume();
    await new Promise(r => setTimeout(r, 300));
    const names = ['bolt','hit','crit','arc','launch','boom','frost','kill','coin','build','upgrade','sell','leak','wave','boss','bossDie','combo','clear','tap','deny','lose','win'];
    for (const n of names) Sound.play(n, 3);
    Sound.setLevel(15, true); Sound.musicOn();
    await new Promise(r => setTimeout(r, 2500));
    return Sound.ready;
  });
  console.log('audio running:', r);
  console.log(errs.length ? errs.join('\n') : 'no errors');
  await b.close();
})();
