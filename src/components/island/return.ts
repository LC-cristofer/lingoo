/* Coming back to the island: the farol growing after a stop, the walk home with the new thread, the bedtime.
   Plain async functions over a Stage (testable with a manual clock). Ported from tools/visual/ilha/src/app.js
   (backOutside, bedtime). A caller that interrupts a flow calls `stage.tl.cancelAll()`. */
import { poseState } from "@/art/nino/poses";
import { farolCloseCam, overviewCam, type Cam, type Viewport } from "@/world/camera";
import { NEST, type PlaceId } from "@/world/island";
import { areaOfStop } from "@/domain/letras/area";
import { arvoreLevel, arvoreLevelBefore, farolLevel, levelBefore, THREAD_INDEX, wovenThreads, type AreaUnits } from "@/domain/nestoy/island-view";
import type { Progress } from "@/domain/trail/progress";
import type { Stage } from "@/world/stage";
import {
  ARVORE_STAND, arvoreWorld, BOAT_DOCKED, blendPose, camTo, farolWorld, FAROL_PENNANTS, FAROL_STAND, hopInPlace, NEST_FRONT, NINO_ISLAND_SCALE, pulseLamp, setNight, shakeTree, speakLine,
  type Say, type Sfx,
} from "./flows";
import { arm } from "./opening";

type Level = 1 | 2 | 3 | 4;
/** Coming back from a stop of the farol or of the tree: that place's level before and after, a first thread of its area, a sticker. */
export type ReturnOpts = { place: "farol" | "arvore"; from: Level; to: Level; newThread: boolean; sticker: boolean };

const PLACES: PlaceId[] = ["ninho", "letras", "numeros", "cores", "lago", "farol"];
const FADE_MS = 350;
const FADE_REDUCED_MS = 400;

/** What to show on coming back from `stopId`: null unless it names a finished stop of an area (then the island just opens to explore). */
export function returnPlan(p: Progress, areas: AreaUnits, stopId: string | null): ReturnOpts | null {
  if (!stopId) return null;
  const area = areaOfStop(stopId);
  const units = area === "farol" ? [areas.farol] : areas.letras;
  const stop = units.flatMap((u) => u.stops).find((s) => s.id === stopId);
  if (!stop || !Object.hasOwn(p.completedStops, stopId)) return null;
  const without: Progress = { ...p, completedStops: Object.fromEntries(Object.entries(p.completedStops).filter(([k]) => k !== stopId)) };
  const i = THREAD_INDEX[area];
  return {
    place: area === "farol" ? "farol" : "arvore",
    from: area === "farol" ? levelBefore(p, areas.farol, stopId) : arvoreLevelBefore(p, areas.letras, stopId),
    to: area === "farol" ? farolLevel(p, areas.farol) : arvoreLevel(p, areas.letras),
    newThread: !wovenThreads(without, areas)[i] && wovenThreads(p, areas)[i],
    sticker: stop.kind === "challenge" && !!stop.sticker,
  };
}

/** The tree's growth layers as they are at `level`. */
export function settleArvore(stage: Stage, level: Level): void {
  stage.fx.arvore = arvoreWorld(level);
}

/** The tree close-up the return opens on: the whole tree (crown top to the trunk door, about 560 world units tall) with Nino beside it, between the UI insets. */
export function arvoreCloseCam(vp: Viewport): Cam {
  const base = (vp.w > vp.h ? Math.min(vp.w, vp.h * 0.75) : vp.w) / 1000;
  const availH = Math.max(60, vp.h - vp.top - vp.bottom);
  const D = Math.max(0.4, (base * 560) / availH);
  const p = base / D;
  const shift = (vp.top + (vp.h - vp.bottom)) / 2 - vp.h / 2;
  const shiftX = ((vp.left ?? 0) + (vp.w - (vp.right ?? 0))) / 2 - vp.w / 2;
  return { X: 280 - shiftX / p, Y: 735 - shift / p, D };
}

/** The farol's lamp, pennants and boat as they are at `level` (the island arrives like this when nothing changed). */
export function settleFarol(stage: Stage, level: Level): void {
  stage.env.farolLevel = level;
  Object.assign(stage.fx, farolWorld(level));
}

/**
 * After a finished stop: the camera is on the farol under a cream fade; if the level went up the lamp swells,
 * pennants fly up and the boat sails in (Nino cheers: "Olha! O farol brilhou mais forte!"); Nino walks home
 * while the camera pulls back; a new thread is woven (and the sticker kept: "Guardei a sua figurinha no ninho.").
 */
