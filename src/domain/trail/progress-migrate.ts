import type { MemoryState } from "./memory";
import { emptyProgress, type LegacyV1, type Progress } from "./progress";

/** The raw strings found under each storage key (null when the key is absent or unreadable). */
export type RawProgress = { v3: string | null; v2: string | null; v1: string | null };
export type MigrationSource = "v3" | "v2" | "v1" | "v2+v1" | "empty";
export type Migration = { progress: Progress; source: MigrationSource; corruptV3: boolean };

type TrailFields = Pick<Progress, "completedStops" | "stickers" | "daysPlayed" | "memory">;

function json(raw: string | null): unknown {
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStringRecord(v: unknown): v is Record<string, string> {
  return isObject(v) && Object.values(v).every((x) => typeof x === "string");
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Valid memory cards only; anything that is not a record of cards gives {} (it never invalidates the rest). */
export function parseMemory(v: unknown): MemoryState {
  if (!isObject(v)) return {};
  const out: MemoryState = {};
  for (const [id, card] of Object.entries(v)) {
    if (!isObject(card)) continue;
    const { box, due } = card;
    if (typeof box !== "number" || !Number.isInteger(box) || box < 0 || box > 5) continue;
    if (typeof due !== "string" || !DATE.test(due)) continue;
    out[id] = { box, due };
  }
  return out;
}

/** The trail fields shared by v2 and v3. A v2 saved before the memory training has no `memory`: it loads as {}. */
function trailFields(data: unknown): TrailFields | null {
  if (!isObject(data)) return null;
  const { completedStops, stickers, daysPlayed, memory } = data;
  if (!isStringRecord(completedStops) || !isStringRecord(stickers) || !isStringArray(daysPlayed)) return null;
  return { completedStops, stickers, daysPlayed, memory: parseMemory(memory) };
}

function legacyV1(data: unknown): LegacyV1 | null {
  if (!isObject(data)) return null;
  const { completedLessons, stickers } = data;
  if (!isStringRecord(completedLessons) || !isStringRecord(stickers)) return null;
  return { completedLessons, stickers };
}

function parseV3(raw: string | null): Progress | null {
  const data = json(raw);
  if (!isObject(data) || data.version !== 3) return null;
  const fields = trailFields(data);
  if (!fields) return null;
  const legacy = data.legacy === null || data.legacy === undefined ? null : legacyV1(data.legacy);
  if (data.legacy !== null && data.legacy !== undefined && legacy === null) return null;
  return { version: 3, ...fields, legacy };
}

/**
 * Builds the v3 progress from whatever an earlier build left. A valid v3 wins as it is; otherwise
 * the v2 trail fields (memory cards included) are kept and the phase 1 (v1) data is carried as
 * `legacy`, which grants no trail stop. Never throws, whatever the strings hold. It only reads:
 * writing is the store's job.
 */
export function migrateProgress(raw: RawProgress): Migration {
  const v3 = parseV3(raw.v3);
  const corruptV3 = raw.v3 !== null && v3 === null;
  if (v3) return { progress: v3, source: "v3", corruptV3 };

  const v2 = trailFields(json(raw.v2));
  const v1 = legacyV1(json(raw.v1));
  const source: MigrationSource = v2 && v1 ? "v2+v1" : v2 ? "v2" : v1 ? "v1" : "empty";
  return { progress: { ...emptyProgress(), ...(v2 ?? {}), legacy: v1 }, source, corruptV3 };
}
