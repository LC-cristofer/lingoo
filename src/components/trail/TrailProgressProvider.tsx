"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { completeStop, emptyProgress, markDay, type Progress } from "@/domain/trail/progress";
import { createTrailProgressStore, type TrailProgressStore } from "@/domain/trail/progress-store";

type TrailProgressContextValue = {
  progress: Progress;
  /** True once stored progress has been loaded (false during SSR and the first client render). */
  hydrated: boolean;
  finishStop(stopId: string, stickerId?: string): void;
  /** Records today as a day played, without finishing any stop. */
  markToday(): void;
};

const TrailProgressContext = createContext<TrailProgressContextValue | null>(null);

export function TrailProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [hydrated, setHydrated] = useState(false);
  const storeRef = useRef<TrailProgressStore | null>(null);

  // Lazy: the store must exist before any use, whatever the effect order (child effects run first).
  const getStore = useCallback((): TrailProgressStore => {
    if (!storeRef.current) {
      let storage: Storage | null = null;
      try {
        storage = window.localStorage;
      } catch {
        storage = null;
      }
      storeRef.current = createTrailProgressStore(storage);
    }
    return storeRef.current;
  }, []);

  useEffect(() => {
    // Intentional: localStorage only exists on the client, so load after mount.
    setProgress(getStore().load());
    setHydrated(true);
  }, [getStore]);

  const apply = useCallback(
    (update: (current: Progress) => Progress) => {
      const store = getStore();
      const current = store.load(); // memory-cached, never behind React state
      const next = update(current);
      if (next !== current) store.save(next);
      setProgress(next);
    },
    [getStore],
  );

  const finishStop = useCallback(
    (stopId: string, stickerId?: string) => apply((p) => completeStop(p, stopId, new Date(), stickerId)),
    [apply],
  );
  const markToday = useCallback(() => apply((p) => markDay(p, new Date())), [apply]);

  const value = useMemo(
    () => ({ progress, hydrated, finishStop, markToday }),
    [progress, hydrated, finishStop, markToday],
  );
  return <TrailProgressContext.Provider value={value}>{children}</TrailProgressContext.Provider>;
}

export function useTrailProgress(): TrailProgressContextValue {
  const ctx = useContext(TrailProgressContext);
  if (!ctx) throw new Error("useTrailProgress must be used inside <TrailProgressProvider>");
  return ctx;
}
