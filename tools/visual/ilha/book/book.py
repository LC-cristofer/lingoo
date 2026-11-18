"""Assemble the refinement book (artifact): page + images + film + sounds."""
import json, os, shutil
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(D)
OUT = os.path.join(D, "site"); IMG = os.path.join(OUT, "img")
for p in [OUT, IMG, os.path.join(OUT, "filme"), os.path.join(OUT, "sons")]: os.makedirs(p, exist_ok=True)
parts = json.load(open(os.path.join(R, "out", "parts.json")))
logo = parts["logo"]
log = json.load(open(os.path.join(R, "out", "full-audio.json")))
def first(name, nth=1, after=0):
    hits = [e["t"] / 1000 for e in log if e.get("name") == name and e["t"] / 1000 >= after]
    return hits[nth - 1] if len(hits) >= nth else 0

def webp(src, name, w=600, q=80):
    im = Image.open(src).convert("RGB"); im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(IMG, name + ".webp"), "WEBP", quality=q, method=6)
def frame(t, name):
    webp(os.path.join(R, "out", "frames", f"{int(round(t * 30)):05d}.jpg"), name)

def shots(items):
    html = ""
    for name, t, title, text in items:
        src = os.path.join(R, "out", "stills", name + ".png")
        if t is None: webp(src, name)
        else: frame(t, name)
        stamp = f'<time>{int(t // 60)}:{t % 60:04.1f}</time>' if t is not None else ""
        html += f'<figure class="shot"><img src="img/{name}.webp" alt="{title}. {text}">' \
                f'<figcaption>{stamp}<b>{title}</b><span>{text}</span></figcaption></figure>'
    return html

OPENING = shots([
    ("ab-1", 1.5, "O ninho, de manhã", "O Nino dorme. A marca aparece no céu e o botão de pular surge depois de 1 s."),
    ("ab-2", 4.0, "Acorda", "Mexe a orelha, abre os olhos e pisca duas vezes."),
    ("ab-3", 5.6, "Boceja e se espreguiça", "Braços para cima e corpo esticado, com som de bocejo."),
    ("ab-4", 7.4, "Olha para a criança", "Acena e diz: “Oi! Eu sou o Nino.”"),
    ("ab-5", 10.0, "Salta do ninho", "E diz: “Vem! Vamos explorar a ilha!” A câmera começa a recuar."),
    ("ab-6", 11.0, "A câmera recua", "O mesmo desenho, mais longe. O fundo ganha nitidez."),
    ("ab-7", 12.3, "Os lugares surgem", "Cada lugar aparece com um som curto, enquanto a câmera passa por ele."),
    ("ab-8", 14.5, "Chegada", "A ilha inteira. A interface aparece, e o Farol brilha como sugestão."),
])
ISLAND = shots([
    ("ilha-dia", None, "Ilha no lançamento", "Farol e Ninho prontos, Árvore das Letras em construção e os outros lugares em breve."),
    ("ilha-visao", None, "Ilha completa (visão)", "Como a ilha fica quando todas as áreas existirem."),
    ("ilha-noite", None, "A mesma ilha à noite", "Mesma identidade e outra luz: lanterna, janelas, farol e vaga-lumes."),
    ("ex-obra", 18.0, "Lugar em construção", "A câmera se aproxima e o martelinho trabalha mais rápido."),
    ("ex-futuro", 22.0, "Lugar em breve", "O broto balança e o Nino conta que vai nascer um lugar ali."),
    ("ex-farol", 27.2, "Lugar pronto", "O Nino anda até o Farol, o sininho toca e aparece o botão para entrar."),
])
INTERIOR = shots([
    ("in-1", 30.3, "Mergulho pela porta", "A câmera entra pela porta do farol."),
    ("in-2", 31.3, "Do lado de dentro", "Começa na mesma porta, agora vista por dentro."),
    ("in-3", 34.5, "A escada é a trilha", "Música feita, Lição 1 brilhando, as outras esperando."),
])
GROW = shots([
    ("gr-1", 27.2, "Antes", "Farol com luz fraca e duas bandeirinhas."),
    ("gr-2", 54.0, "Depois da parada", "A luz fica mais forte, surgem bandeirinhas novas e um barquinho chega."),
    ("gr-3", 60.0, "Um fio novo no ninho", "Um fio azul, a cor das Línguas, é tecido no ninho."),
    ("at-1", 38.0, "A pergunta", "“Qual é o bear? Toque nele!”, com a voz que já está no app."),
    ("at-2", 42.4, "Quase", "O cartão balança de leve e o Nino ajuda. Nada vermelho."),
    ("at-3", 45.5, "Acerto", "O cartão pulsa, a folha sobe e o Nino comemora dentro dela."),
    ("at-4", 48.6, "Recompensa", "Estrela e figurinha do urso, que vai para o ninho."),
])
ROUTINE = shots([
    ("responsaveis", None, "Área dos responsáveis", "Ambiente, pausa, abertura e movimento."),
    ("pausa", None, "Lembrete de pausa", "O Nino se espreguiça e sugere uma pausa. A criança pode continuar."),
    ("no-1", 68.5, "Anoitece pela rotina", "A ilha muda de luz devagar; a música dá lugar aos grilos."),
    ("no-2", 79.0, "Boa noite", "O Nino volta ao ninho, diz “Boa noite!” e dorme."),
])
webp(os.path.join(R, "out", "stills", "poses.png"), "poses", w=1100, q=82)
webp(os.path.join(R, "out", "frames", "00045.jpg"), "poster", w=720, q=80)

