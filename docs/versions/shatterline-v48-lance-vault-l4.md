# Shatterline v48: LANCE sniper, level 4 looks for every tower, VAULT MINTS and SKY SHIELDS labs

## User requests
- "the gold tower is just too overpowered. im not sure how we can change it up for the 'no economy' debuff on levels. any ideas? also we should add a long range sniper like tower. dont implement it yet, right now we are brainstorming"
  - I measured MINT first (a MINT built at the start, enemies killed halfway along the path):
    - On level 25 (10 waves), a level 1 MINT (80 gold) earned 512. A maxed one (530) earned 2,484, more than every kill and wave clear on the level combined (1,401).
    - On level 30 (25 waves), a level 1 MINT earned 1,196, about 15x its price.
  - The cause: it pays every second with no limit, so a longer level means more gold, and every extra MINT adds the same again.
  - I offered three MINT fixes. Each leaves NO BOUNTY levels as they are, since there MINT is the only income:
    - Vault (recommended)
    - toll booth
    - simpler numbers (half pay, NO BOUNTY pays double)
  - I offered three sniper versions:
    - Deadeye (recommended)
    - charge shot
    - spotter
  - I also offered to build the MINT change as a Playtest Lab level first, so it could be tried before the campaign changes.
- "yes. make it also attack flying types. does emp attack flying types as well? i want it to and they can also have shields the flying types"
  - EMP has reached flyers since v44.
  - Flyers could already wear shields in hand-made lab waves, but the campaign's shield picker skips them. v48 adds a lab built around shielded flyers.
- "use deadeye too. also make sure to change the visual. change all towers without level 4 visuals to have them. and give me a picture of all of them."
- "dont give level 4 towers any new abilities if we havent talked about them"
  - The new level 4 looks are visual only. DEADEYE is the only new ability, because it was discussed.

## What changed
- **LANCE (`TOWERS.lance`):** `cost:120, unlock:40, hitsAir:true, sniper:true`. It sits in `TOWER_ORDER` between FLAK and PYRO.
  - **Levels** (+10% damage per upgrade as usual, and no rate change, as in v31):

    | Level | Cost | Damage | Rate | Range | Extra |
    |---|---|---|---|---|---|
    | 1 | 120 | 60 | 0.4/s | 6.0 | |
    | 2 | +130 | 66 | 0.4/s | 6.5 | |
    | 3 | +200 | 72.6 | 0.4/s | 7.0 | |
    | 4 | +300 | 79.86 | 0.4/s | 7.5 | `execute:0.25, deadeye:true` |

  - **Targeting:** `findTarget` treats `hitsAir` towers like EMP, so they target both ground enemies and flyers. `placeTower` gives `sniper` towers the `'strong'` target mode (the toughest enemy first). The target button still cycles first / strong / close.
  - **The shot (`lanceFire`):** it lands at once:
    - a tracer from the barrel to the target, drawn 5 px higher for flyers
    - a muzzle flash, smoke puffs, sparks and a small shake
    - `damage(tg, dmg × beacon boost, { big: true })`, so armor, shields, domes and brittle all apply
  - **DEADEYE (`deadeyeShot`):** if the hit leaves a non-boss alive at or under 25% of its max health, a red reticle snaps shut on it, the hit is credited, and it is killed through `kill()`. It still drops gold and counts toward combos. Analytics count it as `executes`.
  - **Laser sight:** drawn each frame after the PRISM beams:
    - a line from the barrel to the target that brightens as the next shot charges (`1 - cd × rate`)
    - a reticle around the target that closes in until the shot lands
    - red at DEADEYE
  - **Sounds:**
    - `snipe(deadeye)`: a highpass crack, a falling triangle ping and a low sine thump, plus a chord-tone shimmer at DEADEYE
    - `deadeye()`: a glassy two-note chime
    - Both are on the music grid like the others.
  - **Glyph:**
    - a kite-shaped body that is long along the aim, a stock, a thin barrel with a muzzle brake, and a scope on one side
    - DEADEYE: a turning crosshair (ring, 4 red ticks, 4 dots), a red-glowing muzzle, and an almond eye whose red pupil looks down the barrel. Its plate edge is red.
  - **Upgrade:**
    - The L3→L4 tooltip reads "DEADEYE · 300", with `deadeye_line` filled in from the data (25%, range 7.5).
    - The upgrade burst is a red reticle closing on the tower, plus cross lines and the "DEADEYE" text.
