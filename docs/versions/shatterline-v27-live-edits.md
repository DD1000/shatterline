# Shatterline Spore damage, NOVA rate, restart to tower select, tester password (v27, 2026-09-29, artifact v29)
- **Edited directly in the published HTML** (on top of artifact v28 / the v26 session's build), not in a `src/` tree. A session that rebuilds from its own `src/` must port these four changes first, or it will undo them:
  1. `coreDamage(rc)` (next to `ENEMY_ORDER`) = `rc.leak + split.n × child leak`. `leak(e)` uses it for lives, `G.leaks`, `waveStat.leaked`, `leakTypes`, `shieldLeaks` and the "-N" text; `musicIntensity` uses it too.
  2. NOVA `rate` 0.34 / 0.37 / 0.41 / 0.46 (was 0.52 / 0.57 / 0.63 / 0.7).
  3. `retryLevel()` (just above `openCard`): pause-menu RESTART (after the tap-to-confirm) and the end screen's RETRY / TRY AGAIN write the loadout used in the level (`G.loadout`) back to `Save.d.loadout` (or `labLoadout`), open that level's card, then strip any weather-banned tower so it doesn't sneak back into a free slot.
  4. Tester password: `DEV_HASH`, `devHash()`, `DEV_OK`, `withPassword()`, `askPassword()` (a DOM overlay: password input, CANCEL / UNLOCK, WRONG PASSWORD) just above `toLab()`. The title's PLAYTEST LAB pill and turning TEST MODE on go through `withPassword`; turning test mode off doesn't. The check is case-insensitive and trims spaces. It is remembered per device in localStorage `shatterline.dev`. New strings `pw_title / pw_locked / pw_wrong / pw_ok / pw_cancel` (EN/ZH/ES). The password was chosen by the user (ask them). Only an FNV-1a hash is in the code: a light lock, not security.
- **Spores (user):** a Spore that reaches the core costs **4 lives** (itself + the 3 Mites inside). Mites still cost 1. The Spore's description and tips (EN/ZH/ES) say so.
- **Bot check (same 12 strategies, before → after):**
  - Spore change alone, levels 1–33: expert wins 336 → 316. Most levels are unchanged; Spore-heavy levels drop sharply: 29 (10 → 0), 30 (10 → 5), 27 (5 → 3).
  - Both changes together (sample): 6: 12 → 12 (fewer lives kept); 8: 12 → 7; 12: 11 → 6; 20: 11 → 5; 30: 10 → 1; 40: 11 → 4; 50: 4 → 0; 60: 9 → 4; 66: 11 → 6; 70: 5 → 1; 80: 2 → 0. Casual bots drop similarly.
  - So most of the jump comes from the NOVA cut: the bots lean on NOVA (it's first in their default list and in most cores). **Not recalibrated;** the user was asked whether to rebalance or keep it harder.
- Tests (run against the published HTML): smoke, smoke2, smoke4, featuretest, mechtest, langtest, labtest, plus new `sporetest.js`, `restarttest.js` (restart and retry, the lab, the heat-ban case) and `pwtest.js` (wrong / right password, remembered after reload, TEST MODE on/off). All pass.

## GitHub (DD1000/shatterline) status, 2026-09-29
- **Live:** the user committed `index.html` (v27) and the new `README.md` to main as commit 7d9f03b. https://dd1000.github.io/shatterline/ serves v27 (checked: `DEV_HASH`, `coreDamage`, "12 towers").
- **Not updated (user said only the one file matters):** `dist/index.html`, `dist/shatterline.html` and `dist/itch/index.html` are still v20. `src/` is still v22–v25. The README warns not to run `build.sh` until `src/` catches up.
- **How to upload (fast):**
  - Use Claude in Chrome's `file_upload` tool on `github.com/DD1000/shatterline/upload/main[/subdir]`: `find` the "Choose your files" input, then pass file paths.
  - Paths must be under the session's **working directory** (e.g. `/home/claude/...`). Files in `/mnt/user-data/outputs` were rejected, even after SendUserFile.
  - Type the commit summary, then let the user click "Commit changes" (or click it only with their OK).
  - Each subfolder needs its own upload page and commit.
  - Takes seconds. The Claude app's built-in browser has no file-upload tool; the old route (base64 typed through the javascript tool) takes 10+ minutes.
- Rebuilding the four HTML files: they all come from the artifact HTML.
  - Standalone: replace the artifact skeleton line with the standalone head, and add `</head><body>` after `</style>`.
  - Artifact form: strip the skeleton line and the trailing `</body></html>`.
  - itch: terser, same settings as `tools/minify.js`.
