# Lingoo: redesenho da trilha e da lição (especificação de design)

- **Data:** 2026-11-09
- **Autor:** Lucas (com Claude)
- **Status:** aguardando revisão
- **Relação com a especificação original** (`2026-11-09-app-ingles-infantil-design.md`): este documento **substitui** as seções 4 (Experiência da criança), 7 (Conteúdo do MVP) e o item "Voz" da seção 8. As outras seções continuam valendo: pais, assinatura, arquitetura geral, privacidade e riscos.

## 1. Por que redesenhar

O protótipo da Fase 1 funcionou tecnicamente, mas não entregou a experiência esperada:

- **O mapa** era formado por 6 círculos iguais, sem tema e sem dizer o que cada parada ensina.
- **A lição** não tinha objetivo visível nem barra de progresso, e era formada por poucos exercícios soltos.
- **A tela** ficava quase vazia, porque a regra "sem texto" deixava tudo dependendo do áudio.

**O que o Lucas pediu:** um app de trilha de lições, do mesmo gênero dos apps de idiomas para adultos, mas pensado para crianças. A trilha precisa ser estruturada, com lições objetivas e uma didática que se veja no mapa: ensinar, praticar e revisar. A identidade continua sendo do Lingoo, com o gatinho, a paleta e ilustrações próprias. Não vamos copiar a aparência nem os personagens de outros apps.

**Sucesso:** uma criança de 5 a 8 anos entende sozinha o que fazer em cada tela. Ela sabe o que vai aprender antes de começar, e no fim sabe dizer as palavras novas. Um pai que olha o mapa entende a progressão da trilha.

## 2. Decisões fechadas nesta conversa

| Tema | Decisão |
|---|---|
| Texto na tela | Texto curto e **sempre narrado** ("Toque no ***bear*** 🔊"). Quem lê acompanha e quem não lê ouve. |
| Idioma do mascote | **Instruções em português; palavras, frases-alvo e elogios em inglês.** |
| Estrutura da trilha | Cada unidade tem **paradas com papéis diferentes**: 🎵 Música → ⭐ Lição 1 → ⭐ Lição 2 → ⭐ Lição 3 → 📖 História → 🏆 Desafio. |
| Recompensas | **Sem vidas e sem punição.** Cada parada concluída ganha ⭐, e o desafio abre um **baú com figurinha**. O **calendário de dias** mostra os dias em que a criança brincou e nunca zera. |
| Erros | O gatinho ajuda e o exercício volta no fim da lição. A criança nunca "perde". |
| Base didática | Vocabulário da lista **Cambridge Pre A1 Starters**. Sequência de ensino dos livros infantis: ouvir → apontar → dizer → praticar → revisar. Rotina previsível. |
| Escopo do protótipo | **Uma unidade completa**, "Animais da floresta", com as 6 paradas. As outras unidades aparecem no mapa com nome e ícone, trancadas. |
| Jogo de arrastar | **Sai.** O 🔗 "Ligar pares" cumpre o mesmo papel e é mais fácil para dedos pequenos. |

## 3. Base didática (pesquisa)

- **Vocabulário:** a lista oficial do Cambridge para o nível Pre A1 Starters é organizada por temas (animais, cores, números, casa, família, comida). A trilha prioriza essas palavras. O vocabulário final de cada unidade passa pela revisão da Giulia.
- **Sequência de ensino:** os livros infantis do Cambridge seguem esta ordem:
  1. ouvir sem olhar;
  2. ouvir e apontar;
  3. apontar e dizer;
  4. praticar com as figuras embaralhadas.
  
  A revisão usa jogos clássicos de sala, como "o que sumiu?".
- **Rotina previsível:** toda lição começa e termina do mesmo jeito; só o conteúdo muda.
- **Atividades curtas:** cada parada dura no máximo de 3 a 5 minutos.
- **Músicas** ensinam frases inteiras ("What's this? It's a bear!"), não só palavras.
- **Histórias** começam com um jogo rápido de ligar figura e palavra, que prepara o vocabulário.
- **Direitos autorais:** a lista de palavras e o método servem de referência. Músicas, histórias e desenhos de terceiros **não** são copiados. Todo o conteúdo do Lingoo é original, inclusive o que segue estruturas conhecidas, como a de "Brown Bear, Brown Bear", que é protegida.

## 4. A trilha (MVP completo)

O protótipo constrói só a Unidade 1. As outras ficam listadas aqui para que o mapa mostre a aventura completa.

