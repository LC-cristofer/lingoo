import { emptyProgress, type Progress, type ProgressStore } from "./progress";

const KEY = "lingoo:progress:v1";

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
    const { completedLessons, stickers } = data as Record<string, unknown>;
    if (!isRecord(completedLessons) || !isRecord(stickers)) return null;
    return { completedLessons, stickers };
  } catch {
    return null;
  }
}

/** Never throws: if storage is missing, blocked or corrupted, progress lives in memory only. */
export function createLocalProgressStore(storage?: Storage | null): ProgressStore {
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
