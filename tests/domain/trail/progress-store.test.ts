import { describe, expect, it, vi } from "vitest";
import { emptyProgress, type Progress } from "@/domain/trail/progress";
import { BACKUP_KEY, createTrailProgressStore, V1_KEY, V2_KEY, V3_KEY } from "@/domain/trail/progress-store";

const AT = "2026-01-01T00:00:00.000Z";
const V1 = JSON.stringify({ completedLessons: { "forest-animals": AT }, stickers: { "sticker-fox": AT } });
const V2 = JSON.stringify({ completedStops: { "forest-animals/song": AT }, stickers: {}, daysPlayed: ["2026-01-01"] });
const sample: Progress = { ...emptyProgress(), completedStops: { a: AT }, stickers: { s: AT }, daysPlayed: ["2026-01-01"] };

/** An in-memory Storage that records writes and removals; `failOn` makes setItem throw for a key. */
function fakeStorage(initial: Record<string, string> = {}, failOn: (key: string) => boolean = () => false) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: vi.fn((k: string, v: string) => {
      if (failOn(k)) throw new Error("quota");
      data.set(k, v);
    }),
    removeItem: vi.fn((k: string) => void data.delete(k)),
    clear: vi.fn(() => data.clear()),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  };
  return { storage: storage as unknown as Storage, data, spies: storage };
}

describe("trail progress store (v3)", () => {
  it("is empty with no storage", () => {
    expect(createTrailProgressStore(null).load()).toEqual(emptyProgress());
  });

  it("migrates v2 and v1 into v3 and leaves both old keys byte for byte", () => {
    const { storage, data, spies } = fakeStorage({ [V1_KEY]: V1, [V2_KEY]: V2 });
    const p = createTrailProgressStore(storage).load();
    expect(p.completedStops).toEqual({ "forest-animals/song": AT });
    expect(p.legacy).toEqual(JSON.parse(V1));
    expect(JSON.parse(data.get(V3_KEY)!)).toEqual(p);
    expect(data.get(V1_KEY)).toBe(V1);
    expect(data.get(V2_KEY)).toBe(V2);
    expect(spies.removeItem).not.toHaveBeenCalled();
    expect(spies.clear).not.toHaveBeenCalled();
    expect(spies.setItem.mock.calls.map(([k]) => k)).toEqual([V3_KEY]);
  });

  it("loads a valid v3 as it is, without writing anything", () => {
    const v3 = JSON.stringify(sample);
    const { storage, spies } = fakeStorage({ [V3_KEY]: v3, [V2_KEY]: V2 });
    expect(createTrailProgressStore(storage).load()).toEqual(sample);
    expect(spies.setItem).not.toHaveBeenCalled();
  });

  it("copies a corrupt v3 to the backup key before rebuilding it", () => {
    const { storage, data } = fakeStorage({ [V3_KEY]: "{not json", [V2_KEY]: V2 });
    const p = createTrailProgressStore(storage).load();
    expect(data.get(BACKUP_KEY)).toBe("{not json");
    expect(p.completedStops).toEqual({ "forest-animals/song": AT });
    expect(JSON.parse(data.get(V3_KEY)!)).toEqual(p);
  });

  it("a second corruption never overwrites the first backup", () => {
    const { storage, data } = fakeStorage({ [V3_KEY]: "{second", [BACKUP_KEY]: "{first" });
    createTrailProgressStore(storage).load();
    expect(data.get(BACKUP_KEY)).toBe("{first");
    const others = [...data.keys()].filter((k) => k.startsWith(`${BACKUP_KEY}:`));
    expect(others.map((k) => data.get(k))).toEqual(["{second"]);
  });

  it("if the backup cannot be written, the corrupt v3 is never overwritten", () => {
    const { storage, data } = fakeStorage({ [V3_KEY]: "{not json", [V2_KEY]: V2 }, (k) => k.startsWith(BACKUP_KEY));
    const store = createTrailProgressStore(storage);
    expect(store.load().completedStops).toEqual({ "forest-animals/song": AT });
    store.save(sample);
    expect(data.get(V3_KEY)).toBe("{not json");
    expect(store.load()).toBe(sample);
  });

  it("saves to v3 only", () => {
    const { storage, data } = fakeStorage({ [V2_KEY]: V2 });
    const store = createTrailProgressStore(storage);
    store.load();
    store.save(sample);
    expect(JSON.parse(data.get(V3_KEY)!)).toEqual(sample);
    expect(data.get(V2_KEY)).toBe(V2);
    expect(store.load()).toBe(sample);
  });

  it("never throws when storage throws", () => {
    const bad = {
      getItem() {
        throw new Error("x");
      },
      setItem() {
        throw new Error("x");
      },
    } as unknown as Storage;
    const s = createTrailProgressStore(bad);
    expect(s.load()).toEqual(emptyProgress());
    s.save(sample);
    expect(s.load()).toBe(sample);
  });
});
