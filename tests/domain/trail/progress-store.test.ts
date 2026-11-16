import { beforeEach, describe, expect, it } from "vitest";
import { emptyProgress, type Progress } from "@/domain/trail/progress";
import { BACKUP_KEY, createTrailProgressStore, V1_KEY, V2_KEY, V3_KEY } from "@/domain/trail/progress-store";

const AT = "2026-01-01T00:00:00.000Z";
const sample = { completedStops: { a: AT }, stickers: { s: AT }, daysPlayed: ["2026-01-01"] };
const v1 = JSON.stringify({ completedLessons: { "forest-animals": AT }, stickers: { "sticker-fox": AT } });
const v3Of = (p: Partial<Progress> = {}): Progress => ({ ...emptyProgress(), ...sample, ...p });

beforeEach(() => localStorage.clear());

describe("trail progress store (v3)", () => {
  it("uses the v1, v2 and v3 keys", () => {
    expect([V1_KEY, V2_KEY, V3_KEY]).toEqual(["lingoo:progress:v1", "lingoo:progress:v2", "lingoo:progress:v3"]);
  });

  it("empty with no storage", () => {
    expect(createTrailProgressStore(null).load()).toEqual(emptyProgress());
  });

  it("migrates a stored v2 to v3 and leaves the v2 key byte for byte", () => {
    const raw = JSON.stringify(sample);
    localStorage.setItem(V2_KEY, raw);
    const p = createTrailProgressStore(localStorage).load();
    expect(p).toEqual(v3Of({ memory: {} }));
    expect(localStorage.getItem(V2_KEY)).toBe(raw);
    expect(JSON.parse(localStorage.getItem(V3_KEY)!)).toEqual(p);
  });

  it("keeps a v2 memory through the migration", () => {
    const memory = { "u:a": { box: 2, due: "2026-11-15" } };
    localStorage.setItem(V2_KEY, JSON.stringify({ ...sample, memory }));
    expect(createTrailProgressStore(localStorage).load().memory).toEqual(memory);
  });

  it("a malformed memory loads as {} without discarding the rest", () => {
    for (const bad of ["x", 3, [1], null, { "u:a": { box: 9, due: "2026-11-15" } }, { "u:a": { box: 1, due: "tomorrow" } }, { "u:a": "x" }]) {
      localStorage.clear();
      localStorage.setItem(V2_KEY, JSON.stringify({ ...sample, memory: bad }));
      const p = createTrailProgressStore(localStorage).load();
      expect(p.memory).toEqual({});
      expect(p.completedStops).toEqual(sample.completedStops);
    }
  });

  it("v1 and v2 together: trail from v2, v1 as legacy, both old keys untouched", () => {
    const raw2 = JSON.stringify(sample);
    localStorage.setItem(V2_KEY, raw2);
    localStorage.setItem(V1_KEY, v1);
    const p = createTrailProgressStore(localStorage).load();
    expect(p.completedStops).toEqual(sample.completedStops);
    expect(p.legacy).toEqual(JSON.parse(v1));
    expect(localStorage.getItem(V1_KEY)).toBe(v1);
    expect(localStorage.getItem(V2_KEY)).toBe(raw2);
  });

  it("v1 only gives no stop credit", () => {
    localStorage.setItem(V1_KEY, v1);
    const p = createTrailProgressStore(localStorage).load();
    expect(p.completedStops).toEqual({});
    expect(p.stickers).toEqual({});
    expect(p.legacy?.stickers).toEqual({ "sticker-fox": AT });
  });

  it("a valid v3 is loaded as it is and nothing is rewritten", () => {
    const raw3 = JSON.stringify(v3Of({ legacy: JSON.parse(v1) }));
    localStorage.setItem(V3_KEY, raw3);
    localStorage.setItem(V2_KEY, JSON.stringify({ completedStops: {}, stickers: {}, daysPlayed: [] }));
    const p = createTrailProgressStore(localStorage).load();
    expect(p).toEqual(JSON.parse(raw3));
    expect(localStorage.getItem(V3_KEY)).toBe(raw3);
  });

  it("saves to v3 only and never writes or removes v1/v2", () => {
    localStorage.setItem(V1_KEY, v1);
    const raw2 = JSON.stringify(sample);
    localStorage.setItem(V2_KEY, raw2);
    const s = createTrailProgressStore(localStorage);
    const full = v3Of({ memory: { "u:a": { box: 1, due: "2026-11-13" } } });
    s.save(full);
    expect(JSON.parse(localStorage.getItem(V3_KEY)!)).toEqual(full);
    expect(s.load()).toBe(full);
    expect(localStorage.getItem(V1_KEY)).toBe(v1);
    expect(localStorage.getItem(V2_KEY)).toBe(raw2);
  });

  it("a corrupt v3 is copied to the backup key before it is rebuilt from v2", () => {
    localStorage.setItem(V3_KEY, "{oops");
    localStorage.setItem(V2_KEY, JSON.stringify(sample));
    const p = createTrailProgressStore(localStorage).load();
    expect(localStorage.getItem(BACKUP_KEY)).toBe("{oops");
    expect(p.completedStops).toEqual(sample.completedStops);
    expect(JSON.parse(localStorage.getItem(V3_KEY)!)).toEqual(p);
  });

  it("a second corrupt v3 does not overwrite the first backup", () => {
    localStorage.setItem(BACKUP_KEY, "first");
    localStorage.setItem(V3_KEY, "second");
    createTrailProgressStore(localStorage).load();
    expect(localStorage.getItem(BACKUP_KEY)).toBe("first");
    const others = Object.keys(localStorage).filter((k) => k.startsWith(`${BACKUP_KEY}:`));
    expect(others).toHaveLength(1);
    expect(localStorage.getItem(others[0])).toBe("second");
  });

  it("if the backup cannot be written the corrupt v3 is left alone and progress stays in memory", () => {
    const data = new Map<string, string>([[V3_KEY, "{oops"]]);
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        if (k.startsWith(BACKUP_KEY)) throw new Error("full");
        data.set(k, v);
      },
    } as unknown as Storage;
    const s = createTrailProgressStore(storage);
    expect(s.load()).toEqual(emptyProgress());
    s.save(v3Of());
    expect(data.get(V3_KEY)).toBe("{oops");
  });

  it("never throws when storage throws", () => {
    const bad = {
      getItem() { throw new Error("x"); },
      setItem() { throw new Error("x"); },
    } as unknown as Storage;
    const s = createTrailProgressStore(bad);
    expect(s.load()).toEqual(emptyProgress());
    const full = v3Of();
    s.save(full);
    expect(s.load()).toBe(full);
  });
});
