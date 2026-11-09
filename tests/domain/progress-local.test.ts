import { describe, expect, it } from "vitest";
import { createLocalProgressStore } from "@/domain/progress-local";
import { completeLesson, emptyProgress } from "@/domain/progress";

const KEY = "lingoo:progress:v1";
function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
  } as unknown as Storage;
}
const throwing = {
  getItem() { throw new Error("no"); },
  setItem() { throw new Error("no"); },
} as unknown as Storage;
const sample = completeLesson(emptyProgress(), "a", "s", new Date("2026-01-01T00:00:00Z"));

describe("createLocalProgressStore", () => {
  it("round-trips", () => {
    const store = createLocalProgressStore(memStorage());
    store.save(sample);
    expect(store.load()).toEqual(sample);
  });
  it("returns empty for corrupted or wrongly-shaped JSON", () => {
    for (const bad of ["{oops", "null", '{"completedLessons":1}']) {
      const s = memStorage();
      s.setItem(KEY, bad);
      expect(createLocalProgressStore(s).load()).toEqual(emptyProgress());
    }
  });
  it("does not throw with failing storage and keeps memory", () => {
    const store = createLocalProgressStore(throwing);
    expect(store.load()).toEqual(emptyProgress());
    expect(() => store.save(sample)).not.toThrow();
    expect(store.load()).toEqual(sample);
  });
  it("works with null storage", () => {
    const store = createLocalProgressStore(null);
    store.save(sample);
    expect(store.load()).toEqual(sample);
  });
});
