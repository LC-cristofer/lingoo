import { emptyProgress, type Progress } from "./progress";

const KEY = "lingoo:progress:v2";

export type TrailProgressStore = { load(): Progress; save(p: Progress): void };

function isRecord(v: unknown): v is Record<string, string> {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    Object.values(v).every((x) => typeof x === "string")
  );
}

function parse(raw: string | null): Progress | null {
  if (raw === null) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const { completedStops, stickers, daysPlayed } = data as Record<string, unknown>;
    if (!isRecord(completedStops) || !isRecord(stickers)) return null;
    if (!Array.isArray(daysPlayed) || !daysPlayed.every((d) => typeof d === "string")) return null;
    return { completedStops, stickers, daysPlayed: daysPlayed as string[] };
  } catch {
    return null;
  }
}

/** Never throws: if storage is missing, blocked or corrupted, progress lives in memory only. */
export function createTrailProgressStore(storage?: Storage | null): TrailProgressStore {
  let memory: Progress | null = null;
  return {
    load() {
      if (memory) return memory;
      let raw: string | null = null;
      try {
        raw = storage ? storage.getItem(KEY) : null;
      } catch {
        raw = null;
      }
      memory = parse(raw) ?? emptyProgress();
      return memory;
    },
    save(p) {
      memory = p;
      try {
        storage?.setItem(KEY, JSON.stringify(p));
      } catch {
        // storage unavailable: keep in memory
      }
    },
  };
}
