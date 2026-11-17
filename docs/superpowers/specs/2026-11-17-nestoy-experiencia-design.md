# NESTOY — evolução da experiência visual e de produto

**Data:** 2026-11-17 · **Branch:** `redesenho-trilha` · **Pedido:** Lucas (product owner), mensagem "NESTOY — EVOLUÇÃO DA EXPERIÊNCIA VISUAL E DE PRODUTO".
**Aprovado antes deste documento:** nome **NESTOY — um ninho de descobertas**; visual "premium contido" escuro (`tools/visual/premium-mockups.tsx`); fundo **céu noturno fluido** (opção B, `tools/visual/motion-prototype.tsx`, vídeos em `tools/visual/.out/motion-prototype/`); voz ElevenLabs "Lingoo"; música de fundo (mapa, álbum, Memória).

## 1. O que o REA do Duolingo ensinou, e como o NESTOY aplica

Fonte: `docs/superpowers/relatorios/2026-11-16-ciclo-unidade-1.md` §1 (branch `origin/unidade-1-v2-local`). Os artefatos completos do REA ficaram na máquina local do Lucas; este documento usa o resumo registrado e conhecimento público do produto. Copiamos **mecânicas**, nunca identidade (coruja, verde-Duolingo, fontes, ilustrações).

| Padrão (REA) | No Duolingo | No NESTOY |
|---|---|---|
| Jornada | Trilha vertical de nós com estados `locked / active / passed / legendary`; a parada atual tem um balão "COMEÇAR" | Trilha vertical de paradas redondas com estados `feito / atual / trancado`; a atual pulsa com luz âmbar e tem um balão flutuante com o nome e a ação ("Lição 2 · Começar"). Sem "legendary" nem coroas |
| Hierarquia | Uma tarefa por tela; instrução no topo; resposta no centro; ação no rodapé | Mesmo esqueleto, mas o **gatinho entrega a instrução** (balão + voz); o rodapé é uma "área de ação" que vira a folha de resultado |
| Feedback imediato | Máquina `Grading → Blaming → Sliding`: avalia, mostra o resultado no rodapé, desliza para o próximo | `answering → correct / retry / hint → next`: o cartão reage em < 100 ms, a folha sobe com mola, o gatinho reage, o próximo exercício entra deslizando |
| Revisão de erros | Rótulos `NEW_WORD`, `PAST_MISTAKE`, `WEAK_WORD` | Já temos: o exercício errado volta no fim da parada; o Treino de memória revisa por repetição espaçada. Ganha um selo discreto "De novo!" no exercício que volta |
| Progressão | Barra no topo com brilho; tela de fim com XP, tempo e precisão | Barra com brilho que corre ao avançar; fim de parada com estrela que "voa" para o contador, palavras aprendidas contando uma a uma. **Sem XP, sem precisão, sem tempo** |
| Recompensas | Baús, gemas, conquistas | Estrela por parada, baú com figurinha no desafio, álbum. **Sem moeda, sem loja** |
| Microinterações | Botões "3D" que afundam, Rive/Lottie em tudo | Botões e cartões com borda inferior que afunda; molas curtas; tudo em CSS/SVG próprio (sem Rive/Lottie: zero dependência) |
| Personagem | Duo reage, comemora, incentiva, aparece no momento certo | O gatinho é o companheiro: respira, pisca, mexe a cauda, fala junto com a voz, comemora acertos, encoraja nos erros, aponta o próximo passo |
| Engajamento | Ofensiva com congelamento, ligas, missões | Só a semana de dias jogados (sem perda), estrelas e figurinhas. **Sem vidas, ligas, ofensiva que zera, pressão de tempo** (público 5–8 anos) |
| Transições | Deslizar entre exercícios; tela cheia de comemoração | Exercício sai pela esquerda e o próximo entra pela direita (240 ms); comemorações em camada por cima, curtas (≤ 1,6 s) |
| Navegação | 5 abas; caminho claro do próximo passo | 3 abas (Trilha, Memória, Álbum); o próximo passo é sempre o elemento mais iluminado da tela |

