"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Animal, ART_WORDS } from "@/art/Animal";
import { Cat, type CatExpression } from "@/art/Cat";
import { narrator } from "@/audio/narrator";
import { BigButton } from "@/components/BigButton";
import { getLines } from "@/domain/trail/content";
import type { Exercise, LessonStop, Narration, Unit, Word } from "@/domain/trail/schema";
import { answer, next, progressRatio, resume, startSession, type Phase } from "@/domain/trail/session";
import { ChestReward } from "./ChestReward";
import { ExerciseShell } from "./ExerciseShell";
import { ExerciseView } from "./exercises/ExerciseView";
import { PlayIcon } from "./icons";
import { NarrationText } from "./NarrationText";
import { useTrailProgress } from "./TrailProgressProvider";

type StopPlayerProps = {
  unit: Unit;
  stop: LessonStop;
  onExit: () => void;
  /** False in review mode: nothing is saved. */
  record?: boolean;
};

type Step = "opening" | "session" | "closing" | "chest";

/** The narration an exercise is asked with: `say` for intro/trueFalse, `prompt` for the rest. */
function questionOf(ex: Exercise): Narration {
  return ex.kind === "intro" || ex.kind === "trueFalse" ? ex.say : ex.prompt;
}

/** These exercises play their own question when they mount; the others need the player to. */
function playsOwnQuestion(ex: Exercise): boolean {
  return ex.kind === "intro" || ex.kind === "listenTap" || ex.kind === "trueFalse";
}

function catFor(phase: Phase): CatExpression {
  if (phase === "answering") return "pointing";
  if (phase === "correct") return "happy";
  return "helping";
}

function WordCards({ words, ids }: { words: Word[]; ids: Word["id"][] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {ids.map((id) => {
        const word = words.find((w) => w.id === id);
        return (
          <button
            key={id}
            type="button"
            data-word={id}
            aria-label={ART_WORDS[id]}
            lang="en"
            onClick={() => {
              narrator.playSfx("tap");
              void narrator.playNarration(word?.say ?? [{ lang: "en-US", text: ART_WORDS[id] }]);
            }}
            className="inline-flex min-h-[120px] min-w-[120px] items-center justify-center rounded-3xl bg-white p-2 shadow-md transition-transform active:scale-95"
          >
            <Animal id={id} size={130} />
          </button>
        );
      })}
    </div>
  );
}

function Star() {
  return (
    <svg viewBox="-60 -60 120 120" width={120} height={120} role="img" aria-label="Estrela" data-testid="star">
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

export function StopPlayer({ unit, stop, onExit, record = true }: StopPlayerProps) {
  const lines = useMemo(() => getLines(), []);
  const { finishStop } = useTrailProgress();
  const [step, setStep] = useState<Step>("opening");
  const [session, setSession] = useState(() => startSession(stop.exercises, stop.id));
  const [shown, setShown] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [override, setOverride] = useState<{ key: string; expression: CatExpression } | null>(null);
  const lockedOnMount = useRef(!narrator.isUnlocked());
  const [openingReplayed, setOpeningReplayed] = useState(false);

  const item = session.items[Math.min(session.index, session.items.length - 1)];
  const { phase, index } = session;
  const praiseLine = lines.praise[Math.max(0, correctCount - 1) % lines.praise.length];

  // Leaving the player (any way) silences the narrator.
  useEffect(() => () => narrator.stop(), []);

  // Opening: the gatinho says it. (With audio still locked this stays silent until the ▶ tap.)
  useEffect(() => {
    if (step === "opening") void narrator.playNarration(stop.opening);
  }, [step, stop.opening]);

  // A new exercise: the kinds that do not speak for themselves are read to the child.
  useEffect(() => {
    if (step !== "session" || session.finished) return;
    if (!playsOwnQuestion(item.exercise)) void narrator.playNarration(questionOf(item.exercise));
  }, [step, index, item.exercise, session.finished]);

  // Feedback sounds and the retry that hands the exercise back after the narration.
  useEffect(() => {
    if (step !== "session" || session.finished) return;
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
  }, [step, phase, index]);

  // Closing: the star and the gatinho's words.
  useEffect(() => {
    if (step !== "closing") return;
    narrator.playSfx("star");
    void narrator.playNarration([...stop.closing, ...lines.star]);
  }, [step, stop.closing, lines.star]);

  const start = () => {
    narrator.unlock();
    if (lockedOnMount.current && !openingReplayed) {
      // The opening could not be heard: say it now that the touch unlocked audio, then wait for another ▶.
      setOpeningReplayed(true);
      void narrator.playNarration(stop.opening);
      return;
    }
    setStep("session");
  };

  const onAnswer = (correct: boolean) => {
    const after = answer(session, correct);
    if (after === session) return;
    if (after.phase === "correct") setCorrectCount((n) => n + 1);
    setSession(after);
  };

  const onContinue = () => {
    const ratio = Math.max(shown, progressRatio(session));
    setShown(ratio);
    const after = next(session);
    setSession(after);
    if (after.finished) {
      setShown(1);
      setStep("closing");
      if (record) finishStop(stop.id);
    }
  };

  if (step === "opening") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-cream p-4 text-ink">
        <div className="flex items-center gap-3">
          <Cat expression="happy" size={150} />
          <p className="max-w-md rounded-3xl bg-white px-5 py-3 font-display text-2xl font-semibold leading-snug shadow-md">
            <NarrationText narration={stop.opening} />
          </p>
        </div>
        <WordCards words={unit.words} ids={stop.wordIds} />
        <BigButton label="Começar" color="leaf" onPress={start}>
          <PlayIcon />
        </BigButton>
      </div>
    );
  }

  if (step === "closing") {
    const isChallenge = stop.kind === "challenge";
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-cream p-4 text-ink">
        <div className="flex items-center gap-3">
          <Cat expression="happy" size={130} />
          <p className="max-w-md rounded-3xl bg-white px-5 py-3 font-display text-2xl font-semibold leading-snug shadow-md">
            <NarrationText narration={stop.closing} />
          </p>
        </div>
        <Star />
        <p className="font-display text-2xl font-bold">
          <NarrationText narration={lines.star} />
        </p>
        <WordCards words={unit.words} ids={stop.wordIds} />
        <BigButton
          label={isChallenge ? "Continuar" : "Voltar ao mapa"}
          color="leaf"
          onPress={isChallenge ? () => setStep("chest") : onExit}
        >
          <span aria-hidden="true" className="font-display text-2xl font-bold">
            {isChallenge ? "Continuar" : "Voltar ao mapa"}
          </span>
        </BigButton>
      </div>
    );
  }

  if (step === "chest") {
    return <ChestReward stop={stop} lines={lines} record={record} onBack={onExit} />;
  }

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
      ratio={Math.max(shown, progressRatio(session))}
      prompt={questionOf(item.exercise)}
      catExpression={catExpression}
      feedback={feedback}
      onExit={onExit}
    >
      <ExerciseView
        key={`${item.key}:${index}`}
        exercise={item.exercise}
        words={unit.words}
        phase={phase}
        onAnswer={onAnswer}
        onDone={() => {}}
        onCatExpression={(expression) => setOverride({ key: overrideKey, expression })}
      />
    </ExerciseShell>
  );
}
