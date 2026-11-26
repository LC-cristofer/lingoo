export type English = "none" | "words" | "alphabet" | "reads";
export type Age = 4 | 5 | 6 | 7 | 8 | 9;
export type Level = 1 | 2 | 3;
export type Onboarding = "pending" | "done" | "skipped";

export type Profile = {
  version: 1;
  /** Written only, never spoken. Up to 20 characters; empty when skipped. */
  name: string;
  age: Age | null;
  english: English | null;
  onboarding: Onboarding;
  /** ISO date-time the cadastro was finished; null before. */
  createdAt: string | null;
  islands: { descoberta: { letras: { levels: Record<string, Level> } } };
};

export const PROFILE_KEY = "lingoo:profile:v1";
export const NAME_MAX = 20;

export function defaultProfile(): Profile {
  return {
    version: 1,
    name: "",
    age: null,
    english: null,
    onboarding: "pending",
    createdAt: null,
    islands: { descoberta: { letras: { levels: {} } } },
  };
}

const AGES: readonly number[] = [4, 5, 6, 7, 8, 9];
const ENGLISH: readonly string[] = ["none", "words", "alphabet", "reads"];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function sanitizeProfile(raw: unknown): Profile {
  const d = defaultProfile();
  if (!isObject(raw)) return d;
  const levels: Record<string, Level> = {};
  const letras = isObject(raw.islands) && isObject(raw.islands.descoberta) && isObject(raw.islands.descoberta.letras) ? raw.islands.descoberta.letras : null;
  if (letras && isObject(letras.levels)) {
    for (const [id, lv] of Object.entries(letras.levels)) {
      if (id === "__proto__") continue;
      if (lv === 1 || lv === 2 || lv === 3) levels[id] = lv;
    }
  }
  return {
    version: 1,
    name: typeof raw.name === "string" ? raw.name.trim().slice(0, NAME_MAX).trim() : "",
    age: typeof raw.age === "number" && AGES.includes(raw.age) ? (raw.age as Age) : null,
    english: typeof raw.english === "string" && ENGLISH.includes(raw.english) ? (raw.english as English) : null,
    onboarding: raw.onboarding === "done" || raw.onboarding === "skipped" ? raw.onboarding : "pending",
    createdAt: typeof raw.createdAt === "string" && !Number.isNaN(Date.parse(raw.createdAt)) ? raw.createdAt : null,
    islands: { descoberta: { letras: { levels } } },
  };
}

export type ProfileStore = { load(): Profile; save(p: Profile): void };

/** Never throws: missing, corrupt or blocked storage gives the defaults. */
export function createProfileStore(storage: Storage | null): ProfileStore {
  return {
    load() {
      try {
        const raw = storage?.getItem(PROFILE_KEY);
        return raw ? sanitizeProfile(JSON.parse(raw)) : defaultProfile();
      } catch {
        return defaultProfile();
      }
    },
    save(p) {
      try {
        storage?.setItem(PROFILE_KEY, JSON.stringify(p));
      } catch {
        /* storage full or blocked: the profile lives in memory only */
      }
    },
  };
}

/** The tree branch the child starts on: what they already know of English decides; age only matters for "reads". */
export function startBranch(p: Profile): 1 | 2 | 3 | 4 {
  if (p.english === "alphabet") return 3;
  if (p.english === "reads") return p.age !== null && p.age >= 7 ? 4 : 3;
  return 1;
}

/** Age sets the pace: from 7 the lessons start with more options and less repetition. */
export function startLevel(p: Profile): Level {
  return p.age !== null && p.age >= 7 ? 2 : 1;
}

/** An install that already has progress (a finished stop, a sticker or a day played) but no cadastro: it may say "Agora não". */
export function hasPlayed(progress: { completedStops: Record<string, string>; stickers: Record<string, string>; daysPlayed: string[] }): boolean {
  return Object.keys(progress.completedStops).length > 0 || Object.keys(progress.stickers).length > 0 || progress.daysPlayed.length > 0;
}