## 2. Direção de arte: céu noturno

- **Base:** degradê vertical azul-marinho → azul profundo → índigo/violeta (`#0B1030 → #121A45 → #221A4F`), com duas "poças" de luz difusa (cobalto no alto, violeta embaixo) que trocam de intensidade em ciclo lento (~24 s). Uma vinheta suave escurece as bordas e **acalma o centro**, onde fica o conteúdo.
- **Estrelas orgânicas:** campo gerado de forma **determinística** (semente fixa), em aglomerados (como constelações discretas), três tamanhos, densidade menor atrás da trilha e dos cartões. Cintilam em ritmos diferentes, opacidade 0,25–0,9. Nada de distribuição uniforme aleatória.
- **Pontos de luz:** 2–3 estrelas maiores com halo suave; uma estrela cadente **rara** (a cada ~20–30 s), lenta.
- **Profundidade:** duas camadas de estrelas com leve paralaxe na rolagem do mapa (a de trás anda menos).
- **Proibido:** neon, brilho exagerado, excesso de partículas, decoração que compita com o conteúdo.
- **Movimento:** só `transform`/`opacity` em CSS; `prefers-reduced-motion` congela tudo num quadro completo.
- **Elemento de identidade "ninho":** o gatinho descansa num ninho macio (formas arredondadas, tons quentes de lã/caramelo) na tela inicial e quando dorme/espera; é o "lar" do NESTOY. Desenho próprio em SVG.

## 3. Sistema de design (tokens reutilizáveis)

Definidos uma vez em CSS custom properties (`src/styles/tokens.css`) e espelhados no `@theme` do Tailwind. Nenhuma tela define cor, sombra ou duração solta.

- **Cor — superfícies:** `--sky-0 #0B1030`, `--sky-1 #121A45`, `--sky-2 #221A4F`; superfícies elevadas `--surface-1 rgba(255,255,255,.06)`, `--surface-2 rgba(255,255,255,.10)`, linha `--line rgba(255,255,255,.10)`; cartão de resposta claro `--card #F4F6FF` (as figuras dos animais precisam de fundo claro).
- **Cor — texto:** `--text-1 #F4F6FF`, `--text-2 #B9C2E6`, `--text-3 #7E89B8`; texto escuro sobre cartão `--ink #151A3A`.
- **Cor — função:** acento `--accent #4470F4` (borda `#2F55D4`); atual `--current #FFB84A` (borda `#E08F1E`); feito/acerto `--success #34C77B` (borda `#1FA463`); tentar de novo `--retry #FFA94D` (borda `#E08A2C`, **nunca vermelho**); dica `--hint #FFC93C`. O laranja do gatinho é exclusivo dele.
- **Tipografia:** Baloo 2 (títulos, números, botões) e Nunito (apoio). Escala: display 44/48, título 28/32, subtítulo 22/26, corpo 18/24, legenda 14/18; pesos 800 (Baloo) / 700–800 (Nunito).
- **Espaço:** escala de 4 px (`4 8 12 16 20 24 32 40 56`). **Raios:** 12 / 18 / 24 / 32 / pílula.
- **Elevação no escuro:** botões e cartões com **borda inferior sólida** que afunda (linguagem tátil), mais sombra difusa escura; brilho só para o estado "atual".
- **Movimento:** durações `--t-tap 90ms`, `--t-quick 160ms`, `--t-base 240ms`, `--t-slow 420ms`; curvas `--ease-out cubic-bezier(.22,1,.36,1)`, `--ease-spring cubic-bezier(.34,1.56,.64,1)`. Animações de ambiente ≥ 4 s.
- **Estados de interação:** pressionado (afunda 4–5 px, borda encolhe), foco visível (anel `--accent` 3 px), desabilitado (opacidade .45), selecionado (anel acento), correto/tentar de novo/dica (cores de função).
- **Alvos:** toque ≥ 64×64 px; cartões de resposta ≥ 120×120 px; contraste AA.

