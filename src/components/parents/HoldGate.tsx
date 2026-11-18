"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type HoldGateProps = {
  onOpen: () => void;
  /** How long the button must be held, in ms. */
  ms?: number;
};

const R = 30;
const CIRC = 2 * Math.PI * R;

/** The parents' door: press and hold the button for 2 s; letting go early starts over. */
export function HoldGate({ onOpen, ms = 2000 }: HoldGateProps) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const openRef = useRef(onOpen);
  useEffect(() => {
    openRef.current = onOpen;
  });

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    setHolding(false);
  }, []);
  const start = useCallback(() => {
    if (timer.current !== undefined) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = undefined;
      setHolding(false);
      openRef.current();
    }, ms);
  }, [ms]);

  // A kept-alive page that is hidden runs this cleanup: no half-finished hold survives to the next arrival.
  useEffect(() => cancel, [cancel]);

  return (
    <button
      type="button"
      className="np-hold"
      data-holding={holding}
      style={{ ["--hold-ms" as string]: `${ms}ms` }}
      onPointerDown={(e) => {
        if (e.button !== undefined && e.button > 0) return;
        start();
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") cancel();
      }}
      onBlur={cancel}
    >
      <span className="np-hold-ring" aria-hidden="true">
        <svg viewBox="0 0 72 72" width="72" height="72">
          <circle cx="36" cy="36" r={R} className="np-hold-track" />
          <circle cx="36" cy="36" r={R} className="np-hold-fill" strokeDasharray={CIRC} />
        </svg>
        <svg className="np-hold-lock" viewBox="0 0 24 24" width="28" height="28">
          <rect x="5" y="10" width="14" height="10" rx="3" fill="currentColor" />
          <path d="M8 10V8a4 4 0 018 0v2" stroke="currentColor" strokeWidth="2.4" fill="none" />
        </svg>
      </span>
      <span className="np-hold-label">Segure para entrar</span>
    </button>
  );
}
