# Shatterline v34: version number on screen (2026-09-30, artifact v36)
- User: "add version number somewhere for me to see when checking".
- `v34/patch8.py` on top of v33:
  - `BUILD = 'v34'`.
  - The title screen draws `BUILD` in small dim text under the footer (LH − 13).
  - The Playtest Lab header draws it at the top right (x0 + cw − 6, y 34).
- From now on, bump `BUILD` for every release; the user checks the on-screen version to see whether an update has reached their device.
- All 11 tests pass.
- GitHub: `index.html` + `README.md` loaded on the upload page in Chrome with the message "Shatterline v34: version number on title and lab screens". Waiting for the user to say commit.