## 4. O gatinho como personagem

Preserva o desenho aprovado (`src/art/Cat.tsx`). Ganha um **sistema de comportamento**:

- **Vida em repouso:** respira (escala 1,5 %, 3,6 s), pisca em intervalos irregulares, cauda balança, orelha mexe de vez em quando.
- **Fala sincronizada:** enquanto o narrador fala (`narrator.onSpeakingChange`), a boca anima ("talking"); para quando a voz para.
- **Reações a eventos:** acerto → pulinho feliz + estrelinhas; tentar de novo → inclina a cabeça, expressão de ajuda (nunca triste/bravo); dica → aponta a resposta; fim de parada → comemoração; parada trancada tocada → balança a cabeça com carinho.
- **API:** um componente `Companion` com `mood` (estado base) e `react(evento)` (reação curta que volta ao estado base); usado em todas as telas — nenhuma tela usa `<Cat>` direto para o personagem guia.
- **Presença no layout:** no mapa, sentado ao lado da parada atual e **anda até a próxima** quando a criança volta de uma parada concluída; na lição, junto da instrução no topo e **reage dentro da folha** de resultado; na abertura apresenta as palavras; no fim comemora no centro; na tela inicial dorme/descansa no ninho e acorda ao tocar "Jogar".

## 5. Composição por tela

- **Inicial:** céu cheio; marca NESTOY (wordmark com estrela) + "Um ninho de descobertas"; o gatinho no ninho; botão "Jogar" grande. Ao tocar: o gatinho acorda/pula e a tela transita para o mapa.
- **Mapa:** cabeçalho de unidade **sem cartão** (ícone pequeno + "Unidade 1" + título + progresso fino), trilha de paradas com linha pontilhada suave, parada atual com halo âmbar e balão flutuante, gatinho ao lado, baú no fim, próxima unidade apagada com cadeado. Topo: semana, estrelas, música (vidro). Rodapé: abas em pílula.
- **Abertura da parada:** o gatinho grande apresenta; as palavras da parada aparecem como cartões que entram em sequência; "Começar".
- **Exercício:** topo com ✕ e barra de progresso com brilho; gatinho + balão; área de resposta; rodapé de ação que vira folha de resultado (verde/laranja) com o gatinho reagindo e "Continuar". Exercício que volta ganha o selo "De novo!".
- **Fim da parada:** estrela grande que aparece com mola e "voa" para o contador; "Você aprendeu: bear · bird · frog" com os cartões; gatinho comemorando; "Continuar".
- **Baú e figurinha:** o baú balança (antecipação), abre com explosão de luz suave, a figurinha gira e pousa; botão para o álbum.
- **Álbum:** coleção como "constelação de figurinhas" por unidade, figurinha ganha com brilho, não ganha como silhueta; seção "Figurinhas especiais" mantida.
- **Memória:** monte de cartões que flutua de leve, contagem, "Treinar"; a rodada usa a mesma linguagem da lição.
- **Música e História:** usam o mesmo esqueleto e tokens (karaokê com linha atual iluminada; páginas da história em moldura).

## 6. Fora de escopo

Novos tipos de exercício, novo conteúdo, novas falas (só se indispensáveis, geradas com `tools/audio/generate_eleven.py`), backend, gamificação de pressão, troca da arte dos animais, modo claro (fica para depois; os tokens já permitem).

## 7. Validação

`npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run e2e -- --trace off` verdes a cada etapa; capturas reais em 390×844 e 1024×768 (e 844×390 / 768×1024 sem cortes) olhadas ao lado das referências aprovadas; vídeo curto dos fluxos principais (mapa → lição com erro e acerto → fim → baú); `prefers-reduced-motion` testado; nenhuma regressão funcional (progresso, migração v3, Treino de memória, música, voz).
