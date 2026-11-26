# NESTOY — Árvore das Letras, cadastro da criança e banco de atividades

**Data:** 2026-11-26 · **Branch:** `arvore-das-letras` · **Pedido por:** Lucas.
**Base:** o sistema Ilha-Ninho (`docs/superpowers/specs/2026-11-18-nestoy-ilha-ninho-design.md`), que continua valendo em tudo o que este documento não muda.

## 0. Regra do produto (vale para toda a ilha)

**O NESTOY é um app para crianças brasileiras aprenderem inglês brincando.** Toda área da ilha ensina **inglês** (e, por escolha, também português: ver 0.1): letras, números, cores, o mundo do lago. O Nino conversa com a criança em português (instruções, incentivo, ajuda), como já faz no farol. O conteúdo que ela aprende — letras, palavras, números, frases — é sempre em inglês. O caminho em português é opcional e nunca substitui o inglês.

### 0.1 Bilíngue por escolha (pedido do Lucas)

Cada área pode ter **dois caminhos**: 🇺🇸 inglês (sempre presente, é o produto) e 🇧🇷 português (alfabetização e números em português, para quem precisa). **Os responsáveis decidem o que fica disponível** no cadastro e na área dos responsáveis: "Inglês", "Português" ou "Os dois". Com "Os dois", **a criança escolhe** o caminho na entrada da área tocando numa bandeira, sem precisar ler. "Sempre pense no bilíngue": toda área nova é desenhada com os dois caminhos em mente.

- **Abordagem escolhida (B):** dois caminhos por área, cada um com o método de ensino certo para a sua língua. As figuras, o banco, o motor, o nível adaptativo, as estrelas e as figurinhas são compartilhados; cada item do banco tem as duas línguas (ball/bola).
- **Descartadas:** (A) uma chave que troca o idioma do app inteiro, porque força o português no formato do inglês; (C) as duas línguas misturadas em cada lição, porque confunde a alfabetização ("bi" e "bê" para o mesmo B).
- **Ordem de construção:** primeiro a base bilíngue e o caminho em inglês da Árvore; depois o caminho em português. Antes de produzir o português, um teste de pronúncia de cerca de 20 sílabas pela voz gerada, conferido por transcrição; se falhar, as sílabas são gravadas por voz humana.

## 1. Intenção

O objetivo do Lucas antes de publicar é ter **todas as áreas da ilha funcionando, cada uma com pelo menos 3 ou 4 unidades**. A Árvore das Letras é a primeira área nova: **o alfabeto e as primeiras palavras em inglês**. Junto com ela entram as peças que todas as áreas vão usar:

- **Cadastro da criança:** os responsáveis informam nome, idade e o contato que a criança já tem com inglês.
- **Banco de atividades:** atividades marcadas por nível.
- **Nível que se ajusta:** o cadastro define por onde a criança começa, e os acertos e erros ajustam o nível aos poucos.

Nas palavras do Lucas: "Várias atividades no banco e conforme as respostas do onboarding direcionar as atividades".

**Ordem combinada das áreas** (cada uma passa pelo próprio desenho antes de ser construída; todas ensinam inglês):

1. Árvore das Letras, com as peças comuns (este documento).
2. Farol das Línguas: unidades 2 a 4.
3. Torre dos Números (números em inglês).
4. Jardim das Cores (cores em inglês).
5. Lago das Descobertas (o mundo em inglês).

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos**

- **Cadastro na primeira abertura**, com nome, idade e o contato com inglês. É editável depois na área dos responsáveis.
- **Árvore das Letras pronta na ilha**, com interior navegável e 4 unidades (galhos). Cada galho tem as 6 paradas do padrão do farol: Música, Lição 1–3, História e Desafio.
- **Banco de atividades em inglês** com as 26 letras e cerca de 30 palavras com figura (uma ou mais para cada letra), marcado por unidade e dificuldade. As paradas montam as atividades a partir do banco.
- **Nível adaptativo:** o cadastro define o galho de partida, e dentro de cada parada a dificuldade acompanha os acertos.
- **Árvore que cresce**, como o farol. Ganha fio laranja-coral (`#FF7A5C`) no ninho, estrelas e figurinhas.
- **Peças comuns independentes da área**, para a Torre, o Jardim e o Lago reaproveitarem sem reescrever.

**Não-objetivos (agora)**

- Traçar letras com o dedo.
- Mais de uma criança por aparelho.
- O Nino falar o nome da criança.
- Servidor ou conta online.
- Relatório para os responsáveis.

**Anti-objetivos (falharia mesmo funcionando)**

