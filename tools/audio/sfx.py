"""Synthesize the 5 sound effects with numpy -> public/audio/sfx/<name>.mp3

    python tools/audio/sfx.py

Each is at most 1.2 s, normalised to about 6 dB below the voice (loudnorm I=-22).
"""
import os
import sys
import tempfile

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import AUDIO, encode_mp3  # noqa: E402

SR = 44100
MAX_SEC = 1.1  # mp3 encoder padding adds ~0.03 s; stay under 1.2 s


def tt(sec):
    return np.arange(int(SR * sec)) / SR


def tone(freq, sec, decay=6.0, harmonics=((1, 1.0), (2, 0.3), (3, 0.1))):
    t = tt(sec)
    s = sum(a * np.sin(2 * np.pi * freq * h * t) for h, a in harmonics)
    attack = np.minimum(1, t / 0.008)
    return s * np.exp(-decay * t) * attack


def place(buf, sound, at):
    i = int(at * SR)
    end = min(len(buf), i + len(sound))
    buf[i:end] += sound[: end - i]


def canvas(sec=MAX_SEC):
    return np.zeros(int(SR * sec))


def correct():
    b = canvas(0.7)
    place(b, tone(523.25, 0.35, 7), 0.0)   # C5
    place(b, tone(783.99, 0.45, 6), 0.16)  # G5
    return b


def retry():
    b = canvas(0.6)
    t = tt(0.5)
    f = 330 + 90 * np.sin(2 * np.pi * 7 * t) * np.exp(-t * 5) - 120 * t
    ph = 2 * np.pi * np.cumsum(f) / SR
    place(b, (np.sin(ph) + 0.25 * np.sin(2 * ph)) * np.exp(-t * 6) * np.minimum(1, t / 0.01), 0)
    return b


def star():
    b = canvas(1.0)
    for k, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0, 1760.0, 2637.0]):
        place(b, tone(f, 0.4, 9, ((1, 1.0), (2, 0.15))) * 0.7, k * 0.07)
    return b


def chest():
    b = canvas(1.1)
    rng = np.random.default_rng(3)
    t = tt(0.45)
    creak_f = 180 + 60 * np.sin(2 * np.pi * 3 * t) + 140 * t
    ph = 2 * np.pi * np.cumsum(creak_f) / SR
    creak = (np.sign(np.sin(ph)) * 0.35 + np.sin(ph) * 0.4) * np.minimum(1, t / 0.05) * np.minimum(1, (0.45 - t) / 0.08)
    creak += rng.uniform(-1, 1, len(t)) * 0.08
    place(b, creak * 0.8, 0.0)
    for f in (261.63, 329.63, 392.0, 523.25):  # C major chord
        place(b, tone(f, 0.7, 4.5) * 0.45, 0.5)
    return b


def tap():
    b = canvas(0.15)
    t = tt(0.12)
    f = 700 * np.exp(-t * 30) + 180
    place(b, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38), 0)
    return b


EFFECTS = {"correct": correct, "retry": retry, "star": star, "chest": chest, "tap": tap}


def main():
    out_dir = os.path.join(AUDIO, "sfx")
    os.makedirs(out_dir, exist_ok=True)
    for name, fn in EFFECTS.items():
        a = fn()[: int(SR * MAX_SEC)]
        a = a / max(1e-6, np.abs(a).max()) * 0.9
        with tempfile.TemporaryDirectory() as tmp:
            wav = os.path.join(tmp, name + ".wav")
            sf.write(wav, a.astype(np.float32), SR)
            # loudnorm needs some signal length; -22 LUFS = 6 dB under the voice (-16)
            encode_mp3(wav, os.path.join(out_dir, name + ".mp3"), loudnorm="I=-22:TP=-3:LRA=7")
        print("wrote", name)


if __name__ == "__main__":
    main()
