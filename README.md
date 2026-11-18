# NESTOY

NESTOY é um aplicativo (PWA) para crianças de 5 a 8 anos aprenderem inglês brincando. O mundo é uma **ilha** com o ninho do Nino, um gatinho laranja, no alto e ao centro. A criança explora a ilha, entra no **Farol das Línguas** e sobe a escada em espiral: cada patamar é uma parada da unidade (música, três lições, história e desafio). Quase sem texto na tela, tudo com som e imagem.

A frase que guia o desenho: **o ninho apresenta o universo, a câmera revela a ilha, a ilha convida a explorar, cada descoberta transforma o mundo.**

O design aprovado está em `docs/superpowers/specs/2026-11-18-nestoy-ilha-ninho-design.md`; as imagens aprovadas, em `docs/arte/ilha-ninho/`. O protótipo de referência está em `tools/visual/ilha/` (não faz parte do app).

## Como rodar

```bash
npm install
npm run dev        # desenvolvimento em http://localhost:3000
npm run build      # build de produção
npm start          # serve o build (npx next start -p 3300 para escolher a porta)
```

### Como testar

```bash
npm test                    # testes unitários e de componentes (Vitest)
npx tsc --noEmit            # tipos
npm run lint                # ESLint
npm run e2e -- --trace off  # ponta a ponta (Playwright); sobe o build sozinho na porta 3100
```

No Playwright usamos o Chromium já instalado no ambiente (`PW_CHROMIUM_PATH`, padrão `/opt/pw-browsers/chromium`); não rode `playwright install`. Antes dos testes e2e, encerre servidores antigos (`pkill -f "next start"`).

### Ferramentas visuais (`tools/visual/`)

Todas usam um build de produção rodando (`npm run build && npx next start -p 3300`):

| Comando | O que faz |
|---|---|
| `node tools/visual/screens.cjs [saída] [url]` | Capturas de todas as rotas (ilha de dia e de noite, farol, paradas, ninho, responsáveis, treino de memória, revisão) em 390×844 e 1024×768, verificando rolagem da página e alvos de toque. |
| `node tools/visual/journey.cjs [saída] [url]` | A jornada inteira da criança, com vídeo: abertura, ilha, farol, lição (erro e acerto), encerramento, volta (o farol cresce, o fio no ninho), ninho, responsáveis e a noite. Quatro formatos (390×844, 1024×768, 844×390, 768×1024), com e sem movimento reduzido. |
| `node tools/visual/a11y.cjs [url]` | axe-core (WCAG 2 A/AA) e verificações próprias: nome em todo controle, alvos de 64 px, foco visível. |
| `node tools/visual/perf.cjs [url] [largura] [altura]` | Trace do Chrome da abertura completa: tarefas longas, layouts e recálculos de estilo. |

## Rotas

| Rota | O que é |
|---|---|
| `/` | A **ilha**: tela principal. Faz a abertura, a volta de uma parada (`?volta=<parada>`) e a hora de dormir. |
| `/farol` | O interior do Farol das Línguas: a escada em espiral é a trilha da unidade. |
| `/parada/<unidade>/<parada>` | Uma parada: sequência curta de exercícios narrados, música ou história. |
| `/ninho` | O ninho do Nino: figurinhas, fios tecidos por área e o **Treino de memória**. |
| `/memoria` | A rodada do Treino de memória (cartões que voltam em dias diferentes). |
| `/responsaveis` | Área dos responsáveis, atrás de um botão que se segura por 2 s: rotina da noite, lembrete de pausa, abertura, movimento e música. |
| `/revisao` | Só para adultos (equipe e revisores). Abre qualquer parada direto, sem salvar progresso (`?revisao=1`). Nenhuma tela da criança aponta para ela. |
| `/mapa`, `/album` | Antigos: redirecionam para `/` e `/ninho`. |

## A ilha

- **Lugares:** Ninho (alto/centro), Árvore das Letras (em construção), Torre dos Números, Jardim das Cores e Lago das Descobertas (em breve) e o **Farol das Línguas** (pronto). Tocar num lugar aproxima a câmera; o Nino anda até lá e aparece o botão para entrar.
- **O mundo cresce:** o farol sobe de nível conforme as paradas da unidade 1 são concluídas (1: luz fraca; 2: a partir de 1 parada; 3: a partir de 3, com o feixe à noite; 4: 6 de 6, lâmpada acesa). Cada área com alguma parada concluída tece um fio da sua cor no ninho.
- **Abertura:** completa (~14 s) só na primeira vez; depois, curta (~2,5 s); voltando no mesmo dia, direto na ilha. Com movimento reduzido, apenas um esmaecer de 0,4 s.
- **Noite:** o mesmo mundo com outra luz. Só os responsáveis decidem quando: "Sempre dia" (padrão), "Seguir a rotina" (anoitece no horário escolhido, até as 06:00) ou "Noite". O relógio do aparelho sozinho não decide nada.
- **Sem pressão:** nada se perde por ausência, nada murcha, nenhum contador zera, sem vidas nem tempo. Nunca vermelho para erro.