- Um app que deixa de ser de inglês: o caminho em inglês existe em toda área, e o português é uma opção ao lado dele.
- A criança perceber que "caiu de nível", ou ver contador, vida ou tempo.
- Exigir leitura de quem ainda não lê. As instruções são faladas pelo Nino, e o texto na tela é só apoio.
- Sons isolados de letra ("/b/") gerados por voz sintética, que soam errados. Usamos o nome da letra em inglês e palavras: "**B** is for **ball**".
- Dados da criança saírem do aparelho.
- Mexer no formato do progresso v3 a ponto de perder o que já foi salvo.

## 3. O cadastro

- **Quando aparece:** na primeira abertura, antes da abertura do Nino.
- **Como entra:** uma tela creme com o Nino diz "Chame um adulto!" (fala gravada) e mostra o botão "Segure para entrar" (HoldGate de 2 s, o mesmo da área dos responsáveis).
- **Perguntas, uma por vez, com botões grandes:**
  1. **Nome da criança.** Campo de texto com até 20 caracteres. Pode ficar vazio ("Pular").
  2. **Idade:** 5, 6, 7 ou 8 anos (também "4" e "9+", tratados como 5 e 8).
  3. **O que a criança vai aprender:** "Inglês", "Português" ou "Os dois" (padrão: "Inglês").
  4. **Contato com inglês** (se inglês): "Nenhum ainda", "Conhece algumas palavras", "Sabe o alfabeto em inglês" ou "Lê palavras simples em inglês".
  5. **Leitura em português** (se português): "Ainda não conhece as letras", "Conhece as vogais", "Junta sílabas" ou "Lê palavras".
- **Depois:** "Pronto!" e segue a abertura normal.
- **Ver e mudar:** os mesmos campos ficam na área dos responsáveis (`/responsaveis`), seção "Criança". Mudar o cadastro muda só a sugestão de partida, não apaga progresso.
- **Onde o nome aparece, só escrito:** título do ninho ("Ninho da Ana"), cartão da volta e área dos responsáveis.
- **Armazenamento:** `lingoo:profile:v1` no aparelho (`{ name, age, english: "none"|"words"|"alphabet"|"reads", createdAt, areas }`). Fica separado do progresso v3 e das preferências.
- **Quem já usa o app:** vê a tela de cadastro uma vez na próxima abertura, com "Agora não". Depois o cadastro fica só na área dos responsáveis. Sem cadastro, a partida é o galho 1.

**Galho de partida** (decide o contato com inglês; a idade só ajusta o ritmo das lições — mais opções e menos repetição a partir de 7 anos):

| Contato com inglês | Galho de partida |
|---|---|
| Nenhum ainda | Galho 1 |
| Conhece algumas palavras | Galho 1 |
| Sabe o alfabeto em inglês | Galho 3 |
| Lê palavras simples em inglês | Galho 4 (para quem tem 7 anos ou mais; com 5 ou 6 anos, galho 3) |

**Galho de partida no caminho em português:** "Ainda não conhece" → galho 1; "Conhece as vogais" → galho 2; "Junta sílabas" → galho 3; "Lê palavras" → galho 4.

## 4. A Árvore das Letras

### 4.1 Na ilha

O estado "em construção" (andaime, lona, martelinho) vira "pronto". O lugar responde, o Nino anda até lá e aparece o botão para entrar, igual ao farol.

A árvore cresce com as paradas concluídas, somando todos os galhos:

| Nível | Paradas concluídas | Mudança na árvore |
|---|---|---|
| 1 | 0 | Copa simples |
| 2 | ≥ 3 | Letras-fruta penduradas |
| 3 | ≥ 9 | Passarinhos e lanternas à noite |
| 4 | ≥ 18 | Flores na copa e brilho ao entardecer |

A volta de uma parada mostra a mudança só se o nível subiu, como no farol.

### 4.2 Interior (rota `/arvore`)

Entrar é a câmera mergulhar na porta do tronco. Por dentro, o tronco é oco e de madeira clara, com janelas redondas mostrando folhas. Os quatro galhos sobem em espiral, e **cada galho é uma unidade com 6 plataformas**, uma por parada. No topo fica um ninho de letras que acende quando os 4 galhos terminam.

**Regra de acesso (chamada minha):** estão abertos os galhos de 1 até o de partida, e cada galho seguinte abre quando o Desafio do galho anterior é concluído. Os galhos ainda fechados mostram um broto, nunca cadeado vermelho. Dentro de um galho, as paradas seguem em sequência, como no farol.

O desenho é feito em SVG por funções puras, como `farol-interior.ts`, seguindo a bíblia: tronco `#9A6A43 / #7A5232`, folhas `#5DB55A / #3F8F45 / #86CF6B` e acento da área `#FF7A5C`.

