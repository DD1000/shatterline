# Shatterline v49: LANCE AIR mode and no repeat shots; EMP 4.62x damage

## User requests
- "the sniper needs an option to prioritize aerial targets and when they are prioritized they target the strongest automatically. if no air targets are found they target ground units. also make them not shoot the same target unless its the only target, or its a boss target"
  - Ground fallback: with no flyers in range, AIR shoots the toughest ground enemy, since AIR targets "the strongest automatically".
  - "Only target" on AIR means the only flyer. A lone flyer keeps getting shot, instead of LANCE switching to the ground every other shot.
- "give emp slightly more damage. 3.3x his damage"
- Then: "up the damage by 2x its current damage". I took "its" to be EMP's, since that was the damage we'd just talked about. EMP went from 3.3x to 6.6x v48's damage.
- Then: "okay reduce emp damage by 30%". EMP ended at 4.62x v48's damage (6.6 × 0.7).

## What changed
- **Target modes per tower:**
  - `TOWERS.lance.modes = ['first', 'strong', 'air', 'close']`.
  - `modesOf(tw)` returns a tower's own list, or the usual `MODES` (first, strong, close).
  - `nextMode(tw)` picks the next one. Both the mode tap (`commitOption`) and the mode tooltip use it.
  - LANCE starts on STRONG, so a tap goes STRONG → AIR → CLOSE → FIRST → STRONG.
- **`sniperTarget(tw, range)`:** `findTarget` uses it for LANCE.
  - It looks at every enemy in range, ground or air.
  - On AIR, if any flyer is in range, only flyers count, and it picks the toughest (`hp + shield`). With no flyer in range, it picks the toughest ground enemy.
  - **No repeat:** `lanceFire` records `tw.lastShot` and sets `tw.retT = 0`, so LANCE retargets on the next frame. While that last target is alive, it is skipped, unless:
    - it is a boss, or
    - it is the only enemy it could shoot (on AIR, the only flyer).
  - The rule applies in every mode. The laser sight moves to the next target right after each shot.
- **Mode button:** on AIR the crosshair shows a small Glider instead of its center ring. The label reads AIR / 空中 / AIRE.
- **Text (EN, ZH, ES):** `mode_air` and `mdesc_air` ("Shoots the toughest flyer in range; with no flyers, the toughest ground enemy"). The mode tooltip reads e.g. "TARGET STRONG → AIR".
- **EMP:** damage ×3.3 at every level, then ×2, then ×0.7: 5.78 / 6.37 / 6.97 / 7.67 (was 1.25 / 1.38 / 1.51 / 1.66, so 4.62x). Rate, range and beams are unchanged.
  - The EMP description says "Light damage" instead of "Barely any damage" (ZH 伤害较低, ES Poco daño).
  - The Glider's description says EMP lasers "only chip it" instead of "barely hurt" (ZH 伤害有限, ES solo lo rozan).
- `BUILD = 'v49'`.

## Balance notes
- **EMP**, measured on parked grunts with huge HP for 10 s, v48 → 3.3x → 6.6x → final 4.62x:

  | Level | 1 grunt alone | 4 grunts in range (total) |
  |---|---|---|
  | 1 | 13.8 → 45.4 → 90.9 → 63.6 | 55 → 181.7 → 363.4 → 254.3 |
  | 2 | 15.2 → 50.1 → 100.1 → 70.1 | 60.7 → 200.2 → 400.4 → 280.3 |
  | 3 | 16.6 → 54.8 → 109.6 → 76.7 | 66.4 → 219.1 → 438.2 → 306.7 |
  | 4 | 18.3 → 60.3 → 120.6 → 84.4 | 73 → 241.1 → 482.2 → 337.5 |

  - **Per enemy:** about 6.4 damage a second at level 1 (8.4 at level 4).
  - **With four enemies in range:** a level 1 EMP (75 gold) deals about 25 a second in total, about what a level 1 BOLT (50 gold) does to one enemy (23).
  - **Armor still matters:** a Bulwark (armor 4) takes 1.78 of each 5.78 laser.
- **LANCE:** the no-repeat rule spreads its shots. Against two enemies it now alternates instead of focusing the tougher one. Bosses still take every shot.

## Verified (`lanceaimtest.js`)
- **Modes:**
  - LANCE: first strong air close, starting on strong
  - BOLT: first strong close
  - taps: strong > air > close > first > strong
- **Shot sequences** (which parked enemy each shot hit, one shot every 2.5 s):

  | Situation | Shots |
  |---|---|
  | AIR, two Gliders (8,000 and 3,000) plus a 50,000 grunt | Gliders 1 2 1 2 1, never the grunt |
  | AIR, one Glider plus the grunt | the Glider every time (1 1 1 1) |
  | AIR, no flyers (50,000 and 5,000 grunts) | 0 1 0 1 |
  | STRONG, two grunts | 0 1 0 1 |
  | FIRST, two grunts | 0 1 0 1 |
  | A lone grunt | 0 0 0 |
  | A Warden plus a grunt | the Warden every time (0 0 0 0) |

- **EMP:** data 5.78 / 6.37 / 6.97 / 7.67; a level 1 EMP did 63.6 to a lone grunt in 10 s.
- **Text:** the AIR line fits a tooltip in 2 lines in EN, ZH and ES.
- **Screenshots:** the mode tooltip in each language, and the AIR button with a DEADEYE sighting a Glider.
- **Full suite:** all 36 tests pass.

## Publishing
- GitHub: committed as "Shatterline v49: LANCE AIR target mode and no repeat shots, EMP 4.62x damage" when the user said commit.
- The Claude artifact copy was not updated; it is still on v47 (artifact Version 49).
