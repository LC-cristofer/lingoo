"use client";

import { useMemo, useRef, useState } from "react";
import { narrator } from "@/audio/narrator";
import { ART_WORDS } from "@/art/Animal";
import { matchSelect, type MatchState } from "@/domain/trail/exercises";
import type { ArtId, Exercise, Word } from "@/domain/trail/schema";
import type { Phase } from "@/domain/trail/session";
import { SpeakerIcon } from "../icons";
import { ArtCard, CARD_ROW, hashSeed, isInteractive, sayFor, seededShuffle, useAnswerGate, useTimers } from "./shared";

export const SHAKE_MS = 400;
const START: MatchState = { selected: null, matched: [] };

type Side = "art" | "word";
type Key = `${Side}:${ArtId}`;

type MatchPairsProps = {
  exercise: Extract<Exercise, { kind: "matchPairs" }>;
  words: Word[];
  phase: Phase;
  onAnswer: (correct: boolean) => void;
};

/** Pictures on top (shuffled), one 🔊 word button per word below; tap one of each to pair them. */
export function MatchPairs({ exercise, words, phase, onAnswer }: MatchPairsProps) {
  const { isLocked, report } = useAnswerGate(phase, onAnswer);
  const { later } = useTimers();
  const stateRef = useRef<MatchState>(START);
  const [state, setState] = useState<MatchState>(START);
  const [shaking, setShaking] = useState<Key[]>([]);
  const artOrder = useMemo(
    () => seededShuffle(exercise.wordIds, hashSeed(exercise.wordIds.join())),
    [exercise.wordIds],
  );

  const select = (side: Side, id: ArtId) => {
    if (isLocked()) return;
    narrator.playSfx("tap");
    if (side === "word") void narrator.playNarration(sayFor(words, id));
    const before = stateRef.current;
    const { state: next, outcome } = matchSelect(exercise, before, side, id);
    stateRef.current = next;
    setState(next);
    if (outcome === "mismatch" && before.selected) {
      const pair: Key[] = [`${before.selected.side}:${before.selected.id}`, `${side}:${id}`];
      setShaking(pair);
      later(() => setShaking((s) => s.filter((k) => !pair.includes(k))), SHAKE_MS);
      report(false);
    } else if (outcome === "complete") {
      report(true);
    }
  };

  const interactive = isInteractive(phase);
  const hintId = phase === "hint" ? exercise.wordIds.find((id) => !state.matched.includes(id)) : undefined;
  const flags = (side: Side, id: ArtId) => {
    const matched = state.matched.includes(id);
    const selected = state.selected?.side === side && state.selected.id === id;
    const shake = shaking.includes(`${side}:${id}`);
    return {
      matched,
      data: {
        "data-matched": matched ? "true" : undefined,
        "data-selected": selected ? "true" : undefined,
        "data-shake": shake ? "true" : undefined,
      },
      className: `${matched ? "bg-leaf/30 ring-4 ring-leaf" : selected ? "ring-4 ring-sky" : ""} ${shake ? "card-shake" : ""}`,
    };
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={CARD_ROW}>
        {artOrder.map((id) => {
          const f = flags("art", id);
          return (
            <ArtCard
              key={id}
              id={id}
              onTap={() => select("art", id)}
              disabled={!interactive || f.matched}
              glow={hintId === id}
              className={f.className}
              data={f.data}
            />
          );
        })}
      </div>
      <div className={CARD_ROW}>
        {exercise.wordIds.map((id) => {
          const f = flags("word", id);
          const glow = hintId === id;
          return (
            <button
              key={id}
              type="button"
              data-word={id}
              data-glow={glow ? "true" : undefined}
              {...f.data}
              disabled={!interactive || f.matched}
              onClick={() => select("word", id)}
              className={`inline-flex min-h-16 min-w-[120px] items-center justify-center gap-2 rounded-3xl bg-white px-4 py-2 font-display text-2xl font-bold text-ink shadow-md transition-transform active:scale-95 disabled:active:scale-100 ${
                glow ? "animate-pulse ring-4 ring-sun" : ""
              } ${f.className}`}
            >
              <SpeakerIcon />
              <span lang="en">{words.find((w) => w.id === id)?.en ?? ART_WORDS[id]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
