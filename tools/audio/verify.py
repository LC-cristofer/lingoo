"""Check every generated line with faster-whisper and flag poor matches.

    python tools/audio/verify.py [--only id1,id2] [--engine eleven|chatterbox]

Lines under 0.80 similarity are regenerated with seeds 43 and 44 (best take kept), with the same
engine that made them (ElevenLabs by default). Lines still under 0.80 are written to
tools/audio/review.md; a run with --only never deletes that file.
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


# What Whisper may write for a spoken letter, by letter. A bare letter line passes if it hears the letter, the spoken
# name sent to the voice (say_as) or one of these.
HOMOPHONES = {"a": {"ay", "hey", "eh", "a"}, "b": {"bee", "be"}, "c": {"see", "sea"}, "d": {"dee"}, "e": {"ee", "eh"},
              "f": {"ef", "eff"}, "g": {"gee"}, "h": {"aitch", "age"}, "i": {"eye", "eyes"}, "j": {"jay"},
              "k": {"kay", "okay"}, "l": {"el", "ell", "elle"}, "m": {"em", "am"}, "n": {"en", "and"},
              "o": {"oh", "owe"}, "p": {"pee", "pea"}, "q": {"cue", "queue"}, "r": {"ar", "are"}, "s": {"ess", "us", "cess"},
              "t": {"tee", "tea"}, "u": {"you"}, "v": {"vee"}, "w": {"double u", "double you"}, "x": {"ex"},
              "y": {"why"}, "z": {"zee", "zed"}}


# Spoken letter name or Whisper spelling -> letter. Only applied to lines that have letters (those with `say_as`).
SPOKEN = {}
for _letter, _names in HOMOPHONES.items():
    for _n in _names | {_letter}:
        SPOKEN[_n] = _letter
SPOKEN.update({"and": "n", "this": "s", "double": "w"})


def canon(tokens):
    """Tokens with spoken letter names turned into the letters ("double u" -> "w", "why" -> "y")."""
    out, i = [], 0
    while i < len(tokens):
        if tokens[i] == "double" and i + 1 < len(tokens) and tokens[i + 1] in ("u", "you"):
            out.append("w")
            i += 2
            continue
        out.append(SPOKEN.get(tokens[i], tokens[i]))
        i += 1
    return out


def score(text, heard, say_as=None):
    """Similarity of what was heard with the text. A line with letters (`say_as`) is compared letter for letter, so
    "Why is for yoyo" matches "Y is for yoyo"; a bare letter passes on the letter, its name or a usual spelling."""
    b = normalize(heard).split()
    if "".join(normalize(text).split()) == "".join(b):  # same letters, spaced differently ("yoyo" / "yo-yo")
        return 1.0
    if not say_as:
        return difflib.SequenceMatcher(None, normalize(text).split(), b).ratio()
    best = 0.0
    for want in (text, say_as):
        w, h = canon(normalize(want).split()), canon(b)
        best = max(best, 1.0 if "".join(w) == "".join(h) else difflib.SequenceMatcher(None, w, h).ratio())
    return best


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
    return score(line["text"], heard, line.get("say_as")), heard


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--engine", choices=["eleven", "chatterbox"], default="eleven")
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
        if args.engine == "eleven":
            from generate_eleven import synth
        else:
            from generate import synth
        best_copy = os.path.join(tempfile.mkdtemp(), "best.mp3")
        shutil.copy(path, best_copy)
        for seed in RETRY_SEEDS:
            synth(l.get("say_as", l["text"]), l["lang"], path, seed)
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
    elif os.path.exists(review) and not args.only:
        os.remove(review)
    print(f"ok {ok}, retried {retried}, flagged {len(flagged)}")


if __name__ == "__main__":
    main()
