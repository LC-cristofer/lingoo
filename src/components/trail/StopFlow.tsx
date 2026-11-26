"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ART_WORDS } from "@/art/Animal";
import { Nino } from "@/art/nino/Nino";
import type { NinoPose } from "@/art/nino/poses";
import { narrator } from "@/audio/narrator";
import { useOptionalProfile } from "@/components/nestoy/ProfileProvider";
import { nextLevel, startRun, type LevelRun } from "@/domain/nestoy/level";
import { startLevel, type Level } from "@/domain/nestoy/profile";
import { getLines } from "@/domain/trail/content";
import type { ArtId, Exercise, Narration, StopExercise, Word } from "@/domain/trail/schema";
import { answer, exerciseAt, next, progressRatio, resume, startSession, type Phase } from "@/domain/trail/session";
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

function poseFor(phase: Phase): NinoPose {
  if (phase === "answering") return "point";
  if (phase === "correct") return "happy";
  return "help";
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

export function Star({ size = 80, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="-60 -60 120 120" width={size} height={size} role="img" aria-label="Estrela" data-testid="star" className={className}>
      <g>
        <path d="M0 -48 l14 30 l33 4 l-24 22 l7 32 l-30 -17 l-30 17 l7 -32 l-24 -22 l33 -4z" fill="#FFC93C" stroke="#FFFFFF" strokeWidth="14" strokeLinejoin="round" />
        <path d="M0 -48 l14 30 l33 4 l-24 22 l7 32 l-30 -17 l-30 17 l7 -32 l-24 -22 l33 -4z" fill="#FFC93C" stroke="#F2A71B" strokeWidth="4" strokeLinejoin="round" />
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
      <Backdrop variant="farol" />
      <div className={`k-stage ${wordIds.length > 3 ? "is-many" : ""}`}>
        <LessonTopBar ratio={0} onExit={onExit} title={title} />
        <div className="k-hello">
          <Bubble tail="down">
            <NarrationText narration={opening} />
          </Bubble>
          <span className="k-cat">
            <Nino pose="wave" size={170} speaks />
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
  /** Challenge: "Continuar" leads to the chest. Otherwise "Voltar ao farol" leaves ("Voltar" in review mode). */
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
  const label = isChallenge ? "Continuar" : record ? "Voltar ao farol" : "Voltar";
  return (
    <div className="k-screen">
      <Backdrop variant="farol" />
      <i className="k-rays" aria-hidden="true" />
      <div className="k-reward-stage is-closing">
        <div className="k-reward-hero">
          <Star size={170} className="k-star-big" />
          <span className="k-cat">
            <Nino pose="happy" size={104} reaction={{ kind: "celebrate", n: 1 }} speaks />
          </span>
        </div>
        <p className="k-reward-title">
          <NarrationText narration={lines.star} />
        </p>
        <p className="k-reward-sub">
          <NarrationText narration={closing} />
        </p>
        <WordCards words={words} ids={wordIds} />
        <ChunkyButton label={label} tone="area" size="lg" className="k-cta" onPress={onContinue}>
          {label}
        </ChunkyButton>
      </div>
    </div>
  );
}

type ExerciseLoopProps = {
  /** Adaptive slots are shown at the child's current level (see `adaptive`; level 1 without it). */
  exercises: StopExercise[];
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
  /**
   * The unit whose saved level (profile, Árvore das Letras) the adaptive slots start from; the level
   * moves with the first tries and, when `record`, is saved back when the last exercise is done.
   */
  adaptive?: { unitId: string; record: boolean };
};

/** Exercises with retry, hint and review, the feedback sheet and the gatinho's reactions. */
export function ExerciseLoop({ exercises, sessionId, words, onExit, onFinished, praise, topBar, noReview = false, onAttempt, adaptive }: ExerciseLoopProps) {
  const lines = useMemo(() => getLines(), []);
  const profileCtx = useOptionalProfile();
  const [session, setSession] = useState(() => startSession(exercises, sessionId));
  // The level moves on every adaptive item's first try; an item keeps the level it was shown at.
  const [firstRun] = useState<LevelRun>(() => {
    const p = profileCtx?.profile;
    if (!p || !adaptive) return startRun(1);
    return startRun(p.islands.descoberta.letras.levels[adaptive.unitId] ?? startLevel(p));
  });
  const runRef = useRef(firstRun);
  const [itemLevel, setItemLevel] = useState<Level>(firstRun.level);
  const [shown, setShown] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [override, setOverride] = useState<{ key: string; pose: NinoPose } | null>(null);

  // High-water mark: the bar never goes backwards (a queued review lowers the raw ratio).
  const rawRatio = progressRatio(session);
  if (rawRatio > shown) setShown(rawRatio);
  const ratio = Math.max(shown, rawRatio);

  const current = session.items[Math.min(session.index, session.items.length - 1)];
  const item = useMemo(() => ({ ...current, exercise: exerciseAt(session, itemLevel) }), [current, session, itemLevel]);
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
    if (current.exercise.kind === "adaptive" && session.phase === "answering" && session.wrongCount === 0) {
      runRef.current = nextLevel(runRef.current, correct);
    }
    setSession(after);
  };

  const onContinue = () => {
    const after = next(session);
    setSession(after);
    setItemLevel(runRef.current.level);
    if (after.finished) {
      if (adaptive?.record && profileCtx && exercises.some((e) => e.kind === "adaptive")) profileCtx.setLevel(adaptive.unitId, runRef.current.level);
      onFinished();
    }
  };

  const overrideKey = `${index}:${phase}`;
  const pose = override && override.key === overrideKey ? override.pose : poseFor(phase);
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
      pose={pose}
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
        onPose={(pose) => setOverride({ key: overrideKey, pose })}
      />
    </ExerciseShell>
  );
}
