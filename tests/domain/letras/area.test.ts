import { describe, expect, it } from "vitest";
import { areaOfStop, branchOfUnit, isLetrasUnit } from "@/domain/letras/area";

describe("area of a unit or stop", () => {
  it("knows the four branches and nothing else", () => {
    expect([1, 2, 3, 4].every((n) => isLetrasUnit(`letras-${n}`))).toBe(true);
    for (const id of ["letras-0", "letras-5", "letras-10", "letras-", "forest-animals", "xletras-1"]) expect(isLetrasUnit(id)).toBe(false);
    expect(branchOfUnit("letras-3")).toBe(3);
    expect(branchOfUnit("forest-animals")).toBeNull();
  });
  it("areaOfStop", () => {
    expect(areaOfStop("letras-3/story")).toBe("letras");
    expect(areaOfStop("forest-animals/song")).toBe("farol");
  });
});
