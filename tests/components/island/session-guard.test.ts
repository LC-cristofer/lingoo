import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSessionMemory, readSession, writeSession } from "@/components/island/session-guard";

beforeEach(() => {
  sessionStorage.clear();
  clearSessionMemory();
});
afterEach(() => vi.restoreAllMocks());

describe("session guard", () => {
  it("reads back what it wrote, in sessionStorage", () => {
    expect(readSession("k")).toBeNull();
    writeSession("k", "1");
    expect(sessionStorage.getItem("k")).toBe("1");
    expect(readSession("k")).toBe("1");
  });

  it("with sessionStorage blocked the marks still hold for the page's life", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readSession("lingoo:bedtime:2026-11-18")).toBeNull();
    expect(() => writeSession("lingoo:bedtime:2026-11-18", "1")).not.toThrow();
    expect(readSession("lingoo:bedtime:2026-11-18")).toBe("1");
  });

  it("with a full storage (set throws, get works) the mark is still kept", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    writeSession("k", "1");
    expect(readSession("k")).toBe("1");
  });

  it("a cleared storage is not contradicted by an old in-memory copy once storage works again", () => {
    writeSession("k", "1");
    sessionStorage.clear();
    expect(readSession("k")).toBeNull();
  });
});
