export const audioCtx = new AudioContext();

function createReverb() {
  const duration = 1.2;
  const sampleRate = audioCtx.sampleRate;
  const length = sampleRate * duration;
  const impulse = audioCtx.createBuffer(2, length, sampleRate);
  for (let i = 0; i < 2; i++) {
    const channel = impulse.getChannelData(i);
    for (let j = 0; j < length; j++) {
      channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 2);
    }
  }
  const conp = audioCtx.createConvolver();
  conp.buffer = impulse;
  return conp;
}

export function playHum() {
  if (audioCtx.state === 'suspended') return null;

  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.03;

  const reverb = createReverb();
  masterGain.connect(reverb);
  reverb.connect(audioCtx.destination);

  const notes = [220, 277.18, 329.63, 415.30]; // A3, C#4, E4, G#4 (Amaj7)
  const oscs: OscillatorNode[] = [];

  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;

    g.gain.value = 0;
    osc.connect(g);
    g.connect(masterGain);

    const startTime = audioCtx.currentTime + i * 0.4;
    g.gain.setTargetAtTime(0.2, startTime, 0.2);

    osc.start();
    oscs.push(osc);
  });

  return {
    stop: () => {
      oscs.forEach(o => {
        try { o.stop(audioCtx.currentTime + 0.5); } catch (e) { }
      });
    }
  };
}

export function playSnap() {
  if (audioCtx.state === 'suspended') return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 523.25; // C5
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

export function playBassDrop() {
  if (audioCtx.state === 'suspended') return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.setValueAtTime(120, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}
export async function ensureAudio() {
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
}
