# Shatterline v41: LIVE WIRE keeps its chain, plus the pulse

## What the user asked for
The user first asked for a DPS comparison of chain versus pulse at level 4. v40's front-only zap plus pulse did only 35–60% of the old chain's damage until about 40 enemies were on the map. The user then said:

> "let it keep the original chain. the pulse should be the only new thing to the level 4"

## What changed
- **ARC level 4 (LIVE WIRE)** is now `{ cost:260, dmg:23.29, rate:1.56, range:2.8, chains:8, trackDmg:2.3, wire:true }`. It uses the chain lightning from v39: up to 8 enemies, with a 15% falloff per jump.
- **Targeting:** normal targeting is back. The forced 'first' mode was removed, and the target-mode button is back in the level 4 menu.
- **Track pulse:** every zap also launches a pulse from the first enemy it hit. The v40 pulse code is unchanged: it deals 2.3 × beacon boost to each ground enemy it passes, across every track, at 12 tiles/s.
- **No lightning bolts.** They were removed in v40.
- **Text:** the tooltip reads "Zaps faster (1.56/s) and chains to 8. Each zap also sends a pulse down every track that deals 2.3 to each enemy it passes." It is in EN, ZH and ES, and the ARC description was updated to match.
- `BUILD = 'v41'`.

## Verified
pulsetest.js passes, as do all the other tests. In 10 s with 15 zaps:
- **Front grunt:** 349.4 damage. The target is the first enemy, and each zap does 23.29.
- **Mid grunt:** 331.4 damage (15 × (19.80 chain + 2.3 pulse)).
- **Back grunt:** 286.9 damage (15 × (16.83 + 2.3)).
- **Far enemies, other lane, armor floor and speed:** all as in v40.
- **Level 4 menu:** sell / up / mode / close.

## Damage estimates (clustered enemies, no armor)
- 1 enemy: about 36/s
- 3 enemies: about 101/s
- 8 enemies: about 201/s
- Pulse against the rest of the map: about 3.6/s per enemy

## Publishing
- Artifact: Version 43 (version id 1790795806-790c).
- GitHub: index.html and README.md are staged as "Shatterline v41: LIVE WIRE keeps its chain, plus the track pulse". This replaces the uncommitted v40 staging. Waiting for the user to say commit.
