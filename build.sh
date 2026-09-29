#!/bin/bash
set -e
cd "$(dirname "$0")"
mkdir -p dist
PRE='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no"><meta name="description" content="Shatterline: a neon tower defense game. 80 short levels, 10 towers, play on your phone."><meta name="theme-color" content="#07060f"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Shatterline"><meta property="og:title" content="Shatterline"><meta property="og:description" content="A neon tower defense game. Tap to play, no sign-up."><meta property="og:type" content="website"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Crect width=%2764%27 height=%2764%27 rx=%2714%27 fill=%27%2307060f%27/%3E%3Cpolygon points=%2732,8 53,20 53,44 32,56 11,44 11,20%27 fill=%27none%27 stroke=%27%232ef2ff%27 stroke-width=%275%27/%3E%3Cpolygon points=%2732,21 42,27 42,37 32,43 22,37 22,27%27 fill=%27%23ff3d9a%27/%3E%3C/svg%3E">'
ENGINE="src/10_config.js src/12_i18n.js src/15_levels.js src/20_audio.js src/30_draw.js src/40_game.js src/45_world.js src/50_juice_ui.js"
if [ -f src/60_ui.js ]; then
  # artifact version: no doctype/html/head/body (added at publish time)
  { cat src/00_head.html; cat $ENGINE src/60_ui.js src/65_screens.js src/70_main.js; echo '</script>'; } > dist/shatterline.html
  # standalone version (for GitHub Pages / local testing)
  { echo "$PRE"; cat src/00_head.html; cat $ENGINE src/60_ui.js src/65_screens.js src/70_main.js; echo '</script></html>'; } > dist/index.html
fi
cp dist/index.html index.html        # GitHub Pages serves the repo's root index.html
ls -la dist
