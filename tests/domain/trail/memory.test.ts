import { describe, expect, it } from "vitest";
import {
  addCards,
  cardId,
  dueCards,
  grade,
  INTERVAL_DAYS,
  lessonRound,
  nextDue,
  pickDistractors,
  ROUND_LIMIT,
  type MemoryState,
} from "@/domain/trail/memory";

const T = "2026-11-12";
const a = "u:a";
const b = "u:b";
const c = "u:c";
const d = "u:d";

describe("memory schedule", () => {
  it("has the plan's constants", () => {
    expect([...INTERVAL_DAYS]).toEqual([0, 1, 3, 7, 14, 30]);
    expect(ROUND_LIMIT).toBe(8);
    expect(cardId("forest-animals", "bear")).toBe("forest-animals:bear");
  });

  it("a new card enters at box 0, due today; existing cards are untouched", () => {
    const m = addCards({}, [a], T);
    expect(m).toEqual({ [a]: { box: 0, due: T } });
    const graded = grade(m, a, true, T);
    const again = addCards(graded, [a, b], "2026-12-01");
    expect(again[a]).toEqual(graded[a]);
    expect(again[b]).toEqual({ box: 0, due: "2026-12-01" });
  });

  it("addCards returns the same reference when nothing is new", () => {
    const m = addCards({}, [a], T);
    expect(addCards(m, [a], T)).toBe(m);
    expect(addCards(m, [], T)).toBe(m);
  });

  it("first-try answers walk the boxes 1..5 with +1, +3, +7, +14, +30 days and stay at 5", () => {
    let m: MemoryState = addCards({}, [a], T);
    const expected: [number, string][] = [
      [1, "2026-11-13"],
      [2, "2026-11-15"],
      [3, "2026-11-19"],
      [4, "2026-11-26"],
      [5, "2026-12-12"],
      [5, "2026-12-12"],
    ];
    for (const [box, due] of expected) {
      m = grade(m, a, true, T);
      expect(m[a]).toEqual({ box, due });
    }
  });

  it("a card that needed help goes to box 1 and is due tomorrow, from any box", () => {
    for (const box of [0, 1, 3, 5]) {
      const m = grade({ [a]: { box, due: T } }, a, false, T);
      expect(m[a]).toEqual({ box: 1, due: "2026-11-13" });
    }
  });

  it("month and year rollovers give valid date keys", () => {
    const m = grade({ [a]: { box: 4, due: "2026-12-31" } }, a, true, "2026-12-31");
    expect(m[a].due).toBe("2027-01-30");
    expect(grade({ [a]: { box: 0, due: "2026-12-31" } }, a, true, "2026-12-31")[a].due).toBe("2027-01-01");
    expect(grade({ [a]: { box: 0, due: "2028-02-28" } }, a, false, "2028-02-28")[a].due).toBe("2028-02-29");
    expect(grade({ [a]: { box: 0, due: "2026-02-28" } }, a, false, "2026-02-28")[a].due).toBe("2026-03-01");
  });

  it("grade returns the same reference on a no-op", () => {
    const m: MemoryState = { [a]: { box: 1, due: "2026-11-13" } };
    expect(grade(m, a, false, T)).toBe(m);
  });

  it("grade of an unknown card starts it from box 0", () => {
    expect(grade({}, a, true, T)[a]).toEqual({ box: 1, due: "2026-11-13" });
  });
});

describe("dueCards", () => {
  const m: MemoryState = {
    [a]: { box: 3, due: "2026-11-10" },
    [b]: { box: 0, due: "2026-11-12" },
    [c]: { box: 1, due: "2026-11-13" },
    [d]: { box: 0, due: "2026-11-01" },
  };
  it("returns only cards due today or earlier, lowest box first, then oldest due", () => {
    expect(dueCards(m, T)).toEqual([d, b, a]);
  });
  it("respects the limit", () => {
    expect(dueCards(m, T, 2)).toEqual([d, b]);
  });
  it("an overdue card is still due and nothing resets", () => {
    expect(dueCards({ [a]: { box: 4, due: "2020-01-01" } }, T)).toEqual([a]);
  });
  it("a card with a due date after a moved-back clock is simply not due", () => {
    expect(dueCards({ [a]: { box: 2, due: "2026-11-20" } }, "2026-11-12")).toEqual([]);
  });
  it("is stable for ties (insertion order)", () => {
    const ties: MemoryState = { [c]: { box: 1, due: T }, [a]: { box: 1, due: T }, [b]: { box: 1, due: T } };
    expect(dueCards(ties, T)).toEqual([c, a, b]);
  });
  it("is empty for an empty memory", () => {
    expect(dueCards({}, T)).toEqual([]);
  });
});

