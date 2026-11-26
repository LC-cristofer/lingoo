# NESTOY — Árvore das Letras, cadastro da criança e banco de atividades

**Data:** 2026-11-26 · **Branch:** `arvore-das-letras` · **Pedido por:** Lucas.
**Base:** o sistema Ilha-Ninho (`docs/superpowers/specs/2026-11-18-nestoy-ilha-ninho-design.md`), que continua valendo em tudo o que este documento não muda.

## 1. Intenção

O objetivo do Lucas antes de publicar é ter **todas as áreas da ilha funcionando, cada uma com pelo menos 3 ou 4 unidades**. A Árvore das Letras é a primeira área nova. Junto com ela entram as peças que todas as áreas vão usar:

- **Cadastro da criança:** os responsáveis informam nome, idade e o que a criança já sabe.
- **Banco de atividades:** atividades marcadas por nível.
- **Nível que se ajusta:** o cadastro define por onde a criança começa, e os acertos e erros ajustam o nível aos poucos.

Nas palavras do Lucas: "Várias atividades no banco e conforme as respostas do onboarding direcionar as atividades".

**Ordem combinada das áreas** (cada uma passa pelo próprio desenho antes de ser construída):

1. Árvore das Letras, com as peças comuns (este documento).
2. Farol das Línguas: unidades 2 a 4.
3. Torre dos Números.
4. Jardim das Cores.
5. Lago das Descobertas.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos**

- **Cadastro na primeira abertura**, com nome, idade e o que a criança já faz com as letras. É editável depois na área dos responsáveis.
- **Árvore das Letras pronta na ilha**, com interior navegável e 4 unidades (galhos). Cada galho tem as 6 paradas do padrão do farol: Música, Lição 1–3, História e Desafio.
- **Banco de atividades de letras** com cerca de 30 palavras com figura (10 no galho 1, 16 no galho 2 e mais algumas para completar; os galhos 3 e 4 reaproveitam essas figuras), as 5 vogais e 8 consoantes iniciais, marcado por unidade e dificuldade. As paradas montam as atividades a partir do banco.
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

- A criança perceber que "caiu de nível", ou ver contador, vida ou tempo.
- Galho trancado atrás de outro: todo galho anterior ao de partida fica aberto e opcional.
- Exigir leitura de quem ainda não lê. As instruções são faladas pelo Nino, e o texto na tela é só apoio.
- Pronúncia de sons isolados ("/b/") gerada por voz sintética, que soa errada. Usamos o nome da letra e palavras: "**B** de **bola**".
- Dados da criança saírem do aparelho.
- Mexer no formato do progresso v3 a ponto de perder o que já foi salvo.

## 3. O cadastro

- **Quando aparece:** na primeira abertura, antes da abertura do Nino.
- **Como entra:** uma tela creme com o Nino diz "Chame um adulto!" (fala gravada) e mostra o botão "Segure para entrar" (HoldGate de 2 s, o mesmo da área dos responsáveis).
- **Perguntas, uma por vez, com botões grandes:**
  1. **Nome da criança.** Campo de texto com até 20 caracteres. Pode ficar vazio ("Pular").
  2. **Idade:** 5, 6, 7 ou 8 anos (também "4" e "9+", tratados como 5 e 8).
  3. **O que já faz com as letras:** "Ainda não conhece", "Conhece algumas letras", "Junta sílabas" ou "Lê palavras curtas".
- **Depois:** "Pronto!" e segue a abertura normal.
- **Ver e mudar:** os mesmos campos ficam na área dos responsáveis (`/responsaveis`), seção "Criança". Mudar o cadastro muda só a sugestão de partida, não apaga progresso.
- **Onde o nome aparece, só escrito:**
  - título do ninho ("Ninho da Ana");
  - cartão da volta;
  - área dos responsáveis.
- **Armazenamento:** `lingoo:profile:v1` no aparelho (`{ name, age, letters: "none"|"some"|"syllables"|"words", createdAt }`). Fica separado do progresso v3 e das preferências.
- **Quem já usa o app:** quem não tem cadastro vê a tela de cadastro na próxima abertura, uma vez, com "Agora não" disponível. Sem cadastro, a partida é o galho 1.

**Galho de partida = o mais avançado entre a idade e o que já faz:**

| | Ainda não conhece | Conhece algumas | Junta sílabas | Lê palavras |
|---|---|---|---|---|
| **5 anos** | Galho 1 | Galho 2 | Galho 3 | Galho 4 |
| **6–7 anos** | Galho 1 | Galho 2 | Galho 3 | Galho 4 |
| **8 anos** | Galho 2 | Galho 2 | Galho 3 | Galho 4 |

(Chamada minha: a idade só sobe o ponto de partida no caso de 8 anos que "não conhece", para evitar trilha infantil demais. Fora isso, quem decide é o que a criança já faz.)

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