steps = [
    (0, "Abertura no ninho"), (2.6, "O Nino acorda e se espreguiça"), (first("v_oi") - 0.3, "“Oi! Eu sou o Nino.”"),
    (first("reveal"), "A câmera revela a ilha"), (first("reveal") + 4.8, "Chegada à ilha"),
    (first("obra") - 0.3, "Explorar: lugar em construção"), (first("e_chegando") - 0.3, "Explorar: lugar em breve"),
    (first("tap", 3) - 0.3, "O Nino vai até o Farol"), (first("dive") - 0.3, "Entrada no Farol das Línguas"),
    (first("e_prompt") - 0.6, "A atividade"), (first("retry") - 0.3, "Quase, e depois o acerto"), (first("star") - 0.4, "Recompensa"),
    (first("grow") - 1.0, "O farol se transforma"), (first("thread") - 2.4, "Volta para casa: um fio novo no ninho"),
    (first("night") - 3.4, "A noite chega pela rotina"),
]
STEPS = "".join(f'<li><button data-t="{t:.1f}"><time>{int(t // 60)}:{int(t % 60):02d}</time><b>{label}</b></button></li>' for t, label in steps)

RULES_DATA = [
    ("formas", "Formas", "Tudo é feito de formas redondas e cheias, como o Nino: círculos, ovais e cantos bem arredondados. Nada pontudo nem fino demais."),
    ("cores", "Cores", "Cores claras e quentes no mundo, uma cor dominante por área e o laranja exclusivo do Nino."),
    ("texturas", "Texturas", "Um grão de papel fino por cima de tudo, igual em todos os cenários. Lã e gravetos só no ninho."),
    ("luz", "Iluminação", "A luz vem sempre do alto à esquerda. Cada material tem base, uma sombra mais fria e uma luz mais quente."),
    ("sombras", "Sombras", "Sombras de contato macias, em cacau a 16%, deslocadas para a direita. Nada de sombra preta."),
    ("contornos", "Contornos", "Sem contornos. A única exceção é a borda branca de recorte das figurinhas, que marca o que é colecionável."),
    ("personagens", "Personagens", "Mesmas regras do Nino: formas chapadas, olhos grandes e bochechas. Escala de desenho animado: o Nino tem metade da altura do farol."),
    ("cenarios", "Cenários", "Três níveis: a ilha, a frente de cada lugar e o interior. Ao longe, as cores se misturam com o céu."),
    ("interface", "Interface", "Superfícies creme, cantos de 20 a 28 px, botões com borda que afunda e alvos de toque de 64 px."),
    ("animacao", "Animação", "O personagem amassa e estica; o cenário se move devagar e sem parar; a câmera acelera e freia com suavidade. Reações duram até 1,4 s."),
]
RULES = "".join(f'<div class="rule"><div class="spec" data-spec="{k}"></div><div><h3>{t}</h3><p>{d}</p></div></div>' for k, t, d in RULES_DATA)
def sw(items): return "".join(f'<div class="sw"><i style="background:{c}"></i><b>{n}</b><code>{c}</code></div>' for n, c in items)
SW_WORLD = sw([("Céu", "#7CC4EE"), ("Céu claro", "#CDEBF8"), ("Grama", "#86CC5E"), ("Folha", "#5DB55A"), ("Terra", "#A46A3E"), ("Caminho", "#F6E2B8"), ("Água", "#6CCBE3"), ("Pedra", "#CBD3DC")])
SW_AREAS = sw([("Letras", "#FF7A5C"), ("Números", "#F5B12E"), ("Cores", "#A57BEA"), ("Línguas", "#2E9FD8"), ("Mundo", "#2EB8A4"), ("Ninho", "#C98A4B")])
SW_UI = sw([("Creme", "#FFF8EC"), ("Cacau", "#3A2618"), ("Texto 2", "#8A6A50"), ("Acerto", "#5DB55A"), ("Noite", "#1B2259"), ("Nino (só ele)", "#FF9F43")])
SW_NIGHT = sw([("Céu alto", "#0E1640"), ("Céu", "#1E2A6B"), ("Luz da noite", "#3A4A8C"), ("Lanterna", "#FFE29A"), ("Brilho quente", "#FFB866"), ("Estrela", "#FFF6E0")])
mark = logo["mark"]
ICONS = "".join(f'<figure><div class="ico" style="width:{s}px;height:{s}px;border-radius:{s * 0.225:.0f}px;background:{bg}"><svg viewBox="-40 -20 680 640" width="{s * 0.86:.0f}">{mark}</svg></div>{s} px</figure>'
                for s, bg in [(180, "#FFF6E8"), (120, "#FF7A5C"), (60, "#FFF6E8"), (40, "#2E9FD8"), (29, "#FFF6E8")])