### 4.3 As 4 unidades (galhos)

| Galho | Tema | A criança aprende (em inglês) | Itens do banco |
|---|---|---|---|
| 1 | ABC: A a M | O nome das letras A–M em inglês e uma palavra para cada ("**A** is for **apple**") | 13 letras, 13–15 palavras |
| 2 | ABC: N a Z | O nome das letras N–Z em inglês e uma palavra para cada ("**S** is for **sun**") | 13 letras, 13–15 palavras |
| 3 | Letter sounds | Com que letra a palavra em inglês começa ("Which one starts with **B**?": ball, cat, dog) | as 26 letras e as palavras dos galhos 1–2 |
| 4 | First words | Reconhecer palavras curtas escritas em inglês (cat, dog, sun, hat, bed…) e tocar na figura certa | 15 palavras de 3 letras, reaproveitando as figuras |

**Caminho em português (segunda etapa),** alinhado às habilidades de consciência silábica do 1º ano da BNCC (EF01LP06, 08, 09 e 13):

| Galho | Tema | A criança aprende | Exemplo |
|---|---|---|---|
| 1 | Vogais | Reconhecer A E I O U e a palavra que começa com cada uma | "**A** de **abelha**" |
| 2 | Famílias silábicas | Consoante + vogal | "**B** com **A** faz **BA**" (BA BE BI BO BU) |
| 3 | Juntar sílabas | Separar e juntar sílabas, bater palmas, contar sílabas | "**BO** + **LA** = **BOLA**" |
| 4 | Ler palavras | Ler palavras e frases curtas, sílaba inicial e final, rimas | "**GATO**": toque na figura |

Na árvore, os galhos em inglês sobem por um lado do tronco e os em português pelo outro; com só um caminho ativo, o outro lado fica com folhas, sem broto nem aviso. As duas metades somam para o crescimento da árvore e para o fio do ninho.

Cada galho tem: **Música** (canção do alfabeto ou das palavras do galho, em inglês), **Lição 1–3**, **História** curta e **Desafio** com figurinha.

A **História** usa um formato mais simples que as cenas da floresta: cada página é o interior da árvore desfocado ao fundo, uma ou duas figuras grandes do banco e a frase falada pelo Nino, com a palavra em inglês em destaque. Termina com uma pergunta de tocar. Não exige desenhar cenários novos (chamada minha).

## 5. O banco de atividades

- **Banco:** um arquivo de conteúdo (`content/areas/letras/bank.json`) com itens:
  - letra (`{ id, glyph, nameEn, wordIds }`);
  - palavra (`{ id, en, pt, art, initial }`).

  Cada item é marcado com `unit` (1–4) e `difficulty` (1–3).
- **Modelos de atividade:** em vez de escrever cada exercício à mão como no farol, cada lição é uma lista de modelos que o motor preenche com itens do banco. Os modelos reaproveitam os 6 exercícios que já existem, com cartões de **letra ou palavra escrita** além de figura. A instrução é em português e o conteúdo, em inglês:

  | Modelo | Exercício base | Exemplo |
  |---|---|---|
  | `apresentar-letra` | intro | "Esta é a letra **B**. **B is for ball.**" |
  | `ouvir-tocar-letra` | listenTap com cartões de letra | "Toque no **B**." (letra dita em inglês: "bee") |
  | `letra-da-palavra` | listenTap com figuras | "Qual começa com **B**?" (ball, cat, sun) |
  | `verdadeiro-comeca` | trueFalse | "**Ball** começa com **B**?" |
  | `ligar-letra-figura` | matchPairs | letra ↔ figura |
  | `letra-que-falta` | whatsMissing | "\_AT" → C (cat) |
  | `ler-palavra` | listenTap com figuras e a palavra escrita | "**DOG**": toque na figura |

- **Escolha dos itens:** é determinística por semente (unidade + parada + dia), para que uma parada repetida no mesmo dia seja a mesma. Itens que a criança errou recentemente têm prioridade.
- **Nível adaptativo dentro da parada:** começa no nível salvo do galho (1 na primeira vez). Com 3 acertos de primeira seguidos, sobe um, e com 2 erros seguidos, volta um. Nada disso aparece na tela. O nível define quais itens entram (pela marca 1–3 do banco), o número de opções (2 → 3 → 4) e a semelhança entre elas (B/D antes de B/S).
- **Memória:** as palavras vistas entram no Treino de memória existente, como as do farol.
- **Formato genérico:** o banco e os modelos são definidos de forma independente da área (`area: "letras"`), para que Números e Cores usem o mesmo motor com outros itens.

### 5.1 Decisões técnicas do banco (chamadas minhas)

