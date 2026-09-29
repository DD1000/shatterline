'use strict';
// =====================================================================
//  SHATTERLINE: a Glowforms tower defense
//  Everything on screen is drawn from "recipes" (plain numbers), not image files.
//  Add an enemy  -> add one line to ENEMIES (intro = first level it appears).
//  Add a tower   -> add one entry to TOWERS (unlock = first level you can bring it).
//  Add a world   -> add one entry to THEMES.   Levels live in 15_levels.js.
// =====================================================================

const W = 360;                 // logical playfield width (px)
const TILE = 40;               // tile size (px)
const COLS = 9, ROWS = 13;     // map grid
const HUD_H = 50, BAR_H = 78;  // top HUD + bottom control bar
const MIN_H = HUD_H + ROWS * TILE + BAR_H;
const LEVELS_PER_WORLD = 10;

// Title-screen showcase map
const DEMO_PATH = [[1,0],[1,2],[7,2],[7,5],[1,5],[1,8],[7,8],[7,10],[4,10],[4,12]];

// A world is just a palette. Every 10 levels you move to the next one.
const THEMES = [
  { name:'VOID',  bg:'#07060f', bg2:'#110d2a', grid:'#2a2358', tile:'rgba(130,110,255,0.05)', path:'#0f0b26', edge:'#5a48e0', flow:'#a08fff' },
  { name:'ABYSS', bg:'#020d16', bg2:'#06243a', grid:'#12425c', tile:'rgba(60,200,255,0.055)', path:'#03172a', edge:'#1f9fcc', flow:'#7ae8ff' },
  { name:'EMBER', bg:'#100505', bg2:'#2a0f07', grid:'#52200f', tile:'rgba(255,120,60,0.05)',  path:'#1a0705', edge:'#d84e20', flow:'#ffb07a' },
  { name:'CANDY', bg:'#12081a', bg2:'#2c1240', grid:'#522a70', tile:'rgba(255,140,220,0.06)', path:'#1e0c2e', edge:'#ff5fc8', flow:'#ffd6f2' },
  { name:'AURORA',  bg:'#03110f', bg2:'#06302a', grid:'#0f4a40', tile:'rgba(60,255,200,0.05)',  path:'#041a17', edge:'#19c8a0', flow:'#9dffe6' },
  { name:'SOLAR',   bg:'#110c02', bg2:'#2e2006', grid:'#4d3a0c', tile:'rgba(255,200,60,0.05)',  path:'#1a1203', edge:'#e0a21c', flow:'#ffe08a' },
  { name:'GLACIER', bg:'#060b12', bg2:'#15233a', grid:'#2d4561', tile:'rgba(200,230,255,0.06)', path:'#0b1522', edge:'#a9d4ff', flow:'#ffffff' },
  { name:'TOXIC',   bg:'#070d03', bg2:'#172a06', grid:'#2f4a0e', tile:'rgba(170,255,60,0.05)',  path:'#0c1604', edge:'#8ee01a', flow:'#e2ff8a' },
];

