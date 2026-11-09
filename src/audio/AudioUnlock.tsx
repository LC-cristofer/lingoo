"use client";

import { useUnlockOnTouch } from "./useUnlockOnTouch";

/** Mounted once in the root layout: audio unlocks on the first touch on any screen. */
export function AudioUnlock() {
  useUnlockOnTouch();
  return null;
}
