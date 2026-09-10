const NOTE_FREQ: Record<string, number> = {
  C3: 130.81, "C#3": 138.59, D3: 146.83, "D#3": 155.56, E3: 164.81, F3: 174.61,
  "F#3": 185.0, G3: 196.0, "G#3": 207.65, A3: 220.0, "A#3": 233.08, B3: 246.94,
  C4: 261.63, "C#4": 277.18, D4: 293.66, "D#4": 311.13, E4: 329.63, F4: 349.23,
  "F#4": 369.99, G4: 392.0, "G#4": 415.3, A4: 440.0, "A#4": 466.16, B4: 493.88,
};

let ctx: AudioContext | null = null;

export function playReferenceTone(notes: [string, number][]) {
  if (!ctx) ctx = new AudioContext();
  let t = ctx.currentTime + 0.05;
  for (const [note, dur] of notes) {
    const freq = NOTE_FREQ[note];
    if (!freq) continue;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    gain.gain.linearRampToValueAtTime(0, t + dur - 0.03);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
    t += dur;
  }
}
