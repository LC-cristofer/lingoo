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

  it("parses once: every call returns the same object", () => {
    expect(getPath()).toBe(getPath());
    expect(getUnit("forest-animals")).toBe(getUnit("forest-animals"));
    expect(getLines()).toBe(getLines());
    expect(getStop("forest-animals/song")!.unit).toBe(getUnit("forest-animals"));
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

  it("path has the 7 farol units and the 4 letras units; forest-animals and the four branches have content", () => {
    const path = getPath();
    const farol = path.filter((p) => p.area === "farol");
    expect(farol.map((p) => p.unitId)).toEqual(["forest-animals", "colors", "numbers", "hello", "family", "home", "food"]);
    expect(path.filter((p) => p.area === "letras").map((p) => p.unitId)).toEqual(["letras-1", "letras-2", "letras-3", "letras-4"]);
    expect(path.filter((p) => p.hasContent).map((p) => p.unitId)).toEqual(["forest-animals", "letras-1", "letras-2", "letras-3", "letras-4"]);
    expect(path.filter((p) => p.area === "letras").every((p) => p.world === undefined)).toBe(true);
    expect(farol.map((p) => p.world)).toEqual(["floresta", "floresta", "floresta", "vilarejo", "vilarejo", "vilarejo", "vilarejo"]);
  });

  it("path entries default to the farol of the descoberta island", () => {
    expect(parsePath([{ unitId: "x", world: "floresta", title: "X", icon: "i", hasContent: false }])[0]).toMatchObject({ island: "descoberta", area: "farol" });
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

  it("every word has an ask (Qual é o/a, the English word, Toque nele/nela) that is voiced", () => {
    for (const w of unit.words) {
      expect(w.ask.map((x) => x.lang)).toEqual(["pt-BR", "en-US", "pt-BR"]);
      expect(w.ask[1].text).toBe(`${w.en}?`);
      expect(w.ask[0].text).toMatch(/^Qual é (o|a)$/);
      expect(w.ask[2].text).toMatch(/^Toque (nele|nela)!$/);
    }
    const all = allNarrations();
    for (const w of unit.words) expect(all).toContainEqual(w.ask);
  });

  it("an ask matches the lesson listenTap wording, so its audio already exists", () => {
    const prompts = unit.stops.flatMap((s) => (s.kind === "lesson" ? s.exercises : [])).flatMap((e) => (e.kind === "listenTap" ? [e.prompt] : []));
    for (const w of unit.words) {
      const same = prompts.find((p) => p[1].text === `${w.en}?`);
      if (same) expect(w.ask).toEqual(same);
    }
  });

  it("the memory lines exist and are voiced", () => {
    const l = getLines();
    expect(l.memoryPraise).toEqual([{ lang: "en-US", text: "Yes! You remembered!" }]);
    expect(l.memoryHome[0].text).toBe("Tem cartões para treinar!");
    expect(l.memoryEmpty[0].text).toBe("Tudo em dia! Amanhã tem mais cartões.");
    expect(l.memoryEmptyLater[0].text).toBe("Tudo em dia!");
    expect(l.memoryNone[0].text).toBe("Termine uma lição para ganhar cartões!");
    expect(l.memoryIntro[0].text).toBe("Hora de treinar a memória!");
    expect(l.memoryDone).toHaveLength(9);
    expect(l.memoryDone[0][0].text).toBe("Você treinou a memória!");
    expect(l.memoryDone[3][0].text).toBe("Você lembrou de três palavras!");
    const all = allNarrations();
    for (const n of [l.memoryIntro, l.memoryAsk, l.memoryFlip, l.memoryPraise, l.memoryHome, l.memoryEmpty, l.memoryEmptyLater, l.memoryNone, ...l.memoryDone]) {
      expect(all).toContainEqual(n);
    }
  });

  it("parsePath / parseLines throw on garbage", () => {
    expect(() => parsePath({})).toThrow();
    expect(() => parseLines({})).toThrow();
  });
});
