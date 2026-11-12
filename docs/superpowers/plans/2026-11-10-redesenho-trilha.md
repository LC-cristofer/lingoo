# Lingoo: implementation plan for the path and lesson redesign

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Unit 1, "Animais da floresta", from end to end. It has 6 stops: 🎵 music, three ⭐ lessons, 📖 a story and 🏆 a challenge. Everything uses its own vector art, the Chatterbox gatinho voice, a chant, sound effects, an illustrated map, a calendar of days and a sticker album. This replaces the Phase 1 child experience.

**Architecture:**
- Content lives in JSON validated with zod: path → units → stops → exercises, and every line of speech is a `Narration` made of segments tagged with a language.
- The rules are pure functions under `src/domain/trail/`, the same way as in Phase 1.
- The audio is generated offline by scripts in `tools/audio/` (Chatterbox, faster-whisper for checking, sound synthesized with numpy). It is saved in `public/audio/{id}.mp3`, and the `id` is derived from the segment's text and language.
- The art is SVG drawn as React components in `src/art/`.

**Tech Stack:** Next.js 16 + React 19 + TS strict, Tailwind v4, zod, Vitest + Testing Library, Playwright. For the tools: Python 3.11 with chatterbox-tts 0.1.7 + torch 2.6.0 (CPU), faster-whisper, numpy, ffmpeg, and `tsx` to run TS scripts.

**Spec:** `docs/superpowers/specs/2026-11-09-redesenho-trilha-design.md` (it extends `2026-11-09-app-ingles-infantil-design.md`). The approved samples, which set the quality bar for art and voice, are in `docs/arte/amostras-aprovadas/`.

## Global Constraints

- Audience: children aged 5 to 8 on tablet and phone. On-screen text is short and **always narrated**.
- **Instructions are in Portuguese (`pt-BR`). Words, target phrases and praise are in English (`en-US`).** English text shows on screen highlighted, with `lang="en"`.
- Feedback never says the child is wrong:
  - correct answer: green strip with a praise line;
  - wrong answer: **orange** strip (never red) with "Opa! Vamos tentar de novo.";
  - 2nd wrong answer: the right card **glows** (hint).
  
  The "Certo ou errado?" exercise is a question, not feedback, so it may use those words.
- An exercise answered wrong comes back **once** at the end of the stop. The child never "loses".
- No lives and no counters that reset. A finished stop gets ⭐, and the challenge opens a chest with a sticker.
- Touch targets are at least **64×64 px**, and exercise cards are at least **120×120 px**.
- Palette: sun yellow `#FFC93C`, sky blue `#4AA8F0`, leaf green `#5CC46B`, coral `#FF7A6B`, cream `#FFF8EC`, navy `#2B2D42` (text), gatinho `#FF9F43` (dark `#EE8226`, light `#FFF1DE`).
- Fonts: Baloo 2 for headings and Nunito for body text.
- Art style: flat, rounded vector, as in `docs/arte/amostras-aprovadas/arte-fonte.html`. The cards **never** carry a letter or word that gives the answer away before it is asked.
- Gatinho voice: Chatterbox Multilingual, built-in voice (no `audio_prompt_path`), `exaggeration=0.6`, `cfg_weight=0.4`, `temperature=0.7`, seed `42`, normalised with `loudnorm=I=-16:TP=-1.5`, 128 kbps MP3. `language_id` is `"pt"` for `pt-BR` and `"en"` for `en-US`.
- If a segment's audio fails, the app falls back to the browser voice for that segment and never gets stuck.
- Audio only starts after the first touch, as in Phase 1 (`narrator.unlock`, the global `AudioUnlock`).
- Original content only: no copying of songs, stories or drawings by others.
- Code, identifiers and file names are in English. Child-facing copy is pt-BR/en-US as specified.
- Commits follow the repository's existing format and attribution.

## Changes approved on 2026-11-12 (they override earlier text where they differ)

- **Execution order from here:** Task 11 (done) → **Task 15** (visual kit) → Task 12 → Task 13 → **Task 16** (memory training) → Task 14 → final review.
- **Approved look:** the pictures in `docs/arte/telas-aprovadas/` and their source `tools/visual/mockups.tsx` (markup and CSS) are the visual reference for every screen. Background version A (illustrated forest). No screen has a cream or white full-page background.
- **Two form factors, equally:** phone portrait (reference 390×844) first, tablet landscape (reference 1024×768) adapted. Phone landscape and tablet portrait must work without breaking (no clipped controls, no horizontal page scroll) but are not polished.
- **Pressable style:** buttons, answer tiles and stops have a flat darker "edge" under them (`box-shadow: 0 Npx 0 <darker colour>`), never a blurred grey shadow. The main action of a screen is always the sun-yellow button.
- **Feedback sheet:** correct = deep green `#2F9E5B` with white text and the yellow "Continuar" button; retry and hint = orange `#FFA94D` with navy text. Never red.
- **Bottom navigation:** three tabs, in this order: Trilha, Memória, Álbum.
- **Review Focus 5 changes to:** phone portrait (390×844) and tablet landscape (1024×768): the map, an exercise with 4 tiles and the story fit with no horizontal scrolling, every button is at least 64 px and every answer tile at least 120 px.

## Review Focus

1. **An audio file is missing or fails mid-sequence** (404, bad decode). The narration should carry on with the browser voice for that segment and then the next one, with no gap of several seconds. Tested in Task 4.
2. **The child taps fast or taps during the feedback** (double tap, tapping another card while the green strip shows). It should count once, and nothing happens until "Continuar". Tested in Tasks 7 and 10.
3. **2nd wrong answer in multi-part exercises** (Ligar pares, O que sumiu?). The hint should show the right pair or card, and the exercise should go to review at the end, just once. Tested in Task 7.
4. **Leaving in the middle of a stop and coming back.** The stop should restart from the beginning with no partial credit, and the day should still be marked on the calendar. Tested in Tasks 8 and 11.
5. **Phone held upright (390×844) and phone on its side (844×390).** The map, the exercise with 4 cards and the story should fit with no horizontal scrolling and with buttons at least 64 px. Tested in Task 14 (e2e with screenshots and size checks).

---

## File structure (end state)

```
content/
  path.json                       # worlds and units (order, title, icon, unitId, hasContent)
  units/forest-animals.json       # Unit 1: words + 6 stops + exercises + narration
  lines.json                      # app-wide lines (praise, retry, hint, map, chest, start screen)
src/domain/trail/
  schema.ts        # zod + types: Segment, Narration, Word, Exercise, Stop, Unit, Path, Lines
  content.ts       # getPath(), getUnit(id), getStop(stopId), getLines(), allNarrations()
  audio-id.ts      # segmentId(seg) → stable hex; audioSrc(seg)
  session.ts       # queue of exercises with retry → hint → review at the end
  exercises.ts     # pure logic: matchPairs, whatsMissing, tapRepeat
  progress.ts      # Progress v2, completeStop, markDay, stopStatus, unitStatus
src/audio/narrator.ts             # + playNarration(n) in sequence, voice fallback by language
src/art/
  Cat.tsx  animals/{Bear,Bird,Frog,Snake,Spider,Mouse}.tsx  Animal.tsx
  scenes/{ForestBackdrop,StoryScene,Chest,Sticker}.tsx  StopIcon.tsx
src/components/trail/
  NarrationText.tsx ProgressBar.tsx FeedbackBanner.tsx ExerciseShell.tsx
  exercises/{Intro,ListenTap,TapRepeat,TrueFalse,MatchPairs,WhatsMissing}.tsx  ExerciseView.tsx
  StopPlayer.tsx  SongStop.tsx  StoryStop.tsx  ChestReward.tsx
  TrailMap.tsx  DaysCalendar.tsx  ProgressProviderV2 → src/components/ProgressProvider.tsx (replaced)
src/app/{page,mapa/page,parada/[stopId]/page,album/page}.tsx
tools/audio/{extract-lines.ts, generate.py, verify.py, sfx.py, chant.py, requirements.txt, README.md}
tools/visual/{art-sheet.tsx, shots.cjs}
public/audio/*.mp3  public/audio/sfx/*.mp3  public/audio/song-forest-animals.mp3
docs/arte/guia-de-estilo.md  docs/arte/folha-de-personagens.png
```

In Task 13 the Phase 1 child experience is removed: `content/lessons`, `content/worlds.json`, `src/domain/{content-schema,content,lesson-engine,games/*}.ts`, `src/components/{games,lesson,map}/*`, `src/app/licao/*` and their tests.

---

### Task 1: Content schema v2 and the Unit 1 script

**Files:**
- Create: `src/domain/trail/schema.ts`, `src/domain/trail/content.ts`, `content/path.json`, `content/units/forest-animals.json`, `content/lines.json`
- Test: `tests/domain/trail/content.test.ts`

