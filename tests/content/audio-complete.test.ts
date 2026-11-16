// @vitest-environment node
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { segmentId } from "@/domain/trail/audio-id";
import { allNarrations } from "@/domain/trail/content";

const AUDIO = path.resolve(__dirname, "../../public/audio");
const MIN_BYTES = 2048;

function size(file: string): number {
  return existsSync(file) ? statSync(file).size : 0;
}

describe("audio completeness", () => {
  it("every narrated segment has its generated mp3", () => {
    const missing = allNarrations()
      .flat()
      .filter((seg) => size(path.join(AUDIO, `${segmentId(seg)}.mp3`)) <= MIN_BYTES)
      .map((seg) => `${segmentId(seg)} ${seg.lang} "${seg.text}"`);
    expect([...new Set(missing)]).toEqual([]);
  });

  it("the unit song and the five sound effects exist", () => {
    const files = [
      "song-forest-animals.mp3",
      ...["correct", "retry", "star", "chest", "tap"].map((n) => `sfx/${n}.mp3`),
    ];
    expect(files.filter((f) => size(path.join(AUDIO, f)) <= MIN_BYTES)).toEqual([]);
  });
});
