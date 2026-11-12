import type { ReactNode } from "react";
import { SpeakerIcon } from "../icons";

type BubbleProps = {
  children: ReactNode;
  tail?: "left" | "down";
  /** Renders the round 🔊 button that says the line again. */
  onReplay?: () => void;
  className?: string;
};

export function Bubble({ children, tail = "left", onReplay, className = "" }: BubbleProps) {
  return (
    <div className={`k-bubble k-tail-${tail} ${className}`}>
      <p className="k-bubble-text">{children}</p>
      {onReplay ? (
        <button type="button" aria-label="Ouvir de novo" onClick={onReplay} className="k-round k-round-sky min-h-16 min-w-16">
          <SpeakerIcon size={30} />
        </button>
      ) : null}
    </div>
  );
}
