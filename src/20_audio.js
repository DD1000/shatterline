// =====================================================================
//  AUDIO: every sound is synthesized live with WebAudio (no files)
// =====================================================================
const Sound = (() => {
  let ac = null, master, sfx, music, bassF, arpF, noiseBuf;
  let muted = false, enabled = true;
  const last = {};

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    ac = new AC();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4;
    comp.attack.value = 0.003; comp.release.value = 0.18;
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.85;
    master.connect(comp); comp.connect(ac.destination);
    sfx = ac.createGain(); sfx.gain.value = 0.9; sfx.connect(master);
    music = ac.createGain(); music.gain.value = 0.3; music.connect(master);
    bassF = ac.createBiquadFilter(); bassF.type = 'lowpass'; bassF.frequency.value = 520; bassF.Q.value = 5; bassF.connect(music);
    arpF = ac.createBiquadFilter(); arpF.type = 'lowpass'; arpF.frequency.value = 2400; arpF.connect(music);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function ok(key, gapMs) {
    const n = performance.now();
    if (last[key] && n - last[key] < gapMs) return false;
    last[key] = n; return true;
  }

  function tone({ type = 'sine', f0, f1 = f0, dur = 0.1, vol = 0.2, at = 0, bus = sfx, attack = 0.004 }) {
    const t = ac.currentTime + Math.max(0, at);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.03);
    if (window.__sfxLog && (bus === sfx || bus === mel)) window.__sfxLog.push({ t, f0, f1 });     // test hook
  }

  function noise({ dur = 0.1, vol = 0.2, type = 'bandpass', f0 = 1000, f1 = f0, q = 1, at = 0, bus = sfx, attack = 0.002 }) {
    const t = ac.currentTime + Math.max(0, at);
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.03);
  }

  // ---- Prism beam: an electrical hum with vibrato locked to the beat ---------------------------
  // A buzzy sawtooth + square pair on the root of the chord that's playing (it glides when the
  // chord changes), pushed through a resonant band so it sounds like a live power line, with a
  // little crackle on top. The vibrato is scheduled on the music's 16th-note grid, so the wobble
  // pulses in time with the song, and each beat gets a small swell. As the beam heats up the
  // hum gets brighter and crackles more. One shared voice for all Prisms; it fades when none fire.
  const HUM = { v: null, upd: -1, h: 0, cents: 24, vibFrom: 0 };
  function humVoice() {
    if (HUM.v) return HUM.v;
    const out = ac.createGain(); out.gain.value = 0.0001;
    const accent = ac.createGain(); accent.gain.value = 1;                // swell on each beat
    // dull and heavy: a low-shelf boost for weight, a warm low-mid bump, and a low, slightly resonant lowpass
    const band = ac.createBiquadFilter(); band.type = 'lowshelf'; band.frequency.value = 180; band.gain.value = 5;
    const body = ac.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 260; body.Q.value = 1.4; body.gain.value = 5;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650; lp.Q.value = 2.2;
    const vib = ac.createConstantSource ? ac.createConstantSource() : null;   // vibrato, in cents
    // sawtooth on the root for the buzz, plus a sine an octave below for the low end
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(), g1 = ac.createGain(), g2 = ac.createGain();
    o1.type = 'sawtooth'; o2.type = 'sine'; g1.gain.value = 0.6; g2.gain.value = 0.4;
    o1.connect(g1); o2.connect(g2); g1.connect(band); g2.connect(band); band.connect(body); body.connect(lp); lp.connect(accent); accent.connect(out); out.connect(sfx);
    if (vib) { vib.offset.value = 0; vib.connect(o1.detune); vib.connect(o2.detune); vib.start(); }
    // crackle: bright noise whose level jitters every update
    const nz = ac.createBufferSource(); nz.buffer = noiseBuf; nz.loop = true;
    const nf2 = ac.createBiquadFilter(); nf2.type = 'bandpass'; nf2.frequency.value = 1800; nf2.Q.value = 1.2;
    const ng = ac.createGain(); ng.gain.value = 0; nz.connect(nf2); nf2.connect(ng); ng.connect(accent);
    o1.start(); o2.start(); nz.start();
    return (HUM.v = { out, accent, lp, vib, o1, o2, ng });
  }
  // called for every 16th the music schedules: one vibrato cycle per 16th, a swell on each beat
  function humStep(t, st, spb) {
    const v = HUM.v; if (!v) return;
    if (v.vib) {
      const p = v.vib.offset, d = HUM.cents;
      if (t < HUM.vibFrom) return;
      if (!HUM.vibFrom) p.setValueAtTime(-d, t); else p.linearRampToValueAtTime(-d, t);
      p.linearRampToValueAtTime(d, t + spb / 2);
      HUM.vibFrom = t;
    }
    if (st % 4 === 0) { v.accent.gain.setValueAtTime(1.25, t); v.accent.gain.linearRampToValueAtTime(0.85, t + spb * 3.8); }
  }
  function hum(h) {
    const v = humVoice(), now = ac.currentTime;
    HUM.h = Math.max(HUM.h, h || 0);
    if (now - HUM.upd < 0.03) return;                 // refresh ~30 times a second
    HUM.upd = now; h = HUM.h; HUM.h = 0;
    const root = grid(0).ch[0], f = nf(root, -2);    // the chord's root, two octaves down
    v.o1.frequency.setTargetAtTime(f, now, 0.04); v.o2.frequency.setTargetAtTime(f / 2, now, 0.04);
    v.lp.frequency.setTargetAtTime(600 + 500 * h, now, 0.1);                   // stays dull, opens a little when hot
    v.ng.gain.setTargetAtTime((0.006 + 0.014 * h) * Math.random(), now, 0.01); // faint crackle
    const g = v.out.gain;                             // hold while firing, fade out once calls stop
    g.cancelScheduledValues(now); g.setValueAtTime(Math.max(0.0001, g.value), now);
    g.setTargetAtTime(0.085, now, 0.03);
    g.setTargetAtTime(0.0001, now + 0.12, 0.06);
  }

  // ---- Sound effects that play along with the music ------------------------------------------
  // Every pitched effect uses notes of the chord that's playing right now, and most effects land
  // on the music's grid: shots on 16ths, hits on 32nds, gold pulses on 8ths, big moments on the
  // beat. Menu taps stay instant but still use chord notes. Only one sound per instrument per grid
  // slot, so a crowd of towers turns into a groove instead of noise.
  const nf = (semi, oct = 0) => 440 * Math.pow(2, semi / 12 + oct);          // semitones from A4
  function grid(div) {                         // div 32/16/8/4 → { at: seconds from now, ch: chord }
    const now = ac.currentTime;
    if (!seq.on) return { at: 0, ch: song().chords[0] };
    const spb16 = spbNow(), sNow = seq.step - (seq.next - now - 0.004) / spb16;
    if (!div) return { at: 0, ch: song().chords[Math.floor(Math.max(0, sNow) / 16) % 4] };
    const u = 16 / div, st = Math.ceil(sNow / u - 1e-6) * u;
    return { at: Math.max(0, seq.next - (seq.step - st) * spb16 - now), ch: song().chords[Math.floor(st / 16) % 4] };
  }
  const slotLast = {};
  function slot(key, at, max = 1) {            // voice limit per instrument per grid slot
    const t = Math.round((ac.currentTime + at) * 200), o = slotLast[key];
    if (o && o.t === t) return ++o.n <= max;
    slotLast[key] = { t, n: 1 }; return true;
  }
  let cyc = 0;
  const pick = ch => ch[(cyc++) % ch.length];
  const sixteenth = () => seq.on ? spbNow() : 0.035;

  const fx = {
    bolt()  {                                  // a plucky chord-tone blip on the next 16th
      if (!ok('bolt', 30)) return; const g = grid(16); if (!slot('bolt', g.at)) return;
      const f = nf(pick(g.ch), 1); tone({ type:'square', f0:f, f1:f / 2, dur:0.07, vol:0.04, at:g.at });
    },
    hit()   { if (!ok('hit', 25)) return; const g = grid(32); if (!slot('hit', g.at)) return; noise({ dur:0.03, vol:0.06, type:'highpass', f0:5200, at:g.at }); },
    crit()  {
      if (!ok('crit', 50)) return; const g = grid(32); if (!slot('crit', g.at)) return;
      const f = nf(g.ch[2], 2); tone({ type:'square', f0:f, f1:f / 2, dur:0.07, vol:0.05, at:g.at }); tone({ type:'sine', f0:nf(g.ch[0], 3), dur:0.1, vol:0.04, at:g.at + 0.03 });
    },
    arc()   {
      if (!ok('arc', 50)) return; const g = grid(16); if (!slot('arc', g.at)) return;
      noise({ dur:0.16, vol:0.2, type:'bandpass', f0:3000, f1:1100, q:3, at:g.at });
      const f = nf(g.ch[0], -2); tone({ type:'sawtooth', f0:f, f1:f * 0.75, dur:0.14, vol:0.07, at:g.at });
    },
    launch(){                                  // nova shell: a pitched thump on the root
      if (!ok('launch', 50)) return; const g = grid(16); if (!slot('launch', g.at)) return;
      const f = nf(g.ch[0], -1); tone({ type:'sine', f0:f, f1:f / 4, dur:0.15, vol:0.22, at:g.at }); noise({ dur:0.07, vol:0.07, type:'lowpass', f0:900, at:g.at });
    },
    boom(big) {
      if (!big && !ok('boom', 50)) return; const g = grid(big ? 0 : 16); if (!big && !slot('boom', g.at, 2)) return;
      noise({ dur: big ? 0.9 : 0.4, vol: big ? 0.6 : 0.3, type:'lowpass', f0:2600, f1:110, q:0.7, at:g.at });
      const f = nf(g.ch[0], -3); tone({ type:'sine', f0: big ? f * 2 : f * 2.4, f1:f * 0.6, dur: big ? 0.8 : 0.32, vol: big ? 0.6 : 0.3, at:g.at });
    },
    frost() {
      if (!ok('frost', 80)) return; const g = grid(16); if (!slot('frost', g.at)) return;
      tone({ type:'sine', f0:nf(g.ch[2], 2), dur:0.26, vol:0.045, at:g.at }); tone({ type:'sine', f0:nf(g.ch[0], 3), dur:0.2, vol:0.03, at:g.at + 0.03 });
      noise({ dur:0.2, vol:0.04, type:'highpass', f0:6500, at:g.at });
    },
    coin()   {                                 // gold: chord-tone chimes climbing as coins pour in
      if (!ok('coin', 30)) return; const g = grid(16); if (!slot('coin', g.at, 2)) return;
      const n = pick(g.ch); tone({ type:'sine', f0:nf(n, 2), dur:0.07, vol:0.055, at:g.at }); tone({ type:'sine', f0:nf(n, 3), dur:0.12, vol:0.03, at:g.at + 0.04 });
    },
    build()  {
      const g = grid(32), sp = sixteenth() / 2;
      [g.ch[0], g.ch[1], g.ch[2], g.ch[0] + 12].forEach((n, i) => tone({ type:'square', f0:nf(n, 1), dur:0.09, vol:0.05, at:g.at + i * sp }));
      noise({ dur:0.18, vol:0.14, type:'lowpass', f0:900, f1:180, at:g.at });
    },
    upgrade(){
      const g = grid(32), sp = sixteenth() / 2;
      [g.ch[0], g.ch[1], g.ch[2], g.ch[0] + 12, g.ch[1] + 12].forEach((n, i) => tone({ type:'square', f0:nf(n, 1), dur:0.1, vol:0.05, at:g.at + i * sp }));
      tone({ type:'sine', f0:nf(g.ch[2], 3), dur:0.32, vol:0.04, at:g.at + 5 * sp });
    },
    sell()   { const g = grid(32), sp = sixteenth() / 2; [g.ch[2] + 12, g.ch[1] + 12, g.ch[0] + 12].forEach((n, i) => tone({ type:'triangle', f0:nf(n, 1), dur:0.09, vol:0.1, at:g.at + i * sp })); },
    leak()   { const g = grid(16), f = nf(g.ch[0], -2); tone({ type:'sawtooth', f0:f * 1.5, f1:f / 2, dur:0.42, vol:0.22, at:g.at }); noise({ dur:0.32, vol:0.2, type:'lowpass', f0:700, f1:90, at:g.at }); },
    wave()   { const g = grid(4), f = nf(g.ch[0], -2); noise({ dur:0.65, vol:0.12, type:'bandpass', f0:260, f1:3200, q:2, at:g.at }); tone({ type:'sawtooth', f0:f, f1:f * 4, dur:0.55, vol:0.07, at:g.at }); },
    boss()   {
      const g = grid(4), b = spbNow() * 4;
      for (let i = 0; i < 3; i++) { tone({ type:'sawtooth', f0:nf(0, -1), f1:nf(7, -1), dur:b * 0.7, vol:0.09, at:g.at + i * b }); tone({ type:'sawtooth', f0:nf(7, -1), f1:nf(0, -1), dur:b * 0.25, vol:0.07, at:g.at + i * b + b * 0.7 }); }
      tone({ type:'sine', f0:55, dur:1.3, vol:0.3, at:g.at });
    },
    bossDie(){
      fx.boom(true); const g = grid(8), sp = sixteenth();
      const ch = g.ch, notes = [ch[0], ch[1], ch[2], ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24];
      notes.forEach((n, i) => tone({ type:'triangle', f0:nf(n, 1), dur:0.26, vol:0.08, at:g.at + 0.1 + i * sp }));
    },
    combo(level) {
      const g = grid(8);                         // chord stab on the next 8th, an octave up for bigger milestones
      g.ch.forEach(n => tone({ type:'square', f0:nf(n, 1 + (level >= 2 ? 1 : 0)), dur:0.24, vol:0.045, at:g.at }));
      tone({ type:'sine', f0:nf(g.ch[0], 2 + (level >= 3 ? 1 : 0)), dur:0.4, vol:0.04, at:g.at + 0.08 });
    },
    clear()  { const g = grid(4), sp = sixteenth(); [g.ch[0], g.ch[1], g.ch[2], g.ch[0] + 12].forEach((n, i) => tone({ type:'triangle', f0:nf(n, 1), dur:0.18, vol:0.08, at:g.at + i * sp })); },
    tap()    { if (!ok('tap', 40)) return; const g = grid(0), f = nf(g.ch[2], 1); tone({ type:'sine', f0:f * 2, f1:f * 1.5, dur:0.045, vol:0.05 }); },
    deny()   { if (!ok('deny', 120)) return; const g = grid(0), f = nf(g.ch[0], -2); tone({ type:'square', f0:f * 1.5, f1:f, dur:0.12, vol:0.06 }); },
    lose()   { tone({ type:'sawtooth', f0:220, f1:38, dur:1.5, vol:0.24 }); noise({ dur:1.3, vol:0.35, type:'lowpass', f0:3000, f1:70 }); },
    rail()   {
      if (!ok('rail', 60)) return; const g = grid(16); if (!slot('rail', g.at)) return;
      noise({ dur:0.3, vol:0.28, type:'bandpass', f0:5000, f1:600, q:1.5, at:g.at });
      tone({ type:'sawtooth', f0:nf(g.ch[2], 2), f1:nf(g.ch[0], -2), dur:0.28, vol:0.09, at:g.at });
      const f = nf(g.ch[0], -2); tone({ type:'sine', f0:f, f1:f / 2, dur:0.25, vol:0.25, at:g.at });
    },
    beam(h)  { hum(h); },
    blink()  { if (!ok('blink', 60)) return; const g = grid(32); if (!slot('blink', g.at)) return; const f = nf(pick(g.ch), 2); tone({ type:'sine', f0:f, f1:f / 4, dur:0.12, vol:0.055, at:g.at }); noise({ dur:0.08, vol:0.045, type:'highpass', f0:5000, at:g.at }); },
    heal()   { if (!ok('heal', 160)) return; const g = grid(16); tone({ type:'sine', f0:nf(g.ch[0], 1), f1:nf(g.ch[2], 1), dur:0.25, vol:0.05, at:g.at }); tone({ type:'sine', f0:nf(g.ch[2], 1), f1:nf(g.ch[0], 2), dur:0.25, vol:0.04, at:g.at + 0.08 }); },
    shield() { if (!ok('shield', 70)) return; const g = grid(32); if (!slot('shield', g.at)) return; noise({ dur:0.25, vol:0.2, type:'highpass', f0:2500, f1:6000, at:g.at }); tone({ type:'triangle', f0:nf(g.ch[0], 3), f1:nf(g.ch[0], 2), dur:0.2, vol:0.06, at:g.at }); },
    mint()   {                                 // gold generating: a chord arpeggio on the next 8th
      if (!ok('mint', 40)) return; const g = grid(8); if (!slot('mint', g.at, 2)) return; const sp = sixteenth() / 2;
      [g.ch[0], g.ch[1], g.ch[2]].forEach((n, i) => tone({ type:'sine', f0:nf(n, 2), dur:0.1, vol:0.05, at:g.at + i * sp }));
    },
    flak()   { if (!ok('flak', 50)) return; const g = grid(16); if (!slot('flak', g.at)) return; noise({ dur:0.16, vol:0.13, type:'bandpass', f0:900, f1:2600, q:1.4, at:g.at }); const f = nf(pick(g.ch), -1); tone({ type:'triangle', f0:f, f1:f * 2, dur:0.1, vol:0.05, at:g.at }); },
    flakHit(){ if (!ok('flakHit', 40)) return; const g = grid(32); if (!slot('flakHit', g.at)) return; noise({ dur:0.14, vol:0.17, type:'lowpass', f0:3200, f1:400, at:g.at }); const f = nf(pick(g.ch), 1); tone({ type:'square', f0:f, f1:f / 2, dur:0.06, vol:0.04, at:g.at }); },
    emp()    {
      if (!ok('emp', 70)) return; const g = grid(16); if (!slot('emp', g.at)) return;
      noise({ dur:0.22, vol:0.17, type:'bandpass', f0:600, f1:4200, q:3, at:g.at });
      const f = nf(g.ch[0], -3); tone({ type:'square', f0:f, f1:f * 2, dur:0.18, vol:0.06, at:g.at }); tone({ type:'sine', f0:nf(g.ch[2], 2), f1:nf(g.ch[2], 1), dur:0.12, vol:0.04, at:g.at + 0.03 });
    },
    snow()   {                                 // a soft snowball thump with a chord-tone glint
      if (!ok('snow', 120)) return; const g = grid(16); if (!slot('snow', g.at)) return;
      noise({ dur:0.14, vol:0.07, type:'bandpass', f0:1400, f1:500, q:0.9, at:g.at });
      tone({ type:'sine', f0:nf(pick(g.ch), 2), f1:nf(g.ch[0], 1), dur:0.12, vol:0.035, at:g.at });
    },
    freeze() {                                 // frozen solid: an icy chime
      if (!ok('freeze', 90)) return; const g = grid(32); if (!slot('freeze', g.at)) return;
      tone({ type:'triangle', f0:nf(g.ch[2], 3), dur:0.22, vol:0.05, at:g.at }); tone({ type:'sine', f0:nf(g.ch[0], 3), dur:0.3, vol:0.04, at:g.at + 0.04 });
      noise({ dur:0.18, vol:0.08, type:'highpass', f0:7000, at:g.at });
    },
    short()  {                                 // a tower shorts out: a falling buzz
      if (!ok('short', 150)) return; const g = grid(16);
      noise({ dur:0.2, vol:0.12, type:'bandpass', f0:2400, f1:300, q:2, at:g.at });
      const f = nf(g.ch[0], -2); tone({ type:'square', f0:f * 2, f1:f / 2, dur:0.25, vol:0.05, at:g.at });
    },
    charge() {                                 // ARC or FROST supercharged: a rising zap and two chord notes
      if (!ok('charge', 150)) return; const g = grid(16);
      noise({ dur:0.2, vol:0.1, type:'bandpass', f0:600, f1:4000, q:2, at:g.at });
      [g.ch[0], g.ch[2]].forEach((n, i) => tone({ type:'square', f0:nf(n, 1), dur:0.08, vol:0.04, at:g.at + i * sixteenth() / 2 }));
    },
    unlock() { const g = grid(0); [g.ch[0], g.ch[1], g.ch[2], g.ch[0] + 12, g.ch[1] + 12, g.ch[2] + 12].forEach((n, i) => tone({ type:'square', f0:nf(n, 1), dur:0.16, vol:0.05, at:i * 0.07 })); tone({ type:'sine', f0:nf(g.ch[0], 3), dur:0.6, vol:0.05, at:0.42 }); },
    star(i)  { const f = [1047, 1319, 1568][i] || 1568; tone({ type:'triangle', f0:f, dur:0.25, vol:0.12 }); tone({ type:'sine', f0:f * 2, dur:0.3, vol:0.05, at:0.03 }); noise({ dur:0.15, vol:0.08, type:'highpass', f0:6000 }); },
    pop()    { tone({ type:'sine', f0:523, f1:1047, dur:0.12, vol:0.1 }); noise({ dur:0.1, vol:0.06, type:'highpass', f0:3000 }); },
    swoosh() { if (!ok('swoosh', 120)) return; noise({ dur:0.22, vol:0.08, type:'bandpass', f0:600, f1:2400, q:1.2 }); },
    win()    { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone({ type:'square', f0:f, dur:0.2, vol:0.055, at:i * 0.11 })); },
    kill(combo) {
      if (!ok('kill', 30)) return;
      noise({ dur:0.06, vol:0.09, type:'highpass', f0:4200 });          // instant crack
      killNote(combo);                                                   // the note joins the song
    },
  };

  function play(name, ...args) {
    if (!ac || muted || !enabled || ac.state !== 'running') return;
    try { fx[name](...args); } catch (e) { if (window.__TD_DEBUG) console.error('sound ' + name, e.message); }
  }

  // ---- Music: a step sequencer that follows the fight ---------------------------------
  // `int` (0..1) rises as the wave swells (later, bigger waves and more enemies on screen):
  // layers join, the filter opens, the beat speeds up and the pads pump against the kick.
  // While a boss is alive the boss theme takes over at full power: darker chords, faster,
  // heavier bass, a lead line and snare rolls.
  const SONGS = {
    main: { chords: [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]], roots: [0, -4, 3, -2] },     // Am  F  C  G
    boss: { chords: [[0, 3, 7], [1, 5, 8], [-2, 2, 5], [-5, -1, 2]], roots: [0, 1, -2, -5] },      // Am  Bb G  E
  };
  const BOSS_LEAD = [12, null, 15, 12, 19, null, 17, 15, 13, null, 12, 10, 11, null, 14, null];   // per 8th, per bar pair
  const seq = { on:false, next:0, step:0, timer:null, int:0, target:0, boss:false, bpm:100, slots:{} };
  let pump = null, padF = null, echo = null, echoFb = null, mel = null;
  function musicBus() {
    if (pump) return;
    pump = ac.createGain(); pump.gain.value = 1; pump.connect(music);                // sidechain pump
    bassF.disconnect(); bassF.connect(pump); arpF.disconnect(); arpF.connect(pump);
    padF = ac.createBiquadFilter(); padF.type = 'lowpass'; padF.frequency.value = 700; padF.Q.value = 0.7; padF.connect(pump);
    // melody bus with a dotted-8th echo, so kill notes ring out like a lead line
    mel = ac.createGain(); mel.gain.value = 1; mel.connect(sfx);
    echo = ac.createDelay(1); echoFb = ac.createGain(); echoFb.gain.value = 0.28;
    const echoOut = ac.createGain(); echoOut.gain.value = 0.35;
    mel.connect(echo); echo.connect(echoFb); echoFb.connect(echo); echo.connect(echoOut); echoOut.connect(sfx);
  }
  const song = () => seq.boss ? SONGS.boss : SONGS.main;
  const spbNow = () => 60 / seq.bpm / 4;

  function schedStep(s, t) {
    const bar = Math.floor(s / 16) % 4, st = s % 16, S = song(), root = S.roots[bar], ch = S.chords[bar];
    const I = seq.boss ? 1 : seq.int, B = seq.boss, at = t - ac.currentTime, spb = spbNow();
    if (window.__sfxLog) (window.__stepLog = window.__stepLog || []).push({ t, ch });                // test hook
    humStep(t, st, spb);
    const kick = I >= 0.15 && (st % 4 === 0 || (I >= 0.75 && st === 14) || (B && st === 10));
    if (kick) {
      tone({ type:'sine', f0: B ? 170 : 150, f1:40, dur:0.16, vol:0.85, at, bus:music });
      if (I >= 0.3) { pump.gain.setValueAtTime(0.35, t); pump.gain.linearRampToValueAtTime(1, t + spb * 2.6); }
    }
    // hats: offbeat 8ths, then 16ths
    if (I >= 0.3 && st % 4 === 2) noise({ dur:0.035, vol:0.22, type:'highpass', f0:7200, at, bus:music });
    else if (I >= 0.6 && st % 2 === 1) noise({ dur:0.02, vol:0.09, type:'highpass', f0:8500, at, bus:music });
    // snare / clap on 2 and 4, rolls into the next loop when it's hot
    if (I >= 0.45 && (st === 4 || st === 12)) noise({ dur:0.13, vol:0.32, type:'bandpass', f0:1500, q:1.2, at, bus:music });
    if ((I >= 0.85 || B) && bar === 3 && st >= 12) noise({ dur:0.06, vol:0.1 + (st - 12) * 0.05, type:'bandpass', f0:1700, q:1.2, at, bus:music });
    if (B && st % 4 === 3) noise({ dur:0.04, vol:0.08, type:'bandpass', f0:1900, q:1, at, bus:music });     // ghost notes
    // pad: the chord held through the bar
    if (st === 0) for (const n of ch) for (const d of [-7, 7]) {
      const f = 220 * Math.pow(2, n / 12) * Math.pow(2, d / 1200);
      tone({ type:'sawtooth', f0:f, dur:spb * 16, vol: (B ? 0.05 : 0.035) * (0.6 + I * 0.6), at, bus:padF, attack: spb * 3 });
    }
    // bass: the groove, doubling up to 16th-note octave bounce when intense
    const bassHit = [0, 3, 6, 8, 11, 14].includes(st) || (I >= 0.65 && st % 2 === 0) || B;
    if (bassHit) {
      const up = st === 8 || (I >= 0.65 && st % 4 === 2) || (B && st % 2 === 1);
      const f = 55 * Math.pow(2, (root + (up ? 12 : 0)) / 12);
      tone({ type: B ? 'square' : 'sawtooth', f0:f, dur:spb * (B ? 0.9 : 1.7), vol: I >= 0.15 ? 0.22 : 0.15, at, bus:bassF });
      if (B) tone({ type:'sawtooth', f0:f * 0.5, dur:spb * 0.9, vol:0.12, at, bus:bassF });
    }
    // arp: 8ths, then 16ths
    if (I >= 0.55 && (st % 2 === 0 || I >= 0.8)) {
      const n = ch[(st >> (I >= 0.8 ? 0 : 1)) % 3] + (st >= 8 ? 12 : 0);
      tone({ type:'square', f0:440 * Math.pow(2, n / 12), dur:0.08, vol: B ? 0.05 : 0.04, at, bus:arpF });
    }
    // lead: a hook on top, only at the peak and in boss fights
    if ((B || I >= 0.92) && st % 2 === 0) {
      const n = B ? BOSS_LEAD[((bar % 2) * 16 + st) / 2 % 16] : [ch[2] + 12, null, ch[0] + 24, null][(st / 2) % 4];
      if (n != null) tone({ type:'sawtooth', f0:440 * Math.pow(2, n / 12), dur:spb * 1.8, vol:0.035, at, bus:arpF, attack:0.01 });
    }
  }
  function tick() {
    if (!ac || !seq.on) return;
    // intensity eases toward its target: quick to rise, slow to fall
    const d = seq.target - seq.int;
    seq.int += d > 0 ? Math.min(d, 0.012) : Math.max(d, -0.004);
    const bpmT = seq.boss ? 132 : 100 + 18 * seq.int;
    seq.bpm += (bpmT - seq.bpm) * 0.05;
    const spb = spbNow();
    padF.frequency.setTargetAtTime(seq.boss ? 3200 : 600 + seq.int * 3000, ac.currentTime, 0.3);
    arpF.frequency.setTargetAtTime(seq.boss ? 3600 : 1400 + seq.int * 2400, ac.currentTime, 0.3);
    echo.delayTime.setTargetAtTime(spb * 3, ac.currentTime, 0.1);
    if (seq.next < ac.currentTime - 0.2) seq.next = ac.currentTime + 0.05;
    while (seq.next < ac.currentTime + 0.15) { schedStep(seq.step, seq.next); seq.next += spb; seq.step++; }
  }

  // ---- Kills play the melody ------------------------------------------------------------
  // Each kill's note lands on the next 16th of the beat and is a tone of the chord playing
  // right then; a combo climbs the arpeggio. (The click of the hit itself stays instant.)
  function killNote(combo) {
    musicBus();
    const now = ac.currentTime;
    let t = now, step = 0;
    if (seq.on) {
      const spb = spbNow(), j = Math.floor((seq.next - now - 0.004) / spb);
      t = seq.next - j * spb; step = seq.step - j;
      // at most two notes per 16th; extra kills spill onto the next steps as a little run
      for (let k = 0; k < 3 && (seq.slots[step] || 0) >= 2; k++) { step++; t += spb; }
      seq.slots[step] = (seq.slots[step] || 0) + 1;
      if (Object.keys(seq.slots).length > 64) seq.slots = { [step]: seq.slots[step] };
    }
    const ch = song().chords[Math.floor(step / 16) % 4];
    const arp = [ch[0], ch[1], ch[2], ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24, ch[1] + 24];
    const n = Math.max(0, combo - 1), idx = n < arp.length ? n : 5 + (n % 3);
    const f = 440 * Math.pow(2, arp[idx] / 12);
    tone({ type:'triangle', f0:f, f1:f * 0.985, dur:0.16, vol:0.14, at:t - now, bus:mel });
    (seq.notes = seq.notes || []).push({ at: t, step, semi: arp[idx], chord: ch }); if (seq.notes.length > 40) seq.notes.shift();
    tone({ type:'sine', f0:f * 2, dur:0.1, vol:0.035, at:t - now + 0.01, bus:mel });
  }

  return {
    init, play,
    get ready() { return !!ac && ac.state === 'running'; },
    get muted() { return muted; },
    setMuted(m) { muted = m; if (master) master.gain.setTargetAtTime(m ? 0 : 0.85, ac.currentTime, 0.02); },
    setEnabled(e) { enabled = e; },
    _hum() { return HUM; },              // test hook: Prism hum voice
    musicOn() { if (!ac || seq.on) return; musicBus(); seq.on = true; seq.next = ac.currentTime + 0.06; if (!seq.timer) seq.timer = setInterval(tick, 30); },
    musicOff() { seq.on = false; },
    setIntensity(x, snap) { seq.target = Math.max(0, Math.min(1, x)); if (snap) seq.int = seq.target; },
    setBoss(b) { seq.boss = !!b; },
    setLevel(w, boss) { seq.target = Math.min(1, w / 20); seq.boss = !!boss; },     // old API (title demo)
    _music() { return seq; },            // test hooks
    _bus() { return { ac, music, sfx, master }; },
    suspend() { if (ac && ac.state === 'running') ac.suspend(); },
    resume() { if (ac && ac.state === 'suspended') ac.resume(); },
  };
})();
