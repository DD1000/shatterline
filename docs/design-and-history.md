# Shatterline: tower defense (Candy Crush-style levels)

**Playable build:** https://claude.ai/artifact/4QMRErRXRPzKAQSPisVznv (single HTML file, canvas + WebAudio, no image or audio files)
**Status (2026-09-29, v26):** 80-level playtest version plus a 10-level Playtest Lab. It has a level map, stars, unlocks and loadouts, plus:
- 12 towers (each with 4 levels) and 14 enemy types (one flying) across 8 worlds.
- Five level conditions: No Bounty, Air Raid, Shields, Heatwave and Rainstorm.
- 5 waves at level 1 rising to 20 by level 80; boss levels get 5 more (up to 25).
- English, Simplified Chinese and Spanish.

Progress is saved on the player's device (localStorage keys `shatterline.save`, `shatterline.lang`, `shatterline.thumb`).

## Decisions so far
- Art style is **Glowforms** (living neon geometry). Everything is drawn from number recipes, so there are no sprite sheets.
- Levels work like Candy Crush: short levels (roughly 1.5–4 min at 1x speed, half that at 2x), a scrolling level map, and 1–3 stars. There's no lives/energy system, so players can retry freely.
- **Stars:** ★★★ = lose no lives, ★★ = lose 3 or fewer (out of 10), ★ = survive.
- **Design goal (from the user): every tower should get used, with none that feel useless.** Level conditions and shields give the niche towers levels that need them, and the tower balance pass keeps the damage towers close to each other.
- **Unlocks and loadout:** towers and enemies unlock gradually. Before each level, a card shows the enemies coming (with NEW and SHIELD badges) and lets the player pick a **loadout**.
  - The loadout is 3 towers, rising to 4 from level 20.
  - A newly unlocked tower is added to the loadout automatically.
  - The card grid is 6 × 2 for the 12 towers (5 × 2 before v23).
- **Range preview:** shows both the tile grid (every reachable square lit, path squares brighter) and the radius circle. An upgrade preview adds the new squares in white plus a dashed white circle. Rail shows its firing line instead.
- **Radial menu (v15):**
  - Pressing a tile opens the menu.
  - You can still slide onto an option and let go to use it. Letting go anywhere else **keeps the menu open**, so you can then tap an option.
  - An **X** option on the thumb's side of the arc closes it. Tapping a path tile or the HUD doesn't close it, and tapping another tile moves the menu there.
  - Build, upgrade and sell close the menu. Target mode and Rail turn keep it open so you can keep cycling. Not enough gold also keeps it open (the option shakes and says NEED X MORE GOLD).
  - Pulse towers (Frost, EMP) have only Sell, Upgrade and X.
  - `menutest2.js` covers all of this.
- **Thumb-aware menu:**
  - Options fan out in an arc above the finger and lean away from the thumb.
  - The game guesses the thumb from which side of the screen you press, and the pause menu can override it (Auto / Left / Right).
  - The user tried a centered arc and chose to keep the lean. v9 accidentally shipped the centered version; v10 restored it.
- Price tags are gold when affordable and dark red when not.
- **Tracks are always on the grid.** Every level is validated, and a runtime `gridSafe()` guard bends any diagonal segment into an L shape. Flyers are the only thing that moves diagonally, along dotted flight lines.
- **Test mode:** a toggle on the title screen opens all levels and towers without changing real progress.

## Languages (v10, Spanish in v23)
- **First launch:** the game shows "CHOOSE LANGUAGE · 选择语言 · ELIGE IDIOMA" with ENGLISH, 中文 and ESPAÑOL buttons. The choice is saved.
- **Switching later:** the pill in the top-right of the title screen, or Language in the pause menu, opens a language overlay.
- **What gets translated:** every piece of text is translated. The SHATTERLINE logo stays in English.
- **Chinese names:**
  - Towers: Bolt 光弹, Frost 冰霜, Nova 新星, Arc 电弧, EMP 电磁, Mint 铸币, Prism 棱镜, Rail 轨道炮, Beacon 信标, FLAK 防空.
  - Enemies: Block 方块, Dart 飞镖, Spore 孢子, Mite 螨虫, Bulwark 壁垒, Warden 守卫者, Aegis 神盾, Blink 闪烁, Mender 治愈者, Titan 泰坦, Glider 滑翔者.
- **Code:**
  - Strings live in `src/12_i18n.js` (`tr(id, ...args)`, `tName`, `eName`, `tDesc`, `eDesc`, `wName`, `condTag`, `condLine`).
  - Fonts fall back to Noto Sans SC / PingFang SC / Microsoft YaHei.
  - Wrapping can break between Chinese characters, and never starts a line with ，or 。.

