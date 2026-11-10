"use client";

import { BigButton } from "@/components/BigButton";
import type { Narration } from "@/domain/trail/schema";
import { NarrationText } from "./NarrationText";
import { CheckIcon, MagnifierIcon } from "./icons";

export type FeedbackKind = "correct" | "retry" | "hint";

type FeedbackBannerProps = {
  kind: FeedbackKind;
  line: Narration;
  onContinue?: () => void;
};

export function FeedbackBanner({ kind, line, onContinue }: FeedbackBannerProps) {
  const background = kind === "correct" ? "bg-leaf" : "bg-orange";
  return (
    <div
      data-kind={kind}
      role="status"
      className={`${background} flex w-full items-center gap-4 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] font-display text-2xl text-ink shadow-[0_-4px_12px_rgba(0,0,0,0.08)]`}
    >
      {kind === "correct" ? <CheckIcon /> : null}
      {kind === "hint" ? <MagnifierIcon /> : null}
      <p className="flex-1 font-bold">
        <NarrationText narration={line} />
      </p>
      {kind === "correct" ? (
        <BigButton label="Continuar" color="sun" onPress={() => onContinue?.()}>
          <span aria-hidden="true" className="font-display text-2xl font-bold">
            Continuar
          </span>
        </BigButton>
      ) : null}
    </div>
  );
}
