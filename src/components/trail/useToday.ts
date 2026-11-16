"use client";

import { useSyncExternalStore } from "react";
import { todayKey } from "@/domain/trail/memory";

const serverToday = (): string | null => null;

/** Milliseconds until one second past the next local midnight. */
function msToNextDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  return Math.max(1000, next.getTime() - now.getTime());
}

/** Notifies at the next local midnight (+1 s) and whenever the tab becomes visible again. */
function subscribe(notify: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      notify();
      schedule();
    }, msToNextDay());
  };
  const onVisible = () => {
    notify();
    schedule(); // the clock may have moved a lot while the tab slept
  };
  schedule();
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

/**
 * Today's local date as "YYYY-MM-DD", or null on the server and in the hydration pass.
 * (Reading the clock while rendering would be frozen by the prerender, so it is read on the client only.)
 * It follows the clock: a page left open past midnight, or a tab woken up the next day, re-reads the day.
 */
export function useToday(): string | null {
  return useSyncExternalStore(subscribe, todayKey, serverToday);
}