## Bíblia visual (resumo)

- **Formas** redondas e cheias, como o Nino; sem contornos (exceção: borda branca de recorte nas figurinhas). Luz sempre do alto à esquerda; sombras de contato macias, em cacau, nunca preto.
- **Cores do mundo:** céu `#7CC4EE → #CDEBF8 → #FFEFD9`, grama `#86CC5E`, terra `#C08453`, caminho `#F6E2B8`, água `#6CCBE3`, madeira `#C98A4B`, folha `#5DB55A`. Uma cor por área: Letras `#FF7A5C`, Números `#F5B12E`, Cores `#A57BEA`, Línguas `#2E9FD8`, Mundo `#2EB8A4`, Ninho `#C98A4B`.
- **Interface:** creme `#FFF8EC`, cacau `#3A2618`, acerto `#5DB55A`, noite da interface `#1B2259`. **O laranja `#FF9F43` é exclusivo do Nino.** Botões com borda inferior que afunda; alvos de toque de **no mínimo 64 px**; o Nino aparece no cartão de fala.
- **Tipografia:** Fredoka 600/700 (títulos, botões, números) e Nunito 800 (texto). Escala 34 / 22 / 19 / 15 / 13.
- **Animação:** personagem que amassa e estica, câmera com aceleração suave, reações de até 1,4 s, tudo dirigido por um relógio só. Com movimento reduzido (sistema ou escolha dos responsáveis) não há viagem de câmera, paralaxe nem pulos; o Nino só pisca.
- **Logotipo:** sempre **NESTOY** em maiúsculas; o "O" é o ninho com o Nino espiando (`public/brand/`, `src/art/brand/`). Ícone = só o símbolo.
- Os tokens ficam em `src/styles/tokens.css`; o resumo completo, na seção 1 do design aprovado.

## Preferências e progresso

- **Preferências dos responsáveis** ficam em `localStorage`, na chave **`lingoo:settings:v1`**: ambiente (`dia`, `rotina`, `noite`), horário de dormir (`HH:MM`, padrão 19:30), lembrete de pausa (0, 15, 20 ou 30 min), abertura (`auto` ou `curta`), movimento (`auto` ou `reduzir`), `openingSeen` e `lastVisit` (data local `AAAA-MM-DD`). Valores inválidos voltam ao padrão; armazenamento bloqueado nunca quebra o app.
- **Música** (ligada ou desligada, escolha dos responsáveis) fica na chave `lingoo:music`; desligada, também some o som de ambiente da ilha.
- **Progresso** fica em `localStorage`, na chave **`lingoo:progress:v3`** (formato intocado). As chaves antigas (v1 e v2) são mantidas e migradas para a v3 sem apagar nada.

## Como o código é organizado

- `src/world/`: o mundo desenhado em **SVG por funções puras** (`island.ts`, `farol-interior.ts`), o motor imperativo (`stage.ts`: câmera de 4 camadas por `viewBox`, linha do tempo determinística em `timeline.ts`) e a câmera (`camera.ts`). O React não re-renderiza por quadro: por quadro só mudam `viewBox`, atributos, `transform` e `opacity`.
- `src/art/nino/`: o Nino em partes (`rig.ts`, `poses.ts`, `Nino.tsx`).
- `src/components/island/`, `farol/`, `ninho/`, `parents/`, `nestoy/`: as telas e o `StageView` que hospeda o palco.
- `src/components/trail/`: paradas, exercícios, recompensas e o Treino de memória.
- `src/domain/`: regras puras (progresso, unidades, memória, ilha, preferências).
- `content/`: `path.json`, `units/` e `lines.json` (falas); os áudios ficam em `public/audio/` (veja `tools/audio/README.md`).
- Next.js 16 com `cacheComponents`: as rotas visitadas ficam vivas (`Activity`); por isso as telas limpam o que começaram quando são escondidas.
- A aparência aprovada: `docs/arte/ilha-ninho/` (e `docs/arte/telas-aprovadas/` para o histórico).
