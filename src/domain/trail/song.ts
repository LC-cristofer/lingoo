import type { SongStop } from "./schema";

/** Seconds from the start of the song file at which each lyric line is sung (4 beats per bar). */
export function lyricStartTimes(stop: SongStop): number[] {
  const barSeconds = (4 * 60) / stop.bpm;
  return stop.lyrics.map((l) => (stop.introBars + l.bar - 1) * barSeconds);
}

/** The last line whose start time has been reached, or -1 before the first one. */
export function currentLyricIndex(stop: SongStop, t: number): number {
  const starts = lyricStartTimes(stop);
  let index = -1;
  for (let i = 0; i < starts.length; i++) if (t + 1e-9 >= starts[i]) index = i;
  return index;
}
