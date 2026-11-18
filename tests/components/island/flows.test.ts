import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FAROL_DOOR, PLACE_ANCHORS, type IslandStates } from "@/world/island";
import { focusCam, overviewCam, type Viewport } from "@/world/camera";
import { createStage, type Stage } from "@/world/stage";

const playSfx = vi.hoisted(() => vi.fn());
vi.mock("@/audio/narrator", () => ({ narrator: { playSfx } }));

import { diveIntoFarol, focusPlace, goToFarol, setNight, toOverview } from "@/components/island/flows";

const states: IslandStates = { letras: "obra", numeros: "futuro", cores: "futuro", lago: "futuro" };
const vp: Viewport = { w: 390, h: 844, top: 96, bottom: 150 };
let host: HTMLDivElement;
let stage: Stage;
let t = 0;
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

/** Drives the manual clock until the flow settles (or fails after 20 s of stage time). */
async function run(p: Promise<void>): Promise<void> {
  let done = false;
  void p.then(() => (done = true));
  for (let i = 0; i < 400 && !done; i++) { t += 50; stage.frame(t); await flush(); }
  expect(done).toBe(true);
}

beforeEach(() => {
  playSfx.mockClear();
  host = document.createElement("div");
  document.body.appendChild(host);
  stage = createStage(host, { scene: "island", states, threads: 0, farolLevel: 1, reduced: false, clock: "manual" });
  stage.setViewport(vp);
  t = 0;
  stage.frame(0);
});
afterEach(() => {
  stage.destroy();
  host.remove();
});

describe("island flows", () => {
  it("focusPlace ends at focusCam, and toOverview ends at overviewCam", async () => {
    await run(focusPlace(stage, "letras", vp));
    const f = focusCam(PLACE_ANCHORS.letras, vp);
    expect(stage.cam.X).toBeCloseTo(f.X, 3);
    expect(stage.cam.Y).toBeCloseTo(f.Y, 3);
    expect(stage.cam.D).toBeCloseTo(f.D, 6);
    await run(toOverview(stage, vp));
    const o = overviewCam(vp);
    expect(stage.cam.X).toBeCloseTo(o.X, 3);
    expect(stage.cam.Y).toBeCloseTo(o.Y, 3);
    expect(stage.cam.D).toBeCloseTo(o.D, 6);
  });

  it("the construction site hammers while focused and the sound plays; a future place wiggles its sprout", async () => {
    const p = focusPlace(stage, "letras", vp);
    expect(stage.fx.hammerFast).toBe(true);
    expect(playSfx).toHaveBeenCalledWith("obra");
    await run(p);
    expect(stage.fx.hammerFast).toBe(false);
    const q = focusPlace(stage, "numeros", vp);
    expect(stage.fx.wiggle.numeros).toBe(1);
    expect(playSfx).toHaveBeenCalledWith("leaves");
    await run(q);
    expect(stage.fx.wiggle.numeros).toBe(0);
  });

  it("reduced motion: the camera jumps at once", async () => {
    stage.env.reduced = true;
    await focusPlace(stage, "farol", vp);
    const f = focusCam(PLACE_ANCHORS.farol, vp);
    expect(stage.cam.X).toBeCloseTo(f.X, 3);
    expect(stage.cam.D).toBeCloseTo(f.D, 6);
    await toOverview(stage, vp);
    expect(stage.cam.D).toBeCloseTo(overviewCam(vp).D, 6);
  });

  it("goToFarol walks Nino from the nest front to the lighthouse, rings the bell and pulses the lamp", async () => {
    const st = stage.nino.st;
    stage.moveNino("actors");
    Object.assign(st, { x: 578, y: 930, s: 0.45 });
    let peak = 0;
    stage.onFrame(() => { peak = Math.max(peak, stage.fx.lampPulse); });
    await run(goToFarol(stage, vp));
    for (let i = 0; i < 6; i++) { t += 50; stage.frame(t); await flush(); } // the pulse outlives the flow
    expect(st.x).toBeCloseTo(828, 3);
    expect(st.y).toBeCloseTo(1158, 3);
    expect(st.walk).toBe(0);
    expect(st.s).toBeCloseTo(0.45, 6);
    expect(playSfx).toHaveBeenCalledWith("steps");
    expect(playSfx).toHaveBeenCalledWith("bell");
    expect(peak).toBeGreaterThan(0.3);
    expect(stage.cam.D).toBeCloseTo(focusCam(PLACE_ANCHORS.farol, vp).D, 6);
  });

  it("goToFarol under reduced motion places Nino without walking", async () => {
    stage.env.reduced = true;
    await goToFarol(stage, vp);
    expect(stage.nino.st.x).toBeCloseTo(828, 3);
    expect(stage.nino.st.walk).toBe(0);
  });

  it("diveIntoFarol takes the camera to the door at D 0.035 and fades to full", async () => {
    const fades: number[] = [];
    await run(diveIntoFarol(stage, (v) => fades.push(v)));
    expect(stage.cam.X).toBeCloseTo(FAROL_DOOR.x, 3);
    expect(stage.cam.Y).toBeCloseTo(FAROL_DOOR.y, 3);
    expect(stage.cam.D).toBeCloseTo(0.035, 6);
    expect(Math.max(...fades)).toBe(1);
    expect(playSfx).toHaveBeenCalledWith("dive");
  });

  it("diveIntoFarol under reduced motion only fades, within 400 ms", async () => {
    stage.env.reduced = true;
    const cam0 = { ...stage.cam };
    const fades: number[] = [];
    const p = diveIntoFarol(stage, (v) => fades.push(v));
    let done = false;
    void p.then(() => (done = true));
    for (let ms = 50; ms <= 400 && !done; ms += 50) { stage.frame(ms); await flush(); }
    expect(done).toBe(true);
    expect(stage.cam).toEqual(cam0);
    expect(fades.at(-1)).toBe(1);
  });

  it("setNight tweens env.night, and sets it at once with 0 ms", async () => {
    await run(setNight(stage, true, 600));
    expect(stage.env.night).toBe(1);
    await setNight(stage, false, 0);
    expect(stage.env.night).toBe(0);
  });
});
