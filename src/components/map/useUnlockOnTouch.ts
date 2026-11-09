"use client";

import { useEffect } from "react";
import { narrator } from "@/audio/narrator";

/** Opening a screen directly: the first touch anywhere unlocks audio. */
export function useUnlockOnTouch() {
  useEffect(() => {
    if (narrator.isUnlocked()) return;
    const unlock = () => narrator.unlock();
    document.addEventListener("pointerdown", unlock, { once: true });
    return () => document.removeEventListener("pointerdown", unlock);
  }, []);
}