WORD = logo["wordmark"]; WORD_N = WORD.replace("#3A2618", "#FFF3D1")

cfg = {"sounds": "sons/", "autostart": False}
html = open(os.path.join(D, "template.html")).read()
rep = {"{{PROTO_CSS}}": parts["css"], "{{SYMBOLS}}": parts["symbols"], "{{STAGE}}": parts["stage"], "{{STEPS}}": STEPS, "{{RULES}}": RULES,
       "{{SW_WORLD}}": SW_WORLD, "{{SW_AREAS}}": SW_AREAS, "{{SW_UI}}": SW_UI, "{{SW_NIGHT}}": SW_NIGHT, "{{WORDMARK}}": WORD, "{{WORDMARK_NIGHT}}": WORD_N,
       "{{ICONS}}": ICONS, "{{OPENING_SHOTS}}": OPENING, "{{ISLAND_SHOTS}}": ISLAND, "{{INTERIOR_SHOTS}}": INTERIOR, "{{GROW_SHOTS}}": GROW, "{{ROUTINE_SHOTS}}": ROUTINE,
       "{{CFG}}": json.dumps(cfg) + ";try{NESTOY_CFG.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}", "{{DUR}}": json.dumps(parts["dur"]),
       "{{JS}}": parts["js"], "{{APP}}": parts["app"], "{{BOOKJS}}": open(os.path.join(D, "book.js")).read()}
for k, v in rep.items():
    assert k in html, k
    html = html.replace(k, v)
open(os.path.join(OUT, "index.html"), "w").write(html)
shutil.copy(os.path.join(R, "out", "nestoy-jornada.mp4"), os.path.join(OUT, "filme", "nestoy-jornada.mp4"))
used = set(parts["dur"]) | {"tap", "correct", "retry", "star"}
for f in os.listdir(os.path.join(R, "sons")):
    if f.endswith(".mp3") and f[:-4] in used: shutil.copy(os.path.join(R, "sons", f), os.path.join(OUT, "sons", f))
tot = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(OUT) for f in fs)
print("ok", f"{len(html) / 1e3:.0f} KB page", f"{tot / 1e6:.1f} MB total", "steps", [round(t, 1) for t, _ in steps])
