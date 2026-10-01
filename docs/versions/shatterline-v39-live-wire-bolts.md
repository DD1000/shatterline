# Shatterline v39: LIVE WIRE bolts (electric road removed)

## What the user asked for
- "every fourth attack creates a lightning bolt attack every time an enemy takes the fourth tic of damage from this tower. it deals 20 damage"
- "remove the electric rail". The user confirmed this means the electric road, and chose "Remove the road completely".

## What changed
- **Electric road removed.** v37/v38 made the LIVE WIRE electrify the road. This version deletes all of that:
  - `wireRoutes`, `wireTiles`, `wireUpdate` and `drawWire`
  - feeding by electrified enemies: `e.charged`, `ELEC.wireR`, `wireSpeed` and `wireHp`
  - the CHARGED string, and the Volt / elec_note sentences about the road
- **ARC level 4 (LIVE WIRE) is chain lightning again.** Stats: `{ cost:260, dmg:23.29, rate:1.56, range:2.8, chains:8, bolt:20, boltEvery:4, wire:true }`.
  - Rate 1.56 is +20% over level 3, following the "each upgrade fires faster" rule.
  - It keeps the v37 LIVE WIRE look and name. On upgrade, a lightning bolt strikes the tower.
  - Its chain zaps are drawn in WIRE_BLUE.
  - Volts supercharge it like any ARC: ×1.6 rate and +3 chains.
- **The bolt.** Each LIVE WIRE counts the hits it lands on each enemy (a `tw.hits` WeakMap, so each tower counts separately).
  - Every 4th hit on an enemy that is still alive triggers `skyBolt(e, 20 × beacon boost)`.
  - `skyBolt` draws a jagged white and blue bolt from 150 px above the enemy, with a flash, a ring and sparks.
  - Damage is applied as a crit: normal armor and shield rules, and a yellow "20!" number.
  - Plays a thunder sound once per zap that produced bolts, with a tiny shake.
- **Tooltip.** Upgrading from L3 to L4 shows "LIVE WIRE · 260" and "Zaps faster (1.56/s) and chains to 8. Every 4th hit on the same enemy calls down a 20-damage lightning bolt." It is in EN, ZH and ES. The ARC description is updated to match.
- `BUILD = 'v39'`.

## Numbers
- **Single target:** 23.29 × 1.56 ≈ 36 per second, plus bolts at 20 × 1.56 / 4 ≈ 7.8 per second, for about 44 per second in total.
- **Crowd of 8:** about 113 per zap, or about 176 per second, plus about 62 per second from bolts. That is roughly 240 per second across the crowd.

## Verified
- All tests pass (11 plus mastertest), plus the new stormtest.js and unlocktest.js. wiretest.js was removed.
- **Single parked grunt:** 30 hits and 7 bolts. Damage taken was exactly 30 × 23.29 + 7 × 20 = 838.7.
- **Crowd of 10:** 8 enemies were hit.
- **Level 3:** no bolt tracking.
- **Volt:** supercharged the tower to about 2.2 zaps a second, with no feeding.
- **Road:** plain again.

## Publishing
- Artifact Version 41 (version id 1790792298-7c09).
- GitHub index.html and README.md are staged as "Shatterline v39: no electric road, LIVE WIRE lightning bolts" and are waiting for the user to say commit. v38 was committed by the user.
