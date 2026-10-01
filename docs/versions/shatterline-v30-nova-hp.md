# Shatterline v30: NOVA nerf, enemies +10% health (2026-09-30, artifact v32)
- User: "further reduce damage of nova by 30% and the fire rate by 15%. increase enemy health by 10%."
- Edited in the published HTML on top of v29, with `v30/patch4.py`: `BUILD = 'v30'`.
  - **NOVA:** damage per hit 26/46/78/120 → 18/32/55/84 (−30%, rounded); fire rate 0.34/0.37/0.41/0.46 → 0.29/0.31/0.35/0.39 (−15%). About 40% less DPS than v29.
  - **Enemy health:** `ECON.hpScale` 1 → 1.1. It applies in `spawnEnemy` (`mul`), so shields, Aegis domes and Wardens scale too. The title demo is unchanged.
- All 11 tests pass.
- GitHub: `index.html` + `README.md` loaded on the upload page in Chrome with the message "Shatterline v30: NOVA nerf, enemies +10% health". Waiting for the user to say commit.

## Upgrade system (as of v30), explained to the user
- 4 levels per tower (build + 3 upgrades). Each upgrade has its own gold cost; selling refunds 70% of everything spent on the tower.
- Most damage towers roughly **double DPS** on the 1st and 2nd upgrades (+70–100% each) and add +55–80% on the 3rd. Level 4 is about **6x level-1 DPS** (PRISM 4.25x base dps, but its heat cap also rises 3x→4.5x, so about 6.4x fully heated). Range grows too.
- Full upgrade cost is 6–9x the build price, so DPS per gold barely falls with upgrades (BOLT 0.31→0.23, RAIL 0.23→0.23, FLAK 0.23→0.25 dps/gold). Upgrading is about as efficient as building new, and saves tiles. This is a likely reason spare gold snowballs into a maxed board.
- DPS by level (BOLT includes the 10% crit ×2.5):
  - BOLT: 15.5 / 29.4 / 55.9 / 97.2
  - NOVA: 5.2 / 9.9 / 19.3 / 32.8 per enemy hit (splash)
  - ARC: 12.6 / 24 / 43.7 / 75.4 per target (3/4/6/8 chains)
  - PRISM: 12.8 / 21.6 / 35.2 / 54.4 base (heat x3 / 3.5 / 4 / 4.5)
  - RAIL: 29.4 / 58 / 107.8 / 180 per enemy on the line
  - FLAK: 20.8 / 42 / 82.8 / 147 (air only)
  - PYRO: 18 / 33 / 57.6 / 93.6
  - FROST: 4 / 8 / 15.4 / 26.4, with slow 35 / 45 / 55 / 65% and brittle from level 3
  - Support: MINT gold 7/3 s → 20/1.8 s; BEACON +30 / 50 / 75 / 100%; EMP and TIDE rate and range.
