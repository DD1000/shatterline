# Shatterline v43: AUTO BUILD after a loss

## What the user asked for
"implement a feature to automatically build towers where they were previously built on the level restart if the player lost. the towers are built exactly at the same time and location where they were built previously and keeps going. at the beginning after failure it asks the player "auto build until wave..." then the player selects the wave to stop building. also show the waves of enemies arriving to help as a visual aid in case the user cant remember the wave from memory"

## How it works

### Recording
`recAct(k, o)` pushes `{ k, w, t, ... }` to `G.rec`:
- `w` is `G.waveNum` at that moment.
- `t` is the number of seconds since that wave started (`G.waveT0` is set in `startWave`). Before wave 1, it counts from the start of the level.

Actions recorded:
- `b` build `{type, c, r}`, from inside `buildTower`
- `u` upgrade `{c, r, type}`, from `upgradeTower`
- `s` sell, from `sellTower`
- `t` rail turn `{dir}` and `m` target mode `{mode}`, from `commitOption`
- `w` wave call `{early}`, from `playerWave(early)`. This is the new wrapper used by the START and NEXT WAVE buttons and the Space key. Wave starts from the auto-timer are not recorded.

Nothing is recorded in the demo or after the level is over.

### Saving
In `endGame`, `saveReplay(n, win)` handles the saved try:
- On a loss it stores `Save.d.replays[n] = { rec, reached: waveNum, waves, at }`, keeping the 5 most recent levels.
- On a win it deletes that level's saved try.

### Asking
At the end of `startLevel(n)`, if a saved try exists for the level, it sets `G.autoAsk = { R, sel: reached }`.
- While the prompt is open the game is frozen: `frame()` does not run `update`, and the Space key is ignored.
- `drawAutoAsk()` is a modal. It shows the title and explanation, then a 5-column grid with one card per wave.
  - Each card shows the wave number, up to 3 enemy icons (bosses first, then the biggest groups) with ×counts, a red outline for boss waves and a LOST tag on the wave where the player lost.
  - Waves after the one lost on are dimmed and can't be picked.
- Below the grid, a detail panel shows the selected wave's full lineup and a count line: "X built · Y upgraded · Z sold".
- If any recorded tower is missing from the current loadout, a warning line appears.
- Buttons: "AUTO BUILD UNTIL WAVE N" (calls `beginReplay`) and "START FRESH".

### Replaying
`replayStep()` runs at the top of `update`. An action is due when `G.waveNum > a.w`, or when `G.waveNum === a.w` and `G.time − G.waveT0 ≥ a.t`.

`replayDo` returns one of four results:
- `ok`: the action was done.
- `skip`: the tile is taken, the tower is gone or has a different type, or the tower isn't in the loadout.
- `gold`: not enough gold yet. The replay waits and shows "WAITING FOR GOLD".
- `later`: an early wave call is due but the next wave can't be called yet.

The replay stops at the first action with `w >= until`, or at the `w` call that would start wave `until`. So the player always starts that wave themselves. When it stops, a toast says "AUTO BUILD DONE · YOUR TURN".

Replayed actions are recorded again. If the player loses again later, the new saved try contains everything.

### On-screen indicator
`drawReplayPill()` shows "⟲ AUTO BUILD · UNTIL WAVE N" (plus "· WAITING FOR GOLD" when stuck) above the board.
- Tapping the ✕ stops the replay ("AUTO BUILD STOPPED").
- The pill text shrinks to fit narrow screens.
- Towers built by the replay flash a small "AUTO" label.

### Strings
EN, ZH and ES keys: `auto_title`, `auto_sub`, `auto_go`, `auto_fresh`, `auto_lost`, `auto_counts`, `auto_pill`, `auto_wait`, `auto_done`, `auto_stopped`, `auto_tag`, `auto_missing`.

## Verified
All tests pass: the 15 older ones plus autotest.js, which is new. flowtest.js, asktest.js and pilltest.js are extra screen and flow checks.

autotest.js plays a scripted run on level 12:
1. Builds at t=1 and t=2.
2. Calls wave 1 at t=3.
3. Upgrades 4 s into wave 1.
4. Calls wave 2 early.
5. Builds and sells during wave 2.
6. Calls wave 3 early, builds, then loses.

It then checks:
- **The prompt:** it appears with wave 3 selected, and the game is frozen (time stays at 0).
- **Replay until wave 2:** 4 actions repeat with identical kind, wave and tile, and timing within 0.04 s. It stops before calling wave 2.
- **Replay until wave 3:** 7 actions repeat, including the early call for wave 2. The wave 3 call is not repeated.
- **Gold:** the replay waits for gold and then continues.
- **Buttons:** the stop ✕ and START FRESH both work.
- **Space key:** blocked while the prompt is open.
- **Winning:** a win clears the saved try, so no prompt appears after it.

flowtest.js covers the real button path. It loses, taps TRY AGAIN, then taps PLAY on the level card, and the prompt appears. Screenshots were checked in EN, ZH and ES, for a 25-wave lab and on a 360×640 screen.

## Publishing
- Artifact Version 45 (version id 1790801114-57bc).
- GitHub: v42 was committed by the user. The v43 `index.html` and `README.md` are staged as "Shatterline v43: auto build your last try after a loss" and are waiting for the user to say commit.
- Files are in `/home/claude/live/v43/`: `patch19.py`, `autotest.js`, `flowtest.js`, `asktest.js`, `pilltest.js`.
