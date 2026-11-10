import { describe, expect, it } from "vitest";
import { allNarrations, getLines, getPath, getStop, getUnit } from "@/domain/trail/content";
import { parseLines, parsePath, parseUnit } from "@/domain/trail/schema";
import unitJson from "../../../content/units/forest-animals.json";

/* eslint-disable @typescript-eslint/no-explicit-any -- tests mutate raw JSON to build invalid fixtures */
const clone = () => structuredClone(unitJson) as any;
const stopOf = (u: any, kind: string) => u.stops.find((s: any) => s.kind === kind);

describe("trail content", () => {
  const unit = getUnit("forest-animals")!;

  it("has the 6 words and the stops in order", () => {
    expect(unit.words.map((w) => w.id)).toEqual(["bear", "bird", "frog", "snake", "spider", "mouse"]);
    expect(unit.stops.map((s) => s.kind)).toEqual(["song", "lesson", "lesson", "lesson", "story", "challenge"]);
    expect(unit.stops.map((s) => s.id)).toEqual([
      "forest-animals/song",
      "forest-animals/lesson-1",
      "forest-animals/lesson-2",
      "forest-animals/lesson-3",
      "forest-animals/story",
      "forest-animals/challenge",
    ]);
  });

  it("returns null for unknown units and stops", () => {
    expect(getUnit("nope")).toBeNull();
    expect(getUnit("toString")).toBeNull();
    expect(getStop("nope/x")).toBeNull();
    expect(getStop("forest-animals/nope")).toBeNull();
    const found = getStop("forest-animals/lesson-2")!;
    expect(found.index).toBe(2);
    expect(found.unit.id).toBe("forest-animals");
  });

  it("path has 7 units, only forest-animals with content", () => {
    const path = getPath();
    expect(path.map((p) => p.unitId)).toEqual(["forest-animals", "colors", "numbers", "hello", "family", "home", "food"]);
    expect(path.filter((p) => p.hasContent).map((p) => p.unitId)).toEqual(["forest-animals"]);
    expect(path.map((p) => p.world)).toEqual(["floresta", "floresta", "floresta", "vilarejo", "vilarejo", "vilarejo", "vilarejo"]);
  });

  it("lines parse", () => {
    expect(getLines().praise).toHaveLength(4);
  });

  it("en-US segments have no Portuguese accents", () => {
    for (const n of allNarrations()) {
      for (const s of n) if (s.lang === "en-US") expect(s.text).not.toMatch(/[áàâãéêíóôõúç]/i);
    }
  });

  it("exercise counts", () => {
    for (const s of unit.stops) {
      if (s.kind === "lesson") {
        expect(s.exercises.length).toBeGreaterThanOrEqual(8);
        expect(s.exercises.length).toBeLessThanOrEqual(12);
      }
      if (s.kind === "challenge") {
        expect(s.exercises.length).toBeGreaterThanOrEqual(8);
        expect(s.exercises.length).toBeLessThanOrEqual(10);
      }
    }
  });

  it("parseUnit rejects invalid data", () => {
    expect(() => parseUnit(unitJson)).not.toThrow();

    let u = clone();
    stopOf(u, "song").exercises[0].answerId = "frog";
    stopOf(u, "song").exercises[0].optionIds = ["bear", "bird"];
    expect(() => parseUnit(u)).toThrow();

    u = clone();
    const wm = stopOf(u, "challenge").exercises.find((e: any) => e.kind === "whatsMissing");
    wm.shownIds.push(wm.missingId);
    expect(() => parseUnit(u)).toThrow();

    u = clone();
    delete stopOf(u, "challenge").sticker;
    expect(() => parseUnit(u)).toThrow();

    u = clone();
    u.stops.reverse();
    expect(() => parseUnit(u)).toThrow();

    u = clone();
    u.banner[0].text = "  ";
    expect(() => parseUnit(u)).toThrow();

    u = clone();
    stopOf(u, "song").exercises[0].optionIds = ["bear", "bird", "ghost"];
    expect(() => parseUnit(u)).toThrow();

    u = clone();
    stopOf(u, "story").pages[1].hotspots[0].x = 1.5;
    expect(() => parseUnit(u)).toThrow();

    u = clone();
    u.stops[1].id = u.stops[0].id;
    expect(() => parseUnit(u)).toThrow();
  });

  it("parsePath / parseLines throw on garbage", () => {
    expect(() => parsePath({})).toThrow();
    expect(() => parseLines({})).toThrow();
  });
});
