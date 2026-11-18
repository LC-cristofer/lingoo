import { describe, expect, it } from "vitest";
import {
  LAYER_K, farolCloseCam, focusCam, layerViewBox, lerpCam, nestCloseCam, overviewCam, ppu, toScreen, type Viewport,
} from "@/world/camera";

const P: Viewport = { w: 390, h: 844, top: 108, bottom: 150 };
const L: Viewport = { w: 844, h: 390, top: 0, bottom: 0 };

describe("camera", () => {
  it("ppu is w/1000/D in portrait and uses min(w, 0.75h) in landscape", () => {
    expect(ppu({ X: 0, Y: 0, D: 0.5 }, P)).toBeCloseTo(0.78, 9);
    expect(ppu({ X: 0, Y: 0, D: 0.5 }, L)).toBeCloseTo((390 * 0.75) / 1000 / 0.5, 9);
  });

  it("island layer viewBox width is vp.w / ppu and is centred on the camera", () => {
    const cam = overviewCam(P);
    const vb = layerViewBox(cam, LAYER_K.island, P)!;
    expect(vb[2]).toBeCloseTo(P.w / ppu(cam, P), 6);
    expect(vb[0] + vb[2] / 2).toBeCloseTo(cam.X, 6);
    expect(vb[1] + vb[3] / 2).toBeCloseTo(cam.Y, 6);
  });

  it("far layers zoom faster, near layer disappears at low D", () => {
    expect(layerViewBox({ X: 500, Y: 800, D: 0.1 }, LAYER_K.near, P)).toBeNull();
    const far = layerViewBox({ X: 500, Y: 800, D: 0.9 }, LAYER_K.far, P)!;
    const isl = layerViewBox({ X: 500, Y: 800, D: 0.9 }, LAYER_K.island, P)!;
    expect(far[2]).toBeGreaterThan(isl[2]);
  });

  it("overviewCam fits the island between the insets", () => {
    const c = overviewCam(P);
    expect(c.D).toBeGreaterThanOrEqual(0.85);
    expect(c.D).toBeLessThanOrEqual(0.95);
    const [, yTop] = toScreen(c, 500, 540, P);
    const [, yBot] = toScreen(c, 500, 1880, P);
    expect(yTop).toBeGreaterThanOrEqual(P.top - 1);
    expect(yBot).toBeLessThanOrEqual(P.h - P.bottom + 1);
    const [xl] = toScreen(c, 60, 1000, P);
    const [xr] = toScreen(c, 940, 1000, P);
    expect(xl).toBeGreaterThanOrEqual(12 - 0.01);
    expect(xr).toBeLessThanOrEqual(P.w - 12 + 0.01);
  });

  it("landscape overview keeps the island inside the screen", () => {
    const c = overviewCam(L);
    const [xl] = toScreen(c, 60, 1000, L);
    const [xr] = toScreen(c, 940, 1000, L);
    expect(xl).toBeGreaterThanOrEqual(0);
    expect(xr).toBeLessThanOrEqual(L.w);
    const [, y0] = toScreen(c, 500, 540, L);
    const [, y1] = toScreen(c, 500, 1880, L);
    expect(y0).toBeGreaterThanOrEqual(0);
    expect(y1).toBeLessThanOrEqual(L.h);
  });

  it("nestCloseCam puts the nest centre at 63% of the height", () => {
    const c = nestCloseCam(P);
    expect(c.D).toBeCloseTo(0.22, 9);
    const [x, y] = toScreen(c, 500, 850, P);
    expect(x).toBeCloseTo(P.w / 2, 6);
    expect(y).toBeCloseTo(P.h * 0.63, 6);
  });

  it("farolCloseCam and focusCam use the specified numbers", () => {
    expect(farolCloseCam(P)).toEqual({ X: 790, Y: 1080, D: 0.36 });
    expect(focusCam({ x: 876, y: 862 }, P)).toEqual({ X: 500 + 376 * 0.7, Y: 862 + 230, D: 0.55 });
  });

  it("side panels: the overview centres the island in what is left, and focusCam leans the same way", () => {
    const S: Viewport = { w: 844, h: 390, top: 48, bottom: 16, left: 380, right: 100 };
    const c = overviewCam(S);
    const [xl] = toScreen(c, 60, 1000, S);
    const [xr] = toScreen(c, 940, 1000, S);
    expect(xl).toBeGreaterThanOrEqual(S.left! - 0.01);
    expect(xr).toBeLessThanOrEqual(S.w - S.right! + 0.01);
    const f = focusCam({ x: 240, y: 556 }, S);
    const [fx] = toScreen(f, 240, 556, S);
    expect(fx).toBeGreaterThan(S.left!);
    expect(overviewCam({ ...S, left: 0, right: 0 }).X).toBeCloseTo(500, 9);
  });

  it("lerpCam interpolates D in log space and arcs upward mid-way", () => {
    const a = { X: 500, Y: 789, D: 0.22 }, b = { X: 500, Y: 1250, D: 0.9 };
    expect(lerpCam(a, b, 0.5).D).toBeCloseTo(Math.sqrt(a.D * b.D), 9);
    expect(lerpCam(a, b, 0)).toEqual(a);
    const end = lerpCam(a, b, 1);
    expect(end.X).toBeCloseTo(500, 9);
    expect(end.Y).toBeCloseTo(1250, 6);
    const m = lerpCam(a, b, 0.5);
    expect(m.Y).toBeLessThan(789 + (1250 - 789) * 0.99 - 40);
  });
});
