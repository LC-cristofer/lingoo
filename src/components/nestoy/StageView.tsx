"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useSettings } from "@/components/nestoy/SettingsProvider";
import type { Viewport } from "@/world/camera";
import type { IslandStates } from "@/world/island";
import { createStage, type Stage } from "@/world/stage";

export type StageInsets = { top: number; bottom: number; left?: number; right?: number };

type StageViewProps = {
  scene: "island" | "farol";
  /** Island places' states and nest threads (read when the stage is built). */
  states?: IslandStates;
  threads?: number;
  farolLevel: 1 | 2 | 3 | 4;
  /** What the UI over the world covers, in px: the camera keeps its subject between them. */
  insets: StageInsets;
  /** The live stage once mounted, and null once destroyed. */
  onStage?: (stage: Stage | null) => void;
  /** Called with every new viewport (size or insets changed). */
  onViewport?: (vp: Viewport) => void;
};

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function subscribe(cb: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener?.("change", cb);
  return () => mq.removeEventListener?.("change", cb);
}
const mediaReduced = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(REDUCED_QUERY).matches;

/** Settings "reduzir" or the system preference: no camera travel, no ambient motion. */
export function useReducedMotion(): boolean {
  const { settings } = useSettings();
  const media = useSyncExternalStore(subscribe, mediaReduced, () => false);
  return settings.motion === "reduzir" || media;
}

const SIDE_QUERY = "(orientation: landscape) and (max-height: 520px)";
function subscribeSide(cb: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(SIDE_QUERY);
  mq.addEventListener?.("change", cb);
  return () => mq.removeEventListener?.("change", cb);
}
const sideNow = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(SIDE_QUERY).matches;

/** A phone on its side (short landscape): panels move to a column at the edge instead of a sheet at the bottom. */
export function useSideLayout(): boolean {
  return useSyncExternalStore(subscribeSide, sideNow, () => false);
}

const NO_STATES: IslandStates = { letras: "obra", numeros: "futuro", cores: "futuro", lago: "futuro" };

/** A full-bleed host for the world stage: builds it, keeps its viewport in step with the box, destroys it on unmount. */
export function StageView({ scene, states = NO_STATES, threads = 0, farolLevel, insets, onStage, onViewport }: StageViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const reduced = useReducedMotion();
  // Latest props for the long-lived callbacks below.
  const live = useRef({ insets, onStage, onViewport, states, threads, farolLevel });
  useEffect(() => {
    live.current = { insets, onStage, onViewport, states, threads, farolLevel };
  });
  const push = useRef<() => void>(() => {});
  const statesKey = JSON.stringify(states);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const { states: st, threads: th, farolLevel: lv } = live.current;
    const stage = createStage(host, { scene, states: st, threads: th, farolLevel: lv, reduced });
    stageRef.current = stage;
    const sync = () => {
      const { insets: i, onViewport: cb } = live.current;
      const vp: Viewport = { w: host.clientWidth || 390, h: host.clientHeight || 844, top: i.top, bottom: i.bottom, left: i.left ?? 0, right: i.right ?? 0 };
      stage.setViewport(vp);
      cb?.(vp);
    };
    push.current = sync;
    sync();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(sync);
    ro?.observe(host);
    live.current.onStage?.(stage);
    return () => {
      ro?.disconnect();
      push.current = () => {};
      stageRef.current = null;
      live.current.onStage?.(null);
      stage.destroy();
    };
    // The stage is rebuilt only when the world or the motion preference changes.
  }, [scene, reduced, statesKey, threads]);

  useEffect(() => {
    push.current();
  }, [insets.top, insets.bottom, insets.left, insets.right]);

  useEffect(() => {
    if (stageRef.current) stageRef.current.env.farolLevel = farolLevel;
  }, [farolLevel]);

  return <div ref={hostRef} className="nz-stage" data-scene={scene} aria-hidden="true" />;
}
