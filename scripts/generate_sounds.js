/**
 * Generates two WAV notification sounds:
 * 1. new_order.wav  - 3 ascending pleasant dings (message-like)
 * 2. order_cancelled.wav - 3 descending warning tones
 */
const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(RAW_DIR, { recursive: true });

const SAMPLE_RATE = 44100;

function sineWave(freq, durationSec, amplitude = 0.65) {
  const numSamples = Math.round(SAMPLE_RATE * durationSec);
  const samples = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Fade-out at last 30%
    const env = i < numSamples * 0.7 ? 1.0 : 1.0 - (i - numSamples * 0.7) / (numSamples * 0.3);
    const val = amplitude * env * Math.sin(2 * Math.PI * freq * t);
    samples[i] = Math.round(val * 32767);
  }
  return samples;
}

function silence(durationSec) {
  return new Int16Array(Math.round(SAMPLE_RATE * durationSec));
}

function concat(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Int16Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

function writeWav(filename, samples) {
  const dataBytes = samples.length * 2;
  const buf = Buffer.alloc(44 + dataBytes);

  // RIFF header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);       // PCM chunk size
  buf.writeUInt16LE(1, 20);        // PCM format
  buf.writeUInt16LE(1, 22);        // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);        // block align
  buf.writeUInt16LE(16, 34);       // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < samples.length; i++) {
    buf.writeInt16LE(samples[i], 44 + i * 2);
  }

  fs.writeFileSync(filename, buf);
  console.log(`Written: ${filename} (${(samples.length / SAMPLE_RATE).toFixed(2)}s)`);
}

// ── 1. new_order.wav: C6 → E6 → G6 (ascending cheerful dings) ────────────────
const newOrder = concat(
  sineWave(1047, 0.18),  // C6
  silence(0.08),
  sineWave(1319, 0.18),  // E6
  silence(0.08),
  sineWave(1568, 0.18),  // G6
  silence(0.12),
);
writeWav(path.join(RAW_DIR, 'new_order.wav'), newOrder);

// ── 2. order_cancelled.wav: G5 → E5 → C5 (descending warning) ───────────────
const cancelled = concat(
  sineWave(784, 0.25, 0.7),   // G5
  silence(0.06),
  sineWave(659, 0.25, 0.7),   // E5
  silence(0.06),
  sineWave(523, 0.30, 0.7),   // C5 (longer last note)
  silence(0.1),
);
writeWav(path.join(RAW_DIR, 'order_cancelled.wav'), cancelled);

console.log('All sounds generated successfully!');

