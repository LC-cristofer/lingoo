"use client";

import type { ReactNode } from "react";
import { narrator } from "@/audio/narrator";
import { Cat, type CatExpression } from "@/art/Cat";
import type { Narration } from "@/domain/trail/schema";
import { FeedbackBanner, type FeedbackKind } from "./FeedbackBanner";
import { CloseIcon, SpeakerIcon } from "./icons";
import { NarrationText } from "./NarrationText";
import { ProgressBar } from "./ProgressBar";

type ExerciseShellProps = {
  ratio: number;
  prompt: Narration;
  catExpression: CatExpression;
  feedback: { kind: FeedbackKind; line: Narration; onContinue?: () => void } | null;
  onExit: () => void;
  children: ReactNode;
};

export function ExerciseShell({ ratio, prompt, catExpression, feedback, onExit, children }: ExerciseShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream text-ink">
      <header className="flex items-center gap-4 px-4 pt-4">
        <button
          type="button"
          aria-label="Sair"
          onClick={onExit}
          className="inline-flex min-h-16 min-w-16 items-center justify-center rounded-full bg-white text-ink shadow-md active:scale-95"
        >
          <CloseIcon />
        </button>
        <div className="flex-1">
          <ProgressBar ratio={ratio} />
        </div>
      </header>

      <div className="flex items-center gap-3 px-4 pt-2">
        <div className="shrink-0">
          <Cat expression={catExpression} size={110} />
        </div>
        <div className="flex flex-1 items-center gap-3 rounded-3xl bg-white px-5 py-3 shadow-md">
          <p className="flex-1 font-display text-2xl font-semibold leading-snug">
            <NarrationText narration={prompt} />
          </p>
          <button
            type="button"
            aria-label="Ouvir de novo"
            onClick={() => void narrator.playNarration(prompt)}
            className="inline-flex min-h-16 min-w-16 items-center justify-center rounded-full bg-sky text-white active:scale-95"
          >
            <SpeakerIcon />
          </button>
        </div>
      </div>

      <main className="flex flex-1 items-center justify-center p-4">{children}</main>

      {/* The strip's height is always reserved, so the cards never jump when it appears. */}
      <div data-testid="feedback-area" className="flex min-h-[calc(6rem+env(safe-area-inset-bottom))] flex-col justify-end">
        {feedback ? <FeedbackBanner kind={feedback.kind} line={feedback.line} onContinue={feedback.onContinue} /> : null}
      </div>
    </div>
  );
}
