# Shatterline v36: MASTER BOLT

Published to the artifact as Version 38 (version id 1790783419-7b8a). Committed to GitHub as 9bba3b3, "Shatterline v36: version number, BOLT crit pattern, MASTER BOLT". The live Pages site was confirmed serving v36. v34 (5e45a30) and v35 (fe5ac18) had already been committed earlier.

## What the user asked for
"make level 1 bolt crit on every 4th shot, 2 crits on 3rd and fourth, 3 crits on 2nd 3rd and 4th, level 4 increases fire rate by 35% and changes the visual of the tower. it should look different visually. a master version of it"

## What changed
- BOLT crit pattern (x2.5 damage per crit):
  - L1: `...C`
  - L2: `..CC`
  - L3: `.CCC`
  - L4: `.CCC`. It keeps 3 of 4 crits; it no longer crits on every shot as in v35.
- L4 is the MASTER BOLT:
  - `{ cost:200, dmg:9.98, rate:3.02, range:3.0, crits:3, master:true }`. The rate is 2.24 × 1.35.
  - Look: gold (`MASTER_GOLD = '#ffd23d'`), a thicker plate border, twin barrels, a 4-point star body, a cyan diamond heart, a pulsing white core, 4 rotating gold spikes, a cyan dashed halo and 4 counter-rotating white shards. It skips the generic LV3 shards and LV4 crown.
  - Shots alternate between the twin barrels, are gold, and fly at speed 640 instead of 560.
  - Upgrading to it shows a gold "MASTER BOLT" text with a ring, flash, shards and screen shake.
  - The upgrade tooltip title for L3 to L4 reads "MASTER BOLT · 200" in gold. Strings: `master_bolt` = MASTER BOLT / 大师光弹 / RAYO MAESTRO.
- The descriptions in EN, ZH and ES now mention MASTER BOLT and the 35% faster rate.
- `BUILD = 'v36'`.

## Verified
- All 11 tests pass, plus `mastertest.js`, a new check of pattern, rate, colour and visuals.
- Over 40 s against a tanky target, L1–L3 fired 38–40 shots and L4 fired 56 (about 1.4x; this includes step rounding).
- Screenshots were checked for the L1–L4 BOLT row and the tooltips in EN, ZH and ES.

## Files
Everything is in `/home/claude/live/v36/`:
- `patch10.py`: master bolt
- `patch11.py`: tooltip
- `mastertest.js`
- `tiptest.js`
