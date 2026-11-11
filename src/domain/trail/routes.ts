/** The route of a stop. Stop ids look like "forest-animals/lesson-1", so the slash is part of the path. */
export function stopHref(stopId: string): string {
  return `/parada/${stopId}`;
}

/** Task 12 flips this to true when the song and story players exist (the review page links them then). */
export const SONG_AND_STORY_READY = false;
