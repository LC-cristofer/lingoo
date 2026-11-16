"use client";

import { useSyncExternalStore } from "react";
import { todayKey } from "@/domain/trail/memory";

const subscribe = () => () => {};
const serverToday = (): string | null => null;

/**
 * Today's local date as "YYYY-MM-DD", or null on the server and in the hydration pass.
 * (Reading the clock while rendering would be frozen by the prerender, so it is read on the client only.)
 */
export function useToday(): string | null {
  return useSyncExternalStore(subscribe, todayKey, serverToday);
}
