"""Generate the gatinho's voice with ElevenLabs (voice "Lingoo", approved by Lucas on 2026-11-17).

    python tools/audio/generate_eleven.py [--only id1,id2] [--seed 42] [--force] [--jobs 3]

A line with `say_as` (English letters said by their names, see src/domain/letras/say-as.ts) sends that to the
voice instead of its text; the file name (the id) is unchanged. Same contract as generate.py (Chatterbox): one MP3 per line of lines.json at public/audio/{id}.mp3,
normalised with the same loudnorm, so the app needs no change. The API key is NOT read here: the
session's network proxy injects it into requests to api.elevenlabs.io. Elsewhere, export
ELEVENLABS_API_KEY and it is sent as the xi-api-key header.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import LANG_ID, encode_mp3, load_lines, mp3_path  # noqa: E402

VOICE_ID = "WkDEtY2mQ0GvZNaE8SQa"  # "Lingoo" in Lucas's ElevenLabs library
MODEL_ID = "eleven_v4"
API = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_44100_128"


def synth(text, lang, out_mp3, seed=42):
    """Synthesize one line to out_mp3 (same signature as generate.synth, so verify.py can retry with it)."""
    body = json.dumps({"text": text, "model_id": MODEL_ID, "language_code": LANG_ID[lang], "seed": seed})
    headers = ["-H", "Content-Type: application/json"]
    key = os.environ.get("ELEVENLABS_API_KEY")
    if key:
        headers += ["-H", f"xi-api-key: {key}"]
    with tempfile.TemporaryDirectory() as tmp:
        raw = os.path.join(tmp, "raw.mp3")
        for attempt in range(6):
            res = subprocess.run(["curl", "-sS", "-o", raw, "-w", "%{http_code}", "-X", "POST", API, *headers,
                                  "--data-binary", body], capture_output=True, text=True)
            code = res.stdout.strip()
            if code == "200":
                break
            # 429 = concurrency or rate limit; 5xx = transient. Back off and try again.
            if code in ("429", "500", "502", "503", "504") or res.returncode != 0:
                time.sleep(2 * (attempt + 1))
                continue
            detail = open(raw, encoding="utf-8", errors="replace").read()[:300] if os.path.exists(raw) else res.stderr
            raise RuntimeError(f"ElevenLabs HTTP {code}: {detail}")
        else:
            raise RuntimeError(f"ElevenLabs kept failing for: {text}")
        encode_mp3(raw, out_mp3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated line ids")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--force", action="store_true", help="regenerate existing files")
    ap.add_argument("--jobs", type=int, default=3, help="parallel requests (Starter allows 3)")
    args = ap.parse_args()

    lines = load_lines()
    if args.only:
        wanted = [s.strip() for s in args.only.split(",") if s.strip()]
        known = {l["id"] for l in lines}
        unknown = [w for w in wanted if w not in known]
        if unknown:
            sys.exit(f"unknown ids: {', '.join(unknown)}")
        lines = [l for l in lines if l["id"] in wanted]
    todo = [l for l in lines if args.force or not os.path.exists(mp3_path(l["id"]))]

    def one(l):
        t0 = time.time()
        synth(l.get("say_as", l["text"]), l["lang"], mp3_path(l["id"]), args.seed)
        print(f"{l['id']} {time.time() - t0:.1f}s  {l['text']}", flush=True)

    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        list(pool.map(one, todo))
    print(f"generated {len(todo)}, skipped {len(lines) - len(todo)}")


if __name__ == "__main__":
    main()
