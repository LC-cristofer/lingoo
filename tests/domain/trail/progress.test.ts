import { describe, expect, it } from "vitest";
import { getPath, getUnit } from "@/domain/trail/content";
import {
  completeStop,
  emptyProgress,
  markDay,
  stopStatus,
  unitStatus,
  weekDays,
} from "@/domain/trail/progress";

const unit = getUnit("forest-animals")!;
const ids = unit.stops.map((s) => s.id);
const units = { "forest-animals": unit };
const path = getPath();

describe("stopStatus", () => {
  it("first is current, rest locked", () => {
    const p = emptyProgress();
    expect(stopStatus(unit, p, ids[0])).toBe("current");
    for (const id of ids.slice(1)) expect(stopStatus(unit, p, id)).toBe("locked");
  });
  it("finishing the first makes it done and the second current", () => {
    const p = completeStop(emptyProgress(), ids[0], new Date(2026, 0, 1));
    expect(stopStatus(unit, p, ids[0])).toBe("done");
    expect(stopStatus(unit, p, ids[1])).toBe("current");
    expect(stopStatus(unit, p, ids[2])).toBe("locked");
  });
  it("unknown id is locked", () => {
    expect(stopStatus(unit, emptyProgress(), "nope")).toBe("locked");
  });
});

describe("unitStatus", () => {
  it("forest-animals current, others soon", () => {
    const p = emptyProgress();
    expect(unitStatus(path, units, p, "forest-animals")).toBe("current");
    const others = path.filter((u) => u.unitId !== "forest-animals");
    expect(others).toHaveLength(6);
    for (const u of others) expect(unitStatus(path, units, p, u.unitId)).toBe("soon");
  });
  it("done when all stops are done", () => {
    let p = emptyProgress();
    for (const id of ids) p = completeStop(p, id, new Date(2026, 0, 1));
    expect(unitStatus(path, units, p, "forest-animals")).toBe("done");
  });
  it("soon when unit data is missing", () => {
    expect(unitStatus(path, {}, emptyProgress(), "forest-animals")).toBe("soon");
  });
  it("later unit with content is locked until the previous is done", () => {
    const fake = [
      { unitId: "a", world: "w", title: "A", icon: "i", hasContent: true },
      { unitId: "b", world: "w", title: "B", icon: "i", hasContent: true },
    ] as unknown as typeof path;
    const us = { a: { ...unit, stops: [unit.stops[0]] }, b: unit } as unknown as Record<string, typeof unit>;
    expect(unitStatus(fake, us, emptyProgress(), "b")).toBe("locked");
    const p = completeStop(emptyProgress(), ids[0], new Date(2026, 0, 1));
    expect(unitStatus(fake, us, p, "a")).toBe("done");
    expect(unitStatus(fake, us, p, "b")).toBe("current");
  });
});

describe("completeStop", () => {
  it("is idempotent, keeps first date, adds sticker once", () => {
    const a = completeStop(emptyProgress(), "x", new Date(2026, 0, 1), "s");
    const b = completeStop(a, "x", new Date(2026, 5, 1), "s");
    expect(b).toBe(a);
    const c = completeStop(a, "x", new Date(2026, 5, 1));
    expect(c).toBe(a);
    const d = completeStop(a, "x", new Date(2026, 5, 1), "t");
    expect(d.completedStops.x).toBe(a.completedStops.x);
    expect(Object.keys(d.stickers).sort()).toEqual(["s", "t"]);
  });
});

describe("markDay", () => {
  it("same reference on same day; two days across midnight", () => {
    const a = markDay(emptyProgress(), new Date(2026, 2, 5, 23, 59));
    expect(a.daysPlayed).toEqual(["2026-03-05"]);
    expect(markDay(a, new Date(2026, 2, 5, 8, 0))).toBe(a);
    const b = markDay(a, new Date(2026, 2, 6, 0, 1));
    expect(b.daysPlayed).toEqual(["2026-03-05", "2026-03-06"]);
  });
  it("keeps sorted and the last 60", () => {
    let p = emptyProgress();
    for (let i = 70; i >= 1; i--) p = markDay(p, new Date(2026, 0, i));
    expect(p.daysPlayed).toHaveLength(60);
    expect(p.daysPlayed).toEqual([...p.daysPlayed].sort());
    expect(p.daysPlayed[59]).toBe("2026-03-11");
  });
});

describe("weekDays", () => {
  it("Monday..Sunday with isToday and played", () => {
    const now = new Date(2026, 10, 11); // Wednesday
    const p = markDay(emptyProgress(), new Date(2026, 10, 9));
    const w = weekDays(p, now);
    expect(w.map((d) => d.date)).toEqual([
      "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15",
    ]);
    expect(w[0].played).toBe(true);
    expect(w[1].played).toBe(false);
    expect(w.map((d) => d.isToday)).toEqual([false, false, true, false, false, false, false]);
  });
  it("Sunday belongs to the week starting the previous Monday", () => {
    const w = weekDays(emptyProgress(), new Date(2026, 10, 15));
    expect(w[0].date).toBe("2026-11-09");
    expect(w[6].isToday).toBe(true);
  });
});
