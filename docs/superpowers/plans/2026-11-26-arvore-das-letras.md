# Árvore das Letras Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open the Árvore das Letras on the Ilha da Descoberta: a child profile (cadastro), an English-alphabet activity bank, an adaptive level, 4 branches (units) with the farol's 6-stop pattern, the tree interior and the growing tree on the island.

**Architecture:** The bank (`content/areas/letras/bank.json`) is turned by a build script into four ordinary unit files (`content/units/letras-1..4.json`) that pass the existing `unitSchema`, so the stop players, routes, voice pipeline, memory and stickers work unchanged. Adaptivity is one new exercise kind, `adaptive` (three variants, one per level), resolved at play time from a level kept in the profile. Letters and written words are new art ids drawn as big text cards next to the illustrated words.

**Tech Stack:** Next.js 16.4 (App Router, `cacheComponents`), React 19, TypeScript strict, zod, Vitest/jsdom, Playwright, Python voice tools (`tools/audio/`).

**Spec:** `docs/superpowers/specs/2026-11-26-arvore-das-letras-design.md`

## Global Constraints

- NESTOY teaches English: every learned item (letter name, word, song, story line) is English; Nino's instructions are Portuguese (pt-BR). No Portuguese literacy content.
- Read `node_modules/next/dist/docs/` before touching Next APIs; `cacheComponents: true` — transient UI resets on every arrival (Activity).
- Bible: never red for errors; orange `#FF9F43` only on Nino; touch targets ≥ 64 px; reduced motion = media query OR `html[data-motion="reduzir"]`; area accent Letras `#FF7A5C`; trunk `#9A6A43 / #7A5232`; leaves `#5DB55A / #3F8F45 / #86CF6B`.
- Never isolated phonemes ("/b/"): letters are said by their English name ("bee") and with a word ("B is for ball").
- Progress v3 format unchanged (`lingoo:progress:v3`); settings unchanged (`lingoo:settings:v1`); the child profile lives in `lingoo:profile:v1`, only on the device.
- No child data leaves the device; Nino never says the child's name (written only).
- The farol and its unit `forest-animals` keep their ids and behaviour; their tests pass unchanged.
- All checks green at each commit: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run e2e -- --trace off` (kill stale `next-server`/`next start` first). Playwright Chromium is preinstalled; never `playwright install`.
- Commits end with the session attribution lines; no model identifiers in repo files.

## Deliberate simplifications (to ship sooner; listed for Lucas)

- Activities are fixed per stop at build time (deterministic), not re-drawn per day; missed words come back through the existing Treino de memória instead of a per-item "recent misses" list in the profile.
- The island id lives in `path.json` metadata (`island: "descoberta"`), not inside stop ids, so progress ids and routes stay as they are.
- The child's name appears on the cadastro, the ninho title and the parents area (not on the return card).

## Review Focus

- Old installs with progress and no profile: the cadastro appears once with "Agora não", and the farol/ninho keep everything (test in Task 3).
- Corrupt or hand-edited `lingoo:profile:v1` (bad age, unknown `english`, level 7): sanitised to defaults, app never crashes (test in Task 3).
- A child who changes "Contato com inglês" after playing: branches already done stay done and open; only the suggestion moves (test in Task 6).
- A combination the bank can generate whose audio segment was never recorded: the bank test fails the build instead of playing silence (test in Task 5).
- Replaying a finished letras stop and returning: no tree growth or thread replay, same as the farol fix (test in Task 7).

---

### Task 1: Art registry with letter and word cards

**Files:**
- Modify: `src/domain/trail/schema.ts` (`artIdSchema`), `src/art/Animal.tsx` (registry), `src/art/art.css`
- Create: `src/art/glyphs/Glyph.tsx`
- Test: `tests/art/glyph.test.tsx`, existing `tests/art/*.test.tsx`

**Interfaces:**
- Produces: `artIdSchema` = the 6 animals + `letter-a`…`letter-z` + `word-<en>` ids for every written word of the bank (Task 4 fixes the list; this task adds the 15 of galho 4: `word-cat, word-dog, word-sun, word-hat, word-bed, word-pig, word-box, word-bus, word-cup, word-fox, word-hen, word-jam, word-map, word-net, word-van`) + illustrated word ids added in Task 2 (declare them here as a list `PICTURE_IDS` with stubs that Task 2 replaces). `ART_WORDS: Record<ArtId, string>` (letters → "B", words → "dog"). `<Animal id>` keeps its name and props and renders `<Glyph>` for `letter-*`/`word-*`.
- `isGlyph(id: ArtId): boolean` exported from `src/art/glyphs/Glyph.tsx`.

- [ ] **Step 1:** Test `glyph.test.tsx`: `<Animal id="letter-b" />` renders an `svg[role=img]` with `aria-label="B"`, `lang="en"`, a `<text>` containing "B" and "b" (upper + lower case); `<Animal id="word-dog" />` renders "dog" in lower case; text fill is cocoa `#3A2618`, card fill cream `#FFF8EC`, never `#FF9F43`; `isGlyph("letter-a") === true`, `isGlyph("bear") === false`. Run → FAIL.
- [ ] **Step 2:** Implement `Glyph` in the same 240×240 viewBox as the animals: rounded cream card (r 36), Fredoka 700, letter cards show "Bb", word cards the word; contact shadow like the animals. Extend the schema enum and registry. Stubs for not-yet-drawn pictures render the word as a glyph (so nothing breaks before Task 2).
- [ ] **Step 3:** `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green. Commit `feat(art): letter and word cards in the art registry`.

### Task 2: Picture words (illustrations)

**Files:**
- Create: `src/art/words/*.tsx` (one component per picture word)
- Modify: `src/art/Animal.tsx` (replace stubs)
- Test: `tests/art/words.test.tsx`

**Interfaces:**
- Consumes: `PICTURE_IDS`, registry from Task 1.
- Produces: one drawing per picture id. The list (one per letter, plus words reused by galho 4): `apple, ball, cat, dog, egg, fish, goat, hat, igloo, jam, kite, lion, moon, nest, orange, pig, queen, rain, sun, tree, umbrella, van, web, box, yoyo, zebra, bed, bus, cup, fox, hen, map, net` (existing `bird, frog, spider, mouse, snake, bear` are reused where useful). `queen` is a crown on a cushion (no person); `rain` is a cloud with drops.

- [ ] **Step 1:** Test: for every id in `PICTURE_IDS`, `<Animal id>` renders a drawing with no `<text>` (it is not the stub), uses no `stroke` outlines (bible: no contours), no `#FF9F43`, no pure red (`#FF0000`, `#E53935`), and fits the 200×210 space (no coordinate outside −20…240). Run → FAIL.
- [ ] **Step 2:** Draw each in the style of `src/art/animals/Bear.tsx`: round full shapes, base + cooler shadow + warmer light, light from top-left, soft contact shadow at y=200. Use the bible palette.
- [ ] **Step 3:** Capture a contact sheet (all pictures, 6 per row) with Playwright to `.superpowers/sdd/2026-11-26-arvore-das-letras/t2/sheet.png`; look at it next to `docs/arte/ilha-ninho/poses.webp` and the animals; redraw any that read poorly at 96 px.
- [ ] **Step 4:** All checks green. Commit `feat(art): picture words for the English alphabet`.

### Task 3: Child profile and cadastro

**Files:**
- Create: `src/domain/nestoy/profile.ts`, `src/components/nestoy/ProfileProvider.tsx`, `src/components/onboarding/OnboardingScreen.tsx`, `src/components/onboarding/onboarding.css`
- Modify: `src/app/layout.tsx` (mount provider), `src/components/island/IslandRoute` / `IslandScreen.tsx` (show cadastro before the opening when `profile.onboarding === "pending"`), `src/components/parents/ParentsScreen.tsx` (section "Criança"), `src/components/ninho/NinhoScreen.tsx` (title "Ninho da <nome>"), `content/lines.json` + schema `linesSchema` (`callAdult`: "Chame um adulto!")
- Test: `tests/domain/nestoy/profile.test.ts`, `tests/components/onboarding/OnboardingScreen.test.tsx`, `tests/components/parents/ParentsScreen.test.tsx`

**Interfaces:**
- Produces (`src/domain/nestoy/profile.ts`):
  - `type English = "none" | "words" | "alphabet" | "reads"`; `type Age = 4 | 5 | 6 | 7 | 8 | 9`; `type Level = 1 | 2 | 3`
  - `type Profile = { version: 1; name: string; age: Age | null; english: English | null; onboarding: "pending" | "done" | "skipped"; createdAt: string | null; islands: { descoberta: { letras: { levels: Record<string, Level> } } } }`
  - `PROFILE_KEY = "lingoo:profile:v1"`; `defaultProfile(): Profile` (onboarding "pending")
  - `sanitizeProfile(raw: unknown): Profile`; `createProfileStore(storage: Storage | null): { load(): Profile; save(p: Profile): void }` (never throws; same pattern as `createSettingsStore`)
  - `startBranch(p: Profile): 1 | 2 | 3 | 4` — `none`/`words`/null → 1, `alphabet` → 3, `reads` → 4 if age ≥ 7 else 3
  - `startLevel(p: Profile): Level` — 2 if age ≥ 7 else 1 (age sets the pace)
  - `useProfile(): { profile: Profile; hydrated: boolean; update(patch: Partial<Profile>): void; setLevel(unitId: string, level: Level): void }`

- [ ] **Step 1:** Domain tests: defaults; sanitize keeps valid fields and drops bad ones (`age: 12` → null, `english: "x"` → null, level 7 → dropped, name trimmed to 20 chars); store survives `storage === null`, throwing `getItem`, garbage JSON; `startBranch` table exactly as in spec §3 (`reads` + age 6 → 3; `reads` + age 7 → 4; `alphabet` → 3); `startLevel` 7 → 2, 5 → 1. Run → FAIL.
- [ ] **Step 2:** Component tests: first open with no profile shows "Chame um adulto!" and a hold button ("Segure para entrar", reuse `HoldGate`); after the hold: name (optional, "Pular"), age (buttons 4…9+), "Contato com inglês" (4 buttons with the spec labels), then "Pronto!" saves `onboarding: "done"` and the opening plays; an existing install (progress present, no profile) shows the same screen with "Agora não", which saves `onboarding: "skipped"` and never shows it again; parents area "Criança" edits name/age/english through `update`; `/ninho` title reads "Ninho da Ana" when name is "Ana" and "Ninho" when empty. Run → FAIL.
- [ ] **Step 3:** Implement. Visual: cream sheet over the sky Backdrop, Nino `wave`, one question per screen, buttons ≥ 64 px, Fredoka/Nunito. Generate the `callAdult` voice line with the existing pipeline (`npm run audio:lines`, `tools/audio/generate_eleven.py --only <id>`, `verify.py --only <id>`).
- [ ] **Step 4:** Captures at 390×844 and 1024×768 of each cadastro step into `.superpowers/sdd/2026-11-26-arvore-das-letras/t3/`; look; fix. All checks green; update e2e that start from `/` to complete or skip the cadastro (helper `skipOnboarding(page)` that seeds `lingoo:profile:v1` with `onboarding: "skipped"`). Commit `feat(profile): child cadastro and parents section`.

### Task 4: Bank, unit builder and adaptive exercises

**Files:**
- Create: `content/areas/letras/bank.json`, `src/domain/letras/bank.ts` (schema + loader), `src/domain/letras/build.ts` (pure builder), `tools/content/build-letras.ts` (writes the unit files), `content/units/letras-1.json` … `letras-4.json` (generated, committed), `src/domain/nestoy/level.ts`
- Modify: `src/domain/trail/schema.ts` (adaptive exercise, `sceneIdSchema` + `"tree-room"`), `src/domain/trail/content.ts` (register the 4 units, `allNarrations` handles adaptive), `src/domain/trail/session.ts`, `src/components/trail/StopFlow.tsx` (resolve adaptive with the current level), `content/path.json` (4 entries, `hasContent: false` until Task 7), `src/art/scenes/StoryScene.tsx` (`tree-room`: plain blurred trunk backdrop, figures at hotspots), `package.json` script `content:letras`
- Test: `tests/domain/letras/bank.test.ts`, `tests/domain/letras/build.test.ts`, `tests/domain/nestoy/level.test.ts`, `tests/domain/trail/session.test.ts`

**Interfaces:**
- Consumes: art ids (Tasks 1–2), `Level` and `useProfile().setLevel` (Task 3).
- Produces:
  - Bank items: `{ kind: "letter", id: "b", unit: 1|2|3, difficulty: 1|2|3, name: "bee", words: ["ball","bed","bus"] }`, `{ kind: "word", id: "ball", en: "ball", pt: "bola", art: "ball", initial: "b", unit: 1|2|3|4, difficulty: 1|2|3 }`. Unit 1 letters A–M, unit 2 N–Z, unit 3 all letters, unit 4 the 15 three-letter words.
  - Exercise schema: `{ kind: "adaptive", levels: [Exercise, Exercise, Exercise] }` allowed in lesson/challenge `exercises` (not nested). Level n uses n+1 options (2, 3, 4) and closer distractors (B/D, M/N, P/Q before B/S).
  - Templates (spec §5) as builder functions producing narration segments: instruction `pt-BR` + content `en-US` (e.g. `[{pt-BR:"Toque no"},{en-US:"B"}]`, `[{pt-BR:"Esta é a letra"},{en-US:"B. B is for ball."}]`).
  - `buildLetrasUnits(bank): Unit[]` deterministic (no randomness; option order from a fixed seed per stop id).
  - Unit ids `letras-1…letras-4`; stop ids `letras-N/song`, `letras-N/lesson-1..3`, `letras-N/story`, `letras-N/challenge` (the existing id convention); `path.json` entries get `"island": "descoberta", "area": "letras"` (schema extended: both optional with defaults `descoberta` / `farol`); the island lives in path metadata, not in the stop id (ruling: keeps progress ids and routes unchanged).
  - `src/domain/nestoy/level.ts`: `type LevelRun = { level: Level; streakOk: number; streakMiss: number }`; `nextLevel(r: LevelRun, firstTry: boolean): LevelRun` — 3 first-try in a row → +1 (max 3), 2 misses in a row → −1 (min 1), streaks reset on change; `resolve(ex: Exercise, level: Level): Exercise` (non-adaptive passes through).
  - Song/story exercises are never `adaptive` (always level 1).

- [ ] **Step 1:** Tests: bank parses; every letter has ≥ 1 word whose `initial` matches; `buildLetrasUnits` returns 4 units that pass `parseUnit` with stop order song, lesson×3, story, challenge and a sticker on each challenge; building twice yields identical JSON; the committed `content/units/letras-*.json` equal the builder output (guards hand edits); every adaptive slot has 2/3/4 options at levels 1/2/3 and the answer is among them; no narration segment teaching content is `pt-BR` (content segments are `en-US`); `nextLevel` streak rules; session with an adaptive item resolves to the level given and the farol unit's sessions are unchanged. Run → FAIL.
- [ ] **Step 2:** Implement schema, bank, builder, script, level, session/StopFlow resolution (StopFlow keeps a `LevelRun` started from `profile.islands.descoberta.letras.levels[unitId] ?? startLevel(profile)` and saves the final level through `setLevel` when the stop ends). Write song lyrics (alphabet A–M, N–Z; galho 3 "B is for ball" chant; galho 4 spelling chant "D-O-G, dog") and 4 short stories (3 pages each, `tree-room`, figures from the unit) as bank data the builder emits. Run `npm run content:letras`.
- [ ] **Step 3:** All checks green (the units are registered but `hasContent: false`, so nothing shows yet). Commit `feat(letras): activity bank, unit builder and adaptive level`.

### Task 5: Voices and songs

**Files:**
- Modify: `tools/audio/lines.json` (via `npm run audio:lines`), `public/audio/*.mp3`, `public/audio/song-letras-{1..4}.mp3`, `tools/audio/chant.py` (accept a unit id)
- Create: `tests/domain/letras/audio.test.ts`

**Interfaces:**
- Consumes: `allNarrations()` (now includes the letras units).
- Produces: an MP3 for every segment of every letras narration; four songs.

- [ ] **Step 1:** Test `audio.test.ts`: for every segment of every narration of `letras-1..4`, `public/audio/{segmentId}.mp3` exists; the four songs exist. Run → FAIL.
- [ ] **Step 2:** `npm run audio:lines`; `tools/audio/.venv/bin/python tools/audio/generate_eleven.py --jobs 3`; `verify.py`; fix every line in `review.md` (regenerate with another seed, or reword the narration in the bank and rebuild). English letter names must be heard as names ("bee", "see", "double-u"): spot-check A–Z by listening to the transcription in `review.md`. Never ask for secrets: the key comes from the proxy.
- [ ] **Step 3:** `chant.py letras-1` … `letras-4` → songs. All checks green. Commit `feat(audio): voices and songs for the Árvore das Letras`.

### Task 6: Tree interior and stop routing by area

**Files:**
- Create: `src/world/arvore-interior.ts`, `src/app/arvore/page.tsx`, `src/components/arvore/ArvoreScreen.tsx`, `src/components/arvore/arvore.css`, `src/domain/letras/access.ts`
- Modify: `src/components/trail/kit/Backdrop.tsx` (variant `"arvore"`), `src/app/parada/[unitId]/[stopSlug]/StopScreen.tsx` (quit and locked → `/arvore` for letras units, `/farol` otherwise; landing context per unit), `src/components/nestoy/stop-exit.ts` or wherever `stopExitHref` lives
- Test: `tests/world/arvore-interior.test.ts`, `tests/domain/letras/access.test.ts`, `tests/components/arvore/ArvoreScreen.test.tsx`, `tests/app/stop-exit.test.ts`

**Interfaces:**
- Consumes: `startBranch` (Task 3), units (Task 4), `StageView`/`NinoCard` (existing), camera helpers.
- Produces:
  - `buildArvoreInterior(): string` + `ARVORE_LANDINGS: { unit: 1|2|3|4; stop: number; x: number; y: number }[]` (24 platforms on 4 branches spiralling up) + `ARVORE_DOOR`; gradient ids prefixed `ai-`.
  - `unitOpen(p: Progress, profile: Profile, n: 1|2|3|4): boolean` — `n <= startBranch(profile)` or `letras-(n-1)/challenge` is done; a done stop's unit is always open.
  - `/arvore`: like `/farol` — camera on the current branch, current stop glows, closed branches show a sprout (no lock icon, no red), tapping a landing opens `/parada/letras-N/<slug>`; "×" → `/`.

- [ ] **Step 1:** Tests: interior builder deterministic, 24 landings, colours from the bible only; `unitOpen` table (start 1: unit 2 closed until `letras-1/challenge`; start 3: units 1–3 open; profile changed from start 3 to 1 after finishing a stop in unit 3 → unit 3 still open); ArvoreScreen shows 4 branches with `data-open`, opens the current stop, sprout on closed ones; stop exit from a letras stop: quit → `/arvore`, done → `/?volta=letras-N/<slug>`, replay → `/`. Run → FAIL.
- [ ] **Step 2:** Implement following the farol's structure and the bible. Captures (390×844, 1024×768, 844×390) into `.superpowers/sdd/2026-11-26-arvore-das-letras/t6/` with a seeded profile at start 1 and 3; look; fix.
- [ ] **Step 3:** All checks green. Commit `feat(arvore): the tree interior with four branches`.

### Task 7: The tree on the island, return, ninho

**Files:**
- Modify: `src/world/island.ts` (letras "pronto" with levels 1–4: plain crown; letter-fruits; birds + lanterns at night; flowers), `src/domain/nestoy/island-view.ts` (`LAUNCH_STATES.letras = "pronto"`, `arvoreLevel`, `nestThreads` per area, `suggestedPlace` across areas), `src/components/island/IslandScreen.tsx` + `flows.ts` + `return.ts` (enter the tree, return focused on the tree), `src/components/ninho/NinhoScreen.tsx` (section "Árvore das Letras"), `content/path.json` (`hasContent: true`), `README.md`
- Test: `tests/domain/nestoy/island-view.test.ts`, `tests/components/island/return.test.ts`, `tests/world/island.test.ts`, `e2e/arvore.spec.ts`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `arvoreLevel(p: Progress, units: Unit[]): 1|2|3|4` — sum over the 4 units: ≥18 → 4, ≥9 → 3, ≥3 → 2, else 1; `arvoreLevelBefore(p, units, stopId)`.
  - `nestThreads(p, areas: { farol: Unit; letras: Unit[] }): number` — one per area with any stop done.
  - `suggestedPlace(p, areas, today, lastPlayed: Partial<Record<"farol"|"letras", string>>): "farol" | "arvore" | "ninho"` — among areas with a current stop, the least recently played; unchanged within a day until a stop is completed.
  - `returnPlan` accepts a letras stop id and returns `{ place: "farol" | "arvore", from, to, newThread, sticker }`.

- [ ] **Step 1:** Tests: level thresholds (2, 3, 9, 18 stops); threads (farol only → 1, both → 2); suggestion rules; return for a first letras stop → new thread, tree focus; replay of a done letras stop → no growth/thread; island SVG for each tree level contains its marker class (`.arvore-l2` letter-fruits, etc.); e2e `arvore.spec.ts`: seeded profile (skipped cadastro, english "none") → island → tap the tree → enter → `letras-1/song` … finish `letras-1/lesson-1` with one wrong then right answer → back on the island focused on the tree, coral thread in the nest → `/ninho` shows the section. Run → FAIL.
- [ ] **Step 2:** Implement. Full journey captures at 390×844, 1024×768, 844×390, 768×1024 into `.superpowers/sdd/2026-11-26-arvore-das-letras/t7/`; look at each next to the farol equivalents; fix. README: the tree, the cadastro, `npm run content:letras`.
- [ ] **Step 3:** All checks green. Commit `feat(ilha): the Árvore das Letras opens on the island`.

### Task 8: Validation and polish

**Files:**
- Modify: any file a finding requires; `tools/visual/screens.cjs` (add `/arvore`, cadastro states)

- [ ] **Step 1:** Production build journey (`npm run build`, `npx next start`): first open → cadastro → opening → island → tree → one stop of each kind in galho 1 → return → ninho → parents "Criança" → change english to "alphabet" → tree suggests galho 3. Videos at 390×844 and 1024×768, with and without reduced motion; look at frames; list and fix every defect.
- [ ] **Step 2:** axe-core on cadastro, `/arvore`, one letras lesson: no violations except the documented Ruling 2 contrast; no long task > 100 ms on `/arvore` entry.
- [ ] **Step 3:** All checks green. Commit `chore(arvore): validation fixes`; push. Then the controller runs the final whole-branch review.
