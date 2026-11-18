import { describe, expect, it } from "vitest";
import { stopExitHref } from "@/components/trail/exit-target";

describe("stopExitHref", () => {
  const id = "forest-animals/song";
  it("a first finish opens the return", () => {
    expect(stopExitHref(id, "done", false, false)).toBe("/?volta=forest-animals%2Fsong");
  });
  it("replaying a stop already done goes to the island without replaying the reward", () => {
    expect(stopExitHref(id, "done", true, false)).toBe("/");
  });
  it("quitting goes back to the farol; review goes back to the review", () => {
    expect(stopExitHref(id, "quit", false, false)).toBe("/farol");
    expect(stopExitHref(id, "done", false, true)).toBe("/revisao");
  });
});
