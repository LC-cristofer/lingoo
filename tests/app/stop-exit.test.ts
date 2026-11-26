import { describe, expect, it } from "vitest";
import { stopExitHref } from "@/components/trail/exit-target";

describe("stopExitHref from a letras stop", () => {
  const id = "letras-2/lesson-1";
  it("quit goes back up the tree", () => expect(stopExitHref(id, "quit", false, false)).toBe("/arvore"));
  it("a first finish opens the return", () => expect(stopExitHref(id, "done", false, false)).toBe("/?volta=letras-2%2Flesson-1"));
  it("replaying a finished stop goes to the island", () => expect(stopExitHref(id, "done", true, false)).toBe("/"));
  it("review still goes to the review", () => expect(stopExitHref(id, "quit", false, true)).toBe("/revisao"));
  it("the farol's stops still quit to the farol", () => expect(stopExitHref("forest-animals/song", "quit", false, false)).toBe("/farol"));
});
