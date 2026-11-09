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

  // Lazy: the store must exist before any use, whatever the effect order (child effects run first).
  const getStore = useCallback((): ProgressStore => {
    if (!storeRef.current) {
      let storage: Storage | null = null;
      try {
        storage = window.localStorage;
      } catch {
        storage = null;
      }
      storeRef.current = createLocalProgressStore(storage);
    }
    return storeRef.current;
  }, []);

  useEffect(() => {
    // Intentional: localStorage only exists on the client, so load after mount.
    setProgress(getStore().load());
  }, [getStore]);

  const finishLesson = useCallback(
    (lessonId: string, stickerId: string) => {
      const store = getStore();
      const current = store.load(); // memory-cached, never behind React state
      const next = completeLesson(current, lessonId, stickerId, new Date());
      if (next !== current) store.save(next);
      setProgress(next);
    },
    [getStore],
  );

  const value = useMemo(() => ({ progress, finishLesson }), [progress, finishLesson]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside <ProgressProvider>");
  return ctx;
}
