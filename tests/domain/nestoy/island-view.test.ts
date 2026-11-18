import { describe, expect, it } from "vitest";
import { getUnit } from "@/domain/trail/content";
import { addCards } from "@/domain/trail/memory";
import { completeStop, emptyProgress, type Progress } from "@/domain/trail/progress";
import { LAUNCH_STATES, farolLevel, levelBefore, nestThreads, suggestedPlace } from "@/domain/nestoy/island-view";

const unit = getUnit("forest-animals")!;
const ids = unit.stops.map((x) => x.id);
const done = (n: number): Progress =>
  ids.slice(0, n).reduce((p, id) => completeStop(p, id, new Date(2026, 10, 18)), emptyProgress());

describe("farolLevel", () => {
  it("0/1/2/3/5/6 done -> 1/2/2/3/3/4", () => {
    expect([0, 1, 2, 3, 5, 6].map((n) => farolLevel(done(n), unit))).toEqual([1, 2, 2, 3, 3, 4]);
  });
});

describe("levelBefore", () => {
  it("is the level without that stop", () => {
    expect(levelBefore(done(1), unit, ids[0])).toBe(1);
    expect(levelBefore(done(3), unit, ids[2])).toBe(2);
    expect(levelBefore(done(6), unit, ids[5])).toBe(3);
  });
});

describe("nestThreads", () => {
  it("1 once any stop is done", () => {
    expect(nestThreads(done(0), unit)).toBe(0);
    expect(nestThreads(done(1), unit)).toBe(1);
  });
});

describe("suggestedPlace", () => {
  const due = (p: Progress): Progress => ({ ...p, memory: addCards(p.memory, ["forest-animals/fox"], "2026-11-18") });
  it("farol while a stop is current", () => {
    expect(suggestedPlace(due(done(2)), unit, "2026-11-18")).toBe("farol");
  });
  it("ninho when everything is done and cards are due", () => {
    expect(suggestedPlace(due(done(6)), unit, "2026-11-18")).toBe("ninho");
  });
  it("farol when nothing is due", () => {
    expect(suggestedPlace(done(6), unit, "2026-11-18")).toBe("farol");
  });
});

it("launch states", () => {
  expect(LAUNCH_STATES).toEqual({ letras: "obra", numeros: "futuro", cores: "futuro", lago: "futuro" });
});
