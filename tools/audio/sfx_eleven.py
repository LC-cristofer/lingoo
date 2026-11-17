"""Sound effects with ElevenLabs Sound Effects v2 (replaces the synthesized sfx.py set).

    python tools/audio/sfx_eleven.py [--only tap,correct] [--force]

Writes public/audio/sfx/{name}.mp3, trimmed of leading/trailing silence and normalised a few dB
under the voice (the voice lines are loudnorm -16 LUFS). The API key is injected by the session's
network proxy for api.elevenlabs.io; elsewhere export ELEVENLABS_API_KEY.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import AUDIO  # noqa: E402

OUT = os.path.join(AUDIO, "sfx")
API = "https://api.elevenlabs.io/v1/sound-generation"

# name: (prompt, seconds, target mean level dBFS). Short, soft, friendly: a 5–8 year old hears these often.
# Levels sit under the voice (voice lines ≈ -20 dBFS mean); "retry" stays the gentlest of the answer sounds.
SFX = {
    "tap": ("A soft, short, rounded bubble pop for a children's app button press, gentle, clean, dry, no reverb, no music.", 0.5, -30),
    "correct": ("A bright cheerful rising two-note chime on marimba and glockenspiel for a correct answer in a children's learning app, short, clean, warm, no voice.", 1.0, -24),
    "retry": ("A soft gentle low wooden boop, friendly and encouraging, not sad, not a buzzer, for a 'try again' moment in a children's app, short and dry.", 0.7, -29),
    "star": ("A magical twinkling sparkle with a soft rising run of tiny bells, a reward sound for earning a star in a children's app, light and airy.", 1.4, -25),
    "chest": ("A small wooden treasure chest creaking open, then a warm magical shimmer of bells, a reward moment in a children's game, gentle not loud.", 2.0, -24),
    "whoosh": ("A very soft airy whoosh for sliding to the next screen in a children's app, subtle and smooth, no tone.", 0.5, -33),
    "celebrate": ("A short joyful celebration for finishing a lesson in a children's app: playful bells and xylophone flourish with soft confetti pops, lasting the full two and a half seconds with a soft ringing tail, warm, not loud.", 2.5, -24),
}


def generate(name, prompt, seconds, lufs):
    body = json.dumps({"text": prompt, "duration_seconds": seconds, "prompt_influence": 0.5})
    headers = ["-H", "Content-Type: application/json"]
    key = os.environ.get("ELEVENLABS_API_KEY")
    if key:
        headers += ["-H", f"xi-api-key: {key}"]
    with tempfile.TemporaryDirectory() as tmp:
        raw = os.path.join(tmp, "raw.mp3")
        for attempt in range(5):
            res = subprocess.run(["curl", "-sS", "-o", raw, "-w", "%{http_code}", "-X", "POST", API, *headers,
                                  "--data-binary", body], capture_output=True, text=True)
            if res.stdout.strip() == "200":
                break
            time.sleep(2 * (attempt + 1))
        else:
            raise RuntimeError(f"{name}: HTTP {res.stdout.strip()} {res.stderr}")
        os.makedirs(OUT, exist_ok=True)
        out = os.path.join(OUT, f"{name}.mp3")
        # Trim silence at both ends (keeping decaying tails), a 15 ms fade-in, then a measured gain:
        # loudnorm misbehaves on sub-second clips, so set the mean level directly and cap the peak.
        trim = ("silenceremove=start_periods=1:start_threshold=-60dB,areverse,"
                "silenceremove=start_periods=1:start_threshold=-60dB,areverse,afade=t=in:d=0.015")
        trimmed = os.path.join(tmp, "trim.wav")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", trim, "-ar", "44100", "-ac", "1",
                        trimmed], check=True)
        stats = subprocess.run(["ffmpeg", "-i", trimmed, "-af", "volumedetect", "-f", "null", "-"],
                               capture_output=True, text=True).stderr
        mean = float(stats.split("mean_volume:")[1].split("dB")[0])
        peak = float(stats.split("max_volume:")[1].split("dB")[0])
        gain = min(lufs - mean, -3.0 - peak)  # reach the target mean, never push the peak above -3 dBFS
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", trimmed, "-af", f"volume={gain:.2f}dB",
                        "-b:a", "96k", out], check=True)
        print(f"{name}: {out}", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    names = args.only.split(",") if args.only else list(SFX)
    for n in names:
        if not args.force and os.path.exists(os.path.join(OUT, f"{n}.mp3")) and n not in ("whoosh", "celebrate"):
            print(f"{n}: exists (use --force)")
            continue
        generate(n, *SFX[n])


if __name__ == "__main__":
    main()
