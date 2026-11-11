"use client";

import { useCallback, useEffect, useRef } from "react";
import { Animal, ART_WORDS } from "@/art/Animal";
import type { ArtId, Narration, Word } from "@/domain/trail/schema";
import type { Phase } from "@/domain/trail/session";

/** Cards take taps only while the child is answering (or being helped by a hint). */
export function isInteractive(phase: Phase): boolean {
  return phase === "answering" || phase === "hint";
}

/** What the gatinho says for a word: its `say`, or the bare English word as a fallback. */
export function sayFor(words: Word[], id: ArtId): Narration {
  return words.find((w) => w.id === id)?.say ?? [{ lang: "en-US", text: ART_WORDS[id] }];
}

/**
 * Guards against rapid taps: after an attempt that moves the session (any attempt while
 * "answering", or the right one during the "hint"), further taps are ignored until `phase` changes
 * back to "answering" or "hint". A wrong tap during the hint leaves the gate open: the session
 * ignores it and keeps `phase === "hint"`, so no phase change would ever unlock it.
 */
export function useAnswerGate(phase: Phase, onAnswer: (correct: boolean) => void) {
  const locked = useRef(!isInteractive(phase));
  const phaseRef = useRef(phase);
  const onAnswerRef = useRef(onAnswer);
  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);
  useEffect(() => {
    phaseRef.current = phase;
    locked.current = !isInteractive(phase);
  }, [phase]);
  const isLocked = useCallback(() => locked.current, []);
  const report = useCallback((correct: boolean) => {
    if (locked.current) return;
    if (correct || phaseRef.current === "answering") locked.current = true;
    onAnswerRef.current(correct);
  }, []);
  return { isLocked, report };
}

/** setTimeout that is cleared on unmount (and `clearAll` on demand). */
export function useTimers() {
  const ids = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const set = ids.current;
    return () => {
      set.forEach(clearTimeout);
      set.clear();
    };
  }, []);
  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      ids.current.delete(id);
      fn();
    }, ms);
    ids.current.add(id);
    return id;
  }, []);
  const cancel = useCallback((id: ReturnType<typeof setTimeout> | null) => {
    if (id === null) return;
    clearTimeout(id);
    ids.current.delete(id);
  }, []);
  return { later, cancel };
}

/** Small string hash (FNV-1a) used as a seed so card orders are fixed per exercise. */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic shuffle (mulberry32 + Fisher–Yates); never returns the input order for 2+ items. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.length > 1 && out.every((x, i) => x === items[i])) out.push(out.shift()!);
  return out;
}

type ArtCardProps = {
  id: ArtId;
  onTap: () => void;
  disabled: boolean;
  glow?: boolean;
  size?: number;
  className?: string;
  data?: Record<`data-${string}`, string | undefined>;
};

/** A tappable picture card: no visible text, the English word as its accessible name. */
export function ArtCard({ id, onTap, disabled, glow = false, size = 112, className = "", data }: ArtCardProps) {
  return (
    <button
      type="button"
      data-card={id}
      aria-label={ART_WORDS[id]}
      lang="en"
      disabled={disabled}
      onClick={onTap}
      {...data}
      className={`inline-flex min-h-[120px] min-w-[120px] items-center justify-center rounded-3xl bg-white p-2 shadow-md transition-transform active:scale-95 disabled:active:scale-100 ${
        glow ? "ring-4 ring-sun" : ""
      } ${className}`}
    >
      <Animal id={id} size={size} glow={glow} />
    </button>
  );
}

export const CARD_ROW = "flex flex-wrap items-center justify-center gap-4";
