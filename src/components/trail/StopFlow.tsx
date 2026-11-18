"use client";

import { useEffect, useMemo, useState } from "react";
import { ART_WORDS } from "@/art/Animal";
import { Cat, type CatExpression } from "@/art/Cat";
import { narrator } from "@/audio/narrator";
import { getLines } from "@/domain/trail/content";
import type { ArtId, Exercise, Narration, Word } from "@/domain/trail/schema";
import { answer, next, progressRatio, resume, startSession, type Phase } from "@/domain/trail/session";
import { ExerciseShell } from "./ExerciseShell";
import { ExerciseView } from "./exercises/ExerciseView";
import { AnswerTile, TileGrid } from "./kit/AnswerTile";
import { Bubble } from "./kit/Bubble";
import { ChunkyButton } from "./kit/ChunkyButton";
import { Backdrop } from "./kit/Backdrop";
import { LessonTopBar } from "./kit/LessonTopBar";
import { PlayIcon } from "./icons";
import { NarrationText } from "./NarrationText";

// The pieces every kind of stop shares: the opening, the exercise loop and the closing.

/** The narration an exercise is asked with: `say` for intro/trueFalse, `prompt` for the rest. */
export function questionOf(ex: Exercise): Narration {
  return ex.kind === "intro" || ex.kind === "trueFalse" ? ex.say : ex.prompt;
}

/** These exercises play their own question when they mount; the others need the loop to. */
function playsOwnQuestion(ex: Exercise): boolean {
  return ex.kind === "intro" || ex.kind === "listenTap" || ex.kind === "trueFalse";
}

function catFor(phase: Phase): CatExpression {
  if (phase === "answering") return "pointing";
  if (phase === "correct") return "happy";
  return "helping";
}

/** The stop's words as tiles with the English word under each (tap to hear it). */
export function WordCards({ words, ids }: { words: Word[]; ids: ArtId[] }) {
  return (
    <div className="k-words">
      <TileGrid dense={ids.length % 3 === 0} six={ids.length === 6}>
        {ids.map((id) => {
          const word = words.find((w) => w.id === id);
          return (
            <div key={id} className="k-word">
              <AnswerTile
                id={id}
                label={ART_WORDS[id]}
                lang="en"
                data={{ "data-word": id }}
                onPress={() => {
                  narrator.playSfx("tap");
                  void narrator.playNarration(word?.say ?? [{ lang: "en-US", text: ART_WORDS[id] }]);
                }}
              />
              <b lang="en" className="k-word-en">
                {word?.en ?? ART_WORDS[id]}
              </b>
            </div>
          );
        })}
      </TileGrid>
    </div>
  );
}

