"""Background music: two original, seamless loops for the app's calm screens.

    python tools/audio/music.py [--only trail,album]

Composed here note by note (no samples of anyone's song), written as MIDI with mido and played
through FluidSynth with the FluidR3 General MIDI soundfont (MIT licence, Debian package
fluid-soundfont-gm). Output: public/audio/music/{trail,album}.mp3, loudness-normalised under the
voice (the app plays them quieter still and ducks them while the gatinho talks).

A loop is rendered with two extra bars; the reverb tail that rings past the loop point is folded
back onto the start, so the file repeats with no click and no gap.
"""
import argparse
import os
import subprocess
import sys
import tempfile

import mido
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import AUDIO  # noqa: E402

SF2 = os.environ.get("LINGOO_SF2", "/usr/share/sounds/sf2/FluidR3_GM.sf2")
SR = 44100
TPB = 480  # ticks per beat
OUT_DIR = os.path.join(AUDIO, "music")

# MIDI note numbers
N = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}


def note(name):
    """'E5' -> 76. Sharps only ('F#4')."""
    return 12 * (int(name[-1]) + 1) + N[name[:-1]]


CHORDS = {
    "C": ["C3", "E3", "G3"], "Am": ["A2", "C3", "E3"], "F": ["F2", "A2", "C3"], "G": ["G2", "B2", "D3"],
    "Dm": ["D3", "F3", "A3"], "Bb": ["A#2", "D3", "F3"], "Em": ["E3", "G3", "B3"],
}


class Song:
    def __init__(self, bpm):
        self.bpm = bpm
        self.events = []  # (tick, channel, msg kind, note/program, velocity)

    def program(self, ch, prog):
        self.events.append((0, ch, "program", prog, 0))

    def add(self, ch, pitch, start_beat, beats, vel):
        on = int(start_beat * TPB)
        off = int((start_beat + beats) * TPB) - 10
        self.events.append((on, ch, "on", pitch, vel))
        self.events.append((off, ch, "off", pitch, 0))

    def write(self, path, cc=None):
        mid = mido.MidiFile(ticks_per_beat=TPB)
        tr = mido.MidiTrack()
        mid.tracks.append(tr)
        tr.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(self.bpm), time=0))
        for ch, ctrl, val in cc or []:
            tr.append(mido.Message("control_change", channel=ch, control=ctrl, value=val, time=0))
        order = {"program": 0, "off": 1, "on": 2}
        last = 0
        for tick, ch, kind, a, b in sorted(self.events, key=lambda e: (e[0], order[e[2]])):
            dt = tick - last
            last = tick
            if kind == "program":
                tr.append(mido.Message("program_change", channel=ch, program=a, time=dt))
            elif kind == "on":
                tr.append(mido.Message("note_on", channel=ch, note=a, velocity=b, time=dt))
            else:
                tr.append(mido.Message("note_off", channel=ch, note=a, velocity=0, time=dt))
        mid.save(path)


def melody(song, ch, bars, vel, octave_shift=0):
    """bars: list of bars, each a list of (note name or None, beats)."""
    t = 0.0
    for bar in bars:
        for name, beats in bar:
            if name:
                song.add(ch, note(name) + 12 * octave_shift, t, beats, vel)
            t += beats


# ---------------------------------------------------------------- trail (the map): bright, 104 bpm

TRAIL_PROG = ["C", "Am", "F", "G", "C", "Am", "Dm", "G"] * 2
TRAIL_MEL_A = [
    [("E5", 1), ("G5", 1), ("A5", 1), ("G5", 1)],
    [("E5", 2), ("C5", 1), ("D5", 1)],
    [("C5", 1), ("D5", 1), ("E5", 1), ("F5", 1)],
    [("D5", 1), ("B4", 1), ("D5", 2)],
    [("E5", 1), ("G5", 1), ("C6", 1), ("A5", 1)],
    [("G5", 2), ("E5", 1), ("C5", 1)],
    [("D5", 1), ("F5", 1), ("E5", 1), ("D5", 1)],
    [("C5", 2), (None, 1), ("G4", 1)],
]
TRAIL_MEL_B = TRAIL_MEL_A[:6] + [
    [("F5", 1), ("E5", 1), ("D5", 1), ("C5", 1)],
    [("D5", 2), ("G4", 1), ("B4", 1)],
]


