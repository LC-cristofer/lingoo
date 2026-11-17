# NESTOY — plano de execução da evolução da experiência

**Spec:** `docs/superpowers/specs/2026-11-17-nestoy-experiencia-design.md` (ler inteiro antes de cada tarefa).
**Branch:** `redesenho-trilha`. Execução por subagentes, uma tarefa por vez, revisão independente depois de cada uma.
**Referências visuais aprovadas:** `tools/visual/premium-mockups.tsx` (+ PNGs em `tools/visual/.out/premium-mockups/`, variante ESCURA), `tools/visual/motion-prototype.tsx` (+ vídeos em `tools/visual/.out/motion-prototype/`).

## Regras globais

- Preservar tudo que funciona: progresso v3 e migração, Treino de memória, música de fundo, narrador/voz, efeitos, e2e. `data-testid`, `aria-label` e `data-*` usados por testes continuam (mudar só com motivo, atualizando os testes).
- Domínio puro (`src/domain/**`) não muda, salvo necessidade explícita da tarefa.
- Toda cor/raio/sombra/duração vem dos tokens (`src/styles/tokens.css`). Nada de valores soltos nas telas.
- Só `transform`/`opacity` animam; `prefers-reduced-motion` desliga movimento sem quebrar layout.
- Alvos ≥ 64 px, cartões ≥ 120 px, contraste AA, sem rolagem horizontal em 390×844, 1024×768, 844×390, 768×1024.
- Sem novas dependências npm sem justificativa forte. Sem Rive/Lottie.
- Sem falas novas, salvo indispensável (ElevenLabs via `tools/audio/generate_eleven.py` + `verify.py`).
- TDD onde há comportamento; cada tarefa termina com `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run e2e -- --trace off` verdes e capturas reais olhadas.

## Tarefas

### T1 — Fundação: tokens, céu noturno e kit no novo visual
- Criar `src/styles/tokens.css` (spec §3) e importar em `globals.css`; espelhar no `@theme`.
- `NightSky` (`src/components/trail/kit/NightSky.tsx`): degradê + poças de luz + estrelas determinísticas em aglomerados (2 camadas, paralaxe opcional via prop) + estrela cadente rara; variantes `start | map | lesson | quiet`. Substitui `ForestScene` em **todas** as telas (remover `ForestScene`/`Scatter`/`ForestBackdrop` se ficarem sem uso, junto com CSS morto).
- Repaginar os primitivos do kit para o escuro premium: `ChunkyButton`, `.k-round`, `.k-pill`, `Bubble`, `LessonTopBar`/barra com brilho, `AnswerTile` (cartão claro), `FeedbackSheet`, `StopButton`, `TopChips`, `BottomNav`, `MusicToggle`, `WoodSign` → `UnitHeader` (cabeçalho sem cartão). Mesmas props/acessibilidade.
- Teste: tokens existem; `NightSky` determinístico (mesma semente → mesmas posições), sem estrelas na zona central de conteúdo acima de um limite; reduced-motion; kit renderiza estados.

### T2 — O gatinho como personagem (`Companion`)
- Animações de vida no `Cat` (respirar, piscar irregular, cauda, orelha) sem mudar o desenho.
- `narrator.onSpeakingChange` já existe (música): usar para a boca falar em sincronia.
- `Companion({ mood, size, ... })` + hook `useCompanion()` com `react("correct" | "retry" | "hint" | "celebrate" | "locked" | "tap")` que toca uma reação curta e volta ao `mood`.
- Integrar: `ExerciseShell` (reação ao resultado), `FeedbackSheet` (gatinho dentro da folha), `StopOpening`, `StopClosing`, mapa, tela inicial (ninho: desenhar `Nest` em `src/art/`), Memória, música, história.
- Teste: reações temporizadas voltam ao mood; fala liga/desliga a boca; sem `<Cat>` solto como guia fora do `Companion`.

### T3 — Mapa, tela inicial e navegação
- Mapa: cabeçalho de unidade sem cartão, paradas novas (estados), balão flutuante da parada atual com ação, gatinho ao lado da atual que **anda até a próxima** ao voltar de uma parada concluída (animação de deslocamento ≤ 900 ms), linha da trilha suave, baú, próxima unidade apagada, rolagem com mola até a atual, paralaxe leve das estrelas.
- Inicial: marca NESTOY (wordmark + estrela), ninho com o gatinho, "Jogar" → transição para o mapa.
- Abas e chips repaginados (já do kit).
- Teste/e2e: fluxos existentes verdes; deslocamento do gatinho respeita reduced-motion.

### T4 — Lição: composição, feedback e transições
- `ExerciseShell` recomposta (spec §5 "Exercício"); os 6 exercícios no novo visual (cartões claros sobre o céu, espaçamento, tipografia).
- Feedback: cartão reage < 100 ms (pop no acerto, balanço suave no tentar de novo, brilho na dica); folha sobe com mola, com o gatinho; barra de progresso com brilho que corre.
- Transição entre exercícios: sai pela esquerda / entra pela direita (240 ms); selo "De novo!" no exercício de revisão.
- Abertura da parada (palavras entrando em sequência) e Treino de memória (rodada e cartão que vira) na mesma linguagem.
- Teste: data-testids preservados; e2e completo verde; reduced-motion.

### T5 — Recompensas e telas de coleção
- Fim da parada: estrela com mola que voa para o contador, palavras aprendidas em sequência, comemoração do gatinho.
- Baú: antecipação (balanço), abertura com luz, figurinha girando e pousando, ir ao álbum.
- Álbum: coleção por unidade ("constelação de figurinhas"), ganhas com brilho, silhuetas; "Figurinhas especiais" mantida.
- Memória (início), Música (karaokê) e História (páginas) no sistema.
- Teste: fluxos e e2e verdes.

### T6 — Validação final e polimento
- Capturas e vídeos dos fluxos principais nos dois formatos (+ 844×390, 768×1024), reduced-motion, desempenho (sem animação de layout, sem jank evidente), contraste.
- Atualizar `tools/visual/screens.cjs` se necessário; README (nome NESTOY, design system).
- Revisão final do branch pelo modelo mais capaz; uma rodada de correções.
