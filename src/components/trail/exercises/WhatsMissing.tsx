"use client";

import { useEffect, useMemo, useState } from "react";
import { Animal } from "@/art/Animal";
import { narrator } from "@/audio/narrator";
import { whatsMissingCheck } from "@/domain/trail/exercises";
import type { ArtId, Exercise, Word } from "@/domain/trail/schema";
import type { Phase } from "@/domain/trail/session";
import { TileGrid } from "../kit/AnswerTile";
import { ArtCard, hashSeed, pickedState, isInteractive, sayFor, useAnswerGate, useTimers } from "./shared";

/** How long every animal is shown before one hides. */
export const SHOW_MS = 2000;
/** How long the bush covers the hidden animal before its slot goes away. */
export const BUSH_MS = 1200;

type Step = "show" | "hiding" | "choose" | "found";

type WhatsMissingProps = {
  exercise: Extract<Exercise, { kind: "whatsMissing" }>;
  words: Word[];
  phase: Phase;
  onAnswer: (correct: boolean) => void;
};

function Bush() {
  return (
    <svg viewBox="0 0 120 100" width={120} height={100} aria-hidden="true" style={{ width: "84%", height: "auto" }}>
      <ellipse cx="60" cy="92" rx="52" ry="6" fill="rgba(43,45,66,.12)" />
      <circle cx="34" cy="62" r="28" fill="#4BAF5A" />
      <circle cx="86" cy="62" r="28" fill="#4BAF5A" />
      <circle cx="60" cy="44" r="34" fill="#5CC46B" />
      <circle cx="44" cy="70" r="22" fill="#5CC46B" />
      <circle cx="78" cy="70" r="22" fill="#5CC46B" />
      <circle cx="50" cy="34" r="6" fill="#fff" opacity=".25" />
    </svg>
  );
}

/** Look at the animals, one hides behind a bush, then pick who went missing. */
export function WhatsMissing({ exercise, words, phase, onAnswer }: WhatsMissingProps) {
  const { isLocked, report } = useAnswerGate(phase, onAnswer);
  const { later } = useTimers();
  const [step, setStep] = useState<Step>("show");
  const [picked, setPicked] = useState<ArtId | null>(null);

  // The missing animal sits at a fixed, exercise-derived spot among the shown ones.
  const lineup = useMemo<ArtId[]>(() => {
    const ids = [...exercise.shownIds];
    const at = hashSeed(exercise.missingId + exercise.shownIds.join()) % (ids.length + 1);
    ids.splice(at, 0, exercise.missingId);
    return ids;
  }, [exercise.shownIds, exercise.missingId]);

  useEffect(() => {
    later(() => {
      setStep("hiding");
      later(() => setStep("choose"), BUSH_MS);
    }, SHOW_MS);
  }, [later]);

  const choose = (id: ArtId) => {
    if (isLocked()) return;
    narrator.playSfx("tap");
    void narrator.playNarration(sayFor(words, id));
    const correct = whatsMissingCheck(exercise, id);
    setPicked(id);
    if (correct) setStep("found");
    report(correct);
  };

  const slots = step === "choose" ? lineup.filter((id) => id !== exercise.missingId) : lineup;

  return (
    <div className="flex flex-col items-center gap-6">
      <TileGrid data-row="shown" dense={slots.length === 3} small={slots.length !== 3}>
        {slots.map((id) => {
          const covered = step === "hiding" && id === exercise.missingId;
          return (
            <div
              key={id}
              data-slot={id}
              data-hidden={covered ? "true" : undefined}
              className="k-slot min-h-[120px] min-w-[120px]"
            >
              <div aria-hidden={covered ? "true" : undefined} className={covered ? "invisible contents" : "contents"}>
                <Animal id={id} size={112} />
              </div>
              {covered ? (
                <div data-bush="true" className="k-bush">
                  <Bush />
                </div>
              ) : null}
            </div>
          );
        })}
      </TileGrid>
      {step === "choose" || step === "found" ? (
        <TileGrid data-row="options" dense={exercise.optionIds.length === 3} small={exercise.optionIds.length !== 3}>
          {exercise.optionIds.map((id) => (
            <ArtCard
              key={id}
              id={id}
              onTap={() => choose(id)}
              disabled={!isInteractive(phase) || step === "found"}
              glow={phase === "hint" && id === exercise.missingId}
              state={pickedState(phase, id, picked, exercise.missingId)}
            />
          ))}
        </TileGrid>
      ) : null}
    </div>
  );
}
