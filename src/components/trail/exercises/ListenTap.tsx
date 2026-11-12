"use client";

import { useEffect, useState } from "react";
import { narrator } from "@/audio/narrator";
import type { ArtId, Exercise, Word } from "@/domain/trail/schema";
import type { Phase } from "@/domain/trail/session";
import { TileGrid } from "../kit/AnswerTile";
import { ArtCard, isInteractive, pickedState, sayFor, useAnswerGate } from "./shared";

type ListenTapProps = {
  exercise: Extract<Exercise, { kind: "listenTap" }>;
  words: Word[];
  phase: Phase;
  onAnswer: (correct: boolean) => void;
};

/** "Qual é o bear?": picture cards with no text; each tap is one attempt. */
export function ListenTap({ exercise, words, phase, onAnswer }: ListenTapProps) {
  const { isLocked, report } = useAnswerGate(phase, onAnswer);
  const [picked, setPicked] = useState<ArtId | null>(null);

  useEffect(() => {
    void narrator.playNarration(exercise.prompt);
    return () => narrator.stop();
  }, [exercise]);

  const tap = (id: ArtId) => {
    if (isLocked()) return;
    narrator.playSfx("tap");
    const correct = id === exercise.answerId;
    setPicked(id);
    if (correct) void narrator.playNarration(sayFor(words, id));
    report(correct);
  };

  // Rendered in content order: the content already varies where the answer sits.
  return (
    <TileGrid>
      {exercise.optionIds.map((id) => (
        <ArtCard
          key={id}
          id={id}
          onTap={() => tap(id)}
          disabled={!isInteractive(phase)}
          glow={phase === "hint" && id === exercise.answerId}
          state={pickedState(phase, id, picked, exercise.answerId)}
        />
      ))}
    </TileGrid>
  );
}
