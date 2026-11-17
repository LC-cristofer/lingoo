"use client";

import { useEffect } from "react";
import { music, type Track } from "./music";

/**
 * Background music for the screen that calls it: `track` plays while the screen shows, and null means
 * silence (the Memória round is an exercise: the child must hear the English words).
 * Leaving one music screen for another with the same track keeps it playing.
 */
export function useBackgroundMusic(track: Track | null) {
  useEffect(() => {
    if (track === null) return;
    music.play(track);
    return () => music.stop();
  }, [track]);
}
