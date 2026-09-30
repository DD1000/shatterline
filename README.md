# Shatterline

A neon tower defense game for phones, with 80 short Candy Crush-style levels, 12 towers, a Playtest Lab and English/Chinese/Spanish. Everything is drawn and synthesized in code, so there are no image or audio files.

**Play:** https://dd1000.github.io/shatterline/ (works in any phone or desktop browser, no account needed). Locally, just open `index.html`.

Progress is saved in the browser on each device (localStorage), so it doesn't carry over between phones, browsers or the Claude app.

## What's in here
| Path | What it is |
|---|---|
| `index.html` | The whole game in one readable file (same as `dist/index.html`). This is what GitHub Pages serves. |
| `dist/shatterline.html` | The same game without the page wrapper, for publishing as a Claude artifact. |
| `dist/itch/` | A minified single-file build (short names, no test hooks), handy for uploading to itch.io or other game sites. |
| `src/` | The source, split by topic: config, languages, levels, audio, drawing, game logic, UI, screens. **Behind the current game** (see below). |
| `build.sh` | Joins `src/` into `dist/index.html` (standalone) and `dist/shatterline.html` (artifact version), copies the standalone file to `index.html`, and makes the compact build `dist/itch/index.html`. |
| `tools/` | Bot playtesters and helpers: `calibrate.js` (difficulty tuning), `probe.js`, `audit.js` (tower balance), `gen_maps.js` (level paths), `perf*.js` (frame-time profiling). |
| `tests/` | Automated checks (Playwright). Run from the repo root, e.g. `node tests/smoke.js /tmp`. |

## Current version (v35)
- BOLT crits on a pattern: every 4th shot at level 1, and each upgrade makes one more shot of every 4 crit. At level 4 every shot crits (x2.5 damage).

### v34
- The version number is shown under the title screen footer and at the top right of the Playtest Lab.

### v33
- Playtest Labs start completely fresh when a lab is reworked (no stamp, stars, last result or win count); the old runs stay in the analytics report. All 10 labs are reset.

### v32
- Every tower's base damage is 25% higher, and each upgrade adds 10% of the tower's current damage (x1.1, x1.21, x1.331). Upgrades still don't raise fire rate.
- All Playtest Lab COMPLETED stamps were cleared so the labs can be replayed under the new balance.

### v31
- Upgrades add a flat +10% damage each (+10% / +20% / +30% over the built tower) and no longer raise fire rate. Range, splash, chains, beams, FROST's slow and PRISM's heat-up still improve.

### v30
- NOVA does 30% less damage per hit and fires 15% slower.
- Every enemy has 10% more health (`ECON.hpScale` 1.1).

### v29
- BOLT fires 20% slower and PRISM's beam does 20% less damage (both 20% less damage per second).

### v28
- Every boss level (10, 20 ... 80, plus the Warden Trial, Boss Rush and Gauntlet labs) is 25 waves long.
- Every finished level is logged: towers built, upgraded and sold, gold, lives, damage by tower, leaks, and a line per wave.
- A won lab gets greyed out under a COMPLETED stamp, and SEND LAB ANALYTICS copies a report to paste into chat.

### v27
- 12 towers, 80 levels, 10 Playtest Lab levels (including a boss).
- Fire rework and strategy pause.
- Spores cost 4 lives at the core: 1 for the Spore plus 1 for each Mite inside.
- NOVA fires 35% slower.
- Restart and retry go back to tower select, with the towers you used already picked.
- The Playtest Lab and Test Mode ask for a tester password.

**Note:** `src/` is still at v25. The v26 to v35 changes were made directly in the built HTML, so `index.html` and `dist/` are the up-to-date game. Don't run `build.sh` until `src/` has been brought up to date, or it will overwrite them with the older version.

## Making a change
1. Edit files in `src/`.
2. Run `bash build.sh`.
3. Push: `git add .`, `git commit -m "..."`, `git push`. GitHub Pages updates the live game within a minute or two.

Run `npm install` once (it installs Playwright for the tests and Terser for the compact build).
