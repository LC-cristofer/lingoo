import { describe, expect, it } from "vitest";
import { landingCam, ROOM_SHOWN, STOP_R } from "@/components/farol/landing-cam";
import { toScreen, ppu, type Viewport } from "@/world/camera";
import { FAROL_LANDINGS } from "@/world/farol-interior";

const VPS: [string, Viewport, number][] = [
  ["phone portrait", { w: 390, h: 844, top: 100, bottom: 164 }, 0],
  ["tablet landscape", { w: 1024, h: 768, top: 100, bottom: 164 }, 0],
  ["phone landscape, side card", { w: 844, h: 390, top: 16, bottom: 16 }, 372],
  ["tablet portrait", { w: 768, h: 1024, top: 100, bottom: 164 }, 0],
];

describe("landingCam", () => {
  it("shows the same room width on every upright screen (D 0.66 at 390 px)", () => {
    expect(landingCam(VPS[0][1], 1).D).toBeCloseTo(0.66, 2);
    for (const [, vp] of VPS.filter(([, v]) => v.h >= v.w)) {
      const cam = landingCam(vp, 1);
      expect(vp.w / ppu(cam, vp)).toBeCloseTo(ROOM_SHOWN, 0);
    }
  });

  it.each(VPS.filter(([, v, l]) => v.w > v.h && l === 0))("%s: shows a wider room, so the stop below and the stop above are in view", (_n, vp, left) => {
    const cam = landingCam(vp, 2, left);
    expect(vp.w / ppu(cam, vp)).toBeGreaterThan(ROOM_SHOWN);
    const r = STOP_R * ppu(cam, vp);
    for (const i of [1, 3]) {
      const [, sy] = toScreen(cam, FAROL_LANDINGS[i].x, FAROL_LANDINGS[i].y - 18, vp);
      expect(sy - r).toBeGreaterThanOrEqual(vp.top - 1); // the whole face clears the top bar and the card
      expect(sy + r).toBeLessThanOrEqual(vp.h - vp.bottom + 1);
    }
  });

  it.each(VPS)("%s: every landing's whole stop sits inside the free area", (_n, vp, left) => {
    FAROL_LANDINGS.forEach((L, i) => {
      const cam = landingCam(vp, i, left);
      const [sx, sy] = toScreen(cam, L.x, L.y - 18, vp);
      const r = STOP_R * ppu(cam, vp);
      expect(sx - r).toBeGreaterThanOrEqual(left);
      expect(sx + r).toBeLessThanOrEqual(vp.w);
      expect(sy - r).toBeGreaterThanOrEqual(vp.top - 1);
      expect(sy + r).toBeLessThanOrEqual(vp.h - vp.bottom + 1);
    });
  });
});
