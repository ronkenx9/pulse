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

// ─── Ambient Biometric Drone ─────────────────────────────────────────────────
// Shifting atmospheric tones for different pages.
let ambientNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let ambientRunning = false;

const TONES = {
  LANDING: [110, 164.81, 220],     // A2, E3, A3 (Deep, calm)
  LOBBY: [220, 277.18, 329.63], // A3, C#4, E4 (Bright, anticipatory)
  ARENA: [440, 523.25, 659.25], // A4, C5, E5 (High tension)
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

export function startAmbient(mode: keyof typeof TONES = 'LANDING') {
  if (ambientRunning) stopAmbient();
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;
  ambientRunning = true;

  const master = ctx.createGain();
  master.gain.value = 0.015; // Extremely subtle

  const reverb = makeReverb(ctx, 2.0);
  master.connect(reverb);
  reverb.connect(ctx.destination);

  const notes = TONES[mode];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;

    // Slow breathing fade in/out
    const t0 = ctx.currentTime;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.1, t0 + 2);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.1; // 0.1 Hz breathing
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    lfo.start();

    osc.connect(g);
    g.connect(master);
    osc.start();
    ambientNodes.push({ osc, gain: g });
  });
}

export function stopAmbient() {
  ambientRunning = false;
  const ctx = getCtx();
  ambientNodes.forEach(({ osc, gain }) => {
    try {
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      osc.stop(ctx.currentTime + 1);
    } catch (_) { }
  });
  ambientNodes = [];
}

// ─── Signal Effects ─────────────────────────────────────────────────────────

export function playHum(): { stop: () => void } | null {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return null;
  const master = ctx.createGain();
  master.gain.value = 0.02;
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
    g.gain.setTargetAtTime(0.1, ctx.currentTime + i * 0.2, 0.2);
    osc.start();
    oscs.push(osc);
  });
  master.connect(ctx.destination);
  return { stop: () => oscs.forEach(o => { try { o.stop(ctx.currentTime + 0.2); } catch (_) { } }) };
}

export function playSnap() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;
  const osc = ctx.createOscillator();
  const res = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 440;
  res.gain.setValueAtTime(0.4, ctx.currentTime);
  res.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.connect(res);
  res.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

export function playBassDrop() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(100, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.5);
  g.gain.setValueAtTime(0.3, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
}

export const audioCtx = {
  get state() { return getCtx().state; },
  resume() { return getCtx().resume(); },
};
