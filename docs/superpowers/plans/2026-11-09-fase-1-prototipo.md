# Lingoo — Fase 1 (Protótipo da área da criança) — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uma criança abre o app no tablet, toca para começar, vê o mapa da Floresta, faz a lição-protótipo completa (música → história → 3 jogos → figurinha) e vê a figurinha no álbum, sem login e sem pagamento.

**Architecture:** Next.js (App Router) só com front-end nesta fase. O conteúdo é JSON validado com zod (`content/`), e o progresso fica no aparelho atrás de uma interface `ProgressStore`, que na Fase 2 ganha uma implementação Supabase. Toda regra (jogos, sequência da lição, desbloqueio) mora em funções puras em `src/domain/`, testadas com Vitest. Os componentes React só desenham e repassam eventos.

**Tech Stack:** Next.js 16 + React 19 + TypeScript (strict), Tailwind CSS v4, zod, Vitest + Testing Library + jsdom, Playwright (smoke e2e), `next/font/google` (Baloo 2, Nunito).

**Spec:** `docs/superpowers/specs/2026-11-09-app-ingles-infantil-design.md`

## Global Constraints

- Público: crianças de 5 a 8 anos em tablet/celular; quase nenhum texto na tela da criança (som e imagem bastam).
- Alvos de toque com no mínimo **64×64 px** (botões grandes para dedos pequenos).
- Nunca mostrar "errado"; no erro, o mascote repete com carinho e a criança tenta de novo.
- Sem anúncios, sem links para fora do app, sem rastreadores.
- O áudio só toca depois do primeiro toque da criança.
- Faltar um dia não perde nada; o progresso fica salvo.
- Paleta: amarelo-sol `#FFC93C`, azul-céu `#4AA8F0`, verde-folha `#5CC46B`, coral `#FF7A6B`, creme `#FFF8EC`, azul-marinho `#2B2D42` (textos), mais o laranja do mascote `#FF9F43` (provisório).
- Tipografia: Baloo 2 nos títulos, Nunito nos textos.
- Cantos arredondados, traço suave.
- Resultado de jogo: `"acerto" | "erro" | "concluido"`.
- Código, nomes de arquivo e identificadores em inglês; textos de interface e conteúdo de produto em português ou inglês, conforme o caso.

## Decisões desta fase (tomadas no plano, revisáveis)

- **Lição-protótipo = "Animais da floresta"** (lição 2 da especificação), porque é a mais visual e funciona bem com os três jogos. No protótipo ela ocupa o **primeiro lugar** do mapa. As outras 5 lições da Floresta aparecem com cadeado e o estado "em breve" (`hasContent: false`).
- Vocabulário provisório, sujeito à revisão da Giulia: **bear, fox, owl, rabbit, frog**.
- **Mídia provisória:** áudio e imagens geradas por IA ainda não existem. Cada `Media` tem `text` obrigatório e `src` opcional. Sem `src`, o texto é falado com `speechSynthesis` (`en-US`, velocidade 0.85). As imagens são SVGs simples de placeholder em `public/content/`.
- **Progresso** fica em `localStorage`, com fallback em memória se o storage falhar. Não há perfil nem login nesta fase.
- **PWA nesta fase:** só o manifesto e o ícone, para instalar no tablet de teste. Service worker e cache ficam para depois, porque não ajudam a validar o protótipo.
- **Arrastar** usa Pointer Events, não o drag-and-drop do HTML5, que não funciona com toque.

## Review Focus

1. **Toques rápidos ou duplos durante o feedback** (criança toca 3 vezes seguidas): o jogo não pode contar dois acertos nem pular duas etapas. Coberto na Task 3 (tap travado enquanto `locked`) e na Task 4 (evento `stepDone` com `stepId` velho é ignorado).
2. **`localStorage` indisponível ou corrompido** (aba anônima no Safari, JSON inválido): o app abre e funciona, só não lembra o progresso. Coberto na Task 5.
3. **Arrastar com o dedo e soltar fora de qualquer alvo:** a palavra volta ao lugar, sem contar erro. Coberto na Task 3 (`drop` com `targetId: null`) e na Task 7.
4. **Navegador sem `speechSynthesis` ou sem voz em inglês, ou áudio bloqueado:** a lição continua (o botão de avançar aparece) e nada trava esperando um `onend` que nunca chega. Coberto na Task 6 (timeout de segurança).
5. **Conteúdo que aponta para imagem inexistente ou tem `answerId` fora das opções:** é pego no teste do conteúdo, não na mão da criança. Coberto na Task 2.

