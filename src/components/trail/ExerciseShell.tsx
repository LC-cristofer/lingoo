"use client";

import type { ReactNode } from "react";
import { narrator } from "@/audio/narrator";
import { Cat, type CatExpression } from "@/art/Cat";
import type { Narration } from "@/domain/trail/schema";
import { FeedbackBanner, type FeedbackKind } from "./FeedbackBanner";
import { Bubble } from "./kit/Bubble";
import { Backdrop } from "./kit/Backdrop";
import { LessonTopBar } from "./kit/LessonTopBar";
import { NarrationText } from "./NarrationText";

type ExerciseShellProps = {
  ratio: number;
  prompt: Narration;
  catExpression: CatExpression;
  feedback: { kind: FeedbackKind; line: Narration; onContinue?: () => void } | null;
  onExit: () => void;
  /** "2 de 5": the memory training's blue bar and count pill. */
  count?: string;
  /** How many exercises the lesson has: up to 8 the top bar shows lamps. */
  steps?: number;
  children: ReactNode;
};

export function ExerciseShell({ ratio, prompt, catExpression, feedback, onExit, count, steps, children }: ExerciseShellProps) {
  return (
    <div className="k-screen">
      <Backdrop variant="interior" />
      <div className="k-lesson">
        <LessonTopBar ratio={ratio} onExit={onExit} count={count} steps={steps} />
        <div className="k-ask">
          <span className="k-cat">
            <Cat expression={catExpression} size={104} />
          </span>
          <Bubble onReplay={() => void narrator.playNarration(prompt)}>
            <NarrationText narration={prompt} />
          </Bubble>
        </div>
        <main className="k-main">{children}</main>
        {/* The sheet's height is always reserved, so the cards never jump when it appears. */}
        <div data-testid="feedback-area" className="k-feedback">
          {feedback ? <FeedbackBanner kind={feedback.kind} line={feedback.line} onContinue={feedback.onContinue} /> : null}
        </div>
      </div>
    </div>
  );
}
