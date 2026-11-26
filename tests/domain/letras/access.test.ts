import { describe, expect, it } from "vitest";
import { suggestedStop, unitOpen } from "@/domain/letras/access";
import { defaultProfile, type Profile } from "@/domain/nestoy/profile";
import { emptyProgress, type Progress } from "@/domain/trail/progress";

const profile = (english: Profile["english"], age: Profile["age"] = 5): Profile => ({ ...defaultProfile(), english, age, onboarding: "done" });
const done = (...ids: string[]): Progress => ({ ...emptyProgress(), completedStops: Object.fromEntries(ids.map((i) => [i, "2026-01-01T00:00:00.000Z"])) });
const open = (p: Progress, pr: Profile) => ([1, 2, 3, 4] as const).map((n) => unitOpen(p, pr, n));
const ALL = ["song", "lesson-1", "lesson-2", "lesson-3", "story", "challenge"];

describe("unitOpen", () => {
  it("start 1: only branch 1 until its challenge is done", () => {
    expect(open(emptyProgress(), profile("none"))).toEqual([true, false, false, false]);
    expect(open(done("letras-1/song", "letras-1/story"), profile("none"))).toEqual([true, false, false, false]);
  });
  it("start 1: the challenge of a branch opens the next one, and only the next", () => {
    expect(open(done("letras-1/challenge"), profile("none"))).toEqual([true, true, false, false]);
    expect(open(done(...ALL.map((s) => `letras-1/${s}`), "letras-2/challenge"), profile("none"))).toEqual([true, true, true, false]);
  });
  it("start 3: branches 1 to 3 are open, 4 waits for the challenge of 3", () => {
    expect(open(emptyProgress(), profile("alphabet"))).toEqual([true, true, true, false]);
    expect(open(done("letras-3/challenge"), profile("alphabet"))).toEqual([true, true, true, true]);
  });
  it("start 4 (reads, 7+): everything is open", () => {
    expect(open(emptyProgress(), profile("reads", 8))).toEqual([true, true, true, true]);
  });
  it("a unit with a finished stop stays open when the profile later suggests an earlier start", () => {
    const p = done("letras-3/song");
    expect(open(p, profile("alphabet"))).toEqual([true, true, true, false]);
    expect(open(p, profile("none"))).toEqual([true, false, true, false]);
  });
  it("a missing profile answer starts at branch 1", () => {
    expect(open(emptyProgress(), defaultProfile())).toEqual([true, false, false, false]);
  });
});

describe("suggestedStop", () => {
  it("starts at the first stop of the start branch", () => {
    expect(suggestedStop(emptyProgress(), profile("none"))).toEqual({ unit: 1, stop: 0 });
    expect(suggestedStop(emptyProgress(), profile("alphabet"))).toEqual({ unit: 3, stop: 0 });
  });
  it("goes on in the branch, in sequence", () => {
    expect(suggestedStop(done("letras-3/song", "letras-3/lesson-1"), profile("alphabet"))).toEqual({ unit: 3, stop: 2 });
  });
  it("moves to the next branch when the start branch is finished", () => {
    const p = done(...ALL.map((s) => `letras-3/${s}`));
    expect(suggestedStop(p, profile("alphabet"))).toEqual({ unit: 4, stop: 0 });
  });
  it("comes back to an earlier open branch when the later ones are finished", () => {
    const p = done(...ALL.map((s) => `letras-3/${s}`), ...ALL.map((s) => `letras-4/${s}`));
    expect(suggestedStop(p, profile("alphabet"))).toEqual({ unit: 1, stop: 0 });
  });
  it("is null when the whole tree is done", () => {
    const p = done(...[1, 2, 3, 4].flatMap((n) => ALL.map((s) => `letras-${n}/${s}`)));
    expect(suggestedStop(p, profile("none"))).toBeNull();
  });
});
