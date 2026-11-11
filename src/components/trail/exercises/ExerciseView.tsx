"use client";

import type { CatExpression } from "@/art/Cat";
import type { Exercise, Word } from "@/domain/trail/schema";
import type { Phase } from "@/domain/trail/session";
import { Intro } from "./Intro";
import { ListenTap } from "./ListenTap";
import { MatchPairs } from "./MatchPairs";
import { TapRepeat } from "./TapRepeat";
import { TrueFalse } from "./TrueFalse";
import { WhatsMissing } from "./WhatsMissing";

export type ExerciseViewProps = {
  exercise: Exercise;
  words: Word[];
  phase: Phase;
  /** One attempt: true when right. Intro and TapRepeat report true from their "Continuar". */
  onAnswer: (correct: boolean) => void;
  /** Reserved for exercises with no right or wrong; unused for now. */
  onDone: () => void;
  /** TapRepeat drives the gatinho (listening after each tap, then pointing). */
  onCatExpression?: (e: CatExpression) => void;
};

/** Renders the right exercise for `exercise.kind` (only the cards: the shell draws prompt and banner). */
export function ExerciseView({ exercise, words, phase, onAnswer, onCatExpression }: ExerciseViewProps) {
  // A new exercise of the same kind starts from a clean state.
  const key = JSON.stringify(exercise);
  switch (exercise.kind) {
    case "intro":
      return <Intro key={key} exercise={exercise} words={words} phase={phase} onAnswer={onAnswer} />;
    case "listenTap":
      return <ListenTap key={key} exercise={exercise} words={words} phase={phase} onAnswer={onAnswer} />;
    case "trueFalse":
      return <TrueFalse key={key} exercise={exercise} phase={phase} onAnswer={onAnswer} />;
    case "matchPairs":
      return <MatchPairs key={key} exercise={exercise} words={words} phase={phase} onAnswer={onAnswer} />;
    case "whatsMissing":
      return <WhatsMissing key={key} exercise={exercise} words={words} phase={phase} onAnswer={onAnswer} />;
    case "tapRepeat":
      return (
        <TapRepeat key={key} exercise={exercise} phase={phase} onAnswer={onAnswer} onCatExpression={onCatExpression} />
      );
  }
}
