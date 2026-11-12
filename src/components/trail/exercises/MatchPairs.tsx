"use client";

import { useMemo, useRef, useState } from "react";
import { narrator } from "@/audio/narrator";
import { ART_WORDS } from "@/art/Animal";
import { matchSelect, type MatchState } from "@/domain/trail/exercises";
import type { ArtId, Exercise, Word } from "@/domain/trail/schema";
import type { Phase } from "@/domain/trail/session";
import { SpeakerIcon } from "../icons";
import { TileGrid } from "../kit/AnswerTile";
import { ChunkyButton } from "../kit/ChunkyButton";
import { ArtCard, hashSeed, isInteractive, sayFor, seededShuffle, useAnswerGate, useTimers } from "./shared";

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
      selected,
      className: `${selected ? "is-selected" : ""} ${shake ? "card-shake" : ""}`,
    };
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <TileGrid dense={exercise.wordIds.length === 3} small={exercise.wordIds.length !== 3}>
        {artOrder.map((id) => {
          const f = flags("art", id);
          return (
            <ArtCard
              key={id}
              id={id}
              onTap={() => select("art", id)}
              disabled={!interactive || f.matched}
              glow={hintId === id}
              state={f.matched ? "correct" : "idle"}
              className={f.className}
              data={f.data}
            />
          );
        })}
      </TileGrid>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {exercise.wordIds.map((id) => {
          const f = flags("word", id);
          const glow = hintId === id;
          return (
            <ChunkyButton
              key={id}
              label={words.find((w) => w.id === id)?.en ?? ART_WORDS[id]}
              lang="en"
              tone="white"
              disabled={!interactive || f.matched}
              onPress={() => select("word", id)}
              data={{ "data-word": id, "data-glow": glow ? "true" : undefined, ...f.data }}
              className={`min-w-[120px] ${f.matched ? "is-matched" : ""} ${f.selected ? "is-selected" : ""} ${glow ? "is-glow" : ""} ${f.className}`}
            >
              <SpeakerIcon size={30} />
              <span lang="en">{words.find((w) => w.id === id)?.en ?? ART_WORDS[id]}</span>
            </ChunkyButton>
          );
        })}
      </div>
    </div>
  );
}