// ---- Enemy recipes -------------------------------------------------
// sides: 0 = circle, 3 = triangle, 4 = square...   star: spiky version
// r: radius px   spin: rad/s   point: face direction of travel
// inner: nested shape   orbit: # of satellites   eye: has an eye
// speed: tiles/s   hp/gold/armor are base values   leak: lives lost at the core
const ENEMIES = {
  grunt:    { name:'Block',   sides:4, r:9,   color:'#ff3d9a', speed:1.15, hp:34,  gold:4,  armor:0, leak:1, spin:0.8, eye:true, intro:1,
              desc:'The basic walker.' },
  scout:    { name:'Dart',    sides:3, r:7.5, color:'#8cff3d', speed:2.0,  hp:16,  gold:3,  armor:0, leak:1, spin:0, eye:true, point:true, trail:true, intro:2,
              desc:'Fast but fragile.' },
  splitter: { name:'Spore',   sides:0, r:11,  color:'#35ffb5', speed:0.95, hp:70,  gold:6,  armor:0, leak:1, spin:0, eye:true, orbit:3, split:{ type:'mite', n:3 }, intro:4,
              desc:'Splits into 3 Mites when destroyed.' },
  mite:     { name:'Mite',    sides:3, r:5,   color:'#35ffb5', speed:1.75, hp:12,  gold:1,  armor:0, leak:1, spin:3, child:true },
  brute:    { name:'Bulwark', sides:6, r:13,  color:'#a066ff', speed:0.72, hp:140, gold:11, armor:4, leak:2, spin:0.3, eye:true, thick:true, inner:{ sides:6, scale:0.55, spin:-0.6 }, intro:7,
              desc:'Armored. Small hits barely hurt it.' },
  boss:     { name:'Warden',  sides:5, star:true, r:22, color:'#ff2e4d', speed:0.5, hp:520, gold:120, armor:6, leak:5, spin:0.5, eye:true, boss:true, orbit:4, inner:{ sides:5, scale:0.45, spin:-1.2 }, intro:10,
              desc:'Boss. Heavy armor and huge health.' },
  aegis:    { name:'Aegis',   sides:5, r:11,  color:'#4aa8ff', speed:0.85, hp:80,  gold:10, armor:0, leak:1, spin:0.5, eye:true, intro:12, dome:{ r:1.6, hp:100 },
              desc:'Projects a dome that travels with it. Enemies inside take 20% damage. EMP pops it.' },
  blink:    { name:'Blink',   sides:4, r:8.5, color:'#f4f2ff', speed:0.9,  hp:44,  gold:8,  armor:0, leak:1, spin:0, eye:true, blink:{ every:3.0, dist:1.5 }, intro:16,
              desc:'Teleports forward every few seconds.' },
  mender:   { name:'Mender',  sides:0, r:10,  color:'#ff9ce0', speed:0.85, hp:60,  gold:10, armor:0, leak:1, spin:0, plus:true, heal:{ every:2.6, radius:1.8, pct:0.12 }, intro:21,
              desc:'Heals nearby enemies. Take it out first.' },
  glider:   { name:'Glider',  sides:3, r:9,   color:'#9fe8ff', speed:0.95, hp:36,  gold:5,  armor:0, leak:1, spin:0, eye:true, point:true, flying:true, intro:32,
              desc:'Flies straight over the path. Only FLAK can hit it.' },
  titan:    { name:'Titan',   sides:8, r:17,  color:'#ff8a3d', speed:0.45, hp:420, gold:28, armor:7, leak:3, spin:0.2, eye:true, thick:true, inner:{ sides:4, scale:0.5, spin:0.8 }, intro:25,
              desc:'Huge, slow and heavily armored.' },
};
const ENEMY_ORDER = ['grunt', 'scout', 'splitter', 'brute', 'boss', 'aegis', 'blink', 'mender', 'titan', 'glider'];

// ---- Tower recipes -------------------------------------------------
// lv[0] is the base tower, lv[1] and lv[2] are upgrades (with their own cost).
// range in tiles, rate = shots per second. unlock = first level you can bring it.
const TOWERS = {
  bolt:   { name:'BOLT',   color:'#2ef2ff', sides:4, cost:50,  crit:0.1, unlock:1, desc:'Rapid laser. Can crit.',
            lv:[ { dmg:6,  rate:2.8,  range:2.3 },
                 { cost:60,  dmg:10, rate:3.2,  range:2.5 },
                 { cost:120, dmg:16, rate:3.8,  range:2.8 } ] },
  frost:  { name:'FROST',  color:'#a3b8ff', sides:6, star:true, cost:70, unlock:3, pulse:true, desc:'Freezing pulse. Slows all nearby.',
            lv:[ { dmg:4,  rate:1.0, range:1.8, slow:0.35 },
                 { cost:80,  dmg:8,  rate:1.0, range:2.0, slow:0.45 },
                 { cost:140, dmg:14, rate:1.1, range:2.2, slow:0.55, brittle:true } ] },
  nova:   { name:'NOVA',   color:'#ff7a2e', sides:6, cost:110, unlock:6, desc:'Plasma bomb. Splash, pierces armor.',
            lv:[ { dmg:26, rate:0.52, range:3.0, splash:0.9 },
                 { cost:120, dmg:46, rate:0.57, range:3.2, splash:1.02 },
                 { cost:200, dmg:78, rate:0.63, range:3.5, splash:1.2 } ] },
  arc:    { name:'ARC',    color:'#ffe23d', sides:3, cost:85,  unlock:9, desc:'Lightning that chains between enemies.',
            lv:[ { dmg:14, rate:0.9,  range:2.3, chains:3 },
                 { cost:100, dmg:24, rate:1.0,  range:2.4, chains:4 },
                 { cost:170, dmg:38, rate:1.15, range:2.6, chains:6 } ] },
  mint:   { name:'MINT',   color:'#ffd23d', sides:6, cost:80,  unlock:13, eco:true, desc:'Pulses out gold while waves run.',
            lv:[ { gold:7,  every:3 },
                 { cost:90,  gold:11, every:2.5 },
                 { cost:140, gold:15, every:2 } ] },
  prism:  { name:'PRISM',  color:'#ff5cf0', sides:4, star:true, cost:120, unlock:17, desc:'Beam heats up on one target. Goes through armor and shields.',
            lv:[ { dps:16, range:2.3, heat:3 },
                 { cost:130, dps:27, range:2.5, heat:3.5 },
                 { cost:200, dps:44, range:2.7, heat:4 } ] },
  rail:   { name:'RAIL',   color:'#6dff8e', sides:4, cost:130, unlock:22, line:true, desc:'Fires down one fixed line, piercing all on it.',
            lv:[ { dmg:64,  rate:0.46, range:4.5 },
                 { cost:140, dmg:116, rate:0.5,  range:5.0 },
                 { cost:210, dmg:196, rate:0.55, range:5.5 } ] },
  beacon: { name:'BEACON', color:'#f4f0ff', sides:8, cost:90, unlock:27, support:true, desc:'Boosts damage of towers next to it.',
            lv:[ { buff:0.3,  range:1.5 },
                 { cost:100, buff:0.5,  range:1.5 },
                 { cost:160, buff:0.75, range:2.3 } ] },
};
TOWERS.flak = { name:'FLAK', color:'#ff6f61', sides:3, cost:90, unlock:32, air:true, desc:'Anti-air missiles. The only tower that hits flyers.',
            lv:[ { dmg:16, rate:1.3, range:3.2, splash:0.6 },
                 { cost:100, dmg:28, rate:1.5, range:3.5, splash:0.7 },
                 { cost:160, dmg:46, rate:1.8, range:3.8, splash:0.8 } ] };