def trail():
    s = Song(104)
    s.program(0, 9)    # glockenspiel: melody
    s.program(1, 24)   # nylon guitar: chords
    s.program(2, 45)   # pizzicato strings: bass
    s.program(3, 12)   # marimba: answers in the second half
    melody(s, 0, TRAIL_MEL_A + TRAIL_MEL_B, 62)
    for i, ch in enumerate(TRAIL_PROG):
        b = i * 4
        tones = [note(n) + 12 for n in CHORDS[ch]]
        for beat, vel in ((0, 58), (1.5, 44), (2, 52), (3, 44)):  # gentle strum pattern
            for k, p in enumerate(tones):
                s.add(1, p, b + beat + k * 0.02, 0.9, vel)
        root = note(CHORDS[ch][0]) - 12
        s.add(2, root, b, 1, 70)
        s.add(2, root + 7, b + 2, 1, 60)
        if i >= 8:  # marimba arpeggio, second time round only
            for k, n in enumerate(CHORDS[ch]):
                s.add(3, note(n) + 24, b + 0.5 + k, 0.5, 40)
    for beat in range(len(TRAIL_PROG) * 4 * 2):  # shaker on eighths, soft; kick on 1
        s.add(9, 82, beat / 2, 0.25, 30 if beat % 2 else 40)
    for i in range(len(TRAIL_PROG)):
        s.add(9, 36, i * 4, 0.5, 45)
    return s, len(TRAIL_PROG) * 4


# ---------------------------------------------------------------- album / memória: calm, 84 bpm

ALBUM_PROG = ["F", "Dm", "Bb", "C"] * 4
ALBUM_MEL = [
    [("A5", 1.5), ("C6", 0.5), ("A5", 1), ("F5", 1)],
    [("D5", 2), ("F5", 1), ("A5", 1)],
    [("A#5", 1.5), ("A5", 0.5), ("G5", 1), ("F5", 1)],
    [("G5", 3), (None, 1)],
    [("A5", 1), ("C6", 1), ("D6", 1), ("C6", 1)],
    [("A5", 2), ("F5", 2)],
    [("G5", 1), ("A5", 1), ("A#5", 1), ("D6", 1)],
    [("C6", 3), (None, 1)],
]


def album():
    s = Song(84)
    s.program(0, 10)   # music box: melody
    s.program(1, 12)   # marimba: broken chords
    s.program(2, 89)   # warm pad
    s.program(3, 32)   # acoustic bass
    melody(s, 0, ALBUM_MEL + ALBUM_MEL, 64)
    for i, ch in enumerate(ALBUM_PROG):
        b = i * 4
        tones = [note(n) + 12 for n in CHORDS[ch]]
        for k, beat in enumerate((0, 1, 2, 3)):
            s.add(1, tones[[0, 1, 2, 1][k]], b + beat, 1, 38)
        for p in tones:
            s.add(2, p, b, 4, 30)
        s.add(3, note(CHORDS[ch][0]) - 12, b, 2, 55)
    return s, len(ALBUM_PROG) * 4


# ---------------------------------------------------------------- render

def render(song, beats, out_mp3, loudnorm="I=-22:TP=-3"):
    loop_sec = beats * 60.0 / song.bpm
    with tempfile.TemporaryDirectory() as tmp:
        mid = os.path.join(tmp, "song.mid")
        wav = os.path.join(tmp, "song.wav")
        song.write(mid, cc=[(ch, 91, 70) for ch in range(4)] + [(ch, 93, 20) for ch in range(4)])
        subprocess.run(["fluidsynth", "-ni", "-g", "0.6", "-r", str(SR), "-F", wav, SF2, mid],
                       check=True, capture_output=True)
        audio, sr = sf.read(wav, always_2d=True)
        n = int(round(loop_sec * sr))
        if len(audio) < n:
            audio = np.vstack([audio, np.zeros((n - len(audio), audio.shape[1]))])
        loop = audio[:n].copy()
        tail = audio[n:]
        loop[: len(tail)] += tail[: n]  # fold the ringing tail back onto the start: seamless repeat
        peak = np.max(np.abs(loop))
        if peak > 0.98:
            loop *= 0.98 / peak
        folded = os.path.join(tmp, "loop.wav")
        sf.write(folded, loop, sr)
        os.makedirs(os.path.dirname(out_mp3), exist_ok=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", folded, "-af", f"loudnorm={loudnorm}",
                        "-ar", "44100", "-b:a", "96k", out_mp3], check=True)
    print(f"wrote {out_mp3} ({loop_sec:.1f} s loop)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="trail,album")
    args = ap.parse_args()
    for name in args.only.split(","):
        song, beats = {"trail": trail, "album": album}[name]()
        render(song, beats, os.path.join(OUT_DIR, f"{name}.mp3"))


if __name__ == "__main__":
    main()
