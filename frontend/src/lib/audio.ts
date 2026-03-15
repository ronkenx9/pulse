// ─── Audio Context ────────────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;
export function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  return _ctx;
}
export async function ensureAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') await ctx.resume();
}

// ─── Master Volume ───────────────────────────────────────────────────────────
let _masterGain: GainNode | null = null;
function getMaster(): GainNode {
  if (!_masterGain) {
    const ctx = getCtx();
    _masterGain = ctx.createGain();
    _masterGain.gain.value = 1.0;
    _masterGain.connect(ctx.destination);
  }
  return _masterGain;
}

// ─── Background Music (Procedural Synth) ─────────────────────────────────────
// Each page gets a distinct musical mood. Crossfades between them.
let bgmNodes: { oscs: OscillatorNode[]; gains: GainNode[]; master: GainNode; lfo: OscillatorNode }[] = [];
let currentBGM: string | null = null;

const BGM_CONFIGS = {
  LANDING: {
    // Deep, mysterious — standing in front of the arcade in a dark room
    chords: [
      { freq: 55, type: 'sine' as OscillatorType, vol: 0.08 },      // Sub bass A1
      { freq: 110, type: 'triangle' as OscillatorType, vol: 0.04 },  // A2 octave
      { freq: 164.81, type: 'sine' as OscillatorType, vol: 0.03 },   // E3
      { freq: 220, type: 'triangle' as OscillatorType, vol: 0.02 },  // A3
    ],
    lfoRate: 0.08,
    lfoDepth: 0.02,
    filterFreq: 400,
  },
  LOBBY: {
    // Anticipatory, brighter — selecting your mode
    chords: [
      { freq: 82.41, type: 'sawtooth' as OscillatorType, vol: 0.03 }, // E2 bass
      { freq: 220, type: 'triangle' as OscillatorType, vol: 0.04 },   // A3
      { freq: 277.18, type: 'sine' as OscillatorType, vol: 0.03 },    // C#4
      { freq: 329.63, type: 'triangle' as OscillatorType, vol: 0.025 }, // E4
    ],
    lfoRate: 0.15,
    lfoDepth: 0.015,
    filterFreq: 600,
  },
  ARENA: {
    // Tense, pulsing — the duel is imminent
    chords: [
      { freq: 65.41, type: 'sawtooth' as OscillatorType, vol: 0.04 },  // C2 (darker)
      { freq: 130.81, type: 'square' as OscillatorType, vol: 0.02 },   // C3
      { freq: 196, type: 'triangle' as OscillatorType, vol: 0.03 },    // G3
      { freq: 261.63, type: 'sine' as OscillatorType, vol: 0.025 },    // C4
      { freq: 392, type: 'sine' as OscillatorType, vol: 0.015 },       // G4 (high tension)
    ],
    lfoRate: 0.25,
    lfoDepth: 0.025,
    filterFreq: 800,
  },
  TRAINING: {
    // Focused, clean — practice mode
    chords: [
      { freq: 73.42, type: 'triangle' as OscillatorType, vol: 0.04 }, // D2
      { freq: 146.83, type: 'sine' as OscillatorType, vol: 0.03 },    // D3
      { freq: 220, type: 'triangle' as OscillatorType, vol: 0.025 },  // A3
      { freq: 293.66, type: 'sine' as OscillatorType, vol: 0.02 },    // D4
    ],
    lfoRate: 0.12,
    lfoDepth: 0.018,
    filterFreq: 500,
  },
};

function makeReverb(ctx: AudioContext, dur = 1.4): ConvolverNode {
  const len = ctx.sampleRate * dur;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
  }
  const c = ctx.createConvolver();
  c.buffer = buf;
  return c;
}

export function startBGM(mode: keyof typeof BGM_CONFIGS) {
  if (currentBGM === mode) return; // Already playing this track
  stopBGM(); // Crossfade out old track

  const ctx = getCtx();
  if (ctx.state === 'suspended') return;

  currentBGM = mode;
  const config = BGM_CONFIGS[mode];

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(1, ctx.currentTime + 2); // 2s fade in

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = config.filterFreq;
  filter.Q.value = 1;

  const reverb = makeReverb(ctx, 2.5);

  master.connect(filter);
  filter.connect(reverb);
  reverb.connect(getMaster());
  // Also direct signal for clarity
  filter.connect(getMaster());

  const lfo = ctx.createOscillator();
  lfo.frequency.value = config.lfoRate;
  lfo.type = 'sine';

  const oscs: OscillatorNode[] = [];
  const gains: GainNode[] = [];

  config.chords.forEach((chord, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = chord.type;
    osc.frequency.value = chord.freq;

    // Slight detune for width
    if (i > 0) osc.detune.value = (Math.random() - 0.5) * 8;

    g.gain.value = chord.vol;

    // LFO modulation on volume
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = config.lfoDepth;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);

    osc.connect(g);
    g.connect(master);
    osc.start();

    oscs.push(osc);
    gains.push(g);
  });

  lfo.start();
  bgmNodes.push({ oscs, gains, master, lfo });
}

