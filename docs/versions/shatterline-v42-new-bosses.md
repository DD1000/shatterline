# Shatterline v42: 12 new bosses, boss modifiers, ARC immunity, EMP holds

## What the user asked for
"any enemy with electric aura disables nearby towers and is immune to electric damage. bosses can have same modifiers as enemies. add new boss versions of the basic enemies. let me test it out in the labs. emp is immune to electric enemies disabling it. it will disable electric enemies though temporarily."

The user answered three follow-up questions:
- ARC: **keep supercharge**.
- Which enemies: **every regular enemy** (all 12).
- Where: **labs only for now**.

## What changed

### Electrified enemies are immune to ARC
- A live electrified enemy (`isLiveElec`) cannot be targeted by ARC; `findTarget` skips it for arc.
- The ARC chain skips it and cannot jump to it.
- The LIVE WIRE pulse passes through it without damage.
- `immunePop` shows an "IMMUNE" pop-up at most once per second for each enemy.
- ARC is still supercharged next to electrified enemies.
- While an EMP has it shorted (elecOff > 0), ARC can hurt it normally.

### EMP is never shut down by electrified enemies
- The Volt loop skips towers of type 'emp'.
- EMP still shorts electrified enemies out for ELEC.off (4 s).

### 12 boss versions, `boss_<base>`
- Each is defined with `Object.assign(ENEMIES, …)` and listed in `BOSS_VERSIONS`, which is appended to `ENEMY_ORDER`.
- Each has `boss:true`, `crown:true` and `intro:999`. Campaign generation excludes them (the pool filter is `!ENEMIES[k].boss`), so they appear only in labs.

| Boss | Base | HP | Armor | Speed | Leak | Special |
|---|---|---|---|---|---|---|
| Block King | grunt | 520 | 3 | 0.6 | 5 | Summons 3 grunts every 3.5 s |
| Dart Queen | scout | 300 | 1 | 1.35 | 5 | Summons 3 scouts every 3 s |
| Spore Mother | splitter | 480 | 0 | 0.6 | 5 | Summons 3 mites every 3 s; splits into 4 Spores on death |
| Fortress | brute | 700 | 10 | 0.42 | 6 | Summons 2 brutes every 6 s |
| Bastion | aegis | 420 | 0 | 0.55 | 5 | Dome r 2.6 tiles, 500 HP; summons 2 grunts every 4 s |
| Phantom | blink | 380 | 0 | 0.65 | 5 | Blinks 2.2 tiles every 2.4 s; summons 2 blinks every 5 s |
| Lifebloom | mender | 420 | 0 | 0.55 | 5 | Heals others 10% every 2 s in r 2.8 (not itself); summons 2 grunts every 4 s |
| Colossus | titan | 1100 | 9 | 0.33 | 8 | No summons |
| Stormwing | glider | 420 | 0 | 0.7 | 5 | Flying; summons 2 gliders every 4 s |
| Overload | volt | 420 | 0 | 0.75 | 5 | Electrified, elecR 2.5; summons 1 volt every 5 s |
| Frost Giant | yeti | 700 | 3 | 0.5 | 6 | Iced, iceR 3; summons 1 yeti every 7 s |
| Inferno | scorch | 480 | 0 | 0.7 | 5 | Fire, fireR 2.6, fireEvery 1.75; summons 1 scorch every 6 s |

### New per-enemy fields and code changes
- New fields: `elecR`, `iceR`, `fireR`, `fireEvery`, `summon.n`, `baseOf`.
- `elecReach(e)` now reads `e.rc.elecR`.
- `wardenPhase` now applies only to the type 'boss'.
- `isBossWave` accepts any boss.

### Bosses can carry modifiers
The existing authored-lab mods `{ shield, elec, ice, fire }` work on bosses; nothing excluded them in lab waves.

### Presentation
- **Spawn shout:** the boss name, with "BOSS" underneath.
- **Kill shout:** "<NAME> DOWN".
- **Boss bar:** shows the name, "NAME ×n", or "BOSSES ×n".
- **Crown:** `drawCrown` draws 7 spinning spikes at r×1.12–1.48 with a dashed halo at r×1.62.
- **Crowded level-card rows:** when icons are closer than 34 px, only the tapped enemy's name is shown.
- **Defeat tip:** a boss version uses its base enemy's tip.
- **Translations:** everything is in EN, ZH and ES, including names, descriptions, the new strings (`boss_word`, `boss_down`, `boss_down_gold`, `bosses_x`, `immune`), and updated EMP, ARC, Volt, elec_note, info_elec and volt tip text.

### Two new labs, 111 and 112
Both are boss labs with 25 waves, LEAN 50% economy and cal 0.28, with no Warden phases.

- **BOSS ZOO I** (`bosszoo`)
  - Map 74 (one lane), 420 gold.
  - Block King, Dart Queen, Spore Mother, Fortress, Bastion and Phantom appear one at a time.
  - They return with shield, fire, ice and elec modifiers.
  - Final wave: all 6.
- **BOSS ZOO II** (`bosszoo2`)
  - Map 78 (two lanes), 460 gold.
  - Lifebloom, Colossus, Stormwing (needs FLAK), Overload, Frost Giant and Inferno, plus Volt and electrified waves.
  - Modified-boss waves, and all 6 in the final wave.

## Verified
- All 14 existing tests pass, plus the new bosstest.js.
- **Spawn:** every boss spawns with the right shout and flags.
- **Boss mechanics:**
  - Block King summoned 6 grunts in 5 s.
  - Spore Mother burst into 4 Spores.
  - Fortress took 3.6 from a 12-damage hit.
  - Bastion's dome covered a grunt 2 tiles away.
  - Phantom jumped about 2 extra tiles.
  - Lifebloom healed the grunt from 0.5 to 0.7 while staying at 0.5 itself.
  - FLAK hit Stormwing and BOLT did not.
- **Overload:** it shut down a BOLT 2.24 tiles away. The EMP was not shut down, and ARC was supercharged.
- **Modifiers:** a shield, elec, ice and fire mod each work on a boss.
- **Plain Volt:** ARC never damaged it, though it hit the grunt next to it.
- **Full runs** (labrun.js, 26 maxed towers, huge lives):
  - Lab 11 was won with 0 leaks.
  - Lab 12 was won with 166 leaks; most came from gliders (39), brutes (34), Colossus (16), yetis and scorches.
  - Lab 12 is a hard stress test.
- **Screenshots:** the lab screen (12 cards fit), both lab cards, and all 12 bosses together.

## Publishing
- Artifact Version 44 (version id 1790798334-fe8d).
- GitHub: v41 was committed by the user. The v42 index.html and README.md are staged as "Shatterline v42: 12 new bosses, boss modifiers, ARC immunity, EMP holds", waiting for the user to say commit.
- Files are in `/home/claude/live/v42/`: patch18.py, bosstest.js, labrun.js.
