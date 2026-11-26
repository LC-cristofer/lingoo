import { describe, expect, it } from "vitest";
import { AREA, PAL } from "@/world/palette";
import {
  ARVORE_DOOR,
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

describe("the Árvore das Letras on the island", () => {
  const ready: IslandStates = { ...base, letras: "pronto" };
  const layer = (svg: string, cls: string) => svg.match(new RegExp(`<g class="${cls}"[^>]*>`))?.[0] ?? null;
  const shown = (svg: string, cls: string) => {
    const tag = layer(svg, cls);
    expect(tag, cls).not.toBeNull();
    return !tag!.includes('opacity="0"');
  };

  it("ready: no scaffolding, a trunk door; each level shows its marker layer and hides the ones above", () => {
    for (const level of [1, 2, 3, 4] as const) {
      const { island } = buildIsland({ states: ready, threads: 0, arvoreLevel: level });
      expect(island).not.toContain('class="obra"');
      expect(island).not.toContain('class="hammer"');
      expect(shown(island, "arvore-l2"), `level ${level}: letter-fruits`).toBe(level >= 2);
      expect(shown(island, "arvore-l3"), `level ${level}: birds and lanterns`).toBe(level >= 3);
      expect(shown(island, "arvore-l4"), `level ${level}: flowers`).toBe(level >= 4);
      expect(island.match(/<g id="arvore-lights"[^>]*>/)![0].includes('opacity="0"'), `level ${level}: lanterns at night`).toBe(level < 3);
      expect(island.match(/<circle id="arvore-aura"[^>]*>/)![0].includes('opacity="0"'), `level ${level}: crown glow`).toBe(level < 4);
    }
  });

  it("level 1 is a plain crown: no letter-fruits showing; level 2 hangs letters A to F", () => {
    expect(layer(buildIsland({ states: ready, threads: 0, arvoreLevel: 1 }).island, "arvore-l2")).toBe('<g class="arvore-l2" opacity="0">');
    expect(layer(buildIsland({ states: ready, threads: 0, arvoreLevel: 2 }).island, "arvore-l2")).toBe('<g class="arvore-l2">');
    const { island } = buildIsland({ states: ready, threads: 0, arvoreLevel: 2 });
    const fruits = island.slice(island.indexOf('<g class="arvore-l2">'), island.indexOf('<g class="arvore-l3"'));
    for (const L of ["A", "B", "C", "D", "E", "F"]) expect(fruits).toContain(`>${L}</text>`);
  });

  it("under construction keeps the scaffold and no growth layers", () => {
    const { island } = buildIsland({ states: base, threads: 0, arvoreLevel: 4 });
    expect(island).toContain('class="obra"');
    expect(island).not.toContain("arvore-l2");
  });

  it("threads can be given per area: only the Letras thread (index 1) woven", () => {
    const { island } = buildIsland({ states: ready, threads: [false, true] });
    const threads = island.match(/<path class="thread"[^>]*>/g)!;
    expect(threads.map((t) => !t.includes('opacity="0"'))).toEqual([false, true, false, false]);
    expect(threads[1]).toContain(PAL.letras);
  });

  it("the tree's door sits at the trunk's foot", () => {
    expect(ARVORE_DOOR).toEqual({ x: 241, y: 928 });
  });
});