A câmera abre no galho atual. O galho sugerido (o de partida, ou o próximo depois de um desafio concluído) brilha. Os outros ficam livres para tocar, menos os galhos acima do próximo ainda não começado: esses aparecem com broto, como "em breve", sem cadeado vermelho.

**Regra de acesso (chamada minha):** estão abertos os galhos de 1 até o de partida, e cada galho seguinte abre quando o Desafio do galho anterior é concluído. Os galhos ainda fechados mostram um broto, nunca cadeado vermelho. Dentro de um galho, as paradas seguem em sequência, como no farol. Uma criança que começou no galho 1 não toca no galho 3 até concluir o Desafio do galho 2.

O desenho é feito em SVG por funções puras, como `farol-interior.ts`, seguindo a bíblia: tronco `#9A6A43 / #7A5232`, folhas `#5DB55A / #3F8F45 / #86CF6B` e acento da área `#FF7A5C`.

### 4.3 As 4 unidades (galhos)

| Galho | Tema | A criança aprende | Itens do banco |
|---|---|---|---|
| 1 | Vogais | Reconhecer A E I O U e ligar a vogal à palavra que começa com ela | 5 vogais, 10 palavras |
| 2 | Primeiras consoantes | Reconhecer B, P, M, T, D, L, F e V e o som inicial ("Qual começa com **B**?") | 8 consoantes, 16 palavras |
| 3 | Sílabas | Juntar consoante e vogal (BA, BE, BI, BO, BU…) e a primeira sílaba da palavra | 20 sílabas (B, P, M e T com as 5 vogais), as palavras do galho 2 |
| 4 | Palavras curtas | Ler palavras de 2 sílabas e tocar na figura certa | 15 palavras escritas, reaproveitando as figuras dos galhos 1 e 2 |

Cada galho tem: **Música** (canção do galho), **Lição 1–3**, **História** curta com as palavras do galho e **Desafio** com figurinha.

A **História** usa um formato mais simples que as cenas da floresta: cada página é o interior da árvore desfocado ao fundo, uma ou duas figuras grandes do banco e a frase falada pelo Nino com a palavra-chave em destaque. Termina com uma pergunta de tocar. Não exige desenhar cenários novos (chamada minha).

## 5. O banco de atividades

- **Banco:** um arquivo de conteúdo (`content/areas/letras/bank.json`) com itens:
  - letra (`{ id, glyph, name, wordIds }`);
  - sílaba (`{ id, glyph, parts }`);
  - palavra (`{ id, text, syllables, art, initial }`).

  Cada item é marcado com `unit` (1–4) e `difficulty` (1–3). As falas de cada item ("Esta é a letra B. B de bola.") ficam no pipeline de voz existente.
- **Modelos de atividade:** em vez de escrever cada exercício à mão como no farol, cada lição é uma lista de modelos que o motor preenche com itens do banco. Os modelos reaproveitam os 6 exercícios que já existem, com cartões de **texto grande** (letra, sílaba ou palavra) além de figura:

  | Modelo | Exercício base | Exemplo |
  |---|---|---|
  | `apresentar-letra` | intro | "Esta é a letra **B**. B de bola." |
  | `ouvir-tocar-letra` | listenTap com cartões de letra | "Toque no **B**." |
  | `comeca-com` | listenTap com figuras | "Qual começa com **B**?" |
  | `verdadeiro-comeca` | trueFalse | "**Bola** começa com **B**?" |
  | `ligar-letra-figura` | matchPairs | letra ↔ figura |
  | `juntar-silaba` | listenTap com cartões de sílaba | "**B** com **A** faz…?" (BA, BO, BE) |
  | `primeira-silaba` | whatsMissing | "\_\_LA" → BO |
  | `ler-palavra` | listenTap com figuras e a palavra escrita | "GATO": toque na figura |

- **Escolha dos itens:** é determinística por semente (unidade + parada + dia), para que uma parada repetida no mesmo dia seja a mesma. Itens que a criança errou recentemente têm prioridade.
- **Nível adaptativo dentro da parada:** começa na dificuldade 1. Com 3 acertos de primeira seguidos, sobe para 2, e depois para 3. Com 2 erros seguidos, volta um. Nada disso aparece na tela. A dificuldade muda o número de opções (2 → 3 → 4) e a semelhança entre elas (B/V antes de B/P).
- **Memória:** as palavras vistas entram no Treino de memória existente, como as palavras de inglês.
- **Formato genérico:** o banco e os modelos são definidos de forma independente da área (`area: "letras"`), para que Números e Cores usem o mesmo motor com outros itens.

### 5.1 Decisões técnicas do banco (chamadas minhas)

