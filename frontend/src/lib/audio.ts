// ─── Audio Context ────────────────────────────────────────────────────────────
// Lazy-initialised so it isn't created before any user gesture.
let _ctx: AudioContext | null = null;
export function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  return _ctx;
}
export async function ensureAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') await ctx.resume();
}

// ─── Ambient loop ─────────────────────────────────────────────────────────────
// Chill retro chiptune arpeggio: A pentatonic minor, triangle oscillators,
// gentle reverb, very low volume. Replaces the old 60Hz buzz.
let ambientNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let ambientRunning = false;

const PENTA = [220, 261.63, 293.66, 329.63, 392, 440]; // Am pentatonic (A3–A4)

function makeReverb(ctx: AudioContext, dur = 1.4): ConvolverNode {
  const len = ctx.sampleRate * dur;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
  }
  const c = ctx.createConvolver();
  c.buffer = buf;
  return c;
}

export function startAmbient() {
  if (ambientRunning) return;
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;
  ambientRunning = true;

  const master = ctx.createGain();
  master.gain.value = 0.022; // very quiet

  const reverb = makeReverb(ctx);
  master.connect(reverb);
  reverb.connect(ctx.destination);
  master.connect(ctx.destination); // dry mix

  const noteDur = 0.55;    // seconds per note
  const pattern = [0, 2, 4, 3, 1, 4, 2, 0]; // index into PENTA

  pattern.forEach((idx, step) => {
    const freq = PENTA[idx];
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    // Soft attack / release per note
    const t0 = ctx.currentTime + step * noteDur;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.18, t0 + 0.06);
    g.gain.setTargetAtTime(0, t0 + noteDur * 0.5, 0.12);

    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + noteDur);
    ambientNodes.push({ osc, gain: g });
  });

  // Loop: restart after all notes finish
  const loopDur = noteDur * pattern.length;
  const timer = setTimeout(() => {
    if (ambientRunning) {
      ambientRunning = false;
      ambientNodes = [];
      startAmbient();
    }
  }, loopDur * 1000);

  // Attach the timer so stopAmbient can clear it
  (startAmbient as any)._timer = timer;
}

export function stopAmbient() {
  ambientRunning = false;
  clearTimeout((startAmbient as any)._timer);
  const ctx = getCtx();
  ambientNodes.forEach(({ osc, gain }) => {
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    try { osc.stop(ctx.currentTime + 0.25); } catch (_) { }
  });
  ambientNodes = [];
}

// ─── Signal hum (waiting for signal in duel) ─────────────────────────────────
// Gentle Amaj7 chord — sine waves, soft reverb. Much calmer than old sawtooth.
export function playHum(): { stop: () => void } | null {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return null;

  const master = ctx.createGain();
  master.gain.value = 0.025;

  const reverb = makeReverb(ctx, 1.0);
  master.connect(reverb);
  reverb.connect(ctx.destination);

  const chord = [220, 277.18, 329.63, 415.30]; // Amaj7
  const oscs: OscillatorNode[] = [];

  chord.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.value = 0;
    osc.connect(g);
    g.connect(master);
    const t = ctx.currentTime + i * 0.35;
    g.gain.setTargetAtTime(0.22, t, 0.18);
    osc.start(t);
    oscs.push(osc);
  });

  return {
    stop: () => {
      oscs.forEach(o => {
        try { o.stop(ctx.currentTime + 0.4); } catch (_) { }
      });
    },
  };
}

// ─── Signal fire ping ─────────────────────────────────────────────────────────
// Short triangle-wave ping at A4 — softer than old square wave, clear but
// not harsh. Replaces the old 880Hz square wave snap.
export function playSnap() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 440;
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.18);

  // Small upper harmonic for presence without harshness
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = 880;
  gain2.gain.setValueAtTime(0.08, ctx.currentTime);
  gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start();
  osc2.stop(ctx.currentTime + 0.1);
}

// ─── Result bass drop ─────────────────────────────────────────────────────────
// Descending sine sweep — punchier range, less subsonic rumble.
export function playBassDrop() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.45);
  gain.gain.setValueAtTime(0.28, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.45);
}

// ─── Heartbeat tick ───────────────────────────────────────────────────────────
// The "lub" of a heartbeat — short, low, organic.
export function playHeartbeatTick() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
}

// Legacy alias kept for any imports using audioCtx directly
export const audioCtx = {
  get state() { return getCtx().state; },
  resume() { return getCtx().resume(); },
};
