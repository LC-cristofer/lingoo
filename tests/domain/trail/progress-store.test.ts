import { describe, expect, it } from "vitest";
import { emptyProgress } from "@/domain/trail/progress";
import { createTrailProgressStore } from "@/domain/trail/progress-store";

const KEY = "lingoo:progress:v2";
const sample = { completedStops: { a: "2026-01-01T00:00:00.000Z" }, stickers: { s: "2026-01-01T00:00:00.000Z" }, daysPlayed: ["2026-01-01"] };

describe("trail progress store", () => {
  it("empty with no storage", () => {
    expect(createTrailProgressStore(null).load()).toEqual(emptyProgress());
  });
  it("loads stored v2 data", () => {
    localStorage.clear();
    localStorage.setItem(KEY, JSON.stringify(sample));
    expect(createTrailProgressStore(localStorage).load()).toEqual({ ...sample, memory: {} });
  });
  it("a stored v2 payload without memory loads with an empty memory and keeps its stops and stickers", () => {
    localStorage.clear();
    localStorage.setItem(KEY, JSON.stringify(sample));
    const p = createTrailProgressStore(localStorage).load();
    expect(p.memory).toEqual({});
    expect(p.completedStops).toEqual(sample.completedStops);
    expect(p.stickers).toEqual(sample.stickers);
    expect(p.daysPlayed).toEqual(sample.daysPlayed);
  });
  it("loads a stored memory", () => {
    localStorage.clear();
    const memory = { "u:a": { box: 2, due: "2026-11-15" } };
    localStorage.setItem(KEY, JSON.stringify({ ...sample, memory }));
    expect(createTrailProgressStore(localStorage).load().memory).toEqual(memory);
  });
  it("a malformed memory loads as {} without discarding the rest", () => {
    for (const bad of ["x", 3, [1], null, { "u:a": { box: 9, due: "2026-11-15" } }, { "u:a": { box: 1, due: "tomorrow" } }, { "u:a": "x" }]) {
      localStorage.clear();
      localStorage.setItem(KEY, JSON.stringify({ ...sample, memory: bad }));
      const p = createTrailProgressStore(localStorage).load();
      expect(p.memory).toEqual({});
      expect(p.completedStops).toEqual(sample.completedStops);
    }
  });
  it("saves and persists", () => {
    localStorage.clear();
    const s = createTrailProgressStore(localStorage);
    const full = { ...sample, memory: { "u:a": { box: 1, due: "2026-11-13" } } };
    s.save(full);
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(full);
    expect(s.load()).toBe(full);
  });
  it("corrupt or v1 data gives empty progress", () => {
    localStorage.clear();
    localStorage.setItem(KEY, "{not json");
    expect(createTrailProgressStore(localStorage).load()).toEqual(emptyProgress());
    localStorage.setItem(KEY, JSON.stringify({ completedLessons: {}, stickers: {} }));
    expect(createTrailProgressStore(localStorage).load()).toEqual(emptyProgress());
    localStorage.setItem(KEY, JSON.stringify({ ...sample, daysPlayed: [1] }));
    expect(createTrailProgressStore(localStorage).load()).toEqual(emptyProgress());
  });
  it("never throws when storage throws", () => {
    const bad = {
      getItem() { throw new Error("x"); },
      setItem() { throw new Error("x"); },
    } as unknown as Storage;
    const s = createTrailProgressStore(bad);
    expect(s.load()).toEqual(emptyProgress());
    const full = { ...sample, memory: {} };
    s.save(full);
    expect(s.load()).toBe(full);
  });
});
