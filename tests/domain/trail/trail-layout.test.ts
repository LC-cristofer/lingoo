import { describe, expect, it } from "vitest";
import { MAP_WIDTH, mapLayout, stopPositions, trailPath } from "@/domain/trail/trail-layout";

describe("trail layout", () => {
  it("places the six stops of the phone map as in the approved mockup", () => {
    const stops = stopPositions("phone", 6);
    expect(stops.map((s) => [s.x, s.y])).toEqual([
      [118, 236],
      [214, 324],
      [278, 412],
      [206, 500],
      [118, 588],
      [196, 676],
    ]);
    expect(stops.map((s) => s.side)).toEqual(["right", "left", "left", "right", "right", "right"]);
    for (const s of stops) {
      expect(s.x).toBeGreaterThanOrEqual(60);
      expect(s.x).toBeLessThanOrEqual(MAP_WIDTH.phone - 60);
    }
  });

  it("places the six stops of the tablet map as in the approved mockup", () => {
    const stops = stopPositions("tablet", 6);
    expect(stops.map((s) => [s.x, s.y])).toEqual([
      [540, 128],
      [680, 226],
      [774, 324],
      [670, 422],
      [540, 520],
      [650, 618],
    ]);
  });

  it("stacks each following unit below the first one, inside the map", () => {
    for (const form of ["phone", "tablet"] as const) {
      const layout = mapLayout(form, 3);
      expect(layout.units).toHaveLength(3);
      const lastStop = layout.stops[layout.stops.length - 1];
      let previousY = lastStop.y;
      for (const u of layout.units) {
        expect(u.sign.y).toBeGreaterThan(previousY - 120);
        expect(u.ghosts).toHaveLength(4);
        for (const g of u.ghosts) {
          expect(g.x).toBeGreaterThan(0);
          expect(g.x).toBeLessThan(MAP_WIDTH[form]);
          expect(g.y).toBeLessThan(layout.height);
        }
        previousY = u.ghosts[u.ghosts.length - 1].y;
      }
    }
  });

  it("draws a path through every point", () => {
    const d = trailPath([
      [10, 10],
      [50, 90],
    ]);
    expect(d.startsWith("M10 10")).toBe(true);
    expect(d).toContain("50 90");
  });
});