- **Voz:** a narração já é feita de trechos com língua própria (português e inglês), como em "Qual é o **bear**?" do farol. Os modelos juntam trechos gravados do mesmo jeito: a instrução em português e a letra ou palavra em inglês. Cada trecho é gravado uma vez pelo pipeline atual. Estimativa: 150 a 250 falas novas (letras, palavras e instruções). Uma combinação com trecho sem gravação não pode ser sorteada; o teste do banco garante isso.
- **Formato do conteúdo:** a lista fixa de figuras (hoje só os 6 animais) vira um registro de figuras que aceita novas, e os cartões ganham um tipo "texto grande" (letra ou palavra) ao lado de "figura". O farol e o Treino de memória continuam funcionando igual; os testes atuais deles precisam continuar passando sem mudança de comportamento.
- **Onde fica o histórico:** `lingoo:profile:v1` guarda, por área e galho, o nível atual (1–3) e os últimos erros por item (no máximo 20, os mais recentes).
- **Música e História:** as perguntas dentro dessas paradas ficam fixas no nível 1 e não mexem no nível.
- **Perfil:** é validado e saneado ao ler, como as preferências: campo inválido volta ao padrão e nunca derruba o app. Se o formato mudar, o v1 é migrado sem perder nada.

## 6. Progresso, ilha e ninho

- **Progresso:** o v3 continua igual no formato. As paradas da árvore entram em `completedStops` com ids prefixados (`letras-1-licao-1`); estrelas e figurinhas usam os campos existentes.
- **Ilha:**
  - `LAUNCH_STATES.letras` passa de "obra" para "pronto";
  - `suggestedPlace` considera as duas áreas e, entre as que têm parada atual, sugere a menos jogada recentemente. No mesmo dia a sugestão só muda depois de concluir uma parada;
  - `nestThreads` conta por área, um fio por área com alguma parada concluída.
- **Ninho:** as figurinhas da árvore entram numa seção "Árvore das Letras" na grade.

## 7. Conteúdo que precisa ser produzido

- **Figuras:** cerca de 30 ilustrações no estilo dos animais atuais (`src/art/animals/*.tsx`: SVG em React, formas redondas, sem contorno), uma ou mais por letra do alfabeto: apple, ball, cat, dog, egg, fish, goat, hat, igloo, jam, kite, lion, moon, nest, orange, pig, queen, rain, sun, tree, umbrella, van, web, box (para X, "ends with x"), yo-yo, zebra, e as palavras de 3 letras do galho 4. As 6 figuras de animais existentes entram no banco quando servirem (bear, bird, frog…). A lista final sai do banco.
- **Falas:** pela voz do Nino, pelo pipeline `content/lines.json` → `public/audio/` com verificação por transcrição:
  - nomes das letras e palavras, em inglês;
  - instruções dos modelos, em português;
  - 4 canções curtas em inglês, no estilo de `chant.py` (o galho 1 e o galho 2 dividem a canção do alfabeto em duas metades);
  - 4 histórias curtas.
- **Interior da árvore e estados na ilha** (seção 4).

## 8. Abordagens consideradas

| Abordagem | Como funciona | Troca |
|---|---|---|
| A. Três trilhas fixas | Cada galho é uma trilha escrita à mão; o cadastro escolhe o galho | Simples, mas não é banco e não se adapta |
| B. Banco livre | Sem trilha; cada sessão sorteia do banco pelo nível | Muito adaptativo, mas perde caminho, estrela e lugar que cresce |
| **C. Trilha com paradas que puxam do banco** (escolhida pelo Lucas) | Galhos com paradas; cada parada monta atividades do banco no nível atual | Mantém o caminho e dá o direcionamento; exige banco com figuras e falas |

## 9. Restrições

- Next.js 16 com mudanças grandes (ler `node_modules/next/dist/docs/`), com `cacheComponents` e Activity. Tudo que é transitório reseta na chegada, como já se faz na ilha.
- Bíblia visual do Ilha-Ninho: nunca vermelho, laranja só do Nino, alvos ≥ 64 px e movimento reduzido pela mídia e pela preferência.
- Todas as verificações (testes, tipos, lint, build e testes de ponta a ponta) passando em cada etapa.

## 10. Deixado para quem constrói

- A lista final das palavras, respeitando: substantivos concretos, conhecidos aos 5 anos, desenháveis, com pronúncia clara e sem homônimos confusos.
- As letras das 4 canções e o texto das 4 histórias, curtos e no tom do Nino.
- Os números exatos de subida e descida de dificuldade, desde que nunca apareçam para a criança.
- A organização interna dos arquivos do motor de banco.
