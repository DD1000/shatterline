# Shatterline v35: BOLT crit pattern (2026-09-30, artifact v37)
- User: "make every fourth shot from bolt crit and every upgrade makes the shot before it crit too, level 4 all shots crit".
- `v35/patch9.py` on top of v34: `BUILD = 'v35'`.
  - BOLT: `crit:0.1` (10% chance) → `critMul:2.5` plus `crits: 1/2/3/4` per level.
  - `fire()` keeps `tw.shots`; shot k (1..4) of each group of 4 crits when k > 4 − crits.
  - Verified patterns: L1 `...C`, L2 `..CC`, L3 `.CCC`, L4 `CCCC`.
  - Average damage multiplier: L1 1.375x (was 1.15x), L2 1.75x, L3 2.125x, L4 2.5x. A big BOLT buff at higher levels.
  - The upgrade preview shows "CRIT 1/4→2/4" (new `s_crit` string in EN/ZH/ES). Descriptions updated in EN/ZH/ES.
- All 11 tests pass.
- GitHub: v34 was never committed. The v35 `index.html` + `README.md` (covering v34 and v35) are loaded on the upload page in Chrome with the message "Shatterline v35: version number on screen, BOLT crit pattern". Waiting for the user to say commit.
