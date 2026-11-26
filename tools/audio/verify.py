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


# What Whisper may write for a spoken letter, by letter. ONLY a bare-letter line ("B", "B?") passes on these: a letter
# alone has nothing else to check. In a sentence they would hide a real failure ("S is for sun!" heard as "This is for
# sun!"), so there only the letter and the name the voice was sent count (NAMES below).
HOMOPHONES = {"a": {"ay", "hey", "eh", "a"}, "b": {"bee", "be"}, "c": {"see", "sea"}, "d": {"dee"}, "e": {"ee", "eh"},
              "f": {"ef", "eff"}, "g": {"gee"}, "h": {"aitch", "age"}, "i": {"eye", "eyes"}, "j": {"jay"},
              "k": {"kay", "okay"}, "l": {"el", "ell", "elle"}, "m": {"em", "am"}, "n": {"en", "and"},
              "o": {"oh", "owe"}, "p": {"pee", "pea"}, "q": {"cue", "queue"}, "r": {"ar", "are"}, "s": {"ess", "us", "cess"},
              "t": {"tee", "tea"}, "u": {"you"}, "v": {"vee"}, "w": {"double u", "double you"}, "x": {"ex"},
              "y": {"why"}, "z": {"zee", "zed"}}

# The spoken names themselves (content/areas/letras/bank.json, plus the respellings in src/domain/letras/say-as.ts).
NAMES = {"a": {"ay", "ey"}, "b": {"bee"}, "c": {"see"}, "d": {"dee"}, "e": {"ee"}, "f": {"ef"}, "g": {"gee"},
         "h": {"aitch"}, "i": {"eye"}, "j": {"jay"}, "k": {"kay"}, "l": {"el", "ell"}, "m": {"em"}, "n": {"en"},
         "o": {"oh"}, "p": {"pee"}, "q": {"cue"}, "r": {"ar"}, "s": {"ess"}, "t": {"tee"}, "u": {"you"}, "v": {"vee"},
         "w": {"double u", "double you"}, "x": {"ex"}, "y": {"why"}, "z": {"zee"}}


def _spoken(table):
    out = {}
    for letter, names in table.items():
        for n in names | {letter}:
            out[n] = letter
    return out


SPOKEN_BARE = _spoken(HOMOPHONES)
SPOKEN_BARE.update({"and": "n", "this": "s", "double": "w"})
SPOKEN_NAME = _spoken(NAMES)
SPOKEN_NAME["and"] = "n"  # Whisper writes the name "en" as "and" in a list ("N, O, P, Q!"); unlike "this" for "ess", it is the name heard


def canon(tokens, table):
    """Tokens with spoken letter names turned into the letters ("double u" -> "w", "why" -> "y")."""
    out, i = [], 0
    while i < len(tokens):
        if tokens[i] == "double" and i + 1 < len(tokens) and tokens[i + 1] in ("u", "you"):
            out.append("w")
            i += 2
            continue
        out.append(table.get(tokens[i], tokens[i]))
        i += 1
    return out


def score(text, heard, say_as=None):
    """Similarity of what was heard with the text. A line with letters (`say_as`) is compared letter for letter, so
    "Why is for yoyo" matches "Y is for yoyo"; only a bare letter also passes on the usual Whisper spellings."""
    b = normalize(heard).split()
    if "".join(normalize(text).split()) == "".join(b):  # same letters, spaced differently ("yoyo" / "yo-yo")
        return 1.0
    if not say_as:
        return difflib.SequenceMatcher(None, normalize(text).split(), b).ratio()
    table = SPOKEN_BARE if len(normalize(text).split()) == 1 else SPOKEN_NAME
    best = 0.0
    for want in (text, say_as):
        w, h = canon(normalize(want).split(), table), canon(b, table)
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