TOWERS.emp = { name:'EMP', color:'#3d7bff', sides:5, cost:75, unlock:12, shieldBreak:true, pulse:true, desc:'Strips every shield that passes through its field, for good.',
            lv:[ { dmg:4,  rate:0.8, range:2.0 },
                 { cost:85,  dmg:8,  rate:0.9, range:2.3 },
                 { cost:140, dmg:14, rate:1.0, range:2.6 } ] };
// Shields shrug off ordinary hits: only 20% of normal damage gets into a shield.
// Two kinds: personal shields (random enemy types per level, worth 60% of their HP)
// and the Aegis dome (covers every ground enemy near the Aegis while it lives).
// EMP strips both for good the moment they cross its field; PRISM's beam goes straight through.
// Light shield levels use thinner shields (25% of HP) so you can get by without a shield buster.
const SHIELD_FACTOR = 0.2, SHIELD_PCT = 0.6, SHIELD_PCT_LIGHT = 0.25;
const TOWER_ORDER = ['bolt', 'frost', 'nova', 'arc', 'emp', 'mint', 'prism', 'rail', 'beacon', 'flak'];

// ---- Level conditions ------------------------------------------------
// NO BOUNTY: enemies drop no gold (Mint is your income). AIR RAID: Gliders fly in (only FLAK hits them).
const NO_BOUNTY_LEVELS = [14, 23, 29, 36, 43, 48, 55, 62, 67, 74, 79];
const AIR_LEVELS = [32, 34, 38, 41, 44, 46, 50, 53, 57, 60, 64, 66, 69, 72, 75, 78, 80];
const CONDITIONS = {
  noBounty: { tag:'NO BOUNTY', color:'#ffd23d', need:'mint', line:'Enemies drop no gold. MINT is your only income.' },
  air:      { tag:'AIR RAID',  color:'#9fe8ff', need:'flak', line:'Gliders fly over the path. Only FLAK can hit them.' },
  shielded: { tag:'HEAVY SHIELDS', color:'#4aa8ff', need:['emp', 'prism'], line:'Lots of shielded enemies. Bring EMP or PRISM.' },
};
const slotsFor = level => level >= 20 ? 4 : 3;     // loadout slots
const SLOT_UNLOCK_LEVEL = 20;

// ---- Economy -------------------------------------------------------
const ECON = {
  startLives: 10, sellRate: 0.7,
  hpScale: 1,             // global difficulty knob (1.2 = 20% tougher enemies)
  nextDelay: 12,          // seconds before the next wave auto-starts
  earlyBonus: 1.5,        // gold per second left when you call a wave early
  clearBonus: w => 6 + 2 * w,
  groupGap: 1.4,
};
// Stars: 3 = no lives lost, 2 = lost 3 or fewer, 1 = survived
const starsForLives = (lives, max) => lives <= 0 ? 0 : lives >= max ? 3 : lives >= max - 3 ? 2 : 1;
