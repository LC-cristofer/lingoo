"use client";

import { useEffect, useRef, useState } from "react";
import { narrator } from "@/audio/narrator";
import { Mascot, type Mood } from "@/components/Mascot";
import type { Card, TapStep } from "@/domain/content-schema";
import { createTap, releaseTap, tapOption, type TapState } from "@/domain/games/tap";

const FEEDBACK_MS = 1200;

type Props = { step: TapStep; cards: Card[]; onDone: () => void };

export function TapGame({ step, cards, onDone }: Props) {
  const stateRef = useRef<TapState>(createTap());
  const [round, setRound] = useState(0);
  const [mood, setMood] = useState<Mood>("talking");
  const aliveRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      narrator.stop();
    };
  }, []);

  useEffect(() => {
    let alive = true;
    void narrator.play(step.rounds[round].prompt).then(() => {
      if (alive) setMood((m) => (m === "talking" ? "idle" : m));
    });
    return () => {
      alive = false;
    };
  }, [round, step]);

  const current = step.rounds[round];
  const byId = new Map(cards.map((c) => [c.id, c]));

  function press(optionId: string) {
    const { state, result } = tapOption(step, stateRef.current, optionId);
    if (!result) return;
    stateRef.current = state;
    if (result === "acerto") {
      setMood("happy");
      void narrator.play({ text: "Great job!" });
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const next = releaseTap(step, stateRef.current);
        stateRef.current = next;
        if (next.finished) {
          if (!doneRef.current) {
            doneRef.current = true;
            onDoneRef.current();
          }
        } else {
          setMood("talking");
          setRound(next.round);
        }
      }, FEEDBACK_MS);
    } else {
      setMood("encourage");
      void narrator.play({ text: "Let's try again!" }).then(() => {
        if (!aliveRef.current) return;
        return narrator.play(step.rounds[stateRef.current.round].prompt);
      });
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <Mascot mood={mood} />
      <div className="flex flex-wrap justify-center gap-4">
        {current.optionIds.map((id) => {
          const card = byId.get(id);
          if (!card) return null;
          return (
            <button
              key={id}
              type="button"
              aria-label={card.word}
              onClick={() => press(id)}
              className="flex h-32 w-32 min-h-[120px] min-w-[120px] items-center justify-center rounded-3xl bg-cream p-2 shadow-md transition-transform active:scale-95"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.image} alt="" width={112} height={112} draggable={false} className="h-full w-full object-contain" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
