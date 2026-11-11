"use client";

import { useEffect } from "react";
import { Animal } from "@/art/Animal";
import { narrator } from "@/audio/narrator";
import type { Exercise } from "@/domain/trail/schema";
import type { Phase } from "@/domain/trail/session";
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
    { choice: true, label: "Certo", emoji: "👍", color: "bg-leaf" },
    { choice: false, label: "Errado", emoji: "👎", color: "bg-coral" },
  ];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="rounded-3xl bg-white p-3 shadow-md">
        <Animal id={exercise.wordId} size={200} />
      </div>
      <div className="flex items-center justify-center gap-8">
        {thumbs.map(({ choice, label, emoji, color }) => {
          const glow = phase === "hint" && choice === exercise.isTrue;
          return (
            <button
              key={label}
              type="button"
              aria-label={label}
              data-glow={glow ? "true" : undefined}
              disabled={!isInteractive(phase)}
              onClick={() => choose(choice)}
              className={`${color} inline-flex min-h-[96px] min-w-[96px] items-center justify-center rounded-full text-5xl shadow-md transition-transform active:scale-95 disabled:active:scale-100 ${
                glow ? "animate-pulse ring-8 ring-sun" : ""
              }`}
            >
              <span aria-hidden="true">{emoji}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
