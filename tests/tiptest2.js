// v45: the end-screen TIP box fits every tip (EN/ZH/ES) and the buttons stay on screen
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('file://' + require('path').resolve('index.html')); await p.waitForTimeout(600);
  const report = {};
  for (const [w, h] of [[390, 844], [360, 640]]) {
    await p.setViewportSize({ width: w, height: h });
    for (const l of ['en', 'zh', 'es']) {
      // the tip with the most lines in this language
      const pick = await p.evaluate(l => {
        localStorage.setItem('shatterline.dev', String(DEV_HASH)); DEV_OK = true; setLang(l);
        const tips = Object.assign({}, TIPS, (LOC() && LOC().tips) || {});
        const bw = Math.min(330, LW - 24); setFont(11, FONT_UI, 500);
        let best = null; for (const k in tips) { const n = wrapLines(tips[k], bw - 28).length; if (!best || n > best.n) best = { k, n }; }
        return best;
      }, l);
      await p.evaluate(([l, k]) => {
        const T = __TD, G = T.G; T.startLevel(12); G.autoAsk = null;
        const tips = (LOC() && LOC().tips) || TIPS, text = ((LOC() && LOC().tips[k]) || TIPS[k]);
        window.__keepGrunt = tips.grunt; tips.grunt = text; if (!LOC()) TIPS.grunt = text;   // show it through the plain 'grunt' tip
        G.leakTypes = { grunt: 3 }; G.lives = 1; endGame(false); G.state = 'end'; G.endShow = 3;
      }, [l, pick.k]);
      await p.waitForTimeout(400);
      const box = await p.evaluate(() => { const big = hits.filter(h => h.h >= 40 && h.w >= 150); const last = big[big.length - 1]; return { lowestButtonBottom: Math.round(Math.max(...big.map(h => h.y + h.h))), LH: Math.round(LH) }; });
      report[`${l}-${h}`] = { tip: pick.k, lines: pick.n, ...box, fits: box.lowestButtonBottom <= box.LH };
      await p.screenshot({ path: `shots/endtip-${l}-${h}.png` });
      await p.evaluate(() => { const tips = (LOC() && LOC().tips) || TIPS; tips.grunt = window.__keepGrunt; if (!LOC()) TIPS.grunt = window.__keepGrunt; });
    }
  }
  console.log(JSON.stringify(report, null, 1)); console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
