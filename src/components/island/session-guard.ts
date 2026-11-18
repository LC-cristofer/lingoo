/** The session's small marks (when it started, which evening's bedtime has played). */
export const SESSION_KEY = "lingoo:session:start";

/** Backs the storage when it is blocked (private modes): the marks still hold for this page's life. */
const memoryGuard = new Map<string, string>();

function session(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readSession(key: string): string | null {
  try {
    return session()?.getItem(key) ?? memoryGuard.get(key) ?? null;
  } catch {
    return memoryGuard.get(key) ?? null;
  }
}

export function writeSession(key: string, value: string): void {
  try {
    const store = session();
    if (!store) throw new Error("no session storage");
    store.setItem(key, value);
    memoryGuard.delete(key);
  } catch {
    memoryGuard.set(key, value); // blocked storage: the in-memory copy keeps the mark
  }
}

/** Tests only: forget the in-memory marks. */
export function clearSessionMemory(): void {
  memoryGuard.clear();
}
