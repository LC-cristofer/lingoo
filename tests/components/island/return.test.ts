import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { overviewCam, type Viewport } from "@/world/camera";
import type { IslandStates } from "@/world/island";
import { createStage, type Stage } from "@/world/stage";

vi.mock("@/audio/narrator", () => ({ narrator: { playSfx: vi.fn() } }));

import { NEST_FRONT, type LineKey } from "@/components/island/flows";
import { playBedtime, playReturn, returnPlan, settleFarol, wakeToIsland } from "@/components/island/return";
import { getUnit } from "@/domain/trail/content";
import type { Progress } from "@/domain/trail/progress";

const states: IslandStates = { letras: "obra", numeros: "futuro", cores: "futuro", lago: "futuro" };
const vp: Viewport = { w: 390, h: 844, top: 96, bottom: 150 };
let host: HTMLDivElement;
let stage: Stage;
let t = 0;
let said: LineKey[];
const say = vi.fn((key: LineKey) => { said.push(key); return Promise.resolve(); });
const sfx = vi.fn();
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

async function run(p: Promise<void>, max = 800): Promise<void> {
  let done = false;
  void p.then(() => (done = true));
  for (let i = 0; i < max && !done; i++) { t += 50; stage.frame(t); await flush(); }
  expect(done).toBe(true);
}
function make(o: { threads?: number; level?: 1 | 2 | 3 | 4; reduced?: boolean } = {}) {
  stage = createStage(host, { scene: "island", states, threads: o.threads ?? 0, farolLevel: o.level ?? 1, reduced: o.reduced ?? false, clock: "manual" });
  stage.setViewport(vp);
  t = 0;
  stage.frame(0);
}

beforeEach(() => {
  said = [];
  say.mockClear();
  sfx.mockClear();
  host = document.createElement("div");
  document.body.appendChild(host);
});
afterEach(() => {
  stage.destroy();
  host.remove();
});

describe("playReturn", () => {
  it("level 1 to 2: the lamp grows, pennants 3 and 4 fly up, the boat arrives, Nino says the farol grew, then the whole island", async () => {
    make();
    settleFarol(stage, 1);
    expect(stage.fx.pennant).toEqual([1, 1, 0, 0, 0]);
    expect(stage.fx.boatX).toBe(120);
    const p = playReturn(stage, vp, { from: 1, to: 2, newThread: false, sticker: false }, say, sfx);
    expect(stage.env.farolLevel).toBe(1);
    expect(stage.fx.intro.fade).toBe(1);
    await run(p);
    expect(stage.env.farolLevel).toBe(2);
    expect(stage.fx.pennant).toEqual([1, 1, 1, 1, 0]);
    expect(stage.fx.boatX).toBe(-20);
    expect(said).toEqual(["farolGrew"]);
    for (const name of ["grow", "water", "steps"]) expect(sfx).toHaveBeenCalledWith(name);
    const o = overviewCam(vp);
    expect(stage.cam.D).toBeCloseTo(o.D, 6);
    expect(stage.cam.X).toBeCloseTo(o.X, 3);
    expect(stage.nino.st.x).toBeCloseTo(NEST_FRONT.x, 1);
    expect(stage.nino.st.y).toBeCloseTo(NEST_FRONT.y, 1);
    expect(stage.fx.intro.fade).toBe(0);
    expect(stage.fx.pins.farol).toBe(1);
  });

  it("level 2 to 2: the farol stays as it was and nobody says it grew", async () => {
    make({ level: 2 });
    settleFarol(stage, 2);
    const before = { pennant: [...stage.fx.pennant], boatX: stage.fx.boatX };
    await run(playReturn(stage, vp, { from: 2, to: 2, newThread: false, sticker: false }, say, sfx));
    expect(stage.fx.pennant).toEqual(before.pennant);
    expect(stage.fx.boatX).toBe(before.boatX);
    expect(stage.env.farolLevel).toBe(2);
    expect(said).toEqual([]);
    expect(sfx).not.toHaveBeenCalledWith("grow");
  });

  it("a new thread is woven into the nest and Nino says he kept the sticker", async () => {
    make({ threads: 1, level: 2 });
    const p = playReturn(stage, vp, { from: 1, to: 2, newThread: true, sticker: true }, say, sfx);
    expect(stage.fx.thread[0]).toBe(0); // not there yet
    await run(p);
    expect(stage.fx.thread[0]).toBe(1);
    expect(said).toEqual(["farolGrew", "nestSaved"]);
    expect(sfx).toHaveBeenCalledWith("thread");
  });

  it("a new thread without a sticker (the first return, after the song) weaves it with the sound but says no sticker line", async () => {
    make({ threads: 1, level: 1 });
    const onNest = vi.fn();
    await run(playReturn(stage, vp, { from: 1, to: 1, newThread: true, sticker: false }, say, sfx, onNest));
    expect(stage.fx.thread[0]).toBe(1);
    expect(said).not.toContain("nestSaved");
    expect(sfx).toHaveBeenCalledWith("thread");
    expect(onNest).toHaveBeenCalledTimes(1);
  });

  it("a sticker alone (no new thread) still says nestSaved; neither says nothing more", async () => {
    make({ threads: 1, level: 3 });
    await run(playReturn(stage, vp, { from: 3, to: 3, newThread: false, sticker: true }, say, sfx));
    expect(said).toEqual(["nestSaved"]);
    expect(stage.fx.thread[0]).toBe(1);
  });

  it("reduced: nobody walks and the camera jumps, but the farol still changes", async () => {
    make({ reduced: true });
    const o = overviewCam(vp);
    const p = playReturn(stage, vp, { from: 1, to: 2, newThread: false, sticker: false }, say, sfx);
    await run(p, 120);
    expect(stage.fx.pennant).toEqual([1, 1, 1, 1, 0]);
    expect(stage.fx.boatX).toBe(-20);
    expect(stage.cam.D).toBeCloseTo(o.D, 6);
    expect(sfx).not.toHaveBeenCalledWith("steps");
  });
});

