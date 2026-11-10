"""Build the unit chant: original instrumental (numpy) + the gatinho speaking lyrics on the beat.

    python tools/audio/chant.py [--dry-run]

Voice = the per-line MP3s made by generate.py (matched on lang + normalised text).
Output: public/audio/song-forest-animals.mp3
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import AUDIO, ROOT, load_lines, mp3_path, normalize  # noqa: E402

SR = 44100
UNIT = os.path.join(ROOT, "content", "units", "forest-animals.json")
OUT = os.path.join(AUDIO, "song-forest-animals.mp3")
VOICE_GAIN = 1.0
MUSIC_GAIN = 0.35  # voice clearly louder than the music
TAIL_BARS = 2


def load_song():
    with open(UNIT, encoding="utf-8") as f:
        stop = json.load(f)["stops"][0]
    assert stop["kind"] == "song", "stops[0] is not a song"
    return stop


def timeline(song):
    beat = 60.0 / song["bpm"]
    bar_sec = 4 * beat
    index = {(l["lang"], normalize(l["text"])): l["id"] for l in load_lines()}
    items, missing = [], []
    for lyric in song["lyrics"]:
        t = (song["introBars"] + lyric["bar"] - 1) * bar_sec
        for seg in lyric["say"]:
            lid = index.get((seg["lang"], normalize(seg["text"])))
            if lid is None:
                missing.append(f"(not in lines.json) {seg['text']}")
                continue
            if not os.path.exists(mp3_path(lid)):
                missing.append(lid)
            items.append((lyric["bar"], song["introBars"] + lyric["bar"] - 1, t, lid, seg["text"]))
    return items, missing, bar_sec


def decode(path):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         check=True, capture_output=True).stdout
    import numpy as np
    return np.frombuffer(raw, dtype=np.float32)


def instrumental(total_sec, bpm):
    import numpy as np
    rng = np.random.default_rng(7)
    beat = 60.0 / bpm
    mix = np.zeros(int(SR * total_sec), dtype=np.float32)

    def add(buf, at):
        i = int(at * SR)
        if i >= len(mix):
            return
        j = min(len(mix), i + len(buf))
        mix[i:j] += buf[: j - i]

    def pluck(freq, dur=1.2, amp=0.22):  # Karplus-Strong
        n = int(SR * dur)
        p = int(SR / freq)
        buf = rng.uniform(-1, 1, p).astype(np.float32)
        out = np.zeros(n, dtype=np.float32)
        for i in range(n):
            k = i % p
            out[i] = buf[k]
            buf[k] = 0.996 * 0.5 * (buf[k] + buf[(k + 1) % p])
        return out * amp

    def bass(freq, dur):
        t = np.arange(int(SR * dur)) / SR
        return (np.sin(2 * np.pi * freq * t) * np.exp(-t * 3) * 0.35).astype(np.float32)

    def kick():
        t = np.arange(int(SR * 0.25)) / SR
        f = 120 * np.exp(-t * 20) + 45
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * 0.6).astype(np.float32)

    def snare():
        t = np.arange(int(SR * 0.18)) / SR
        return (rng.uniform(-1, 1, len(t)) * np.exp(-t * 25) * 0.2).astype(np.float32)

    def hat():
        t = np.arange(int(SR * 0.05)) / SR
        n = np.diff(rng.uniform(-1, 1, len(t)), prepend=0)
        return (n * np.exp(-t * 80) * 0.07).astype(np.float32)

    N = {"G2": 98.0, "A2": 110.0, "C2": 65.41, "F2": 87.31, "C3": 130.81, "E3": 164.81, "F3": 174.61,
         "G3": 196.0, "A3": 220.0, "B3": 246.94, "C4": 261.63, "D4": 293.66, "E4": 329.63}
    chords = [("C2", ["C3", "E3", "G3", "C4"]), ("G2", ["G3", "B3", "D4"]),
              ("A2", ["A3", "C4", "E4"]), ("F2", ["F3", "A3", "C4"])]  # C-G-Am-F
    cache = {}
    n_bars = int(total_sec / (4 * beat)) + 1
    for b in range(n_bars):
        bn, notes = chords[b % 4]
        t0 = b * 4 * beat
        add(bass(N[bn], 2 * beat), t0)
        add(bass(N[bn], 2 * beat), t0 + 2 * beat)
        for half in range(2):
            for i, note in enumerate(notes):
                cache.setdefault(note, pluck(N[note]))
                add(cache[note], t0 + half * 2 * beat + i * 0.018)
        for q in range(4):
            add(kick() if q % 2 == 0 else snare(), t0 + q * beat)
            add(hat(), t0 + q * beat + beat / 2)
    return mix


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="print the timeline and exit")
    args = ap.parse_args()

    song = load_song()
    items, missing, bar_sec = timeline(song)

    print(f"bpm {song['bpm']}, introBars {song['introBars']}, bar = {bar_sec:.2f}s")
    print("bar  idx  seconds  id                text")
    for bar, idx, t, lid, text in items:
        print(f"{bar:>3}  {idx:>3}  {t:7.2f}  {lid}  {text}")
    if missing:
        print("\nmissing lyric MP3s:", file=sys.stderr)
        for m in missing:
            print(f"  {m}", file=sys.stderr)
    if args.dry_run:
        return
    if missing:
        sys.exit("chant.py: missing lyric audio (run generate.py first): " + ", ".join(missing))

    import numpy as np
    import soundfile as sf
    voices = [(t, decode(mp3_path(lid))) for _, _, t, lid, _ in items]
    last_bar = song["introBars"] + max(l["bar"] for l in song["lyrics"]) - 1
    end_voice = max(t + len(v) / SR for t, v in voices)
    total = max(end_voice + 1.0, (last_bar + 1 + TAIL_BARS) * bar_sec)
    mix = instrumental(total, song["bpm"]) * MUSIC_GAIN
    for t, v in voices:
        i = int(t * SR)
        mix[i:i + len(v)] += v * VOICE_GAIN
    fade = np.linspace(1, 0, int(SR * 1.5))
    mix[-len(fade):] *= fade
    mix = mix / max(1e-6, np.abs(mix).max()) * 0.9
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "chant.wav")
        sf.write(wav, mix.astype(np.float32), SR)
        os.makedirs(AUDIO, exist_ok=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", "loudnorm=I=-16:TP=-1.5",
                        "-b:a", "128k", OUT], check=True)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
