"use client";

import { useEffect } from "react";
import { Cat } from "@/art/Cat";
import { narrator } from "@/audio/narrator";
import type { ArtId, Lines, Narration, Word } from "@/domain/trail/schema";
import { Bubble } from "../kit/Bubble";
import { ChunkyButton } from "../kit/ChunkyButton";
import { ForestScene } from "../kit/ForestScene";
import { NarrationText } from "../NarrationText";
import { WordCards } from "./WordCards";

type StopClosingProps = {
  closing: Narration;
  words: Word[];
  wordIds: ArtId[];
  lines: Lines;
  ctaLabel: string;
  onCta: () => void;
};

function Star() {
  return (
    <svg viewBox="-60 -60 120 120" width={80} height={80} role="img" aria-label="Estrela" data-testid="star">
      <g className="art-sticker-pop">
        <path
          d="M0 -48 l14 30 l33 4 l-24 22 l7 32 l-30 -17 l-30 17 l7 -32 l-24 -22 l33 -4z"
          fill="#FFC93C"
          stroke="#F2A71B"
          strokeWidth="5"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** The routine every stop ends with: "Great job!", the words learnt and the star. */
export function StopClosing({ closing, words, wordIds, lines, ctaLabel, onCta }: StopClosingProps) {
  useEffect(() => {
    narrator.playSfx("star");
    void narrator.playNarration([...closing, ...lines.star]);
  }, [closing, lines.star]);

  return (
    <div className="k-screen">
      <ForestScene variant="lesson" trees />
      <div className="k-stage is-closing">
        <div className="k-hello">
          <Bubble tail="down">
            <NarrationText narration={closing} />
          </Bubble>
          <span className="k-cat">
            <Cat expression="happy" size={120} />
          </span>
        </div>
        <div className="k-reward">
          <Star />
          <p className="k-star-line">
            <NarrationText narration={lines.star} />
          </p>
        </div>
        <WordCards words={words} ids={wordIds} />
        <ChunkyButton label={ctaLabel} tone="sun" size="lg" className="k-cta" onPress={onCta}>
          {ctaLabel}
        </ChunkyButton>
      </div>
    </div>
  );
}
