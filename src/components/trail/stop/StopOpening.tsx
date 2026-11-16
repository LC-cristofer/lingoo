"use client";

import { useEffect } from "react";
import { Cat } from "@/art/Cat";
import { narrator } from "@/audio/narrator";
import type { ArtId, Narration, Word } from "@/domain/trail/schema";
import { PlayIcon } from "../icons";
import { Bubble } from "../kit/Bubble";
import { ChunkyButton } from "../kit/ChunkyButton";
import { ForestScene } from "../kit/ForestScene";
import { LessonTopBar } from "../kit/LessonTopBar";
import { NarrationText } from "../NarrationText";
import { WordCards } from "./WordCards";

type StopOpeningProps = {
  title: string;
  opening: Narration;
  words: Word[];
  wordIds: ArtId[];
  onStart: () => void;
  onExit: () => void;
};

/** The routine every stop starts with: the gatinho says the goal, the words of the day, "Começar". */
export function StopOpening({ title, opening, words, wordIds, onStart, onExit }: StopOpeningProps) {
  // With audio still locked this stays silent until the ▶ tap.
  useEffect(() => {
    void narrator.playNarration(opening);
  }, [opening]);

  const start = () => {
    narrator.unlock();
    onStart();
  };

  return (
    <div className="k-screen">
      <ForestScene variant="lesson" trees />
      <div className="k-stage">
        <LessonTopBar ratio={0} onExit={onExit} title={title} />
        <div className="k-hello">
          <Bubble tail="down">
            <NarrationText narration={opening} />
          </Bubble>
          <span className="k-cat">
            <Cat expression="happy" size={170} />
          </span>
        </div>
        <WordCards words={words} ids={wordIds} />
        <ChunkyButton label="Começar" tone="sun" size="lg" className="k-cta" onPress={start}>
          Começar
          <PlayIcon size={28} />
        </ChunkyButton>
      </div>
    </div>
  );
}
