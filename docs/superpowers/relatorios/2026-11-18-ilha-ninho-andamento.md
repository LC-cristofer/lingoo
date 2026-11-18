# NESTOY Ilha-Ninho — reconstrução concluída (2026-11-18)

Plano: `docs/superpowers/plans/2026-11-18-nestoy-ilha-ninho.md` (11 etapas). Design aprovado: `docs/superpowers/specs/2026-11-18-nestoy-ilha-ninho-design.md`. Folhas de validação: `docs/arte/ilha-ninho/validacao/`.

## As 11 etapas, prontas e revisadas

| Etapa | O que entrou |
|---|---|
| 1. Fundação | Cores, fontes Fredoka e Nunito, grão de papel, logotipo NESTOY, ícones do app, kit de botões e cartões |
| 2. Nino | O desenho aprovado em partes: respira, pisca, mexe cauda e orelha, boca com a voz, 8 poses e reações |
| 3. Desenho do mundo | Ilha, ninho, lugares com estados e interior do farol em vetor, idênticos ao protótipo |
| 4. Motor | Relógio único, câmera com 4 camadas de profundidade, animações da ilha |
| 5. Preferências e sons | `lingoo:settings:v1`, 9 falas novas do Nino, 15 efeitos, ambiente de dia e de noite |
| 6. Farol das Línguas | Interior com a escada em espiral como trilha da unidade 1 |
| 7. Ilha | Tela inicial navegável, estados dos lugares, pinos, o Nino andando pelos caminhos |
| 8. Abertura e volta | Abertura completa/curta/direta, farol que cresce, fios no ninho, hora de dormir, lembrete de pausa |
| 9. Atividades | Barra de lâmpadas, cartões grandes, acerto, "quase" sem vermelho, estrela, figurinha no baú |
| 10. Ninho e responsáveis | `/ninho` (figurinhas + Treino de memória) e `/responsaveis` (portão de 2 s, rotina, pausa, abertura, movimento, música) |
| 11. Validação | Jornada gravada em 4 tamanhos com e sem movimento reduzido, desempenho, acessibilidade, README |

Cada etapa teve revisão independente. A revisão final do branch inteiro encontrou 5 pontos importantes (falas da volta, repetir parada, parada que não recomeçava, som de fundo, "Reduzir movimento"); todos foram corrigidos com testes e conferidos numa nova revisão.

## Verificações finais

678 testes, tipos, lint, build e 14 testes de ponta a ponta passando. Nenhuma tarefa longa (> 100 ms) na abertura; pior caso 34 ms. axe-core (WCAG 2 A/AA) sem problemas em 10 estados e 3 formatos.

## Decisões para o Lucas conferir

- Texto branco nos botões verde (#5DB55A, 2,55:1) e azul (#2E9FD8, 2,97:1): mantido por ser o visual aprovado; abaixo do contraste recomendado.
- "Brincar mais um pouco" continua aparecendo depois da hora de dormir.
- O app bloqueia o zoom de pinça (jogo em tela cheia).
- O custo do fundo desfocado do farol num tablet simples ainda não foi medido num aparelho real.
