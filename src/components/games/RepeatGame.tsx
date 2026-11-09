"use client";

import { useEffect, useRef, useState } from "react";
import { narrator } from "@/audio/narrator";
import { BigButton } from "@/components/BigButton";
import { Mascot, type Mood } from "@/components/Mascot";
import type { Card, RepeatStep } from "@/domain/content-schema";
import { createRepeat, nextRepeat, type RepeatState } from "@/domain/games/repeat";

const YOUR_TURN_MS = 2500;

type Props = { step: RepeatStep; cards: Card[]; onDone: () => void };

export function RepeatGame({ step, cards, onDone }: Props) {
  const stateRef = useRef<RepeatState>(createRepeat());
  const [index, setIndex] = useState(0);
  const [mood, setMood] = useState<Mood>("talking");
  const [canAdvance, setCanAdvance] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const byId = new Map(cards.map((c) => [c.id, c]));
  const card = byId.get(step.cardIds[index]);

  useEffect(() => {
    let alive = true;
    if (card) {
      void narrator.play(card.audio).then(() => {
        if (alive) setMood("idle");
      });
    }
    const timer = setTimeout(() => {
      if (alive) setCanAdvance(true);
    }, YOUR_TURN_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
      narrator.stop();
    };
  }, [index, card]);

  function advance() {
    if (doneRef.current) return;
    const { state } = nextRepeat(step, stateRef.current);
    stateRef.current = state;
    if (state.finished) {
      doneRef.current = true;
      setCanAdvance(false);
      onDoneRef.current();
    } else {
      setCanAdvance(false);
      setMood("talking");
      setIndex(state.index);
    }
  }

  if (!card) return null;
  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <Mascot mood={mood} listening={canAdvance || mood === "idle"} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={card.image} alt={card.word} lang="en" width={256} height={256} draggable={false} className="h-64 w-64 rounded-3xl bg-cream object-contain p-4 shadow-md" />
      <div className="min-h-16">
        {canAdvance && (
          <BigButton onPress={advance} label="Avançar" color="leaf">
            <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
              <path d="M5 12h13M12 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </BigButton>
        )}
      </div>
    </div>
  );
}
