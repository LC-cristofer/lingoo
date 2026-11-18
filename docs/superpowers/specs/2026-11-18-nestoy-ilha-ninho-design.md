# NESTOY — Ilha-Ninho: design aprovado para a reconstrução

**Data:** 2026-11-18 · **Branch:** `redesenho-trilha` · **Aprovado por:** Lucas ("I lovit this version, pode seguir").
**Substitui:** `2026-11-17-nestoy-experiencia-design.md` (céu noturno), que fica como histórico.
**Referência visual e de comportamento (aprovada):** o caderno "NESTOY Ilha-Ninho" (artifact privado do Lucas) e o protótipo em `tools/visual/ilha/` (`src/world.js`, `src/nino.js`, `src/interior.js`, `src/app.js`, `src/proto.css`). Imagens aprovadas em `docs/arte/ilha-ninho/`. Sons gerados em `tools/visual/ilha/sons/`. Logotipo em `tools/visual/ilha/logo/`.

A frase que guia tudo: **o ninho apresenta o universo, a câmera revela a ilha, a ilha convida a explorar, cada descoberta transforma o mundo.**

## 1. Bíblia visual (uma regra só)

- **Formas:** redondas e cheias, como o Nino. Cantos bem arredondados. Nada pontudo ou fino demais.
- **Cores do mundo:** céu `#7CC4EE → #CDEBF8 → #FFEFD9`; grama `#86CC5E` (luz `#9CDA74`, sombra `#6DB64C`, borda `#559B3D`); terra `#C08453 / #A46A3E / #84512D / #6A3E22`; caminho `#F6E2B8` (borda `#E3C58C`); água `#6CCBE3 / #45AECB / #C2EEF7`; pedra `#CBD3DC / #A1ADBB / #E3E8EE`; madeira e ninho `#C98A4B / #9C6631 / #E2A762 / #7A4A26`; folha `#5DB55A / #3F8F45 / #86CF6B`; tronco `#9A6A43 / #7A5232`; lã `#F6E7CF`.
- **Uma cor por área:** Letras `#FF7A5C`, Números `#F5B12E`, Cores `#A57BEA`, Línguas `#2E9FD8`, Mundo `#2EB8A4`, Ninho `#C98A4B`.
- **Interface:** creme `#FFF8EC`, cacau `#3A2618`, texto 2 `#8A6A50`, acerto `#5DB55A` (borda `#3E8E3E`), noite da interface `#1B2259`. **O laranja `#FF9F43` é exclusivo do Nino.** Nunca vermelho para erro.
- **Noite:** o mesmo mundo com outra luz: céu `#0E1640 / #1E2A6B / #3A3270`, gradação multiplicativa `#3A4A8C` a 62%, luzes quentes `#FFE29A` / `#FFB866` (lanterna, janelas, farol, vaga-lumes), estrelas `#FFF6E0`.
- **Textura:** grão de papel fino por cima de tudo (o mesmo em todos os cenários). Lã e gravetos só no ninho.
- **Luz:** sempre do alto à esquerda. Cada material: base + sombra mais fria + luz mais quente.
- **Sombras:** de contato, macias, cacau a 16%, deslocadas para a direita. Nada de preto.
- **Contornos:** nenhum. Exceção: borda branca de recorte nas figurinhas (colecionáveis).
- **Personagens:** regras do Nino; escala de desenho animado (Nino ≈ metade da altura do farol).
- **Cenários:** três níveis — ilha, frente do lugar, interior. Ao longe, as cores se misturam com o céu.
- **Interface:** superfícies creme, cantos 20–28 px, botões com borda inferior que afunda, alvos de toque ≥ 64 px. O Nino aparece no cartão de fala.
- **Tipografia:** Fredoka 600/700 (títulos, botões, números) e Nunito 800 (texto). Escala 34 / 22 / 19 / 15 / 13.
- **Animação:** personagem amassa e estica; cenário em loops lentos; câmera com aceleração suave e zoom em escala logarítmica; reações ≤ 1,4 s. Tudo dirigido por um relógio só. `prefers-reduced-motion` (ou a escolha dos responsáveis) desliga viagem de câmera, paralaxe e pulos; o Nino só pisca.
- **Logotipo:** sempre **NESTOY** em maiúsculas; o "O" é o ninho com o Nino espiando (`tools/visual/ilha/logo/`). Letras em curvas (Fredoka 700). Ícone = só o símbolo; mínimo 29 px; logotipo mínimo 96 px de largura.

## 2. O ninho

Casa do Nino, no alto e ao centro da ilha, inteiro e proporcional (nunca cortado nem gigante). Cada sessão começa com o Nino acordando nele e a noite termina com ele dormindo nele. Guarda as figurinhas e o Treino de memória. Cada área com alguma parada concluída tece um fio da sua cor no ninho.

## 3. Abertura

| Situação | Comportamento |
|---|---|
| Primeira vez (`openingSeen=false`, abertura "auto") | Completa (~14 s): Nino dorme (logo no céu) → orelha, olhos, pisca duas vezes → boceja e se espreguiça → acena e diz "Oi! Eu sou o Nino." → salta do ninho e diz "Vem! Vamos explorar a ilha!" → a câmera recua do ninho até a ilha inteira (4,8 s), os lugares surgem com som → interface aparece. Tocar no Nino dormindo acorda antes. |
| Próximas aberturas | Curta (~2,5 s): Nino acordado acena ("Hello!") e a câmera recua. |
| Voltou no mesmo dia (`lastVisit` no mesmo dia local) | Direto na ilha. |
| Pular | Aparece depois de 1 s; leva ao estado final. |
| Movimento reduzido | Sem câmera: esmaecer de 0,4 s até a ilha. |
| Rever abertura | Na área dos responsáveis. |

