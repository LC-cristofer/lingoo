"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { completeLesson, emptyProgress, type Progress, type ProgressStore } from "@/domain/progress";
import { createLocalProgressStore } from "@/domain/progress-local";

type ProgressContextValue = {
  progress: Progress;
  finishLesson(lessonId: string, stickerId: string): void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const storeRef = useRef<ProgressStore | null>(null);

  useEffect(() => {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    const store = createLocalProgressStore(storage);
    storeRef.current = store;
    // Intentional: localStorage only exists on the client, so load after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(store.load());
  }, []);

  const finishLesson = useCallback((lessonId: string, stickerId: string) => {
    setProgress((prev) => {
      const next = completeLesson(prev, lessonId, stickerId, new Date());
      if (next !== prev) storeRef.current?.save(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ progress, finishLesson }), [progress, finishLesson]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside <ProgressProvider>");
  return ctx;
}
