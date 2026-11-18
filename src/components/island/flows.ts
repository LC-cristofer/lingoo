/* Choreography of the island home: plain async functions over a Stage (testable with a manual clock).
   Ported from tools/visual/ilha/src/app.js (focusPlace, walkTo, overview, enterFarol). Under reduced motion
   the camera jumps and nobody walks; sounds still play. A caller that interrupts a flow calls
   `stage.tl.cancelAll()` and then `settle(stage)` (the cancelled promises never resolve). */
import { narrator, type SfxName } from "@/audio/narrator";
import { poseState, type NinoPose } from "@/art/nino/poses";
import type { NinoState } from "@/art/nino/rig";
import { focusCam, overviewCam, type Cam, type Viewport } from "@/world/camera";
import { FAROL_DOOR, PLACE_ANCHORS, type PlaceId } from "@/world/island";
import type { Ease } from "@/world/timeline";
import type { Stage } from "@/world/stage";

/** Nino's scale on the island (the nest keeps him at 0.56). */
export const NINO_ISLAND_SCALE = 0.45;
/** Where Nino stands once outside, in front of the nest. */
export const NEST_FRONT = { x: 578, y: 930 } as const;
/** Where the farol's path ends, at the door. */
export const FAROL_STAND = { x: 828, y: 1158 } as const;

const FOCUS_MS = 1000;
const FAROL_FOCUS_MS = 1100;
const OVERVIEW_MS = 900;
const DIVE_MS = 1000;
const FADE_MS = 300;
const HOLD_MS = 900;

export function camTo(stage: Stage, to: Cam, ms: number, ease: "io" | "in" = "io", onUpdate?: (e: number) => void): Promise<void> {
  if (stage.env.reduced) {
    Object.assign(stage.cam, to);
    return Promise.resolve();
  }
  return stage.tl.tween(stage.cam, { X: to.X, Y: to.Y, D: to.D }, ms, ease, { onUpdate });
}

/** Back to a quiet stage after a flow was cancelled mid-way: no hammering, no wiggle, Nino standing. */
export function settle(stage: Stage): void {
  stage.fx.hammerFast = false;
  stage.fx.wiggle = {};
  stage.fx.lampPulse = 0;
  stage.nino.st.walk = 0;
}

/** Brings Nino onto the island (out of the nest slot) at the island's scale. */
function onIsland(stage: Stage): void {
  stage.moveNino("actors");
  stage.nino.st.s = NINO_ISLAND_SCALE;
}

/** The camera closes in on a place and it answers: the builders hammer, a sprout wiggles. */
export async function focusPlace(stage: Stage, id: PlaceId, vp: Viewport): Promise<void> {
  const reduced = stage.env.reduced;
  const cam = camTo(stage, focusCam(PLACE_ANCHORS[id], vp), id === "farol" ? FAROL_FOCUS_MS : FOCUS_MS);
  if (id === "letras") {
    narrator.playSfx("obra");
    if (!reduced) stage.fx.hammerFast = true;
  } else if (id === "numeros" || id === "cores" || id === "lago") {
    narrator.playSfx("leaves");
    if (!reduced) stage.fx.wiggle[id] = 1;
  }
  await cam;
  if (reduced || id === "farol" || id === "ninho") return;
  await stage.tl.wait(HOLD_MS);
  stage.fx.hammerFast = false;
  stage.fx.wiggle[id] = 0;
}

/** Nino walks the path to the lighthouse while the camera closes in; the bell rings and the lamp pulses. */
export async function goToFarol(stage: Stage, vp: Viewport): Promise<void> {
  const st = stage.nino.st;
  const cam = camTo(stage, focusCam(PLACE_ANCHORS.farol, vp), FAROL_FOCUS_MS);
  if (stage.env.reduced) {
    onIsland(stage);
    Object.assign(st, { x: FAROL_STAND.x, y: FAROL_STAND.y, walk: 0, facing: 1 });
  } else {
    onIsland(stage);
    let walking = true;
    void (async () => {
      while (walking) {
        narrator.playSfx("steps");
        await stage.tl.wait(1000);
      }
    })();
    await stage.walk("farol");
    walking = false;
  }
  await cam;
  narrator.playSfx("bell");
  if (!stage.env.reduced) void stage.tl.tween(stage.fx, { lampPulse: 1 }, 220, "out").then(() => stage.tl.tween(stage.fx, { lampPulse: 0 }, 900, "io"));
}

/**
 * The camera dives into the lighthouse door while Nino fades; `onFade` gets the cream veil's opacity (0 to 1)
 * so the screen can cover the cut. Reduced motion: no dive, only a 300 ms fade.
 */
