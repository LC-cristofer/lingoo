"use client";

import { useRef, useState } from "react";
import { narrator } from "@/audio/narrator";
import type { CatExpression } from "@/art/Cat";
import { BigButton } from "@/components/BigButton";
import { repeatTap, type RepeatState } from "@/domain/trail/exercises";
import type { ArtId, Exercise } from "@/domain/trail/schema";
import type { Phase } from "@/domain/trail/session";
import { ArtCard, CARD_ROW, isInteractive, useAnswerGate, useTimers } from "./shared";

/** How long the gatinho stays "listening" (sua vez) after each tap. */
export const LISTEN_MS = 1500;

type TapRepeatProps = {
  exercise: Extract<Exercise, { kind: "tapRepeat" }>;
  phase: Phase;
  onAnswer: (correct: boolean) => void;
  onCatExpression?: (e: CatExpression) => void;
};

/** Tap each animal, hear it, say it back. No right or wrong: "Continuar" once every card was tapped. */
export function TapRepeat({ exercise, phase, onAnswer, onCatExpression }: TapRepeatProps) {
  const { isLocked, report } = useAnswerGate(phase, onAnswer);
  const { later, cancel } = useTimers();
  const stateRef = useRef<RepeatState>({ tapped: [] });
  const [tapped, setTapped] = useState<ArtId[]>([]);
  const [complete, setComplete] = useState(false);
  const listenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const all = exercise.items.map((i) => i.wordId);

  const tap = (item: (typeof exercise.items)[number]) => {
    if (isLocked()) return;
    narrator.playSfx("tap");
    void narrator.playNarration(item.say);
    onCatExpression?.("listening");
    cancel(listenTimer.current);
    listenTimer.current = later(() => {
      listenTimer.current = null;
      onCatExpression?.("pointing");
    }, LISTEN_MS);
    const next = repeatTap(stateRef.current, item.wordId, all);
    stateRef.current = next.state;
    setTapped(next.state.tapped);
    if (next.complete) setComplete(true);
  };

  const nextUntapped = all.find((id) => !tapped.includes(id));

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={CARD_ROW}>
        {exercise.items.map((item) => (
          <ArtCard
            key={item.wordId}
            id={item.wordId}
            onTap={() => tap(item)}
            disabled={!isInteractive(phase)}
            glow={phase === "hint" && item.wordId === nextUntapped}
            className={tapped.includes(item.wordId) ? "ring-4 ring-leaf" : ""}
            data={{ "data-tapped": tapped.includes(item.wordId) ? "true" : undefined }}
          />
        ))}
      </div>
      <div className="min-h-16">
        {complete ? (
          <BigButton label="Continuar" color="leaf" onPress={() => report(true)}>
            <span aria-hidden="true" className="font-display text-2xl font-bold">
              Continuar
            </span>
          </BigButton>
        ) : null}
      </div>
    </div>
  );
}
