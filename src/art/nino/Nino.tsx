"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { narrator } from "@/audio/narrator";
import { REACTION_POSE, poseState, type NinoPose, type NinoReaction } from "./poses";
import { createNinoRig, type Arm, type NinoRig, type NinoState } from "./rig";
import "./nino.css";

export type NinoProps = {
  pose: NinoPose;
  size: number;
  /** Moves the mouth while the narrator is speaking. */
  speaks?: boolean;
  /** A new `n` restarts the reaction; it lasts at most 1400 ms and then returns to `pose`. */
  reaction?: { kind: NinoReaction; n: number };
  className?: string;
};

const VIEW = { x: -30, y: -40, w: 260, h: 300 };
const REACTION_MS = 1400;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener?.("change", cb);
  return () => mq.removeEventListener?.("change", cb);
}
const reducedNow = () => (typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(REDUCED_QUERY).matches);

/** Extra motion a reaction adds on top of its pose, as a function of progress k in 0..1. */
function reactionMotion(kind: NinoReaction, k: number): Partial<NinoState> {
  const env = Math.sin(Math.min(1, k) * Math.PI);
  switch (kind) {
    case "correct": return { lift: Math.abs(Math.sin(k * Math.PI * 2)) * 22 * (1 - k), sy: 1 + env * 0.04 };
    case "celebrate": return { lift: Math.abs(Math.sin(k * Math.PI * 3)) * 30 * (1 - k * 0.5), head: Math.sin(k * Math.PI * 6) * 5 };
    case "retry": return { head: -6 - env * 6, headY: env * 3 };
    case "hint": return { lean: env * 3, lookX: 4 + env * 2 };
    case "greet": return { head: 4 + Math.sin(k * Math.PI * 6) * 3, lift: env * 6 };
    case "tap": return { sx: 1 + env * 0.06, sy: 1 - env * 0.08 };
    case "locked": return { head: Math.sin(k * Math.PI * 6) * 8 * (1 - k) };
  }
}

const CONTINUOUS = ["head", "headY", "earL", "earR", "pawL", "pawR", "lookX", "lookY", "sx", "sy", "breathe", "lift", "lean"] as const;

export function Nino({ pose, size, speaks = false, reaction, className }: NinoProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rigRef = useRef<NinoRig | null>(null);
  const reduced = useSyncExternalStore(subscribeReduced, reducedNow, () => false);
  const [expired, setExpired] = useState<string | null>(null);
  const target = useRef<{ pose: NinoPose; reaction: NinoReaction | null; start: number }>({ pose, reaction: null, start: 0 });
  // The narrator may be absent (tests mock it away); a listener must never break it either.
  const speaking = useSyncExternalStore(
    (cb) => (speaks ? (narrator.onSpeakingChange?.(() => cb()) ?? (() => {})) : () => {}),
    () => (speaks ? (narrator.isSpeaking?.() ?? false) : false),
    () => false,
  );
  const talking = speaks && speaking;

  const rkind = reaction?.kind;
  const rn = reaction?.n;
  const rkey = rkind ? `${rkind}:${rn}` : null;
  const active = rkind && rkey !== expired ? rkind : null;
  useEffect(() => {
    if (!rkind || !rkey) return;
    target.current.reaction = rkind;
    target.current.start = performance.now();
    const id = setTimeout(() => {
      target.current.reaction = null;
      setExpired(rkey);
    }, REACTION_MS);
    return () => clearTimeout(id);
  }, [rkind, rkey]);

  useLayoutEffect(() => {
    target.current.pose = pose;
  }, [pose]);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rig = createNinoRig(svg, { x: 100, y: 222, s: 1, ...poseState(target.current.pose) });
    rigRef.current = rig;
    rig.render(0, true);
    return () => {
      rig.el.remove();
      rigRef.current = null;
    };
  }, []);

  useEffect(() => {
    const rig = rigRef.current;
    if (!rig) return;
    rig.st.talking = talking;
    const goal = (now: number): Partial<NinoState> => {
      const { pose: p, reaction: r, start } = target.current;
      if (!r) return poseState(p);
      const k = Math.min(1, (now - start) / REACTION_MS);
      return { ...poseState(REACTION_POSE[r]), ...reactionMotion(r, k) };
    };
    const apply = (g: Partial<NinoState>, rate: number) => {
      const st = rig.st as unknown as Record<string, unknown>;
      for (const key of CONTINUOUS) {
        const v = g[key];
        if (typeof v === "number") st[key] = rate >= 1 ? v : (st[key] as number) + (v - (st[key] as number)) * rate;
      }
      for (const key of ["armL", "armR"] as const) {
        const v = g[key];
        if (v) rig.st[key] = rate >= 1 ? ([...v] as Arm) : (rig.st[key].map((n, i) => n + (v[i] - n) * rate) as Arm);
      }
      if (g.eyes) rig.st.eyes = g.eyes;
      if (g.mouth) rig.st.mouth = g.mouth;
    };
    if (reduced) {
      apply(poseState(target.current.pose), 1);
      rig.render(0, true);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      apply(goal(now), 1 - Math.exp(-dt / 70));
      rig.render(now, false);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reduced, talking, pose, active]);

  return (
    <svg
      ref={svgRef}
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      width={size}
      height={Math.round((size * VIEW.h) / VIEW.w)}
      role="img"
      aria-label="Nino"
      className={`nino-svg${className ? ` ${className}` : ""}`}
      data-pose={pose}
      data-talking={talking ? "true" : "false"}
      data-reaction={active ?? undefined}
      data-reduced={reduced ? "true" : "false"}
    />
  );
}