**Interfaces:**
- Produces (types inferred from zod):
  ```ts
  type Lang = "pt-BR" | "en-US";
  type Segment = { lang: Lang; text: string };           // text.trim().length > 0
  type Narration = Segment[];                              // length ≥ 1
  type ArtId = "bear" | "bird" | "frog" | "snake" | "spider" | "mouse";
  type Word = { id: ArtId; en: string; pt: string; say: Narration }; // say = the word itself in en-US
  type Exercise =
    | { kind: "intro"; wordId: ArtId; say: Narration }
    | { kind: "listenTap"; prompt: Narration; optionIds: ArtId[]; answerId: ArtId }            // 2–4 options
    | { kind: "tapRepeat"; prompt: Narration; items: { wordId: ArtId; say: Narration }[] }      // 3–6 items
    | { kind: "trueFalse"; wordId: ArtId; say: Narration; isTrue: boolean }
    | { kind: "matchPairs"; prompt: Narration; wordIds: ArtId[] }                               // 3–4
    | { kind: "whatsMissing"; prompt: Narration; shownIds: ArtId[]; missingId: ArtId; optionIds: ArtId[] };
  type LessonStop = { kind: "lesson" | "challenge"; id: string; title: string; opening: Narration;
                      wordIds: ArtId[]; exercises: Exercise[]; closing: Narration;
                      sticker?: { id: string; art: ArtId; name: Narration } };   // required for challenge only
  type SongStop = { kind: "song"; id: string; title: string; opening: Narration; bpm: number;
                    introBars: number; lyrics: { bar: number; say: Narration; wordId?: ArtId }[];
                    exercises: Exercise[]; closing: Narration };
  type StoryStop = { kind: "story"; id: string; title: string; opening: Narration; warmup: Exercise;
                     pages: { scene: SceneId; say: Narration; hotspots: { wordId: ArtId; x: number; y: number }[] }[];
                     question: Exercise; closing: Narration };
  type Stop = LessonStop | SongStop | StoryStop;
  type SceneId = "forest-walk" | "forest-bear" | "forest-bird" | "forest-pond" | "forest-web" | "forest-goodbye";
  type Unit = { id: string; title: string; banner: Narration; words: Word[]; stops: Stop[] };
  type PathUnit = { unitId: string; world: "floresta" | "vilarejo"; title: string; icon: string; hasContent: boolean };
  type Lines = { praise: Narration[]; retry: Narration; hint: Narration; star: Narration; chestOpen: Narration;
                 chestPrompt: Narration; lockedStop: Narration; soonUnit: Narration; start: Narration; album: Narration };
  ```
  Functions: `parseUnit(data): Unit`, `parsePath(data): PathUnit[]`, `parseLines(data): Lines` (they throw if the data is invalid). Also `getPath()`, `getUnit(id): Unit | null`, `getStop(stopId): { unit: Unit; stop: Stop; index: number } | null`, `getLines()` and `allNarrations(): Narration[]` (every narration in every unit plus `lines.json`, in a deterministic order).
- Validation in `superRefine`:
  - every `wordId`, `optionIds`, `shownIds`, `answerId`, `missingId` and `items.wordId` exists in `unit.words`;
  - `answerId ∈ optionIds` and `missingId ∈ optionIds`;
  - `missingId ∉ shownIds`;
  - stop ids are unique;
  - the stop order is exactly `song, lesson, lesson, lesson, story, challenge`;
  - `challenge` has a `sticker`;
  - hotspot `x` and `y` are within 0–1.

- [ ] **Step 1: Failing tests:**
  - `getUnit("forest-animals")` has the 6 words `bear, bird, frog, snake, spider, mouse` and stops of these kinds, in order: `song, lesson, lesson, lesson, story, challenge`.
  - The ids are `forest-animals/song`, `forest-animals/lesson-1`, `forest-animals/lesson-2`, `forest-animals/lesson-3`, `forest-animals/story`, `forest-animals/challenge`.
  - `getPath()` returns 7 units in the order of spec §4, and only `forest-animals` has `hasContent: true`.
  - `parseUnit` throws when: an `answerId` is not in its options, a `missingId` is in `shownIds`, the challenge has no sticker, the stops are out of order, or a segment has empty text.
  - Every `en-US` segment in the unit contains no Portuguese accented letters (`/[áàâãéêíóôõúç]/i` does not match). This catches a language tag swapped by mistake.
  - Each lesson stop has between 8 and 12 exercises, and the challenge has between 8 and 10.
- [ ] **Step 2:** `npm test -- trail/content`. Expected: FAIL.
- [ ] **Step 3: Implement.** The content copy is **exactly** the text below. For readability the tables use `pt:` and `en:` to show each segment of the narration.

  **`content/path.json`:** units in the order of spec §4:
  - Floresta: `forest-animals` "Animais da floresta" 🌳, `colors` "Cores" 🎨, `numbers` "Números" 🔢.
  - Vilarejo: `hello` "Hello!" 👋, `family` "Família" 👪, `home` "Casa" 🏠, `food` "Comida" 🍎.

  **Words:**

  | id | en | pt (used in the narration) |
  |---|---|---|
  | bear | bear | o urso |
  | bird | bird | o pássaro |
  | frog | frog | o sapo |
  | snake | snake | a cobra |
  | spider | spider | a aranha |
  | mouse | mouse | o ratinho |

  `banner`: `pt: Unidade um: animais da floresta!`

  **Standard narration patterns** (W = English word, P = Portuguese name, with the article written out in `Esse é` / `Essa é`):
  - intro: `pt: {Esse|Essa} é {P}. Em inglês:` · `en: W.` · `pt: Repita comigo:` · `en: W!`
  - listenTap: `pt: Qual é {o|a}` · `en: W?` · `pt: Toque {nele|nela}!`
  - trueFalse: `pt: Olha!` · `en: This is a W!` · `pt: Certo ou errado?`
  - tapRepeat item: `en: W!`. The prompt is `pt: Toque em cada animal e repita comigo!`
  - matchPairs: `pt: Ligue cada animal ao nome dele!`
  - whatsMissing: `pt: Um animal se escondeu! Quem sumiu?`

  **1 · 🎵 `forest-animals/song`**, "Música". Settings: `bpm 100`, `introBars 1`.
  - opening: `pt: Vamos cantar a música dos animais da floresta! Escute e cante comigo!`
  - lyrics: each line takes 2 bars.
    - Bars 1, 3, 5, 7, 9 and 11: `en: What's this? What's this? It's a W!`, with `wordId` bear, bird, frog, snake, spider and mouse in that order.
    - Bar 13: `en: Animals, animals, in the forest!`
  - exercises: 3 listenTap:
    - bear (options bear, bird, frog);
    - snake (options snake, spider, mouse);
    - mouse (options bear, mouse, frog).
  - closing: `en: Great job!` · `pt: Você cantou com os animais da floresta!`

  **2 · ⭐ `forest-animals/lesson-1`**, "Lição 1". wordIds: bear, bird, frog.
  - opening: `pt: Oi! Hoje nós vamos aprender três animais da floresta!`
  - exercises:
    1. intro bear
    2. listenTap bear, options [bear, bird]
    3. intro bird
    4. listenTap bird, options [bear, bird]
    5. intro frog
    6. trueFalse frog shown, "This is a bird!", false
    7. matchPairs [bear, bird, frog]
    8. listenTap frog, options [bird, frog, bear]
    9. trueFalse bear shown, "This is a bear!", true
    10. tapRepeat [bear, bird, frog]
  - closing: `en: Great job!` · `pt: Hoje você aprendeu:` · `en: bear, bird, frog!`

  **3 · ⭐ `forest-animals/lesson-2`**, "Lição 2". wordIds: snake, spider, mouse.
  - opening: `pt: Oi! Hoje nós vamos aprender mais três animais da floresta!`
  - exercises:
    1. intro snake
    2. listenTap snake, options [snake, spider]
    3. intro spider
    4. listenTap spider, options [snake, spider]
    5. intro mouse
    6. trueFalse mouse shown, "This is a snake!", false
    7. matchPairs [snake, spider, mouse]
    8. listenTap mouse, options [spider, mouse, snake]
    9. trueFalse spider shown, "This is a spider!", true
    10. listenTap bird, options [bird, snake, frog, mouse]. It mixes the 6 words.
    11. tapRepeat [snake, spider, mouse]
  - closing: `en: Awesome!` · `pt: Hoje você aprendeu:` · `en: snake, spider, mouse!`

  **4 · ⭐ `forest-animals/lesson-3`**, "Lição 3". wordIds: all 6.
  - opening: `pt: Hoje vamos aprender uma frase:` · `en: What's this? It's a bear!`
  - exercises:
    1. tapRepeat with items whose `say` is `en: What's this? It's a W!`, for bear, bird and frog. The prompt is `pt: Toque em cada animal e repita a frase comigo!`
    2. trueFalse snake: `en: What's this? It's a snake!` · `pt: Certo ou errado?`, true
    3. trueFalse frog: `en: What's this? It's a mouse!` · `pt: Certo ou errado?`, false
    4. listenTap spider: prompt `en: It's a spider!` · `pt: Onde está? Toque!`, options [spider, bird, mouse, bear]
    5. whatsMissing: shown [bear, frog, snake], missing bird, options [bird, mouse, spider]
    6. matchPairs [snake, spider, mouse, bear]
    7. listenTap frog: prompt `en: It's a frog!` · `pt: Onde está? Toque!`, options [frog, snake, bird, spider]
    8. tapRepeat with the same phrase pattern, for snake, spider and mouse
    9. whatsMissing: shown [spider, mouse, bird], missing frog, options [frog, bear, snake]
  - closing: `en: Awesome!` · `pt: Agora você sabe perguntar e responder:` · `en: What's this? It's a bear!`

  **5 · 📖 `forest-animals/story`**, "História". The title shown is "O gatinho na floresta".
  - opening: `pt: Hora da história! Primeiro, vamos lembrar os animais.`
  - warmup: matchPairs [bear, bird, frog, mouse]
  - pages:

    | scene | say | hotspots (x, y) |
    |---|---|---|
    | forest-walk | `pt: Era uma vez um gatinho que foi passear na floresta.` · `en: Hello, forest!` | none |
    | forest-bear | `pt: Atrás de uma árvore, ele viu um urso.` · `en: Hello, bear!` | bear (0.68, 0.55) |
    | forest-bird | `pt: Num galho bem alto, cantava um pássaro.` · `en: Hello, bird!` | bird (0.62, 0.28) |
    | forest-pond | `pt: Perto do lago, pulava um sapo, e uma cobra tomava sol.` · `en: Hello, frog! Hello, snake!` | frog (0.40, 0.70), snake (0.75, 0.72) |
    | forest-web | `pt: Uma aranha fazia sua teia, e um ratinho comia um queijo.` · `en: Hello, spider! Hello, mouse!` | spider (0.30, 0.30), mouse (0.70, 0.75) |
    | forest-goodbye | `pt: No fim do dia, todos os amigos se despediram do gatinho.` · `en: Goodbye, friends!` | all 6 |

    For the last page, use these positions: bear (0.18, 0.62), bird (0.32, 0.30), frog (0.42, 0.75), snake (0.60, 0.76), spider (0.74, 0.32), mouse (0.84, 0.72).
  - question: listenTap bear, prompt `pt: Quem o gatinho encontrou primeiro? Toque!`, options [bird, bear, frog]
  - closing: `en: Well done!` · `pt: Você ouviu uma história em inglês!`

  **6 · 🏆 `forest-animals/challenge`**, "Desafio".
  - opening: `pt: É hora do desafio! Mostre tudo o que você aprendeu!`
  - exercises:
    1. listenTap mouse, options [mouse, spider, bird, frog]
    2. trueFalse bird: `en: What's this? It's a bird!` · `pt: Certo ou errado?`, true
    3. whatsMissing: shown [bear, spider, mouse], missing snake, options [snake, frog, bird]
    4. matchPairs [bird, frog, snake, spider]
    5. listenTap bear, options [frog, bear, snake, mouse]
    6. trueFalse spider: `en: What's this? It's a frog!` · `pt: Certo ou errado?`, false
    7. listenTap snake: prompt `en: It's a snake!` · `pt: Onde está? Toque!`, options [spider, snake, bear, bird]
    8. whatsMissing: shown [frog, bird, bear], missing mouse, options [mouse, spider, snake]
    9. tapRepeat with the phrase, for all 6
  - closing: `en: Great job!` · `pt: Você terminou a unidade dos animais da floresta!`
  - sticker: `{ id: "sticker-forest-bear", art: "bear", name: [en: "A bear sticker!"] }`

  **`content/lines.json`:**
  - praise: four lines, all `en`: `Yes! That's great!` / `Awesome!` / `Well done!` / `Great job!`
  - retry: `pt: Opa! Vamos tentar de novo.`
  - hint: `pt: Olha aqui! É esse que está brilhando.`
  - star: `pt: Você ganhou uma estrela!`
  - chestPrompt: `pt: Uau! Você conseguiu! Toque no baú para abrir!`
  - chestOpen: `pt: Uma figurinha nova para o seu álbum!`
  - lockedStop: `pt: Essa parada ainda está trancada. Termine a anterior primeiro!`
  - soonUnit: `pt: Essa aventura está chegando!`
  - start: `en: Hello!` · `pt: Vamos brincar?`
  - album: `pt: Esse é o seu álbum de figurinhas!`
