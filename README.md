# Shatterline

A neon tower defense game for phones, with 80 short Candy Crush-style levels, 13 towers, a Playtest Lab and English/Chinese/Spanish. Everything is drawn and synthesized in code, so there are no image or audio files.

**Play:** https://dd1000.github.io/shatterline/ (works in any phone or desktop browser, no account needed). Locally, just open `index.html`.

Progress is saved in the browser on each device (localStorage), so it doesn't carry over between phones, browsers or the Claude app.

## What's in here
| Path | What it is |
|---|---|
| `index.html` | The whole game in one readable file. This is what GitHub Pages serves, and the file to edit. |
| `dist/` | `index.html` copied, plus `shatterline.html`: the same game without the page wrapper, for publishing as a Claude artifact. Made by `tools/export_artifact.py`. |
| `src/` | The source, split by topic: config, languages, levels, audio, drawing, game logic, UI, screens. **Behind the current game** (see below). |
| `build.sh` | The old build: joins `src/` into `index.html` and `dist/`. **Outdated, don't run it** (see the note below). |
| `tools/` | Bot playtesters and helpers: `calibrate.js` (difficulty tuning), `probe.js`, `audit.js` (tower balance), `gen_maps.js` (level paths), `perf*.js` (frame-time profiling), `labtool.js`/`antest.js` (Playtest Lab checks), and `export_artifact.py` (makes `dist/` from `index.html`). |
| `tests/` | Automated checks (Playwright). They load the root `index.html`. Run them all from the repo root with `bash tests/run_all.sh`, or one with `node tests/smoke.js shots`. |
| `docs/` | The design notes and history (`design-and-history.md`) and a note for every version from v27 on (`versions/`). |
| `history/` | The patch scripts that made v28 to v47 (each one edits the game with exact find-and-replace anchors), plus retired tests. For reference only. |
| `CLAUDE.md` | How to work on the game with Claude Code. |

## Current version (v48)
- New tower: **LANCE** (unlocks at level 40), a long-range sniper. One big shot every 2.5 s that lands at once, aimed at the toughest enemy (the target button switches it), on the ground or in the air. 120 gold; 60 damage (+10% per upgrade, so 24 to 31.9 damage a second); range 6 / 6.5 / 7 / 7.5 tiles. Big hits shrug off most armor: a Titan takes 53 of the 60. A laser sight and a closing reticle show what it's aiming at.
- LANCE level 4 is **DEADEYE** (300 gold): any shot that leaves a non-boss enemy under 25% health shatters it. It has its own look: a turning red crosshair and an eye.
- Every tower now has its own level 4 look: FROST, EMP, MINT, PRISM, RAIL, BEACON, FLAK, PYRO and TIDE join MASTER BOLT, LIVE WIRE and SUPERNOVA (and DEADEYE). These are looks only, with no new abilities. Reaching level 4 plays a bigger burst.
- AIR RAID: FLAK and LANCE can bring flyers down, and a level asks for either one.
- Two new Playtest Labs:
  - **VAULT MINTS:** level 25 with its campaign economy, except that each MINT pays out 2.5x what was spent on it (an upgrade tops it up) and then shatters. Selling one refunds only the share still in its vault. The gold level inside the MINT shows what's left, and its outline blinks when it's nearly empty. The campaign's MINT is unchanged for now, and NO BOUNTY levels never use the vault.
  - **SKY SHIELDS:** Gliders and Stormwings with shields. FLAK and LANCE only chip a shield (20%); EMP lasers strip shields in the air.
  - Lab analytics now report the gold MINTs paid, MINTs that ran dry, and DEADEYE finishes.
- Fixes: the level card's note shrinks to fit (long new-tower notes overlapped the loadout); the lab screen fits 14 labs; the EMP (English) and ARC (Spanish) texts fit the unlock popup again.

### v47
- TIDE soaks every enemy its jets hit, for the rest of its trip (a film of water and drips show it). Soaked enemies take 20% more damage from ARC and 20% less from PYRO, and FROST freezes them even without its snowball supercharge: every 3 blasts, every 2 if FROST is supercharged or level 4, and every blast if it is both. TIDE's jets now go for burning enemies first, then enemies that aren't soaked yet. It still puts out fires.
- AUTO BUILD is only offered when you pick the same towers (in any order) as on the try you lost.
- The repo now holds everything needed to keep working on the game: `CLAUDE.md`, the design notes and version notes in `docs/`, the patch history in `history/`, the newer tests (they load the root `index.html`; run them with `bash tests/run_all.sh`) and the lab tools.

### v46
- NOVA level 4 is now the SUPERNOVA (300 gold): a big mortar hole with 4 shells around its rim. Each volley lobs the main shell (full damage, same as before) plus 3 smaller shells (20% damage, smaller blast) that spread out to hit as many other enemies in range as they can. The fire rate is unchanged. With no other enemies around, the extras fan out over the road instead of stacking on the main target.