export async function playReturn(stage: Stage, vp: Viewport, o: ReturnOpts, say: Say, sfx: Sfx, onNest?: () => void): Promise<void> {
  const { tl, fx, env } = stage, st = stage.nino.st, reduced = env.reduced;
  const tree = o.place === "arvore";
  // the world as it was before the stop
  if (tree) settleArvore(stage, o.from);
  else settleFarol(stage, o.from);
  const threadAt = THREAD_INDEX[tree ? "letras" : "farol"];
  if (o.newThread) fx.thread[threadAt] = 0;
  // arrival: at the place's door, under the cream fade
  for (const id of PLACES) fx.pins[id] = 0; // the pins come back once the camera pulls out
  stage.moveNino("actors");
  const stand = tree ? ARVORE_STAND : FAROL_STAND;
  Object.assign(st, poseState("idle"), { x: stand.x, y: stand.y, s: NINO_ISLAND_SCALE, alpha: 1, facing: -1, lift: 0, walk: 0, talking: false });
  Object.assign(stage.cam, tree ? arvoreCloseCam(vp) : farolCloseCam(vp));
  fx.intro.fade = 1;
  await tl.tween(fx.intro, { fade: 0 }, reduced ? FADE_REDUCED_MS : FADE_MS, "lin");
  // the place transforms
  if (tree && o.to > o.from) {
    // the new layers drop in one after the other while the crown rustles
    await tl.wait(300);
    sfx("grow");
    void shakeTree(stage, 1400);
    const to = arvoreWorld(o.to);
    to.forEach((v, i) => {
      if (v <= fx.arvore[i]) return;
      if (reduced) fx.arvore[i] = 1;
      else void tl.tween(fx.arvore as Record<number, number>, { [i]: 1 }, 520, "back", { delay: 200 + i * 260 });
    });
    void blendPose(stage, "happy", 200, "out");
    if (!reduced) void hopInPlace(stage);
    await tl.wait(1400);
    await speakLine(stage, say, "arvoreGrew");
    await blendPose(stage, "idle", 300, "io");
  } else if (o.to > o.from) {
    await tl.wait(300);
    sfx("grow");
    env.farolLevel = o.to;
    void pulseLamp(stage);
    const from = FAROL_PENNANTS[o.from], upTo = FAROL_PENNANTS[o.to];
    for (let i = from; i < upTo; i++) void tl.tween(fx.pennant as Record<number, number>, { [i]: 1 }, 380, "back", { delay: 300 + (i - from) * 220 });
    if (fx.boatX !== BOAT_DOCKED && o.to >= 2) {
      sfx("water");
      if (reduced) fx.boatX = BOAT_DOCKED;
      else void tl.tween(fx, { boatX: BOAT_DOCKED }, 2600, "soft", { delay: 200 });
    }
    void blendPose(stage, "happy", 200, "out");
    if (!reduced) void hopInPlace(stage);
    await tl.wait(500);
    await speakLine(stage, say, "farolGrew");
    await blendPose(stage, "idle", 300, "io");
  } else {
    await tl.wait(700);
  }
  // back to the whole island while Nino walks home
  const camBack = camTo(stage, overviewCam(vp), 2000);
  if (reduced) {
    Object.assign(st, { x: NEST_FRONT.x, y: NEST_FRONT.y, facing: 1 });
  } else {
    let walking = true;
    void (async () => {
      while (walking) {
        sfx("steps");
        await tl.wait(1000);
      }
    })();
    await stage.walk(tree ? "letras" : "farol", true);
    walking = false;
    await tl.tween(st, { x: NEST_FRONT.x, y: NEST_FRONT.y }, 200, "io");
    Object.assign(st, { facing: 1, walk: 0 });
  }
  await camBack;
  if (reduced) for (const id of PLACES) fx.pins[id] = 1;
  else await tl.tween(fx.pins, { ninho: 1, letras: 1, numeros: 1, cores: 1, lago: 1, farol: 1 }, 400, "out");
  // a new thread in the nest, the sticker safe in it
  if (o.newThread || o.sticker) {
    sfx("thread");
    if (o.newThread) await tl.tween(fx.thread as Record<number, number>, { [threadAt]: 1 }, 1200, "io");
    void blendPose(stage, "happy", 200, "out");
    onNest?.();
    // Nino only says he kept a sticker when there is one; a new thread alone is the sound and the happy pose.
    if (o.sticker) await speakLine(stage, say, "nestSaved");
    else await tl.wait(900);
    await blendPose(stage, "idle", 300, "io");
  }
}