---

## File Structure

```
content/
  worlds.json                  # mundos e lugares do mapa (ordem, título, lessonId, hasContent)
  lessons/forest-animals.json  # lição-protótipo
public/content/forest-animals/*.svg   # placeholders
public/manifest.webmanifest, public/icon.svg
src/
  domain/
    content-schema.ts   # zod schemas + tipos inferidos
    content.ts          # getWorlds(), getLesson(id) — lê e valida JSON
    games/tap.ts        # lógica de "tocar na figura"
    games/drag.ts       # lógica de "arrastar palavra"
    games/repeat.ts     # lógica de "ouvir e repetir"
    lesson-engine.ts    # sequência de etapas da lição
    progress.ts         # tipo Progress, ProgressStore, unlock
    progress-local.ts   # implementação localStorage + memória
  audio/narrator.ts     # unlock, play(media), stop()
  components/
    Mascot.tsx
    BigButton.tsx
    games/TapGame.tsx, DragGame.tsx, RepeatGame.tsx
    lesson/SongStep.tsx, StoryStep.tsx, StickerStep.tsx, LessonPlayer.tsx
    map/WorldMap.tsx
    ProgressProvider.tsx  # contexto React com o ProgressStore
  app/
    layout.tsx, globals.css
    page.tsx                  # tela "toque para começar"
    mapa/page.tsx
    licao/[lessonId]/page.tsx
    album/page.tsx
tests/                  # espelha src/ (unit + componente)
e2e/smoke.spec.ts
```

---

### Task 1: Projeto base, ferramentas e tema

**Files:**
- Create: projeto via `create-next-app`, `vitest.config.ts`, `tests/setup.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/components/BigButton.tsx`
- Test: `tests/components/BigButton.test.tsx`

**Interfaces:**
- Produces: `BigButton({ onPress, label, children, color? }: { onPress: () => void; label: string; children: React.ReactNode; color?: "sun" | "sky" | "leaf" | "coral" })`. `label` vira `aria-label`, porque a criança não lê. Tokens CSS `--color-sun`, `--color-sky`, `--color-leaf`, `--color-coral`, `--color-cream`, `--color-ink`, `--color-cat` disponíveis como utilitários Tailwind (`bg-sun` etc.). Classes de fonte `font-display` (Baloo 2) e `font-body` (Nunito).

- [ ] **Step 1:** `npx create-next-app@16 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes` em `/home/user/lingoo` (preservando `docs/`). Instalar `zod`. Instalar como dev: `vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @playwright/test`. Scripts: `"test": "vitest run"`, `"e2e": "playwright test"`.
- [ ] **Step 2:** `vitest.config.ts` com ambiente `jsdom`, alias `@` → `src`, setup `tests/setup.ts` (importa `@testing-library/jest-dom/vitest`) e `include: ["tests/**/*.test.{ts,tsx}"]`.
- [ ] **Step 3: Teste que falha.** Em `BigButton.test.tsx`: renderiza com `label="Começar"`; espera `getByRole("button", { name: "Começar" })`; o clique chama `onPress` 1 vez; o botão tem a classe `min-h-16` e `min-w-16` (64 px).
- [ ] **Step 4:** `npm test`. Esperado: FAIL (módulo não existe).
- [ ] **Step 5:** Implementar `BigButton`, os tokens da paleta em `globals.css` (`@theme`) e as fontes em `layout.tsx` (`lang="pt-BR"`, `body` com `bg-cream text-ink font-body`, viewport sem zoom por gesto, `user-select: none` e `touch-action: manipulation` no body).
- [ ] **Step 6:** `npm test && npm run build`. Esperado: PASS e build sem erros.
- [ ] **Step 7:** Commit `chore: scaffold Next.js app with theme and test tooling`.

### Task 2: Esquema de conteúdo e lição-protótipo

**Files:**
- Create: `src/domain/content-schema.ts`, `src/domain/content.ts`, `content/worlds.json`, `content/lessons/forest-animals.json`, `public/content/forest-animals/{bear,fox,owl,rabbit,frog,forest,sticker-fox}.svg`
- Test: `tests/domain/content.test.ts`

