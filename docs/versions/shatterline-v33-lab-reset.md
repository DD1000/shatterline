# Shatterline v33: Playtest Labs fully reset (2026-09-30, artifact v35)
- User: "the playtests still aren't cleared". In v32 only the COMPLETED stamps went away (lab version bump). The cards still showed stars, the last result ("WON · 8 LIVES…") and wins/plays. Also, a phone can cache the GitHub Pages copy for about 10 minutes.
- Edited on top of v32 with `v33/patch7.py`: `BUILD = 'v33'`.
  - `Save.freshLabs()` runs in `Save.load()` and stores the result. Any lab record whose `r.v` (default 1) differs from the lab's current `v` is replaced by `{ stars: 0, plays: 0, wins: 0, v, runs: <old runs> }`.
  - `labRec` stamps `v: labVer(n)` on new records. With the v32 bump (7 labs v2, 3 boss labs v3), every existing record resets.
  - Old runs are kept. `labPlays()` counts runs too, so the SEND LAB ANALYTICS button stays. The report says "this version: 0 wins / 0 plays … (older runs below are from before the reset)".
  - **Future lab resets: bump the lab's `v` in LAB_DEFS.** That now resets everything on the card, not just the stamp.
- Tests: all 11 pass, plus a fresh-load test with an old save (stamped v1/v2 records → reset, runs kept; a win afterwards completes normally).
- **GitHub: committed and live** (Pages build #9). The live site serves `BUILD = 'v33'`.
