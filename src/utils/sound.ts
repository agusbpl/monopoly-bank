// Web Audio API Synthesizer for board game sound effects without external assets

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

export function playCoinsSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Coin chime: two metallic bell frequencies
  const freqs = [987.77, 1318.51, 1567.98]; // B5, E6, G6
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0, now + idx * 0.08);
    gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.26);
  });
}

export function playTransferSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, now); // C5
  osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.12); // C6

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.22);
}

export function playPassGoSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Fanfare: C5 -> E5 -> G5 -> C6
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now + i * 0.09);

    gain.gain.setValueAtTime(0, now + i * 0.09);
    gain.gain.linearRampToValueAtTime(0.18, now + i * 0.09 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.09);
    osc.stop(now + i * 0.09 + 0.26);
  });
}

export function playBuzzerSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.linearRampToValueAtTime(110, now + 0.25);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.3);
}

export function triggerHaptic(type: 'light' | 'success' | 'warning' = 'light') {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') navigator.vibrate(25);
      else if (type === 'success') navigator.vibrate([30, 40, 60]);
      else if (type === 'warning') navigator.vibrate([80, 50, 80]);
    } catch {
      // Ignore vibration errors if not allowed
    }
  }
}