**Interfaces:**
- Produces (tipos inferidos dos schemas zod):
  ```ts
  type Media = { text: string; src?: string };          // src = arquivo de áudio
  type Card = { id: string; word: string; image: string; audio: Media };
  type Step =
    | { kind: "song"; id: string; image: string; audio: Media }
    | { kind: "story"; id: string; pages: { image: string; narration: Media }[] }
    | { kind: "tap"; id: string; rounds: { prompt: Media; optionIds: string[]; answerId: string }[] }
    | { kind: "drag"; id: string; cardIds: string[] }
    | { kind: "repeat"; id: string; cardIds: string[] }
    | { kind: "sticker"; id: string; stickerId: string; image: string };
  type Lesson = { id: string; title: string; cards: Card[]; steps: Step[] };
  type Place = { lessonId: string; title: string; hasContent: boolean };
  type World = { id: string; title: string; places: Place[] };
  ```
  `parseLesson(data: unknown): Lesson` e `parseWorlds(data: unknown): World[]`, que lançam erro se o conteúdo for inválido. `getWorlds(): World[]` e `getLesson(id: string): Lesson | null`, que importam o JSON estaticamente (um mapa `id → json`).
- Regras extras de validação (`superRefine`): todo `answerId` está em `optionIds`; todo `optionIds`/`cardIds` existe em `cards`; a lição termina com exatamente 1 etapa `sticker`; os `id` das etapas são únicos.

- [ ] **Step 1: Testes que falham.**
  - `getLesson("forest-animals")` retorna uma lição com as etapas na ordem `["song","story","tap","drag","repeat","sticker"]` e com os 5 cards `bear, fox, owl, rabbit, frog`.
  - `getLesson("nao-existe")` retorna `null`.
  - `getWorlds()[0].places` tem 6 lugares; só `places[0]` (`forest-animals`) tem `hasContent: true`.
  - `parseLesson` lança erro quando um `answerId` não está em `optionIds`, quando um `cardIds` cita um card inexistente e quando não há etapa `sticker`.
  - **Review Focus 5:** todo caminho de imagem da lição (`card.image`, `step.image`, `page.image`) existe em `public/` (`fs.existsSync(path.join("public", img))`).
- [ ] **Step 2:** `npm test -- content`. Esperado: FAIL.
- [ ] **Step 3:** Implementar os schemas, `content.ts` e os JSONs. A música (`song.audio.text`) é uma letra curta e repetitiva, por exemplo: "Bear, fox, owl! Rabbit and frog! Animals, animals, in the forest!". A história tem 3 ou 4 páginas com frases curtas usando as 5 palavras. O tap tem 3 rodadas de 3 opções cada, com prompt do tipo "Where is the fox?". Os SVGs são placeholders: círculo colorido com a primeira letra da palavra e um emoji do animal, 256×256. Os títulos dos lugares 2 a 6 vêm da seção 7 da especificação (Hello e My name is, Animais de estimação e da fazenda, Cores, Mais cores, Números de 1 a 10).
- [ ] **Step 4:** `npm test -- content`. Esperado: PASS.
- [ ] **Step 5:** Commit `feat: content schema and prototype lesson data`.

### Task 3: Lógica dos três jogos

**Files:**
- Create: `src/domain/games/tap.ts`, `src/domain/games/drag.ts`, `src/domain/games/repeat.ts`, `src/domain/games/types.ts`
- Test: `tests/domain/games/{tap,drag,repeat}.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // types.ts
  type GameResult = "acerto" | "erro" | "concluido";

  // tap.ts
  type TapState = { round: number; locked: boolean; finished: boolean };
  createTap(): TapState
  tapOption(step: TapStep, s: TapState, optionId: string): { state: TapState; result: GameResult | null }
    // acerto → locked=true; erro → continua na mesma rodada; locked → result null (ignora)
  releaseTap(step: TapStep, s: TapState): TapState
    // depois da comemoração: destrava e avança a rodada; após a última, finished=true

  // drag.ts
  type DragState = { matched: string[]; finished: boolean };
  createDrag(): DragState
  drop(step: DragStep, s: DragState, cardId: string, targetId: string | null): { state: DragState; result: GameResult | null }
    // targetId null → result null (volta ao lugar); igual → acerto; diferente → erro; card já casado → null
    // finished quando matched.length === step.cardIds.length

  // repeat.ts
  type RepeatState = { index: number; finished: boolean };
  createRepeat(): RepeatState
  nextRepeat(step: RepeatStep, s: RepeatState): { state: RepeatState; result: GameResult }
    // sempre "concluido"; finished após o último card
  ```
  (`TapStep`, `DragStep` e `RepeatStep` são `Extract<Step, { kind: ... }>`.)

