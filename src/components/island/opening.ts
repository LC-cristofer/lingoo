/* The opening: Nino wakes in the nest, hops out and the camera pulls back to reveal the island.
   Plain async functions over a Stage (testable with a manual clock). Ported from tools/visual/ilha/src/app.js
   (openingFull, openingShort, revealIsland, openingReduced, skipOpening). A caller that interrupts a flow
   calls `stage.tl.cancelAll()`: the cancelled promises never resolve. */
import { ARM, poseState } from "@/art/nino/poses";
import type { NinoState } from "@/art/nino/rig";
import { lerpCam, nestCloseCam, overviewCam, type Viewport } from "@/world/camera";
import type { PlaceId } from "@/world/island";
import type { Stage } from "@/world/stage";
import type { Ease } from "@/world/timeline";
import { blendPose, NEST_FRONT, NINO_ISLAND_SCALE, speakLine, type Say, type Sfx } from "./flows";

const REVEAL_FULL_MS = 4800;
const REVEAL_SHORT_MS = 1700;
const FADE_MS = 400;
const SLEEP_MS = 2600;
/** The order the places pop in while the camera pulls back. */
const POP_ORDER: PlaceId[] = ["ninho", "letras", "numeros", "cores", "lago", "farol"];

export const arm = (a: readonly number[]): number[] => [...a];
const wakes = new WeakMap<Stage, () => void>();

/** Cuts the sleeping wait short (the child tapped the sleeping Nino). No-op when nobody sleeps. */
export function wakeEarly(stage: Stage): void {
  wakes.get(stage)?.();
}

/** Nino standing in front of the nest at the island's scale. */
function standFront(stage: Stage): void {
  stage.moveNino("actors");
  Object.assign(stage.nino.st, poseState("idle"), {
    x: NEST_FRONT.x, y: NEST_FRONT.y, s: NINO_ISLAND_SCALE, facing: 1, lift: 0, alpha: 1, walk: 0, blink: 0, sx: 1, sy: 1, earL: 0, earR: 0, talking: false,
  } satisfies Partial<NinoState>);
}

/** Nino asleep-ready in the nest (also when a run starts over after being cancelled halfway). */
function toNest(stage: Stage): void {
  stage.moveNino("nest");
  Object.assign(stage.nino.st, { x: 500, y: 1070, s: 0.56, facing: 1, lift: 0, alpha: 1, walk: 0, blink: 0, sx: 1, sy: 1, earL: 0, earR: 0, talking: false });
}

/** The final state of any opening: the whole island, every pin shown, Nino in front of the nest, no logo. */
export function showIsland(stage: Stage, vp: Viewport): void {
  Object.assign(stage.cam, overviewCam(vp));
  standFront(stage);
  for (const id of POP_ORDER) stage.fx.pins[id] = 1;
  Object.assign(stage.fx.intro, { logo: 0, skip: 0 });
  stage.fx.hammerFast = false;
  stage.fx.wiggle = {};
  stage.fx.lampPulse = 0;
}

/** No camera, no hops: the island is there at once, under a cream fade that clears in 400 ms. */
function reducedOpening(stage: Stage, vp: Viewport): Promise<void> {
  showIsland(stage, vp);
  stage.fx.intro.fade = 1;
  return stage.tl.tween(stage.fx.intro, { fade: 0 }, FADE_MS, "lin");
}

/** Jumps to the end of the opening (the child tapped "Pular"): cancels what runs and lands on the island. */
export function skipOpening(stage: Stage, vp: Viewport): Promise<void> {
  stage.tl.cancelAll();
  stage.nino.st.talking = false;
  stage.fx.intro.fade = 0;
  return reducedOpening(stage, vp);
}

/** The camera pulls back from the nest to the whole island while the places pop in and answer. */
async function revealIsland(stage: Stage, vp: Viewport, ms: number, sfx: Sfx): Promise<void> {
  const { tl, fx } = stage;
  sfx("reveal");
  const from = { ...stage.cam }, to = overviewCam(vp);
  POP_ORDER.forEach((id, i) => {
    void tl.wait(ms * 0.42 + i * 260).then(() => {
      sfx("pop");
      void tl.tween(fx.pins, { [id]: 1 }, 420, "back");
      if (id === "farol") void tl.tween(fx, { lampPulse: 1 }, 200, "out").then(() => tl.tween(fx, { lampPulse: 0 }, 700, "io"));
      if (id === "letras") { fx.hammerFast = true; void tl.wait(700).then(() => { fx.hammerFast = false; }); }
      if (id === "numeros" || id === "cores" || id === "lago") { fx.wiggle[id] = 1; void tl.wait(500).then(() => { fx.wiggle[id] = 0; }); }
    });
  });
  await tl.tween({ p: 0 }, { p: 1 }, ms, "cam", { onUpdate: (e) => Object.assign(stage.cam, lerpCam(from, to, e)) });
  Object.assign(stage.cam, to);
}

