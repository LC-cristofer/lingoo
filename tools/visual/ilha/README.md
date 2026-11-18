# Ilha-Ninho — protótipo aprovado (referência)

Protótipo aprovado pelo Lucas em 2026-11-18 ("I lovit this version, pode seguir"). É a referência de desenho e de comportamento para a reconstrução descrita em `docs/superpowers/specs/2026-11-18-nestoy-ilha-ninho-design.md` e `docs/superpowers/plans/2026-11-18-nestoy-ilha-ninho.md`.

- `src/world.js` — a ilha em SVG (paleta, formas, lugares, estados, luzes da noite).
- `src/interior.js` — o interior do Farol das Línguas (escada = trilha).
- `src/nino.js` — o Nino em partes (mesmo desenho de `src/art/Cat.tsx`).
- `src/app.js` — motor (relógio, câmera com paralaxe) e fluxos (abertura, exploração, farol, atividade, recompensa, volta, noite, pausa).
- `src/proto.css`, `src/stage.html` — interface do protótipo.
- `build.py`, `film.cjs`, `mix.py`, `stills.cjs`, `src/director.js` — montagem, filme quadro a quadro com som sincronizado e imagens. Rodavam numa pasta temporária; os caminhos podem precisar de ajuste.
- `logo/` — logotipo NESTOY (Fredoka 700 em curvas + o "O" de ninho) e o símbolo.
- `sons/` — efeitos e falas novas gerados com ElevenLabs (mesma voz aprovada). `gen.py` mostra os textos e parâmetros.
- `book/` — o caderno publicado para aprovação.

Imagens aprovadas: `docs/arte/ilha-ninho/`.
