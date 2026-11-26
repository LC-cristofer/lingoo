# Lingoo audio tools

Offline Python tools that make the MP3 files the app plays (`public/audio/`).
Voice: ElevenLabs, voice "Lingoo" (designed for the app, Starter plan with commercial rights), via
`generate_eleven.py`. The older Chatterbox generator (`generate.py`, MIT, CPU) is kept as a free fallback.
Check: faster-whisper. Background music: `music.py` (original, FluidSynth + FluidR3 GM soundfont).

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
| `generate_eleven.py [--only id,id] [--seed N] [--force] [--jobs 3]` | Voices every line with ElevenLabs to `public/audio/{id}.mp3`, same loudnorm. The API key comes from the network proxy in cloud sessions, or `ELEVENLABS_API_KEY` elsewhere. About 1 s per line. |
| `generate.py [--only id,id] [--seed N] [--force]` | Voices every line of `lines.json` to `public/audio/{id}.mp3` (skips existing). Prints `generated N, skipped M`. About 30-60 s per line on CPU. |
| `verify.py [--only id,id] [--engine eleven\|chatterbox]` | Transcribes each MP3 (faster-whisper small, int8), compares with the text (difflib ratio, threshold 0.80), regenerates failures with seeds 43 and 44 using the same engine (ElevenLabs by default), writes `review.md` for the rest (a run with `--only` never deletes it). Prints `ok X, retried Y, flagged Z`. |
| `sfx.py` | Synthesizes `public/audio/sfx/{correct,retry,star,chest,tap}.mp3` (max 1.2 s, about 6 dB under the voice). |
| `chant.py [unit-id] [--dry-run]` | Original C-G-Am-F instrumental plus the voice MP3s on the beat, from the song stop of `content/units/{unit-id}.json` (default `forest-animals`; also `letras-1` ... `letras-4`) -> `public/audio/song-{unit-id}.mp3`, the file the app plays. Fails listing missing ids if the voices have not been generated. `--dry-run` prints the timeline. |

| `music.py [--only trail,album]` | Original background loops -> `public/audio/music/{trail,album}.mp3`. Needs `fluidsynth` and the `fluid-soundfont-gm` package (`apt-get install -y fluidsynth fluid-soundfont-gm`) and `mido`. |

Letters are said by their English names: `npm run audio:lines` writes a `say_as` for every English line that has letters
("B" -> "bee", "B is for ball!" -> "bee is for ball!", "D-O-G, dog!" -> "dee, oh, gee, dog!"), built from the names in
`content/areas/letras/bank.json` (`src/domain/letras/say-as.ts`). The voice is sent `say_as`; the id and the app text do not change,
and `verify.py` accepts the letter, its name or a usual Whisper spelling of it for a bare-letter line; inside a sentence only the letter or its name pass ("This is for sun!" is not "S is for sun!").

Full run: `generate_eleven.py && verify.py && chant.py`, then `sfx.py` and `music.py`.
The Whisper model is cached in `tools/audio/.cache/` (git-ignored).