- **Level 4 looks (`drawTowerGlyph`, `l4 = lv >= 3`):** every tower now has its own level 4 look. These are looks only, with no new stats or abilities.
  - The generic level 4 crown (dashed ring and 3 white shards) is gone.
  - The level 3 orbiting shards now show at level 3 only.
  - Every level 4 plate gets the bright edge.
  - The new looks:
    - **FROST:** a big crystal snowflake (6-point star with branches on every arm), 6 ice crystals standing out around it, glints between them, and drifting snow.
    - **EMP:** a tesla pentagon. 5 nodes turn around it with flickering arcs between them, and two coils turn opposite ways.
    - **MINT:** a gold treasury. 6 coins orbit and flip, and the center coin is stamped with a star and has a glint and popping sparkles.
    - **PRISM:** a compass star (a second 4-point star across the first). 3 rays carry the split light out to 3 colored shards (cyan, yellow, magenta) on a ring.
    - **RAIL:** longer rails with 3 coils, where a light runs toward the muzzle. Fins at the back, a charge glow at the muzzle, and the corners of a targeting frame squared to the line.
    - **BEACON:** a lighthouse. Two beams sweep around, two rings expand, and chase lights run on a ring.
    - **FLAK:** a quad battery (4 barrels) under a radar sweep with a fading trail. 4 blips flare as the sweep passes them.
    - **PYRO:** an inferno. A double flame flickers, a ring of 8 flame tongues licks outward, and embers rise off it.
    - **TIDE:** a maelstrom. 3 spiral currents and bubbles circle a bigger drop that has a highlight and two waves.
  - **Upgrade to level 4:** for these towers it plays a bigger burst (a ring, a white ring, a flash and shards, plus "LEVEL 4").
- **Text for flyers (EN, ZH, ES):** FLAK and LANCE can both bring flyers down now.
  - `CONDITIONS.air.need` is `['flak', 'lance']`, so a level is happy with either one. Before level 40 only FLAK is asked for, because `needOf` skips locked towers.
  - The Glider, Stormwing, FLAK, AIR RAID and glider-tip texts now say "FLAK and LANCE".
  - `confirm_air` now reads like the other confirms: "…play without {0}?".
