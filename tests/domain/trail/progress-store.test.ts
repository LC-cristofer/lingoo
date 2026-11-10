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
    expect(createTrailProgressStore(localStorage).load()).toEqual(sample);
  });
  it("saves and persists", () => {
    localStorage.clear();
    const s = createTrailProgressStore(localStorage);
    s.save(sample);
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(sample);
    expect(s.load()).toBe(sample);
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
    s.save(sample);
    expect(s.load()).toBe(sample);
  });
});