/** Sleeping in the nest, the logo in the sky; he wakes by himself or when the child taps. */
async function openingFull(stage: Stage, vp: Viewport, say: Say, sfx: Sfx): Promise<void> {
  const { tl, fx } = stage, st = stage.nino.st;
  const to = (o: Partial<Record<keyof NinoState, number | number[]>>, ms: number, ease: Ease = "io", delay = 0) => tl.tween(st, o, ms, ease, { delay });
  toNest(stage);
  Object.assign(stage.cam, nestCloseCam(vp));
  for (const id of POP_ORDER) fx.pins[id] = 0;
  Object.assign(st, poseState("sleep"));
  void tl.tween(fx.intro, { logo: 1 }, 1400, "out", { delay: 500 });
  void tl.tween(fx.intro, { skip: 1 }, 500, "out", { delay: 1200 });
  await Promise.race([tl.wait(SLEEP_MS), new Promise<void>((r) => wakes.set(stage, r))]);
  wakes.delete(stage);
  // wake up: an ear twitches, the eyes open, a double blink, a yawn and a stretch, a look at the child
  await to({ earR: -16 }, 140, "out"); await to({ earR: 0 }, 220, "back");
  await tl.wait(250);
  await to({ earL: -12, earR: -10 }, 140, "out"); void to({ earL: 0, earR: 0 }, 260, "back");
  st.eyes = "open"; st.blink = 1;
  await to({ blink: 0, head: 4, breathe: 1 }, 420, "out");
  await tl.wait(200);
  await to({ blink: 1 }, 70, "lin"); await to({ blink: 0 }, 110, "out"); await to({ blink: 1 }, 70, "lin"); await to({ blink: 0 }, 120, "out");
  await tl.wait(240);
  sfx("yawn"); st.mouth = "yawn"; st.eyes = "happy";
  void to({ armL: arm(ARM.stretchL), armR: arm(ARM.stretchR), pawL: 1, pawR: 1, sy: 1.08, sx: 0.95, head: 0 }, 620, "out", 120);
  await tl.wait(400); sfx("stretch"); await tl.wait(700);
  await to({ armL: arm(ARM.downL), armR: arm(ARM.downR), pawL: 0, pawR: 0, sy: 0.96, sx: 1.03 }, 320, "io");
  st.mouth = "smile"; st.eyes = "open";
  await to({ sy: 1, sx: 1, lookY: 2, head: 5 }, 260, "back");
  await tl.wait(250);
  // "Oi! Eu sou o Nino." with a wave
  st.mouth = "big"; void to({ armR: arm(ARM.waveR), pawR: 1 }, 260, "out");
  const waving = (async () => {
    for (let i = 0; i < 4; i++) { await to({ armR: arm(ARM.upR) }, 200, "sine"); await to({ armR: arm(ARM.waveR) }, 200, "sine"); }
  })();
  await speakLine(stage, say, "ninoHello"); await waving;
  void tl.tween(fx.intro, { logo: 0, skip: 0 }, 600, "io");
  // hop out of the nest and invite the child; the camera starts to pull back while he lands
  await to({ armR: arm(ARM.downR), pawR: 0, sy: 0.9, sx: 1.08 }, 180, "out"); st.mouth = "smile";
  stage.moveNino("actors"); sfx("pop");
  const hop = tl.tween(st, { x: NEST_FRONT.x, y: NEST_FRONT.y, sy: 1, sx: 1, s: NINO_ISLAND_SCALE }, 620, "io", { onUpdate: (e) => { st.lift = Math.sin(e * Math.PI) * 46; } });
  const reveal = revealIsland(stage, vp, REVEAL_FULL_MS, sfx);
  await hop; await to({ sy: 0.9, sx: 1.08 }, 90, "out"); await to({ sy: 1, sx: 1 }, 220, "back");
  void blendPose(stage, "point", 300, "out");
  const invite = (async () => { await speakLine(stage, say, "ninoExplore"); await blendPose(stage, "idle", 300, "io"); })();
  await Promise.all([reveal, invite]);
}

/** Awake already: a wave and "Hello!", a hop out of the nest and the camera pulls back. */
async function openingShort(stage: Stage, vp: Viewport, say: Say, sfx: Sfx): Promise<void> {
  const { tl, fx } = stage, st = stage.nino.st;
  const to = (o: Partial<Record<keyof NinoState, number | number[]>>, ms: number, ease: Ease = "io", delay = 0) => tl.tween(st, o, ms, ease, { delay });
  toNest(stage);
  Object.assign(stage.cam, { X: 500, Y: 800, D: 0.3 });
  for (const id of POP_ORDER) fx.pins[id] = 0;
  Object.assign(st, poseState("idle"));
  st.mouth = "big"; void to({ armR: arm(ARM.waveR), pawR: 1 }, 220, "out");
  void speakLine(stage, say, "start"); // keeps talking over the reveal
  for (let i = 0; i < 2; i++) { await to({ armR: arm(ARM.upR) }, 180, "sine"); await to({ armR: arm(ARM.waveR) }, 180, "sine"); }
  void to({ armR: arm(ARM.downR), pawR: 0 }, 200, "out"); st.mouth = "smile";
  stage.moveNino("actors"); sfx("pop");
  void tl.tween(st, { x: NEST_FRONT.x, y: NEST_FRONT.y, s: NINO_ISLAND_SCALE }, 500, "io", { onUpdate: (e) => { st.lift = Math.sin(e * Math.PI) * 40; } });
  for (const id of POP_ORDER) void tl.tween(fx.pins, { [id]: 1 }, 400, "back", { delay: 900 });
  await revealIsland(stage, vp, REVEAL_SHORT_MS, sfx);
  st.talking = false;
}

/** The opening for this visit. Under reduced motion both modes become a 400 ms fade onto the island. */
export function playOpening(stage: Stage, mode: "full" | "short", vp: Viewport, say: Say, sfx: Sfx): Promise<void> {
  if (stage.env.reduced) return reducedOpening(stage, vp);
  return mode === "short" ? openingShort(stage, vp, say, sfx) : openingFull(stage, vp, say, sfx);
}
