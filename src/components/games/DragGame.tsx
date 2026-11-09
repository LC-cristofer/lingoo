"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { narrator } from "@/audio/narrator";
import { Mascot, type Mood } from "@/components/Mascot";
import type { Card, DragStep } from "@/domain/content-schema";
import { createDrag, drop, type DragState } from "@/domain/games/drag";

const FEEDBACK_MS = 1200;

type Props = { step: DragStep; cards: Card[]; onDone: () => void };

export function DragGame({ step, cards, onDone }: Props) {
  const stateRef = useRef<DragState>(createDrag());
  const [matched, setMatched] = useState<string[]>([]);
  const [mood, setMood] = useState<Mood>("idle");
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const startRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aliveRef = useRef(true);
  /** Bumped on every touch and drop: a word's narration ending must not undo a newer mood. */
  const actionRef = useRef(0);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    void narrator.play({ text: "Match the words!" });
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      narrator.stop();
    };
  }, []);

  const byId = new Map(cards.map((c) => [c.id, c]));
  const stepCards = step.cardIds.map((id) => byId.get(id)).filter((c): c is Card => !!c);
  const words = [...stepCards].reverse().filter((c) => !matched.includes(c.id));

  function onDown(e: PointerEvent<HTMLButtonElement>, card: Card) {
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // pointer capture is best-effort
    }
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ id: card.id, dx: 0, dy: 0 });
    setMood("talking");
    const action = ++actionRef.current;
    void narrator.play(card.audio).then(() => {
      if (aliveRef.current && actionRef.current === action) setMood("idle");
    });
  }

  function onMove(e: PointerEvent<HTMLButtonElement>, card: Card) {
    if (drag?.id !== card.id) return;
    setDrag({ id: card.id, dx: e.clientX - startRef.current.x, dy: e.clientY - startRef.current.y });
  }

  function onUp(e: PointerEvent<HTMLButtonElement>, card: Card) {
    if (drag?.id !== card.id) return;
    setDrag(null);
    actionRef.current++;
    const el = document.elementFromPoint?.(e.clientX, e.clientY) ?? null;
    const targetId = el?.closest("[data-drop-target]")?.getAttribute("data-drop-target") ?? null;
    const { state, result } = drop(step, stateRef.current, card.id, targetId);
    if (!result) {
      setMood("idle");
      return;
    }
    stateRef.current = state;
    if (result === "acerto") {
      setMatched(state.matched);
      setMood("happy");
      void narrator.play({ text: "Great job!" });
      if (state.finished) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          if (!doneRef.current) {
            doneRef.current = true;
            onDoneRef.current();
          }
        }, FEEDBACK_MS);
      }
    } else {
      setMood("encourage");
      void narrator.play({ text: "Let's try again!" });
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <Mascot mood={mood} />
      <div className="flex flex-wrap justify-center gap-4">
        {stepCards.map((card) => {
          const isMatched = matched.includes(card.id);
          return (
            <div
              key={card.id}
              lang="en"
              data-drop-target={card.id}
              data-matched={isMatched ? "true" : "false"}
              style={{ touchAction: "none" }}
              className={`flex h-32 w-32 flex-col items-center justify-center rounded-3xl p-2 shadow-md ${isMatched ? "bg-leaf" : "bg-cream"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.image} alt="" width={96} height={96} draggable={false} className="h-24 w-24 object-contain" />
              {isMatched && <span className="font-display text-ink">{card.word}</span>}
            </div>
          );
        })}
      </div>
      <div className="flex min-h-16 flex-wrap justify-center gap-3">
        {words.map((card) => {
          const dragging = drag?.id === card.id;
          return (
            <button
              key={card.id}
              type="button"
              lang="en"
              aria-label={card.word}
              onPointerDown={(e) => onDown(e, card)}
              onPointerMove={(e) => onMove(e, card)}
              onPointerUp={(e) => onUp(e, card)}
              onPointerCancel={() => setDrag(null)}
              style={{
                touchAction: "none",
                // Lets elementFromPoint see the target under the finger; capture still delivers move/up.
                pointerEvents: dragging ? "none" : undefined,
                transform: dragging ? `translate(${drag.dx}px, ${drag.dy}px)` : undefined,
                zIndex: dragging ? 10 : undefined,
              }}
              className="min-h-16 min-w-16 rounded-3xl bg-sun px-6 py-3 font-display text-2xl text-ink shadow-md"
            >
              {card.word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
