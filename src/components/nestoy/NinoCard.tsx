"use client";

import { forwardRef, type ReactNode } from "react";
import { Nino } from "@/art/nino/Nino";
import type { NinoPose } from "@/art/nino/poses";

export type ChipTone = "ok" | "obra" | "futuro" | "noite";

export type NinoCardProps = {
  title: string;
  text?: string;
  /** A small label such as "1 de 6" or "Em obras". */
  chip?: string;
  tone?: ChipTone;
  /** The round 64 px button on the right (enter, play, pause…). */
  action?: { label: string; onPress: () => void; icon?: ReactNode };
  pose: NinoPose;
  /** Moves Nino's mouth while the narrator speaks. */
  speaks?: boolean;
  className?: string;
};

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" width="28" height="28" aria-hidden="true">
      <path d="M6 3.5l11 6.5-11 6.5z" fill="currentColor" />
    </svg>
  );
}

/** The bottom card of the world screens: Nino's portrait, a title, a line of text, a chip and one round action. */
export const NinoCard = forwardRef<HTMLElement, NinoCardProps>(function NinoCard({ title, text, chip, tone = "ok", action, pose, speaks = false, className = "" }, ref) {
  return (
    <section ref={ref} className={`nz-card ${className}`} data-testid="nino-card" aria-label={title}>
      <span className="nz-card-who" aria-hidden="true">
        <Nino pose={pose} size={104} speaks={speaks} />
      </span>
      <div className="nz-card-txt" aria-live="polite">
        <h2 className="nz-card-title">{title}</h2>
        {text ? <p className="nz-card-text">{text}</p> : null}
        {chip ? <span className={`nz-chip is-${tone}`}>{chip}</span> : null}
      </div>
      {action ? (
        <button type="button" className="nz-card-btn" aria-label={action.label} onClick={action.onPress}>
          {action.icon ?? <PlayIcon />}
        </button>
      ) : null}
    </section>
  );
});