describe("playBedtime", () => {
  it("the island turns to night and Nino sleeps in the nest with his eyes closed", async () => {
    make();
    stage.moveNino("actors");
    Object.assign(stage.nino.st, { x: NEST_FRONT.x, y: NEST_FRONT.y, s: 0.45 });
    await run(playBedtime(stage, vp, say, sfx));
    expect(stage.env.night).toBe(1);
    expect(stage.nino.st.eyes).toBe("closed");
    expect(host.querySelector("#slotNest .nino")).not.toBeNull();
    expect(stage.nino.st.y).toBeCloseTo(1070, 0);
    expect(stage.nino.st.s).toBeCloseTo(0.56, 3);
    expect(said).toEqual(["goodnight"]);
    for (const name of ["night", "yawn"]) expect(sfx).toHaveBeenCalledWith(name);
    expect(stage.fx.pins.farol).toBe(0);
  });

  it("reduced: night within 400 ms and no hop", async () => {
    make({ reduced: true });
    stage.moveNino("actors");
    Object.assign(stage.nino.st, { x: NEST_FRONT.x, y: NEST_FRONT.y, s: 0.45 });
    await run(playBedtime(stage, vp, say, sfx), 200);
    expect(stage.env.night).toBe(1);
    expect(host.querySelector("#slotNest .nino")).not.toBeNull();
    expect(stage.nino.st.eyes).toBe("closed");
  });

  it("wakeToIsland brings Nino out again and the pins back", async () => {
    make();
    stage.moveNino("actors");
    Object.assign(stage.nino.st, { x: NEST_FRONT.x, y: NEST_FRONT.y, s: 0.45 });
    await run(playBedtime(stage, vp, say, sfx));
    await run(wakeToIsland(stage, vp, sfx));
    expect(host.querySelector("#slotActors .nino")).not.toBeNull();
    expect(stage.nino.st.eyes).toBe("open");
    expect(stage.fx.pins.farol).toBe(1);
    expect(stage.env.night).toBe(1);
  });
});

describe("returnPlan", () => {
  const unit = getUnit("forest-animals")!;
  const progress = (done: string[]): Progress => ({ completedStops: Object.fromEntries(done.map((id) => [id, "2026-11-18T10:00:00.000Z"])), stickers: {}, daysPlayed: [], memory: {}, version: 3, legacy: null });
  const first = unit.stops[0].id;

  it("the first finished stop: level 1 to 2 and a new thread", () => {
    expect(returnPlan(progress([first]), unit, first)).toEqual({ from: 1, to: 2, newThread: true, sticker: false });
  });
  it("a later stop: no new thread; the challenge carries a sticker", () => {
    const all = unit.stops.map((s) => s.id);
    const last = unit.stops[unit.stops.length - 1];
    expect(returnPlan(progress(all.slice(0, 2)), unit, all[1])).toEqual({ from: 2, to: 2, newThread: false, sticker: false });
    expect(returnPlan(progress(all), unit, last.id)).toMatchObject({ from: 3, to: 4, newThread: false, sticker: last.kind === "challenge" && !!last.sticker });
  });
  it("a stop that is not finished, unknown, or no stop at all: explore (null)", () => {
    expect(returnPlan(progress([]), unit, first)).toBeNull();
    expect(returnPlan(progress([first]), unit, "forest-animals/nope")).toBeNull();
    expect(returnPlan(progress([first]), unit, null)).toBeNull();
  });
});
