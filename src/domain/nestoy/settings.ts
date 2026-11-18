import { dateKey } from "@/domain/trail/progress";

export type Ambient = "dia" | "rotina" | "noite";
export type PauseMinutes = 0 | 15 | 20 | 30;

export type Settings = {
  version: 1;
  ambient: Ambient;
  /** Local "HH:MM", 24h. */
  bedtime: string;
  pauseMinutes: PauseMinutes;
  opening: "auto" | "curta";
  motion: "auto" | "reduzir";
  openingSeen: boolean;
  /** Local "YYYY-MM-DD" of the last visit; null before the first. */
  lastVisit: string | null;
};

export const SETTINGS_KEY = "lingoo:settings:v1";
const DEFAULT_BEDTIME = "19:30";
const MORNING = "06:00";

export function defaultSettings(): Settings {
  return {
    version: 1,
    ambient: "dia",
    bedtime: DEFAULT_BEDTIME,
    pauseMinutes: 0,
    opening: "auto",
    motion: "auto",
    openingSeen: false,
    lastVisit: null,
  };
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function openingMode(
  s: Settings,
  now: Date,
  prefersReduced: boolean,
): "full" | "short" | "none" | "reduced" {
  if (s.motion === "reduzir" || prefersReduced) return "reduced";
  if (!s.openingSeen && s.opening === "auto") return "full";
  if (s.lastVisit === dateKey(now)) return "none";
  return "short";
}

export function isNight(s: Settings, now: Date): boolean {
  if (s.ambient === "noite") return true;
  if (s.ambient === "dia") return false;
  const bedtime = HHMM.test(s.bedtime) ? s.bedtime : DEFAULT_BEDTIME;
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return hhmm >= bedtime || hhmm < MORNING;
}

export function pauseDue(s: Settings, sessionStartMs: number, nowMs: number): boolean {
  return s.pauseMinutes > 0 && nowMs - sessionStartMs >= s.pauseMinutes * 60_000;
}

function sanitize(raw: unknown): Settings {
  const d = defaultSettings();
  if (typeof raw !== "object" || raw === null) return d;
  const r = raw as Record<string, unknown>;
  return {
    version: 1,
    ambient: r.ambient === "dia" || r.ambient === "rotina" || r.ambient === "noite" ? r.ambient : d.ambient,
    bedtime: typeof r.bedtime === "string" && HHMM.test(r.bedtime) ? r.bedtime : d.bedtime,
    pauseMinutes: r.pauseMinutes === 15 || r.pauseMinutes === 20 || r.pauseMinutes === 30 || r.pauseMinutes === 0 ? r.pauseMinutes : d.pauseMinutes,
    opening: r.opening === "auto" || r.opening === "curta" ? r.opening : d.opening,
    motion: r.motion === "auto" || r.motion === "reduzir" ? r.motion : d.motion,
    openingSeen: r.openingSeen === true,
    lastVisit: typeof r.lastVisit === "string" ? r.lastVisit : null,
  };
}

export type SettingsStore = { load(): Settings; save(s: Settings): void };

/** Never throws: missing, corrupt or blocked storage gives the defaults. */
export function createSettingsStore(storage: Storage | null): SettingsStore {
  return {
    load() {
      try {
        const raw = storage?.getItem(SETTINGS_KEY);
        return raw ? sanitize(JSON.parse(raw)) : defaultSettings();
      } catch {
        return defaultSettings();
      }
    },
    save(s) {
      try {
        storage?.setItem(SETTINGS_KEY, JSON.stringify(s));
      } catch {
        /* storage full or blocked: settings live in memory only */
      }
    },
  };
}
