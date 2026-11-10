"""Check every generated line with faster-whisper and flag poor matches.

    python tools/audio/verify.py [--only id1,id2]

Lines under 0.80 similarity are regenerated with seeds 43 and 44 (best take kept).
Lines still under 0.80 are written to tools/audio/review.md.
"""
import argparse
import difflib
import os
import shutil
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import CACHE, HERE, LANG_ID, load_lines, mp3_path, normalize  # noqa: E402

THRESHOLD = 0.80
RETRY_SEEDS = (43, 44)
_whisper = None


def score(text, heard):
    a, b = normalize(text).split(), normalize(heard).split()
    return difflib.SequenceMatcher(None, a, b).ratio()


def transcribe(path, lang):
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel
        _whisper = WhisperModel("small", device="cpu", compute_type="int8",
                                download_root=os.path.join(CACHE, "whisper"))
    segments, _ = _whisper.transcribe(path, language=LANG_ID[lang], beam_size=5)
    return " ".join(s.text for s in segments)


def check(line):
    heard = transcribe(mp3_path(line["id"]), line["lang"])
    return score(line["text"], heard), heard


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    args = ap.parse_args()
    lines = load_lines()
    if args.only:
        wanted = set(args.only.split(","))
        lines = [l for l in lines if l["id"] in wanted]

    ok = retried = 0
    flagged = []
    for l in lines:
        path = mp3_path(l["id"])
        if not os.path.exists(path):
            continue
        best, heard = check(l)
        if best >= THRESHOLD:
            ok += 1
            print(f"ok   {best:.2f} {l['id']} {l['text']}", flush=True)
            continue
        retried += 1
        from generate import synth
        best_copy = os.path.join(tempfile.mkdtemp(), "best.mp3")
        shutil.copy(path, best_copy)
        for seed in RETRY_SEEDS:
            synth(l["text"], l["lang"], path, seed)
            s, h = check(l)
            print(f"retry seed {seed}: {s:.2f} {l['id']} (heard: {h.strip()})", flush=True)
            if s > best:
                best, heard = s, h
                shutil.copy(path, best_copy)
            if best >= THRESHOLD:
                break
        shutil.copy(best_copy, path)
        if best < THRESHOLD:
            flagged.append((l, best, heard))

    review = os.path.join(HERE, "review.md")
    if flagged:
        with open(review, "w", encoding="utf-8") as f:
            f.write("# Lines to review by ear\n\nSimilarity below 0.80 after retries (seeds 43 and 44).\n\n")
            for l, s, h in flagged:
                f.write(f"- `{l['id']}` ({l['lang']}) score {s:.2f}\n  - text: {l['text']}\n  - heard: {h.strip()}\n")
    elif os.path.exists(review):
        os.remove(review)
    print(f"ok {ok}, retried {retried}, flagged {len(flagged)}")


if __name__ == "__main__":
    main()
