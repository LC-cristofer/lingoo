import { describe, expect, it } from "vitest";
import { AREA, PAL } from "@/world/palette";
import {
  FAROL_DOOR,
  NEST,
  PLACE_ANCHORS,
  ROUTES,
  buildIsland,
  type IslandStates,
} from "@/world/island";

const base: IslandStates = { letras: "obra", numeros: "futuro", cores: "futuro", lago: "futuro" };
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

describe("buildIsland", () => {
  it("is deterministic", () => {
    const a = buildIsland({ states: base, threads: 1 });
    const b = buildIsland({ states: base, threads: 1 });
    expect(a).toEqual(b);
  });

  it("contains every id and class the stage engine relies on", () => {
    const { island, far, mid, near } = buildIsland({ states: base, threads: 1 });
    const all = far + mid + island + near;
    for (const id of [
      "slotNest", "slotActors", "nightGrade", "lights", "poolNino", "beam", "farol", "farol-lamp",
      "barco", "glowGrad", "poolGrad", "beamGrad", "clipUnder", "underLight",
    ]) {
      expect(island, id).toContain(`id="${id}"`);
    }
    for (const cls of ["pennant", "thread", "bfly", "ff", "sway", "drift", "bob", "dangle", "lantern-swing", "ripple"]) {
      expect(all, cls).toMatch(new RegExp(`class="${cls}[" ]`));
    }
    for (const id of ["sun", "moon", "stars"]) expect(far).toContain(`id="${id}"`);
    expect(island).toContain('id="butterflies"');
    expect(island).toContain('class="sprout"');
    expect(island).toContain('class="obra"');
    expect(island).toContain('class="hammer"');
  });

  it("defines each shared gradient once", () => {
    const { island } = buildIsland({ states: base, threads: 1 });
    for (const id of ["glowGrad", "poolGrad", "beamGrad", "clipUnder", "underLight"]) {
      expect(count(island, new RegExp(`id="${id}"`, "g")), id).toBe(1);
    }
  });

  it("draws scaffolding only for letras:obra and sprouts for futuro", () => {
    const pronto: IslandStates = { letras: "pronto", numeros: "pronto", cores: "pronto", lago: "pronto" };
    const all = buildIsland({ states: pronto, threads: 1 }).island;
    expect(all).not.toContain('class="obra"');
    expect(all).not.toContain('class="sprout"');
    expect(buildIsland({ states: { ...pronto, letras: "obra" }, threads: 1 }).island).toContain('class="obra"');
    expect(buildIsland({ states: { ...pronto, numeros: "futuro" }, threads: 1 }).island).toContain('class="sprout"');
  });

  it("shows exactly `threads` threads", () => {
    const { island } = buildIsland({ states: base, threads: 2 });
    const threads = island.match(/<path class="thread"[^>]*>/g) ?? [];
    expect(threads).toHaveLength(4);
    expect(threads.filter((t) => !t.includes('opacity="0"'))).toHaveLength(2);
  });

  it("exposes a route path per id", () => {
    expect(Object.keys(ROUTES).sort()).toEqual(["farol", "jardim", "lago", "letras", "numeros"]);
    const { island } = buildIsland({ states: base, threads: 1 });
    for (const k of Object.keys(ROUTES)) expect(island).toContain(`id="route-${k}"`);
  });

  it("exposes anchors and constants", () => {
    expect(NEST).toEqual({ x: 500, y: 1040, dy: -190 });
    expect(FAROL_DOOR).toEqual({ x: 862, y: 1136 });
    expect(PLACE_ANCHORS.farol).toEqual({ x: 876, y: 862 });
    expect(PLACE_ANCHORS.lago).toEqual({ x: 640, y: 1306 });
    expect(Object.keys(PLACE_ANCHORS)).toHaveLength(6);
  });

  it("keeps the Nino orange out of the world palette", () => {
    expect(Object.values(PAL).join(" ").toUpperCase()).not.toContain("#FF9F43");
    expect(AREA.linguas).toBe("#2E9FD8");
    expect(AREA.ninho).toBe("#C98A4B");
  });
});
