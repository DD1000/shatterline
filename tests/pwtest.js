// Tester password in front of the Playtest Lab and TEST MODE. Usage: node pwtest.js <shot dir>
const { chromium } = require('playwright');
const SP = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  await p.evaluate(() => { localStorage.removeItem('shatterline.dev'); DEV_OK = false; setLang('en'); const S = __TD.Save; S.d.max = 12; S.d.testAll = false; S.store(); __TD.G.state = 'title'; });
  await p.waitForTimeout(300); await p.screenshot({ path: SP + '/pw1-title-locked.png' });
  const out = {};
  await p.evaluate(() => hits.filter(h => h.w === 196 && h.h === 40)[0].cb());                  // PLAYTEST LAB
  await p.waitForTimeout(300);
  out.overlay = await p.evaluate(() => !!document.getElementById('pw-box'));
  out.stateLocked = await p.evaluate(() => __TD.G.state);
  await p.fill('#pw-in', 'onlyjoe'); await p.click('#pw-yes'); await p.waitForTimeout(300);
  out.wrong = await p.evaluate(() => ({ err: document.getElementById('pw-err').textContent, open: !!document.getElementById('pw-box'), state: __TD.G.state }));
  await p.screenshot({ path: SP + '/pw2-wrong.png' });
  await p.fill('#pw-in', ' Abyss '); await p.click('#pw-yes'); await p.waitForTimeout(400);
  out.right = await p.evaluate(() => ({ open: !!document.getElementById('pw-box'), state: __TD.G.state, stored: localStorage.getItem('shatterline.dev') }));
  await p.reload(); await p.waitForTimeout(600);
  await p.evaluate(() => { __TD.G.state = 'title'; });
  await p.waitForTimeout(200);
  await p.evaluate(() => hits.filter(h => h.w === 196 && h.h === 40)[0].cb()); await p.waitForTimeout(200);
  out.afterReload = await p.evaluate(() => ({ devOk: DEV_OK, overlay: !!document.getElementById('pw-box'), state: __TD.G.state }));
  // TEST MODE: locked device -> asks; cancel leaves it off; turning off never asks
  await p.evaluate(() => { localStorage.removeItem('shatterline.dev'); DEV_OK = false; __TD.G.state = 'title'; }); await p.waitForTimeout(200);
  await p.evaluate(() => hits.filter(h => h.w === 196 && h.h === 40)[1].cb()); await p.waitForTimeout(200);
  out.testAsk = await p.evaluate(() => !!document.getElementById('pw-box'));
  await p.click('#pw-no'); await p.waitForTimeout(200);
  out.testAfterCancel = await p.evaluate(() => ({ testAll: !!__TD.Save.d.testAll, overlay: !!document.getElementById('pw-box') }));
  await p.evaluate(() => hits.filter(h => h.w === 196 && h.h === 40)[1].cb()); await p.waitForTimeout(200);
  await p.fill('#pw-in', 'abyss'); await p.press('#pw-in', 'Enter'); await p.waitForTimeout(300);
  out.testOn = await p.evaluate(() => !!__TD.Save.d.testAll);
  await p.evaluate(() => { DEV_OK = false; }); await p.waitForTimeout(100);
  await p.evaluate(() => hits.filter(h => h.w === 196 && h.h === 40)[1].cb()); await p.waitForTimeout(200);
  out.testOffNoAsk = await p.evaluate(() => ({ testAll: !!__TD.Save.d.testAll, overlay: !!document.getElementById('pw-box') }));
  await p.evaluate(() => { __TD.Save.d.testAll = false; __TD.Save.store(); });
  console.log(JSON.stringify(out));
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