- [ ] **Step 1: Testes que falham** (usar a etapa real de `getLesson("forest-animals")`):
  - tap: a opção certa retorna `acerto` e `locked: true`; a errada retorna `erro`, mantém `round` e não trava; **Review Focus 1:** um `tapOption` com `locked: true` retorna `{ result: null }` e não muda o estado; `releaseTap` na última rodada deixa `finished: true`.
  - drag: soltar no alvo igual retorna `acerto`; num alvo diferente, `erro`; **Review Focus 3:** `targetId: null` retorna `null`, sem mudança; soltar de novo um card já casado retorna `null`; depois dos 5 acertos, `finished: true`.
  - repeat: avança `index`, sempre `concluido`, e fica `finished` após 5 chamadas.
- [ ] **Step 2:** `npm test -- games`. Esperado: FAIL.
- [ ] **Step 3:** Implementar as funções puras, sem mutar o estado recebido.
- [ ] **Step 4:** `npm test -- games`. Esperado: PASS.
- [ ] **Step 5:** Commit `feat: pure game logic for tap, drag and repeat`.

### Task 4: Motor da lição

**Files:**
- Create: `src/domain/lesson-engine.ts`
- Test: `tests/domain/lesson-engine.test.ts`

**Interfaces:**
- Consumes: `Lesson`, `Step` (Task 2).
- Produces:
  ```ts
  type LessonState = { lessonId: string; stepIndex: number; finished: boolean; stickerId: string | null };
  type LessonEvent = { type: "stepDone"; stepId: string };
  startLesson(lesson: Lesson): LessonState
  lessonReducer(lesson: Lesson, s: LessonState, e: LessonEvent): LessonState
  currentStep(lesson: Lesson, s: LessonState): Step | null
  ```
  Ao concluir a etapa `sticker`: `finished: true` e `stickerId` preenchido.