export async function diveIntoFarol(stage: Stage, onFade?: (v: number) => void): Promise<void> {
  narrator.playSfx("dive");
  if (stage.env.reduced) {
    const k = { v: 0 };
    await stage.tl.tween(k, { v: 1 }, FADE_MS, "lin", { onUpdate: () => onFade?.(k.v) });
    onFade?.(1);
    return;
  }
  void stage.tl.tween(stage.nino.st, { alpha: 0 }, 300, "io", { delay: 200 });
  await camTo(stage, { X: FAROL_DOOR.x, Y: FAROL_DOOR.y, D: 0.035 }, DIVE_MS, "in", (e) => onFade?.(Math.min(1, Math.max(0, (e - 0.7) / 0.3))));
  onFade?.(1);
}

/** Back to the whole island. */
export async function toOverview(stage: Stage, vp: Viewport): Promise<void> {
  settle(stage);
  await camTo(stage, overviewCam(vp), OVERVIEW_MS);
}

/** Day to night (or back) over `ms`; 0 ms sets it at once. Under reduced motion no longer than 400 ms. */
export async function setNight(stage: Stage, on: boolean, ms: number): Promise<void> {
  const to = on ? 1 : 0;
  const dur = stage.env.reduced ? Math.min(ms, 400) : ms;
  if (dur <= 0) {
    stage.env.night = to;
    return;
  }
  await stage.tl.tween(stage.env, { night: to }, dur, "io");
}

// ---- shared by the opening, the return and the bedtime ----

/** The lines Nino says in those flows (keys of content/lines.json). */
export type LineKey = "start" | "ninoHello" | "ninoExplore" | "farolGrew" | "nestSaved" | "goodnight";
/** Plays a line and resolves when it ends (at once while the audio is locked). */
export type Say = (key: LineKey) => Promise<void>;
export type Sfx = (name: SfxName) => void;

/** How long a line holds the scene at least, so a silent run (audio still locked) keeps the same pace. */
const LINE_MIN_MS: Record<LineKey, number> = { start: 1800, ninoHello: 1500, ninoExplore: 1900, farolGrew: 1900, nestSaved: 1900, goodnight: 2600 };

/** Nino talks (his mouth moves) while the line plays; never shorter than its minimum, so a muted run is not rushed. */
export async function speakLine(stage: Stage, say: Say, key: LineKey): Promise<void> {
  const st = stage.nino.st;
  st.talking = true;
  await Promise.all([say(key), stage.tl.wait(LINE_MIN_MS[key])]);
  st.talking = false;
}

/** A small jump of joy (lift up and back down). */
export function hopInPlace(stage: Stage, px = 18): Promise<void> {
  const st = stage.nino.st;
  return stage.tl.tween(st, { lift: px }, 200, "out").then(() => stage.tl.tween(st, { lift: 0 }, 300, "back"));
}

/** The lamp swells and settles (the farol answering). */
export function pulseLamp(stage: Stage, up = 400, down = 1400): Promise<void> {
  return stage.tl.tween(stage.fx, { lampPulse: 1 }, up, "out").then(() => stage.tl.tween(stage.fx, { lampPulse: 0 }, down, "io"));
}

/** Pennants showing at each farol level (spec §6: 2, 4, then all 5) and whether the boat is at the dock. */
export const FAROL_PENNANTS: Record<1 | 2 | 3 | 4, number> = { 1: 2, 2: 4, 3: 5, 4: 5 };
export const BOAT_AWAY = 120;
export const BOAT_DOCKED = -20;
export function farolWorld(level: 1 | 2 | 3 | 4): { pennant: number[]; boatX: number } {
  return { pennant: [0, 1, 2, 3, 4].map((i) => (i < FAROL_PENNANTS[level] ? 1 : 0)), boatX: level >= 2 ? BOAT_DOCKED : BOAT_AWAY };
}

/** Eases Nino into a pose: the numbers tween, the face (eyes, mouth) changes at once. */
export function blendPose(stage: Stage, pose: NinoPose, ms: number, ease: Ease = "io"): Promise<void> {
  const target = poseState(pose) as Record<string, unknown>;
  const st = stage.nino.st as unknown as Record<string, unknown>;
  const nums: Record<string, number | number[]> = {};
  for (const [k, v] of Object.entries(target)) {
    if (typeof v === "number") nums[k] = v;
    else if (Array.isArray(v)) nums[k] = [...(v as number[])];
    else st[k] = v;
  }
  return stage.tl.tween(stage.nino.st, nums as Partial<Record<keyof NinoState, number | number[]>>, ms, ease);
}