- [ ] **Step 4:** `npm test -- trail/content`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(trail): content schema v2 and Unit 1 script`.

### Task 2: Stable audio ids and line extraction

**Files:**
- Create: `src/domain/trail/audio-id.ts`, `tools/audio/extract-lines.ts`
- Modify: `package.json` (dev dep `tsx`; script `"audio:lines": "tsx tools/audio/extract-lines.ts"`)
- Test: `tests/domain/trail/audio-id.test.ts`

**Interfaces:**
- Consumes: `Segment` and `allNarrations()` from Task 1.
- Produces:
  - `segmentId(seg: Segment): string`: 16 hex characters, the FNV-1a 64-bit hash (with `BigInt`) of `` `${lang}|${text.normalize("NFC").trim()}` ``.
  - `audioSrc(seg: Segment): string`, returning `` `/audio/${segmentId(seg)}.mp3` ``.
  - `extract-lines.ts` writes `tools/audio/lines.json`: `{ id, lang, text }[]`, unique by `id` and sorted by `id`.
- [ ] **Step 1: Failing tests:**
  - `segmentId({lang:"en-US",text:"bear!"})` is equal across calls and differs from `pt-BR` with the same text.
  - Leading and trailing spaces and composed or decomposed Unicode (NFC vs NFD for "é") give the same id.
  - The result matches `/^[0-9a-f]{16}$/`.
  - The fixed value `segmentId({lang:"pt-BR",text:"Opa! Vamos tentar de novo."})` equals the value computed in the test with a reference implementation written inside the test. This pins the algorithm.
- [ ] **Step 2:** `npm test -- audio-id`. Expected: FAIL.
- [ ] **Step 3:** Implement. Run `npm run audio:lines` and confirm that `tools/audio/lines.json` has more than 100 lines with no duplicates. Commit `lines.json`.
- [ ] **Step 4:** `npm test -- audio-id`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(audio): stable segment ids and line extraction`.

### Task 3: Audio tools (voice, checking, effects, chant)

**Files:**
- Create: `tools/audio/requirements.txt`, `tools/audio/generate.py`, `tools/audio/verify.py`, `tools/audio/sfx.py`, `tools/audio/chant.py`, `tools/audio/README.md`
- Modify: `.gitignore` (`tools/audio/.venv/`, `tools/audio/.cache/`)

**Interfaces:**
- Consumes:
  - `tools/audio/lines.json` (Task 2);
  - the song stop from `content/units/forest-animals.json` (`bpm`, `introBars`, `lyrics[].bar`, `lyrics[].say`).
- Produces:
  - `python tools/audio/generate.py [--only id,...] [--seed N]` generates `public/audio/{id}.mp3` for every line that does not exist yet. It uses the Chatterbox parameters from the Global Constraints and prints `generated N, skipped M`.
  - `python tools/audio/verify.py` transcribes each MP3 with faster-whisper `small` (int8 on CPU) in the line's language and computes the similarity with the text (difflib ratio over normalised words). A line with similarity below **0.80** is regenerated with seeds 43 and 44, keeping the best take. Lines that end below 0.80 are written to `tools/audio/review.md` for a person to listen to. Report: `ok X, retried Y, flagged Z`.
  - `python tools/audio/sfx.py` creates `public/audio/sfx/{correct,retry,star,chest,tap}.mp3` with numpy:
    - correct: two rising notes;
    - retry: a soft "boing";
    - star: a sparkle;
    - chest: a creak followed by a chord;
    - tap: a short pop.
    
    Each one lasts at most 1.2 s, at −6 dB relative to the voice.
  - `python tools/audio/chant.py` creates `public/audio/song-forest-animals.mp3`. The instrumental is original, in C–G–Am–F at the content's bpm, with plucked strings, bass and light percussion. The Chatterbox voice speaks each lyric starting at `introBars + bar - 1` bars.
  - The `README.md` documents the setup with `uv venv -p python3.11 tools/audio/.venv`. It explains that torch comes from `--index-url https://download.pytorch.org/whl/cpu` and that `setuptools<81` is needed for `resemble-perth`.
- [ ] **Step 1:** Write the scripts and the `requirements.txt`, pinning `chatterbox-tts==0.1.7`, `torch==2.6.0`, `torchaudio==2.6.0`, `faster-whisper`, `numpy`, `soundfile` and `setuptools<81`. Use the sample script in `docs/arte/amostras-aprovadas/gerar-voz-amostra.py` as the base (voice 1 = no `audio_prompt_path`).
- [ ] **Step 2: Smoke test.** Run `python tools/audio/generate.py --only <the ids of the 4 lines in lines.json: retry, praise "Yes! That's great!", intro bear, banner>` and then `python tools/audio/verify.py`. Expected: 4 MP3s are generated, between 0.5 and 8 s long (check with `ffprobe`), and verify reports `flagged 0`.
- [ ] **Step 3:** `python tools/audio/sfx.py` produces the 5 effects. Check their duration with `ffprobe`.
- [ ] **Step 4:** Commit the scripts and the 4 MP3s and 5 effects: `feat(audio): voice, verification, sfx and chant tools`.
- [ ] **Note to the controller:** right after this task, start the **full** generation in the background, `generate.py && verify.py && chant.py`, which takes 2 to 3 hours. Collect the result in Task 14.

