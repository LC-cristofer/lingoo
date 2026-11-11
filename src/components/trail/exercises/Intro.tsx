"use client";

import { useEffect, useState } from "react";
import { Animal, ART_WORDS } from "@/art/Animal";
import { narrator } from "@/audio/narrator";
import { BigButton } from "@/components/BigButton";
import type { Exercise, Word } from "@/domain/trail/schema";
import type { Phase } from "@/domain/trail/session";
import { NarrationText } from "../NarrationText";
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
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        data-card={exercise.wordId}
        aria-label={ART_WORDS[exercise.wordId]}
        lang="en"
        disabled={!isInteractive(phase)}
        onClick={replay}
        className="inline-flex min-h-[120px] min-w-[120px] items-center justify-center rounded-3xl bg-white p-3 shadow-md active:scale-95"
      >
        <Animal id={exercise.wordId} size={240} />
      </button>
      <p className="font-display text-6xl font-bold">
        <NarrationText narration={[{ lang: "en-US", text: word?.en ?? ART_WORDS[exercise.wordId] }]} />
      </p>
      <div className="min-h-16">
        {ready ? (
          <BigButton label="Continuar" color="leaf" onPress={() => report(true)}>
            <span aria-hidden="true" className="font-display text-2xl font-bold">
              Já repeti!
            </span>
          </BigButton>
        ) : null}
      </div>
    </div>
  );
}
