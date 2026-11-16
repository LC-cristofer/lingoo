import { describe, expect, it } from "vitest";
import { migrateProgress } from "@/domain/trail/progress-migrate";

const AT = "2026-11-10T12:00:00.000Z";
const memory = { "forest-animals:bear": { box: 2, due: "2026-11-13" } };
const v2 = JSON.stringify({
  completedStops: { "forest-animals/song": AT, "forest-animals/lesson-1": AT },
  stickers: {},
  daysPlayed: ["2026-11-09", "2026-11-10"],
  memory,
});
const v1 = JSON.stringify({ completedLessons: { "forest-animals": AT }, stickers: { "sticker-fox": AT } });
const v3 = JSON.stringify({
  version: 3,
  completedStops: { "forest-animals/song": AT },
  stickers: {},
  daysPlayed: ["2026-11-12"],
  memory: {},
  legacy: null,
});

describe("migrateProgress", () => {
  it("v2 only: keeps stops, stickers, days and memory cards, with no legacy", () => {
    const r = migrateProgress({ v3: null, v2, v1: null });
    expect(r.source).toBe("v2");
    expect(r.corruptV3).toBe(false);
    expect(r.progress).toEqual({ version: 3, ...JSON.parse(v2), legacy: null });
  });

  it("a v2 saved before the memory training loads with an empty memory", () => {
    const old = JSON.stringify({ completedStops: { "forest-animals/song": AT }, stickers: {}, daysPlayed: [] });
    const r = migrateProgress({ v3: null, v2: old, v1: null });
    expect(r.source).toBe("v2");
    expect(r.progress.memory).toEqual({});
    expect(r.progress.completedStops).toEqual({ "forest-animals/song": AT });
  });

  it("v1 only: empty trail progress, the v1 data kept as legacy, no stop credit", () => {
    const r = migrateProgress({ v3: null, v2: null, v1 });
    expect(r.source).toBe("v1");
    expect(r.progress.completedStops).toEqual({});
    expect(r.progress.stickers).toEqual({});
    expect(r.progress.daysPlayed).toEqual([]);
    expect(r.progress.memory).toEqual({});
    expect(r.progress.legacy).toEqual(JSON.parse(v1));
  });

  it("v1 grants no v2 stop even when its lesson ids look like stop ids", () => {
    const tricky = JSON.stringify({ completedLessons: { "forest-animals/song": AT }, stickers: {} });
    const r = migrateProgress({ v3: null, v2: null, v1: tricky });
    expect(r.progress.completedStops).toEqual({});
    expect(r.progress.legacy?.completedLessons).toEqual({ "forest-animals/song": AT });
  });

  it("v2 and v1: both kept", () => {
    const r = migrateProgress({ v3: null, v2, v1 });
    expect(r.source).toBe("v2+v1");
    expect(r.progress.completedStops).toEqual(JSON.parse(v2).completedStops);
    expect(r.progress.memory).toEqual(memory);
    expect(r.progress.legacy).toEqual(JSON.parse(v1));
  });

  it("a valid v3 wins as it is, whatever v2 and v1 say", () => {
    const r = migrateProgress({ v3, v2, v1 });
    expect(r.source).toBe("v3");
    expect(r.corruptV3).toBe(false);
    expect(r.progress).toEqual(JSON.parse(v3));
  });

  it("a v3 with a malformed memory keeps the rest and loads an empty memory (not corrupt)", () => {
    const odd = JSON.stringify({ ...JSON.parse(v3), memory: { "u:a": { box: 9, due: "x" } } });
    const r = migrateProgress({ v3: odd, v2, v1: null });
    expect(r.source).toBe("v3");
    expect(r.corruptV3).toBe(false);
    expect(r.progress.memory).toEqual({});
    expect(r.progress.completedStops).toEqual(JSON.parse(v3).completedStops);
  });

  it("a corrupt v3 is flagged and rebuilt from v2", () => {
    for (const bad of [
      "{not json",
      "[]",
      '{"version":2}',
      JSON.stringify({ ...JSON.parse(v3), stickers: { x: 1 } }),
      JSON.stringify({ ...JSON.parse(v3), legacy: { completedLessons: 3 } }),
    ]) {
      const r = migrateProgress({ v3: bad, v2, v1: null });
      expect(r.corruptV3).toBe(true);
      expect(r.source).toBe("v2");
      expect(r.progress.completedStops).toEqual(JSON.parse(v2).completedStops);
    }
  });

  it("nothing stored: empty progress", () => {
    const r = migrateProgress({ v3: null, v2: null, v1: null });
    expect(r.source).toBe("empty");
    expect(r.corruptV3).toBe(false);
    expect(r.progress).toEqual({ version: 3, completedStops: {}, stickers: {}, daysPlayed: [], memory: {}, legacy: null });
  });

  it("a v2 with a non-string value is treated as absent and never throws", () => {
    const bad = JSON.stringify({ completedStops: { "forest-animals/song": 5 }, stickers: {}, daysPlayed: [] });
    expect(() => migrateProgress({ v3: null, v2: bad, v1 })).not.toThrow();
    const r = migrateProgress({ v3: null, v2: bad, v1 });
    expect(r.source).toBe("v1");
    expect(r.progress.completedStops).toEqual({});
  });

  it("garbage everywhere never throws", () => {
    expect(() => migrateProgress({ v3: "null", v2: "42", v1: '"text"' })).not.toThrow();
    expect(migrateProgress({ v3: "null", v2: "42", v1: '"text"' }).source).toBe("empty");
  });
});
