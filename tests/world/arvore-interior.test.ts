import { describe, expect, it } from "vitest";
import { PAL } from "@/world/palette";
import { ARVORE_DOOR, ARVORE_LANDINGS, buildArvoreInterior } from "@/world/arvore-interior";

describe("buildArvoreInterior", () => {
  const svg = buildArvoreInterior();
  it("is deterministic", () => expect(buildArvoreInterior()).toBe(svg));
  it("has 24 platforms with their parts, 6 on each of the 4 branches", () => {
    expect(svg.match(/class="stop" data-i="\d+"/g)).toHaveLength(24);
    for (const c of ["stop-halo", "stop-face", "stop-icon", "stop-done", "stop-bud"]) {
      expect(svg.match(new RegExp(`class="${c}"`, "g"))).toHaveLength(24);
    }
    expect(svg.match(/class="branch" data-branch="[1-4]"/g)).toHaveLength(4);
  });
  it("has the nest and slot ids", () => {
    for (const id of ["slotInterior", "bigLamp", "bigLampGlow"]) expect(svg).toContain(`id="${id}"`);
  });
  it("uses gradient ids prefixed ai- only, never the island's or the farol's", () => {
    expect(svg).not.toContain("url(#glowGrad)");
    expect(svg).not.toContain("fi-");
    const ids = [...svg.matchAll(/<(?:linear|radial)Gradient id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(id.startsWith("ai-")).toBe(true);
  });
  it("uses only the bible's colours", () => {
    const allowed = new Set(Object.values(PAL).filter((v) => v.startsWith("#")).map((v) => v.toLowerCase()));
    const used = new Set([...svg.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toLowerCase()));
    expect(used.size).toBeGreaterThan(8);
    for (const c of used) expect(allowed.has(c), c).toBe(true);
    expect(used.has("#ff9f43")).toBe(false);
  });
  it("exposes 24 landings spiralling up, 6 per branch, and the door", () => {
    expect(ARVORE_LANDINGS).toHaveLength(24);
    ARVORE_LANDINGS.forEach((L, i) => {
      expect(L.unit).toBe(Math.floor(i / 6) + 1);
      expect(L.stop).toBe(i % 6);
      if (i > 0) expect(L.y).toBeLessThan(ARVORE_LANDINGS[i - 1].y);
    });
    expect(new Set(ARVORE_LANDINGS.map((L) => L.x > 500)).size).toBe(2);
    expect(ARVORE_DOOR.x).toBe(500);
    expect(ARVORE_DOOR.y).toBeGreaterThan(ARVORE_LANDINGS[0].y);
  });
});
