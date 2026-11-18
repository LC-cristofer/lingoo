"""NESTOY wordmark: Fredoka 700 outlines (no font needed at runtime) + the nest 'O' with Nino peeking."""
import json, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
D = os.path.dirname(os.path.abspath(__file__))
f = TTFont(os.path.join(D, "..", "fonts", "fredoka700"))
gs, cmap, upm = f.getGlyphSet(), f.getBestCmap(), f["head"].unitsPerEm
cap = f["OS/2"].sCapHeight
def glyph(ch, x0):
    name = cmap[ord(ch)]
    pen = SVGPathPen(gs)
    gs[name].draw(TransformPen(pen, (1, 0, 0, -1, x0, cap)))
    return pen.getCommands(), gs[name].width
COCOA = "#3A2618"
# the nest O: drawn in a 600x600 box (cap height ~ 700 units -> scaled)
NEST_MARK = '''
<path d="M150 250 L120 40 Q124 14 150 26 L280 150 Z" fill="#FF9F43"/><path d="M168 200 L156 76 L240 156 Z" fill="#FF8FA3"/>
<path d="M450 250 L480 40 Q476 14 450 26 L320 150 Z" fill="#FF9F43"/><path d="M432 200 L444 76 L360 156 Z" fill="#FF8FA3"/>
<ellipse cx="300" cy="290" rx="190" ry="140" fill="#FF9F43"/>
<path d="M258 168 q14 34 0 58 M300 160 q14 40 0 70 M342 168 q14 34 0 58" stroke="#EE8226" stroke-width="18" stroke-linecap="round" fill="none"/>
<ellipse cx="228" cy="262" rx="28" ry="33" fill="#2B2D42"/><ellipse cx="372" cy="262" rx="28" ry="33" fill="#2B2D42"/>
<circle cx="238" cy="248" r="10" fill="#fff"/><circle cx="382" cy="248" r="10" fill="#fff"/>
<path d="M20 300 Q300 250 580 300 Q572 540 300 572 Q28 540 20 300 Z" fill="#C98A4B"/>
<path d="M330 330 Q470 318 580 300 Q572 540 300 572 Q420 520 440 420 Z" fill="#9C6631" opacity=".45"/>
<path d="M48 380 Q300 440 552 380 M80 460 Q300 520 520 460" stroke="#9C6631" stroke-width="20" fill="none" stroke-linecap="round"/>
<path d="M60 372 Q300 446 540 372" stroke="#2E9FD8" stroke-width="16" stroke-dasharray="44 30" fill="none" stroke-linecap="round"/>
<path d="M22 300 Q300 368 578 300" stroke="#E2A762" stroke-width="30" fill="none" stroke-linecap="round"/>
<path d="M30 296 l-34 -40 M570 294 l38 -44" stroke="#8A5A2B" stroke-width="18" stroke-linecap="round"/>
'''
def wordmark():
    x, parts = 0, []
    track = -10
    for ch in "NEST":
        d, w = glyph(ch, x); parts.append(f'<path d="{d}" fill="{COCOA}"/>'); x += w + track
    # nest O: width ~ 0.92 of the O glyph advance, sitting on the baseline, ears above cap height
    ow = gs[cmap[ord("O")]].width
    s = (ow * 1.12) / 600
    parts.append(f'<g transform="translate({x - ow * 0.07:.1f} {cap - 572 * s:.1f}) scale({s:.4f})">{NEST_MARK}</g>')
    x += ow * 0.98 + track
    d, w = glyph("Y", x); parts.append(f'<path d="{d}" fill="{COCOA}"/>'); x += w
    top = cap - 572 * s - 10
    return x, top, "".join(parts)
W, top, body = wordmark()
vb = f"-10 {top:.0f} {W + 20:.0f} {cap - top + 20:.0f}"
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="NESTOY">{body}</svg>'
open(os.path.join(D, "nestoy-wordmark.svg"), "w").write(svg)
mark = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 0 640 600" role="img" aria-label="NESTOY">{NEST_MARK}</svg>'
open(os.path.join(D, "nestoy-mark.svg"), "w").write(mark)
json.dump({"wordmark": svg, "mark": NEST_MARK, "vb": vb}, open(os.path.join(D, "logo.json"), "w"))
print("ok", vb, "cap", cap, "upm", upm)
