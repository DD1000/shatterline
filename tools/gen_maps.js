// Offline map generator: produces candidate paths for 40 levels.
// Rule: path tiles never touch earlier path tiles (8-neighborhood), so every
// pair of lanes has at least one buildable row/column between them.
const COLS = 9, ROWS = 13;
function rng(seed) { let s = (seed >>> 0) || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
const key = (c, r) => r * COLS + c;
const cheb = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));

function compress(tiles) {
  const out = [tiles[0]];
  for (let i = 1; i < tiles.length - 1; i++) {
    const a = tiles[i - 1], b = tiles[i], c = tiles[i + 1];
    if (b[0] - a[0] !== c[0] - b[0] || b[1] - a[1] !== c[1] - b[1]) out.push(b);
  }
  out.push(tiles[tiles.length - 1]);
  return out;
}
function turns(tiles) { return compress(tiles).length - 2; }

function okTile(t, tiles, avoid) {
  if (t[0] < 0 || t[1] < 0 || t[0] >= COLS || t[1] >= ROWS) return false;
  const i = tiles.length;
  for (let j = 0; j <= i - 3; j++) if (cheb(t, tiles[j]) < 2) return false;
  if (i >= 2 && t[0] === tiles[i - 2][0] && t[1] === tiles[i - 2][1]) return false;
  if (avoid) for (const a of avoid) if (cheb(t, a) < 2) return false;
  return true;
}

function genMain(R, o) {
  for (let attempt = 0; attempt < 400; attempt++) {
    let start, dir;
    const s = R();
    if (s < 0.6) { start = [1 + Math.floor(R() * 7), 0]; dir = [0, 1]; }
    else if (s < 0.8) { start = [0, Math.floor(R() * 4)]; dir = [1, 0]; }
    else { start = [COLS - 1, Math.floor(R() * 4)]; dir = [-1, 0]; }
    const tiles = [start];
    let budget = 4000;
    const rec = (d, first) => {
      if (--budget <= 0) return false;
      const last = tiles[tiles.length - 1];
      if (tiles.length >= o.min && last[1] >= ROWS - 3 && last[0] >= 1 && last[0] <= COLS - 2 && turns(tiles) >= o.minTurns) return true;
      if (tiles.length >= o.max) return false;
      let dirs;
      if (d[1] !== 0) dirs = R() < 0.5 ? [[1, 0], [-1, 0]] : [[-1, 0], [1, 0]];          // after vertical: go sideways
      else dirs = R() < 0.9 ? [[0, 1], [0, -1]] : [[0, -1], [0, 1]];                        // after sideways: mostly down
      if (first) dirs.unshift(d);
      for (const nd of dirs) {
        const lens = nd[1] !== 0 ? (first ? [1, 2, 3] : [2, 3, 2, 4]) : [3, 4, 5, 6, 7, 8];
        lens.sort(() => R() - 0.5);
        for (const L of new Set(lens)) {
          const added = [];
          let ok = true;
          for (let k = 1; k <= L; k++) {
            const p = tiles[tiles.length - 1], t = [p[0] + nd[0], p[1] + nd[1]];
            if (!okTile(t, tiles)) { ok = false; break; }
            tiles.push(t); added.push(t);
          }
          if (ok && rec(nd, false)) return true;
          tiles.length -= added.length;
        }
      }
      return false;
    };
    if (rec(dir, true)) return tiles;
  }
  return null;
}

function coverage(all) {
  const onPath = new Set(all.map(t => key(t[0], t[1])));
  let build = 0, near = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (onPath.has(key(c, r))) continue;
    build++;
    if (all.some(t => cheb(t, [c, r]) <= 1)) near++;
  }
  return near / build;
}