| Mundo | Unidade | Palavras-base (sujeitas à revisão da Giulia) | Frase-alvo |
|---|---|---|---|
| 🌳 Floresta | 1. Animais da floresta | bear, bird, frog, snake, spider, mouse | "What's this? It's a …!" |
| | 2. Cores | red, blue, yellow, green, orange, pink | "It's red!" |
| | 3. Números | one … ten | "How many? Three!" |
| 🏡 Vilarejo | 4. Hello! | hello, goodbye, yes, no | "My name is …" |
| | 5. Família | mum, dad, brother, sister, grandma, grandpa | "This is my mum." |
| | 6. Casa | house, door, window, bed, table, kitchen | "Where's the bed?" |
| | 7. Comida | apple, banana, cake, milk, water, bread | "I like apples!" |

**Mudança em relação à especificação original:** "Hello!" deixa de ser a primeira unidade e passa a abrir o Vilarejo. Assim a história faz sentido: o gatinho chega ao vilarejo e cumprimenta os moradores. Os animais abrem a trilha porque prendem mais a atenção da criança no primeiro contato. O gatinho já diz "Hello!" desde a primeira tela.

## 5. A experiência da criança

### 5.1 Mapa

```
┌──────────────────────────────────────────────────────────────┐
│ ☀☀☀○○○○  dias que brincou                      [📒 Álbum]    │
│ ┌──────────────────────────────────────────────┐             │
│ │ 🌳 Unidade 1 · Animais da floresta     2/6 ⭐ │  ← faixa    │
│ └──────────────────────────────────────────────┘             │
│      🌲      (🎵)⭐ ── (⭐)⭐ ── (⭐)🐱 ── (⭐)🔒              │
│   🌲    🌳   Música   Lição 1   Lição 2   Lição 3        🌲   │
│                                              │                │
│        🍄          (🏆)🔒 ── (📖)🔒 ─────────┘     🌳         │
│                    Desafio   História                         │
│ ──────────── 🔒 Unidade 2 · Cores ────────────               │
└──────────────────────────────────────────────────────────────┘
```

- **Cenário ilustrado:** céu, morros e árvores da Floresta, desenhados em SVG com a paleta. Nada de fundo branco.
- **Faixa da unidade:** nome, ícone e progresso. Tocar nela faz o gatinho dizer "Unidade 1: animais da floresta!".
- **Paradas:** o **ícone mostra o tipo** (🎵 ⭐ 📖 🏆) e há um rótulo curto embaixo ("Música", "Lição 1"). Cada uma tem um estado:
  - concluída: ⭐ dourada;
  - atual: pulsando, com o gatinho ao lado;
  - futura: cadeado.
- **Unidades seguintes:** aparecem depois, como faixas trancadas com nome e ícone. A criança vê que a aventura continua.
- **No celular deitado**, o mapa rola na horizontal. No tablet, a unidade inteira cabe na tela.

### 5.2 Estrutura comum da lição (todas as paradas usam a mesma "casca")

