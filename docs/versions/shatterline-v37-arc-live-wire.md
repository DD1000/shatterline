# Shatterline v37: ARC LIVE WIRE

The artifact was published as Version 39 (version id 1790788453-4e7c). On GitHub, index.html and README.md are staged with "Shatterline v37: ARC LIVE WIRE, faster ARC upgrades, wrapping tooltips". They are waiting for the user to say commit.

## What the user asked for
"every upgrade should upgrade the attack speed of arc. then his final 4th upgrade he transforms and he targets the road they travel on and current travels through the whole thing. the current deals damage always at the final rate of speed of upgrade 3. electrified enemies get a much larger radius and 20% movement speed buff and a 20% health increase."

Follow-up answers:
- Electrified buffs apply only on the charged road, and the reach is "2 additional squares from the outermost square".
- The other two questions went unanswered, so the recommended options were used: the current covers the tower's whole lane, and upgrades fire +20% faster each.

## What changed
- **ARC rate:** 0.9 / 1.08 / 1.3 zaps a second at L1 to L3. Damage and chains are unchanged.
- **L4 LIVE WIRE:** `{ cost:260, dmg:23.29, rate:1.3, range:2.8, wire:true }`.
  - It stops chain zapping.
  - `wireRoutes(tw)` finds every MAP.paths route (portal to core) with a road tile centre within range. If none is in range, it uses the nearest route.
  - `wireUpdate` ticks at 1/rate on its own timer, so supercharge and snow don't change it. Each tick damages every ground enemy standing on those route tiles for dmg × (1 + beacon buff). Normal armor, shield and dome rules apply.
  - Flyers and live electrified enemies are skipped.
  - If nobody is on the road, it strikes as soon as someone steps on.
  - Multiple LIVE WIREs stack, since each ticks on its own.
  - Wire towers are also skipped by the Volt shutdown and supercharge loop.
- **Electrified enemies on a charged tile** (`G.wire = wireTiles()`, set each update, with `e.charged`):
  - Short-out reach is ELEC.r + ELEC.wireR = 1.3 + 2 = 3.3 tiles (`elecReach(e)`).
  - Speed is ×1.2 while on the road.
  - maxHp and hp are ×1.2 once (`e.fed`), with a "CHARGED" pop-up.
  - An EMP-shorted enemy (`elecOff > 0`) is not live, so it gets no buffs and takes current damage.
- **Visuals:**
  - The L4 glyph has a thicker plate, an inner blue plate line, a counter-rotating yellow and blue hexagram, coil rings, and a crackling white-blue core.
  - Around it are 3 blue pylons joined by jagged current running round the ring, inside a dashed yellow crown.
  - `drawWire` draws the charged route as a glow band, a core line, fast white current dashes and two jittery lightning threads. It sweeps out from the tower after the upgrade (`wireOn`) and flashes on each tick (`wirePulse`). A flickering bolt runs from the tower to the nearest road point.
  - The upgrade FX shows "LIVE WIRE" text, rings, a flash, a zap to the road and a shake.
- **Upgrade tooltip:** L3 to L4 reads "LIVE WIRE · 260", with a line explaining the road current.
- **Strings:** `live_wire` = LIVE WIRE / 高压电网 / ALTA TENSIÓN, plus `wire_line` and `charged`. The ARC, Volt and elec_note descriptions were updated in EN, ZH and ES.
- **Fix:** long descriptions now wrap, using `wrapLines(str, maxW)`, instead of running off the edge. The build/upgrade tooltip is 280 wide with up to 4 lines, and the NEW TOWER popup also takes up to 4 lines.
- `BUILD = 'v37'`.

## Verified
- All 11 tests pass, plus mastertest and the new wiretest.
- The wire ticks 13 times in 10 s (1.3/s). Grunts at 10%, 50% and 90% of the route each took 13 × 23.29 = 302.8. A Titan (armor 7) took 13 × 16.29 = 211.8.
- A Volt on the road: charged, hp ×1.2 exactly once, reach 3.3 tiles, speed ×1.2, not hurt. The shorted Volt was hurt.
- Screenshots were checked for the tower, the charged road, the wave, the tooltips in 3 languages and the NEW TOWER popup in 3 languages.

## Balance note
One LIVE WIRE does about 30 damage per second to every ground enemy on its whole route. In testing it wiped level 12's wave 1 at the portal. The user will tune this from the lab analytics.

## Files
`/home/claude/live/v37/`: patch12.py (plus the inline visual tweaks it notes), wiretest.js, unlocktest.js