### v45
- The TIP box on the defeat screen grows to fit its text (long tips used to spill out of it); the buttons move down to make room.

### v44
- EMP lasers reach flying enemies too: they strip a flyer's shield, short out an electrified flyer, and do their tiny damage. FLAK is still the only tower that can bring flyers down.

### v43
- AUTO BUILD: every tower action (build, upgrade, sell, rail turn, target mode) and every wave you call is recorded, anchored to the wave it happened in. After a loss, starting that level again asks "AUTO BUILD UNTIL WAVE..." with a grid of every wave's enemies (the wave you lost on is marked) and what the replay will do. The replay repeats your last try at the same moments on the same tiles until the chosen wave begins, then hands over (a pill shows it's running; tap its X to stop). It waits if gold is short and skips anything that no longer fits (tile taken, tower gone, tower not in your loadout). Winning the level forgets the saved try.

### v42
- Electrified enemies are immune to ARC (it skips them, and its chain and pulse pass through them). ARC still gets supercharged next to them.
- EMP can't be shut down by electrified enemies, and still shorts them out for 4s (while shorted, ARC can hurt them).
- Boss versions of all 12 regular enemies (lab-only for now): Block King, Dart Queen, Spore Mother, Fortress, Bastion, Phantom, Lifebloom, Colossus, Stormwing, Overload, Frost Giant and Inferno. Each wears a crown and has its base enemy's trick turned up.
- Bosses can carry the same modifiers as enemies (shield, electric, ice, fire).
- Two new Playtest Labs to try them: BOSS ZOO I and BOSS ZOO II (25 waves each).

### v41
- ARC level 4 (LIVE WIRE) keeps the original chain lightning: 23.3 damage, 1.56 zaps a second, up to 8 enemies, normal targeting (the target-mode button is back).
- The only new thing at level 4 is the track pulse: every zap also sends a pulse from the first enemy it hit down every track, dealing 2.3 to each ground enemy it passes.

### v40
- ARC level 4 (LIVE WIRE) zaps the enemy in front (23.3 damage, 1.56 a second; no chain, no target-mode button).
- Every zap sends a pulse down every track from the enemy it hit, in both directions and into every branch, at 12 tiles a second. It deals 2.3 damage to each ground enemy it passes (armor and shields apply; flyers are safe).
- The v39 lightning bolts are gone (replaced by the pulse).

### v39
- The electrified road is gone. ARC level 4 (LIVE WIRE, same look) chain-zaps like the other levels again: 23.3 damage, 1.56 zaps a second (+20% over level 3), up to 8 enemies.
- Every 4th hit an enemy takes from a LIVE WIRE calls down a lightning bolt on it for 20 damage (each LIVE WIRE counts its own hits).
- Electrified enemies no longer feed on anything; Volts supercharge a LIVE WIRE like any ARC.

### v38
- The LIVE WIRE (ARC level 4) does 90% less damage on its road: 2.33 per tick instead of 23.29, still 1.3 times a second.

### v37
- ARC fires 20% faster with each upgrade (0.9 / 1.08 / 1.3 zaps a second).
- ARC level 4 transforms into the LIVE WIRE: instead of chain zaps it electrifies the whole route that passes through its range (portal to core) and hits every ground enemy on it for 23 damage, 1.3 times a second (level 3's rate, fixed). Flyers are safe. It looks different too: a spinning hexagram coil, a white-blue storm core and a crackling blue ring, and the charged road crackles with current.
- Electrified enemies feed on a LIVE WIRE road instead of taking its damage: while on it they short out towers up to 2 tiles further away and move 20% faster, and they gain 20% health the first time. An EMP-shorted one takes the damage like anyone else.
- Long tower descriptions now wrap in the build tooltip and the NEW TOWER popup instead of running off the edge.

### v36
- BOLT crits: every 4th shot at level 1, the 3rd and 4th at level 2, the 2nd, 3rd and 4th at level 3 (x2.5 damage).
- Level 4 is the MASTER BOLT: it keeps the level 3 crit pattern, fires 35% faster (3.02 shots a second) and looks different: gold, twin barrels that alternate, a star-shaped body, a spiked rotating crown and gold shots. Upgrading to it gets its own MASTER BOLT burst.

### v35
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

**Note:** `src/` is still at v25. The v26 to v48 changes were made directly in the built HTML, so `index.html` is the up-to-date game and the file to edit. Don't run `build.sh`: it rebuilds from the old `src/` and would overwrite `index.html` with the older version.

## Making a change
1. Edit `index.html` (and bump `const BUILD = 'vNN'` near the top of the script).
2. Run the tests: `bash tests/run_all.sh`.
3. Run `python3 tools/export_artifact.py` to refresh `dist/`.
4. Push: `git add .`, `git commit -m "..."`, `git push`. GitHub Pages updates the live game within a minute or two.

Run `npm install` and `npx playwright install chromium` once (Playwright runs the tests in a headless browser).