## 4. Ilha (tela principal, rota `/`)

Lugares: Ninho (alto/centro), Árvore das Letras (alto/esquerda), Torre dos Números (alto/direita), Farol das Línguas (ponta de pedra à direita), Jardim das Cores (meio/esquerda), Lago das Descobertas (frente). Caminhos curvos ligam todos ao ninho.

**Estados no lançamento:** Farol e Ninho **prontos**; Árvore das Letras **em construção** (andaime de gravetos, lona, martelinho); Torre, Jardim e Lago **em breve** (broto + plaquinha com o ícone). Nada incompleto aparece como pronto.

**Explorar:** tocar num lugar ou no seu pino (64 px, medalhão de 46 px com o ícone e o selo do estado) aproxima a câmera, o lugar responde com som e movimento e o Nino fala. Lugar pronto: o Nino anda pelo caminho até lá e aparece o botão para entrar. Tocar no céu volta à ilha inteira. O próximo passo sugerido brilha; a criança é livre.

## 5. Ambientes internos

Entrar = a câmera mergulha na porta do lugar e sai do lado de dentro. Farol das Línguas (rota `/farol`): parede de pedra clara, janelas com mar e barquinhos, e a **escada em espiral é a trilha** — cada patamar é uma parada da unidade (Música, Lição 1–3, História, Desafio), no topo a lâmpada que acende quando a unidade termina. Os outros interiores seguem o sistema quando suas áreas existirem.

## 6. Sistema de interação

- **Acerto:** cartão pulsa com borda verde, folha de resultado sobe, Nino comemora dentro dela, efeito "correct" + elogio já gravado.
- **Quase:** cartão balança de leve, Nino inclina a cabeça e ajuda, "Opa! Vamos tentar de novo." Nunca vermelho.
- **Dica:** o comportamento atual (o certo brilha, o Nino aponta).
- **Recompensas:** estrela por parada; figurinha (borda de recorte) vai para o ninho; fio novo no ninho; o lugar cresce.
- **Farol cresce** por paradas concluídas da unidade 1: nível 1 (0) luz fraca e 2 bandeirinhas; nível 2 (≥1) luz mais forte, 4 bandeirinhas, barquinho no lago; nível 3 (≥3) 5 bandeirinhas e o feixe à noite; nível 4 (6/6) lâmpada do topo acesa de vez.
- **Volta de uma parada concluída:** a ilha abre focada no farol, mostra a mudança (se o nível subiu), o Nino volta andando ao ninho, um fio novo aparece se for o primeiro da área, e a câmera vai à ilha inteira.
- **Navegação:** ilha → lugar → trilha → atividade. O "×" volta um nível. Botão do ninho sempre no topo.
- **Sem pressão:** nada se perde por ausência, nada murcha; nenhum contador que zera, vida ou tempo.

## 7. Rotina e noite (área dos responsáveis, rota `/responsaveis`)

Portão: segurar um botão por 2 s. Preferências guardadas em `lingoo:settings:v1`:
- **Ambiente:** "Sempre dia" (padrão), "Seguir a rotina" (anoitece no horário escolhido, padrão 19:30, até 06:00), "Noite". O relógio do aparelho sozinho não decide nada.
- **Lembrete de pausa:** desligado (padrão), 15, 20 ou 30 min por sessão. O Nino se espreguiça e sugere; a criança pode continuar.
- **Abertura:** "Completa só na 1ª vez" (padrão) ou "Sempre curta". **Rever abertura.**
- **Movimento:** "Seguir o aparelho" (padrão) ou "Reduzir movimento".
- **Hora de dormir (rotina):** a ilha anoitece devagar, grilos no lugar da música, o Nino boceja, volta ao ninho, "Boa noite! Amanhã a gente brinca mais." e dorme.

## 8. Escopo deste ciclo

Construir: bíblia (tokens, fontes, grão), logotipo e ícones do app, Nino animado em todas as telas, abertura, ilha navegável com dia/noite, Farol com a unidade 1 na escada, atividades e recompensas no novo visual, transformações do farol e fios do ninho, Ninho (figurinhas + Treino de memória), área dos responsáveis (rotina, pausa, abertura, movimento). Preservar: domínio, progresso v3 e migração, exercícios, narrador e voz, músicas, Treino de memória, `/revisao`, e2e.

Fora deste ciclo: unidades 2–7 de inglês (sem vozes e arte), conteúdo das áreas novas, amigos dos ovos, relatório para responsáveis.

## 9. Arquitetura

- O mundo é **desenhado em SVG por funções puras** (portadas de `tools/visual/ilha/src/world.js` e `interior.js` para TypeScript) e montado por um **motor imperativo** (câmera com 4 camadas de profundidade via `viewBox`, linha do tempo determinística, Nino em partes) dentro de componentes React cliente. React não re-renderiza por quadro.
- O Nino é **o desenho aprovado em partes** (`tools/visual/ilha/src/nino.js`), com as mesmas formas de `src/art/Cat.tsx`.
- Preferências e "abertura vista" ficam em `lingoo:settings:v1` (o progresso v3 não muda de formato).
- Novas falas entram no pipeline existente (`content/lines.json`, arquivos `public/audio/{id}.mp3` pela mesma voz).
