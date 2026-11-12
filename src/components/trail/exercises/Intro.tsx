"use client";

import { useEffect, useState } from "react";
import { ART_WORDS } from "@/art/Animal";
import { narrator } from "@/audio/narrator";
import type { Exercise, Word } from "@/domain/trail/schema";
import type { Phase } from "@/domain/trail/session";
import { NarrationText } from "../NarrationText";
import { AnswerTile } from "../kit/AnswerTile";
import { ChunkyButton } from "../kit/ChunkyButton";
import { isInteractive, sayFor, useAnswerGate } from "./shared";

type IntroProps = {
  exercise: Extract<Exercise, { kind: "intro" }>;
  words: Word[];
  phase: Phase;
  onAnswer: (correct: boolean) => void;
};

/** Presents a new word: big picture, the English word, and "Já repeti!" once the gatinho is done. */
export function Intro({ exercise, words, phase, onAnswer }: IntroProps) {
  const { isLocked, report } = useAnswerGate(phase, onAnswer);
  const [ready, setReady] = useState(false);
  const word = words.find((w) => w.id === exercise.wordId);

  useEffect(() => {
    let alive = true;
    void narrator.playNarration(exercise.say).then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
      narrator.stop();
    };
  }, [exercise]);

  const replay = () => {
    if (isLocked()) return;
    narrator.playSfx("tap");
    void narrator.playNarration(sayFor(words, exercise.wordId));
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <AnswerTile
        id={exercise.wordId}
        label={ART_WORDS[exercise.wordId]}
        lang="en"
        disabled={!isInteractive(phase)}
        onPress={replay}
        artSize={240}
        className="is-big"
      />
      <p className="k-big-word">
        <NarrationText narration={[{ lang: "en-US", text: word?.en ?? ART_WORDS[exercise.wordId] }]} />
      </p>
      <div className="min-h-16">
        {ready && isInteractive(phase) ? (
          <ChunkyButton label="Continuar" tone="sun" onPress={() => report(true)}>
            Já repeti!
          </ChunkyButton>
        ) : null}
      </div>
    </div>
  );
}