// a second lane from another edge that merges into the main lane
function genBranch(R, main, o) {
  const mainKey = new Map(main.map((t, i) => [key(t[0], t[1]), i]));
  for (let attempt = 0; attempt < 400; attempt++) {
    let start, dir;
    const s = R();
    const ms = main[0];
    if (s < 0.5) { start = [ms[0] < 4 ? 5 + Math.floor(R() * 3) : 1 + Math.floor(R() * 3), 0]; dir = [0, 1]; }
    else if (s < 0.75) { start = [0, 2 + Math.floor(R() * 6)]; dir = [1, 0]; }
    else { start = [COLS - 1, 2 + Math.floor(R() * 6)]; dir = [-1, 0]; }
    if (main.some(t => cheb(t, start) < 2)) continue;
    const tiles = [start];
    let budget = 2000, join = -1;
    const rec = (d) => {
      if (--budget <= 0) return false;
      if (tiles.length > o.bmax) return false;
      const dirs = [d, [d[1], -d[0]], [-d[1], d[0]]].sort(() => R() - 0.5);
      for (const nd of dirs) {
        const lens = [1, 2, 3, 4, 5].sort(() => R() - 0.5);
        for (const L of lens) {
          const added = [];
          let ok = true, joined = false;
          for (let k = 1; k <= L; k++) {
            const p = tiles[tiles.length - 1], t = [p[0] + nd[0], p[1] + nd[1]];
            const inb = q => q[0] >= 0 && q[1] >= 0 && q[0] < COLS && q[1] < ROWS;
            const mi = inb(t) ? mainKey.get(key(t[0], t[1])) : undefined;
            if (mi != null) {
              // join straight into the main lane, in its middle part
              const near = main.filter(m => cheb(m, p) < 2).map(m => mainKey.get(key(m[0], m[1])));
              if (tiles.length >= o.bmin && mi >= main.length * 0.3 && mi <= main.length * 0.75 && near.every(x => Math.abs(x - mi) <= 1)) { join = mi; joined = true; }
              ok = false; break;
            }
            if (!okTile(t, tiles, main.filter(m => true))) {
              // allow the tile right before the join to be next to the main lane
              const t2 = [t[0] + nd[0], t[1] + nd[1]], mi2 = inb(t2) ? mainKey.get(key(t2[0], t2[1])) : undefined;
              const selfOk = okTile(t, tiles, null);
              const nearMain = main.filter(m => cheb(m, t) < 2).map(m => mainKey.get(key(m[0], m[1])));
              if (selfOk && mi2 != null && tiles.length + 1 >= o.bmin && mi2 >= main.length * 0.3 && mi2 <= main.length * 0.75 && nearMain.every(x => Math.abs(x - mi2) <= 1)) {
                tiles.push(t); added.push(t); join = mi2; joined = true;
              }
              ok = false; break;
            }
            tiles.push(t); added.push(t);
          }
          if (joined) return true;
          if (ok && rec(nd)) return true;
          tiles.length -= added.length;
        }
      }
      return false;
    };
    if (rec(dir) && join >= 0) return { tiles, join };
  }
  return null;
}

function score(main, br) {
  // prefer maps with some "hot" tiles that see a lot of path within 2 tiles
  let best = 0;
  const all = br ? main.concat(br.tiles) : main;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (all.some(t => t[0] === c && t[1] === r)) continue;
    const n = all.filter(t => (t[0] - c) ** 2 + (t[1] - r) ** 2 <= 2.3 * 2.3).length;
    best = Math.max(best, n);
  }
  return best;
}

const out = [];
// usage: node gen_maps.js out.json [firstLevel] [lastLevel]
const FIRST = +(process.argv[3] || 1), LAST = +(process.argv[4] || 40);
for (let L = FIRST; L <= LAST; L++) {
  const two = L > 40 ? [0, 2, 3].includes(L % 5) : L >= 15 && (L % 3 === 0 || L >= 37 || L === 35 || L === 32);
  const o = two ? { min: 20, max: 30, minTurns: 3, bmin: 5, bmax: 14 } :
    L <= 5 ? { min: 26, max: 36, minTurns: 4 } : L <= 20 ? { min: 24, max: 34, minTurns: 4 } : { min: 22, max: 32, minTurns: 5 };
  let pick = null, bestQ = -1;
  for (let seed = L * 1000 + 1; seed < L * 1000 + 60; seed++) {
    const R = rng(seed);
    const main = genMain(R, o);
    if (!main) continue;
    let br = null;
    if (two) { br = genBranch(R, main, o); if (!br) continue; }
    const sc = score(main, br);
    if (sc < 7 || sc > 14) continue;
    const all = br ? main.concat(br.tiles) : main;
    const q = coverage(all) + rng(seed * 7)() * 0.08 - (main[0][1] === 0 && main[0][0] >= 7 ? 0.05 : 0);
    if (q > bestQ) { bestQ = q; pick = { L, seed, main, br, sc, q }; }
  }
  if (!pick) { console.error('no map for', L); continue; }
  const rec = { L, seed: pick.seed, q: +pick.q.toFixed(2), len: pick.main.length, turns: turns(pick.main), hot: pick.sc, p: compress(pick.main) };
  if (pick.br) { rec.b = compress(pick.br.tiles); rec.j = pick.br.join; rec.blen = pick.br.tiles.length; }
  out.push(rec);
}
require('fs').writeFileSync(process.argv[2] || 'maps.json', JSON.stringify(out));
console.log(out.map(m => `L${m.L} q${m.q} seed${m.seed} len${m.len} turns${m.turns} hot${m.hot}${m.b ? ' branch' + m.blen + '@' + m.j : ''}`).join('\n'));
