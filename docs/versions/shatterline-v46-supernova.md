# Shatterline v46: NOVA level 4 SUPERNOVA (includes v45)

## User requests
- v45: "make sure after a level is over or lost the tip has enough space in the box". The end-screen TIP box now wraps its text with `wrapLines` and grows to fit it; the buttons move down to make room. v45 was published (artifact Version 47) and staged on GitHub, but never committed on its own. v46 includes it.
- v46: "make nova at level 4 have a round circle with 4 shots. he now lobs the main shot, then 3 additional shots spanning as wide as he can to cover the most enemies possible. the initial shot is always normal damage. the extras have a smaller splash and much less damage. also change the visual of him. ideally a big hole that launches all shots out of it. the same fire rate, just additional coverage and slightly more damage to other enemies as well"

## What changed (v46)
- **NOVA level 4 data:** `{ cost:300, dmg:29.95, rate:0.29, range:3.8, splash:1.35, extra:3, extraDmg:0.2, extraSplash:0.6, supernova:true }`. The main shell, rate, range and splash are the same as before.
- **Volley:** the main shell is unchanged and launches from the hole's center. `supernovaVolley` then adds 3 small shells:
  - each does 20% damage (5.99) with a 0.6-tile blast, and still pierces armor
  - they land one after another (flight times 0.82, 0.89 and 0.96 s)
- **Placement:**
  - Each extra goes where its blast covers the most enemies that no shell of this volley covers yet. Candidate spots are where in-range enemies will be when it lands, plus road points every 10 px within range.
  - Ties go to the spot farthest from the other impacts.
  - With nobody left uncovered, the extras fan out over the road as wide as possible. They never stack on the main target.
- **Small shells look smaller:** lower arc, smaller trail and blast effects, no shards, a `flakHit` sound, light shake, and small damage numbers.
- **Glyph (level 4 only):**
  - a big mortar hole: dark pit, orange rim and rotating rifling, flashing white when it fires
  - 4 shells sit on the rim, fade out when fired, then reload
  - 4 heat fins at the diagonals, a dashed ember ring and 4 orbiting embers
- **Upgrade:** the FX shows "SUPERNOVA". The L3→L4 tooltip reads "SUPERNOVA · 300" plus a line computed from the data (`supernova_line`, with the 20% read from `extraDmg`).
- **Text:** the NOVA description mentions SUPERNOVA. All new strings exist in EN, ZH and ES.
- `BUILD = 'v46'`.

## Balance notes
- **First try at 30% extras:** level 4 dealt 70–155% more damage than level 3 on real waves (enemy HP set very high so nothing dies).
- **Lowered to 20%:** +53–82%. This includes the normal level 4 stat bump (+10% damage, more range and splash).
- **A lone enemy** takes only the main shell (29.95), so single-target damage is unchanged.

## Verified (`novatest.js`)
- **Four parked clusters of 3 grunts:** 1 main shell (29.95, splash 1.35) plus 3 small shells (5.99, splash 0.6). The 4 shells landed on 4 different clusters, and all 12 grunts were hit.
- **Lone grunt:** took 29.95. The extras landed at least 3.4 tiles apart.
- **Rate:** 9 volleys in 30 s at both level 3 and level 4.
- **Crowd of 19:** level 3 hit 4 enemies; level 4 hit 14.
- **Tooltips:** EN, ZH and ES all fit.
- **Full suite:** all 22 existing tests pass.

## Publishing
- Artifact Version 48 (version id 1790829606-5223).
- GitHub: committed as b1471ec "Shatterline v46: NOVA level 4 SUPERNOVA" when the user said commit. The commit contains `index.html` and `README.md`. The live Pages site was confirmed serving v46.
- Files are in `/home/claude/live/v46/`: `patch23.py` and `novatest.js`. The v45 patch is `/home/claude/live/v45/patch22.py`.