- [ ] **Step 1: Testes que falham:** começa em `stepIndex: 0`; `stepDone` com o `stepId` atual avança 1; **Review Focus 1:** `stepDone` com um `stepId` que não é o atual (evento duplicado ou atrasado) não muda o estado; depois da última etapa, `finished: true`, `stickerId: "sticker-fox"` e `currentStep` retorna `null`; um evento depois de `finished` não muda nada.
- [ ] **Step 2:** `npm test -- lesson-engine`. Esperado: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test -- lesson-engine`. Esperado: PASS.
- [ ] **Step 5:** Commit `feat: lesson engine sequencing steps`.

### Task 5: Progresso e desbloqueio do mapa

**Files:**
- Create: `src/domain/progress.ts`, `src/domain/progress-local.ts`, `src/components/ProgressProvider.tsx`
- Test: `tests/domain/progress.test.ts`, `tests/domain/progress-local.test.ts`

**Interfaces:**
- Consumes: `World`, `Place` (Task 2).
- Produces:
  ```ts
  type Progress = { completedLessons: Record<string, string>; stickers: Record<string, string> }; // id → data ISO
  interface ProgressStore { load(): Progress; save(p: Progress): void }
  emptyProgress(): Progress
  completeLesson(p: Progress, lessonId: string, stickerId: string, now: Date): Progress  // idempotente: mantém a 1ª data
  placeStatus(world: World, p: Progress, lessonId: string): "done" | "open" | "locked" | "soon"
    // soon = !hasContent; o 1º lugar com conteúdo começa open;
    // um lugar fica open quando o lugar anterior COM conteúdo está done
  createLocalProgressStore(storage?: Storage | null): ProgressStore  // chave "lingoo:progress:v1"
  // ProgressProvider: contexto com { progress, finishLesson(lessonId, stickerId) } e hook useProgress()
  ```
- [ ] **Step 1: Testes que falham:**
  - `placeStatus`: progresso vazio → `forest-animals` está `open` e os outros, `soon`. Depois de `completeLesson`, `forest-animals` fica `done`. Teste com um mundo fictício de 3 lugares com conteúdo: o 2º só abre quando o 1º está `done`.
  - `completeLesson` chamado duas vezes mantém a data da primeira vez.
  - local: `save` seguido de `load` devolve o mesmo progresso; **Review Focus 2:** um JSON corrompido na chave devolve `emptyProgress()`; um storage cujo `getItem`/`setItem` lança erro (ou `storage = null`) não lança e mantém o progresso em memória durante a sessão.
- [ ] **Step 2:** `npm test -- progress`. Esperado: FAIL.
- [ ] **Step 3:** Implementar. O `ProgressProvider` é `"use client"`, cria o store em `useEffect` (o `localStorage` não existe no servidor) e guarda o progresso em `useState`.
- [ ] **Step 4:** `npm test -- progress`. Esperado: PASS.
- [ ] **Step 5:** Commit `feat: progress store and map unlock rules`.

### Task 6: Narrador (áudio)

**Files:**
- Create: `src/audio/narrator.ts`
- Test: `tests/audio/narrator.test.ts`

**Interfaces:**
- Consumes: `Media` (Task 2).
- Produces:
  ```ts
  createNarrator(deps?: { speech?: SpeechSynthesis | null; createAudio?: (src: string) => HTMLAudioElement; timeoutMs?: number }): Narrator
  interface Narrator {
    unlock(): void;                 // chamado no 1º toque; antes disso play() resolve sem tocar
    play(media: Media): Promise<void>; // para o que estiver tocando; src → <audio>; senão → TTS en-US, rate 0.85
    stop(): void;
    isUnlocked(): boolean;
  }
  narrator: Narrator  // instância única para o app
  ```
  `play` sempre resolve, ao terminar, dar erro ou estourar o timeout de segurança (padrão: `max(4000, 400 * nº de palavras)` ms). Nunca rejeita.
- [ ] **Step 1: Testes que falham** (com dublês de `speech` e `createAudio`):
  - antes de `unlock()`, `play` resolve e não chama `speak`;
  - com `src`, cria o áudio e chama `play()`; sem `src`, chama `speech.speak` com `lang "en-US"` e `rate 0.85`;
  - um novo `play` chama `stop` no anterior (`speech.cancel` ou `audio.pause`);
  - **Review Focus 4:** com `speech: null` e sem `src`, resolve; se o `onend` nunca dispara, resolve no timeout (usar `vi.useFakeTimers`); se o `audio.play()` rejeita (bloqueio de autoplay), resolve.
- [ ] **Step 2:** `npm test -- narrator`. Esperado: FAIL.
- [ ] **Step 3:** Implementar. Escolher uma voz `en-*` de `getVoices()` se houver; se não houver, só definir `lang`.
- [ ] **Step 4:** `npm test -- narrator`. Esperado: PASS.
- [ ] **Step 5:** Commit `feat: narrator with audio file and speech fallback`.

### Task 7: Mascote e componentes dos jogos

**Files:**
- Create: `src/components/Mascot.tsx`, `src/components/games/TapGame.tsx`, `src/components/games/DragGame.tsx`, `src/components/games/RepeatGame.tsx`
- Test: `tests/components/games/{TapGame,DragGame,RepeatGame}.test.tsx`

**Interfaces:**
- Consumes: as funções da Task 3, `narrator` (Task 6), `Card`, `Lesson` (Task 2).
- Produces:
  ```ts
  type Mood = "idle" | "talking" | "happy" | "encourage";
  Mascot({ mood }: { mood: Mood })      // gatinho laranja em SVG inline, original; animação CSS por mood
  TapGame({ step, cards, onDone }: { step: TapStep; cards: Card[]; onDone: () => void })
  DragGame({ step, cards, onDone }: { step: DragStep; cards: Card[]; onDone: () => void })
  RepeatGame({ step, cards, onDone }: { step: RepeatStep; cards: Card[]; onDone: () => void })
  ```
  Comportamento comum: ao montar, toca o prompt (ou a palavra). No `acerto`, mascote `happy` + som de comemoração (narra "Great job!"), espera de ~1200 ms e depois `releaseTap`/avança. No `erro`, mascote `encourage`, narra "Let's try again!" e repete o prompt. Nunca aparece a palavra "errado". Cada opção é um botão de imagem de no mínimo 120×120 px, com `aria-label` igual à palavra. `onDone` é chamado uma única vez.
  DragGame: as palavras ficam embaixo (botão com a palavra; tocar fala a palavra) e as imagens em cima, como alvos `data-drop-target={card.id}`. O arraste usa `onPointerDown/Move/Up` com `setPointerCapture`; no `pointerup`, `document.elementFromPoint` encontra o alvo pelo `data-drop-target`. As imagens ficam com `touch-action: none`.
  RepeatGame: mostra a imagem grande, narra a palavra, o mascote faz "sua vez" (animação de ouvido) e, depois de ~2500 ms, aparece um botão grande de seta para avançar. Não há avaliação.
- [ ] **Step 1: Testes que falham** (`narrator` mockado com `vi.mock`, cujo `play` resolve na hora; usar fake timers):
  - TapGame: clicar na opção certa das 3 rodadas chama `onDone` 1 vez; clicar na errada não avança e o mascote recebe `encourage` (verificar `data-mood="encourage"`); **Review Focus 1:** 3 cliques rápidos na opção certa da rodada 1 avançam só uma rodada.
  - DragGame: simular `pointerDown` na palavra "fox" e `pointerUp` com `elementFromPoint` mockado retornando o alvo `fox` → a palavra fica casada; **Review Focus 3:** `pointerUp` com `elementFromPoint` retornando `document.body` → a palavra continua disponível e o mascote não fica `encourage`; casar as 5 chama `onDone`.
  - RepeatGame: o botão de avançar aparece após o timer; 5 avanços chamam `onDone` 1 vez.
- [ ] **Step 2:** `npm test -- components/games`. Esperado: FAIL.
- [ ] **Step 3:** Implementar. O desenho do mascote segue a especificação: original, gatinho laranja (`--color-cat`), sem lembrar Garfield ou o Gato de Botas. Formas redondas simples: cabeça grande, olhos grandes, sem listras marcantes.
- [ ] **Step 4:** `npm test -- components/games`. Esperado: PASS.
- [ ] **Step 5:** Commit `feat: mascot and game components`.

### Task 8: Player da lição (música, história, figurinha)

**Files:**
- Create: `src/components/lesson/SongStep.tsx`, `StoryStep.tsx`, `StickerStep.tsx`, `LessonPlayer.tsx`, `src/app/licao/[lessonId]/page.tsx`
- Test: `tests/components/lesson/LessonPlayer.test.tsx`

**Interfaces:**
- Consumes: `lessonReducer`, `startLesson`, `currentStep` (Task 4); componentes dos jogos (Task 7); `useProgress().finishLesson` (Task 5); `getLesson` (Task 2).
- Produces: `LessonPlayer({ lesson, onExit }: { lesson: Lesson; onExit: () => void })`. Cada etapa recebe `onDone`, e o player despacha `{ type: "stepDone", stepId }`. Ao `finished`, chama `finishLesson(lesson.id, stickerId)` uma única vez e mostra um botão grande "voltar ao mapa" (ícone de casa, `aria-label="Voltar ao mapa"`).
  SongStep: imagem do tema + mascote `talking` + narra `audio`; o botão de seguir aparece quando o `play` resolve. StoryStep: uma página por vez, imagem grande + narração; avança por botão de seta que aparece ao fim da narração; um botão de repetir (ícone) narra de novo. StickerStep: figurinha aparece com animação de "pop" + mascote `happy` + narra "You got a sticker!".
  Barra superior: botão de casa (sai para o mapa) e indicador de progresso em bolinhas, uma por etapa, sem texto.
  A página `licao/[lessonId]` usa `getLesson`; se for `null` ou se `placeStatus` for `locked`/`soon`, redireciona para `/mapa`.
- [ ] **Step 1: Testes que falham** (jogos e narrador mockados; os jogos mockados expõem um botão "fake-done" que chama `onDone`): passar pelas 6 etapas chama `finishLesson("forest-animals","sticker-fox")` exatamente 1 vez; o indicador mostra 6 bolinhas, com a atual marcada (`aria-current="step"`); o botão de casa chama `onExit`.
- [ ] **Step 2:** `npm test -- LessonPlayer`. Esperado: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test -- LessonPlayer`. Esperado: PASS.
- [ ] **Step 5:** Commit `feat: lesson player with song, story and sticker steps`.

