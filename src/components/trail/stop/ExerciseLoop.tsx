"use client";

import { useEffect, useRef, useState } from "react";
import type { CatExpression } from "@/art/Cat";
import { narrator } from "@/audio/narrator";
import type { Exercise, Lines, Narration, Word } from "@/domain/trail/schema";
import { answer, next, progressRatio, resume, startSession, type Phase } from "@/domain/trail/session";
import { ExerciseShell } from "../ExerciseShell";
import { ExerciseView } from "../exercises/ExerciseView";

type ExerciseLoopProps = {
  exercises: Exercise[];
  /** Prefix of the session's item keys (the stop id, or a stop id plus a part). */
  loopId: string;
  words: Word[];
  lines: Lines;
  onExit: () => void;
  /** Called exactly once, after the "Continuar" of the last exercise (reviews included). */
  onFinished: () => void;
};

/** The narration an exercise is asked with: `say` for intro/trueFalse, `prompt` for the rest. */
function questionOf(ex: Exercise): Narration {
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

/** A queue of exercises with retry, hint and the review at the end, drawn in the exercise shell. */
export function ExerciseLoop({ exercises, loopId, words, lines, onExit, onFinished }: ExerciseLoopProps) {
  const [session, setSession] = useState(() => startSession(exercises, loopId));
  const [shown, setShown] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [override, setOverride] = useState<{ key: string; expression: CatExpression } | null>(null);
  // Guards onFinished against a second tap on the last "Continuar" before the parent moves on.
  const finished = useRef(false);

  // High-water mark: the bar never goes backwards (a queued review lowers the raw ratio).
  const rawRatio = progressRatio(session);
  if (rawRatio > shown) setShown(rawRatio);
  const ratio = Math.max(shown, rawRatio);

  const item = session.items[Math.min(session.index, session.items.length - 1)];
  const { phase, index } = session;
  const praiseLine = lines.praise[Math.max(0, correctCount - 1) % lines.praise.length];

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
    const after = answer(session, correct);
    if (after === session) return;
    if (after.phase === "correct") setCorrectCount((n) => n + 1);
    setSession(after);
  };

  const onContinue = () => {
    if (finished.current) return;
    const after = next(session);
    setSession(after);
    if (after.finished) {
      finished.current = true;
      onFinished();
    }
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
      ratio={ratio}
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
