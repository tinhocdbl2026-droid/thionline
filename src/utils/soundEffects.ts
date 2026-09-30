// Web Audio API procedural sound synthesizer for zero-dependency classroom sound effects

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playButtonClick(volume = 0.5) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

export function playWheelTick(volume = 0.5) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.04);
}

export function playBallBounceSound(volume = 0.4) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Plastic ball shell thud (sine decay)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const freq = 450 + Math.random() * 550;

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.35, now + 0.045);

  gain.gain.setValueAtTime(volume * 0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.045);

  // 2. High-frequency click (ball clack snap)
  const clickOsc = ctx.createOscillator();
  const clickGain = ctx.createGain();
  clickOsc.type = 'sine';
  clickOsc.frequency.setValueAtTime(1400 + Math.random() * 800, now);
  clickOsc.frequency.exponentialRampToValueAtTime(400, now + 0.015);

  clickGain.gain.setValueAtTime(volume * 0.15, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

  clickOsc.connect(clickGain);
  clickGain.connect(ctx.destination);

  clickOsc.start(now);
  clickOsc.stop(now + 0.015);
}

export function playBallDropChute(volume = 0.6) {
  const ctx = getAudioContext();
  if (!ctx) return;

  // 3 quick rolling taps followed by a soft clack
  const times = [0, 0.08, 0.16, 0.26];
  times.forEach((t, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = 500 - i * 60;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, ctx.currentTime + t + 0.07);

    gain.gain.setValueAtTime(volume * (0.2 + i * 0.08), ctx.currentTime + t);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + t);
    osc.stop(ctx.currentTime + t + 0.07);
  });
}

export function playBalloonPop(volume = 0.6) {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Burst of white noise + low punch
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1500, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.7, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
}

export function playBoxOpen(volume = 0.6) {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Magical upward arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + idx * 0.07;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * 0.4, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.35);
  });
}

export function playVictoryFanfare(volume = 0.7) {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Cheerful brass-like fanfare chord progression: C5 -> E5 -> G5 -> C6 with harmonic sustain
  const chordNotes = [
    { freq: 523.25, start: 0.0, dur: 0.2 }, // C5
    { freq: 659.25, start: 0.12, dur: 0.2 }, // E5
    { freq: 783.99, start: 0.24, dur: 0.25 }, // G5
    { freq: 1046.5, start: 0.38, dur: 0.8 }, // C6
    { freq: 1318.5, start: 0.42, dur: 0.8 }, // E6 sparkle
  ];

  chordNotes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + start;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * 0.4, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + dur);
  });
}

// Continuous spinning audio helper for the cage
export class CageAudioController {
  private ctx: AudioContext | null = null;
  private isSpinning = false;
  private intervalId: number | null = null;
  private volume: number;

  constructor(volume = 0.5) {
    this.volume = volume;
  }

  setVolume(vol: number) {
    this.volume = vol;
  }

  startSpinning() {
    this.ctx = getAudioContext();
    if (!this.ctx || this.isSpinning) return;
    this.isSpinning = true;

    let speed = 1.0;
    const rattleLoop = () => {
      if (!this.isSpinning) return;

      playBallBounceSound(this.volume * (0.4 + Math.random() * 0.4));

      // Schedule next bounce based on random tumbling intervals
      const nextDelay = Math.max(35, Math.floor((60 + Math.random() * 80) / speed));
      this.intervalId = window.setTimeout(rattleLoop, nextDelay);
    };

    rattleLoop();
  }

  stopSpinning() {
    this.isSpinning = false;
    if (this.intervalId !== null) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }
}
