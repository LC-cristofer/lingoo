import type { Progress } from "./progress";
import { migrateProgress, type RawProgress } from "./progress-migrate";

export const V1_KEY = "lingoo:progress:v1";
export const V2_KEY = "lingoo:progress:v2";
export const V3_KEY = "lingoo:progress:v3";
/** Where a corrupt v3 value is copied before it is rebuilt; later ones get a timestamp suffix. */
export const BACKUP_KEY = "lingoo:progress:v3:backup";

export type TrailProgressStore = { load(): Progress; save(p: Progress): void };

function read(storage: Storage | null | undefined, key: string): string | null {
  try {
    return storage ? storage.getItem(key) : null;
  } catch {
    return null;
  }
}

function write(storage: Storage | null | undefined, key: string, value: string): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Progress lives under `lingoo:progress:v3`. The first load migrates what earlier builds left
 * (v2 trail progress with its memory cards, v1 phase 1 progress) without ever touching their keys:
 * this store never removes a key and never writes v1 or v2. A corrupt v3 is copied to a backup key
 * before it is rebuilt; if that copy fails, the corrupt value is left alone and progress stays in
 * memory. Never throws: if storage is missing, blocked or full, progress lives in memory only.
 */
export function createTrailProgressStore(storage?: Storage | null): TrailProgressStore {
  let memory: Progress | null = null;
  let writable = true;

  const backup = (value: string): boolean => {
    const key = read(storage, BACKUP_KEY) === null ? BACKUP_KEY : `${BACKUP_KEY}:${Date.now()}`;
    return write(storage, key, value);
  };

  return {
    load() {
      if (memory) return memory;
      const raw: RawProgress = { v3: read(storage, V3_KEY), v2: read(storage, V2_KEY), v1: read(storage, V1_KEY) };
      const { progress, source, corruptV3 } = migrateProgress(raw);
      if (corruptV3 && raw.v3 !== null) writable = backup(raw.v3);
      if (source !== "v3" && writable) write(storage, V3_KEY, JSON.stringify(progress));
      memory = progress;
      return memory;
    },
    save(p) {
      memory = p;
      if (writable) write(storage, V3_KEY, JSON.stringify(p));
    },
  };
}
