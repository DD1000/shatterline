# Shatterline v28: lab analytics, COMPLETED stamps, 25-wave boss levels (2026-09-29, artifact v30)
- **Edited directly in the published HTML** (on top of v27 / artifact v29), like v27; `src/` is still v25. Port these before rebuilding from any `src/`.
- Patch scripts, run in order against the v29 artifact HTML (both saved in `claude/shatterline-tools/`):
  1. `v28_patch_analytics.py`: analytics and stamps. It reads `v28/base.html`.
  2. `v28_patch_boss25.py`: 25-wave bosses. It edits the output of the first script in place.
- Test: `claude/shatterline-tools/antest.js`.

## Run analytics (user: "track all important information about the level")
- `G.run = newRun()` in `resetRun()`, filled while you play:
  - Towers: built, upgrades, sold and burned down per tower type; gold spent per type.
  - Gold: refunds, peak gold, start gold, loadout, most towers on the board.
  - Events: early calls (+gold), shields/domes broken, towers set alight, fires put out.
  - Per wave: `[wave, gold at start, lives, towers, early 0/1]`, plus lives leaked in that wave added at the end.
- **Damage and kills by tower type:** a global `DMG_SRC`.
  - Set to `tw.type` in the tower loop in `update()`.
  - Projectiles carry `src` (shots, shells, missiles) and set it on impact. It's reset each frame.
  - `damage()` credits the HP actually removed plus shield or dome absorbed; `kill()` counts `killBy`.
- `recordRun(result)` runs from `endGame` (win or lose) and from `abandonRun()` (restart or quit after wave 1 = 'quit').
  - Labs: `Save.d.lab[n].runs` keeps the last 5 (`RUNS_PER_LAB`), and `r.quits` counts quits.
  - Campaign: `Save.d.runs` keeps the last 20. `Save.reset()` drops campaign runs and keeps lab data.
- `labReport()` builds an English text report. `BUILD = 'v28'` is stamped on each run. The report has:
  - A header.
  - For each lab: rules, waves, start gold, COMPLETED, wins/plays/quits, best stars. Then for each run: result, lives, wave, time, gold, loadout, built/upgrades/sold/burned, where the gold went, the board at the end, damage % by tower, kills by tower, lives leaked by enemy, early calls, shields, fire, and a per-wave line `w:gold/lives/towers-leakede`.
  - The last 10 campaign runs, in short form.

## Lab screen
- **Completed** = a win on the current lab version.
  - `Save.complete` sets `r.doneV = lab.v || 1` and `r.stamped = false`. `labDone(lv)` checks `doneV === (lv.lab.v || 1)`.
  - Bump a lab's `v` when it is reworked, and it opens up again.
- Won cards are greyed with a `saturation` composite plus a dark overlay (`greyCard`).
- **COMPLETED stamp** (`drawLabStamp`, `stampGlyph`, `drawCracks`):
  - Falls in 0.2 s from 3.4x size, see-through, with a shadow and a swoosh.
  - Impact: new `stamp` sound, vibrate, white flash, glow burst, shockwave ellipse, 18 debris chips, screen shake via `LABFX.hit`, and cracks that grow into the card.
  - A damped squash/wobble follows, then `r.stamped = true`.
  - Several stamps go one after another, 0.6 s apart. They wait while a level card is open on top.
  - Completed labs can still be replayed.
- **SEND LAB ANALYTICS** pill at the bottom (shown once any lab has been played; sub-line "x/10 COMPLETED").
  - Opens the DOM overlay `#an-box` with a textarea holding the report.
  - COPY tries `navigator.clipboard.writeText` first, then the select + `execCommand('copy')` fallback. With a mouse it copies straight away.
  - CLOSE shuts it. Strings are `lab_done`, `an_*` in EN/ZH/ES.

## Boss levels are 25 waves (user)
- **Campaign:** `BOSS_WAVES = 25`, so `waveCount(L)` = 25 for every L % 10 === 0. Before it was base + 5: 10→12, 20→14, 30→16, 40→17, 50→19, 60→21, 70→23, 80→25.
  - Bots (12 expert strategies, wins before → after at the old cal): 10: 3→4, 20: 5→7, 30: 1→1, 40: 4→4, 50: 0→1, 60: 4→5, 70: 1→8.
  - Longer levels spread the per-wave growth, so they got easier. Recalibrated LEVEL_CAL 20: 0.84→0.9 (4/12), 60: 0.27→0.29 (4/12), 70: 0.28→0.335 (3/12).
- **Labs rebuilt to 25 waves, each with `v: 2`** (old completions don't count):
  - Warden Trial: Wardens at 8, 16, and 2 at 25. New waves 15–24.
  - Boss Rush: Wardens at 4, 8, 12, 16, 2 at 20, and 2 at 25.
  - Gauntlet: new waves 16–24; the Warden still comes at 25.
  - Lab `hp` grows 4% a wave up to `grewAt` (the old length), then 2% a wave.
  - Card descriptions updated in EN/ZH/ES.
  - Bots at those cals: warden 0/12, bossrush 1/12, gauntlet 0/12 (they were 0, 1, 0 before).
- **User decision (2026-09-29): don't lower enemy health** after the v27 NOVA nerf and Spore change. Keep it harder, even though the bots lose much more now. Don't retune calibration to the bots' win rates unless the user asks.

## Tests
- All 10 earlier tests pass. New `antest.js` covers:
  - Lab run tracking and the win → `doneV`.
  - The stamp animation and `stamped` after it.
  - The overlay and a COPY that matches the clipboard.
  - A campaign quit logged as 'quit'.
  - After a reload, no second slam; ZH and ES screens.

## GitHub
- Upload is fast with Claude in Chrome's `file_upload`: open `github.com/DD1000/shatterline/upload/main`, `find` "Choose your files", pass paths **under the session working directory**, type the summary.
- **Live:** the user committed v28 `index.html` and `README.md` ("Shatterline v28: lab analytics, COMPLETED stamps, 25-wave boss levels"). pages-build-deployment #5 shows it Active at https://dd1000.github.io/shatterline/.
- `dist/*` is still v20 in the repo; the user said only `index.html` matters.
