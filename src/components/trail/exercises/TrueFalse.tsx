"use client";

import { useEffect } from "react";
import { Animal } from "@/art/Animal";
import { narrator } from "@/audio/narrator";
import type { Exercise } from "@/domain/trail/schema";
import type { Phase } from "@/domain/trail/session";
import { ChunkyButton } from "../kit/ChunkyButton";
import { isInteractive, useAnswerGate } from "./shared";

type TrueFalseProps = {
  exercise: Extract<Exercise, { kind: "trueFalse" }>;
  phase: Phase;
  onAnswer: (correct: boolean) => void;
};

/** "This is a bird! Certo ou errado?": the picture plus 👍 / 👎. */
export function TrueFalse({ exercise, phase, onAnswer }: TrueFalseProps) {
  const { isLocked, report } = useAnswerGate(phase, onAnswer);

  useEffect(() => {
    void narrator.playNarration(exercise.say);
    return () => narrator.stop();
  }, [exercise]);

  const choose = (choice: boolean) => {
    if (isLocked()) return;
    narrator.playSfx("tap");
    report(choice === exercise.isTrue);
  };

  const thumbs = [
    { choice: true, label: "Certo", emoji: "👍", tone: "leaf" as const },
    { choice: false, label: "Errado", emoji: "👎", tone: "coral" as const },
  ];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="k-slot k-slot-art">
        <Animal id={exercise.wordId} size={200} />
      </div>
      <div className="flex items-center justify-center gap-8">
        {thumbs.map(({ choice, label, emoji, tone }) => {
          const glow = phase === "hint" && choice === exercise.isTrue;
          return (
            <ChunkyButton
              key={label}
              label={label}
              tone={tone}
              size="round"
              disabled={!isInteractive(phase)}
              onPress={() => choose(choice)}
              data={{ "data-glow": glow ? "true" : undefined }}
              className={`min-h-[96px] min-w-[96px] ${glow ? "is-glow" : ""}`}
            >
              <span aria-hidden="true">{emoji}</span>
            </ChunkyButton>
          );
        })}
      </div>
    </div>
  );
}