### Task 4: Narrator v2 (a narration played in sequence)

**Files:**
- Modify: `src/audio/narrator.ts`
- Test: `tests/audio/narrator.test.ts` (add to it)

**Interfaces:**
- Consumes: `Narration` and `Segment` (Task 1), `audioSrc` (Task 2).
- Produces:
  - `narrator.playNarration(n: Narration): Promise<void>`: plays each segment in order, using `audioSrc(seg)`. A newer `playNarration`, `play` or `stop()` cancels **the whole rest** of the previous sequence, and the interrupted promise resolves.
  - `narrator.playSfx(name: "correct" | "retry" | "star" | "chest" | "tap"): void`: fire-and-forget, never interrupts the voice, and does nothing before `unlock`.
  - When a segment's audio fails to load or play (an error event or a rejected `play()`), that segment falls back to the browser voice with `utterance.lang = seg.lang`. The voice is picked by exact `lang`, then by prefix (`pt`, `en`).
  - `play(media)` keeps working (it is used until Task 13).
- [ ] **Step 1: Failing tests** (with the stubs already in the file):
  - `playNarration` with 3 segments creates 3 audios in order, `/audio/<id>.mp3`. The 2nd only starts after the 1st's `ended`.
  - `stop()` during the 1st segment resolves the promise and never creates the 2nd audio.
  - **Review Focus 1:** if the 2nd segment's audio fires `error`, the speech engine is called with `lang "pt-BR"` (or `"en-US"`) and that segment's text, and then the 3rd plays. The total time (fake timers) does not exceed the safety timeout for that segment.
  - `playSfx` before `unlock` creates no audio. After `unlock` it creates an `Audio("/audio/sfx/correct.mp3")` and does not cancel the voice that is playing.
- [ ] **Step 2:** `npm test -- narrator`. Expected: FAIL.
- [ ] **Step 3:** Implement on top of the existing state machine (`stopCurrent`, `settle`, `release`). A narration is a loop of `play`-like calls that share a cancellation token.
- [ ] **Step 4:** `npm test -- narrator`. Expected: PASS, including the existing tests.
- [ ] **Step 5:** Commit `feat(audio): play narrations segment by segment with per-language fallback`.

### Task 5: Art: the gatinho and the 6 animals

**Files:**
- Create: `src/art/Cat.tsx`, `src/art/animals/{Bear,Bird,Frog,Snake,Spider,Mouse}.tsx`, `src/art/Animal.tsx`, `src/art/art.css`, `tools/visual/art-sheet.tsx`, `tools/visual/shots.cjs`, `docs/arte/guia-de-estilo.md`, `docs/arte/folha-de-personagens.png`
- Modify: `src/app/globals.css` (import `art.css`)
- Test: `tests/art/art.test.tsx`

**Interfaces:**
- Produces:
  - `Cat({ expression, size? }: { expression: CatExpression; size?: number })` with `type CatExpression = "idle" | "talking" | "happy" | "pointing" | "helping" | "listening"`. The root `<svg>` has `data-expression`, `role="img"` and `aria-label="Gatinho"`.
  - `Animal({ id, size?, glow? }: { id: ArtId; size?: number; glow?: boolean })`, which delegates to the 6 components. The root has `role="img"`, `aria-label` with the **English** word (`lang="en"`) and `data-art={id}`. With `glow`, it gets an animated yellow halo.
  - `tsx tools/visual/art-sheet.tsx` writes `tools/visual/.out/art-sheet.html`, using `renderToStaticMarkup` with every expression and every animal. `node tools/visual/shots.cjs <html> <png>` takes a screenshot with Playwright at 2× scale.
- [ ] **Step 1: Failing tests:**
  - each of the 6 expressions renders with the right `data-expression`;
  - each of the 6 `ArtId` renders with `aria-label` equal to the English word and `lang="en"`;
  - `glow` adds the `data-glow="true"` attribute;
  - no SVG `<text>` exists inside `Animal`, so no letter gives the answer away.
- [ ] **Step 2:** `npm test -- art`. Expected: FAIL.
- [ ] **Step 3:** Implement.
  - Port the approved gatinho from `docs/arte/amostras-aprovadas/arte-fonte.html` (functions `cat`, `eyes`, `mouth`) and add the expressions:
    - `talking`: mouth half open;
    - `listening`: one ear tilted and eyes looking up;
    - `idle`: like `pointing` but with arms down.
  - Draw the 5 new animals in the same line as the approved bear: round head, big eyes with a shine, cheeks, a soft shadow on the ground and the leaf green palette for the frog.
    - The snake is green with yellow spots and a smile.
    - The spider is purple, round, with 8 short legs and big eyes, and no fangs.
    - The mouse is grey with big pink ears.
    - The bird is sky blue with a yellow beak.
  - CSS animations in `art.css`: `.blink` every 4 s, the tail swaying in `idle`, a jump in `happy`, and a glow pulse. All of them are disabled under `prefers-reduced-motion`.
  - The `guia-de-estilo.md` records the proportions (head about 55% of the height), the palette per character, the stroke rules (no outline, with shapes and shadows at 6% black), and how to add a new animal.
- [ ] **Step 4:** `npm test -- art` → PASS. Generate the sheet (`npx tsx tools/visual/art-sheet.tsx && node tools/visual/shots.cjs tools/visual/.out/art-sheet.html docs/arte/folha-de-personagens.png`) and **look at the PNG**. Every animal must be recognisable, nothing may be clipped, and the style must be consistent with the approved bear. Fix it until it is.
- [ ] **Step 5:** Commit `feat(art): cat expressions and the six forest animals`.

### Task 6: Art: scenes, chest, sticker and stop icons

**Files:**
- Create: `src/art/scenes/ForestBackdrop.tsx`, `src/art/scenes/StoryScene.tsx`, `src/art/scenes/Chest.tsx`, `src/art/scenes/Sticker.tsx`, `src/art/StopIcon.tsx`
- Modify: `tools/visual/art-sheet.tsx` (add the scenes to the sheet)
- Test: `tests/art/scenes.test.tsx`

**Interfaces:**
- Consumes: `Animal` and `Cat` (Task 5), `SceneId` (Task 1).
- Produces:
  - `ForestBackdrop({ variant }: { variant: "map" | "story" })`: a full SVG filling its container (`preserveAspectRatio="xMidYMid slice"`) with sky, sun, clouds, 3 layers of hills, pines, round trees, mushrooms and flowers, as in the approved sample.
  - `StoryScene({ scene, hotspots, onHotspot, glowId? })`: draws the backdrop plus the scene's characters at the hotspot positions (in percentages). Each hotspot is a `<button>` at least 88 px across with `aria-label` equal to the English word. On the `forest-pond` and `forest-web` pages, the gatinho appears to one side.
  - `Chest({ open }: { open: boolean })`: a wooden chest with a gold lock. When `open`, the lid goes up and gives off light.
  - `Sticker({ art, earned }: { art: ArtId; earned: boolean })`: a round sticker with a white border. When it is not `earned`, it is a grey silhouette.
  - `StopIcon({ kind, state })` with `kind: Stop["kind"]` and `state: "done" | "current" | "locked"`:
    - music is coral, a lesson is sun yellow, the story is sky blue and the challenge is lilac `#B57EDC`;
    - `locked` is grey with a padlock;
    - `done` shows a green ✓ badge.
- [ ] **Step 1: Failing tests:**
  - `StoryScene` with 2 hotspots renders 2 buttons with the English labels, and a click calls `onHotspot(wordId)`;
  - `Chest` changes `data-open`;
  - `Sticker` with `earned=false` has `data-earned="false"`;
  - `StopIcon` renders the 4 kinds × 3 states without errors, with `data-kind` and `data-state`.
