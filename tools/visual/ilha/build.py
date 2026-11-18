"""Assemble the prototype: out/proto.html (standalone) and pieces reused by the book."""
import json, os, re, subprocess, sys
D = os.path.dirname(os.path.abspath(__file__))
R = lambda p: open(os.path.join(D, p), encoding="utf-8").read()
CAT = os.path.join(D, "..", "direcoes", "cat")
def sym(path, sid):
    s = open(path).read()
    vb = re.search(r'viewBox="([^"]+)"', s).group(1)
    inner = re.search(r"<svg[^>]*>(.*)</svg>", s, re.S).group(1)
    return f'<symbol id="{sid}" viewBox="{vb}">{inner}</symbol>'
logo = json.load(open(os.path.join(D, "logo", "logo.json")))
symbols = "".join(sym(f"{CAT}/animal-{a}.svg", f"ani-{a}") for a in ["bear", "bird", "frog"])
symbols += f'<symbol id="nest-o" viewBox="-20 0 640 600">{logo["mark"]}</symbol>'
SYMBOLS = f'<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>{symbols}</defs></svg>'
dur = {}
for f in sorted(os.listdir(os.path.join(D, "sons"))):
    if f.endswith(".mp3"):
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(D, "sons", f)], capture_output=True, text=True).stdout
        dur[f[:-4]] = round(float(out), 3)
dur["trail"] = 0
STAGE = R("src/stage.html").replace("{{LOGO}}", logo["wordmark"])
JS = "\n".join(R(f"src/{f}") for f in ["world.js", "nino.js", "interior.js"])
APP = R("src/app.js")
CSS = R("src/proto.css")
def page(cfg, extra_head=""):
    return f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NESTOY protótipo</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Nunito:wght@700;800;900&display=swap">
<style>html,body{{margin:0;background:#111}}{CSS}</style>{extra_head}</head><body>{SYMBOLS}{STAGE}
<script>window.NESTOY_CFG={json.dumps(cfg)};window.NESTOY_DUR={json.dumps(dur)};</script>
<script>{JS}</script><script>{APP}</script></body></html>'''
os.makedirs(os.path.join(D, "out"), exist_ok=True)
open(os.path.join(D, "out", "proto.html"), "w").write(page({"sounds": "../sons/", "autostart": True}))
open(os.path.join(D, "out", "film.html"), "w").write(page({"sounds": "../sons/", "film": True, "autostart": False}).replace("</body>", "<script>" + R("src/director.js") + "</script></body>"))
open(os.path.join(D, "out", "vision.html"), "w").write(page({"sounds": "../sons/", "film": True, "autostart": False, "vision": True}))
json.dump({"symbols": SYMBOLS, "stage": STAGE, "js": JS, "app": APP, "css": CSS, "dur": dur, "logo": logo}, open(os.path.join(D, "out", "parts.json"), "w"))
print("ok", len(page({})), "bytes")
