# Lingoo audio tools

Offline Python tools that make the MP3 files the app plays (`public/audio/`).
Voice: Chatterbox Multilingual (MIT), built-in voice, CPU. Check: faster-whisper.

## Setup

```bash
uv venv -p python3.11 tools/audio/.venv
uv pip install --python tools/audio/.venv/bin/python -r tools/audio/requirements.txt \
  --extra-index-url https://download.pytorch.org/whl/cpu --index-strategy unsafe-best-match
```

- torch comes from the CPU wheel index (`https://download.pytorch.org/whl/cpu`), hence the extra index.
- `setuptools<81` is required: `resemble-perth` (used by Chatterbox) imports `pkg_resources`,
  and without it Chatterbox crashes on `PerthImplicitWatermarker`.
- ffmpeg must be on the PATH.

## Usage (from the repo root, with `tools/audio/.venv/bin/python`)

| Command | What it does |
| --- | --- |
| `generate.py [--only id,id] [--seed N] [--force]` | Voices every line of `lines.json` to `public/audio/{id}.mp3` (skips existing). Prints `generated N, skipped M`. About 30-60 s per line on CPU. |
| `verify.py` | Transcribes each MP3 (faster-whisper small, int8), compares with the text (difflib ratio, threshold 0.80), regenerates failures with seeds 43 and 44, writes `review.md` for the rest. Prints `ok X, retried Y, flagged Z`. |
| `sfx.py` | Synthesizes `public/audio/sfx/{correct,retry,star,chest,tap}.mp3` (max 1.2 s, about 6 dB under the voice). |
| `chant.py [--dry-run]` | Original C-G-Am-F instrumental plus the voice MP3s on the beat -> `public/audio/song-forest-animals.mp3`. Fails listing missing ids if `generate.py` has not run. `--dry-run` prints the timeline. |

Full run: `generate.py && verify.py && chant.py`, then `sfx.py`.
The Whisper model is cached in `tools/audio/.cache/` (git-ignored).
