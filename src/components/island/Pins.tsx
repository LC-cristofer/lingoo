"use client";

import { useEffect, useRef } from "react";
import { NestMark } from "@/art/brand/NestMark";
import type { PlaceId, PlaceState } from "@/world/island";
import { PLACE_ANCHORS } from "@/world/island";
import type { Stage } from "@/world/stage";

export const PLACE_NAMES: Record<PlaceId, string> = {
  ninho: "Ninho do Nino",
  farol: "Farol das Línguas",
  letras: "Árvore das Letras",
  numeros: "Torre dos Números",
  cores: "Jardim das Cores",
  lago: "Lago das Descobertas",
};
/** DOM order: the pins that crowd each other (numeros, farol) come last so the lighthouse wins a shared edge. */
export const PLACE_ORDER: PlaceId[] = ["ninho", "letras", "cores", "lago", "numeros", "farol"];
const AREA: Record<PlaceId, string> = {
  ninho: "var(--area-ninho)", farol: "var(--area-linguas)", letras: "var(--area-letras)",
  numeros: "var(--area-numeros)", cores: "var(--area-cores)", lago: "var(--area-mundo)",
};
const PIN = 64;

function Icon({ id }: { id: PlaceId }) {
  switch (id) {
    case "ninho":
      return <span aria-hidden="true" className="nz-pin-ico"><NestMark size={30} /></span>;
    case "farol":
      return <b aria-hidden="true">Hi!</b>;
    case "letras":
      return <b aria-hidden="true">Aa</b>;
    case "numeros":
      return <b aria-hidden="true">123</b>;
    case "cores":
      return (
        <svg aria-hidden="true" viewBox="0 0 30 12" width="26">
          <circle cx="5" cy="6" r="4.5" fill="var(--area-letras)" />
          <circle cx="15" cy="6" r="4.5" fill="var(--hint)" />
          <circle cx="25" cy="6" r="4.5" fill="var(--area-linguas)" />
        </svg>
      );
    case "lago":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22">
          <path d="M3 15h18l-3 4H6z" fill="var(--area-ninho)" />
          <path d="M12 3v11M12 4l6 9h-6z" fill="var(--area-letras)" stroke="var(--cocoa)" strokeWidth="1.2" />
        </svg>
      );
  }
}

function Badge({ state }: { state: PlaceState }) {
  if (state === "pronto") return null;
  return (
    <i className={`nz-pin-badge is-${state}`} aria-hidden="true">
      {state === "obra" ? (
        <svg viewBox="0 0 20 20">
          <path d="M5 15l7-7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          <rect x="10" y="3" width="7" height="5" rx="1" fill="currentColor" transform="rotate(45 13.5 5.5)" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20">
          <path d="M10 17V9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <ellipse cx="6.5" cy="8" rx="4" ry="2.4" fill="currentColor" transform="rotate(-25 6.5 8)" />
          <ellipse cx="13.5" cy="7" rx="4" ry="2.4" fill="currentColor" transform="rotate(25 13.5 7)" />
        </svg>
      )}
    </i>
  );
}

type PinsProps = {
  stage: Stage | null;
  states: Record<PlaceId, PlaceState>;
  /** The place that glows: the one in focus, else the suggested next step. */
  glow: PlaceId | null;
  onPress: (id: PlaceId) => void;
};

/** The six place pins: 64 px buttons with a 46 px medallion, moved with the camera every frame (transform only). */
export function Pins({ stage, states, glow, onPress }: PinsProps) {
  const refs = useRef<Partial<Record<PlaceId, HTMLButtonElement | null>>>({});

  useEffect(() => {
    if (!stage) return;
    const seen: Partial<Record<PlaceId, string>> = {};
    const place = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const pos = PLACE_ORDER.map((id) => stage.screenOf(PLACE_ANCHORS[id].x, PLACE_ANCHORS[id].y));
      // On a small screen neighbouring places sit closer than a 64 px target: nudge the pins apart (a few px at most).
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < pos.length; i++) {
          for (let j = i + 1; j < pos.length; j++) {
            const dx = pos[j][0] - pos[i][0], dy = pos[j][1] - pos[i][1], d = Math.hypot(dx, dy);
            if (d >= PIN || d < 0.01) continue;
            const k = (PIN - d) / 2 / d;
            pos[i] = [pos[i][0] - dx * k, pos[i][1] - dy * k];
            pos[j] = [pos[j][0] + dx * k, pos[j][1] + dy * k];
          }
        }
      }
      PLACE_ORDER.forEach((id, i) => {
        const b = refs.current[id];
        if (!b) return;
        const [sx, sy] = pos[i];
        // the opening pops the pins in one by one: fx.pins is how much each one has appeared (the pop may overshoot 1)
        const shown = stage.fx.pins[id];
        const vis = shown > 0.01 && sx > -PIN && sx < w + PIN && sy > -PIN && sy < h + PIN ? "visible" : "hidden";
        const key = `${sx.toFixed(1)},${sy.toFixed(1)},${vis},${shown.toFixed(3)}`;
        if (seen[id] === key) return;
        seen[id] = key;
        b.style.transform = `translate(${(sx - PIN / 2).toFixed(1)}px, ${(sy - PIN / 2).toFixed(1)}px) scale(${shown >= 1 ? 1 : (0.4 + 0.6 * Math.max(0, shown)).toFixed(3)})`;
        b.style.opacity = Math.min(1, Math.max(0, shown)).toFixed(3);
        b.style.visibility = vis;
      });
    };
    place();
    return stage.onFrame(place);
  }, [stage]);

  return (
    <div className="nz-pins">
      {PLACE_ORDER.map((id) => (
        <button
          key={id}
          ref={(el) => { refs.current[id] = el; }}
          type="button"
          className="nz-pin"
          data-place={id}
          data-state={states[id]}
          data-glow={glow === id}
          aria-label={PLACE_NAMES[id]}
          style={{ "--c": AREA[id] } as React.CSSProperties}
          onClick={() => onPress(id)}
        >
          <span className="nz-pin-med">
            <Icon id={id} />
            <Badge state={states[id]} />
          </span>
        </button>
      ))}
    </div>
  );
}
