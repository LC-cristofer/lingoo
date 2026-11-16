import { emptyProgress, type LegacyV1, type Progress } from "./progress";

/** The raw strings found under each storage key (null when the key is absent or unreadable). */
export type RawProgress = { v3: string | null; v2: string | null; v1: string | null };
export type MigrationSource = "v3" | "v2" | "v1" | "v2+v1" | "empty";
export type Migration = { progress: Progress; source: MigrationSource; corruptV3: boolean };

type TrailFields = Pick<Progress, "completedStops" | "stickers" | "daysPlayed">;

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

function trailFields(data: unknown): TrailFields | null {
  if (!isObject(data)) return null;
  const { completedStops, stickers, daysPlayed } = data;
  if (!isStringRecord(completedStops) || !isStringRecord(stickers) || !isStringArray(daysPlayed)) return null;
  return { completedStops, stickers, daysPlayed };
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
  if (data.legacy !== null && legacyV1(data.legacy) === null) return null;
  return { version: 3, ...fields, legacy: data.legacy === null ? null : legacyV1(data.legacy) };
}

/**
 * Builds the v3 progress from whatever an earlier build left. A valid v3 wins as it is; otherwise
 * the v2 trail fields are kept and the phase 1 (v1) data is carried as `legacy` (it grants no v2
 * stop). Never throws, whatever the strings hold. It only reads: writing is the store's job.
 */
export function migrateProgress(raw: RawProgress): Migration {
  const v3 = parseV3(raw.v3);
  const corruptV3 = raw.v3 !== null && v3 === null;
  if (v3) return { progress: v3, source: "v3", corruptV3 };

  const v2 = trailFields(json(raw.v2));
  const v1 = legacyV1(json(raw.v1));
  const source: MigrationSource = v2 && v1 ? "v2+v1" : v2 ? "v2" : v1 ? "v1" : "empty";
  const base = emptyProgress();
  return { progress: { ...base, ...(v2 ?? {}), legacy: v1 }, source, corruptV3 };
}
