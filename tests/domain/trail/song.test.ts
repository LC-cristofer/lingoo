import { describe, expect, it } from "vitest";
import { getUnit } from "@/domain/trail/content";
import type { SongStop } from "@/domain/trail/schema";
import { currentLyricIndex, lyricStartTimes } from "@/domain/trail/song";

const song = getUnit("forest-animals")!.stops[0] as SongStop;

describe("song timing", () => {
  it("starts each line at (introBars + bar - 1) bars of 4 beats", () => {
    expect(song.bpm).toBe(100);
    expect(song.introBars).toBe(1);
    expect(lyricStartTimes(song).map((t) => Math.round(t * 10) / 10)).toEqual([2.4, 7.2, 12, 16.8, 21.6, 26.4, 31.2]);
  });

  it("is -1 before the first line", () => {
    expect(currentLyricIndex(song, 0)).toBe(-1);
    expect(currentLyricIndex(song, 2.39)).toBe(-1);
  });

  it("is the last line that has started", () => {
    expect(currentLyricIndex(song, 2.4)).toBe(0);
    expect(currentLyricIndex(song, 7.3)).toBe(1);
    expect(currentLyricIndex(song, 999)).toBe(6);
  });
});
