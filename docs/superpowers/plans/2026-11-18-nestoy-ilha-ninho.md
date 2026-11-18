# NESTOY Ilha-Ninho Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild NESTOY as the approved Ilha-Ninho experience: animated opening in the nest, explorable island home, Farol das Línguas with the real unit 1 on its staircase, activities and rewards in the new visual, nest and parents area, all on the existing domain and audio.

**Architecture:** The world is drawn by pure TypeScript functions that return SVG strings (ported from the approved prototype `tools/visual/ilha/src/*.js`) and driven by an imperative stage engine (deterministic timeline, 4-layer camera through `viewBox`, Nino rig in parts) mounted inside client components; React never re-renders per frame. New preferences live in `lingoo:settings:v1`; progress v3 is unchanged.

**Tech Stack:** Next.js 16.4 App Router (read `node_modules/next/dist/docs/` before writing Next code — AGENTS.md), React 19.3, TypeScript strict, Tailwind v4 + plain CSS, Vitest + jsdom + Testing Library, Playwright (Chromium at `/opt/pw-browsers/chromium`, never `playwright install`, always `--trace off`).

**Spec:** `docs/superpowers/specs/2026-11-18-nestoy-ilha-ninho-design.md` (read it whole before each task). Approved reference: `tools/visual/ilha/` (prototype code — the behaviour and the drawing to port), `docs/arte/ilha-ninho/*.webp` (approved stills: `ab-*` opening, `ilha-*` island, `ex-*` exploration, `in-*` interior, `at-*` activity, `gr-*` growth, `no-*` night, `responsaveis`, `pausa`, `poses`).

## Global Constraints

