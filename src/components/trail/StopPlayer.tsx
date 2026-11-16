"use client";

import { useEffect, useMemo, useState } from "react";
import { narrator } from "@/audio/narrator";
import { getLines } from "@/domain/trail/content";
import type { LessonStop, Unit } from "@/domain/trail/schema";
import { ChestReward } from "./ChestReward";
import { ExerciseLoop, StopClosing, StopOpening } from "./StopFlow";
import { useTrailProgress } from "./TrailProgressProvider";

type StopPlayerProps = {
  unit: Unit;
  stop: LessonStop;
  onExit: () => void;
  /** False in review mode: nothing is saved. */
  record?: boolean;
};

type Step = "opening" | "session" | "closing" | "chest";

export function StopPlayer({ unit, stop, onExit, record = true }: StopPlayerProps) {
  const lines = useMemo(() => getLines(), []);
  const { finishStop } = useTrailProgress();
  const [step, setStep] = useState<Step>("opening");

  // Leaving the player (any way) silences the narrator.
  useEffect(() => () => narrator.stop(), []);

  if (step === "opening") {
    return (
      <StopOpening
        title={stop.title}
        opening={stop.opening}
        words={unit.words}
        wordIds={stop.wordIds}
        onStart={() => {
          narrator.unlock();
          setStep("session");
        }}
        onExit={onExit}
      />
    );
  }

  if (step === "closing") {
    const isChallenge = stop.kind === "challenge";
    return (
      <StopClosing
        closing={stop.closing}
        words={unit.words}
        wordIds={stop.wordIds}
        isChallenge={isChallenge}
        onContinue={isChallenge ? () => setStep("chest") : onExit}
      />
    );
  }

  if (step === "chest") {
    return <ChestReward stop={stop} lines={lines} onBack={onExit} />;
  }

  return (
    <ExerciseLoop
      exercises={stop.exercises}
      sessionId={stop.id}
      words={unit.words}
      onExit={onExit}
      onFinished={() => {
        setStep("closing");
        // The stop and (for the challenge) its sticker are granted together: never behind a tap.
        if (record) {
          if (stop.kind === "challenge" && stop.sticker) finishStop(stop.id, stop.sticker.id);
          else finishStop(stop.id);
        }
      }}
    />
  );
}
