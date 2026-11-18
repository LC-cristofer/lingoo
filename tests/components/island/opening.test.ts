import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { overviewCam, type Viewport } from "@/world/camera";
import type { IslandStates } from "@/world/island";
import { createStage, type Stage } from "@/world/stage";

vi.mock("@/audio/narrator", () => ({ narrator: { playSfx: vi.fn() } }));

import { NEST_FRONT, NINO_ISLAND_SCALE, type LineKey } from "@/components/island/flows";
import { playOpening, skipOpening, wakeEarly } from "@/components/island/opening";

const states: IslandStates = { letras: "obra", numeros: "futuro", cores: "futuro", lago: "futuro" };
const vp: Viewport = { w: 390, h: 844, top: 96, bottom: 150 };
const PLACES = ["ninho", "letras", "numeros", "cores", "lago", "farol"] as const;
let host: HTMLDivElement;
let stage: Stage;
let t = 0;
let said: { key: LineKey; at: number }[];
const say = vi.fn((key: LineKey) => { said.push({ key, at: t }); return Promise.resolve(); });
const sfx = vi.fn();
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

/** Drives the manual clock until the flow settles (or fails after 30 s of stage time). */
async function run(p: Promise<void>, max = 600): Promise<number> {
  let done = false;
  void p.then(() => (done = true));
  const t0 = t;
  for (let i = 0; i < max && !done; i++) { t += 50; stage.frame(t); await flush(); }
  expect(done).toBe(true);
  return t - t0;
}

function make(reduced: boolean) {
  stage = createStage(host, { scene: "island", states, threads: 0, farolLevel: 1, reduced, clock: "manual" });
  stage.setViewport(vp);
  t = 0;
  stage.frame(0);
}
const atOverview = () => {
  const o = overviewCam(vp);
  expect(stage.cam.X).toBeCloseTo(o.X, 3);
  expect(stage.cam.Y).toBeCloseTo(o.Y, 3);
  expect(stage.cam.D).toBeCloseTo(o.D, 6);
};

beforeEach(() => {
  said = [];
  say.mockClear();
  sfx.mockClear();
  host = document.createElement("div");
  document.body.appendChild(host);
  make(false);
});
afterEach(() => {
  stage.destroy();
  host.remove();
});

describe("playOpening", () => {
  it("full: Nino sleeps, wakes, greets, hops out and the camera reaches the whole island in about 14 s", async () => {
    const p = playOpening(stage, "full", vp, say, sfx);
    expect(stage.nino.st.eyes).toBe("closed");
    expect(stage.fx.pins.farol).toBe(0);
    const ms = await run(p);
    expect(ms).toBeGreaterThan(12_000);
    expect(ms).toBeLessThan(16_000);
    atOverview();
    expect(said.map((s) => s.key)).toEqual(["ninoHello", "ninoExplore"]);
    for (const id of PLACES) expect(stage.fx.pins[id]).toBe(1);
    expect(stage.nino.st.x).toBeCloseTo(NEST_FRONT.x, 1);
    expect(stage.nino.st.y).toBeCloseTo(NEST_FRONT.y, 1);
    expect(stage.nino.st.s).toBeCloseTo(NINO_ISLAND_SCALE, 3);
    expect(host.querySelector("#slotActors .nino")).not.toBeNull();
    for (const name of ["yawn", "stretch", "pop", "reveal"]) expect(sfx).toHaveBeenCalledWith(name);
    expect(stage.fx.intro.logo).toBe(0);
    expect(stage.nino.st.talking).toBe(false);
  });

  it("the sleeping wait lasts 2.6 s, and wakeEarly cuts it short", async () => {
    const slow = playOpening(stage, "full", vp, say, sfx);
    await run(slow);
    const slowAt = said[0].at;
    stage.destroy();
    said = [];
    make(false);
    const quick = playOpening(stage, "full", vp, say, sfx);
    for (let i = 0; i < 2; i++) { t += 50; stage.frame(t); await flush(); }
    wakeEarly(stage);
    await run(quick);
    expect(slowAt - said[0].at).toBeGreaterThan(2000);
  });

  it("the logo and the skip button fade in while he sleeps", async () => {
    void playOpening(stage, "full", vp, say, sfx);
    for (let i = 0; i < 40; i++) { t += 50; stage.frame(t); await flush(); }
    expect(stage.fx.intro.logo).toBeGreaterThan(0.9);
    expect(stage.fx.intro.skip).toBe(1);
  });

  it("short: waves, says hello and the camera reaches the whole island in about 2.5 s", async () => {
    const ms = await run(playOpening(stage, "short", vp, say, sfx));
    expect(ms).toBeGreaterThan(1500);
    expect(ms).toBeLessThan(3200);
    atOverview();
    expect(said.map((s) => s.key)).toEqual(["start"]);
    for (const id of PLACES) expect(stage.fx.pins[id]).toBe(1);
  });

  it("reduced: no camera tween (it is on the island at once) and a 400 ms fade", async () => {
    stage.destroy();
    make(true);
    const p = playOpening(stage, "full", vp, say, sfx);
    atOverview();
    expect(stage.fx.intro.fade).toBe(1);
    const ms = await run(p);
    expect(ms).toBeLessThanOrEqual(450);
    expect(stage.fx.intro.fade).toBe(0);
    expect(say).not.toHaveBeenCalled();
    expect(stage.nino.st.x).toBeCloseTo(NEST_FRONT.x, 1);
  });
});

describe("skipOpening", () => {
  it("in the middle of the opening: the island, every pin, Nino in front of the nest, no logo", async () => {
    void playOpening(stage, "full", vp, say, sfx);
    for (let i = 0; i < 80; i++) { t += 50; stage.frame(t); await flush(); }
    void skipOpening(stage, vp);
    atOverview();
    for (const id of PLACES) expect(stage.fx.pins[id]).toBe(1);
    expect(stage.nino.st.x).toBeCloseTo(NEST_FRONT.x, 1);
    expect(stage.nino.st.y).toBeCloseTo(NEST_FRONT.y, 1);
    expect(stage.nino.st.eyes).toBe("open");
    expect(stage.fx.intro.logo).toBe(0);
    expect(stage.fx.intro.skip).toBe(0);
    // nothing of the cancelled opening keeps moving the camera
    for (let i = 0; i < 100; i++) { t += 50; stage.frame(t); await flush(); }
    atOverview();
    expect(say).not.toHaveBeenCalled();
  });
});