describe("nextDue", () => {
  it("is the earliest due date after today, or null", () => {
    const m: MemoryState = { [a]: { box: 1, due: "2026-11-20" }, [b]: { box: 1, due: "2026-11-14" }, [c]: { box: 0, due: T } };
    expect(nextDue(m, T)).toBe("2026-11-14");
    expect(nextDue({ [c]: { box: 0, due: T } }, T)).toBeNull();
    expect(nextDue({}, T)).toBeNull();
  });
});

describe("lessonRound", () => {
  const old = (n: number): MemoryState =>
    Object.fromEntries(Array.from({ length: n }, (_, i) => [`o:${i}`, { box: i % 3, due: "2026-11-01" }]));

  it("new cards plus up to 3 due older ones", () => {
    const m = addCards(old(5), ["n:1", "n:2", "n:3"], T);
    const round = lessonRound(m, ["n:1", "n:2", "n:3"], T);
    expect(round.slice(0, 3)).toEqual(["n:1", "n:2", "n:3"]);
    expect(round).toHaveLength(6);
    expect(round.slice(3).every((id) => id.startsWith("o:"))).toBe(true);
  });

  it("never more than the round limit", () => {
    const ids = ["n:1", "n:2", "n:3", "n:4", "n:5", "n:6", "n:7"];
    const m = addCards(old(5), ids, T);
    expect(lessonRound(m, ids, T)).toHaveLength(ROUND_LIMIT);
  });

  it("with no new cards: up to 6 due", () => {
    expect(lessonRound(old(9), [], T)).toHaveLength(6);
    expect(lessonRound(old(2), [], T)).toHaveLength(2);
  });

  it("scoped to a unit: due cards and lowest-box cards of other units are left out", () => {
    const other: MemoryState = {
      "letras-1:a": { box: 0, due: "2026-11-01" },
      "letras-1:b": { box: 0, due: "2026-11-01" },
      "letras-1:c": { box: 1, due: "2026-12-30" },
    };
    expect(lessonRound(other, [], T, "forest-animals")).toEqual([]);
    expect(lessonRound(other, [], T, "letras-1")).toEqual(["letras-1:a", "letras-1:b"]);
    const mixed: MemoryState = { ...other, "forest-animals:bear": { box: 2, due: "2026-11-01" } };
    expect(lessonRound(mixed, [], T, "forest-animals")).toEqual(["forest-animals:bear"]);
    const withNew = addCards(mixed, ["forest-animals:fox"], T);
    expect(lessonRound(withNew, ["forest-animals:fox"], T, "forest-animals")).toEqual(["forest-animals:fox", "forest-animals:bear"]);
  });

  it("with none due: the 3 lowest-box cards", () => {
    const m: MemoryState = {
      [a]: { box: 4, due: "2026-12-20" },
      [b]: { box: 1, due: "2026-11-20" },
      [c]: { box: 2, due: "2026-11-21" },
      [d]: { box: 1, due: "2026-11-19" },
    };
    expect(lessonRound(m, [], T)).toEqual([d, b, c]);
  });

  it("an empty memory gives an empty round", () => {
    expect(lessonRound({}, [], T)).toEqual([]);
  });

  it("does not list a new card twice when it is also due", () => {
    const m = addCards({}, [a, b], T);
    expect(lessonRound(m, [a, b], T)).toEqual([a, b]);
  });
});

describe("check options", () => {
  const unitWords = ["bear", "bird", "frog", "snake", "spider", "mouse"] as const;
  it("two distractors from the other cards the child knows, never the answer, deterministic", () => {
    const known = ["bear", "bird", "frog", "snake"] as const;
    const first = pickDistractors("bear", [...known], [...unitWords]);
    expect(first).toHaveLength(2);
    expect(first).not.toContain("bear");
    first.forEach((id) => expect(known).toContain(id));
    expect(pickDistractors("bear", [...known], [...unitWords])).toEqual(first);
  });
  it("falls back to the unit's words when the child knows too few cards", () => {
    const out = pickDistractors("bear", ["bear", "bird"], [...unitWords]);
    expect(out).toHaveLength(2);
    expect(out).toContain("bird");
    expect(out).not.toContain("bear");
    expect(new Set(out).size).toBe(2);
  });
  it("gives fewer options when the unit has fewer words", () => {
    expect(pickDistractors("bear", [], ["bear", "bird"])).toEqual(["bird"]);
  });
});
