# Shatterline

A neon tower defense game for phones, with 80 short Candy Crush-style levels, 10 towers and an English/Chinese option. Everything is drawn and synthesized in code, so there are no image or audio files.

**Play:** open `index.html`, or the GitHub Pages link for this repo. No account is needed.

## What's in here
| Path | What it is |
|---|---|
| `index.html` | The whole game in one file. This is what GitHub Pages serves. |
| `src/` | The source, split by topic: config, languages, levels, audio, drawing, game logic, UI, screens. |
| `build.sh` | Joins `src/` into `dist/index.html` (standalone), `dist/shatterline.html` (Claude artifact version), and copies the standalone file to `index.html`. |
| `tools/` | Bot playtesters and helpers: `calibrate.js` (difficulty tuning), `probe.js`, `audit.js` (tower balance), `gen_maps.js` (level paths), `perf*.js` (frame-time profiling). |
| `tests/` | Automated checks (Playwright). Run from the repo root, e.g. `node tests/smoke.js /tmp`. |

## Making a change
1. Edit files in `src/`.
2. Run `bash build.sh`.
3. Upload the new `index.html`. GitHub Pages updates within a minute or two.

Tests and tools need Node.js and Playwright (`npm i playwright`).
