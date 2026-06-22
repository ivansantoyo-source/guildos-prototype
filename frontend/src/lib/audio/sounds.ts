/* ==============================================================
   GUILDOS SOUND DESIGN SYSTEM
   Web Audio API generated sounds — no external files needed
   ============================================================== */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Resume if suspended (browser policy)
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.08,
  detune: number = 0,
  rampDown: boolean = true
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (!isSoundEnabled()) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  osc.detune.value = detune;

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  if (rampDown) {
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration + 0.05);
}

function playMultiTone(
  frequencies: Array<{ freq: number; delay: number; type?: OscillatorType; vol?: number; dur?: number; detune?: number }>
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (!isSoundEnabled()) return;

  frequencies.forEach(({ freq, delay, type = "sine", vol = 0.06, dur = 0.12, detune = 0 }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune ?? 0;

    const startTime = ctx.currentTime + delay;
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + dur + 0.05);
  });
}

/* ---- Sound Enabled Check (respects Zustand preference) ---- */

let _soundEnabled: boolean = true;

export function setSoundEnabled(enabled: boolean): void {
  _soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  // Try to read from localStorage directly for Zustand persist
  try {
    const stored = localStorage.getItem("guildos-store");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed.state?.soundEnabled === "boolean") {
        _soundEnabled = parsed.state.soundEnabled;
      }
    }
  } catch {
    // fall through
  }
  return _soundEnabled;
}

/* ---- Sound Effects ---- */

export function playHover(): void {
  playTone(1200, 0.05, "sine", 0.015);
}

export function playClick(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (!isSoundEnabled()) return;

  // Mechanical keyboard click — noise burst + subtle tone
  const bufferSize = ctx.sampleRate * 0.04;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2000;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start(ctx.currentTime);

  // Subtle click tone
  playTone(800, 0.03, "square", 0.01);
}

export function playSuccess(): void {
  playMultiTone([
    { freq: 523.25, delay: 0, type: "sine", vol: 0.07, dur: 0.15 },    // C5
    { freq: 659.25, delay: 0.08, type: "sine", vol: 0.07, dur: 0.15 },  // E5
    { freq: 783.99, delay: 0.16, type: "sine", vol: 0.08, dur: 0.25 },  // G5
  ]);
}

export function playLegendary(): void {
  // Epic orchestra hit feel — layered tones with sweep
  const ctx = getAudioContext();
  if (!ctx) return;
  if (!isSoundEnabled()) return;

  const now = ctx.currentTime;

  // Deep bass sweep
  const bass = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bass.type = "sawtooth";
  bass.frequency.setValueAtTime(80, now);
  bass.frequency.exponentialRampToValueAtTime(220, now + 0.3);
  bassGain.gain.setValueAtTime(0.1, now);
  bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  bass.connect(bassGain);
  bassGain.connect(ctx.destination);
  bass.start(now);
  bass.stop(now + 0.5);

  // Rising arpeggio
  const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = now + 0.05 + i * 0.04;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

export function playError(): void {
  playMultiTone([
    { freq: 200, delay: 0, type: "square", vol: 0.08, dur: 0.15 },
    { freq: 150, delay: 0.1, type: "square", vol: 0.08, dur: 0.2 },
    { freq: 100, delay: 0.2, type: "sawtooth", vol: 0.06, dur: 0.3 },
  ]);
}

export function playNotification(): void {
  playMultiTone([
    { freq: 880, delay: 0, type: "sine", vol: 0.06, dur: 0.08 },
    { freq: 1108.73, delay: 0.06, type: "sine", vol: 0.06, dur: 0.12 },
  ]);
}

export function playKonami(): void {
  // 8-bit Konami jingle
  const ctx = getAudioContext();
  if (!ctx) return;
  if (!isSoundEnabled()) return;

  const now = ctx.currentTime;
  // Up Up Down Down Left Right Left Right B A
  const notes = [
    { freq: 392, time: 0 },      // G4 - Up
    { freq: 392, time: 0.12 },   // G4 - Up
    { freq: 349.23, time: 0.24 }, // F4 - Down
    { freq: 349.23, time: 0.36 }, // F4 - Down
    { freq: 329.63, time: 0.48 }, // E4 - Left
    { freq: 392, time: 0.60 },   // G4 - Right
    { freq: 329.63, time: 0.72 }, // E4 - Left
    { freq: 392, time: 0.84 },   // G4 - Right
    { freq: 440, time: 1.00 },   // A4 - B
    { freq: 493.88, time: 1.20 }, // B4 - A
  ];

  notes.forEach(({ freq, time }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    const t = now + time;
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.setValueAtTime(0.06, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  });
}

/* ---- Mute/Unmute all ---- */

export function muteAll(): void {
  setSoundEnabled(false);
}

export function unmuteAll(): void {
  setSoundEnabled(true);
}
