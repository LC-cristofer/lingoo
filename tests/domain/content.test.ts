import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getLesson, getWorlds } from "@/domain/content";
import { parseLesson } from "@/domain/content-schema";

function baseLesson() {
  return JSON.parse(JSON.stringify(getLesson("forest-animals")));
}

describe("content", () => {
  it("loads the prototype lesson with steps in order and 5 cards", () => {
    const lesson = getLesson("forest-animals");
    expect(lesson).not.toBeNull();
    expect(lesson!.steps.map((s) => s.kind)).toEqual([
      "song", "story", "tap", "drag", "repeat", "sticker",
    ]);
    expect(lesson!.cards.map((c) => c.id)).toEqual(["bear", "fox", "owl", "rabbit", "frog"]);
  });

  it("returns null for unknown lessons", () => {
    expect(getLesson("nao-existe")).toBeNull();
  });

  it("has 6 places in the first world, only the first with content", () => {
    const places = getWorlds()[0].places;
    expect(places).toHaveLength(6);
    expect(places.map((p) => p.hasContent)).toEqual([true, false, false, false, false, false]);
    expect(places[0].lessonId).toBe("forest-animals");
  });

  it("rejects an answerId outside optionIds", () => {
    const data = baseLesson();
    const tap = data.steps.find((s: { kind: string }) => s.kind === "tap");
    tap.rounds[0].answerId = "owl-x";
    tap.rounds[0].optionIds = ["bear", "fox", "owl"];
    expect(() => parseLesson(data)).toThrow();
  });

  it("rejects a cardId that does not exist", () => {
    const data = baseLesson();
    const drag = data.steps.find((s: { kind: string }) => s.kind === "drag");
    drag.cardIds.push("dragon");
    expect(() => parseLesson(data)).toThrow();
  });

  it("rejects a lesson without a sticker step", () => {
    const data = baseLesson();
    data.steps = data.steps.filter((s: { kind: string }) => s.kind !== "sticker");
    expect(() => parseLesson(data)).toThrow();
  });

  it("gives the sticker a spoken name for the album", () => {
    const sticker = getLesson("forest-animals")!.steps.find((s) => s.kind === "sticker");
    expect(sticker?.kind === "sticker" && sticker.name).toEqual({ text: "A fox sticker!" });
  });

  it("rejects a sticker step without a name", () => {
    const data = baseLesson();
    const sticker = data.steps.find((s: { kind: string }) => s.kind === "sticker");
    delete sticker.name;
    expect(() => parseLesson(data)).toThrow();
  });

  it("rejects duplicate step ids", () => {
    const data = baseLesson();
    data.steps[1].id = data.steps[0].id;
    expect(() => parseLesson(data)).toThrow();
  });

  it("points every image to an existing file in public/", () => {
    const lesson = getLesson("forest-animals")!;
    const images: string[] = lesson.cards.map((c) => c.image);
    for (const step of lesson.steps) {
      if (step.kind === "song" || step.kind === "sticker") images.push(step.image);
      if (step.kind === "story") images.push(...step.pages.map((p) => p.image));
    }
    expect(images.length).toBeGreaterThan(5);
    for (const img of images) {
      const file = path.join("public", img.replace(/^\//, ""));
      expect(fs.existsSync(file), img).toBe(true);
    }
  });
});
