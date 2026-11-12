"use client";

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
export function FeedbackBanner({ kind, line, onContinue }: FeedbackBannerProps) {
  return <FeedbackSheet kind={kind} line={<NarrationText narration={line} tone="plain" />} onContinue={onContinue} />;
}
