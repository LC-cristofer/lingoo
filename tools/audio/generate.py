"""Generate the gatinho's voice (Chatterbox Multilingual, built-in voice 1, CPU).

    python tools/audio/generate.py [--only id1,id2] [--seed 42] [--force]
"""
import argparse
import os
import sys
import tempfile
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import LANG_ID, encode_mp3, load_lines, mp3_path  # noqa: E402

PARAMS = dict(exaggeration=0.6, cfg_weight=0.4, temperature=0.7)
_model = None


def get_model():
    global _model
    if _model is None:
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
        _model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
    return _model


def synth(text, lang, out_mp3, seed=42):
    """Synthesize one line to out_mp3. Voice 1: no audio_prompt_path."""
    import torch
    import torchaudio as ta
    model = get_model()
    torch.manual_seed(seed)
    wav = model.generate(text, language_id=LANG_ID[lang], **PARAMS)
    with tempfile.TemporaryDirectory() as tmp:
        wav_path = os.path.join(tmp, "line.wav")
        ta.save(wav_path, wav, model.sr)
        encode_mp3(wav_path, out_mp3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated line ids")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--force", action="store_true", help="regenerate existing files")
    args = ap.parse_args()

    lines = load_lines()
    if args.only:
        wanted = [s.strip() for s in args.only.split(",") if s.strip()]
        known = {l["id"] for l in lines}
        unknown = [w for w in wanted if w not in known]
        if unknown:
            sys.exit(f"unknown ids: {', '.join(unknown)}")
        lines = [l for l in lines if l["id"] in wanted]

    generated = skipped = 0
    for i, l in enumerate(lines, 1):
        out = mp3_path(l["id"])
        if os.path.exists(out) and not args.force:
            skipped += 1
            continue
        t0 = time.time()
        synth(l["text"], l["lang"], out, args.seed)
        generated += 1
        print(f"[{i}/{len(lines)}] {l['id']} {time.time() - t0:.1f}s  {l['text']}", flush=True)
    print(f"generated {generated}, skipped {skipped}")


if __name__ == "__main__":
    main()
