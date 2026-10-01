# Shatterline — notes for Claude Code

Shatterline is a neon tower defense game for phones: one HTML file with a canvas. Everything is drawn and synthesized in code (no image or audio files). It has 80 campaign levels, Playtest Lab levels (101+), and 12 towers. The text is in English, Chinese and Spanish.

- **Live game (GitHub Pages):** https://dd1000.github.io/shatterline/. Pages serves `index.html` from `main`.
- **Repo:** https://github.com/DD1000/shatterline
- **Claude artifact copy:** https://claude.ai/artifact/4QMRErRXRPzKAQSPisVznv (artifact Version 49 = v47)

## Working with the user
- The user is not a professional engineer. They give short commands ("make X do Y", "commit") and expect Claude to handle the rest: design details, code, tests, screenshots, README and version notes.
- When an idea has real design choices, offer 2–4 concrete options with a recommendation, then build what they pick.
- **Commit and push only when the user says "commit".** Each time is a separate go-ahead. Finish the work, test it, and leave it ready, then wait.
- **Never write the tester password** (for the Playtest Lab and Test Mode) anywhere: not in the README, commit messages, docs or code comments. The game stores only its hash (`DEV_HASH`).
- Keep replies short: what changed, any balance numbers that matter, and a screenshot when the look changed.
- Design goals: every tower should be worth using (none should feel useless); levels are short (Candy Crush-style); the visuals and sounds should feel juicy.

## Current state
- **v47** is in this working tree but **not committed or pushed yet**. It contains:
  - TIDE soaking
  - AUTO BUILD only offered with the same towers
  - the move from the cloud workspace to this repo: `docs/`, `history/`, `CLAUDE.md`, the newer tests and tools, and the README changes
- The live site is still on v46 (commit b1471ec) until the user says commit.
- An older v47 upload may still be staged in a GitHub "upload files" tab in Chrome. It is superseded by this repo; ignore it.

## Files
- `index.html` is **the game and the source of truth** (about 6,000 lines). Edit it directly.
- `src/` and `build.sh` are from v25 and outdated. **Never run `build.sh`**: it would overwrite `index.html` with the old game.
- `dist/` is made by `python3 tools/export_artifact.py`: a copy of `index.html`, plus `shatterline.html` (artifact format, without the page wrapper) for publishing as a Claude artifact.
- `tests/` holds the Playwright checks; they load the root `index.html`. `tools/` holds the bot playtesters and helpers.
- `docs/design-and-history.md` has the full design and history up to the v2x era. `docs/versions/` has one note per version from v27 on, covering what the user asked for, what changed, how it was verified, and balance numbers. **Read the relevant notes before changing a tower or system.**
- `history/patches/` holds the scripts that made v28–v47. Each one is an exact find-and-replace patch on the game file, so it shows exactly what each version changed.

## Where things are in index.html (search for these names)
- `const BUILD = 'vNN'`: the version label (title screen, lab screen, lab analytics). **Bump it in every version.**
- `ENEMIES`, `BOSS_VERSIONS`: enemy recipes. `ELEC`, `ICE`, `FIRE`, `SOAK`: the electric, ice, fire and soak rules.
- `TOWERS`: tower data. Each `lv[]` entry is one level; level 4 can carry special flags (`master`, `wire`, `supernova`). `TOWER_ORDER` sets the menu order.
- `ECON`, `LEVELS`, `LEVEL_CAL` (difficulty per level), `LAB_DEFS` (Playtest Labs, ids start at 101).
- `STR` holds the strings for `en`, `zh` and `es`; `tr(id, ...args)` looks them up. Tower and enemy descriptions are also in `desc` fields and in the per-language `tower`/`enemy` blocks.
- Tower attacks are in `fire(tw, tg)`, with special cases nearby (`supernovaVolley`, `tideFire`, `launchPulse`/`updatePulses`, `fireRail`, `mintPulse`, `frostNeed`). Hits go through `damage(e, amt, opts)`, which handles armor, brittle, soak, dome and shield. `DMG_SRC` holds the tower type currently dealing damage.
- The main loop is `update(dt)`. Drawing: `drawGlyph` (enemies), `drawTowerGlyph` (towers, including the level 4 looks), `drawTooltip`.
- Upgrades: `upgradeTower` (level 4 transformation effects); `menuLayout` (radial menus).
- AUTO BUILD: `recAct`, `saveReplay`, `sameTowers`, `beginReplay`, `replayStep`, `drawAutoAsk`.
- Test hooks: `window.__TD` exposes `G`, `startLevel`, `buildTower`, `upgradeTower`, `spawnEnemy`, `update` and more. Dev mode is on when localStorage `shatterline.dev` equals `String(DEV_HASH)`; the tests set that.

## Making a version (what has worked every time)
1. Make the change in `index.html` and bump `BUILD` to the next `vNN`.
2. Write a test in `tests/` for the new behavior. Copy the pattern from a recent one: `soaktest.js`, `novatest.js` or `pulsetest.js`.
   - Use `__TD.update(1/30)` loops for deterministic simulations.
   - Park enemies with `spawnEnemy` and `speed = 0`, and give them huge HP to measure damage.
   - Take screenshots to `shots/`.
3. Run `bash tests/run_all.sh`. Everything must say `ok`. Check that the page has no errors.
4. Check every new or changed string in EN, ZH and ES by screenshot. Tooltips and the unlock popup fit at most 4 lines; long Spanish text is usually the one that overflows.
5. Look at the screenshots of anything visual: tower glyphs, effects, menus at 390×844 and 360×640.
6. In `README.md`:
   - add a `## Current version (vNN)` section and move the previous one down to `### vNN-1`;
   - update the "v26 to vNN" note.
7. Add `docs/versions/shatterline-vNN-<topic>.md`, written like the others: the user's request, what changed, the verification, and publishing status.
8. Run `python3 tools/export_artifact.py` to refresh `dist/`.
9. Wait for "commit". Then `git add -A && git commit -m "Shatterline vNN: <summary>" && git push`, and check that the live site serves the new `BUILD`. Pages takes a minute or two.

## Gotchas
- JS strings in the data use single quotes. Escape apostrophes (`can\'t`), or one stray quote breaks the whole game. Run the tests after any text edit.
- Bots are poor judges of difficulty here. The user's own lab runs and the lab analytics report are the real measure. When changing balance, measure damage before and after with parked enemies, and report the numbers to the user.
- In Playwright, the game keeps running in real time during `waitForTimeout`. Simulate with `__TD.update` instead when timing matters.
- Setup on this Mac: `npm install` then `npx playwright install chromium` (once).
