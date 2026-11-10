"""Shared helpers for the Lingoo audio tools."""
import json
import os
import re
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
LINES = os.path.join(HERE, "lines.json")
AUDIO = os.path.join(ROOT, "public", "audio")
CACHE = os.path.join(HERE, ".cache")
LANG_ID = {"pt-BR": "pt", "en-US": "en"}


def load_lines():
    with open(LINES, encoding="utf-8") as f:
        return json.load(f)


def mp3_path(line_id):
    return os.path.join(AUDIO, f"{line_id}.mp3")


def normalize(text):
    text = text.lower().replace("’", "'")
    text = re.sub(r"[^\w\s]|_", " ", text)
    return " ".join(text.split())


def encode_mp3(wav_path, mp3_path_, loudnorm="I=-16:TP=-1.5"):
    os.makedirs(os.path.dirname(mp3_path_), exist_ok=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path, "-af", f"loudnorm={loudnorm}",
                    "-b:a", "128k", "-ar", "44100", mp3_path_], check=True)
