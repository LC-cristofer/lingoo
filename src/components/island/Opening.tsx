"use client";

import { useEffect, useRef } from "react";
import { Wordmark } from "@/art/brand/Wordmark";
import type { Stage } from "@/world/stage";

type OpeningProps = {
  stage: Stage | null;
  /** True during the full opening: the logo hangs in the sky and "Pular" appears after about a second. */
  active: boolean;
  onSkip: () => void;
};

/**
 * The opening's overlay: the NESTOY logo, the "Pular" button and the cream fade that covers the cuts.
 * The stage's timeline drives all three every frame (opacity and transform only).
 */
export function Opening({ stage, active, onSkip }: OpeningProps) {
  const logo = useRef<HTMLDivElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const fade = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stage) return;
    const paint = () => {
      const { logo: l, skip: k, fade: f } = stage.fx.intro;
      const L = logo.current, K = skip.current, F = fade.current;
      if (L) { L.style.opacity = l.toFixed(3); L.style.transform = `translateY(${((1 - l) * -24).toFixed(1)}px)`; }
      if (K) { K.style.opacity = k.toFixed(3); K.style.pointerEvents = k > 0.5 ? "auto" : "none"; K.style.visibility = k > 0.01 ? "visible" : "hidden"; }
      if (F) F.style.opacity = f.toFixed(3);
    };
    paint();
    return stage.onFrame(paint);
  }, [stage, active]);

  return (
    <>
      {active ? (
        <div className="nz-intro" data-testid="opening">
          <div ref={logo} className="nz-intro-logo">
            <Wordmark className="nz-intro-wm" />
            <span className="nz-intro-tag">um ninho de descobertas</span>
          </div>
          <button ref={skip} type="button" className="nz-intro-skip min-h-16 min-w-16" onClick={onSkip}>
            Pular
          </button>
        </div>
      ) : null}
      <div ref={fade} className="nz-fade" aria-hidden="true" />
    </>
  );
}