## Shields (v11, light/heavy split in v12)
- **Light vs heavy (v12, user's request):** from level 21 **every level has shielded enemy types**, but most are *light*: you can get away without a shield buster.
  - A light level has one minor type, 5–20% of the level's health, with thin shields (25% of its HP).
  - The level card still badges the shielded enemy and says "EMP or PRISM helps, but you can manage without." There's no prompt.
  - **Heavy** levels have an Aegis, or shielded types worth ≥30% of the level's health (`HEAVY_SHIELD_SHARE`), with full shields (60% of HP).
  - Only heavy levels get the HEAVY SHIELDS condition strip, map/HUD tag and banner, and the prompt **"This level has heavy shield usage. Are you sure you want to play without EMP / PRISM?"**
  - No Bounty levels never shield a type that appears in waves 1–2.
- **Two kinds of shield.** Both take only **20%** of normal damage (`SHIELD_FACTOR = 0.2`), shown as small blue numbers.
  - **Personal shields:** worth 60% of HP on heavy levels (`SHIELD_PCT`) or 25% on light ones (`SHIELD_PCT_LIGHT`). They have a blue hex ring and regrow after 2s without hits.
  - **Aegis dome:** the Aegis (80 HP, speed 0.85, no shield of its own) projects a big dome (radius 1.6 tiles) that travels with it. Every ground enemy inside takes 20% damage while the dome soaks the hits.
    - The dome is worth 100 × level HP (raised from 60 in v12). It breaks under enough damage and regrows after 3s, and it disappears when the Aegis dies.
- **EMP (unlocks at 12, cost 75):** any shield that **crosses its field is stripped instantly and for good**, including a whole dome when its Aegis passes by.
  - It also pulses small damage: 4 / 8 / 14, range 2.0 / 2.3 / 2.6.
- **PRISM** doesn't remove shields; its beam **lasers straight through them** (and can snipe the Aegis inside its dome).
- **Prism sound (v18):** an **electrical hum with vibrato locked to the beat**. It replaced the Shepard tone at the user's request.
  - v19 made it duller, with more low end: a sawtooth on the chord root (two octaves down, about 87–131 Hz) plus a sine an octave below it. They go through a low-shelf boost, a 260 Hz body bump and a slightly resonant lowpass at about 600 Hz (1.1 kHz when hot), with a faint crackle.
  - It glides when the chord changes. The average pitch of the sound dropped from about 410 Hz to about 140 Hz at similar loudness.
  - Vibrato: ±24 cents, one cycle per 16th note, scheduled by the music sequencer (`humStep`), so it wobbles in time with the song (about 7 Hz). Each beat also gets a small volume swell.
  - Heat opens it slightly and adds crackle, but it never changes speed.
  - One shared voice fades out when no Prism fires. `humtest.js` checks the root note, that the vibrato rate matches the 16th-note rate, and the fade-out.
- **Which levels:** `shieldPlan(L)` in `15_levels.js` is seeded.
  - Level 12 is the heavy Aegis intro, and level 17 is the first light level.
  - From 21 on, about 40% of normal levels (and 25% of No Bounty/Air Raid levels after 40) are heavy; the rest are light.
  - That comes to 66 of the 69 levels from 12 on having shields, 22 of them heavy.
  - A heavy roll is Aegis (in wave 3 and every other wave after, up to `1 + L/15` per group) plus maybe a type, or 1–3 big types.
- **Card:** shielded enemies show a blue SHIELD badge and ring, and the Aegis shows its dome. Tapping one explains it.

## Music (v14)
- **Intensity follows the wave.** The game computes `musicIntensity()` (0–1) every 0.25s and the sequencer eases toward it: quick to rise, slow to fall. Three things push it up:
  - later (bigger) waves in the level;
  - enemies on screen plus the rest of the wave still coming;
  - the final wave, plus a little extra on later levels.
- **Layers by intensity:**
  - Always: bass and pad.
  - 0.15: kick.
  - 0.3: offbeat hats and the sidechain "pump" on the pads/bass.
  - 0.45: snare.
  - 0.55: arp.
  - 0.6: 16th hats.
  - 0.65: 16th octave bass.
  - 0.75: extra kick.
  - 0.8: 16th arp.
  - 0.85: snare rolls.
  - 0.92: lead hook.
- **Filter and tempo:** the filter opens and the tempo climbs from 100 to about 118 BPM as intensity rises.
- **Boss theme (strongest):** while a Warden is alive the song switches to darker chords (Am–Bb–G–E) at 132 BPM, with square + sub bass, all layers, ghost snares, rolls and a lead melody. It's set with `Sound.setBoss(bossAlive())`.
- **Kills play the melody:** each kill's note is quantized to the next 16th and uses a tone of the chord playing right then, and a combo climbs the arpeggio.
  - At most 2 notes land per 16th; extras spill into a short run.
  - A dotted-8th echo makes them ring like a lead.
  - The hit's click stays instant.
- **Sound effects play along (v17):**
  - Every pitched effect uses notes of the chord playing at that moment (`grid(div)` returns the chord and the time of the next 32nd/16th/8th/beat).
  - Timing:
    - Tower shots (Bolt, Arc, Nova launch, Rail, FLAK, EMP, Frost) and explosions land on 16ths.
    - Hits, crits, blinks, shield breaks and FLAK impacts land on 32nds.
    - Mint gold pulses play a chord arpeggio on the next 8th, and coins chime chord tones on 16ths.
    - Wave start, boss alarm and wave clear land on the beat.
    - Build, upgrade and sell arpeggiate the chord on 32nds.
    - Menu taps stay instant but use chord notes.
  - Only one sound per instrument per grid slot (`slot()`), so many towers make a groove, not a wall of noise.
  - Bolts cycle through the chord tones, so they play a little arpeggio.
  - The Prism hum is in key too (it plays the chord root).
  - `sfxtest.js` measured 100% of effect notes in the current chord, with about 90% starting on the grid (the rest are small built-in ornaments).
- **Tests:** `musictest.js` checks that intensity rises per wave, the boss switch works, and kill notes are chord tones.

## Tower balance pass (v11)
- **Audit:** `tools/audit.js` finds the bot's flawless threshold for loadouts that differ in one slot. Bolt alone beat every mix, so Bolt spam was the best strategy.
- **Changes:**
  - Bolt was nerfed: 6/10/16 damage at 2.8/3.2/3.8 shots/s.
  - Frost got 4/8/14 damage and +0.1 range.
  - Arc got 14/24/38 damage and +0.1 range.
  - Prism got 16/27/44 dps and +0.1 range.
  - Rail fires faster: 0.46/0.5/0.55 per second.
  - Beacon costs 90 and gives +30/50/75%.
- **After the pass,** in a 4-slot loadout every tower is within about 10% of the others (Nova 0.95, Rail 0.93, Prism 0.88, Mint 0.87, Beacon 0.86). Mixed loadouts now beat Bolt-only.
- **Niches:** Mint (No Bounty), FLAK (Air Raid) and EMP/Prism (shields) each have levels that need them.

## Other tower reworks (2026-09-28)
- **MINT:** pulses gold (ring flash, "+N", coins flying to the counter), only while waves run. Level 1: 7 gold every 3s. Level 2: 11 every 2.5s. Level 3: 15 every 2s.
- **RAIL:** fires down one fixed line (it picks the best direction when built, and a TURN option rotates it 90°). Damage: 64 / 116 / 196.
- **FLAK (level 32):** anti-air homing missiles, the only tower that hits flyers. Damage 16 / 28 / 46, range 3.2 / 3.5 / 3.8.

## Enemies added
- **Glider (level 32):** a winged flyer that flies in a straight line from a portal to the core. Only FLAK can hit it.
- **Aegis (reworked in v11):** a dome carrier instead of a shielded enemy.

## Level conditions (a required tower)
- **NO BOUNTY:** kills, combo milestones, wave clears and early calls give no gold, so Mint is the only income.
  - Starting gold is ×1.15, and wave 2 never contains Aegis.
  - Levels: 14, 23, 29, 36, 43, 48, 55, 62, 67, 74, 79.
- **AIR RAID:** a little over a quarter of each wave's budget is Gliders, and FLAK is required.
  - Levels: 32, 34, 38, 41, 44, 46, 50, 53, 57, 60, 64, 66, 69, 72, 75, 78, 80.
- **HEAVY SHIELDS:** 22 levels (an Aegis, or ≥30% shielded). Bring EMP or PRISM. Light shield levels are not a condition.
- **How the game shows them:**
  - The level card shows a condition strip, a NEED badge on the required tower(s), and a "BRING X" or "X ✓" check.
  - Pressing PLAY without the required tower opens an "are you sure?" prompt with **ADD X** or **PLAY WITHOUT IT**.
  - The level map shows condition badges, the HUD shows all active condition tags, the wave 1 banner reminds the player, and losing gives a matching tip.
- **Bot check (v12):**
  - Without the required tower, the bot loses all 11 No Bounty levels and all 17 Air Raid levels.
  - Without EMP, it loses 21 of the 22 heavy shield levels (only level 15 is beatable).
  - On light levels the bot never brings EMP and still wins them all.
  - Overall, the smart bot wins all 80 levels and casual bots win 312 of 320 tries.

## Unlock schedule
| Level | Unlock |
|---|---|
| 1 | Bolt tower, Block enemy |
| 2 | Dart (fast) |
| 3 | Frost tower |
| 4 | Spore (splits into 3 Mites) |
| 6 | Nova tower |
| 7 | Bulwark (armored) |
| 9 | Arc tower |
| every 10th level | Warden boss level (1 Warden up to level 30, 2 on levels 40–70, 3 on level 80) |
| 12 | Aegis (dome over nearby enemies) + EMP tower |
| 13 | Mint tower |
| 14 | First No Bounty level |
| 15 | First two-portal map |
| 16 | Blink (teleports forward) |
| 17 | Prism tower (beam heats up, ignores armor and shields) + first random shielded enemy type |
| 20 | 4th loadout slot |
| 21 | Mender (heals nearby enemies) |
| 22 | Rail tower (fixed firing line) |
| 25 | Titan (huge and armored) |
| 27 | Beacon tower (boosts damage of neighboring towers) |
| 32 | FLAK tower + Glider flyer (first Air Raid level) |
| 37 | Volt (electric) |
| 45 | Yeti (ice) |
| 47 | PYRO tower |
| 52 | TIDE tower + Scorch (fire) |

**Worlds:** 1–10 Void, 11–20 Abyss, 21–30 Ember, 31–40 Candy, 41–50 Aurora, 51–60 Solar, 61–70 Glacier, 71–80 Toxic.

## Fire rework, strategy pause, 10 labs (v26, 2026-09-29, artifact v28)
- **Fire (user's request):**
  - Fire enemies now **throw fireballs one at a time**, every 3.5s each, at the nearest tower in range that isn't burning, isn't FROST and isn't already targeted. Range is 1.5× the old aura (`FIRE = { r: 1.95, every: 3.5, burn: 30, refund: 0.25 }`). The tower catches fire when the fireball lands (flight 0.55s + distance/240).
  - **FROST never catches fire.** Each FROST pulse **puts out burning towers exactly 1 square away** (the 8 neighbours). A FROST also pulses with no enemy in range when a neighbour is burning.
  - **TIDE can still catch fire.** Its jets go for burning towers first (lowest health first), then burning enemies, then the rest, and it fires even with no enemy target. It can't put itself out.
  - Those are the **only two ways** to put a fire out. A doused tower keeps the health it lost (scorched health bar); "FIRE OUT" text and steam show it.
  - This replaces v23's "nothing puts a burning tower out".
- **Strategy pause (user):** pausing no longer blocks the board. While paused the player can build, upgrade, sell and open menus. The board shows a veil, border and PAUSED tag, and the bar has a RESUME pill ("build while paused"). The pause button becomes a menu icon that opens the full pause menu (its X returns to the paused board). P/Esc toggles. Tower spawn animations and effects keep animating while paused.
- **EMP (user):** a laser hit on an already-shorted electrified enemy resets its short timer, so it stays shorted as long as an EMP keeps hitting it. EMP now targets shorted enemies at a lower priority (`empWants`: shield/dome/live electricity 2, shorted 1).
- **Lab economy changes from the user's playtest:**
  - User's results: Lab 1 ended with 1315 gold (16 towers, mostly level 2+, "too easy"). Lab 2 was "perfection" (7 tries to find a combination that worked, 250 gold left, which is the target). Lab 3 had 904 left, Lab 4 627 (slightly too easy). Lean economy felt good; the waves made him change plans; the boss fight was nice.
  - Lab 1 (LEAN 66): kills pay 45% (was 60%), clean wave bonus 12 + 3×wave. Bots earn about 3,590 in a win (was about 4,760); 4/12 wins (was 7/12).
  - Lab 2 (COUNTERS): unchanged.
  - Lab 3 (PAYDAY): wage 50 + 9×wave clean, 32 + 6×wave leaky (was 70 + 12w / 45 + 8w). 3/12 wins (was 5/12).
  - Lab 4 (WARDEN TRIAL): kills pay 50% (clean 14 + 4w), cal still 0.31. 6/12 wins (was 8/12). Cutting bounty and raising cal together dropped bots to 3/12, so only the bounty changed.
  - The lean condition line now shows each lab's bounty % (`{0}` in the string, filled by `condLine(k, lv)`).
- **Six new labs (user: "give me 6 more labs"),** all authored waves with lean economy unless noted:

  | # | Lab | Map | Economy | Gold | Cal | Waves | Idea | Bot wins |
  |---|---|---|---|---|---|---|---|---|
  | 105 | WILDFIRE | 44 | lean 60% | 360 | 0.425 | 13 | one lane of burning enemies, Scorches and Yetis: FROST/TIDE placement vs damage | 7/12 |
  | 106 | SKYFALL | 57 | payday | 470 | 0.30 | 13 | Gliders from wave 2 on, two lanes, paid by the wave: how much FLAK? | 7/12 |
  | 107 | SHORT CIRCUIT | 71 | lean 60% | 360 | 0.50 | 12 | Volts and electrified enemies: EMP keeps them shorted, ARC loves the charge | 6/12 |
  | 108 | BOSS RUSH | 75 | lean 60% | 450 | 0.27 | 12 | Wardens at waves 4 and 8, two at 12, boss phases | 5/12 |
  | 109 | SPLIT PUSH | 47 | lean 60% | 380 | 0.36 | 13 | pressure swaps lanes every wave, both at once at the end | 5/12 |
  | 110 | THE GAUNTLET | 80 | lean 60% | 560 | 0.20 | 16 | every threat (flyers, shields, fire, ice, electricity), Warden at the end; wave 5 softened | 2/12 (hardest on purpose) |

  - Utility-heavy labs (SKYFALL, BOSS RUSH, GAUNTLET) forced FLAK/EMP early and starved the bots, so they got more starting gold. Cals sit slightly above the bot edge because the user beats bots on shield and boss labs.
  - Target for all labs: about Lab 2's feel, finishing with roughly 250 gold left.
- **Lab screen:** a 2-column grid of compact cards (name, economy %, wave count, last result). Long names shrink to fit; card headers shrink clear of the X. Names and test text in English, Chinese and Spanish (SKYFALL = CAÍDA DEL CIELO).
- **Noise note:** bot results shift with the random stream (the fireball timer's `rand()` moves every later random number), so ±2 wins out of 12 between builds can be noise, not balance.
- **Tools:** `tools/labtool.js stats|edge <ids>` (env `PAGES`, `CALS`, `PRE`, `LO`/`HI`, `ITS`, `DIST`, `KEEP`, `NEED`, `TAG`); `tools/trace.js` (per-wave trace of one strategy). `__TD` also exports `spawnEnemy`, `FIRE`, `ELEC`, `igniteTower`. Tests: `v26test.js` (fireballs, FROST immunity, FROST douse, TIDE douse, EMP short refresh, new labs), `v26pause.js` (build and upgrade while paused, menu, resume).
- **Not done yet:** the campaign hasn't been recalibrated for the new fire rules (fire levels are easier to handle with FROST/TIDE counterplay but fire reaches further). Lab records keep old results from before the economy changes. GitHub is still behind (see v23).

## Playtest Lab (v25, 2026-09-29, artifact v27)
- **User's goal:** players should have to play tactically and watch their gold. The user plays test levels and reports what works; the winning system then goes to all 80 levels.
- **Where:** a PLAYTEST LAB pill on the title screen opens a list of 4 test levels (ids 101–104, `LAB` / `levelOf(n)` / `isLab(n)` in `15_levels.js`). Every tower is open there with 4 slots and a separate lab loadout (`Save.d.labLoadout`). Results are stored in `Save.d.lab` (best stars, wins/plays, last run's lives and gold) and never touch campaign progress. The results screen shows "GOLD EARNED · SPENT · LEFT".
- **Shared by all lab levels:** a **next-wave preview** strip above the control bar between waves (enemy icons, counts, portal 1/2/1+2, shield/electric/ice/fire rings). Wave-clear toasts move up above it.
- **The four tests:**
  1. **LEAN 66:** level 66's exact map, waves and HP, with the **lean economy**: kills pay 60% (campaign 90%), and a wave cleared with **no leaks** pays 14 + 4×wave; a leaky wave pays nothing. Bots earn about 2,980 gold in the level vs 5,860 on the real level 66. Expert bots win 7/12 (vs 11/12 on level 66).
  2. **COUNTERS** (level 65's two-lane map): 14 hand-made waves, each a different threat (swarm, armor, healers behind armor, fire, iced Bulwarks, Titans, electrified Blinks, split push across lanes, a mixed finale). No required tower, so the 4-tower loadout is the puzzle. Lean economy. Cal 0.32.
  3. **PAYDAY** (level 61's map, heavy shields): kills pay nothing; each wave pays a wage of 70 + 12×wave, or 45 + 8×wave if anything leaked. No combo gold. Cal 0.34.
  4. **WARDEN TRIAL** (level 70's map): one Warden at wave 8, two at wave 15. **Boss phases (lab only):** at 60% health it raises a shield worth 25% of max HP (EMP strips it for good) and calls 4 Bulwarks; at 30% it's enraged (×1.6 speed, summons almost twice as often). Lean economy. Cal 0.31.
- **Authored waves:** `[type, count, gap, lane, mods]`, where mods `{ shield, elec, ice, fire }` apply per group (`spawnEnemy(..., mods)`). Campaign levels still use per-type lists.
- **Calibration:** the authored levels' `cal` is 0.95 × the HP where 4 of 12 expert strategies win keeping ≥5 lives (`NEED=4 KEEP=5 expert.js edge`). The bot understands lab ids (`LV.ref` for unlocks and slots, `LV.cal`, lab loadout). New tool: `tools/labstats.js 66,101,...` (win rate, gold earned, spent and left, time).
  - Bot results: COUNTERS 7/12 expert wins, PAYDAY 5/12, WARDEN 8/12. Authored levels take about 6–6.5 minutes vs about 10 for level 66.
- **Next:** the user plays and reports. Then apply the chosen economy, preview and wave style to all levels and recalibrate.
- Tests: `labtest.js` (title button, lab screen, cards, preview, clean/leaky bonus, Warden phases, lab results).

## Less gold, bigger late waves (v24, 2026-09-29, artifact v26)
- **User feedback:** on level 66 by wave 17 they had 14 towers and 2200 gold and were "demolishing everything". They asked for 10% less gold and more enemies as the waves go on.
- **Gold:** `ECON.goldRate = 0.9` on every income (kills, combo milestones, wave clears, early calls, Mint). `earn(v)` carries the fractions, so gold stays whole and the rate is exact over time. Starting gold, sell and burn refunds are unchanged.
- **Found a cause of thin waves:** each wave split its budget evenly across its types, and capped special types (Aegis, Volt, Yeti, Scorch) just dropped their unused share. Waves like "4 Volts + 5 Aegis" were nearly empty. From level 20 the leftover budget now goes to the uncapped groups, or to an extra group of basic enemies (Block / Dart / Spore / Blink) when more than 25% is left.
- **Late ramp:** from level 20 (full strength by 50), the wave budget gets `+LATE_RAMP (1.6) × t²` (t = how far through the level), group caps grow up to +60% on the last wave, and spawn gaps tighten up to 26%.
- **Effect:** enemies in the last quarter of each level +55% on average across levels 20–80 (level 66: +63%, final wave 47 → 83). The first quarter is almost unchanged. Late levels run a bit longer (level 66 about 10–11 min, level 80 about 15 min at 1x).
- **Difficulty (levels 20–80, same bots):** good-plan wins 72% → 56%, flawless 35% → 21%, casual 60% → 48%. No compensating HP cut: the user wanted it harder.
- **Floor:** `loosen.js` (now takes `MINW` and `BEST` env) lowered HP only where fewer than 3 of 12 strategies won or the best kept < 7 lives: 27, 29, 41, 43, 44, 46, 48, 50, 76, 80. Required-tower checks still hold (only 12 and 15 can be won without EMP, as before).
- The bots found level 66 easy before and after (11/12). If it's still too easy for the user, raise its LEVEL_CAL directly.

## Fire, water, weather, 4th upgrade, longer levels, Spanish (v23, 2026-09-29)
- **PYRO** (fire tower, unlocks at 47, cost 95): short-range flame splash (dmg 9 / 15 / 24 / 36). It does **×3 damage to cold enemies** (Yetis and iced variants); armor still applies, so about ×2.8 on a Yeti.
- **Scorch** (fire enemy, intro level 52; orange 4-point star, 55 HP, speed 1.05) and a **burning variant** of one minor type on about a third of levels from 54.
  - Any tower within 1.3 tiles of a live fire enemy catches fire. A burning tower keeps working, loses health over 30s, then is destroyed and refunds **25%** of what was spent on it.
  - v23: nothing put a burning tower out. **v26 changed this:** fireballs, FROST immunity and FROST/TIDE douse (see v26). **Selling a burning tower also pays only 25%**; otherwise selling would dodge the penalty.
  - Constants live in `FIRE` (v23: `{ r:1.3, burn:30, refund:0.25 }`; v26 adds fireballs, see below).
- **TIDE** (water tower, unlocks at 52, cost 80): 2–3 water jets that go for burning enemies first and put their flame out **for good** (`e.doused`). Low damage (3 / 5 / 8 / 12).
- **Weather conditions:**
  - **HEATWAVE** (levels 24, 28, 35, 42, 56, 65, 71, 77): FROST can't be used.
  - **RAINSTORM** (levels 49, 51, 54, 58, 61, 63, 68, 73, 76): PYRO can't be used. Every ARC is struck by lightning when built and starts one level up; thunder rolls in the background.
  - Banned towers are dropped from the loadout at level start, drawn with a circle-slash on the card and refused on tap. Map badges, HUD tags, wave-1 banner, weather overlay (heat haze / rain streaks).
- **4th upgrade level** for every tower (LV4 has a crown ring with three shards).
- **Longer levels (user):** `waveCount(L)` = 5 at level 1 up to 20 by level 80; boss levels +5 (max 25). Per-wave growth is scaled by `sqrt(7 / (waves − 1))`, so longer levels ramp more gently per wave but further overall. Late levels now run roughly 6–13 minutes at 1x.
- **EMP:** the user's "EMP removes the electrified buff" meant the enemy's electricity; v22 already does that (a laser hit shorts the enemy's electricity for 4s). No change.
- **Spanish:** full string table (`es`) and names (towers RAYO, HIELO, NOVA, ARCO, EMP, CECA, PRISMA, RIEL, FARO, FLAK, PIRO, MAREA). The first-launch picker has three buttons; the title pill and a new **Language** button in the pause menu open a language overlay.
- **Level card:** the loadout grid is now 6 × 2; condition lines shrink to fit; enemy badges for shield / electric / ice / fire.
- **Bot changes (`tools/calibrate.js`):** respects weather bans; brings TIDE on fire levels only when that still leaves two damage-tower slots, builds one per fire lane early on the lane, upgrades EMP and TIDE last, never upgrades a burning tower; game-time limit 2400s. `tools/expert.js`: core 6 is now PYRO/BOLT/ARC/NOVA, and the seed-2 strategies play without TIDE.
- **Calibration:**
  1. `expert.js edge` on v22 (`tools/v22_index.html`) and v23 with the same new bot; LEVEL_CAL × (v23 edge ÷ v22 edge), clamped 0.6–1.5 (Rainstorm levels only half the change, so skipping ARC isn't punished).
  2. New `tools/match.js` nudged levels 20–80 until wins (12 expert + 4 casual) are within −2/+3 of v22's.
  3. Fixes: 19 = 0.41 and 68 = 0.33 (must be lost without EMP), 55 = 0.11 (must be lost without Mint), 41 = 0.44 (loosened).
  - New tools: `noreq_edge.js <tower> <levels>` (where every strategy without the required tower loses), `evalat.js 55:0.11,...`, `evalsum.js`, `setcal.js`, `firediag.js`.
  - Result (levels 20–80, v22 → v23, same bot): good-plan wins 72% → 72%, flawless 24% → 35%, casual 66% → 60% (levels 60–80: 70% → 50%; longer levels punish sloppy play more). Every level is won by ≥4 of 12 strategies with best ≥8 lives; without the required tower every condition level is lost (except 12 and 15, as before).
- **Tests:** new `mechtest2.js` (PYRO ratio, burn-down and refund, burning sell value, TIDE douse, rain ARC, heat loadout, LV4, wave counts, Spanish + screenshots); `langtest.js` updated for the 3-language picker. All 15 suites pass.
- **Reset progress (user's request, artifact v25):** a RESET PROGRESS pill on the title screen (shown once there is progress or test mode is on). Tap it, then tap again within 4s to confirm. `Save.reset()` clears levels, stars, known towers and loadout; language, thumb and sound settings stay. Pill subtitles now shrink to fit (the Spanish test-mode line overflowed). Test: `resettest.js`.
- **Published:** artifact version 24 (25 with the reset button). **GitHub is still behind** (repo has v22 source without the Warden change; the live Pages site serves v20). The Mac was unreachable, so the v23 push waits for it.

## EMP lasers, Volt, Yeti, tougher Warden (v22, 2026-09-29)
- **EMP rework (user's request):** EMP fires **up to 4 lasers** per shot (rate 1.1 / 1.4 / 1.8, range 2.4 / 2.7 / 3.0) that do almost no damage (1 / 1.5 / 2).
  - Lasers go for enemies with a shield, a live Aegis dome or live electricity first, then whoever is closest to the core.
  - An Aegis counts as in range as soon as its dome edge is.
  - A hit strips a shield for good, pops a dome for good, or shorts out an electrified enemy for 4s.
  - No target-mode option (`beams` towers get only Sell and Upgrade). The old field (`empField`) is gone.
- **Electric:**
  - **Volt** enemy (intro level 37; yellow 3-point star, 48 HP, speed 1.0).
  - Electric variant: one minor enemy type is electrified on about a third of levels from 39 (not Titan, Aegis or boss).
  - Every tower within 1.3 tiles of a live electrified enemy shuts down until 4s after the last contact (the timer restarts on each contact).
  - ARC is supercharged instead: ×1.6 fire rate, +3 chains, 2.2-tile jumps.
  - Constants live in `ELEC`. Shorted towers fade, crackle and show a yellow bolt with a red slash plus a countdown ring.
- **Ice:**
  - **Yeti** enemy (intro level 45; sky-blue 6-point star, 130 HP, armor 2, leak 2).
  - Iced variant from level 47.
  - Once a second it throws a snowball at every tower within 2 tiles. A hit tower fires at 40% speed for 5s (Mint pays slower, Prism dps ×0.4).
  - FROST is supercharged instead: each blast adds a frost mark; 3 marks freeze the enemy for 0.5s; the marks reset when it thaws.
  - Constants live in `ICE`. Frozen enemies don't move, blink, heal or throw.
- **Level content:**
  - Volt and Yeti come in small numbers: per-group caps `1 + L/20` and `1 + L/30`, at half pool weight.
  - Variant picks use a well-mixed seed; the first try (`L*7727`) gave runs of neighbouring levels.
  - Card: ELECTRIC / ICED badges, which become icons when the enemy row is crowded, plus info lines, notes, tips and Chinese text.
- **Warden (user):** +40% health (520 → 728).
  - It summons 2 enemies (3 from level 50) right behind it every `max(2.5, 4 − L/40)` s while it walks, alternating grunt and scout.
  - Sound `summon`. `shareHp: 520` keeps each level's shield and variant picks unchanged.
  - Boss-level `LEVEL_CAL` was left as is so the Warden really is tougher. The expert bots still win 7 to 12 of 12 on every boss level; casual bots win less.
- **Heavy shields made to matter again** (the laser EMP lost its old area damage):
  - `SHIELD_PCT` heavy 0.6 → **0.9**.
  - Aegis dome hp 100 → **170**.
  - Bot: builds shield busters until every shielded lane is covered (one EMP at a merge covers both), and upgrades EMP last.
  - `tools/noshield_edge.js` finds where every no-EMP/no-PRISM strategy loses. Heavy levels from 19 up sit at least 10% above that line.
  - Levels 12 and 15 can still be won without EMP (already true before).
- **Calibration:**
  - Changed levels were rescaled by new edge ÷ v21 edge, measured with the same bot; the Volt and Yeti intros got ×0.85.
  - Then `tools/loosen.js` raised the tightest levels until at least 4 of 12 strategies win.
  - Result (levels 20–80): good-plan win rate 70% → 71%, flawless 20% → 24%, casual 61% → 66% — about the same difficulty as v21.
- **Tests:** new `mechtest.js` covers EMP targeting, shorting and its timing, ARC and FROST supercharge, and the freeze cycle; `shieldtest.js` was updated. All suites pass.
- **GitHub:**
  - v22 **source before the Warden change** is committed (commit "Shatterline v22: laser EMP, Volt and Yeti enemies (source)").
  - Still to push: the Warden source edits (10_config, 12_i18n, 15_levels, 20_audio, 40_game, 60_ui), `index.html`, `dist/index.html`, `dist/shatterline.html`, tools and tests.
  - The complete verified file set is saved in the browser pane's localStorage on github.com (`__sl22`). Push per folder with the upload page: set `#upload-manifest-files-input`.files, then Commit.
  - The Mac went to sleep mid-push. **The live Pages site still serves v20** until `index.html` is pushed.

## Harder later levels (v21, 2026-09-29)
- **User feedback:** later levels were too easy. Their answers: it starts around level 20, they want it **noticeably** harder, and the reasons are that enemies die too fast and there aren't enough enemies.
- **More enemies:** from level 20, each wave's budget is multiplied by `crowd` in `makeWaves`. It is 1.0 at level 20, 1.35 at 40 and 1.6 at 80.
  - The per-group cap goes from 30 to 36.
  - Spawn gaps are divided by `crowd^0.7`, so waves get denser rather than much longer.
  - Enemy counts go up by +20% at level 30 through +57% at level 80. Levels 1–19 are unchanged.
  - Peak enemies on screen for the bot go from about 20–28 to 28–35.
- **Tougher enemies:** the old calibration target (the flawless line of a single bot) turned out to be a weak stand-in for a human, who found 0.9× of it easy.
  - New tool `tools/expert.js`: 12 bot strategies (6 loadouts via the new `opts.core` bot option × 2 placement seeds) stand in for a player who plans and retries.
  - `expert.js edge` finds the HP where at least 2 of the 12 strategies still win keeping ≥7 lives.
  - LEVEL_CAL for levels 25–80 = 0.95 × that edge, and 0.8× on intro levels (21, 22, 25, 27, 32). Levels 20–24 blend in from the old values.
  - The per-level increase is capped at ×2 (×1.6 on intro levels).
  - `tools/loosen.js` then lowered the tightest levels until ≥4 of the 12 strategies win: 25, 52, 61, 65, 67 and 70.
  - Median total level HP is about 1.7× v20.
- **Result (levels 20–80, v20 → v21):**
  - Good-plan strategies win 96% → 66% of runs, and flawless runs drop from 69% to 19%.
  - When they win, they lose about 1 life → about 3.4 lives on average.
  - Casual bots win 97% → 60% (levels 40–59: 48%).
  - Every level is still won by at least 4 of the 12 strategies, and without the required tower they still lose.
  - Level 12 and level 15 (EMP) are unchanged pre-20 exceptions.
- **Tests:** smoke, smoke2, smoke4, shieldtest, featuretest, menutest2 and musictest all pass. Heavy/light shield counts are unchanged (22/44).
- **Where it's published:**
  - The artifact is v21.
  - **GitHub Pages is still on v20** until `index.html`, `dist/index.html`, `dist/shatterline.html` and `src/15_levels.js` are pushed. The v20→v21 diff is 6 small text replacements, easy to apply in the GitHub web editor.
  - The user's computer was asleep, so the push waits for it.
- Playwright is pinned at 1.56.0 in package.json, to match the preinstalled browser.

## How levels are made
- **Maps:** a seeded generator (`tools/gen_maps.js out.json first last`) makes serpentine paths where lanes never touch. Every map is validated and stored in `LEVEL_MAPS`.
- **Waves:** generated per level. Enemy counts grow until level 40, and after that toughness rises instead. Air Raid levels move 28% of the budget into Gliders. The shield plan decides whether Aegis is in the pool.
- **Difficulty:** bot playtests (`tools/calibrate.js`) found the HP multiplier at which a strong bot just barely clears each level flawlessly. `LEVEL_CAL` is that threshold times a margin: 0.75 → 0.92 across levels 1–40, then 0.92 → 0.97 across 41–80.
- **Recalibration (v12):** levels 12–80 were scaled by (v12 threshold ÷ v11 threshold) against `tools/v11_index.html`. Hand-tuned: 29 = 0.29, 36 = 0.15, 39 = 0.36, 54 = 0.42, 68 = 0.28, and the No Bounty levels re-checked for Mint.
- **Recalibration (v11):** every level's HP was scaled by (v11 threshold ÷ v10 threshold), clamped to 0.4–1.8. v10's build is kept as `tools/v10_index.html`.
  - Thresholds are "2 of 3 varied bot runs flawless" (`ROBUST=1`).
  - After that, these levels were hand-tuned: 25 = 0.48, 37 = 0.35, 41 = 0.43, 42 = 0.36, 45 = 0.35, 55 = 0.23 (Mint required), 65 = 0.35, 67 = 0.21 (Mint required), 68 = 0.31, 80 = 0.25.
- **Bot behaviour:**
  - It brings required towers in its last slots.
  - It builds Mints after its first tower and FLAK after two ground towers.
  - On heavy shield levels only, it gets an EMP up within two waves of the first shielded wave, placed on each shielded lane.
  - Rail goes where its line crosses the most path, and Beacon goes next to the most upgraded towers.
- **Tools:**
  - `tools/probe.js '[[level, cal], ...]'` tests smart, casual and "without each required tower" bots at a given multiplier.
  - `tools/audit.js 30,42 'bolt,arc,frost,X' nova,prism,rail,beacon,none` compares towers in one loadout slot.
  - `calibrate.js` env options: `PAGES`, `DIST`, `TAG`, `ROBUST`, `SEARCH_AROUND`, `OLD_SHIELD`, `SHIELD_TOOL=prism`.

## Hosting and backups (v20)
- **LIVE: https://dd1000.github.io/shatterline/** (GitHub Pages, `main` / root; still v20 until the v21 push, see above). Anyone with the link can play, no sign-up. Checked on 2026-09-28: it loads to the title screen with no console errors.
- **Source repo: `github.com/DD1000/shatterline` — PUBLIC.** It was pushed from the user's Mac with `gh` and git on 2026-09-28 (commit "Shatterline v20") as private. The same day the user decided to go public: Claude switched visibility in the GitHub settings (the user confirmed GitHub's email sudo check), turned on Pages and committed a README with the play link. The local copy is `~/Downloads/shatterline`; run `git pull` there before the next push.
- The repo has the v20 game (`index.html`, `src/`, `dist/`, `tools/`, `tests/`) but not yet the minify step (`tools/minify.js`, `package.json`, `.gitignore`, `dist/itch/`) from `shatterline-repo-update.zip`. Only needed for an itch.io upload later. The zip was rebuilt with a public README (play link and the minify step), so it can be unzipped over the local copy after a `git pull`.
- The itch.io and private notes below are kept for reference.
- Earlier plan: the user wanted the code private and the game playable only by people they choose. Free GitHub Pages can't do that (private repos need Pro, and the site would still be public), so the plan is an **itch.io Restricted page with a password**, uploaded with `butler push ~/Downloads/shatterline/dist DD?/shatterline:html5`.
- **Player build (v20):** `node tools/minify.js`, run by `build.sh`, writes `dist/itch/index.html`.
  - It wraps the game in an IIFE, runs Terser with top-level mangling, and drops `window.__TD`. That takes it from 221 KB to 137 KB on one line, with no readable names.
  - Checked by replaying the same taps on both builds: same behavior, no errors.
  - Sent as `shatterline-itch.zip` (just `index.html`) for itch.io, plus `shatterline-repo-update.zip`, which the user unzips over `~/Downloads/shatterline` (`unzip -o`) and pushes.
  - The repo now has `package.json` (terser + playwright) and `.gitignore` (`.DS_Store`, `node_modules`).
- A claude.ai artifact link needs every player to have a Claude account.
- `shatterline-github.zip` (sent 2026-09-28) holds the repo:
  - `index.html` (the playable file GitHub Pages serves) and `README.md`;
  - `src/`, `build.sh` and `dist/`;
  - `tools/` (bots, perf) and `tests/`.
- Upload steps: new public repo `shatterline` → "uploading an existing file" → drag in the folder contents → Settings → Pages → Deploy from branch `main` / root. The link is then `https://<user>.github.io/shatterline/`.
- `build.sh` now also copies the standalone build to `./index.html`. The standalone build has phone web-app meta tags, link-preview tags and an inline SVG icon.
- Recovery: until the repo exists, the complete game can be recovered from the published artifact (all `src/` files concatenated in order).
- Progress saves per site (localStorage), so claude.ai and GitHub Pages keep separate progress.

## Performance (v20)
- The user noticed frame drops as the screen filled up. Profiling showed the per-frame JavaScript was small; the cost was pixels and draw calls. Changes:
  - **Adaptive quality** (`tuneQuality`): learns the device's normal frame time in the first 2.5s of a level. If a wave keeps frames above max(24ms, 1.35× normal) for 1.2s, it halves particle effects, then lowers render resolution in 0.25 steps (minimum 1×). It tries one step sharper at each new level.
  - **Cached sprites** instead of per-frame vector/text work:
    - enemy bodies, drawn rotated (cards still use exact vectors);
    - floating damage text;
    - glowing titles, which used `shadowBlur` before.
  - **Fewer draw calls:** all enemy glows are drawn in one additive pass, and the open eye no longer uses save/restore.
  - **Fewer effects:** damage numbers add up per enemy (one number per ~0.15s), the particle budget dropped from 750 to 340 (170 when struggling), Dart trails emit less often, and particle cleanup no longer uses `splice`.
- Stress test (headless, phone-sized screen, about 90 enemies): the old build ran at about 20fps and the new one at about 29fps, mostly from adaptive quality.
  - The test machine has no GPU, so the sprite savings on real phones can't be measured here.
  - Tools: `tools/perfscale.js` (compares an empty board with a crowd), `perfab.js` (turns parts off one at a time), `perf.js` (CPU profile).

## Source layout (concatenated into one file by build.sh)
`10_config` (towers, enemies, worlds, economy, conditions) · `12_i18n` (languages) · `15_levels` (maps, wave generator, shield plan, calibration) · `20_audio` · `30_draw` (renderer, FX) · `40_game` (save + sim, shields/domes/EMP field, Mint pulses, Rail line, FLAK missiles) · `45_world` (world drawing incl. domes) · `50_juice_ui` · `60_ui` (HUD, radial menus, range, pause, results) · `65_screens` (title + language picker, level map, level card + conditions + confirm) · `70_main` (loop, input, `window.__TD` test hooks)

## Ideas for next steps
- Watch real players' loadout picks to confirm towers get used evenly (the bot audit is only a proxy)
- More condition types (e.g., one-lane-only towers, fog, "no upgrades")
- More languages (the i18n table makes this a translation-only job)
- Endless mode after level 80
- Boosters or one-time abilities used on the level card (Candy Crush style)
- Wrap the GitHub Pages build for the app stores
