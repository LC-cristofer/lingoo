"use client";

import { forwardRef } from "react";
import { NestMark } from "@/art/brand/NestMark";

type TopBarProps = {
  night: boolean;
  onNest: () => void;
  onParents: () => void;
};

/** The top row of the island: the nest button, the day/night indicator and the parents' door. */
export const TopBar = forwardRef<HTMLDivElement, TopBarProps>(function TopBar({ night, onNest, onParents }, ref) {
  return (
    <div ref={ref} className="nz-topbar">
      <button type="button" className="k-round k-round-glass" aria-label="Voltar ao ninho" onClick={onNest}>
        <span aria-hidden="true" className="nz-topbar-nest"><NestMark size={42} /></span>
      </button>
      <span className="nz-topbar-sp" />
      <span className="nz-time" data-testid="island-time" data-night={night}>
        {night ? (
          <svg role="img" aria-label="Noite" viewBox="0 0 20 20" width="22" height="22">
            <path d="M12 2a8 8 0 108 10A6.5 6.5 0 0112 2z" fill="var(--night-ui)" />
          </svg>
        ) : (
          <svg role="img" aria-label="Dia" viewBox="0 0 20 20" width="24" height="24">
            <circle cx="10" cy="10" r="4.5" fill="var(--hint)" />
            <g stroke="var(--hint)" strokeWidth="2" strokeLinecap="round">
              <path d="M10 1.5v2.5M10 16v2.5M1.5 10H4M16 10h2.5M4 4l1.8 1.8M14.2 14.2L16 16M4 16l1.8-1.8M14.2 5.8L16 4" />
            </g>
          </svg>
        )}
        <span aria-hidden="true">{night ? "Noite" : "Dia"}</span>
      </span>
      <button type="button" className="k-round k-round-glass" aria-label="Área dos responsáveis" onClick={onParents}>
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="3" fill="var(--cocoa-2)" />
          <path d="M8 10V8a4 4 0 018 0v2" stroke="var(--cocoa-2)" strokeWidth="2.4" fill="none" />
        </svg>
      </button>
    </div>
  );
});
