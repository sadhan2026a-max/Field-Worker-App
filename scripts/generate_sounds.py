"""
Generate two WAV notification sounds:
  1. new_order.wav  - pleasant 3-beep "ding ding ding" (like a message tone)
  2. order_cancelled.wav - descending warning tone (low-high-low)
"""
import wave, struct, math, os

RAW_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')
os.makedirs(RAW_DIR, exist_ok=True)

SAMPLE_RATE = 44100

def sine_wave(freq, duration, amplitude=0.6, sample_rate=SAMPLE_RATE):
    num_samples = int(sample_rate * duration)
    samples = []
    for i in range(num_samples):
        t = i / sample_rate
        # Apply slight fade-out envelope
        envelope = 1.0 if i < num_samples * 0.7 else (1.0 - (i - num_samples * 0.7) / (num_samples * 0.3))
        val = amplitude * envelope * math.sin(2 * math.pi * freq * t)
        samples.append(int(val * 32767))
    return samples

def silence(duration, sample_rate=SAMPLE_RATE):
    return [0] * int(sample_rate * duration)

def write_wav(filename, samples, sample_rate=SAMPLE_RATE):
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)  # 16-bit
        f.setframerate(sample_rate)
        for s in samples:
            f.writeframes(struct.pack('<h', max(-32768, min(32767, s))))
    print(f"Written: {filename} ({len(samples)/sample_rate:.2f}s)")

# ── 1. new_order.wav: 3 quick pleasant dings (like WhatsApp/message tone) ──────
#    C6 (1047 Hz) → E6 (1319 Hz) → G6 (1568 Hz)  each 0.18s, gap 0.08s
new_order_samples = []
for freq in [1047, 1319, 1568]:
    new_order_samples += sine_wave(freq, 0.18, amplitude=0.65)
    new_order_samples += silence(0.08)
# small tail silence
new_order_samples += silence(0.1)

write_wav(os.path.join(RAW_DIR, 'new_order.wav'), new_order_samples)

# ── 2. order_cancelled.wav: descending urgent tones (G5 → E5 → C5) ─────────────
#    more "warning" feel, slightly longer, lower pitch
cancelled_samples = []
for freq in [784, 659, 523]:
    cancelled_samples += sine_wave(freq, 0.25, amplitude=0.7)
    cancelled_samples += silence(0.06)
cancelled_samples += silence(0.1)

write_wav(os.path.join(RAW_DIR, 'order_cancelled.wav'), cancelled_samples)

print("Done! Both sounds generated.")

