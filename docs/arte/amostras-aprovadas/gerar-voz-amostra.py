"""Amostras de voz com Chatterbox Multilingual (MIT), na CPU.

Gera as mesmas falas com 3 opções de voz de personagem:
  v1 = voz padrão do Chatterbox
  v2 = voz clonada de uma referência feminina em inglês (Kokoro af_heart)
  v3 = voz clonada de uma referência feminina em português (Kokoro pf_dora)
Cada trecho é gerado com o idioma certo (pt ou en), mantendo a mesma voz.
"""
import os, subprocess, sys
import torch, torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

torch.manual_seed(42)
BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "voz2")
REFS = os.path.join(BASE, "refs")
os.makedirs(OUT, exist_ok=True)

model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
SR = model.sr

def say(text, lang, ref):
    wav = model.generate(text, language_id=lang, audio_prompt_path=ref, exaggeration=0.6, cfg_weight=0.4, temperature=0.7)
    return wav

def sil(sec):
    return torch.zeros(1, int(SR * sec))

def save(name, parts):
    wav = torch.cat(parts, dim=1)
    path = os.path.join(OUT, name + ".wav")
    ta.save(path, wav, SR)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-af", "loudnorm=I=-16:TP=-1.5", "-b:a", "128k", os.path.join(OUT, name + ".mp3")], check=True)
    os.remove(path)

voices = {"v1-padrao": None,
          "v2-ref-ingles": os.path.join(REFS, "ref_en.wav"),
          "v3-ref-portugues": os.path.join(REFS, "ref_pt.wav")}
only = sys.argv[1:] or list(voices)
for vname in only:
    ref = voices[vname]
    save(f"{vname}-1-abertura", [say("Oi! Hoje nós vamos aprender os animais da floresta!", "pt", ref)])
    save(f"{vname}-2-palavra-nova", [say("Esse é o urso. Em inglês:", "pt", ref), sil(0.2), say("Bear.", "en", ref), sil(0.45),
                                     say("Repita comigo:", "pt", ref), sil(0.2), say("Bear!", "en", ref)])
    save(f"{vname}-3-acerto", [say("Yes! That's great!", "en", ref)])
    save(f"{vname}-4-erro", [say("Opa! Vamos tentar de novo.", "pt", ref)])
    print("ok", vname, flush=True)