- **Voz:** cada frase que um modelo pode produzir com os itens do banco é gerada antes, inteira, pelo pipeline de voz. Não há colagem de pedaços, porque soa picotado para a criança. Um script enumera todas as combinações modelo × item e as acrescenta à lista de falas. Estimativa revista: 450 a 650 falas curtas, ainda dentro do plano de voz atual. Uma combinação sem fala gravada não pode ser sorteada; o teste do banco garante isso.
- **Formato do conteúdo:** a lista fixa de figuras (hoje só os 6 animais) vira um registro de figuras que aceita novas, e os cartões ganham um tipo "texto grande" (letra, sílaba ou palavra) ao lado de "figura". O farol e o Treino de memória continuam funcionando igual; os testes atuais deles precisam continuar passando sem mudança de comportamento.
- **Onde fica o histórico:** `lingoo:profile:v1` guarda, por galho, o nível atual (1–3) e os últimos erros por item (no máximo 20 itens, os mais recentes). Uma parada começa no nível salvo do galho. O nível define quais itens entram (pela marca 1–3 do banco) e quantas opções e que distratores aparecem.
- **Música e História:** as perguntas dentro dessas paradas ficam fixas na dificuldade 1 e não mexem no nível.
- **Perfil:** é validado e saneado ao ler, como as preferências: campo inválido volta ao padrão e nunca derruba o app. Se um dia o formato mudar, o v1 é migrado para o v2 sem perder nada.
- **"Agora não" para quem já usa o app:** a tela aparece uma vez. Depois o cadastro fica só na área dos responsáveis.

## 6. Progresso, ilha e ninho

- **Progresso:** o v3 continua igual no formato. As paradas da árvore entram em `completedStops` com ids prefixados (`letras-1-licao-1`); estrelas e figurinhas usam os campos existentes. O estado do nível adaptativo fica em `lingoo:profile:v1` (`letters.level` por galho), não no progresso.
- **Ilha:**
  - `LAUNCH_STATES.letras` passa de "obra" para "pronto";
  - `suggestedPlace` considera as duas áreas e, entre as que têm parada atual, sugere a menos jogada recentemente. No mesmo dia a sugestão não muda a cada volta, só depois de concluir uma parada;
  - `nestThreads` conta por área, um fio por área com alguma parada concluída.
- **Ninho:** as figurinhas da árvore entram numa seção "Árvore das Letras" na grade.

## 7. Conteúdo que precisa ser produzido

- **Figuras:** cerca de 30 ilustrações de objetos, animais e comida no estilo dos animais atuais (`src/art/animals/*.tsx`: SVG em React, formas redondas, sem contorno).
  - **Vogais (exemplos):** abelha, elefante, ilha, ovo, uva, cada uma com um segundo exemplo.
  - **Consoantes (exemplos):** bola, pato, macaco, tatu, dado, leão, foca, vaca, cada uma com um segundo exemplo.
  - A lista final sai do banco.
- **Falas:** em português, pela voz do Nino:
  - apresentação de cada letra e sílaba;
  - palavras;
  - instruções dos modelos;
  - 4 canções curtas, no estilo de `chant.py`;
  - 4 histórias.

  Usa o pipeline `content/lines.json` → `public/audio/` com verificação por transcrição. Estimativa: 250 a 350 falas.
- **Interior da árvore e estados na ilha** (seção 4).

## 8. Abordagens consideradas

| Abordagem | Como funciona | Troca |
|---|---|---|
| A. Três trilhas fixas | Cada galho é uma trilha escrita à mão; o cadastro escolhe o galho | Simples, mas não é banco e não se adapta |
| B. Banco livre | Sem trilha; cada sessão sorteia do banco pelo nível | Muito adaptativo, mas perde caminho, estrela e lugar que cresce; muitas vozes |
| **C. Trilha com paradas que puxam do banco** (escolhida pelo Lucas) | Galhos com paradas; cada parada monta atividades do banco no nível atual | Mantém o caminho e dá o direcionamento; exige banco com figuras e falas |

## 9. Restrições

- Next.js 16 com mudanças grandes (ler `node_modules/next/dist/docs/`), com `cacheComponents` e Activity. Tudo que é transitório reseta na chegada, como já se faz na ilha.
- Bíblia visual do Ilha-Ninho: nunca vermelho, laranja só do Nino, alvos ≥ 64 px e movimento reduzido pela mídia e pela preferência.
- Todas as verificações (testes, tipos, lint, build e testes de ponta a ponta) passando em cada etapa.

## 10. Deixado para quem constrói

- A lista final das 30 palavras, respeitando: substantivos concretos, conhecidos aos 5 anos, desenháveis e sem dupla grafia confusa (evitar "hipopótamo" para H).
- As letras das 4 canções e o texto das 4 histórias, curtos e no tom do Nino.
- Os números exatos de subida e descida de dificuldade, desde que nunca apareçam para a criança.
- A organização interna dos arquivos do motor de banco.
