"use client";

import { useEffect } from "react";
import { narrator } from "@/audio/narrator";

// User-gesture events: unlock() must run inside one so iOS lets speech start. pointerdown is
// not one for touch (only pointerup/touchend are), so it would prime speech too early.
const GESTURES = ["touchend", "click", "keydown"] as const;

/** The first touch anywhere unlocks audio, whichever screen the app was opened on. */
export function useUnlockOnTouch() {
  useEffect(() => {
    if (narrator.isUnlocked()) return;
    const off = () => GESTURES.forEach((t) => document.removeEventListener(t, unlock, true));
    // Capture phase: unlocked before any click handler starts narration or navigates.
    function unlock() {
      off();
      narrator.unlock();
    }
    GESTURES.forEach((t) => document.addEventListener(t, unlock, true));
    return off;
  }, []);
}