export function stopBGM() {
  const ctx = getCtx();
  bgmNodes.forEach(({ oscs, master, lfo }) => {
    try {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.8); // Fade out
      oscs.forEach(o => { try { o.stop(ctx.currentTime + 2); } catch (_) {} });
      try { lfo.stop(ctx.currentTime + 2); } catch (_) {}
    } catch (_) {}
  });
  bgmNodes = [];
  currentBGM = null;
}

// Legacy compatibility
export function startAmbient(mode: 'LANDING' | 'LOBBY' | 'ARENA') {
  startBGM(mode);
}
export function stopAmbient() {
  stopBGM();
}

// ─── Sound Effects ──────────────────────────────────────────────────────────

// Waiting hum — tense drone while waiting for signal
export function playHum(): { stop: () => void } | null {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return null;

  const master = ctx.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.5);
  master.connect(getMaster());

  const chord = [220, 277.18, 329.63, 415.30];
  const oscs: OscillatorNode[] = [];

  chord.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.value = 0;
    osc.connect(g);
    g.connect(master);
    g.gain.setTargetAtTime(0.08, ctx.currentTime + i * 0.15, 0.15);
    osc.start();
    oscs.push(osc);
  });

  return {
    stop: () => {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      oscs.forEach(o => { try { o.stop(ctx.currentTime + 0.5); } catch (_) {} });
    }
  };
}

// Signal snap — the "FIRE!" moment
export function playSnap() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;

  // Layered: sharp attack + rising tone
  const osc1 = ctx.createOscillator();
  const g1 = ctx.createGain();
  osc1.type = 'square';
  osc1.frequency.setValueAtTime(880, ctx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.05);
  g1.gain.setValueAtTime(0.3, ctx.currentTime);
  g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc1.connect(g1);
  g1.connect(getMaster());
  osc1.start();
  osc1.stop(ctx.currentTime + 0.15);

  // Click layer
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.value = 2000;
  g2.gain.setValueAtTime(0.2, ctx.currentTime);
  g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  osc2.connect(g2);
  g2.connect(getMaster());
  osc2.start();
  osc2.stop(ctx.currentTime + 0.05);
}

// Victory fanfare — you won!
export function playVictory() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  const master = ctx.createGain();
  master.gain.value = 0.15;
  master.connect(getMaster());

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.12;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.4);
  });

  // Final chord
  const chordTime = ctx.currentTime + notes.length * 0.12;
  [523.25, 659.25, 783.99].forEach(freq => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.15, chordTime);
    g.gain.exponentialRampToValueAtTime(0.001, chordTime + 1.0);
    osc.connect(g);
    g.connect(master);
    osc.start(chordTime);
    osc.stop(chordTime + 1.0);
  });
}

// Defeat sound — you lost
export function playDefeat() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;

  const notes = [392, 349.23, 293.66, 220]; // G4 F4 D4 A3 — descending
  const master = ctx.createGain();
  master.gain.value = 0.12;
  master.connect(getMaster());

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.2;
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.5);
  });
}

// False start / DQ buzzer
export function playBuzzer() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 120;
  g.gain.setValueAtTime(0.25, ctx.currentTime);
  g.gain.setValueAtTime(0.25, ctx.currentTime + 0.3);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.connect(g);
  g.connect(getMaster());
  osc.start();
  osc.stop(ctx.currentTime + 0.6);

  // Second buzz
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = 'sawtooth';
  osc2.frequency.value = 100;
  const t2 = ctx.currentTime + 0.15;
  g2.gain.setValueAtTime(0.2, t2);
  g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.5);
  osc2.connect(g2);
  g2.connect(getMaster());
  osc2.start(t2);
  osc2.stop(t2 + 0.5);
}

// Bass drop — result reveal
export function playBassDrop() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.6);
  g.gain.setValueAtTime(0.35, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.connect(g);
  g.connect(getMaster());
  osc.start();
  osc.stop(ctx.currentTime + 0.6);
}

// UI click — button press feedback
export function playClick() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = 1200;
  g.gain.setValueAtTime(0.08, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
  osc.connect(g);
  g.connect(getMaster());
  osc.start();
  osc.stop(ctx.currentTime + 0.03);
}

// Error sound — transaction failed
export function playError() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;

  [200, 150].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.15;
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g);
    g.connect(getMaster());
    osc.start(t);
    osc.stop(t + 0.2);
  });
}

// Countdown beep
export function playCountdownBeep(final = false) {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = final ? 'square' : 'sine';
  osc.frequency.value = final ? 880 : 440;
  g.gain.setValueAtTime(final ? 0.2 : 0.1, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (final ? 0.3 : 0.15));
  osc.connect(g);
  g.connect(getMaster());
  osc.start();
  osc.stop(ctx.currentTime + (final ? 0.3 : 0.15));
}

// Copy success chirp
export function playCopySuccess() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;
  [1000, 1500].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.08;
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(g);
    g.connect(getMaster());
    osc.start(t);
    osc.stop(t + 0.1);
  });
}

export const audioCtx = {
  get state() { return getCtx().state; },
  resume() { return getCtx().resume(); },
};