### Task 9: Tela inicial, mapa e álbum

**Files:**
- Create: `src/app/page.tsx`, `src/app/mapa/page.tsx`, `src/components/map/WorldMap.tsx`, `src/app/album/page.tsx`
- Modify: `src/app/layout.tsx` (envolver com `ProgressProvider`)
- Test: `tests/components/map/WorldMap.test.tsx`

**Interfaces:**
- Consumes: `getWorlds` (Task 2), `placeStatus`, `useProgress` (Task 5), `narrator.unlock` (Task 6), `Mascot` (Task 7).
- Produces: `WorldMap({ world, progress, onOpen }: { world: World; progress: Progress; onOpen: (lessonId: string) => void })`.
  Tela inicial: fundo com o mascote e um único botão grande ▶ (`aria-label="Começar"`); o toque chama `narrator.unlock()`, narra "Hello! Let's play!" e vai para `/mapa`. Se a criança abrir `/mapa` direto sem desbloquear, o primeiro toque em qualquer lugar chama `unlock()`.
  Mapa: um caminho sinuoso em SVG com os 6 lugares em sequência. `open` = lugar pulsando com o mascote ao lado; `done` = estrela; `locked`/`soon` = cadeado, e o toque só faz o lugar balançar, sem navegar. Botão do álbum (ícone de livro, `aria-label="Álbum"`) num canto.
  Álbum: uma grade com um espaço para cada figurinha que existe no conteúdo; as ganhas aparecem coloridas e as que faltam, como silhueta cinza. Tocar numa figurinha ganha narra o nome. Botão de voltar.
