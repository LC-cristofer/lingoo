import { describe, expect, it } from "vitest";
import { completeLesson, emptyProgress, placeStatus } from "@/domain/progress";
import { getWorlds } from "@/domain/content";
import type { World } from "@/domain/content-schema";

const place = (lessonId: string, hasContent = true) => ({ lessonId, title: lessonId, hasContent });
const fake = { places: [place("a"), place("b"), place("c")] } as unknown as World;

describe("placeStatus", () => {
  it("opens first place with content, rest are soon", () => {
    const world = getWorlds()[0];
    const p = emptyProgress();
    expect(placeStatus(world, p, "forest-animals")).toBe("open");
    for (const pl of world.places.slice(1)) expect(placeStatus(world, p, pl.lessonId)).toBe("soon");
  });
  it("marks done after completeLesson", () => {
    const world = getWorlds()[0];
    const p = completeLesson(emptyProgress(), "forest-animals", "s1", new Date());
    expect(placeStatus(world, p, "forest-animals")).toBe("done");
  });
  it("unlocks the next place only when the previous is done", () => {
    let p = emptyProgress();
    expect(["open", "locked", "locked"]).toEqual(["a", "b", "c"].map((id) => placeStatus(fake, p, id)));
    p = completeLesson(p, "a", "s", new Date());
    expect(["done", "open", "locked"]).toEqual(["a", "b", "c"].map((id) => placeStatus(fake, p, id)));
  });
  it("skips places without content when unlocking", () => {
    const w = { places: [place("a"), place("x", false), place("c")] } as unknown as World;
    const p = completeLesson(emptyProgress(), "a", "s", new Date());
    expect(placeStatus(w, p, "x")).toBe("soon");
    expect(placeStatus(w, p, "c")).toBe("open");
  });
  it("returns locked for unknown lesson", () => {
    expect(placeStatus(fake, emptyProgress(), "zzz")).toBe("locked");
  });
});

describe("completeLesson", () => {
  it("keeps the first date and returns same reference when repeated", () => {
    const p1 = completeLesson(emptyProgress(), "a", "s", new Date("2026-01-01T00:00:00Z"));
    const p2 = completeLesson(p1, "a", "s", new Date("2026-02-01T00:00:00Z"));
    expect(p2).toBe(p1);
    expect(p2.completedLessons.a).toBe("2026-01-01T00:00:00.000Z");
    expect(p2.stickers.s).toBe("2026-01-01T00:00:00.000Z");
  });
});
