import { describe, expect, it } from "vitest";
import { createProfileStore, defaultProfile, hasPlayed, PROFILE_KEY, sanitizeProfile, startBranch, startLevel, type Profile } from "@/domain/nestoy/profile";

const mem = (initial: Record<string, string> = {}): Storage => {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    length: 0,
  } as Storage;
};

describe("profile defaults", () => {
  it("starts pending, empty, with no levels", () => {
    expect(defaultProfile()).toEqual({
      version: 1,
      name: "",
      age: null,
      english: null,
      onboarding: "pending",
      createdAt: null,
      islands: { descoberta: { letras: { levels: {} } } },
    });
    expect(PROFILE_KEY).toBe("lingoo:profile:v1");
  });
});

describe("sanitizeProfile", () => {
  it("keeps valid fields", () => {
    const p = sanitizeProfile({
      version: 1,
      name: "Ana",
      age: 6,
      english: "words",
      onboarding: "done",
      createdAt: "2026-11-26T10:00:00.000Z",
      islands: { descoberta: { letras: { levels: { "b-1": 2, "b-2": 3 } } } },
    });
    expect(p).toMatchObject({ name: "Ana", age: 6, english: "words", onboarding: "done", createdAt: "2026-11-26T10:00:00.000Z" });
    expect(p.islands.descoberta.letras.levels).toEqual({ "b-1": 2, "b-2": 3 });
  });

  it("drops what is invalid", () => {
    const p = sanitizeProfile({ name: 5, age: 12, english: "x", onboarding: "later", createdAt: "yesterday", islands: { descoberta: { letras: { levels: { a: 7, b: 0, c: "2", d: 1 } } } } });
    expect(p.name).toBe("");
    expect(p.age).toBeNull();
    expect(p.english).toBeNull();
    expect(p.onboarding).toBe("pending");
    expect(p.createdAt).toBeNull();
    expect(p.islands.descoberta.letras.levels).toEqual({ d: 1 });
  });

  it("trims the name to 20 characters", () => {
    expect(sanitizeProfile({ name: "   " + "a".repeat(30) + "  " }).name).toBe("a".repeat(20));
  });

  it("gives defaults for anything that is not an object", () => {
    for (const raw of [null, undefined, 3, "x", [], { islands: 4 }, { islands: { descoberta: null } }]) expect(sanitizeProfile(raw).onboarding).toBe("pending");
  });

  it("ignores prototype keys among the levels", () => {
    const p = sanitizeProfile(JSON.parse('{"islands":{"descoberta":{"letras":{"levels":{"__proto__":2,"ok":2}}}}}'));
    expect(Object.keys(p.islands.descoberta.letras.levels)).toEqual(["ok"]);
  });
});

describe("createProfileStore", () => {
  it("round-trips", () => {
    const store = createProfileStore(mem());
    const p: Profile = { ...defaultProfile(), name: "Ana", age: 8, english: "reads", onboarding: "done" };
    store.save(p);
    expect(store.load()).toEqual(p);
  });
  it("survives null storage, throwing storage and garbage", () => {
    expect(createProfileStore(null).load()).toEqual(defaultProfile());
    expect(() => createProfileStore(null).save(defaultProfile())).not.toThrow();
    const boom = { getItem: () => { throw new Error("no"); }, setItem: () => { throw new Error("full"); } } as unknown as Storage;
    expect(createProfileStore(boom).load()).toEqual(defaultProfile());
    expect(() => createProfileStore(boom).save(defaultProfile())).not.toThrow();
    expect(createProfileStore(mem({ [PROFILE_KEY]: "{not json" })).load()).toEqual(defaultProfile());
  });
});

describe("startBranch (spec §3)", () => {
  const p = (english: Profile["english"], age: Profile["age"]): Profile => ({ ...defaultProfile(), english, age });
  it("none, words and unknown start at 1", () => {
    for (const age of [null, 4, 5, 9] as const) {
      expect(startBranch(p("none", age))).toBe(1);
      expect(startBranch(p("words", age))).toBe(1);
      expect(startBranch(p(null, age))).toBe(1);
    }
  });
  it("alphabet starts at 3", () => {
    expect(startBranch(p("alphabet", 5))).toBe(3);
    expect(startBranch(p("alphabet", 9))).toBe(3);
  });
  it("reads starts at 4 from age 7, else 3", () => {
    expect(startBranch(p("reads", 6))).toBe(3);
    expect(startBranch(p("reads", null))).toBe(3);
    expect(startBranch(p("reads", 7))).toBe(4);
    expect(startBranch(p("reads", 9))).toBe(4);
  });
});

describe("startLevel", () => {
  it("age sets the pace", () => {
    expect(startLevel({ ...defaultProfile(), age: 7 })).toBe(2);
    expect(startLevel({ ...defaultProfile(), age: 9 })).toBe(2);
    expect(startLevel({ ...defaultProfile(), age: 5 })).toBe(1);
    expect(startLevel(defaultProfile())).toBe(1);
  });
});

describe("hasPlayed", () => {
  it("is true for any completed stop, sticker or day played", () => {
    const empty = { completedStops: {}, stickers: {}, daysPlayed: [] };
    expect(hasPlayed(empty)).toBe(false);
    expect(hasPlayed({ ...empty, completedStops: { a: "x" } })).toBe(true);
    expect(hasPlayed({ ...empty, stickers: { a: "x" } })).toBe(true);
    expect(hasPlayed({ ...empty, daysPlayed: ["2026-11-01"] })).toBe(true);
  });
});
