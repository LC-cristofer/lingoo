"use client";

import type { ReactNode } from "react";
import { narrator } from "@/audio/narrator";
import { Cat, type CatExpression } from "@/art/Cat";
import type { Narration } from "@/domain/trail/schema";
import { FeedbackBanner, type FeedbackKind } from "./FeedbackBanner";
import { Bubble } from "./kit/Bubble";
import { ForestScene } from "./kit/ForestScene";
import { LessonTopBar } from "./kit/LessonTopBar";
import { NarrationText } from "./NarrationText";

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
    <div className="k-screen">
      <ForestScene variant="lesson" />
      <div className="k-lesson">
        <LessonTopBar ratio={ratio} onExit={onExit} />
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
