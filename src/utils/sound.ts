/**
 * Web Audio API synthesizer for live draw sound effects
 * Zero external audio files required, runs 100% offline.
 */

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
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const soundEffects = {
  playTick(enabled: boolean = true) {
    if (!enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio not permitted yet
    }
  },

  playCountdownBeep(enabled: boolean = true, isZero: boolean = false) {
    if (!enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const freq = isZero ? 880 : 440;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isZero ? 0.35 : 0.15));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + (isZero ? 0.35 : 0.15));
    } catch {
      // Ignore audio error
    }
  },

  playStopThud(enabled: boolean = true) {
    if (!enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Ignore
    }
  },

  playDisqualified(enabled: boolean = true) {
    if (!enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      // Minor two-tone consolation melody
      [440, 392].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.18);
        gain.gain.setValueAtTime(0.15, now + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.18);
        osc.stop(now + (i + 1) * 0.18);
      });
    } catch {
      // Ignore
    }
  },

  playWinnerFanfare(enabled: boolean = true) {
    if (!enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Note frequency definitions
      const C3 = 130.81;
      const G3 = 196.00;
      const C4 = 261.63;
      const D4 = 293.66;
      const E4 = 329.63;
      const F4 = 349.23;
      const G4 = 392.00;
      const A4 = 440.00;
      const B4 = 493.88;
      const C5 = 523.25;
      const D5 = 587.33;
      const E5 = 659.25;
      const G5 = 783.99;
      const C6 = 1046.50;

      // Helper to schedule a tone
      const playTone = (freq: number, startOffset: number, duration: number, peakVol: number = 0.22, type: OscillatorType = 'triangle') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + startOffset);

        // Smooth attack and decay
        gain.gain.setValueAtTime(0.001, now + startOffset);
        gain.gain.linearRampToValueAtTime(peakVol, now + startOffset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + startOffset);
        osc.stop(now + startOffset + duration + 0.05);
      };

      // Phrase 1: Herald Call (Ta-da-daaa!)
      playTone(G4, 0.0, 0.16, 0.24, 'triangle');
      playTone(C5, 0.18, 0.16, 0.26, 'triangle');
      playTone(E5, 0.36, 0.35, 0.28, 'triangle');

      // Phrase 2: Second Herald Call Higher (Ta-da-daaa!)
      playTone(G4, 0.75, 0.14, 0.24, 'triangle');
      playTone(C5, 0.90, 0.14, 0.26, 'triangle');
      playTone(E5, 1.05, 0.14, 0.28, 'triangle');
      playTone(G5, 1.20, 0.45, 0.30, 'triangle');

      // Phrase 3: Ascending Rapid Flourish
      const flourish = [C5, D5, E5, F4, G5, A4, B4, C6];
      flourish.forEach((f, idx) => {
        playTone(f, 1.70 + idx * 0.07, 0.12, 0.18, 'sine');
      });

      // Phrase 4: Majestic Grand Finale Chord (with long 2-second sustain)
      const finaleChord = [
        { freq: C3, vol: 0.26, type: 'triangle' as OscillatorType }, // Sub-bass foundation
        { freq: G3, vol: 0.22, type: 'sine' as OscillatorType },
        { freq: C4, vol: 0.24, type: 'triangle' as OscillatorType },
        { freq: E4, vol: 0.22, type: 'sine' as OscillatorType },
        { freq: G4, vol: 0.25, type: 'triangle' as OscillatorType },
        { freq: C5, vol: 0.28, type: 'triangle' as OscillatorType },
        { freq: E5, vol: 0.26, type: 'triangle' as OscillatorType },
        { freq: G5, vol: 0.28, type: 'triangle' as OscillatorType },
        { freq: C6, vol: 0.22, type: 'sine' as OscillatorType }, // Brilliant high octave
      ];

      finaleChord.forEach(({ freq, vol, type }) => {
        playTone(freq, 2.30, 2.0, vol, type);
      });
    } catch {
      // Audio error or not unlocked yet
    }
  },

  playSuccessChime(enabled: boolean = true) {
    if (!enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 4-note ascending crystal chime: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.45);
      });
    } catch {
      // Ignore
    }
  },

  playCameraClick(enabled: boolean = true) {
    if (!enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Mechanical shutter click: high frequency burst followed by low click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Ignore
    }
  },

  vibrate(pattern: number | number[] = 50, enabled: boolean = true) {
    if (!enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Not supported
    }
  }
};