export function Star() {
  return (
    <svg viewBox="-60 -60 120 120" width={80} height={80} role="img" aria-label="Estrela" data-testid="star">
      <g className="art-sticker-pop">
        <path
          d="M0 -48 l14 30 l33 4 l-24 22 l7 32 l-30 -17 l-30 17 l7 -32 l-24 -22 l33 -4z"
          fill="#FFC93C"
          stroke="#F2A71B"
          strokeWidth="5"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

type StopOpeningProps = {
  title: string;
  opening: Narration;
  words: Word[];
  wordIds: ArtId[];
  /** The button's label (it also carries the ▶). */
  startLabel?: string;
  onStart: () => void;
  onExit: () => void;
};

/** The gatinho says hello, the stop's words, and the big yellow start button. */
export function StopOpening({ title, opening, words, wordIds, startLabel = "Começar", onStart, onExit }: StopOpeningProps) {
  // With audio still locked this stays silent until the ▶ tap.
  useEffect(() => {
    void narrator.playNarration(opening);
  }, [opening]);
  return (
    <div className="k-screen">
      <Backdrop variant="interior" />
      <div className={`k-stage ${wordIds.length > 3 ? "is-many" : ""}`}>
        <LessonTopBar ratio={0} onExit={onExit} title={title} />
        <div className="k-hello">
          <Bubble tail="down">
            <NarrationText narration={opening} />
          </Bubble>
          <span className="k-cat">
            <Cat expression="happy" size={170} />
          </span>
        </div>
        <WordCards words={words} ids={wordIds} />
        <ChunkyButton label={startLabel} tone="ok" size="lg" className="k-cta" onPress={onStart}>
          {startLabel}
          <PlayIcon size={28} />
        </ChunkyButton>
      </div>
    </div>
  );
}

type StopClosingProps = {
  closing: Narration;
  words: Word[];
  wordIds: ArtId[];
  /** Challenge: "Continuar" leads to the chest. Otherwise "Voltar ao mapa" leaves ("Voltar" in review mode). */
  isChallenge?: boolean;
  /** False in review mode: nothing is saved and the way out goes back to the review list. */
  record?: boolean;
  onContinue: () => void;
};

/** The star, the gatinho's last words and the way out. */
export function StopClosing({ closing, words, wordIds, isChallenge = false, record = true, onContinue }: StopClosingProps) {
  const lines = useMemo(() => getLines(), []);
  useEffect(() => {
    narrator.playSfx("star");
    void narrator.playNarration([...closing, ...lines.star]);
  }, [closing, lines.star]);
  // In review mode the way out is the review list, not the map.
  const label = isChallenge ? "Continuar" : record ? "Voltar ao mapa" : "Voltar";
  return (
    <div className="k-screen">
      <Backdrop variant="interior" />
      <div className="k-stage is-closing">
        <div className="k-hello">
          <Bubble tail="down">
            <NarrationText narration={closing} />
          </Bubble>
          <span className="k-cat">
            <Cat expression="happy" size={120} />
          </span>
        </div>
        <div className="k-reward">
          <Star />
          <p className="k-star-line">
            <NarrationText narration={lines.star} />
          </p>
        </div>
        <WordCards words={words} ids={wordIds} />
        <ChunkyButton label={label} tone="ok" size="lg" className="k-cta" onPress={onContinue}>
          {label}
        </ChunkyButton>
      </div>
    </div>
  );
}

type ExerciseLoopProps = {
  exercises: Exercise[];
  /** Seeds the session (a stable id for the stop). */
  sessionId: string;
  words: Word[];
  onExit: () => void;
  /** The last exercise (and its review) is done and the child pressed "Continuar". */
  onFinished: () => void;
  /** The line said (and shown) for a right answer; the lessons rotate their praise lines. */
  praise?: Narration;
  /** Memory check: the bar and the "N de M" pill count cards, not the session's exercises. */
  topBar?: { ratio: number; count: string };
  /** Memory check: a card answered wrong is not asked again at the end. */
  noReview?: boolean;
  /** Every attempt (right or wrong), as it happens. */
  onAttempt?: (correct: boolean) => void;
};

/** Exercises with retry, hint and review, the feedback sheet and the gatinho's reactions. */
export function ExerciseLoop({ exercises, sessionId, words, onExit, onFinished, praise, topBar, noReview = false, onAttempt }: ExerciseLoopProps) {
  const lines = useMemo(() => getLines(), []);
  const [session, setSession] = useState(() => startSession(exercises, sessionId));
  const [shown, setShown] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [override, setOverride] = useState<{ key: string; expression: CatExpression } | null>(null);

  // High-water mark: the bar never goes backwards (a queued review lowers the raw ratio).
  const rawRatio = progressRatio(session);
  if (rawRatio > shown) setShown(rawRatio);
  const ratio = Math.max(shown, rawRatio);

  const item = session.items[Math.min(session.index, session.items.length - 1)];
  const { phase, index } = session;
  const praiseLine = praise ?? lines.praise[Math.max(0, correctCount - 1) % lines.praise.length];

  // A new exercise: the kinds that do not speak for themselves are read to the child.
  useEffect(() => {
    if (session.finished) return;
    if (!playsOwnQuestion(item.exercise)) void narrator.playNarration(questionOf(item.exercise));
  }, [index, item.exercise, session.finished]);

  // Feedback sounds and the retry that hands the exercise back after the narration.
  useEffect(() => {
    if (session.finished) return;
    let alive = true;
    if (phase === "correct") {
      narrator.playSfx("correct");
      void narrator.playNarration(praiseLine);
    } else if (phase === "retry") {
      narrator.playSfx("retry");
      void narrator.playNarration(lines.retry).then(() => {
        if (!alive) return;
        setSession((s) => resume(s));
        void narrator.playNarration(questionOf(item.exercise));
      });
    } else if (phase === "hint") {
      void narrator.playNarration(lines.hint);
    }
    return () => {
      alive = false;
    };
    // Re-run only when the phase or the exercise changes, not when the praise rotates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index]);

  const onAnswer = (correct: boolean) => {
    let after = answer(session, correct);
    if (after === session) return;
    if (noReview && after.items.length > session.items.length) after = { ...after, items: session.items };
    onAttempt?.(correct);
    if (after.phase === "correct") setCorrectCount((n) => n + 1);
    setSession(after);
  };

  const onContinue = () => {
    const after = next(session);
    setSession(after);
    if (after.finished) onFinished();
  };

  const overrideKey = `${index}:${phase}`;
  const catExpression = override && override.key === overrideKey ? override.expression : catFor(phase);
  const feedback =
    phase === "correct"
      ? { kind: "correct" as const, line: praiseLine, onContinue }
      : phase === "retry"
        ? { kind: "retry" as const, line: lines.retry }
        : phase === "hint"
          ? { kind: "hint" as const, line: lines.hint }
          : null;

  return (
    <ExerciseShell
      ratio={topBar ? topBar.ratio : ratio}
      count={topBar?.count}
      steps={topBar ? undefined : exercises.length}
      prompt={questionOf(item.exercise)}
      catExpression={catExpression}
      feedback={feedback}
      onExit={onExit}
    >
      <ExerciseView
        key={`${item.key}:${index}`}
        exercise={item.exercise}
        words={words}
        phase={phase}
        onAnswer={onAnswer}
        onDone={() => {}}
        onCatExpression={(expression) => setOverride({ key: overrideKey, expression })}
      />
    </ExerciseShell>
  );
}
