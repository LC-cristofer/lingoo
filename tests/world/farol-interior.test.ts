import { describe, expect, it } from "vitest";
import { FAROL_INTERIOR_DOOR, FAROL_LANDINGS, buildFarolInterior } from "@/world/farol-interior";

describe("buildFarolInterior", () => {
  const svg = buildFarolInterior();
  it("is deterministic", () => expect(buildFarolInterior()).toBe(svg));
  it("has 6 stops with their parts", () => {
    expect(svg.match(/class="stop" data-i="\d"/g)).toHaveLength(6);
    for (const c of ["stop-halo", "stop-face", "stop-icon", "stop-done"]) {
      expect(svg.match(new RegExp(`class="${c}"`, "g"))).toHaveLength(6);
    }
  });
  it("has the lamp and slot ids", () => {
    for (const id of ["slotInterior", "bigLamp", "bigLampGlow"]) expect(svg).toContain(`id="${id}"`);
  });
  it("never reuses the island's gradient ids", () => {
    expect(svg).not.toContain('id="glowGrad"');
    expect(svg).not.toContain("url(#glowGrad)");
    expect(svg).toContain('id="fi-glow"');
    for (const m of svg.matchAll(/<(?:linear|radial)Gradient id="([^"]+)"/g)) expect(m[1].startsWith("fi-")).toBe(true);
  });
  it("exposes landings and door", () => {
    expect(FAROL_LANDINGS).toHaveLength(6);
    expect(FAROL_LANDINGS[0]).toEqual({ x: 330, y: 2170 });
    expect(FAROL_INTERIOR_DOOR).toEqual({ x: 500, y: 2390 });
  });
});
