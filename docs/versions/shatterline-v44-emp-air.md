# Shatterline v44: EMP lasers reach flyers

## User requests
- "the autobuild should pause the game right before the wave everything ended on". This was built as a v44 draft, then withdrawn at the user's request ("nevermind undo that") before it was published. The draft is not in this version: auto build still hands over with "AUTO BUILD DONE · YOUR TURN" and does not pause.
- "emp can laser aerial targets as well". This is what v44 contains.

## What changed
- **`findTarget`:** the EMP now counts flying and ground enemies alike. Every other tower is unchanged: FLAK hits air only, everything else hits ground only.
- **EMP fire:** the laser list no longer skips flyers. When a laser hits a flyer, the line and flash are drawn 5 px higher, because flyers hover above their shadow.
- **Effect on flyers:** `empHit` strips shields, pops domes and shorts electrified flyers. It also does its tiny damage (1.25–1.66 per laser).
- **Text:** FLAK is still the only tower that can bring flyers down. The "only FLAK can hit" wording was changed to "only FLAK can bring … down", in EN, ZH and ES, in these places:
  - the Glider description, which also notes that EMP lasers reach it but barely hurt
  - the Stormwing description
  - the AIR RAID line
  - the `confirm_air` prompt
  - the glider tip
  - the FLAK description
  - the EMP description now says "on the ground or in the air"
- `BUILD = 'v44'`.

## Verified
- All tests pass: the 17 existing tests plus the new `emptest.js`.
- On level 40, a lone Glider is targeted by the EMP (3.75 damage in 3 s). BOLT ignores it.
- In lab 12, a Stormwing with shield and elec modifiers had its 398-point shield stripped to 0 and was shorted. The EMP itself was not shut down.

## Publishing
- Artifact Version 46 (version id 1790810975-7b08).
- GitHub: committed as fc892a7 "Shatterline v44: EMP lasers reach flying enemies" when the user said commit. The live site was confirmed serving v44.
- Files are in `/home/claude/live/v44/`: `patch21.py` and `emptest.js`.
