"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Animal } from "@/art/Animal";
import { Cat } from "@/art/Cat";
import { narrator } from "@/audio/narrator";
import { getLines } from "@/domain/trail/content";
import { cardId, pickDistractors, todayKey, unitOfCard, wordOfCard, type CardId } from "@/domain/trail/memory";
import type { ArtId, Exercise, Unit, Word } from "@/domain/trail/schema";
import { hashSeed, seededShuffle } from "../exercises/shared";
import { PlayIcon } from "../icons";
import { Bubble } from "../kit/Bubble";
import { ChunkyButton } from "../kit/ChunkyButton";
import { Backdrop } from "../kit/Backdrop";
import { LessonTopBar } from "../kit/LessonTopBar";
import { NarrationText } from "../NarrationText";
import { ExerciseLoop } from "../StopFlow";
import { useTrailProgress } from "../TrailProgressProvider";
import { FlipCard } from "./FlipCard";

type MemoryRoundProps = {
  unit: Unit;
  /** The round's cards (at most 8), in the order they are recalled. */
  cardIds: CardId[];
  /** False in review mode: nothing is graded and the day is not marked. */
  record: boolean;
  /** True when the round starts a lesson's closing: the gatinho says "Hora de treinar a memória!" first. */
  intro?: boolean;
  onDone: () => void;
  onExit: () => void;
};

type Phase = "recall" | "check" | "summary";

