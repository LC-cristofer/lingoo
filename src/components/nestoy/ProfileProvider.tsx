"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createProfileStore, defaultProfile, type Level, type Profile, type ProfileStore } from "@/domain/nestoy/profile";

type ProfileContextValue = {
  profile: Profile;
  /** True once the stored profile has been loaded (false during SSR and the first client render). */
  hydrated: boolean;
  update(patch: Partial<Profile>): void;
  /** Remembers the adaptive level of one unit of the Árvore das Letras. */
  setLevel(unitId: string, level: Level): void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [hydrated, setHydrated] = useState(false);
  const storeRef = useRef<ProfileStore | null>(null);
  const currentRef = useRef<Profile | null>(null);

  const getStore = useCallback((): ProfileStore => {
    if (!storeRef.current) {
      let storage: Storage | null = null;
      try {
        storage = window.localStorage;
      } catch {
        storage = null;
      }
      storeRef.current = createProfileStore(storage);
    }
    return storeRef.current;
  }, []);

  useEffect(() => {
    const loaded = getStore().load();
    currentRef.current = loaded;
    setProfile(loaded);
    setHydrated(true);
  }, [getStore]);

  const commit = useCallback(
    (build: (base: Profile) => Profile) => {
      const store = getStore();
      const next = build(currentRef.current ?? store.load());
      currentRef.current = next;
      store.save(next);
      setProfile(next);
    },
    [getStore],
  );

  const update = useCallback(
    (patch: Partial<Profile>) =>
      commit((base) => {
        const next: Profile = { ...base, ...patch, version: 1 };
        // A grown-up who answers age and English in the parents' area has done the cadastro: it must not come back on the next visit.
        if (next.onboarding === "pending" && next.age !== null && next.english !== null) next.onboarding = "done";
        if (next.onboarding === "done" && next.createdAt === null) next.createdAt = new Date().toISOString();
        return next;
      }),
    [commit],
  );

  const setLevel = useCallback(
    (unitId: string, level: Level) =>
      commit((base) => {
        const letras = base.islands.descoberta.letras;
        return { ...base, islands: { ...base.islands, descoberta: { ...base.islands.descoberta, letras: { ...letras, levels: { ...letras.levels, [unitId]: level } } } } };
      }),
    [commit],
  );

  const value = useMemo(() => ({ profile, hydrated, update, setLevel }), [profile, hydrated, update, setLevel]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

/** The profile when a provider is mounted, null otherwise (screens that also run without one, like the exercise loop in tests). */
export function useOptionalProfile(): ProfileContextValue | null {
  return useContext(ProfileContext);
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside <ProfileProvider>");
  return ctx;
}
