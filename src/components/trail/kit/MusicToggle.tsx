"use client";

import { useSyncExternalStore } from "react";
import { music } from "@/audio/music";
import { MusicIcon } from "../icons";

/**
 * The parent switch for the background music, beside the top chips. The choice is saved on the device.
 * The server (and hydration) render it on, as the default.
 */
export function MusicToggle() {
  const on = useSyncExternalStore(music.subscribe, music.isEnabled, () => true);
  return (
    <button
      type="button"
      className={`k-music ${on ? "is-on" : "is-off"}`}
      aria-label={on ? "Música ligada" : "Música desligada"}
      aria-pressed={on}
      onClick={() => music.setEnabled(!on)}
    >
      <MusicIcon size={34} off={!on} />
    </button>
  );
}