- [ ] **Step 2:** `npm test -- scenes`. Expected: FAIL.
- [ ] **Step 3:** Implement. Update the character sheet and **look at it**: the 6 story scenes, the open and closed chest, and the stickers. Fix it until it is at the level of the approved sample.
- [ ] **Step 4:** `npm test -- scenes`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(art): forest backdrop, story scenes, chest, sticker and stop icons`.

### Task 7: Session engine and exercise logic

**Files:**
- Create: `src/domain/trail/session.ts`, `src/domain/trail/exercises.ts`
- Test: `tests/domain/trail/session.test.ts`, `tests/domain/trail/exercises.test.ts`

**Interfaces:**
- Consumes: `Exercise` (Task 1).
- Produces:
  ```ts
  type Phase = "answering" | "correct" | "retry" | "hint";
  type Session = { items: { exercise: Exercise; key: string; isReview: boolean }[]; index: number;
                   wrongCount: number; phase: Phase; reviewedKeys: string[]; finished: boolean };
  startSession(exercises: Exercise[], stopId: string): Session   // key = `${stopId}#${i}`
  answer(s: Session, correct: boolean): Session
  //  answering + correct → "correct"
  //  answering + wrong with wrongCount 0 → "retry" (wrongCount 1)
  //  answering + wrong with wrongCount ≥ 1 → "hint" (the item is queued for review at the end, once per key)
  //  hint + correct → "correct" · hint + wrong → stays "hint" (same reference)
  //  any answer during "correct" or "retry" → ignored (same reference)
  resume(s: Session): Session   // "retry" → "answering" (after the orange strip)
  next(s: Session): Session     // from "correct": index+1, wrongCount 0, phase answering; past the end → finished
  progressRatio(s: Session): number   // 0..1 (done items / total items, including the review ones queued)
  // exercises.ts
  type MatchState = { selected: { side: "art" | "word"; id: ArtId } | null; matched: ArtId[] };
  matchSelect(s: MatchState, side, id): { state: MatchState; outcome: "pending" | "pair" | "mismatch" | "complete" }
  type RepeatState = { tapped: ArtId[] };
  repeatTap(s: RepeatState, id: ArtId, all: ArtId[]): { state: RepeatState; complete: boolean }
  whatsMissingCheck(ex, chosenId): boolean
  ```
  In "Ligar pares", each `mismatch` counts as `answer(false)` in the session, and `complete` counts as `answer(true)`. On a `hint`, the UI shows the next missing pair glowing.
- [ ] **Step 1: Failing tests:**
  - correct answer straight away: `answering → correct → next` moves forward and `progressRatio` grows;
  - wrong → `retry`, `resume`, correct → `correct`, and nothing is queued for review;
  - wrong, wrong → `hint`, then correct → `correct`. The item goes to the end with `isReview: true`, and the total grows by 1.
  - **Review Focus 3:** the same item going to `hint` again in its review is **not** queued a second time (`reviewedKeys`);
  - **Review Focus 2:** `answer` during `correct` returns the same reference;
  - `next` after the last item → `finished: true`;
  - match: art then the right word → `pair`; art then the wrong word → `mismatch` with the selection cleared; all pairs → `complete`; selecting something already matched is ignored;
  - repeat: tapping everything (in any order, with repeats) → `complete` only when every item has been tapped.
- [ ] **Step 2:** `npm test -- trail/session trail/exercises`. Expected: FAIL.
- [ ] **Step 3:** Implement the pure, immutable functions.
- [ ] **Step 4:** Expected: PASS.
- [ ] **Step 5:** Commit `feat(trail): session engine with retry, hint and end-of-stop review`.

### Task 8: Progress v2

**Files:**
- Modify: `src/domain/progress.ts` (replace its contents with v2), `src/domain/progress-local.ts` (generic, with key `lingoo:progress:v2`), `src/components/ProgressProvider.tsx`
- Test: `tests/domain/progress.test.ts`, `tests/domain/progress-local.test.ts`, `tests/components/ProgressProvider.test.tsx` (rewrite them)

**Interfaces:**
- Consumes: `PathUnit` and `Unit` (Task 1).
- Produces:
  ```ts
  type Progress = { completedStops: Record<string, string>; stickers: Record<string, string>; daysPlayed: string[] };
  emptyProgress(): Progress
  completeStop(p, stopId, now: Date, stickerId?: string): Progress   // idempotent, keeps the first date
  markDay(p, now: Date): Progress            // local date "YYYY-MM-DD"; keeps only the last 60 days; same reference if already there
  stopStatus(unit: Unit, p, stopId): "done" | "current" | "locked"   // sequential within the unit
  unitStatus(path, units: Record<string, Unit>, p, unitId): "done" | "current" | "locked" | "soon"
  weekDays(p, now: Date): { date: string; played: boolean; isToday: boolean }[]   // Mon..Sun of the current week
  // ProgressProvider: { progress, hydrated, finishStop(stopId, stickerId?), markToday() }
  ```
- [ ] **Step 1: Failing tests:**
  - the 1st stop starts `current` and the rest `locked`;
  - finishing the 1st stop makes it `done` and the 2nd `current`;
  - `unitStatus`: forest-animals is `current` and the 6 others are `soon` (no content);
  - `markDay` twice on the same day returns the same reference, and at `23:59` and `00:01` it gives two days;
  - `weekDays` starts on Monday and marks `isToday`;
  - a corrupted or old (v1) store → `emptyProgress()` with no error;
  - **Review Focus 4:** `markToday()` with no stop finished keeps the day and no stop.
  - The existing ordering test (finish before hydration) carries over to `finishStop`.
- [ ] **Step 2:** Expected: FAIL.
- [ ] **Step 3:** Implement while keeping the provider's lazy store and `hydrated` flag. The `markToday` is called by whoever opens a stop (Task 11).
- [ ] **Step 4:** Expected: PASS.
- [ ] **Step 5:** Commit `feat(trail): progress v2 with stops, days played and unit status`.

### Task 9: Lesson shell (bubble, progress bar, feedback strip)

**Files:**
- Create: `src/components/trail/NarrationText.tsx`, `ProgressBar.tsx`, `FeedbackBanner.tsx`, `ExerciseShell.tsx`
- Test: `tests/components/trail/shell.test.tsx`

**Interfaces:**
- Consumes: `Narration` (Task 1), `Cat` (Task 5), `narrator.playNarration` and `playSfx` (Task 4), `getLines()` (Task 1).
- Produces:
  - `NarrationText({ narration })`: the segments joined with a space. `en-US` segments go in `<b lang="en" class="text-sky-…">`, and `pt-BR` segments in `<span>`.
  - `ProgressBar({ ratio })`: `role="progressbar"`, `aria-valuenow` from 0 to 100, animated width, leaf green colour.
  - `FeedbackBanner({ kind, line, onContinue })` with `kind: "correct" | "retry" | "hint"`:
    - `correct` is green with a ✓ and has a **Continuar** button (`BigButton`, `aria-label="Continuar"`);
    - `retry` is orange and has no button, because it closes itself after the narration ends;
    - `hint` is orange with a "magnifier" and has no button.
    - Never use red.
  - `ExerciseShell({ ratio, prompt, catExpression, feedback, onExit, children })`:
    - the top bar has ✕ (`aria-label="Sair"`) and the `ProgressBar`;
    - the gatinho bubble holds `NarrationText` plus a 🔊 button (`aria-label="Ouvir de novo"`) that calls `playNarration(prompt)`;
    - `children` (the exercise area) sit in the centre and the `FeedbackBanner` at the bottom.
- [ ] **Step 1: Failing tests:**
  - `NarrationText` marks `lang="en"` only on the English segments;
  - 🔊 calls `playNarration` with the prompt;
  - `FeedbackBanner kind="correct"` shows "Continuar" and calls `onContinue`;
  - `retry` has no button and no colour class from the `red` family;
  - ✕ calls `onExit`;
  - the progress bar reflects the `ratio`.
- [ ] **Step 2–4:** RED → implement → GREEN (`npm test -- trail/shell`).
- [ ] **Step 5:** Commit `feat(trail): exercise shell with narrated bubble, progress bar and feedback strip`.

### Task 10: The 6 exercise components

**Files:**
- Create: `src/components/trail/exercises/{Intro,ListenTap,TapRepeat,TrueFalse,MatchPairs,WhatsMissing}.tsx`, `src/components/trail/exercises/ExerciseView.tsx`
- Test: `tests/components/trail/exercises.test.tsx`

**Interfaces:**
- Consumes: `Exercise` and `Word` (Task 1), the `exercises.ts` logic (Task 7), `Animal` (Task 5), `narrator` (Task 4).
- Produces: `ExerciseView({ exercise, words, phase, onAnswer, onDone })`, which delegates by `kind`.
  - **Common:** `onAnswer(correct: boolean)` reports each attempt. `phase` comes from the session, and while `phase ∉ {"answering", "hint"}` the cards are `disabled`. In `phase === "hint"`, the answer card (or the next pair) gets `glow`. Tapping any card plays `tap` (sfx), and tapping an answer card also speaks the word (`word.say`).
  - **Intro:**
    - plays `say` when mounted;
    - shows a big `Animal` (≥ 240 px) and the English word in large type below it (fine here, because it is the presentation);
    - shows a **"Já repeti!"** button (`aria-label="Continuar"`) after the narration ends, which calls `onAnswer(true)`.
  - **ListenTap:** plays the `prompt` when mounted. The options are shown with no text, and each tap reports right or wrong.
  - **TrueFalse:**
    - shows the `Animal` (`wordId`) and plays `say`;
    - has two buttons: 👍 (`aria-label="Certo"`) and 👎 (`aria-label="Errado"`), each at least 96 px;
    - the right answer is the one matching `isTrue`.
  - **MatchPairs:**
    - top row: the images, shuffled with a fixed seed taken from the exercise;
    - bottom row: one 🔊 button for each word, with the English word written on it;
    - tapping a 🔊 speaks the word and selects it;
    - a `pair` makes both cards turn green and stay;
    - a `mismatch` shakes them and calls `onAnswer(false)`;
    - `complete` calls `onAnswer(true)`.
  - **WhatsMissing:**
    1. shows `shownIds` + `missingId` for 2 s;
    2. a "bush" covers the `missingId` card, which disappears;
    3. the remaining cards rearrange themselves;
    4. the `optionIds` appear as cards to choose from, and each tap speaks its name;
    5. on the right answer, the hidden one reappears.
  - **TapRepeat:**
    - the cards for the `items`;
    - each tap plays that item's `say`, and the gatinho goes to `listening` for 1.5 s ("sua vez");
    - after every item has been tapped, a **Continuar** button calls `onAnswer(true)`.
- [ ] **Step 1: Failing tests** (narrator mocked, fake timers):
  - ListenTap: right → `onAnswer(true)`; wrong → `onAnswer(false)`;
  - **Review Focus 2:** after a first right tap, with the phase changed to `"correct"`, a second tap on another card does not call `onAnswer`;
  - `phase="hint"` puts `data-glow` on the answer;
  - TrueFalse: with `isTrue=false`, 👎 → true;
  - MatchPairs: a wrong pair → `onAnswer(false)` once, and the 3 right pairs → `onAnswer(true)` once;
  - WhatsMissing: before 2 s the 4 cards are visible; after it, the `missingId` card is not; choosing the hidden one → true;
  - TapRepeat: "Continuar" only appears after the 3 taps;
  - Intro: the button appears after `playNarration` resolves.
- [ ] **Step 2–4:** RED → implement → GREEN (`npm test -- trail/exercises`).
- [ ] **Step 5:** Commit `feat(trail): six exercise types`.

### Task 11: Stop player (lesson and challenge) and the `/parada/[stopId]` route

**Files:**
- Create: `src/components/trail/StopPlayer.tsx`, `src/components/trail/ChestReward.tsx`, `src/app/parada/[stopId]/page.tsx`, `src/app/parada/[stopId]/StopScreen.tsx`
- Test: `tests/components/trail/StopPlayer.test.tsx`, `tests/app/StopScreen.test.tsx`

**Interfaces:**
- Consumes: the session (Task 7), `ExerciseView` (Task 10), `ExerciseShell` (Task 9), `useProgress` (Task 8), `getStop` and `getLines` (Task 1), `Chest` and `Sticker` (Task 6).
- Produces:
  - `StopPlayer({ unit, stop, onExit })` for `kind` `lesson` or `challenge`.
  - **Opening:** the gatinho, `happy`, says `opening`. The word cards of the stop (`wordIds`) appear side by side, and each tap speaks its word. A big ▶ button (`aria-label="Começar"`) starts the stop.
  - **Loop:**
    - `correct` → praise from `lines.praise` in rotation + sfx `correct` + strip with Continuar → `next`;
    - `retry` → `lines.retry` + sfx `retry` → after the narration, `resume`;
    - `hint` → `lines.hint` + `glow`.
    - The `catExpression` follows the phase: `pointing` while answering, `happy` on correct, `helping` on retry and hint.
  - **Closing:**
    - the gatinho, `happy`, says `closing`;
    - the cards of the words learned;
    - a ⭐ animation + sfx `star` + `lines.star`;
    - a **"Voltar ao mapa"** button.
    - `finishStop(stop.id)` is called **once**, on entering the closing.
  - **Challenge:** after the closing, `ChestReward` shows the closed chest + `lines.chestPrompt`. Tapping it opens it (sfx `chest`), the `Sticker` "pops", and the app plays `lines.chestOpen` and `sticker.name`. Then `finishStop(stop.id, sticker.id)` runs.
  - **Route:** `StopScreen` reads `getStop(stopId)` and waits for `hydrated`. If the stop does not exist or `stopStatus` is `locked`, it does `router.replace("/mapa")`. Song and story are delegated to Task 12; until then, they show a placeholder `<p>`. It calls `markToday()` when the stop opens. `generateStaticParams` returns every id of every unit with content.
- [ ] **Step 1: Failing tests** (narrator mocked, fake timers; a small test lesson with 2 exercises, made with `parseUnit` over a fixture):
  - opening → "Começar" → the 1st exercise;
  - correct → the Continuar strip → the 2nd exercise;
  - finishing → the closing appears and `finishStop` is called once with the stop id;
  - an exercise that reached `hint` comes back at the end (the bar total grows);
  - **Review Focus 4:** ✕ in the middle calls `onExit` without `finishStop`;
  - in the challenge, the sticker only appears after tapping the chest, and `finishStop` receives the `stickerId`;
  - `StopScreen`: a locked stop → `replace("/mapa")` after hydration, never before; an unknown stop → `replace`; an open stop → renders it and calls `markToday`.
- [ ] **Step 2–4:** RED → implement → GREEN.
- [ ] **Step 5:** Commit `feat(trail): stop player with opening, session, closing, star and chest`.

### Task 12: Song stop (karaoke) and story stop

**Files:**
- Create: `src/components/trail/SongStop.tsx`, `src/components/trail/StoryStop.tsx`
- Modify: `src/app/parada/[stopId]/StopScreen.tsx` (delegate `song` and `story`)
- Test: `tests/components/trail/SongStop.test.tsx`, `tests/components/trail/StoryStop.test.tsx`

**Interfaces:**
- Consumes: `SongStop` and `StoryStop` (Task 1), `StopPlayer`'s internal pieces (opening, loop, closing; extract into `useStopFlow` or into `StopOpening` / `StopClosing` subcomponents if needed, to avoid duplication), `StoryScene` (Task 6), `narrator` (Task 4).
- Produces:
  - **SongStop:**
    - opening → ▶ plays `/audio/song-forest-animals.mp3`. The URL comes from `` `/audio/song-${unit.id}.mp3` ``.
    - While it plays, the current line is highlighted with the `Animal` from `wordId` big, and the line follows the time: `t = (introBars + bar - 1) * 4 * 60 / bpm` seconds.
    - The **Pause/Play** button and **"Cantar de novo"** sit at the end.
    - After that, the same loop as `StopPlayer` with `exercises`, then the closing + `finishStop`.
    - If the music file fails, the app speaks each line with `playNarration` in sequence, so it never gets stuck.
  - **StoryStop:**
    - opening → `warmup` (an exercise, with the same loop) → pages;
    - each page: `StoryScene` + `NarrationText` + automatic `playNarration(page.say)`;
    - tapping a hotspot speaks that word;
    - **"Avançar"** (`aria-label="Avançar"`) appears when the narration ends, and **"Repetir"** replays the page;
    - after the last page → `question` (the loop) → closing + `finishStop`.
- [ ] **Step 1: Failing tests:**
  - SongStop: with a fake `audio.currentTime` past the time of `bar` 3, the highlighted line is the 2nd (bird). An `error` on the audio falls back to `playNarration` for each line. After the end, the 3 exercises → closing.
  - StoryStop: warmup → page 1 → "Avançar" only after the narration → … → 6 pages → question → closing, with `finishStop` called once. A hotspot calls `playNarration(word.say)`.
- [ ] **Step 2–4:** RED → implement → GREEN.
- [ ] **Step 5:** Commit `feat(trail): song stop with karaoke and story stop with tappable scenes`.

### Task 13: Map, start screen, album, and removing v1

**Files:**
- Create: `src/components/trail/TrailMap.tsx`, `src/components/trail/DaysCalendar.tsx`
- Modify: `src/app/page.tsx`, `src/app/mapa/page.tsx`, `src/app/album/page.tsx`, `src/app/layout.tsx` (if needed), `README.md`
- Delete: the Phase 1 child experience listed in "File structure" (code, content and tests)
- Test: `tests/components/trail/TrailMap.test.tsx`, `tests/app/AlbumPage.test.tsx` (rewrite)

**Interfaces:**
- Consumes: `ForestBackdrop`, `StopIcon`, `Cat` and `Sticker` (Tasks 5 and 6), `stopStatus`, `unitStatus` and `weekDays` (Task 8), `getPath`, `getUnit` and `getLines` (Task 1), `narrator` (Task 4).
- Produces:
  - **Map layout (overrides the bullets below where they differ):** the map is the **vertical trail** of `docs/arte/telas-aprovadas/1-celular-mapa.png` and `4-tablet-mapa-inicio.png`: one tall scrolling column per world, built with the kit (Task 15): `ForestScene`, `WoodSign`, `StopButton`, `TopChips`, `BottomNav`.
    - The page scrolls **vertically**; stops zigzag down a dirt trail; each stop has its side label; the current stop is larger, with the dashed ring and the gatinho beside it with a bubble (`<stop title> · Vamos!`).
    - A chest sits beside the challenge stop. After a unit, the next units follow on the same trail: a locked `WoodSign` and grey ghost stops (4 each).
    - On open, the map scrolls the current stop into view.
    - Tablet landscape: the trail runs down the middle (wider zigzag), the unit sign sits at the top-left, the forest fills the sides (pond, animals), and the bottom nav is a centred pill.
    - `BottomNav` has three tabs: Trilha, Memória (links to `/memoria`; until Task 16 it shows the tab disabled), Álbum.
    - `public/manifest.webmanifest`: remove the fixed `orientation` (use `"any"`).
  - **TrailMap({ path, units, progress, onOpenStop }):**
    - `ForestBackdrop variant="map"` fills the screen;
    - **unit strip** at the top: icon + "UNIDADE 1" + title + a bar showing `n de 6` (`aria-label="Unidade 1, Animais da floresta"`); tapping it plays `unit.banner`;
    - the 6 stops on a winding path, the same as in the approved sample, each with a `StopIcon` + a label below it ("Música", "Lição 1", …);
    - the `current` stop pulses, with `Cat expression="pointing"` beside it;
    - tapping a `locked` stop shakes it and plays `lines.lockedStop`, without navigating;
    - after the path, the next units appear as locked strips (`🎨 Cores`, …) on the right or underneath, and tapping one plays `lines.soonUnit`;
    - `DaysCalendar` in the top-right corner: 7 circles Mon..Sun with ☀ on the days played, and today highlighted;
    - an **Álbum** button (book icon).
    - **Layout:** on a tablet on its side, the unit fits without scrolling. On a phone on its side, the path scrolls **horizontally** inside the map, never the page. On a phone held upright, the path turns vertical with vertical scrolling.
  - **Start screen (`/`):**
    - `ForestBackdrop` + a big happy `Cat` + the "Lingoo" logo + a ▶ button (`aria-label="Começar"`);
    - the tap unlocks audio, plays `lines.start` and goes to `/mapa`.
  - **Album:**
    - one page per unit with content, plus a `Sticker` slot for each challenge;
    - an earned sticker speaks its `name` when tapped;
    - a missing one is a silhouette with a padlock;
    - "Voltar" goes to the map, and `lines.album` plays when it opens.
  - **Removing v1:** delete the files listed. `npm test`, `tsc` and `lint` must stay green with no references to the old modules.
- [ ] **Step 1: Failing tests:**
  - TrailMap with empty progress: "Música" is enabled and the other 5 have `aria-disabled="true"`;
  - after the music is done, it has `data-state="done"` and "Lição 1" is `current`;
  - tapping a locked stop calls `playNarration(lines.lockedStop)` and not `onOpenStop`;
  - the calendar marks the `daysPlayed` of the current week;
  - Album: with `sticker-forest-bear` earned, the sticker has `data-earned="true"` and a tap plays its `name`.
- [ ] **Step 2–4:** RED → implement → GREEN. Then delete v1 and run `npm test && npx tsc --noEmit && npm run lint && npm run build`.
- [ ] **Step 5:** Commit `feat(trail): illustrated map, start screen and sticker album; remove phase 1 flow`.

### Task 14: Full audio, end-to-end test and visual review

**Files:**
- Create: `tests/content/audio-complete.test.ts`, `e2e/trail.spec.ts`, `tools/visual/screens.cjs`
- Modify: `e2e/smoke.spec.ts` and `e2e/audio.spec.ts` (move them to the new flow or remove them in favour of `trail.spec.ts`), `public/audio/*` (result of the full generation)

**Interfaces:**
- Consumes: everything.
- [ ] **Step 1: Collect the full generation** started after Task 3.
  - Run `npm run audio:lines`, then `generate.py` again, only for what is missing.
  - Run `verify.py` again.
  - Commit `public/audio/**` and `tools/audio/review.md`.
  - If `flagged > 0`, list the lines in the delivery report for Lucas to listen to. Never hide them.
- [ ] **Step 2: Test `audio-complete.test.ts`.** For every segment of `allNarrations()`, `public/audio/<segmentId>.mp3` exists and is larger than 2 KB. `song-forest-animals.mp3` and the 5 effects also exist. Run it, expecting PASS.
- [ ] **Step 3: `e2e/trail.spec.ts`**, on the "iPad (gen 7) landscape" device. It uses a fake `speechSynthesis` that records calls, and records which `/audio/*.mp3` requests are made (`page.on("request")`).
  - Start → map → Música: the karaoke plays and the 3 exercises → closing ⭐.
  - Lição 1 played through, with **one deliberate wrong answer** in exercise 2:
    - "Opa" is requested (audio id of `lines.retry`);
    - the second wrong answer makes the card glow;
    - the review exercise appears at the end.
  - Lição 2 and Lição 3.
  - História: 6 pages, plus a hotspot tap.
  - Desafio → chest → sticker.
  - The map shows 6 ✓, and the album has the sticker earned.
  - Reloading keeps everything.
  - At no point is the browser voice used (the fake records 0 `speak`), which proves every line has a file.
- [ ] **Step 3b: Memory training in the e2e.** After Lição 1 the memory round appears (3 cards: flip each, then the check) before the star. Then, with `page.clock` set one day ahead, the Memória tab shows the badge and `/memoria` lists the cards as ready; play the round to the end.
- [ ] **Step 4: Responsiveness check, Review Focus 5.** In the same e2e, on the 390×844 (phone portrait) and 1024×768 (tablet landscape) viewports, open the map and a lesson with 4 tiles:
  - `document.scrollingElement.scrollWidth <= innerWidth`;
  - every button in the visible area is at least 64 px;
  - every exercise card is at least 120 px.
- [ ] **Step 5: Visual review.** `node tools/visual/screens.cjs` captures, at 2×, on the tablet on its side and the phone held upright:
  - start, map, lesson opening;
  - each of the 6 exercise types in the answering state, plus the green strip, the orange strip and the hint;
  - a story page;
  - the chest open;
  - album.
  
  Save them to `docs/arte/telas/`. **Look at every image** and fix whatever is clipped, overlapping or off-palette before moving on.
- [ ] **Step 6:** `npm test && npx tsc --noEmit && npm run lint && npm run build && npm run e2e -- --trace off`, all green.
- [ ] **Step 7:** Commit `test(trail): full unit e2e, audio completeness and screen captures`.

---

### Task 15: Visual kit and restyle of the lesson screens

**Files:**
- Create: `src/components/trail/kit/{ForestScene,ChunkyButton,AnswerTile,LessonTopBar,Bubble,FeedbackSheet,WoodSign,StopButton,TopChips,BottomNav}.tsx`, `src/components/trail/kit/kit.css` (imported from `src/app/globals.css`), `tools/visual/screens.cjs`
- Modify: `src/components/trail/{ExerciseShell,FeedbackBanner,ProgressBar,StopPlayer,ChestReward}.tsx`, `src/components/trail/exercises/*.tsx` (markup and classes only), `src/app/globals.css`
- Test: `tests/components/trail/kit.test.tsx`; existing tests under `tests/components/trail/` and `tests/app/` keep passing (update selectors only where the markup changed)

**Interfaces:**
- Consumes: the approved reference `tools/visual/mockups.tsx` (its CSS block and components `TrailNode`, `WoodSign`, `TopChips`, `BottomNav`, `Bubble`, `Tile`, `LessonTop`, `Sheet`, `TrailScene`, `LessonScene`) — port them, do not reinvent them. Art from Tasks 5–6.
- Produces (all in `src/components/trail/kit/`):
  ```ts
  ForestScene({ variant }: { variant: "trail" | "lesson" | "start" })      // absolutely-positioned SVG backdrop that fills its parent; "trail" repeats the meadow for any height
  ChunkyButton({ onPress, label, children, tone?, size?, disabled? })       // tone: "sun" | "leaf" | "sky" | "white"; size: "md" | "lg" | "round"; label → aria-label; min 64 px
  AnswerTile({ id, onPress, state?, disabled?, label, lang? })              // state: "idle" | "correct" | "wrong" | "dim" | "hint"; a <button>; min 120 px; data-card={id}
  LessonTopBar({ ratio, onExit, title? })                                    // ✕ (aria-label "Sair") + thick progress bar (role progressbar) or a title pill
  Bubble({ children, tail?, onReplay? })                                     // white bubble; tail "left" | "down"; onReplay renders the 🔊 round button (aria-label "Ouvir de novo")
  FeedbackSheet({ kind, line, onContinue? })                                 // kind "correct" | "retry" | "hint"; data-kind; replaces the strip look
  WoodSign({ unitLabel, title, done?, total?, locked?, onPress? })
  StopButton({ kind, state, label, labelSide, onPress, size? })              // chunky disc; data-kind, data-state; aria-label = label; aria-disabled when locked
  TopChips({ stars, week })                                                  // week: { date, played, isToday }[] from weekDays()
  BottomNav({ active, memoryDue?, memoryEnabled? })                          // tabs Trilha (/mapa), Memória (/memoria), Álbum (/album); badge with memoryDue
  ```
  `ExerciseShell`, `FeedbackBanner` and `ProgressBar` keep their props and exported names (later tasks and tests use them) and render the kit inside.
- Layout rules: phone portrait first (tiles 2 per row, sheet button full width); from `min-width: 900px` and landscape: tiles up to 4 per row at ~200 px, bubble larger, sheet with the button at the right. The lesson screen never scrolls the page at 390×844 or 1024×768; the reserved sheet area stays.
- Restyle with the kit: the exercise shell, the 6 exercises (cards become `AnswerTile`; TrueFalse thumbs and MatchPairs word buttons become `ChunkyButton`), the stop opening (like `3-celular-abertura-inicio.png`: title pill, bubble, big gatinho, word tiles with the English word, yellow "Começar"), the closing (star, words learned, yellow "Continuar"), and the chest screen (forest backdrop, larger chest and sticker).
- Behaviour, aria-labels, `data-*` hooks and narration do not change.

- [ ] **Step 1: Failing tests** in `kit.test.tsx`: `ChunkyButton` renders a button with the aria-label, calls `onPress`, is at least 64 px (`min-h-16 min-w-16` or the kit class that sets it) and does not call `onPress` when disabled; `AnswerTile` exposes `data-card`, `data-state`, the English `aria-label` with `lang="en"`, shows the glow only in `hint`; `FeedbackSheet` has `data-kind`, the "Continuar" button only for `correct`, and no class or inline colour of the red family; `StopButton` sets `data-kind`/`data-state`, and a locked one has `aria-disabled="true"` and does not call `onPress`; `BottomNav` renders three links in order (Trilha, Memória, Álbum), marks the active one with `aria-current="page"`, shows the `memoryDue` badge, and renders Memória disabled when `memoryEnabled` is false.
- [ ] **Step 2:** `npm test -- trail/kit`. Expected: FAIL.
- [ ] **Step 3:** Implement the kit by porting `tools/visual/mockups.tsx`, then restyle the screens listed above.
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`. Expected: all green.
- [ ] **Step 5: Visual check.** `tools/visual/screens.cjs` starts from a running `next start` and captures, at 390×844 and 1024×768 (deviceScaleFactor 1 for checking): the stop opening, an exercise with 4 tiles answering, the correct sheet, the retry sheet, the hint, a MatchPairs exercise, the closing, the chest open. **Look at every capture next to the approved picture** and fix differences (empty areas, clipped elements, wrong colours, page scroll).
- [ ] **Step 6:** Commit `feat(trail): visual kit and restyled lesson screens`.

### Task 16: Memory training (spaced repetition)

**Files:**
- Create: `src/domain/trail/memory.ts`, `src/components/trail/memory/{FlipCard,MemoryRound,MemoryHome}.tsx`, `src/app/memoria/page.tsx`
- Modify: `src/domain/trail/schema.ts` and `content/units/forest-animals.json` (each `Word` gains `ask: Narration`), `content/lines.json` and its schema (memory lines), `src/domain/trail/progress.ts`, `src/domain/trail/progress-store.ts`, `src/components/trail/TrailProgressProvider.tsx`, `src/components/trail/StopPlayer.tsx`, `src/components/trail/kit/BottomNav.tsx` (Memória enabled, badge), `src/app/mapa/page.tsx` and `src/app/album/page.tsx` (pass the badge)
- Test: `tests/domain/trail/memory.test.ts`, `tests/components/trail/memory.test.tsx`, `tests/app/MemoriaPage.test.tsx`, additions to `tests/domain/trail/content.test.ts`, `tests/domain/trail/progress-store.test.ts`, `tests/components/trail/StopPlayer.test.tsx`

**Interfaces:**
- Consumes: session engine (`startSession`, `answer`, `resume`, `next`) and `ExerciseView`/ListenTap for the check phase; `ExerciseShell`; the kit; `useTrailProgress`; `dateKey` logic from `progress.ts` (export it).
- Produces:
  ```ts
  // memory.ts
  type CardId = string;                                  // `${unitId}:${wordId}`
  type CardState = { box: number; due: string };         // box 0..5; due = local "YYYY-MM-DD"
  type MemoryState = Record<CardId, CardState>;
  const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;   // index = box after a first-try correct answer
  const ROUND_LIMIT = 8;
  cardId(unitId: string, wordId: ArtId): CardId
  addCards(m: MemoryState, ids: CardId[], today: string): MemoryState        // new cards enter at box 0, due today; existing ones untouched; same reference if nothing new
  dueCards(m: MemoryState, today: string, limit?: number): CardId[]          // due <= today, lowest box first, then oldest due; stable
  grade(m: MemoryState, id: CardId, firstTry: boolean, today: string): MemoryState
  //   firstTry → box = min(box + 1, 5), due = today + INTERVAL_DAYS[box]; otherwise → box 1, due = today + 1
  nextDue(m: MemoryState, today: string): string | null                       // earliest due date after today, or null
  lessonRound(m: MemoryState, newIds: CardId[], today: string): CardId[]      // new cards + up to 3 due older ones; if no new cards: up to 6 due; if none due: the 3 lowest-box cards
  // progress.ts
  type Progress = { completedStops; stickers; daysPlayed; memory: MemoryState }   // a stored v2 payload without `memory` loads with {}
  // TrailProgressProvider
  useTrailProgress(): { …, gradeCards(results: { id: CardId; firstTry: boolean }[]): void, addMemoryCards(ids: CardId[]): void }
  // components
  FlipCard({ word, flipped, onFlip })                    // front: big Animal + "?"; back: Animal + the English word (lang="en"); a <button>, aria-label "Virar o cartão"; 3D flip, plain swap under reduced motion
  MemoryRound({ unit, cardIds, record, onDone })         // intro → recall (flip each card) → check (ListenTap per card, shuffled) → summary; calls gradeCards per card as it is checked when record is true
  MemoryHome()                                           // the /memoria screen
  ```
- Content: `Word.ask` for each word is the existing listenTap wording, as three segments (`pt: Qual é {o|a}` · `en: W?` · `pt: Toque {nele|nela}!`), so no new audio is needed for it. New lines in `lines.json`: `memoryIntro` (`pt: Hora de treinar a memória!`), `memoryAsk` (`pt: Como se fala em inglês?`), `memoryFlip` (`pt: Toque no cartão para virar!`), `memoryDone` (`pt: Sua memória está ficando forte!`), `memoryEmpty` (`pt: Tudo em dia! Volte outro dia para treinar de novo.`), `memoryHome` (`pt: Vamos treinar a memória?`).
- The check exercise for a card is built in code: `{ kind: "listenTap", prompt: word.ask, optionIds, answerId }` with 3 options when the unit has at least 3 known cards (the card plus 2 distractors chosen deterministically from the other cards in the child's memory, falling back to the unit's words), in a deterministic shuffled order.
- A card counts as `firstTry` only if the first answer in its check was correct (no retry, no hint).
- `StopPlayer`: for `kind === "lesson"`, after the session finishes and before the closing: `addMemoryCards(cards of stop.wordIds that are new)` then `MemoryRound` with `lessonRound(...)`. With `record === false` nothing is saved. Song, story and challenge have no memory round.
- `/memoria`: forest backdrop, gatinho, the number of cards ready today (`dueCards(...).length`, capped text "8 ou mais" is not needed — show the real number), yellow "Treinar" button starting `MemoryRound` with `dueCards(m, today, ROUND_LIMIT)`; when nothing is due: `memoryEmpty` and "o próximo cartão volta em N dia(s)" from `nextDue`; below, the child's cards grouped by box as five rows of small tiles. Finishing a round calls `markToday()`. `BottomNav` shows the badge on every screen that has it.

- [ ] **Step 1: Failing tests:**
  - `memory.ts`: a new card is due today at box 0; `grade(firstTry)` walks boxes 1→5 with due dates +1, +3, +7, +14, +30 and stays at 5 (+30); `grade(not firstTry)` from any box → box 1, due tomorrow; `dueCards` returns only cards with `due <= today`, lowest box first, and respects the limit; a card due in the past is still due (overdue waits, nothing resets); if `today` is earlier than the stored `due` (clock moved back) the card is simply not due; month and year rollovers produce valid date keys; `lessonRound` covers its three cases; all functions return the same reference on no-ops.
  - store: a stored v2 payload without `memory` loads with `memory: {}` and keeps its stops and stickers; a malformed `memory` loads as `{}` without discarding the rest.
  - `MemoryRound`: recall phase shows one card at a time, flipping plays the word and reveals the English word, "Continuar" appears only after the flip; the check phase asks each card once in a different order from the recall; a wrong first answer then right → that card is graded `firstTry: false`; right first → `true`; `gradeCards` is called as each card is checked (leaving mid-round keeps the ones already checked); with `record: false` it is never called; the summary says how many were remembered first try.
  - `StopPlayer`: a lesson shows the memory round between the last exercise and the closing; the challenge does not.
  - `/memoria`: with 2 cards due it shows "2" and "Treinar"; with none due it shows the empty state with the days until the next card; finishing a round calls `markToday`.
- [ ] **Step 2:** run the focused tests. Expected: FAIL.
- [ ] **Step 3:** Implement. Generate the new voice lines (`npm run audio:lines`, then `tools/audio/generate.py` and `verify.py` for the missing ids) and commit the MP3s.
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`; capture `/memoria` (with and without due cards), a card front, a card back and the check at 390×844 and 1024×768, and look at them.
- [ ] **Step 5:** Commit `feat(trail): memory training with spaced repetition`.

## Out of this plan

- Units 2–7: only their content and art.
- Real sung vocals.
- Pronunciation assessment.
- Parents, login and subscription (Phases 2 and 3).
- Performance-based stars.