- **VAULT MINTS (`MINT_VAULT = 2.5`, `vaultOn()`):** on a level whose economy has `vault: true` (and that isn't NO BOUNTY):
  - **The vault:** each MINT holds `tw.vault` = 2.5 × the gold spent on it. A build gives 200, and every upgrade adds 2.5 × its cost (L2 +225, L3 +350, L4 +550, so 1,325 for a maxed one). `tw.vaultMax` grows with it.
  - **Pulses:** `mintPulse` pays out of the vault at the usual speed and rate. The last pulse pays exactly what's left.
  - **Running dry:** when the vault is empty, `mintPulse` returns true. After the tower loop, `mintDry` removes the MINT and frees its tile, with no refund. It shows "VAULT EMPTY", a gold shatter, shards, a ring and the new `crack` sound.
  - **Selling:** `sellValue` × (vault ÷ vaultMax).
  - **Look:** a level of molten gold inside the MINT's hex (`mintVault`), which sloshes a little. The outline blinks red under 25%.
  - **Where it applies:** the new `ECON_VAULT = { key:'vault', bounty: ECON.goldRate, combo:true, clean/dirty: the campaign's wave-clear gold, vault:true }`. That is the campaign economy plus the vault. `CONDITIONS.vault` ("VAULT MINTS") has a hex-half-full icon and text in EN, ZH and ES.
  - **Labs:** the lab card and the lab report know the new economy ("VAULT MINTS (kills 90%)" in the report).
  - **The campaign MINT is unchanged for now.** Moving it to the campaign means giving every non-NO BOUNTY level `vault`.
- **New Playtest Labs:**
  - **13 VAULT MINTS** (`vault`): a clone of level 25 (10 waves, 240 gold, same toughness) with `ECON_VAULT`. Play it next to level 25.
  - **14 SKY SHIELDS** (`skyguard`): map 72, 16 hand-made waves, `ECON_VAULT`, 420 gold, cal 0.3.
    - Shielded Gliders arrive from wave 3. Shields are heavy, as on every hand-made lab: 90% of their health.
    - A Stormwing comes in wave 8, a shielded one in wave 15, and two shielded ones close it out.
- **Lab analytics:** each run also records `mintGold`, `dried` and `executes`. The report adds a line "MINT paid N gold · MINTs run dry N · DEADEYE finishes N" when any of them is above 0.
- **Fixes:**
  - **Level card note:** a long note (like a new tower's text) now gets a smaller font and starts higher, so up to 4 lines fit above the loadout. It used to run into the LOADOUT header.
  - **Loadout grid:** the NEW pill hides once a tower is picked, so it no longer covers the slot number. The grid is now 7 columns.
  - **Lab screen:** when the cards get short (14 labs), their four lines share the height evenly, and plays join the result line. "NOT PLAYED YET" used to overlap the names.
  - **Unlock popup text:** the EMP description (English) and the ARC description (Spanish) were 5 lines in the unlock popup, and the last line was cut. Both were shortened.
  - **Rule lines on the level card:** these shrink to fit their row. The new Spanish AIR RAID line and the VAULT MINTS lines were kept short enough to stay at 7.5 px or more.
- `BUILD = 'v48'`.

## Balance notes
- **LANCE:**
  - **Damage a second:** 24 / 26.4 / 29 / 31.9. That is about a BOLT's (23.1 at level 1), but for 120 gold, from up to 7.5 tiles away, and into the air.
  - **Against a Titan (armor 7):** 53 per hit (about 21 a second at level 1). A level 1 BOLT does about 10 a second against a Titan, since only 30% of its small hits gets through.
  - **Against shields:** a shielded enemy takes 20% into the shield (12 per hit), so LANCE pairs with EMP.
- **VAULT MINTS** (bot runs, enemies killed halfway):
  - A level 1 MINT pays its 200 and shatters about 97 s into level 25. In the campaign version it earned 406 in 200 s, and 512 over the whole level.
  - A maxed MINT pays 1,325 in total, instead of 2,484 on level 25 (and 5,778 on 25-wave level 30).
- Bots are poor judges of difficulty here: the two new labs need the user's own runs and the lab analytics report.

## Verified
- **`lancetest.js`:**
  - **Data:** unlock 40, and level 40 lists LANCE as its new tower.
  - **Flyers:** a parked Glider takes 120 in 3.1 s (2 shots); a BOLT next to one does 0.
  - **Targeting:** the default mode is 'strong', and it hit the 50,000-HP grunt before the 5,000-HP one.
  - **Damage per hit:** 60 on a grunt, 53 on a Titan.
  - **Range:** a grunt at 5.59 tiles is hit and one at 6.9 is not. At level 4, one at 7.21 is hit.
  - **DEADEYE:**
    - a 150/400 grunt shatters (executes = 1)
    - a full 400/400 grunt is left at 320
    - a Warden at 300/2000 is left at 226 and alive
    - level 3 never executes
  - **Sounds:** `snipe`, `deadeye` and `crack` play without errors.
  - **Text:** every tower's text fits 4 lines in tooltips (260 px) and in the unlock popup (218 px) in EN, ZH and ES, and so does DEADEYE's line.
  - **Unlock:** after level 39 the popup unlocks LANCE in all three languages.
  - **Screenshots:** the laser sight on a shielded Glider, the build and DEADEYE tooltips in each language, the level 40 card at 390×844 and 360×640.
- **`vaulttest.js`:**
  - **The labs:** 14 labs; lab 13 has level 25's exact waves, 240 gold and the vault economy; lab 14 is an air level.
  - **Vault payout:** a level 1 MINT starts with 200 in its vault, pays exactly 200, then shatters (at 97.1 s) and frees its tile (dried = 1).
  - **Upgrades:** a level 2 vault is 425.
  - **Selling:** a level 1 MINT sells for 56. A half-empty level 2 sells for 59 instead of 118. With `noBounty` the vault is off and it sells for 118.
  - **Campaign:** on level 25 a MINT paid 406 in 200 s, was still there, and sold for 56.
  - **Report:** it shows "VAULT MINTS (kills 90%)" and "MINT paid 200 gold · MINTs run dry 1".
  - **SKY SHIELDS:**
    - an EMP stripped a 900-point Glider shield within 1.5 s
    - LANCE put 12 into the shield and none into health
    - FLAK chipped the shield and left health untouched
    - wave 3 sent 5 shielded Gliders
  - **Rule lines:** every condition's line fits its row on the level card in EN, ZH and ES (7.5 px or more).
  - **Screenshots:** the gauge at 100/60/30/12%, a MINT running dry, the lab screen at both sizes, both lab cards in each language, SKY SHIELDS in play.
- **`looktest.js`:** every tower's level 4 has far more bright pixels outside the plate than its level 3. Level 3 → level 4:

  | Tower | L3 | L4 |
  |---|---|---|
  | BOLT | 58 | 295 |
  | FROST | 63 | 342 |
  | NOVA | 50 | 195 |
  | ARC | 59 | 472 |
  | EMP | 53 | 245 |
  | MINT | 56 | 276 |
  | PRISM | 63 | 249 |
  | RAIL | 59 | 257 |
  | BEACON | 86 | 264 |
  | FLAK | 53 | 263 |
  | LANCE | 72 | 298 |
  | PYRO | 43 | 204 |
  | TIDE | 47 | 189 |

  - It saves `l4-gallery.png` (all 13 at level 4), `l4-progression.png` (levels 1–4) and `l4-board.png` (all 13 at level 4 in play).
- **`labrun.js --slow`:** now also plays the two new labs start to finish with LANCE and MINTs:
  - lab 13: won, 21 DEADEYE finishes
  - lab 14: won, 7 MINTs ran dry mid-wave, 20 DEADEYE finishes
  - no errors
- **Full suite:** all 35 tests pass.

## Publishing
- GitHub: committed as "Shatterline v48: LANCE sniper, level 4 looks for every tower, VAULT MINTS and SKY SHIELDS labs" when the user said commit.
- The Claude artifact copy was not updated; it is still on v47 (artifact Version 49).
