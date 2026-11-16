import type { MemoryState } from "./memory";
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

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Valid cards only; anything that is not a record of cards gives {}. */
function parseMemory(v: unknown): MemoryState {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return {};
  const out: MemoryState = {};
  for (const [id, card] of Object.entries(v)) {
    if (typeof card !== "object" || card === null) continue;
    const { box, due } = card as Record<string, unknown>;
    if (typeof box !== "number" || !Number.isInteger(box) || box < 0 || box > 5) continue;
    if (typeof due !== "string" || !DATE.test(due)) continue;
    out[id] = { box, due };
  }
  return out;
}

function parse(raw: string | null): Progress | null {
  if (raw === null) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const { completedStops, stickers, daysPlayed, memory } = data as Record<string, unknown>;
    if (!isRecord(completedStops) || !isRecord(stickers)) return null;
    if (!Array.isArray(daysPlayed) || !daysPlayed.every((d) => typeof d === "string")) return null;
    return { completedStops, stickers, daysPlayed: daysPlayed as string[], memory: parseMemory(memory) };
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
