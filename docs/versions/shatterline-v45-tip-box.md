# Shatterline v45: the defeat-screen tip box fits its text

**User request:** "make sure after a level is over or lost the tip has enough space in the box"

## What changed
- **The problem:** the TIP box on the defeat screen was a fixed 64 px tall, which is enough for about 2 lines. Longer tips spilled out of the box. The longest is the electrified-enemy (volt) tip, which runs 4 lines in EN and ES and 3 in ZH.
- **The fix:** the box now wraps the tip and sizes itself to the text.
  - It uses `wrapLines` at 11 px across `bw − 28`, with `bw = min(330, LW − 24)`.
  - Box height is `bh = 36 + lines × 14 + 6`.
  - The lines are drawn at `y + 104 + i × 14`.
  - The buttons below move down to match (`y += 70 + bh + 16`).
- **Win screen:** no change. It has no tip, and its NEW TOWER box has wrapped since v37.
- `BUILD = 'v45'`

## Verified
- **`tiptest2.js` (new):** finds the tip with the most lines in each language, shows it on a defeat screen, and screenshots it at 390×844 and 360×640. Every case fits with padding, and the buttons stay on screen.
- **Regression:** all 18 previous tests pass.

## Publishing
- **Artifact:** Version 47 (version id 1790828034-9cf2).
- **GitHub:** v44 was committed earlier. The v45 `index.html` and `README.md` are staged as "Shatterline v45: the tip box fits its text" and wait for the user to say commit.
- **Working files:** `/home/claude/live/v45/` holds `patch22.py` and `tiptest2.js`.