const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Lembrar (flip each card), Conferir (Ouça e toque, another order), Fim (how many were remembered). */
export function MemoryRound({ unit, cardIds, record, intro = false, onDone, onExit }: MemoryRoundProps) {
  const lines = useMemo(() => getLines(), []);
  const { progress, gradeCards, markToday } = useTrailProgress();
  const [phase, setPhase] = useState<Phase>("recall");
  const [recallIndex, setRecallIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [checkIndex, setCheckIndex] = useState(0);
  const [results, setResults] = useState<Record<CardId, boolean>>({});
  const attempted = useRef(new Set<CardId>());
  // Only cards that are new or due today are graded; a card that is not due yet is practice only
  // (a first-try answer must not push it up a box). Decided once, when the round starts.
  const [gradeable] = useState<Set<CardId>>(() => {
    const today = todayKey();
    return new Set(cardIds.filter((id) => !progress.memory[id] || progress.memory[id].due <= today));
  });

  const cards = useMemo(
    () =>
      cardIds.flatMap((id) => {
        const word = unitOfCard(id) === unit.id ? unit.words.find((w) => w.id === wordOfCard(id)) : undefined;
        return word ? [{ id, word }] : [];
      }),
    [cardIds, unit],
  );
  const total = cards.length;
  // A fixed, different order for the check (never the recall order).
  const checkOrder = useMemo(() => seededShuffle(cards, hashSeed(cards.map((c) => c.id).join("|"))), [cards]);
  // Wrong options come from what the child already knows, then from the unit's words.
  // Decided once, when the round starts: grading changes the memory, and the options must not shift under the child.
  const [known] = useState<ArtId[]>(() => {
    const ids = new Set<ArtId>(cards.map((c) => c.word.id));
    for (const id of Object.keys(progress.memory)) {
      if (unitOfCard(id) === unit.id) ids.add(wordOfCard(id) as ArtId);
    }
    return [...ids];
  });

  const current = cards[recallIndex];
  const currentId = current?.id;

  // Each new card in the recall: ask how it is said, then the flip hint (and, first of a lesson's round, the intro).
  useEffect(() => {
    if (phase !== "recall" || !currentId) return;
    void narrator.playNarration([...(intro && recallIndex === 0 ? lines.memoryIntro : []), ...lines.memoryAsk, ...lines.memoryFlip]);
  }, [phase, recallIndex, currentId, intro, lines]);

  const rememberedCount = cards.filter((c) => results[c.id]).length;
  const summarising = phase === "summary";
  useEffect(() => {
    if (!summarising) return;
    void narrator.playNarration(lines.memoryDone[Math.min(rememberedCount, lines.memoryDone.length - 1)]);
    if (record) markToday();
    // The summary is entered once; its counts do not change afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summarising]);

  if (total === 0) {
    // Nothing to train (should not happen): leave without fuss.
    return (
      <div className="k-screen">
        <Backdrop variant="interior" />
        <div className="k-stage">
          <ChunkyButton label="Continuar" tone="ok" size="lg" className="k-cta" onPress={onDone}>
            Continuar
          </ChunkyButton>
        </div>
      </div>
    );
  }

  if (phase === "recall" && current) {
    const word = current.word;
    const flip = () => {
      if (flipped) return;
      setFlipped(true);
      narrator.playSfx("tap");
      void narrator.playNarration(word.say);
    };
    const next = () => {
      narrator.stop();
      if (recallIndex + 1 >= total) {
        setPhase("check");
        return;
      }
      setRecallIndex(recallIndex + 1);
      setFlipped(false);
    };
    const replay = () => void narrator.playNarration(flipped ? word.say : lines.memoryAsk);
    return (
      <div className="k-screen">
        <Backdrop variant="interior" />
        <div className="k-lesson k-mem">
          <LessonTopBar ratio={recallIndex / total} count={`${recallIndex + 1} de ${total}`} onExit={onExit} />
          <div className="k-mem-recall">
            <div className="k-ask k-mem-ask">
              <span className="k-cat">
                <Cat expression={flipped ? "happy" : "listening"} size={112} />
              </span>
              <Bubble onReplay={replay}>
                {flipped ? <b lang="en">{sentence(word.say[0].text)}</b> : <NarrationText narration={lines.memoryAsk} />}
              </Bubble>
            </div>
            <div className="k-mem-center">
              <FlipCard word={word} flipped={flipped} onFlip={flip} hint={lines.memoryFlip[0].text} />
            </div>
          </div>
          <div className="k-mem-next">
            {flipped ? (
              <ChunkyButton label="Próximo" tone="ok" size="lg" onPress={next}>
                Próximo
                <PlayIcon size={28} />
              </ChunkyButton>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "check") {
    const item = checkOrder[checkIndex];
    return (
      <CheckCard
        key={item.id}
        card={item}
        unit={unit}
        known={known}
        topBar={{ ratio: checkIndex / total, count: `${checkIndex + 1} de ${total}` }}
        praise={lines.memoryPraise}
        onAttempt={(correct) => {
          if (attempted.current.has(item.id)) return;
          attempted.current.add(item.id);
          setResults((r) => ({ ...r, [item.id]: correct }));
          if (record && gradeable.has(item.id)) gradeCards([{ id: item.id, firstTry: correct }]);
        }}
        onExit={onExit}
        onFinished={() => {
          if (checkIndex + 1 >= total) setPhase("summary");
          else setCheckIndex(checkIndex + 1);
        }}
      />
    );
  }

  const doneLine = lines.memoryDone[Math.min(rememberedCount, lines.memoryDone.length - 1)];
  return (
    <div className="k-screen">
      <Backdrop variant="interior" />
      <div className="k-stage">
        <LessonTopBar ratio={1} onExit={onExit} title="Treino de memória" />
        <div className="k-hello">
          <Bubble tail="down">
            <NarrationText narration={doneLine} />
          </Bubble>
          <span className={`k-cat ${total > 3 ? "is-small" : ""}`}>
            <Cat expression="happy" size={176} />
          </span>
        </div>
        <div className={`k-mem-words ${total > 6 ? "is-many" : ""}`}>
          {cards.map((c) => (
            <div key={c.id} className="k-word">
              <span className="k-mem-tile" data-card={c.word.id}>
                <Animal id={c.word.id} size={104} />
                {results[c.id] ? (
                  <span className="k-tile-badge" aria-hidden="true">
                    <svg viewBox="-10 -10 20 20" width="22" height="22">
                      <path d="M-5 0 l4 4 l7 -8" stroke="#fff" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                ) : null}
              </span>
              <b lang="en" className="k-word-en">
                {c.word.en}
              </b>
            </div>
          ))}
        </div>
        <ChunkyButton label="Continuar" tone="ok" size="lg" className="k-cta" onPress={onDone}>
          Continuar
          <PlayIcon size={28} />
        </ChunkyButton>
      </div>
    </div>
  );
}

type CheckCardProps = {
  card: { id: CardId; word: Word };
  unit: Unit;
  known: ArtId[];
  topBar: { ratio: number; count: string };
  praise: ReturnType<typeof getLines>["memoryPraise"];
  onAttempt: (correct: boolean) => void;
  onExit: () => void;
  onFinished: () => void;
};

/** One card's check: "Qual é o bear? Toque nele!" with the lessons' retry and hint, asked once. */
function CheckCard({ card, unit, known, topBar, praise, onAttempt, onExit, onFinished }: CheckCardProps) {
  const [exercise] = useState<Exercise>(() => {
    const options = [card.word.id, ...pickDistractors(card.word.id, known, unit.words.map((w) => w.id))];
    return {
      kind: "listenTap",
      prompt: card.word.ask,
      optionIds: seededShuffle(options, hashSeed(`${card.id}|options`)),
      answerId: card.word.id,
    };
  });
  return (
    <ExerciseLoop
      exercises={[exercise]}
      sessionId={`memory:${cardId(unit.id, card.word.id)}`}
      words={unit.words}
      praise={praise}
      topBar={topBar}
      noReview
      onAttempt={onAttempt}
      onExit={onExit}
      onFinished={onFinished}
    />
  );
}
