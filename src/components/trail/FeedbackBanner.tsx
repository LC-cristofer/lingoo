"use client";

import { Nino } from "@/art/nino/Nino";
import type { NinoPose, NinoReaction } from "@/art/nino/poses";
import type { Narration } from "@/domain/trail/schema";
import { FeedbackSheet } from "./kit/FeedbackSheet";
import { NarrationText } from "./NarrationText";

export type FeedbackKind = "correct" | "retry" | "hint";

type FeedbackBannerProps = {
  kind: FeedbackKind;
  line: Narration;
  onContinue?: () => void;
};

/** The feedback of an attempt, drawn as the kit's bottom sheet (green for right, orange otherwise). */
const WHO: Record<FeedbackKind, { pose: NinoPose; reaction: NinoReaction }> = {
  correct: { pose: "happy", reaction: "correct" },
  retry: { pose: "help", reaction: "retry" },
  hint: { pose: "point", reaction: "hint" },
};

export function FeedbackBanner({ kind, line, onContinue }: FeedbackBannerProps) {
  const who = WHO[kind];
  return (
    <FeedbackSheet
      kind={kind}
      line={<NarrationText narration={line} tone="plain" />}
      onContinue={onContinue}
      who={<Nino pose={who.pose} size={92} reaction={{ kind: who.reaction, n: 1 }} />}
    />
  );
}