```
┌──────────────────────────────────────────────────────────────┐
│ [✕]  ████████████░░░░░░░░░░  (barra de progresso)            │
│                                                              │
│   🐱 ┌──────────────────────────────┐                        │
│      │ Qual é o ***bear***? 🔊      │  ← balão do gatinho    │
│      └──────────────────────────────┘                        │
│                                                              │
│      ┌────────┐   ┌────────┐   ┌────────┐                     │
│      │  🐻    │   │  🐸    │   │  🐦    │   ← cartões grandes │
│      └────────┘   └────────┘   └────────┘                     │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ✅ Yes! That's great!                    [ Continuar ▶ ] │ │ ← faixa de retorno
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

- **No topo:** o botão ✕ (sair) e a **barra de progresso** da lição.
- **Balão do gatinho:** a instrução curta, com as palavras em inglês destacadas. O 🔊 repete a fala.
- **No centro:** a área do exercício, com cartões ilustrados grandes (de no mínimo 120 px).
- **Faixa de retorno embaixo,** depois de cada resposta:
  - verde, com "Yes! That's great!" ou uma variação ("Awesome!", "Well done!");
  - laranja, com "Opa! Vamos tentar de novo". Nunca vermelha, e nunca escrito "errado".
  - O botão **Continuar** é grande.

### 5.3 Os tipos de exercício

| Tipo | O que acontece | Fala do gatinho (exemplo) |
|---|---|---|
| ✨ **Palavra nova** | Imagem grande com a palavra; tocar repete o som | "Esse é o urso. Em inglês: ***bear***. Repita comigo: ***bear***!" |
| 👂 **Ouça e toque** | De 2 a 4 cartões; tocar no certo | "Qual é o ***bear***? Toque nele!" |
| 🎤 **Toque e repita** | A criança toca, ouve e repete em voz alta, sem avaliação de pronúncia | "Toque no animal e repita comigo!" |
| 👍👎 **Certo ou errado** | O gatinho mostra uma imagem e diz uma frase | "Olha! ***This is a frog!*** Certo ou errado?" |
| 🔗 **Ligar pares** | De 3 a 4 imagens e 3 a 4 botões de som com a palavra; tocar um de cada lado forma o par | "Ligue cada animal ao nome dele!" |
| ❓ **O que sumiu?** | De 3 a 4 cartões aparecem e um some; a criança escolhe qual sumiu entre opções faladas | "Um animal se escondeu! Quem sumiu?" |

### 5.4 Erros: nunca punir, sempre ajudar

1. **1º erro:** faixa laranja com "Opa! Vamos tentar de novo". O gatinho repete a pergunta.
2. **2º erro:** o cartão certo **brilha**. A criança toca nele, ouve a palavra e segue em frente.
3. **Revisão:** o exercício errado volta **uma vez** no fim da lição para reforçar, e a barra de progresso conta isso.
4. **Nada se perde:** sair no meio não perde nada. A lição recomeça do início na próxima vez, porque é curta.

### 5.5 As paradas da Unidade 1 (roteiro do protótipo)

**Rotina de abertura de toda parada.** O gatinho diz: "Oi! Hoje nós vamos [objetivo]!" e aparece um cartão com as palavras do dia.
**Rotina de fechamento.** O gatinho diz: "***Great job!*** Hoje você aprendeu: …!". As palavras aparecem lado a lado e a criança ganha ⭐.

1. **🎵 Música: "What's this?"** É um canto curto e repetitivo, com letra original.
   - **Formato:** a letra aparece em karaokê, frase por frase, com a figura de cada animal.
   - **No protótipo,** a voz do navegador **fala** o canto em ritmo. A música real gerada por IA entra depois, num arquivo de áudio.
   - **Final:** um exercício "ouça e toque" de 3 rodadas com os animais da música.
2. **⭐ Lição 1:** bear, bird, frog. Cerca de 10 exercícios na receita:
   > ✨bear → 👂bear → ✨bird → 👂bear/bird → ✨frog → 👍👎 → 🔗 três pares → 👂 mistura → 🎤 → fechamento
3. **⭐ Lição 2:** snake, spider, mouse. A mesma receita, terminando com 👂 que mistura as 6 palavras.
4. **⭐ Lição 3: "What's this? It's a …!"** Revisa as 6 palavras dentro da frase.
   - Os exercícios são 👂 e 👍👎 com a frase completa ("***What's this?*** … ***It's a snake!***"), 🔗 com 4 pares e ❓ o que sumiu.
5. **📖 História: "O gatinho na floresta".** É uma história original de 5 ou 6 páginas: o gatinho passeia, encontra cada animal e diz "***Hello, bear!***".
   - **Antes:** 🔗 rápido com 4 animais, para preparar o vocabulário.
   - **Durante:** cada página tem ilustração e narração. Tocar num animal da cena fala o nome dele.
   - **Depois:** uma pergunta: "Quem o gatinho encontrou primeiro? Toque!"
6. **🏆 Desafio da unidade:** de 8 a 10 exercícios misturando tudo, incluindo ❓ e 👍👎 com a frase.
   - **No fim:** **um baú se abre** e mostra a figurinha da unidade, que vai para o álbum ("***A bear sticker!***").
   - A faixa da unidade fica completa e a próxima unidade aparece "chegando em breve".

O texto final de cada fala e da letra é escrito no plano de implementação e revisado pela Giulia antes do teste com crianças.

### 5.6 Calendário de dias e álbum

- **Calendário de dias:** fica no alto do mapa e mostra os 7 dias da semana. Os dias em que a criança brincou ganham um ☀. Não existe contador que zera, nem mensagem de "você perdeu".
- **Álbum:** uma página por unidade, com espaço para a figurinha da unidade. Tocar numa figurinha fala o nome dela em inglês.

## 6. Imagens e voz no protótipo (antes do conteúdo gerado por IA)

- **Ilustrações dos animais:** usar um conjunto de ilustrações de licença aberta, de traço simples e consistente, em tamanho grande, por exemplo o Twemoji, licença CC-BY 4.0. Os cartões **não** levam a letra inicial, que entregava a resposta. A licença exige atribuição, então os créditos ficam numa tela "Sobre" acessível aos pais. Essas imagens são trocadas pelas ilustrações próprias quando elas existirem.
- **Cenários** (floresta, mapa e páginas da história): SVG próprio, desenhado com a paleta.
- **Voz:** a voz do navegador com **duas vozes**: pt-BR para as instruções e en-US para o inglês. Cada fala é uma sequência de trechos, cada trecho com o seu idioma. Quando houver áudio gravado ou gerado, cada trecho ganha um arquivo.
- **Mascote:** o gatinho atual ganha expressões novas: apontando, comemorando, ouvindo e "ajudando", esta usada no 2º erro.

## 7. Arquitetura (o que muda no código)

**Continua da Fase 1:**
- o núcleo do narrador (desbloqueio, tempo de segurança, cancelamento seguro);
- o `ProgressProvider` com hidratação segura;
- o `BigButton` e o mascote, que ganha expressões novas;
- a estrutura de testes com Vitest e Playwright, com o e2e que grava as falas;
- o PWA.

**Muda:**
1. **Esquema de conteúdo v2:**
   - O **mundo** tem unidades, e a **unidade** tem paradas: `song | lesson | story | challenge`, cada uma com `id`, `title` e `icon`.
   - Uma **parada de lição** ou de desafio tem uma lista de **exercícios**, um tipo união: `intro | listenTap | tapRepeat | trueFalse | matchPairs | whatsMissing`.
   - Toda fala é uma `Narration`, uma lista de trechos `{ lang: "pt-BR" | "en-US", text, src? }`.
   - Tudo validado com zod, com as mesmas checagens de referência da Fase 1.
2. **Motor da lição v2,** em função pura: uma fila de exercícios com **revisão no fim**, em que o exercício errado volta uma vez. Ele calcula o progresso da barra e tem a mesma proteção contra toque duplo.
3. **Exercícios:**
   - um componente por tipo, todos dentro de uma `ExerciseShell` comum (balão, barra e faixa de retorno);
   - a lógica de cada tipo continua em funções puras testadas, como na Fase 1.
4. **Narrador:** passa a tocar `Narration` em sequência, escolhendo a voz pelo idioma de cada trecho.
5. **Progresso v2:** `completedStops` (id → data), `stickers` e `daysPlayed` (datas). A chave nova no localStorage é `lingoo:progress:v2`, sem migração, porque ninguém tem dados ainda. O desbloqueio é por parada, em sequência dentro da unidade, e por unidade.
6. **Mapa v2:** cenário em SVG, faixa da unidade, paradas tipadas e unidades trancadas.
7. **Sai:** o `DragGame` e os passos antigos de "sticker". A figurinha agora é recompensa do desafio.

## 8. Testes

- **Funções puras** (motor da lição v2, cada tipo de exercício, desbloqueio v2): todos os casos de acerto, erro, segundo erro com ajuda, revisão no fim e toque duplo.
- **Componentes:** cada exercício dentro da `ExerciseShell`, com o narrador simulado.
- **E2E com a fala gravada:** a criança joga a Unidade 1 inteira. O teste confere:
  - a abertura em português ("Hoje nós vamos aprender…");
  - a palavra em inglês na voz en-US;
  - "Yes! That's great!" depois de um acerto;
  - "Opa! Vamos tentar de novo" depois de um erro;
  - o baú com a figurinha no fim;
  - o progresso salvo depois de recarregar a página.
- **Capturas de tela** do mapa e de cada tipo de exercício no tablet deitado e no celular, conferidas antes de entregar.

## 9. Fora do escopo deste redesenho

- Unidades 2 a 7, que são só conteúdo novo. O formato já fica pronto.
- Música cantada de verdade e ilustrações próprias, que dependem da produção com IA.
- Avaliação de pronúncia; pais, login e assinatura (Fases 2 e 3).
- Estrelas por desempenho, de 1 a 3, que podem entrar numa trilha para 7 e 8 anos.

## 10. Riscos

- **Voz do navegador em português e inglês:** a qualidade varia entre aparelhos, e alguns tablets não têm voz em pt-BR ou en-US instalada. Mitigação: testar no tablet de teste e priorizar a produção de áudio gravado para a Unidade 1.
- **Ilustrações de licença aberta:** são temporárias. O visual final depende das ilustrações próprias (guia de estilo da seção 8 da especificação original).
- **Tamanho do conteúdo:** uma unidade tem cerca de 40 exercícios e 2 roteiros (música e história). Mitigação: o roteiro completo vai no plano e é revisado antes de produzir áudio e imagens.
