"use client";

import { useEffect, useRef, useState } from "react";
import { BigButton } from "@/components/BigButton";
import { useProgress } from "@/components/ProgressProvider";
import { DragGame } from "@/components/games/DragGame";
import { RepeatGame } from "@/components/games/RepeatGame";
import { TapGame } from "@/components/games/TapGame";
import type { Lesson } from "@/domain/content-schema";
import { currentStep, lessonReducer, startLesson, type LessonState } from "@/domain/lesson-engine";
import { HomeIcon } from "./icons";
import { SongStep } from "./SongStep";
import { StickerStep, StickerView } from "./StickerStep";
import { StoryStep } from "./StoryStep";

type Props = { lesson: Lesson; onExit: () => void };

export function LessonPlayer({ lesson, onExit }: Props) {
  const { finishLesson } = useProgress();
  const [state, setState] = useState<LessonState>(() => startLesson(lesson));
  const savedRef = useRef(false);

  useEffect(() => {
    if (state.finished && state.stickerId && !savedRef.current) {
      savedRef.current = true;
      finishLesson(lesson.id, state.stickerId);
    }
  }, [state.finished, state.stickerId, lesson.id, finishLesson]);

  const step = currentStep(lesson, state);
  const done = (stepId: string) => () => setState((s) => lessonReducer(lesson, s, { type: "stepDone", stepId }));

  if (state.finished) {
    const sticker = lesson.steps.find((s) => s.kind === "sticker");
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-4">
        {sticker && <StickerView image={sticker.image} />}
        <BigButton label="Voltar ao mapa" color="sun" onPress={onExit}>
          <HomeIcon />
        </BigButton>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 p-4">
        {/* No way out during the sticker step: leaving before it ends would lose the sticker. */}
        <div className="min-h-16 min-w-16">
          {step?.kind !== "sticker" && (
            <BigButton label="Voltar ao mapa" color="sun" onPress={onExit}>
              <HomeIcon />
            </BigButton>
          )}
        </div>
        <ol className="flex items-center gap-2" aria-hidden="false">
          {lesson.steps.map((s, i) => (
            <li
              key={s.id}
              data-testid="progress-dot"
              aria-current={i === state.stepIndex ? "step" : undefined}
              className={`h-4 w-4 rounded-full ${i === state.stepIndex ? "bg-sky scale-125" : i < state.stepIndex ? "bg-leaf" : "bg-ink/20"}`}
            />
          ))}
        </ol>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center">
        {step?.kind === "song" && <SongStep key={step.id} step={step} onDone={done(step.id)} />}
        {step?.kind === "story" && <StoryStep key={step.id} step={step} onDone={done(step.id)} />}
        {step?.kind === "tap" && <TapGame key={step.id} step={step} cards={lesson.cards} onDone={done(step.id)} />}
        {step?.kind === "drag" && <DragGame key={step.id} step={step} cards={lesson.cards} onDone={done(step.id)} />}
        {step?.kind === "repeat" && <RepeatGame key={step.id} step={step} cards={lesson.cards} onDone={done(step.id)} />}
        {step?.kind === "sticker" && <StickerStep key={step.id} step={step} onDone={done(step.id)} />}
      </main>
    </div>
  );
}
