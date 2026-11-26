import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { segmentId } from "@/domain/trail/audio-id";
import { allNarrations, getPath } from "@/domain/trail/content";

const AUDIO = join(__dirname, "../../public/audio");
const MIN_BYTES = 2048;

function sizeOf(file: string): number {
  return existsSync(file) ? statSync(file).size : 0;
}

describe("audio completeness", () => {
  it("every narrated segment of the open units has a voice file larger than 2 KB", () => {
    // A unit still closed on the path (hasContent false) is voiced before it opens (Árvore das Letras: Task 5).
    const open = new Set(getPath().filter((u) => u.hasContent).map((u) => u.unitId));
    const segments = allNarrations((id) => open.has(id)).flat();
    expect(segments.length).toBeGreaterThan(100);
    const missing = [...new Map(segments.map((s) => [segmentId(s), s])).entries()]
      .filter(([id]) => sizeOf(join(AUDIO, `${id}.mp3`)) <= MIN_BYTES)
      .map(([id, s]) => `${id} (${s.lang}) ${s.text}`);
    expect(missing).toEqual([]);
  });

  it("the chant and the sound effects exist", () => {
    expect(sizeOf(join(AUDIO, "song-forest-animals.mp3"))).toBeGreaterThan(MIN_BYTES);
    for (const name of [
      "correct", "retry", "star", "chest", "tap",
      "reveal", "yawn", "stretch", "pop", "steps", "bell", "blocks", "pages", "water", "leaves", "obra", "dive", "grow", "thread", "night",
    ]) {
      expect(sizeOf(join(AUDIO, "sfx", `${name}.mp3`)), name).toBeGreaterThan(MIN_BYTES);
    }
  });

  it("the two ambient loops exist", () => {
    for (const kind of ["day", "night"]) {
      expect(sizeOf(join(AUDIO, "ambient", `${kind}.mp3`)), kind).toBeGreaterThan(MIN_BYTES);
    }
  });
});
