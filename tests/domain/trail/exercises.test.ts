import { describe, expect, it } from "vitest";
import type { ArtId, Exercise } from "@/domain/trail/schema";
import { matchSelect, repeatTap, whatsMissingCheck, type MatchState } from "@/domain/trail/exercises";

const a = "a" as ArtId, b = "b" as ArtId, c = "c" as ArtId;
const match = { kind: "matchPairs", wordIds: [a, b, c] } as unknown as Extract<Exercise, { kind: "matchPairs" }>;
const empty: MatchState = { selected: null, matched: [] };

describe("matchSelect", () => {
  it("selects then pairs", () => {
    const r1 = matchSelect(match, empty, "art", a);
    expect(r1.outcome).toBe("pending");
    expect(r1.state.selected).toEqual({ side: "art", id: a });
    const r2 = matchSelect(match, r1.state, "word", a);
    expect(r2.outcome).toBe("pair");
    expect(r2.state).toEqual({ selected: null, matched: [a] });
  });
  it("same side replaces selection", () => {
    const r1 = matchSelect(match, empty, "art", a);
    const r2 = matchSelect(match, r1.state, "art", b);
    expect(r2.outcome).toBe("pending");
    expect(r2.state.selected).toEqual({ side: "art", id: b });
  });
  it("mismatch clears selection", () => {
    const r1 = matchSelect(match, empty, "art", a);
    const r2 = matchSelect(match, r1.state, "word", b);
    expect(r2.outcome).toBe("mismatch");
    expect(r2.state).toEqual({ selected: null, matched: [] });
  });
  it("complete on the last pair", () => {
    let s: MatchState = { selected: null, matched: [a, b] };
    s = matchSelect(match, s, "word", c).state;
    const r = matchSelect(match, s, "art", c);
    expect(r.outcome).toBe("complete");
    expect(r.state.matched).toEqual([a, b, c]);
  });
  it("ignores already matched ids by reference", () => {
    const s: MatchState = { selected: null, matched: [a] };
    const r = matchSelect(match, s, "art", a);
    expect(r.state).toBe(s);
    expect(r.outcome).toBe("pending");
  });
});

describe("repeatTap", () => {
  const all = [a, b, c];
  it("completes only when everything is tapped, ignoring repeats", () => {
    let s = { tapped: [] as ArtId[] };
    let r = repeatTap(s, b, all);
    expect(r.complete).toBe(false);
    s = r.state;
    const again = repeatTap(s, b, all);
    expect(again.state).toBe(s);
    expect(again.complete).toBe(false);
    r = repeatTap(s, c, all);
    expect(r.complete).toBe(false);
    r = repeatTap(r.state, a, all);
    expect(r.complete).toBe(true);
    expect(r.state.tapped).toEqual([b, c, a]);
  });
});

describe("whatsMissingCheck", () => {
  it("compares with missingId", () => {
    const ex = { kind: "whatsMissing", missingId: b } as unknown as Extract<Exercise, { kind: "whatsMissing" }>;
    expect(whatsMissingCheck(ex, b)).toBe(true);
    expect(whatsMissingCheck(ex, a)).toBe(false);
  });
});
