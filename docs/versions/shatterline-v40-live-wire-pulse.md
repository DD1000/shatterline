# Shatterline v40: LIVE WIRE track pulse

## What the user asked for
- "make the lightning bolts deal only 5 additional damage". This was interrupted before it was applied.
- Then: "actually make it target the enemy in front and each attack sends a pulse down all tracks from where it attacked hitting all enemies it goes past. it should deal 2.3 damage every time it passes through an enemy"

## What changed
- ARC level 4 (LIVE WIRE, same look) is now `{ cost:260, dmg:23.29, rate:1.56, range:2.8, chains:1, trackDmg:2.3, wire:true }`.
- **Targeting.** It always takes the enemy in front, using mode 'first' in `findTarget`. It zaps only that enemy (no chain).
  - If Volts supercharge it, it gets the usual +3 chains and ×1.6 rate.
  - The tower menu hides the target-mode button at level 4.
- **The v39 lightning bolts are removed:** `skyBolt`, the `tw.hits` WeakMap, and the `bolt`/`boltEvery` fields.

## The pulse
- **Road graph.** `roadGraph()` is cached on MAP. It links consecutive tiles of every MAP.paths route; routes join where they share tiles.
- **Launch.** Every zap calls `launchPulse(tw, target, 2.3 × beacon boost)`. This runs a BFS over the road graph from the target's tile, giving each tile's road distance from the hit.
- **Spread.** The pulse front moves at `PULSE.speed` = 12 tiles/s in both directions and into every branch.
- **Hits.** `updatePulses` runs after the tower loop, with DMG_SRC = 'arc'. It damages each ground enemy once, when the front passes within a 1-tile band.
  - The zapped target is excluded from its own pulse.
  - Normal armor and shield rules apply; flyers are skipped.
- **Drawing.** `drawPulses` runs right after `drawPathFlow`. Each pulse is a white-blue comet: 5 trail samples, glow 20, white core.
- **State.** `G.pulses` is initialised in G and reset with the other per-level arrays.
- **Tooltip and descriptions:** "Zaps the enemy in front (1.56/s). Each zap sends a pulse down every track that deals 2.3 to each enemy it passes." Available in EN, ZH and ES. The ARC description is updated.
- `BUILD = 'v40'`.

## Numbers
- **Target:** 23.29 × 1.56 ≈ 36 per second.
- **Everyone else on any track:** 2.3 × 1.56 ≈ 3.6 per second.
- **Armor ≥ 2:** 0.69 per pulse (the 30% floor).

## Verified
pulsetest.js (new; stormtest.js removed) plus all the other tests pass. In 10 s:

| Check | Result |
|---|---|
| Front grunt | 349.4 (15 zaps × 23.29) |
| Mid and back grunts | 34.5 each (15 × 2.3) |
| Enemies near the portal and near the core | 34.5 each |
| Flyer | 0 |
| Pulse travel, 17.5 tiles | 1.43 s (expected 1.46) |
| Level 15, two lanes: other branch and trunk | 27.6 each (12 × 2.3) |
| Titan | 0.69 per pulse |
| Menu, level 4 | sell / up / close |
| Menu, level 3 | sell / up / mode / close |

## Publishing
- Artifact Version 42 (version id 1790794694-89db).
- GitHub: v39 was committed by the user. v40's index.html and README.md are staged as "Shatterline v40: LIVE WIRE zaps the front enemy and pulses down every track" and are waiting for the user to say commit.
