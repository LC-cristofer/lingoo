import { describe, expect, it } from "vitest";
import { getUnit } from "@/domain/trail/content";
import { addCards } from "@/domain/trail/memory";
import { completeStop, emptyProgress, type Progress } from "@/domain/trail/progress";
import {
  LAUNCH_STATES, areaOfStop, arvoreLevel, arvoreLevelBefore, farolLevel, lastPlayedByArea, levelBefore, nestThreads, suggestedPlace, wovenThreads,
  type AreaUnits,
} from "@/domain/nestoy/island-view";

const unit = getUnit("forest-animals")!;
const letras = [1, 2, 3, 4].map((n) => getUnit(`letras-${n}`)!);
const areas: AreaUnits = { farol: unit, letras };
const ids = unit.stops.map((x) => x.id);
const treeIds = letras.flatMap((u) => u.stops.map((s) => s.id));
const at = (h: number) => new Date(2026, 10, 18, h);
const finish = (p: Progress, list: string[], h = 10): Progress => list.reduce((q, id) => completeStop(q, id, at(h)), p);
const done = (n: number): Progress => finish(emptyProgress(), ids.slice(0, n));
const tree = (n: number, p = emptyProgress()): Progress => finish(p, treeIds.slice(0, n));

describe("farolLevel", () => {
  it("0/1/2/3/5/6 done -> 1/2/2/3/3/4", () => {
    expect([0, 1, 2, 3, 5, 6].map((n) => farolLevel(done(n), unit))).toEqual([1, 2, 2, 3, 3, 4]);
  });
  it("ignores the tree's stops", () => {
    expect(farolLevel(tree(24), unit)).toBe(1);
  });
});

describe("levelBefore", () => {
  it("is the level without that stop", () => {
    expect(levelBefore(done(1), unit, ids[0])).toBe(1);
    expect(levelBefore(done(3), unit, ids[2])).toBe(2);
    expect(levelBefore(done(6), unit, ids[5])).toBe(3);
  });
});

describe("arvoreLevel", () => {
  it("sums every branch: 0/2/3/8/9/17/18/24 done -> 1/1/2/2/3/3/4/4", () => {
    expect([0, 2, 3, 8, 9, 17, 18, 24].map((n) => arvoreLevel(tree(n), letras))).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
  });
  it("counts across branches and ignores the farol", () => {
    const p = finish(done(6), [letras[0].stops[0].id, letras[2].stops[0].id, letras[3].stops[5].id]);
    expect(arvoreLevel(p, letras)).toBe(2);
  });
  it("arvoreLevelBefore is the level without that stop", () => {
    expect(arvoreLevelBefore(tree(3), letras, treeIds[2])).toBe(1);
    expect(arvoreLevelBefore(tree(3), letras, treeIds[0])).toBe(1);
    expect(arvoreLevelBefore(tree(4), letras, treeIds[3])).toBe(2);
    expect(arvoreLevelBefore(tree(9), letras, treeIds[8])).toBe(2);
    expect(arvoreLevelBefore(tree(18), letras, treeIds[17])).toBe(3);
  });
});

describe("threads", () => {
  it("one per area with any stop done, each at its own place in the nest", () => {
    expect(nestThreads(done(0), areas)).toBe(0);
    expect(nestThreads(done(1), areas)).toBe(1);
    expect(wovenThreads(done(1), areas)).toEqual([true, false]);
    expect(nestThreads(tree(1), areas)).toBe(1);
    expect(wovenThreads(tree(1), areas)).toEqual([false, true]);
    expect(nestThreads(tree(5, done(6)), areas)).toBe(2);
    expect(wovenThreads(tree(1, done(1)), areas)).toEqual([true, true]);
  });
  it("areaOfStop", () => {
    expect(areaOfStop("letras-3/story")).toBe("letras");
    expect(areaOfStop("forest-animals/song")).toBe("farol");
  });
});

describe("suggestedPlace", () => {
  const due = (p: Progress): Progress => ({ ...p, memory: addCards(p.memory, ["forest-animals:fox"], "2026-11-18") });
  const sug = (p: Progress) => suggestedPlace(p, areas, "2026-11-18", lastPlayedByArea(p, areas));
  it("a fresh install: the farol (a tie keeps it)", () => {
    expect(sug(emptyProgress())).toBe("farol");
  });
  it("among the areas with a stop to play, the least recently played", () => {
    expect(sug(done(2))).toBe("arvore"); // the tree was never played
    const both = finish(done(2), [treeIds[0]], 11);
    expect(sug(both)).toBe("farol"); // the tree was played after the farol
    expect(sug(finish(both, [ids[2]], 12))).toBe("arvore");
  });
  it("does not change within the day until a stop is completed", () => {
    const p = finish(done(2), [treeIds[0]], 11);
    const last = lastPlayedByArea(p, areas);
    expect(last).toEqual({ farol: at(10).toISOString(), letras: at(11).toISOString() });
    expect(suggestedPlace(p, areas, "2026-11-18", last)).toBe("farol");
    expect(suggestedPlace(due(p), areas, "2026-11-18", last)).toBe("farol"); // cards due do not move it
    expect(suggestedPlace(p, areas, "2026-11-19", last)).toBe("farol");
  });
  it("an area with nothing left is skipped", () => {
    expect(sug(done(6))).toBe("arvore");
    expect(sug(finish(tree(24, emptyProgress()), [], 9))).toBe("farol");
  });
  it("ninho when everything is done and cards are due; farol when nothing is due", () => {
    const all = tree(24, done(6));
    expect(sug(due(all))).toBe("ninho");
    expect(sug(all)).toBe("farol");
  });
});

it("launch states: the tree is ready", () => {
  expect(LAUNCH_STATES).toEqual({ letras: "pronto", numeros: "futuro", cores: "futuro", lago: "futuro" });
});
