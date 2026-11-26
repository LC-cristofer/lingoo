"use client";

import { useEffect, useMemo, useState } from "react";
import { narrator } from "@/audio/narrator";
import { getLines } from "@/domain/trail/content";
import { addCards, cardId, lessonRound, todayKey, type CardId } from "@/domain/trail/memory";
import type { LessonStop, Unit } from "@/domain/trail/schema";
import { ChestReward } from "./ChestReward";
import { MemoryRound } from "./memory/MemoryRound";
import { ExerciseLoop, StopClosing, StopOpening } from "./StopFlow";
import { useTrailProgress } from "./TrailProgressProvider";

/** How the child leaves a stop: finished it ("done") or tapped "×" ("quit"). */
export type StopExit = "done" | "quit";

type StopPlayerProps = {
  unit: Unit;
  stop: LessonStop;
  onExit: (reason: StopExit) => void;
  /** False in review mode: nothing is saved. */
  record?: boolean;
};

type Step = "opening" | "session" | "memory" | "closing" | "chest";

export function StopPlayer({ unit, stop, onExit, record = true }: StopPlayerProps) {
  const lines = useMemo(() => getLines(), []);
  const { progress, finishStop, addMemoryCards } = useTrailProgress();
  const [step, setStep] = useState<Step>("opening");
  const [round, setRound] = useState<CardId[]>([]);

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
        onExit={() => onExit("quit")}
      />
    );
  }

  if (step === "memory") {
    return <MemoryRound unit={unit} cardIds={round} record={record} intro onDone={() => setStep("closing")} onExit={() => onExit("quit")} />;
  }

  if (step === "closing") {
    const isChallenge = stop.kind === "challenge";
    return (
      <StopClosing
        closing={stop.closing}
        words={unit.words}
        wordIds={stop.wordIds}
        isChallenge={isChallenge}
        record={record}
        onContinue={isChallenge ? () => setStep("chest") : () => onExit("done")}
      />
    );
  }

  if (step === "chest") {
    return <ChestReward stop={stop} lines={lines} onBack={() => onExit("done")} />;
  }

  return (
    <ExerciseLoop
      exercises={stop.exercises}
      sessionId={stop.id}
      words={unit.words}
      adaptive={{ unitId: unit.id, record }}
      onExit={() => onExit("quit")}
      onFinished={() => {
        // A lesson ends with the memory round: its new words become cards, plus a few old ones that are due.
        let next: Step = "closing";
        if (stop.kind === "lesson") {
          const today = todayKey();
          const newIds = stop.wordIds.map((id) => cardId(unit.id, id)).filter((id) => !Object.hasOwn(progress.memory, id));
          const cards = lessonRound(addCards(progress.memory, newIds, today), newIds, today, unit.id);
          if (cards.length > 0) {
            if (record && newIds.length > 0) addMemoryCards(newIds);
            setRound(cards);
            next = "memory";
          }
        }
        setStep(next);
        // The stop and (for the challenge) its sticker are granted together: never behind a tap.
        if (record) {
          if (stop.kind === "challenge" && stop.sticker) finishStop(stop.id, stop.sticker.id);
          else finishStop(stop.id);
        }
      }}
    />
  );
}
