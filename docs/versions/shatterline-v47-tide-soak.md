# Shatterline v47: TIDE soaks enemies; AUTO BUILD needs the same towers

## User requests
- "autobuild option should only occur if the user selected the same towers as before."
- "tide feels uninteresting. how can we make him deal damage that makes sense as a water turret?"
  - I offered four options: soak combos, pressure knockback, tidal wave, pressure ramp.
  - The user's answer: "make them 20% extra damage from arc when soaked. they stay soaked for the rest of their travels. pyro deals 20% less damage when they are soaked. enemies that are soaked are frozen every 3 blasts from frost. if frost is already empowered from another enemy, they freeze in two, if frost is level 4 and empowered by an enemy, they freeze in 1, if frost is level 4 and the enemy is wet, they freeze in 2 blasts."

## What changed
- **AUTO BUILD:**
  - `saveReplay` now also stores `lo` (the loadout of the lost try).
  - `startLevel` only sets `G.autoAsk` when `sameTowers(RP)` is true: the same set of towers, in any order.
  - A try saved before v47 has no `lo`. It counts as the same when every tower it built is in the loadout.
  - The "Not in your loadout (skipped)" line in the prompt can no longer appear; the code is still there.
- **SOAK:**
  - New constant `SOAK = { arc: 1.2, pyro: 0.8, freeze: 3 }`.
  - Every enemy a TIDE jet hits gets `e.soaked = true` for good. The first soak shows a teal ring and splash. A TIDE jet that hits a burning enemy still douses it.
  - **TIDE targeting:** burning towers first, then burning enemies, then dry enemies, then the rest.
  - **`damage()`:** if the enemy is soaked, damage from `DMG_SRC === 'arc'` is ×1.2 (this includes the LIVE WIRE pulse) and damage from `'pyro'` is ×0.8. The bonus stacks with brittle.
  - **FROST:** the new `frostNeed(tw, e)` decides how many blasts freeze an enemy:
    - Dry enemy: 3 blasts, and only while FROST is supercharged; otherwise it can't freeze.
    - Soaked enemy: `max(1, 3 - (supercharged ? 1 : 0) - (level 4 ? 1 : 0))`.
    - `e.markNeed` records the count, and the frost pips show that many.
  - **Look:** soaked enemies get a teal film under the body, a glint on top, and 2 falling drops (`drawWetFilm`). There is no "SOAKED" popup: it piled up in crowds.
- **Text (EN, ZH, ES):** the TIDE description now explains soaking. "Tiny damage" was dropped so the text fits in 4 lines.
- `BUILD = 'v47'`.

## Verified (`soaktest.js`)
- 3 grunts in range were all soaked after 1.37 s and stayed soaked after walking away.
- **Damage multipliers:** ARC 1.2, PYRO 0.8, BOLT and NOVA 1.0.
- **In play (ARC L1 and PYRO L1):** ARC did 1.196× to a soaked grunt and PYRO 0.799×.
- **FROST, blasts until the first freeze:**
  - L1 dry: never
  - L1 dry, supercharged: 3
  - L1 soaked: 3
  - L1 soaked, supercharged: 2
  - L4 dry: never
  - L4 soaked: 2
  - L4 soaked, supercharged: 1 (12 freezes in 12 blasts)
  - L3 soaked: 3
- **AUTO BUILD:**
  - same towers: asked
  - same towers in a different order: asked
  - one tower swapped: not asked
  - fewer towers: not asked
  - pre-v47 try with all built towers in the loadout: asked
  - pre-v47 try with a built tower missing: not asked
  - a lost try saves its loadout
- **Text:** the TIDE tooltip and unlock popup fit in EN, ZH and ES.
- **Full suite:** all 25 tests pass. `asktest.js` was updated: its pre-v47 replay now builds a tower that is in the loadout.

## Publishing
- Artifact Version 49 (version id 1790877294-c1de).
- GitHub: staged with the message "Shatterline v47: TIDE soaks enemies; auto build needs the same towers". Not committed; commit only when the user says so.
- Files are in `/home/claude/live/v47/`: `patch24.py`, `soaktest.js` and `unlocktide.js`.
