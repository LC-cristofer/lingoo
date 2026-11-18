"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createSettingsStore, defaultSettings, type Settings, type SettingsStore } from "@/domain/nestoy/settings";

type SettingsContextValue = {
  settings: Settings;
  update(patch: Partial<Settings>): void;
  /** True once stored settings have been loaded (false during SSR and the first client render). */
  hydrated: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);
  const storeRef = useRef<SettingsStore | null>(null);
  const currentRef = useRef<Settings | null>(null);

  const getStore = useCallback((): SettingsStore => {
    if (!storeRef.current) {
      let storage: Storage | null = null;
      try {
        storage = window.localStorage;
      } catch {
        storage = null;
      }
      storeRef.current = createSettingsStore(storage);
    }
    return storeRef.current;
  }, []);

  useEffect(() => {
    const loaded = getStore().load();
    currentRef.current = loaded;
    setSettings(loaded);
    setHydrated(true);
  }, [getStore]);

  const update = useCallback(
    (patch: Partial<Settings>) => {
      const store = getStore();
      const base = currentRef.current ?? store.load();
      const next: Settings = { ...base, ...patch, version: 1 };
      currentRef.current = next;
      store.save(next);
      setSettings(next);
    },
    [getStore],
  );

  const value = useMemo(() => ({ settings, update, hydrated }), [settings, update, hydrated]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
