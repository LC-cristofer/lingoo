"""Mix the film's soundtrack from the audio log (exact frame times) and mux it with the frames."""
import json, os, subprocess, sys
D = os.path.dirname(os.path.abspath(__file__))
FPS = 30
frames = sorted(f for f in os.listdir(os.path.join(D, "out", "frames")) if f.endswith(".jpg"))
total = len(frames) / FPS
log = json.load(open(os.path.join(D, "out", "full-audio.json")))
inputs, filters, labels = [], [], []
count = [0]
def add(args):
    inputs.extend(args); i = count[0]; count[0] += 1; labels.append(f"[s{i}]"); return i
def snd(name): return os.path.join(D, "sons", name + ".mp3")
# one-shots
shots = [e for e in log if "name" in e]
for e in shots:
    i = add(["-i", snd(e["name"])])
    vol = e["vol"] * (1.0 if e["name"].startswith(("v_", "e_")) else 0.9)
    filters.append(f"[{i}:a]aformat=sample_rates=44100:channel_layouts=stereo,volume={vol:.3f},adelay={int(e['t'])}|{int(e['t'])}[s{i}]")
# loops: piecewise-linear volume envelopes
loops = {}
for e in [e for e in log if "loop" in e]:
    loops.setdefault(e["loop"], []).append(e)
MUSIC = 0.55  # the approved map music sits under the voice
for name, evs in loops.items():
    pts, v = [(0.0, 0.0)], 0.0
    for e in sorted(evs, key=lambda e: e["t"]):
        t0 = e["t"] / 1000; pts.append((t0, v)); v = e["vol"] * (MUSIC if name == "trail" else 1.0); pts.append((t0 + e["fade"] / 1000, v))
    pts.append((total + 1, v))
    expr = "0"
    for (a, va), (b, vb) in reversed(list(zip(pts, pts[1:]))):
        if b <= a: continue
        expr = f"if(between(t,{a:.3f},{b:.3f}),{va:.4f}+({vb:.4f}-{va:.4f})*(t-{a:.3f})/{b - a:.3f},{expr})"
    i = add(["-stream_loop", "-1", "-i", snd(name)])
    filters.append(f"[{i}:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:{total:.3f},volume='{expr}':eval=frame[s{i}]")
n = len(filters)
graph = ";".join(filters) + f";{''.join(labels)}amix=inputs={n}:normalize=0:dropout_transition=0,atrim=0:{total:.3f},alimiter=limit=0.9[out]"
open(os.path.join(D, "out", "graph.txt"), "w").write(graph)
audio = os.path.join(D, "out", "mix.m4a")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex_script", os.path.join(D, "out", "graph.txt"), "-map", "[out]", "-c:a", "aac", "-b:a", "128k", audio], check=True)
out = os.path.join(D, "out", "nestoy-jornada.mp4")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(D, "out", "frames", "%05d.jpg"), "-i", audio,
                "-vf", "scale=720:-2:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                "-c:a", "copy", "-shortest", out], check=True)
print("ok", out, f"{os.path.getsize(out) / 1e6:.1f} MB", f"{total:.1f}s", len(shots), "shots", list(loops))