- [ ] **Step 1: Testes que falham:** com progresso vazio, o lugar 1 é um botão habilitado (`aria-label="Animais da floresta"`) e tocar nele chama `onOpen("forest-animals")`; os lugares 2 a 6 têm `aria-disabled="true"` e tocar neles não chama `onOpen`; com `forest-animals` concluído, o lugar 1 mostra a estrela (`data-status="done"`).
- [ ] **Step 2:** `npm test -- WorldMap`. Esperado: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test && npm run build`. Esperado: tudo PASS, build ok.
- [ ] **Step 5:** Commit `feat: start screen, world map and sticker album`.

### Task 10: Manifesto PWA e teste ponta a ponta

**Files:**
- Create: `public/manifest.webmanifest`, `public/icon.svg`, `playwright.config.ts`, `e2e/smoke.spec.ts`
- Modify: `src/app/layout.tsx` (link do manifesto, `themeColor` `#5CC46B`)

**Interfaces:**
- Consumes: todas as telas.
- Produces: manifesto com `name: "Lingoo"`, `display: "fullscreen"`, `orientation: "landscape"`, `background_color: "#FFF8EC"`, `theme_color: "#5CC46B"` e o ícone da lagartinha verde (SVG original simples: 4 a 5 círculos verde-folha em arco e cabeça também verde, com olhos; **sem cabeça vermelha**).
- [ ] **Step 1: Teste e2e** (`playwright.config.ts` com `webServer: npm run build && npm start`, projeto `devices["iPad (gen 7) landscape"]` com `browserName: "chromium"`, `trace: "off"`):
  - Abrir `/`, tocar em "Começar", chegar em `/mapa`, tocar em "Animais da floresta" e atravessar a lição inteira (esperar e tocar os botões de avançar; nos jogos, tocar nas opções certas pelo `aria-label`; no drag, arrastar com `page.mouse` de cada palavra até o alvo). Ao fim, tocar "Voltar ao mapa" → o lugar 1 tem `data-status="done"` → abrir o "Álbum" → a figurinha da raposa está colorida.
  - Recarregar a página → o progresso continua salvo.
  - Para o teste não depender de voz: injetar `window.speechSynthesis = undefined` via `addInitScript` (assim também exercita o Review Focus 4 de verdade).
- [ ] **Step 2:** `npm run e2e -- --trace off`. Esperado: PASS. Se falhar, corrigir o componente, não o teste.
- [ ] **Step 3:** Commit `feat: PWA manifest and end-to-end smoke test`.

---

## Fora desta fase

Login, perfis, área dos pais, pergunta de adulto, Supabase, webhook, assinatura, e-mails, service worker/cache offline e as outras 11 lições. Tudo isso fica para as Fases 2 e 3.