- Every user-visible string in pt-BR; the name is always written **NESTOY**.
- Colours only from `src/styles/tokens.css` (UI) or `src/world/palette.ts` (world art); `#FF9F43` only in Nino's art; never a red for errors.
- Touch targets ≥ 64 px; answer cards ≥ 120 px; contrast AA for text.
- Only `transform`/`opacity`/`viewBox`/SVG attributes animate; `prefers-reduced-motion: reduce` **or** settings `motion: "reduzir"` → no camera travel, no parallax, no jumps (Nino blinks only), crossfades ≤ 400 ms.
- No new npm dependencies.
- Do not change `src/domain/trail/**` behaviour or the progress v3 format; storage keys stay `lingoo:*`.
- Nino's shapes and colours must stay identical to `src/art/Cat.tsx` (rig = same paths in parts).
- Each task ends green: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run e2e -- --trace off`; kill stale `next start`/`next-server` processes before e2e or captures.
- Each task with UI: real screenshots at 390×844 and 1024×768 (plus 844×390 and 768×1024 when layout changes) saved under `.superpowers/sdd/2026-11-18-ilha-ninho/<task>/` and looked at next to the approved stills; fix what looks off before reporting.
- Commits: stage specific files only; end messages with the attribution lines given in the controller's brief; push to `origin redesenho-trilha`.

## Review Focus

- **Returning mid-flow:** leaving a stop with "×", the browser back button, or reloading `/farol` or `/` must never replay the full opening nor lose progress; `?volta=` with an unknown or not-completed stop id must open the island normally (owner: Task 8).
- **Viewport changes:** rotating phone/tablet or resizing while on the island or in the farol must re-fit the camera without cropping the island or stranding pins off-screen (owners: Tasks 6, 7, 8).
- **Storage unavailable or corrupt:** `localStorage` throwing or holding garbage for `lingoo:settings:v1` must fall back to defaults without crashing; the opening then counts as not seen (owner: Task 5).
- **Audio blocked before a gesture:** the full opening must play silently and still reach the island when audio is locked (no tap yet); voice lines must not stack when the child taps quickly (owners: Tasks 4, 8).
- **Night by routine across midnight:** bedtime 19:30 → night from 19:30 to 06:00 including after midnight; "Sempre dia" never shows night (owner: Task 5).

---

### Task 1: Foundation — bible tokens, fonts, grain, brand, kit restyle

**Files:**
- Modify: `src/styles/tokens.css`, `src/app/globals.css`, `src/app/layout.tsx`, `public/manifest.webmanifest`, `src/components/trail/kit/*.tsx`, `src/components/trail/kit/kit.css`, every screen still using `NightSky` (`src/app/page.tsx`, `TrailMap.tsx`, `StopFlow.tsx`, `SongStop.tsx`, `StoryStop.tsx`, `ChestReward.tsx`, `ExerciseShell.tsx`, `memory/MemoryHome.tsx`, `memory/MemoryRound.tsx`)
- Create: `src/components/trail/kit/Backdrop.tsx`, `src/art/brand/Wordmark.tsx`, `src/art/brand/NestMark.tsx`, `public/brand/nestoy-wordmark.svg`, `public/brand/nestoy-mark.svg`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/maskable-512.png`, `src/app/apple-icon.png`, `src/app/icon.svg`, `tools/visual/brand/render-icons.cjs`
- Delete: `src/components/trail/kit/NightSky.tsx`, `src/components/trail/kit/night-sky.css`, `tests/components/trail/night-sky.test.tsx`, `src/app/favicon.ico`, `public/icon.svg`
- Test: `tests/styles/tokens.test.ts`, `tests/components/trail/kit.test.tsx`, `tests/art/brand.test.tsx`

**Interfaces:**
- Produces tokens (exact names/values): `--sky-top #7CC4EE`, `--sky-mid #CDEBF8`, `--sky-low #FFEFD9`, `--cream #FFF8EC`, `--paper #FFFDF8`, `--cocoa #3A2618`, `--cocoa-2 #8A6A50`, `--line rgba(58,38,24,.12)`, `--edge rgba(58,38,24,.14)`, `--area-letras #FF7A5C`, `--area-numeros #F5B12E`, `--area-cores #A57BEA`, `--area-linguas #2E9FD8`, `--area-linguas-dark #2384B5`, `--area-mundo #2EB8A4`, `--area-ninho #C98A4B`, `--success #5DB55A`, `--success-dark #3E8E3E`, `--success-bg #E8F6E2`, `--retry #F2A93B`, `--retry-bg #FFF1DA`, `--hint #FFC94A`, `--night-ui #1B2259`, `--r-1 12px`, `--r-2 20px`, `--r-3 24px`, `--r-4 28px`, `--r-pill 999px`, `--fs-display 34px`, `--fs-title 22px`, `--fs-sub 19px`, `--fs-body 15px`, `--fs-caption 13px`, `--font-display` (Fredoka), `--font-body` (Nunito), keep `--t-tap 90ms`, `--t-quick 160ms`, `--t-base 240ms`, `--t-slow 420ms`, `--ease-out`, `--ease-spring`, spacing `--sp-1..--sp-10`.
- Produces `<Backdrop variant="sky" | "interior" | "night" />` (full-bleed background + grain overlay; `interior` = warm stone `#EFE5D3` with a soft vignette, used behind stops until Task 9 replaces it), `<Wordmark className? />`, `<NestMark size />`.
- Kit keeps its props and accessibility (`aria-label`, `data-testid`, `data-*` used by tests); `ChunkyButton` tone union becomes `"ok" | "area" | "cream"` (`area` reads `--tone`, `--tone-dark` from the parent).

- [ ] **Step 1:** Rewrite `tests/styles/tokens.test.ts` to assert every token above with its exact value, that `--retry` is not red (green/red channel ratio > 0.55, as today), and that `globals.css` imports tokens before `kit.css`. Run `npx vitest run tests/styles/tokens.test.ts` → FAIL.
- [ ] **Step 2:** Rewrite `tokens.css` (and mirror the colours in the Tailwind `@theme` in `globals.css`); add `.k-grain` (fixed, `pointer-events:none`, the feTurbulence data-URI grain from `tools/visual/ilha/src/proto.css` `#grain`, `mix-blend-mode:multiply`, opacity .5). Tests pass.
- [ ] **Step 3:** Fonts: in `layout.tsx` replace Baloo 2 with `Fredoka` (weights 500, 600, 700) via `next/font/google`, keep Nunito (700, 800, 900); `themeColor "#7CC4EE"`; body background `var(--sky-mid)`; metadata `icons` from the new files.
- [ ] **Step 4:** Brand: copy `tools/visual/ilha/logo/nestoy-wordmark.svg` and `nestoy-mark.svg` to `public/brand/`; write `render-icons.cjs` (Playwright, rasterizes the mark centred at 86% on `#FFF6E8`: 192, 512, apple 180; maskable 512 with the mark at 62% on `#FFF6E8`); `src/app/icon.svg` = the mark on a rounded `#FFF6E8` square. Manifest: name/short_name "NESTOY", `background_color "#FFF8EC"`, `theme_color "#7CC4EE"`, the PNG icons (+ `purpose: "maskable"`).
- [ ] **Step 5:** `tests/art/brand.test.tsx`: `Wordmark` renders an `svg` with `role="img"` and `aria-label="NESTOY"`; `NestMark` renders with the given size. Implement both by inlining the SVG files' markup (no network). Pass.
- [ ] **Step 6:** Kit restyle to the bible (reference: `tools/visual/ilha/src/proto.css` — `.rb`, `.b-card`, `.bubble`, `.ans`, `#sheet`, `.bigBtn`, `.lampbar`, `.chip`): cream surfaces, cocoa text, bottom-edge buttons, `FeedbackSheet` green (`--success-bg`) for correct and `--retry-bg` for retry with a slot for Nino, `LessonTopBar` = round "×" + lamp segments when `count`/steps ≤ 8 else a rope bar, `AnswerTile` paper card with `--edge` bottom edge. Update `kit.test.tsx` only where structure changed (state why in the commit). Pass.
- [ ] **Step 7:** Replace every `NightSky` with `Backdrop` (`sky` on start/map/memory home, `interior` on stop screens), delete NightSky files and test. Full suite + tsc + lint + build + e2e green.
- [ ] **Step 8:** Captures (start, map, lesson question, correct sheet, memory home) at 390×844 and 1024×768; look; fix.
- [ ] **Step 9:** Commit `feat(design): Ilha-Ninho bible tokens, Fredoka, grain, NESTOY brand and kit restyle` and push.

### Task 2: Nino rig and the `<Nino>` component everywhere

**Files:**
- Create: `src/art/nino/rig.ts`, `src/art/nino/poses.ts`, `src/art/nino/Nino.tsx`, `src/art/nino/nino.css`
- Modify: every screen rendering `<Cat>` for the guide (`ExerciseShell.tsx`, `StopFlow.tsx`, `SongStop.tsx`, `memory/MemoryHome.tsx`, `memory/MemoryRound.tsx`, `src/app/page.tsx`, `TrailMap.tsx`, `kit/FeedbackSheet.tsx`); `StoryScene.tsx` keeps `Cat` (illustration)
- Test: `tests/art/nino.test.tsx`

**Interfaces:**
- Consumes: `narrator.onSpeakingChange(listener): () => void` from `@/audio/narrator`.
- Produces:
  - `rig.ts`: `ninoMarkup(): string`; `type NinoState` (fields of `st` in `tools/visual/ilha/src/nino.js`); `createNinoRig(parent: SVGElement, init?: Partial<NinoState>): NinoRig` with `NinoRig = { el: SVGGElement; st: NinoState; render(t: number, reduced: boolean): void }`.
  - `poses.ts`: `ARM` (the arm table from nino.js), `type NinoPose = "sleep" | "idle" | "happy" | "point" | "help" | "wave" | "stretch" | "listen"`, `poseState(p: NinoPose): Partial<NinoState>`, `type NinoReaction = "correct" | "retry" | "hint" | "celebrate" | "tap" | "greet" | "locked"`.
  - `Nino.tsx` (client): `<Nino pose={NinoPose} size={number} speaks?={boolean} reaction?={{ kind: NinoReaction; n: number }} className? />` — owns an `<svg viewBox="-30 -40 260 300" role="img" aria-label="Nino">`, a rAF loop driving `rig.render`, `talking` while `speaks` and the narrator is speaking, reactions ≤ 1400 ms returning to `pose` (a new `n` restarts), static pose under reduced motion.

- [ ] **Step 1:** Tests: (a) the idle rig contains every `d`/`cx,cy,rx,ry` of `renderToStaticMarkup(<Cat expression="idle" />)` body, ears, head, muzzle, eyes, nose (same drawing); (b) `poseState("happy")` gives `eyes:"happy"`, `mouth:"big"`, both arms `ARM.upL/upR`; (c) `<Nino speaks>` sets `data-talking="true"` while a fake narrator listener reports speaking and `"false"` after; (d) a `reaction` sets `data-reaction` to its kind and clears after 1400 ms with fake timers; (e) with `matchMedia('(prefers-reduced-motion: reduce)')` true the root has `data-reduced="true"`. Run → FAIL.
- [ ] **Step 2:** Port `tools/visual/ilha/src/nino.js` to `rig.ts`/`poses.ts` (typed, same numbers); write `Nino.tsx`. Tests pass.
- [ ] **Step 3:** Replace guide `<Cat>` usages with `<Nino>` (instruction: `speaks`; feedback correct: `pose="happy"` + `reaction correct`; retry: `pose="help"`; opening/closing: `wave`/`happy`). Keep `data-testid`s. Update tests that queried `.art-cat` only where needed.
- [ ] **Step 4:** Full checks; captures of lesson question/retry/correct; look at the cat next to `docs/arte/ilha-ninho/poses.webp`; commit `feat(nino): the approved cat as a rig with poses, voice-synced mouth and reactions`; push.

### Task 3: World drawing as pure TypeScript

**Files:**
- Create: `src/world/palette.ts`, `src/world/shapes.ts`, `src/world/island.ts`, `src/world/farol-interior.ts`
- Test: `tests/world/island.test.ts`, `tests/world/farol-interior.test.ts`

**Interfaces:**
- Produces:
  - `palette.ts`: `PAL` (all keys of `PAL` in `tools/visual/ilha/src/world.js`), `AREA` (`letras|numeros|cores|linguas|mundo|ninho` → spec colours).
  - `shapes.ts`: `rng, smooth, blob, shadowAt, puff, tree, bush, rock, flower, tuft, mushrooms, cloud, islet, butterfly` (same signatures/numbers as world.js).
  - `island.ts`: `type PlaceId = "ninho" | "farol" | "letras" | "numeros" | "cores" | "lago"`; `type PlaceState = "pronto" | "obra" | "futuro"`; `type IslandStates = { letras: PlaceState; numeros: PlaceState; cores: PlaceState; lago: PlaceState }`; `buildIsland(o: { states: IslandStates; threads: number }): { far: string; mid: string; island: string; near: string }`; `ROUTES` (`farol|letras|numeros|jardim|lago` → path `d`, the final values in `tools/visual/ilha/src/world.js`); `NEST = { x: 500, y: 1040, dy: -190 }`; `PLACE_ANCHORS: Record<PlaceId, { x: number; y: number }>` (pin anchors: ninho 500,786 · farol 876,862 · letras 240,556 · numeros 756,806 · cores 240,1100 · lago 640,1306); `FAROL_DOOR = { x: 862, y: 1136 }`.
  - Element ids/classes inside the island string (the engine relies on them): `#slotNest`, `#slotActors`, `#nightGrade`, `#lights`, `#poolNino`, `#beam`, `#farol`, `#farol-lamp`, `.pennant[data-i]`, `#barco`, `.thread[data-i]`, `.hammer`, `.sprout`, `#route-<id>`, `.bfly`, `.ff`, `.sway`, `.drift`, `.bob`, `.dangle`, `.lantern-swing`, `.ripple`; in `far`: `#sun`, `#moon`, `#stars`.
  - `farol-interior.ts`: `buildFarolInterior(): string` (ids `#slotInterior`, `#bigLamp`, `#bigLampGlow`, `.stop[data-i]` with `.stop-halo`, `.stop-face`, `.stop-icon`, `.stop-done`; gradient ids prefixed `fi-` so they never clash with the island's), `FAROL_LANDINGS` (the 6 `{x,y}` of `FAROL_STOPS` in interior.js), `FAROL_INTERIOR_DOOR = { x: 500, y: 2390 }`.

- [ ] **Step 1:** Tests: `buildIsland` is deterministic (same output twice); contains each id above; `letras:"obra"` contains `class="obra"` and `numeros:"futuro"` contains `class="sprout"`; `threads: 2` renders exactly 2 `.thread` without `opacity="0"`; `ROUTES` has the 5 keys and each `#route-*` exists in the string; `buildFarolInterior` has 6 `.stop` and no `id="glowGrad"`. Run → FAIL.
- [ ] **Step 2:** Port `world.js` and `interior.js` (final versions in `tools/visual/ilha/src/`) to typed modules, keeping every number. Tests pass.
- [ ] **Step 3:** Commit `feat(world): the Ilha-Ninho drawing as pure SVG builders`; push.

### Task 4: Stage engine (timeline, camera, world runtime)

**Files:**
- Create: `src/world/timeline.ts`, `src/world/camera.ts`, `src/world/stage.ts`
- Test: `tests/world/timeline.test.ts`, `tests/world/camera.test.ts`, `tests/world/stage.test.ts`

**Interfaces:**
- Consumes: Task 3 builders and ids; Task 2 `createNinoRig`, `poseState`, `ARM`.
- Produces:
  - `timeline.ts`: `type Ease = "lin" | "io" | "out" | "in" | "sine" | "back" | "soft" | "cam"` (formulas in `EASE` of `tools/visual/ilha/src/app.js`); `createTimeline(): Timeline`; `Timeline = { now(): number; step(t: number): void; tween<T extends object>(obj: T, to: Partial<Record<keyof T, number | number[]>>, ms: number, ease?: Ease, opts?: { delay?: number; onUpdate?: (e: number) => void }): Promise<void>; wait(ms: number): Promise<void>; cancelAll(): void; generation(): number }` — `cancelAll` drops pending tweens/waits (their promises never resolve) and bumps `generation()`.
  - `camera.ts`: `type Cam = { X: number; Y: number; D: number }`; `type Viewport = { w: number; h: number; top: number; bottom: number }` (top/bottom = UI insets in px); `LAYER_K = { far: 2, mid: 0.8, island: 0, near: -0.12 }`; `ppu(cam, vp)` = `(vp.w / 1000) / cam.D` for portrait, using `min(vp.w, vp.h * 0.75)` instead of `vp.w` when `vp.w > vp.h`; `layerViewBox(cam, k, vp): [number, number, number, number] | null` (null when `cam.D + k <= 0.02`); `toScreen(cam, x, y, vp): [number, number]`; `overviewCam(vp): Cam` (fits x 60–940 and y 540–1880 between `top` and `bottom` with 12 px side margins; at 390×844 with top 108, bottom 150 → D within 0.85–0.95); `nestCloseCam(vp): Cam` (nest centre 500,850 at 63% of the height, D 0.22 at 390 px wide); `farolCloseCam(vp): Cam` (X 790, Y 1080, D 0.36 at 390); `focusCam(anchor, vp): Cam` (`X: 500 + (x-500)*0.7`, `Y: y + 230`, `D: 0.55` at 390); `lerpCam(a, b, e): Cam` (D in log space; X/Y with `EASE.soft(min(1, e*1.15))` and a 60-unit upward arc `sin(e·π)`).
  - `stage.ts`: `createStage(host: HTMLElement, o: { scene: "island" | "farol"; states: IslandStates; threads: number; farolLevel: 1 | 2 | 3 | 4; reduced: boolean; clock?: "raf" | "manual" }): Stage` with `Stage = { tl: Timeline; cam: Cam; nino: NinoRig; env: { night: number; farolLevel: number; reduced: boolean }; fx: { pennant: number[]; boatX: number; thread: number[]; lampPulse: number; hammerFast: boolean; wiggle: Partial<Record<PlaceId, number>> }; setViewport(vp: Viewport): void; frame(t: number): void; screenOf(x: number, y: number): [number, number]; moveNino(slot: "nest" | "actors" | "interior"): void; walk(route: keyof typeof ROUTES, reverse?: boolean): Promise<void>; onFrame(cb: (t: number) => void): () => void; destroy(): void }` — port of the runtime parts of `app.js` (`applyCam`, `renderWorld`, Nino slots and `NEST.dy` conversion with immediate re-render on reparent, light pools, butterflies, sky gradient day→night, ambient loops off when `reduced`). In `"manual"` clock nothing advances until `frame(t)`; `"raf"` drives itself. `walk` uses `getTotalLength`/`getPointAtLength` when present and a straight line between the route ends otherwise (jsdom).

- [ ] **Step 1:** Tests: timeline — tween reaches target exactly at `ms`, `wait` resolves at the right step, `cancelAll` stops a running tween and its promise stays pending, `back` overshoots above 1 mid-way; camera — `layerViewBox` for island at overview has width `vp.w / ppu`, `null` for near layer at D 0.1, `overviewCam({w:390,h:844,top:108,bottom:150}).D` in [0.85, 0.95], landscape 844×390 keeps the island fully inside (left of x=60 and right of x=940 project inside 0..844), `lerpCam(a,b,0.5).D === sqrt(a.D*b.D)` (±1e-9); stage (jsdom, manual clock) — `frame(0)` sets the island SVG `viewBox`, `env.night = 1` + `frame` sets `#nightGrade` opacity 0.62, `moveNino("actors")` keeps the rig's world position (y local − 190), `walk("farol")` resolves after the route duration and leaves Nino at the route end. Run → FAIL.
- [ ] **Step 2:** Implement the three modules. Tests pass.
- [ ] **Step 3:** Commit `feat(world): deterministic timeline, parallax camera and the stage runtime`; push.

### Task 5: Settings, island view and new audio

**Files:**
- Create: `src/domain/nestoy/settings.ts`, `src/domain/nestoy/island-view.ts`, `src/components/nestoy/SettingsProvider.tsx`, `src/audio/ambience.ts`, `public/audio/ambient/day.mp3`, `public/audio/ambient/night.mp3`, `public/audio/sfx/{reveal,yawn,stretch,pop,steps,bell,blocks,pages,water,leaves,obra,dive,grow,thread,night}.mp3`, `public/audio/<id>.mp3` for each new line
- Modify: `src/app/layout.tsx` (mount `SettingsProvider`), `content/lines.json`, `src/domain/trail/schema.ts` (lines schema only), `src/audio/narrator.ts` (`SfxName` union only), `tools/audio/lines.json` (regenerated by `npm run audio:lines`)
- Test: `tests/domain/nestoy/settings.test.ts`, `tests/domain/nestoy/island-view.test.ts`, `tests/audio/ambience.test.ts`, `tests/content/audio-complete.test.ts`

**Interfaces:**
- Produces:
  - `settings.ts`: `type Ambient = "dia" | "rotina" | "noite"`; `type Settings = { version: 1; ambient: Ambient; bedtime: string; pauseMinutes: 0 | 15 | 20 | 30; opening: "auto" | "curta"; motion: "auto" | "reduzir"; openingSeen: boolean; lastVisit: string | null }`; `SETTINGS_KEY = "lingoo:settings:v1"`; `defaultSettings()` (ambient "dia", bedtime "19:30", pauseMinutes 0, opening "auto", motion "auto", openingSeen false, lastVisit null); `openingMode(s, now: Date, prefersReduced: boolean): "full" | "short" | "none" | "reduced"` (reduced if `motion==="reduzir"` or prefersReduced; else full if `!openingSeen && opening==="auto"`; else none if `lastVisit` is the same local day as `now` (use `dateKey` from progress); else short); `isNight(s, now): boolean` (noite → true; dia → false; rotina → local HH:MM ≥ bedtime or < "06:00"); `pauseDue(s, sessionStartMs, nowMs): boolean`; `createSettingsStore(storage: Storage | null): { load(): Settings; save(s: Settings): void }` (missing/corrupt/throwing → defaults; never throws); `useSettings()` hook in `src/components/nestoy/SettingsProvider.tsx` → `{ settings, update(patch: Partial<Settings>): void, hydrated: boolean }`, provider mounted in `layout.tsx`.
  - `island-view.ts`: `LAUNCH_STATES: IslandStates = { letras: "obra", numeros: "futuro", cores: "futuro", lago: "futuro" }`; `farolLevel(p: Progress, unit: Unit): 1 | 2 | 3 | 4` (done stops of the unit: 0→1, 1–2→2, 3–5→3, all→4); `levelBefore(p, unit, stopId): 1|2|3|4` (same with that stop removed); `nestThreads(p, unit): number` (1 when any stop of the unit is done — the Línguas thread — else 0); `suggestedPlace(p, unit, today: string): "farol" | "ninho"` ("ninho" when `dueCards(p.memory, today).length > 0` and the farol has no current stop, else "farol").
  - New `Lines` keys (pt-BR, text exact): `ninoHello` "Oi! Eu sou o Nino.", `ninoExplore` "Vem! Vamos explorar a ilha!", `placeFarol` "Esse é o Farol das Línguas!", `farolClimb` "Vamos subir a escada do farol?", `placeBuilding` "Esse lugar ainda está sendo construído. Logo fica pronto!", `farolGrew` "Olha! O farol brilhou mais forte!", `nestSaved` "Guardei a sua figurinha no ninho.", `goodnight` "Boa noite! Amanhã a gente brinca mais.", `pauseSuggest` "Que tal uma pausa? Vou esticar as patinhas." (each a one-segment narration). Audio: the recorded files in `tools/visual/ilha/sons/` (`v_oi`, `v_vem`, `v_farol`, `v_subir`, `v_obra`, `v_brilhou`, `v_ninho`, `v_noite`, `v_pausa`, same voice and normalisation as the app) copied to `public/audio/<segmentId>.mp3`.
  - `SfxName` adds `"whoosh" | "celebrate" | "reveal" | "yawn" | "stretch" | "pop" | "steps" | "bell" | "blocks" | "pages" | "water" | "leaves" | "obra" | "dive" | "grow" | "thread" | "night"`.
  - `ambience.ts`: `createAmbience(deps?: { createAudio?: (src: string) => HTMLAudioElement; isEnabled?: () => boolean }): { play(kind: "day" | "night"): void; stop(): void; current(): "day" | "night" | null }` — loops `/audio/ambient/<kind>.mp3` at volume 0.35, 1500 ms crossfade, silent when the music toggle is off (`music.isEnabled()` by default); `ambience` singleton.

- [ ] **Step 1:** Tests for settings (each `openingMode` branch; `isNight` at 19:29 → false, 19:30 → true, 00:30 → true, 05:59 → true, 06:00 → false for rotina 19:30; "dia" at 23:00 → false; store with throwing storage and with `"{bad"` → defaults), island-view (levels 0/1/2/3/5/6 done → 1/2/2/3/3/4; `levelBefore` of the 1st done stop → 1; `nestThreads`), ambience (fake audio: crossfade day→night, `stop`, disabled toggle → nothing plays), audio completeness (add the new sfx and the two ambient files to the existence check). Run → FAIL.
- [ ] **Step 2:** Implement; add lines + schema keys; copy audio; `npm run audio:lines`. Tests pass.
- [ ] **Step 3:** Commit `feat(nestoy): settings, island view, ambience and Nino's new lines`; push.

### Task 6: Farol das Línguas interior (`/farol`)

**Files:**
- Create: `src/app/farol/page.tsx`, `src/components/farol/FarolScreen.tsx`, `src/components/nestoy/StageView.tsx`, `src/components/nestoy/NinoCard.tsx`, `src/components/nestoy/nestoy.css`
- Modify: `src/app/parada/[unitId]/[stopSlug]/StopScreen.tsx` (exit targets), `src/components/trail/StopPlayer.tsx`, `SongStop.tsx`, `StoryStop.tsx` (`onExit(reason)`), `e2e/trail.spec.ts`
- Test: `tests/components/farol/FarolScreen.test.tsx`, `tests/app/StopScreen.test.tsx`

**Interfaces:**
- Consumes: Task 4 `createStage({ scene: "farol" })`, Task 3 `FAROL_LANDINGS`, Task 5 `farolLevel`, lines `farolClimb`, `getUnit("forest-animals")`, `stopStatus`, `stopHref`.
- Produces: `<StageView scene="island" | "farol" … onStage={(stage) => …} />` (client; mounts `createStage` in a full-bleed host, wires `ResizeObserver` → `setViewport`, reads reduced motion from settings + media query, destroys on unmount) reused by Tasks 7–9; `<NinoCard title text chip? tone? action? pose speaks />` (bottom card with the Nino portrait, `chip` tones `ok | obra | futuro | noite`, round action button 64 px); stop players call `onExit("done" | "quit")`; `StopScreen`: quit → `/farol` (review → `/revisao`), done → `/?volta=<encodeURIComponent(stopId)>`, locked → `replace("/farol")`.

- [ ] **Step 1:** Tests: FarolScreen renders 6 stop buttons labelled with the stop titles (`Música`, `Lição 1` …, `Desafio`) positioned over the landings; with progress `{song done}` the "Lição 1" button has `data-status="current"`, "Música" `done`, the rest `locked`; tapping the current one calls `router.push("/parada/forest-animals/lesson-1")`; tapping a locked one shows the card text "Primeiro a parada que está brilhando!" and does not navigate; StopScreen: `onExit("done")` → push `/?volta=forest-animals%2Flesson-1`, `onExit("quit")` → `/farol`. Run → FAIL.
- [ ] **Step 2:** Implement `StageView`, `NinoCard`, `FarolScreen` (entry: camera from the door (D 0.5 at the door) up to the current landing (D 0.66) in 1700 ms, Nino walks from the door to the landing, `farolClimb` voice once per visit, card "Farol das Línguas · Unidade 1: Animais da floresta" with chip "N de 6"; top-left round "×" back to `/`; big lamp brightness from `farolLevel`); update stop exits. Tests pass.
- [ ] **Step 3:** e2e: change navigation in `trail.spec.ts` from `/mapa` to `/farol` for stop entry/exit (keep every assertion on progress, audio and memory). Green.
- [ ] **Step 4:** Captures of `/farol` at the four viewports, next to `in-3.webp`; look; fix. Commit `feat(farol): the lighthouse interior with the unit's staircase trail`; push.

### Task 7: Island home — exploration, places, night

**Files:**
- Create: `src/components/island/IslandScreen.tsx`, `src/components/island/Pins.tsx`, `src/components/island/TopBar.tsx`, `src/components/island/flows.ts`
- Modify: `src/app/page.tsx` (renders `IslandScreen`), `src/app/mapa/page.tsx` (redirect to `/`), `e2e/trail.spec.ts`, `tests/app/HomePage.test.tsx`
- Delete: `src/components/trail/TrailMap.tsx`, `trail-map.css`, `kit/StopButton.tsx`, `kit/UnitHeader.tsx`, `kit/BottomNav.tsx`, `kit/TopChips.tsx`, `tests/components/trail/TrailMap.test.tsx` (and their kit tests) once unused
- Test: `tests/components/island/IslandScreen.test.tsx`, `tests/components/island/flows.test.ts`

**Interfaces:**
- Consumes: Tasks 4–6; lines `placeFarol`, `placeBuilding`, `soonUnit`; `useBackgroundMusic("trail")`; `ambience`.
- Produces: `flows.ts` (stage choreography, testable with a manual stage): `focusPlace(stage, id: PlaceId, vp): Promise<void>`, `goToFarol(stage, vp): Promise<void>` (walk + bell + lamp pulse), `diveIntoFarol(stage, vp): Promise<void>` (camera to `FAROL_DOOR` D 0.035 in 1000 ms, fade), `toOverview(stage, vp): Promise<void>`, `setNight(stage, on: boolean, ms: number): Promise<void>`; `IslandScreen` props `{ mode: "explore" }` (opening/return arrive in Task 8).

- [ ] **Step 1:** Tests: pins — 6 buttons with accessible names (`Ninho do Nino`, `Farol das Línguas`, `Árvore das Letras`, `Torre dos Números`, `Jardim das Cores`, `Lago das Descobertas`), letras pin has `data-state="obra"`, numeros `futuro`; tapping letras shows card chip "Em construção" and plays `placeBuilding`; tapping numeros shows "Em breve" and plays `soonUnit`; tapping farol shows chip "Pronto", then the action "Entrar no farol", which pushes `/farol` after `diveIntoFarol`; tapping ninho pushes `/ninho`; top bar "Área dos responsáveis" pushes `/responsaveis`; with settings ambient "noite" the stage gets `env.night === 1`; flows (manual stage): `focusPlace` ends at `focusCam`, `toOverview` ends at `overviewCam`. Run → FAIL.
- [ ] **Step 2:** Implement (pins positioned each frame from `stage.onFrame` via `screenOf(PLACE_ANCHORS[id])`, 64 px targets with 46 px medallions and state badges; card texts as in `tools/visual/ilha/src/app.js` `focusPlace`; sky tap → overview; music `trail` + ambience day/night). Tests pass.
- [ ] **Step 3:** `/mapa` → `redirect("/")`; e2e: start at `/`, skip the opening when present (`Pular`) or run with `reducedMotion: "reduce"`, tap the farol pin, "Entrar no farol", continue as before. Delete the old map files. Green.
- [ ] **Step 4:** Captures at the four viewports next to `ilha-dia.webp`, `ex-obra.webp`, `ex-futuro.webp`, `ex-farol.webp`; a 390×844 Playwright video of farol focus → enter (convert with `ffmpeg -c:v libx264 -pix_fmt yuv420p -crf 22`); look at frames; fix. Commit `feat(island): the island home with places, states and exploration`; push.

### Task 8: Opening, return transformation, bedtime and pause

**Files:**
- Create: `src/components/island/opening.ts`, `src/components/island/return.ts`, `src/components/island/Opening.tsx` (logo + skip overlay)
- Modify: `src/components/island/IslandScreen.tsx`, `src/components/island/flows.ts`, `src/app/page.tsx` (reads `volta` search param inside `Suspense`)
- Test: `tests/components/island/opening.test.ts`, `tests/components/island/return.test.ts`, `tests/components/island/IslandScreen.test.tsx`

**Interfaces:**
- Consumes: Task 5 `openingMode`, `isNight`, `pauseDue`, `levelBefore`, `farolLevel`, `nestThreads`, lines `ninoHello`, `ninoExplore`, `farolGrew`, `nestSaved`, `goodnight`, `pauseSuggest`, `start`; sfx `reveal`, `pop`, `yawn`, `stretch`, `grow`, `water`, `thread`, `night`, `steps`.
- Produces: `playOpening(stage, mode: "full" | "short", vp, say: (key) => Promise<void>, sfx): Promise<void>` (timings of `openingFull`/`openingShort`/`revealIsland` in `tools/visual/ilha/src/app.js`; `wakeEarly()` resolves the sleep wait); `skipOpening(stage, vp)`; `playReturn(stage, vp, o: { from: 1|2|3|4; to: 1|2|3|4; newThread: boolean; sticker: boolean }, say, sfx): Promise<void>` (farol close → lamp/pennants/boat when `to > from` + `farolGrew` → Nino walks home → thread + `nestSaved` when `newThread || sticker` → overview); `playBedtime(stage, vp, say, sfx)`; `IslandScreen` modes: opening by `openingMode`, return when `?volta=` names a completed stop of the unit (then `router.replace("/")`), else explore. Settings updates: `openingSeen: true` after a full opening ends or is skipped; `lastVisit = now.toISOString()` on every arrival. Bedtime runs once per evening (sessionStorage `lingoo:bedtime:<dateKey>`), pause reminder when `pauseDue` (session start in sessionStorage `lingoo:session:start`): card "Que tal uma pausa?" with `pauseSuggest` and actions "Pausar" (pause overlay with Nino asleep and "Voltar a brincar") or keep playing.

- [ ] **Step 1:** Tests (manual stage, fake narrator): full opening reaches `overviewCam` and resolves; `skipOpening` lands on overview with pins shown and Nino at the nest front; `wakeEarly` shortens the sleep; return with `{from:1,to:2}` turns pennants 2–3 visible and boat at the dock, `{from:2,to:2}` changes nothing on the farol; `?volta=forest-animals%2Flesson-1` without that stop done opens explore mode; settings after full opening → `openingSeen: true`; reduced → no camera tween (cam jumps to overview), 400 ms fade; bedtime → `env.night === 1`, Nino in the nest slot with `eyes: "closed"`. Run → FAIL.
- [ ] **Step 2:** Implement. Tests pass.
- [ ] **Step 3:** e2e: one new test `opening.spec.ts` — first visit shows "Pular", tapping it reaches the island pins; second visit (same day) has no opening; reduced motion reaches the island within 1 s. Existing flows green.
- [ ] **Step 4:** Videos at 390×844: full opening (no skip), return after a lesson (farol grows, thread), bedtime; frames next to `ab-*.webp`, `gr-*.webp`, `no-*.webp`; look; fix stiffness/off-model. Commit `feat(island): animated opening, the farol growing on return, bedtime and pause`; push.

### Task 9: Activities and rewards in the new visual

**Files:**
- Modify: `ExerciseShell.tsx`, `exercises/*.tsx` (visual only), `StopFlow.tsx` (opening/closing), `StopPlayer.tsx`, `ChestReward.tsx`, `SongStop.tsx`, `StoryStop.tsx`, `kit/FeedbackSheet.tsx`, `kit/LessonTopBar.tsx`, `kit/Backdrop.tsx`
- Test: existing `tests/components/trail/*.test.tsx` (keep behaviour assertions), `tests/components/trail/shell.test.tsx`

**Interfaces:**
- Consumes: `Backdrop variant="farol"` (new: the farol interior SVG from `buildFarolInterior()` static, centred on the current landing, `filter: blur(6px)` + the cream veil of `#veil` in proto.css), `<Nino>` reactions.
- Produces: no new interfaces; stop screens match `at-1..at-4.webp`: × + 6-lamp bar (lit = finished exercises), Nino 104 px + white bubble with the prompt and a 44 px speaker, two/three answer cards 222 px tall, correct = green ring + pop (≤ 380 ms) + sheet rising (460 ms) with Nino cheering, retry = shake 480 ms + Nino `help`; closing = star (spring) + "Você ganhou uma estrela!" + learned words; challenge chest → sticker with white die-cut border and the line "A figurinha vai morar no ninho." then exit `done`.

- [ ] **Step 1:** Update tests that pin structure (state why); add `shell.test.tsx` cases: the lamp bar has 6 lamps with `data-on` count = finished exercises; retry adds `data-reaction="retry"` on the sheet Nino; correct adds `"correct"`. Run → FAIL where new.
- [ ] **Step 2:** Implement (animations through CSS transitions/keyframes are fine here; reduced motion disables them). Tests pass.
- [ ] **Step 3:** e2e green; captures/video of a lesson with a wrong then right answer and the challenge chest at 390×844 and 1024×768 next to `at-*.webp`; look; fix. Commit `feat(stops): activities, feedback and rewards in the Ilha-Ninho visual`; push.

### Task 10: Ninho and the parents area

**Files:**
- Create: `src/app/ninho/page.tsx`, `src/components/ninho/NinhoScreen.tsx`, `src/app/responsaveis/page.tsx`, `src/components/parents/ParentsScreen.tsx`, `src/components/parents/HoldGate.tsx`
- Modify: `src/app/album/page.tsx` (redirect to `/ninho`), `src/app/memoria/page.tsx` + `memory/MemoryHome.tsx`/`MemoryRound.tsx` (visual; exit back to `/ninho`), tests of album/memória pages
- Test: `tests/components/ninho/NinhoScreen.test.tsx`, `tests/components/parents/ParentsScreen.test.tsx`

**Interfaces:**
- Consumes: `StageView scene="island"` parked on `nestCloseCam` (Nino awake in the nest; night if `isNight`), album data (stickers, `legacySection`), memory (`dueCards`, `nextDue`), Task 5 settings + `useSettings().update`, music `album`.
- Produces: `/ninho` — nest close-up on top, a cream sheet with "Figurinhas" (earned with die-cut border, missing as silhouettes, the "Figurinhas especiais" legacy section kept) and "Treino de memória" (count due today, button "Treinar" → `/memoria`, or "Tudo em dia!"); "×" back to `/`. `/responsaveis` — `HoldGate` (button "Segure para entrar", 2000 ms press-and-hold with a progress ring; releasing early resets), then the segments of `responsaveis.webp` (Ambiente, horário de dormir `input type="time"` when "Seguir a rotina", Lembrete de pausa, Abertura + "Rever abertura" (sets `openingSeen: false` and goes to `/`), Movimento) saved through `update`; "Fechar" → `/`.

- [ ] **Step 1:** Tests: ninho lists earned stickers and silhouettes; "Treinar" visible with due cards, "Tudo em dia!" without; parents gate does not open on a 500 ms press and opens after 2000 ms (fake timers); choosing "Noite" saves `ambient: "noite"`; "Rever abertura" saves `openingSeen: false` and pushes `/`; `/album` redirects to `/ninho`. Run → FAIL.
- [ ] **Step 2:** Implement. Tests pass; e2e memory/album flows updated to `/ninho`.
- [ ] **Step 3:** Captures at the four viewports next to `gr-3.webp`, `responsaveis.webp`; look; fix. Commit `feat(ninho): the nest with stickers and memory, and the parents area`; push.

### Task 11: Validation, polish and docs

**Files:**
- Modify: `tools/visual/screens.cjs` (all new routes), `README.md` (NESTOY, Ilha-Ninho, bible, settings), any file a finding requires
- Create: `.superpowers/sdd/2026-11-18-ilha-ninho/final/` captures and videos

- [ ] **Step 1:** Run the whole journey on a production build (`npm run build && npm start`) at 390×844, 1024×768, 844×390, 768×1024, with and without `reducedMotion: "reduce"`; record videos of: first opening → island → farol → lesson (wrong then right) → closing → return (farol grows, thread) → ninho → parents → routine night. Look at frames; list and fix every visual or functional defect.
- [ ] **Step 2:** Performance: on the island, no layout thrash (only `viewBox`/attributes/transform/opacity change per frame); Chrome performance trace of the opening shows no long task > 100 ms after load; images/SVG sizes reasonable.
- [ ] **Step 3:** Accessibility: every control has a name, targets ≥ 64 px, focus visible, text contrast AA.
- [ ] **Step 4:** All checks green; README updated; commit `chore: Ilha-Ninho validation fixes and docs`; push. Then the controller runs the final whole-branch review.
