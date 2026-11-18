"""Scratch: sounds and new Nino lines for the Ilha-Ninho prototype (nothing is written to the repo)."""
import json, os, subprocess, sys, tempfile, time
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, "/home/user/lingoo/tools/audio")
from generate_eleven import synth  # writes only to the path we pass
OUT = os.path.dirname(os.path.abspath(__file__))
API = "https://api.elevenlabs.io/v1/sound-generation"
VOICE = {
  "v_oi": "Oi! Eu sou o Nino.",
  "v_vem": "Vem! Vamos explorar a ilha!",
  "v_farol": "Esse é o Farol das Línguas!",
  "v_subir": "Vamos subir a escada do farol?",
  "v_obra": "Esse lugar ainda está sendo construído. Logo fica pronto!",
  "v_brilhou": "Olha! O farol brilhou mais forte!",
  "v_ninho": "Guardei a sua figurinha no ninho.",
  "v_noite": "Boa noite! Amanhã a gente brinca mais.",
  "v_pausa": "Que tal uma pausa? Vou esticar as patinhas.",
}
# name: (prompt, seconds, target mean dBFS, loop)
SFX = {
  "amb_dia": ("Calm daytime ambience on a small magical floating island: soft breeze, gentle leaves rustling, a few distant small songbirds, very peaceful, no music.", 20, -36, True),
  "amb_noite": ("Calm night ambience on a small island: soft crickets, very gentle breeze, peaceful, no music.", 20, -38, True),
  "reveal": ("A soft magical whoosh that rises gently with warm airy pads and tiny glittering chimes, for a camera slowly pulling back to reveal a floating island in a children's game, gentle and warm, not epic.", 5, -27, False),
  "yawn": ("A tiny cute cartoon kitten yawn, soft and sleepy, short.", 1.5, -28, False),
  "stretch": ("A soft cute cartoon stretch sound, a gentle rising boing, short.", 1, -30, False),
  "pop": ("A soft bubbly pop with a tiny bright chime, for a place appearing on a map in a children's game, very short.", 0.6, -30, False),
  "steps": ("Tiny soft cartoon footsteps on grass, quick pitter-patter, cute.", 1.2, -32, False),
  "bell": ("A gentle small bell ding from a toy lighthouse, warm, with a soft tail.", 1.5, -29, False),
  "blocks": ("Wooden toy blocks gently clacking together, soft and short.", 0.8, -29, False),
  "pages": ("Book pages fluttering softly, short.", 0.8, -31, False),
  "water": ("A small soft water plop with a gentle splash, cute, short.", 0.8, -30, False),
  "leaves": ("Soft leaves rustling with a tiny flower pop, short.", 0.8, -31, False),
  "obra": ("A tiny wooden toy hammer tapping softly three times, cute.", 1, -30, False),
  "dive": ("A soft airy swoosh moving into a cozy room with a gentle wooden door creak, children's game.", 1.2, -30, False),
  "grow": ("A magical growing sparkle: soft rising glitter chimes and a warm glow swell, gentle.", 2, -27, False),
  "thread": ("A soft magical weaving sound, a gentle short harp glissando.", 1.2, -30, False),
  "night": ("A slow gentle transition from day to night: soft wind chimes descending, calm and warm.", 2.5, -30, False),
}
def sfx(name, prompt, secs, level, loop):
    body = {"text": prompt, "duration_seconds": secs, "prompt_influence": 0.5}
    if loop: body["loop"] = True
    with tempfile.TemporaryDirectory() as tmp:
        raw = os.path.join(tmp, "raw.mp3")
        for attempt in range(6):
            r = subprocess.run(["curl", "-sS", "-o", raw, "-w", "%{http_code}", "-X", "POST", API, "-H", "Content-Type: application/json", "--data-binary", json.dumps(body)], capture_output=True, text=True)
            if r.stdout.strip() == "200": break
            time.sleep(2 * (attempt + 1))
        else:
            raise RuntimeError(f"{name}: HTTP {r.stdout.strip()} {open(raw, errors='replace').read()[:200] if os.path.exists(raw) else ''}")
        wav = os.path.join(tmp, "a.wav")
        af = "anull" if loop else ("silenceremove=start_periods=1:start_threshold=-60dB,areverse,silenceremove=start_periods=1:start_threshold=-60dB,areverse,afade=t=in:d=0.012")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", af, "-ar", "44100", "-ac", "1", wav], check=True)
        st = subprocess.run(["ffmpeg", "-i", wav, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
        mean = float(st.split("mean_volume:")[1].split("dB")[0]); peak = float(st.split("max_volume:")[1].split("dB")[0])
        gain = min(level - mean, -3.0 - peak)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", f"volume={gain:.2f}dB", "-b:a", "96k", os.path.join(OUT, f"{name}.mp3")], check=True)
    print("sfx", name, flush=True)
def voice(name, text):
    synth(text, "pt-BR", os.path.join(OUT, f"{name}.mp3"))
    print("voice", name, flush=True)
jobs = [(voice, (k, v)) for k, v in VOICE.items()] + [(sfx, (k, *v)) for k, v in SFX.items()]
jobs = [j for j in jobs if not os.path.exists(os.path.join(OUT, j[1][0] + ".mp3"))]
with ThreadPoolExecutor(max_workers=3) as pool:
    for f in [pool.submit(fn, *a) for fn, a in jobs]:
        try: f.result()
        except Exception as e: print("ERR", e, flush=True)
