"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TrackState = "idle" | "playing" | "paused" | "ended" | "failed";

/** A track that shows no sign of life (no "playing" or "timeupdate") by now is treated as failed. */
export const TRACK_STALL_MS = 4_000;

const defaultCreateAudio = (src: string) => new Audio(src);

/**
 * One music file. The element is created on the first `play()` (call it from a tap, so autoplay
 * rules allow it); nothing is fetched before. A load error, a refused play() or a stall marks the
 * track "failed" so the screen can fall back. Unmounting pauses and releases the element.
 */
export function useTrack(src: string, createAudio: (src: string) => HTMLAudioElement = defaultCreateAudio) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stallRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<TrackState>("idle");
  const [time, setTime] = useState(0);

  const clearStall = () => {
    if (stallRef.current !== null) clearTimeout(stallRef.current);
    stallRef.current = null;
  };

  const fail = useCallback(() => {
    clearStall();
    setState("failed");
  }, []);

  const ensure = useCallback((): HTMLAudioElement => {
    if (audioRef.current) return audioRef.current;
    const a = createAudio(src);
    a.addEventListener("timeupdate", () => {
      clearStall();
      setTime(a.currentTime);
    });
    a.addEventListener("playing", () => {
      clearStall();
      setState("playing");
    });
    a.addEventListener("ended", () => {
      clearStall();
      setState("ended");
    });
    a.addEventListener("error", fail);
    audioRef.current = a;
    return a;
  }, [createAudio, src, fail]);

  const play = useCallback(async () => {
    const a = ensure();
    setState("playing");
    clearStall();
    stallRef.current = setTimeout(fail, TRACK_STALL_MS);
    try {
      await a.play();
    } catch (e) {
      // A pause() during the start rejects with AbortError: that is not a failure.
      if ((e as { name?: string } | null)?.name !== "AbortError") fail();
    }
  }, [ensure, fail]);

  const pause = useCallback(() => {
    clearStall();
    audioRef.current?.pause();
    setState((s) => (s === "playing" ? "paused" : s));
  }, []);

  const restart = useCallback(() => {
    const a = ensure();
    a.currentTime = 0;
    setTime(0);
    void play();
  }, [ensure, play]);

  useEffect(
    () => () => {
      clearStall();
      const a = audioRef.current;
      if (!a) return;
      a.pause();
      a.removeAttribute("src");
      a.load();
      audioRef.current = null;
    },
    [],
  );

  return { play, pause, restart, time, state };
}
