"use client";

import { Animal } from "@/art/Animal";
import { narrator } from "@/audio/narrator";
import type { Word } from "@/domain/trail/schema";
import { SpeakerIcon } from "../icons";

type FlipCardProps = {
  word: Word;
  flipped: boolean;
  onFlip: () => void;
  /** The pill on the front ("Toque para virar"): the same words the gatinho says. */
  hint: string;
  /** Size of the stacked card (the picture scales with it). */
  size?: "md" | "lg";
};

function FlipIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M4 10 a8 8 0 0 1 14 -4 l2 -2 v6 h-6 l2 -2 a5 5 0 0 0 -9 2z" fill="currentColor" />
      <path d="M20 14 a8 8 0 0 1 -14 4 l-2 2 v-6 h6 l-2 2 a5 5 0 0 0 9 -2z" fill="currentColor" />
    </svg>
  );
}

/**
 * The big memory card with two cards peeking out behind it. The front shows the picture, a "?" and
 * the hint; the back, once flipped, shows the picture, the English word and a speaker button.
 * The flip is a 3D turn; under reduced motion it is a plain swap (see kit.css).
 */
export function FlipCard({ word, flipped, onFlip, hint, size = "md" }: FlipCardProps) {
  return (
    <div className={`k-mem-stack ${size === "lg" ? "is-lg" : ""}`}>
      <span className="k-mem-behind is-b2" aria-hidden="true" />
      <span className="k-mem-behind is-b1" aria-hidden="true" />
      <button type="button" aria-label="Virar o cartão" onClick={onFlip} className={`k-mem-card ${flipped ? "is-flipped" : ""}`}>
        <span className="k-mem-face is-front" aria-hidden={flipped ? "true" : undefined}>
          <span className="k-mem-q" aria-hidden="true">
            ?
          </span>
          <Animal id={word.id} size={200} />
          <span className="k-mem-hint">
            <FlipIcon />
            {hint}
          </span>
        </span>
        <span className="k-mem-face is-back">
          {flipped ? (
            <>
              <Animal id={word.id} size={150} />
              <b className="k-mem-word" lang="en">
                {word.en}
              </b>
            </>
          ) : null}
        </span>
      </button>
      {flipped ? (
        <button
          type="button"
          aria-label="Ouvir a palavra"
          onClick={() => void narrator.playNarration(word.say)}
          className="k-round k-round-sky k-mem-say min-h-16 min-w-16"
        >
          <SpeakerIcon size={30} />
        </button>
      ) : null}
    </div>
  );
}