/** The island at night, Nino yawns and goes to bed in the nest: "Boa noite!". The pins step aside. */
export async function playBedtime(stage: Stage, vp: Viewport, say: Say, sfx: Sfx): Promise<void> {
  const { tl, fx, env } = stage, st = stage.nino.st, reduced = env.reduced;
  sfx("night");
  void tl.tween(fx.pins, { ninho: 0, letras: 0, numeros: 0, cores: 0, lago: 0, farol: 0 }, 600, "io");
  const drift = camTo(stage, { X: 500, Y: 980, D: 0.6 }, 3000);
  await setNight(stage, true, 3000);
  await drift;
  // a big yawn
  sfx("yawn"); st.mouth = "yawn"; st.eyes = "happy";
  await tl.tween(st, { armL: arm(poseState("stretch").armL!), armR: arm(poseState("stretch").armR!), pawL: 1, pawR: 1, sy: 1.06 }, 500, "out");
  await tl.wait(500);
  await blendPose(stage, "idle", 300, "io");
  // to the nest
  const nestWorldY = 1070 + NEST.dy;
  if (reduced) {
    stage.moveNino("nest");
    Object.assign(st, { x: 500, y: 1070, s: 0.56, lift: 0, facing: 1, walk: 0 });
  } else {
    if (Math.hypot(st.x - FAROL_STAND.x, st.y - FAROL_STAND.y) < 40) {
      await stage.walk("farol", true); // he was left at the lighthouse: the long way home along the path
      st.walk = 0;
    }
    if (Math.hypot(st.x - ARVORE_STAND.x, st.y - ARVORE_STAND.y) < 40) {
      await stage.walk("letras", true); // he was left at the tree
      st.walk = 0;
    }
    if (Math.hypot(st.x - NEST_FRONT.x, st.y - NEST_FRONT.y) > 10) {
      st.walk = 1; st.facing = NEST_FRONT.x < st.x ? -1 : 1;
      await tl.tween(st, { x: NEST_FRONT.x, y: NEST_FRONT.y }, 900, "io", { onUpdate: () => { st.walkPhase = tl.now() / 70; } });
      st.walk = 0;
    }
    st.facing = -1;
    await tl.tween(st, { sy: 0.9, sx: 1.08 }, 140, "out");
    st.sy = 1; st.sx = 1;
    const x0 = st.x, y0 = st.y, s0 = st.s;
    let inNest = false;
    await tl.tween({ e: 0 }, { e: 1 }, 640, "io", {
      onUpdate: (e) => {
        if (e > 0.5 && !inNest) { stage.moveNino("nest"); inNest = true; }
        const yw = y0 + (nestWorldY - y0) * e;
        st.x = x0 + (500 - x0) * e;
        st.lift = Math.sin(e * Math.PI) * 44;
        st.s = s0 + (0.56 - s0) * e;
        st.y = inNest ? yw - NEST.dy : yw;
      },
    });
    st.facing = 1;
  }
  await camTo(stage, { X: 500, Y: 800, D: 0.3 }, 1600);
  await speakLine(stage, say, "goodnight");
  st.eyes = "closed";
  await tl.tween(st, { head: 9, breathe: 2.2 }, 700, "io");
}

/** The child wants to play a bit more at night: Nino hops out of the nest and the pins come back. */
export async function wakeToIsland(stage: Stage, vp: Viewport, sfx: Sfx): Promise<void> {
  const { tl, fx } = stage, st = stage.nino.st;
  await blendPose(stage, "idle", 250, "out");
  stage.moveNino("actors"); sfx("pop");
  const pins = { ninho: 1, letras: 1, numeros: 1, cores: 1, lago: 1, farol: 1 };
  if (stage.env.reduced) {
    Object.assign(st, { x: NEST_FRONT.x, y: NEST_FRONT.y, s: NINO_ISLAND_SCALE });
    Object.assign(fx.pins, pins);
  } else {
    const hop = tl.tween(st, { x: NEST_FRONT.x, y: NEST_FRONT.y, s: NINO_ISLAND_SCALE }, 620, "io", { onUpdate: (e) => { st.lift = Math.sin(e * Math.PI) * 46; } });
    void tl.tween(fx.pins, pins, 420, "back");
    await Promise.all([hop, camTo(stage, overviewCam(vp), 900)]);
  }
  Object.assign(stage.cam, overviewCam(vp));
  Object.assign(st, { lift: 0, facing: 1 });
}
