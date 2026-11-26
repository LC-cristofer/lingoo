import { dateKey } from "./progress";
import type { ArtId } from "./schema";

/** `${unitId}:${wordId}`: one card per word. */
export type CardId = string;
/** box 0..5; due = local "YYYY-MM-DD". */
export type CardState = { box: number; due: string };
export type MemoryState = Record<CardId, CardState>;

/** Index = the box a card reaches after a first-try correct answer. */
export const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;
export const MAX_BOX = 5;
export const ROUND_LIMIT = 8;
const OLD_WITH_NEW = 3;
const OLD_WITHOUT_NEW = 6;
const LOWEST_BOXES = 3;

export function cardId(unitId: string, wordId: ArtId): CardId {
  return `${unitId}:${wordId}`;
}

/** The word of a card id (the part after the first colon). */
export function wordOfCard(id: CardId): string {
  return id.slice(id.indexOf(":") + 1);
}

/** The unit of a card id (the part before the first colon). */
export function unitOfCard(id: CardId): string {
  return id.slice(0, id.indexOf(":"));
}

function addDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dateKey(new Date(y, m - 1, d + days));
}

/** New cards enter at box 0, due today. Existing ones are untouched; the same object if nothing is new. */
export function addCards(m: MemoryState, ids: CardId[], today: string): MemoryState {
  const fresh = ids.filter((id) => !Object.hasOwn(m, id));
  if (fresh.length === 0) return m;
  const next: MemoryState = { ...m };
  for (const id of fresh) next[id] = { box: 0, due: today };
  return next;
}

/** Cards due today or earlier, lowest box first, then oldest due, then insertion order. */
export function dueCards(m: MemoryState, today: string, limit?: number): CardId[] {
  const due = Object.keys(m)
    .map((id, order) => ({ id, order, ...m[id] }))
    .filter((c) => c.due <= today)
    .sort((x, y) => x.box - y.box || (x.due < y.due ? -1 : x.due > y.due ? 1 : 0) || x.order - y.order)
    .map((c) => c.id);
  return limit === undefined ? due : due.slice(0, limit);
}

/** First try: one box up (at most 5) and back after INTERVAL_DAYS[box]. Otherwise box 1, back tomorrow. */
export function grade(m: MemoryState, id: CardId, firstTry: boolean, today: string): MemoryState {
  const current = Object.hasOwn(m, id) ? m[id] : { box: 0, due: today };
  const box = firstTry ? Math.min(current.box + 1, MAX_BOX) : 1;
  const next: CardState = { box, due: addDays(today, INTERVAL_DAYS[box]) };
  if (Object.hasOwn(m, id) && current.box === next.box && current.due === next.due) return m;
  return { ...m, [id]: next };
}

/** The earliest due date after today, or null. */
export function nextDue(m: MemoryState, today: string): string | null {
  let best: string | null = null;
  for (const c of Object.values(m)) if (c.due > today && (best === null || c.due < best)) best = c.due;
  return best;
}

/** Whole days from `from` to `to` (both "YYYY-MM-DD"), DST-safe. */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/**
 * The cards of a lesson's round: the new ones plus up to 3 due older ones; with no new cards up to 6 due;
 * with none due, the 3 lowest-box cards. With `unitId`, only that unit's cards count. Never more than ROUND_LIMIT.
 */
export function lessonRound(m: MemoryState, newIds: CardId[], today: string, unitId?: string): CardId[] {
  // Only the lesson's own unit is reviewed: the round screen can show no other unit's cards.
  if (unitId !== undefined) {
    m = Object.fromEntries(Object.entries(m).filter(([id]) => unitOfCard(id) === unitId));
    newIds = newIds.filter((id) => unitOfCard(id) === unitId);
  }
  const fresh = [...new Set(newIds)];
  if (fresh.length > 0) {
    const old = dueCards(m, today).filter((id) => !fresh.includes(id)).slice(0, OLD_WITH_NEW);
    return [...fresh, ...old].slice(0, ROUND_LIMIT);
  }
  const due = dueCards(m, today, OLD_WITHOUT_NEW);
  if (due.length > 0) return due;
  return Object.keys(m)
    .map((id, order) => ({ id, order, ...m[id] }))
    .sort((x, y) => x.box - y.box || (x.due < y.due ? -1 : x.due > y.due ? 1 : 0) || x.order - y.order)
    .slice(0, LOWEST_BOXES)
    .map((c) => c.id);
}

/** Today's local date key (the clock of the device). */
export function todayKey(now: Date = new Date()): string {
  return dateKey(now);
}

function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Wrong options for a card's check: from the other cards the child knows, and from the unit's words when
 * those are too few. The choice depends only on the inputs (never random), so a card looks the same each time.
 */
export function pickDistractors(answer: ArtId, known: ArtId[], unitWords: ArtId[], count = 2): ArtId[] {
  const pool = [...new Set(known)].filter((id) => id !== answer);
  if (pool.length <= count) {
    const extras = unitWords.filter((id) => id !== answer && !pool.includes(id));
    return [...pool, ...extras.slice(0, count - pool.length)];
  }
  const start = hash(answer) % pool.length;
  return Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length]);
}
