import { describe, expect, it } from "vitest";
import {
  SETTINGS_KEY,
  createSettingsStore,
  defaultSettings,
  isNight,
  openingMode,
  pauseDue,
  type Settings,
} from "@/domain/nestoy/settings";

const at = (h: number, m: number) => new Date(2026, 10, 18, h, m, 0);
const s = (patch: Partial<Settings> = {}): Settings => ({ ...defaultSettings(), ...patch });

describe("defaults", () => {
  it("match the spec", () => {
    expect(defaultSettings()).toEqual({
      version: 1, ambient: "dia", bedtime: "19:30", pauseMinutes: 0, opening: "auto", motion: "auto", openingSeen: false, lastVisit: null,
    });
    expect(SETTINGS_KEY).toBe("lingoo:settings:v1");
  });
});

describe("openingMode", () => {
  const now = at(10, 0);
  it("reduced when the setting or the device asks", () => {
    expect(openingMode(s({ motion: "reduzir" }), now, false)).toBe("reduced");
    expect(openingMode(s(), now, true)).toBe("reduced");
  });
  it("full the first time", () => expect(openingMode(s(), now, false)).toBe("full"));
  it("none when already visited today", () => {
    expect(openingMode(s({ openingSeen: true, lastVisit: "2026-11-18" }), now, false)).toBe("none");
  });
  it("short on another day", () => {
    expect(openingMode(s({ openingSeen: true, lastVisit: "2026-11-17" }), now, false)).toBe("short");
    expect(openingMode(s({ openingSeen: true, lastVisit: null }), now, false)).toBe("short");
  });
  it("opening curta is never full", () => {
    expect(openingMode(s({ opening: "curta" }), now, false)).toBe("short");
    expect(openingMode(s({ opening: "curta", lastVisit: "2026-11-18" }), now, false)).toBe("none");
  });
});

describe("isNight", () => {
  const r = s({ ambient: "rotina" });
  it("rotina follows the bedtime until 06:00", () => {
    expect(isNight(r, at(19, 29))).toBe(false);
    expect(isNight(r, at(19, 30))).toBe(true);
    expect(isNight(r, at(0, 30))).toBe(true);
    expect(isNight(r, at(5, 59))).toBe(true);
    expect(isNight(r, at(6, 0))).toBe(false);
  });
  it("dia is never night, noite always", () => {
    expect(isNight(s({ ambient: "dia" }), at(23, 0))).toBe(false);
    expect(isNight(s({ ambient: "noite" }), at(12, 0))).toBe(true);
  });
  it("an invalid bedtime falls back to 19:30", () => {
    expect(isNight(s({ ambient: "rotina", bedtime: "xx" }), at(19, 30))).toBe(true);
    expect(isNight(s({ ambient: "rotina", bedtime: "xx" }), at(19, 29))).toBe(false);
  });
});

describe("pauseDue", () => {
  it("off when 0", () => expect(pauseDue(s(), 0, 10 * 3600_000)).toBe(false));
  it("due once the minutes have passed", () => {
    const p = s({ pauseMinutes: 15 });
    expect(pauseDue(p, 0, 14 * 60_000 + 59_000)).toBe(false);
    expect(pauseDue(p, 0, 15 * 60_000)).toBe(true);
  });
});

function memStorage(initial: Record<string, string> = {}): Storage {
  const m = { ...initial };
  return {
    getItem: (k: string) => (k in m ? m[k] : null),
    setItem: (k: string, v: string) => void (m[k] = v),
  } as unknown as Storage;
}

describe("createSettingsStore", () => {
  it("round-trips", () => {
    const st = memStorage();
    createSettingsStore(st).save(s({ ambient: "noite", pauseMinutes: 20 }));
    expect(createSettingsStore(st).load()).toMatchObject({ ambient: "noite", pauseMinutes: 20 });
  });
  it("missing, null storage, corrupt or throwing give defaults", () => {
    expect(createSettingsStore(memStorage()).load()).toEqual(defaultSettings());
    expect(createSettingsStore(null).load()).toEqual(defaultSettings());
    expect(createSettingsStore(memStorage({ [SETTINGS_KEY]: "{bad" })).load()).toEqual(defaultSettings());
    const throwing = {
      getItem: () => { throw new Error("no"); },
      setItem: () => { throw new Error("no"); },
    } as unknown as Storage;
    const store = createSettingsStore(throwing);
    expect(store.load()).toEqual(defaultSettings());
    expect(() => store.save(s())).not.toThrow();
  });
  it("bad field values fall back per field", () => {
    const st = memStorage({ [SETTINGS_KEY]: JSON.stringify({ version: 1, ambient: "x", pauseMinutes: 7, bedtime: "20:00", openingSeen: true }) });
    expect(createSettingsStore(st).load()).toMatchObject({ ambient: "dia", pauseMinutes: 0, bedtime: "20:00", openingSeen: true });
  });
});
