import { describe, expect, it } from "vitest";
import { getBank } from "@/domain/letras/bank";
import { buildLetrasUnits } from "@/domain/letras/build";
import { CLOSE_LETTERS } from "@/domain/letras/templates";
import { allNarrations, getPath, getUnit } from "@/domain/trail/content";
import { parseUnit, type Exercise, type Narration, type StopExercise, type Unit } from "@/domain/trail/schema";
import letras1 from "../../../content/units/letras-1.json";
import letras2 from "../../../content/units/letras-2.json";
import letras3 from "../../../content/units/letras-3.json";
import letras4 from "../../../content/units/letras-4.json";

const units = buildLetrasUnits(getBank());

function stopExercises(unit: Unit): StopExercise[] {
  return unit.stops.flatMap((s) => (s.kind === "lesson" || s.kind === "challenge" ? s.exercises : []));
}

function optionsOf(ex: Exercise): string[] {
  if (ex.kind === "listenTap" || ex.kind === "whatsMissing") return ex.optionIds;
  return [];
}
function answerOf(ex: Exercise): string | undefined {
  if (ex.kind === "listenTap") return ex.answerId;
  if (ex.kind === "whatsMissing") return ex.missingId;
  return undefined;
}

function unitNarrations(unit: Unit): Narration[] {
  const ex = (e: StopExercise): Narration[] => {
    if (e.kind === "adaptive") return e.levels.flatMap(ex);
    if (e.kind === "intro" || e.kind === "trueFalse") return [e.say];
    if (e.kind === "tapRepeat") return [e.prompt, ...e.items.map((i) => i.say)];
    return [e.prompt];
  };
  const out: Narration[] = [unit.banner, ...unit.words.flatMap((w) => [w.say, w.ask])];
  for (const s of unit.stops) {
    out.push(s.opening, s.closing);
    if (s.kind === "song") out.push(...s.lyrics.map((l) => l.say), ...s.exercises.flatMap(ex));
    else if (s.kind === "story") out.push(...ex(s.warmup), ...ex(s.question), ...s.pages.map((p) => p.say));
    else out.push(...s.exercises.flatMap(ex), ...(s.sticker ? [s.sticker.name] : []));
  }
  return out;
}

describe("buildLetrasUnits", () => {
  it("builds 4 valid units with the usual stops and a sticker on each challenge", () => {
    expect(units.map((u) => u.id)).toEqual(["letras-1", "letras-2", "letras-3", "letras-4"]);
    for (const u of units) {
      expect(() => parseUnit(u)).not.toThrow();
      expect(u.stops.map((s) => s.kind)).toEqual(["song", "lesson", "lesson", "lesson", "story", "challenge"]);
      expect(u.stops.map((s) => s.id)).toEqual(["song", "lesson-1", "lesson-2", "lesson-3", "story", "challenge"].map((x) => `${u.id}/${x}`));
      const challenge = u.stops[5];
      expect(challenge.kind === "challenge" && challenge.sticker).toBeTruthy();
    }
  });

  it("is deterministic", () => {
    expect(JSON.stringify(buildLetrasUnits(getBank()))).toBe(JSON.stringify(units));
  });

  it("the committed unit files are the builder's output (run npm run content:letras)", () => {
    expect([letras1, letras2, letras3, letras4]).toEqual(JSON.parse(JSON.stringify(units)));
  });

  it("in the sounds lessons the hidden letter is never asked elsewhere and the asked letters are distinct", () => {
    for (const s of units[2].stops) {
      if (s.kind !== "lesson") continue;
      const asked: string[] = [];
      let hidden = "";
      for (const e of s.exercises) {
        if (e.kind === "trueFalse") asked.push(e.wordId);
        if (e.kind !== "adaptive") continue;
        const first = e.levels[0];
        if (first.kind === "listenTap") asked.push(first.answerId);
        if (first.kind === "whatsMissing") hidden = first.missingId;
      }
      expect(hidden, s.id).not.toBe("");
      expect(asked, s.id).not.toContain(hidden);
      expect(asked, s.id).not.toContain(`letter-${hidden}`);
      const mains = asked.filter((id) => id.startsWith("letter-"));
      expect(new Set(mains).size, s.id).toBe(mains.length);
    }
  });

  it('every "Começa com X?" question is true exactly when the word starts with X', () => {
    let seen = 0;
    for (const u of units) {
      for (const s of u.stops) {
        if (s.kind !== "lesson" && s.kind !== "challenge") continue;
        for (const e of s.exercises) {
          if (e.kind !== "trueFalse" || e.say[1]?.text !== "Começa com") continue;
          const word = e.say[0].text.replace(/[^a-z]/gi, "").toLowerCase();
          const letter = e.say[2].text.replace(/[^a-z]/gi, "").toLowerCase();
          expect(word.startsWith(letter), `${s.id}: ${word} / ${letter}`).toBe(e.isTrue);
          seen++;
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("lessons and challenges have 8 to 12 exercises", () => {
    for (const u of units) {
      for (const s of u.stops) {
        if (s.kind !== "lesson" && s.kind !== "challenge") continue;
        expect(s.exercises.length, s.id).toBeGreaterThanOrEqual(8);
        expect(s.exercises.length, s.id).toBeLessThanOrEqual(12);
      }
    }
  });

  it("every adaptive slot has 2, 3 and 4 options at levels 1, 2 and 3, with the answer among them", () => {
    let slots = 0;
    for (const u of units) {
      for (const ex of stopExercises(u)) {
        if (ex.kind !== "adaptive") continue;
        slots++;
        const kinds = new Set(ex.levels.map((l) => l.kind));
        expect(kinds.size).toBe(1);
        ex.levels.forEach((level, i) => {
          const options = optionsOf(level);
          expect(options).toHaveLength(i + 2);
          expect(new Set(options).size).toBe(options.length);
          expect(options).toContain(answerOf(level));
          expect(answerOf(level)).toBe(answerOf(ex.levels[0]));
        });
      }
    }
    expect(slots).toBeGreaterThan(40);
  });

  it("level 3 brings the look-alike letters (B/D, M/N, P/Q) that level 1 leaves out", () => {
    let checked = 0;
    for (const u of units) {
      for (const ex of stopExercises(u)) {
        if (ex.kind !== "adaptive" || ex.levels[0].kind !== "listenTap") continue;
        const answer = answerOf(ex.levels[0])!;
        if (!answer.startsWith("letter-")) continue;
        const close = CLOSE_LETTERS[answer.slice(7)].map((c) => `letter-${c}`);
        const pool = new Set(stopExercises(u).flatMap((e) => (e.kind === "adaptive" ? e.levels.flatMap(optionsOf) : optionsOf(e))));
        if (!close.some((c) => pool.has(c))) continue;
        expect(optionsOf(ex.levels[0]).some((o) => close.includes(o)), answer).toBe(false);
        expect(optionsOf(ex.levels[2]).some((o) => close.includes(o)), answer).toBe(true);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(10);
  });

  it("songs and stories ask at level 1 only (never adaptive)", () => {
    for (const u of units) {
      for (const s of u.stops) {
        if (s.kind === "song") for (const e of s.exercises) expect(e.kind).not.toBe("adaptive");
        if (s.kind === "story") {
          expect([s.warmup.kind, s.question.kind]).not.toContain("adaptive");
          expect(s.pages).toHaveLength(3);
          for (const p of s.pages) expect(p.scene).toBe("tree-room");
        }
      }
    }
  });

  it("instructions are pt-BR and the content taught (letters, English words) is en-US", () => {
    const bank = getBank();
    const english = new Set(bank.items.filter((i) => i.kind === "word").map((w) => (w.kind === "word" ? w.en.toLowerCase() : "")));
    for (const u of units) {
      for (const n of unitNarrations(u)) {
        for (const seg of n) {
          if (seg.lang !== "pt-BR") continue;
          const tokens = seg.text.split(/[^A-Za-zÀ-ÿ-]+/).filter(Boolean);
          for (const t of tokens) {
            expect(english.has(t.toLowerCase()), `"${t}" in "${seg.text}"`).toBe(false);
            // A lone capital is a letter being taught, except the Portuguese words A, E, O.
            if (/^[A-Z]$/.test(t)) expect(["A", "E", "O"], `"${seg.text}"`).toContain(t);
          }
        }
      }
    }
  });

  it("the letter prompts follow the templates", () => {
    const lesson = units[0].stops[1];
    if (lesson.kind !== "lesson") throw new Error("expected a lesson");
    expect(lesson.exercises[0]).toEqual({
      kind: "intro",
      wordId: "letter-a",
      say: [
        { lang: "pt-BR", text: "Esta é a letra" },
        { lang: "en-US", text: "A. A is for apple." },
      ],
    });
    const tap = lesson.exercises[1];
    expect(tap.kind === "adaptive" && tap.levels[0].kind === "listenTap" && tap.levels[0].prompt).toEqual([
      { lang: "pt-BR", text: "Toque no" },
      { lang: "en-US", text: "A" },
    ]);
    const x = units[1].stops[3];
    if (x.kind !== "lesson") throw new Error("expected a lesson");
    expect(x.exercises.find((e) => e.kind === "intro" && e.wordId === "letter-x")).toMatchObject({ say: [{ text: "Esta é a letra" }, { text: "X. Box ends with X." }] });
  });

  it("the four songs are the alphabet halves, the B is for ball chant and the spelling chant", () => {
    const song = (i: number) => {
      const s = units[i].stops[0];
      return s.kind === "song" ? s.lyrics.map((l) => l.say.map((x) => x.text).join(" ")) : [];
    };
    expect(song(0)[0]).toBe("A, B, C, D, E, F, G!");
    expect(song(1)[1]).toBe("U, V, W, X, Y, Z!");
    expect(song(2)).toContain("B is for ball!");
    expect(song(3)).toContain("D-O-G, dog!");
  });
});

describe("letras units in the content", () => {
  it("are registered and their narrations (every level) are in allNarrations", () => {
    const all = allNarrations().map((n) => JSON.stringify(n));
    for (const built of units) {
      expect(getUnit(built.id)).toEqual(built);
      for (const n of unitNarrations(built)) expect(all).toContain(JSON.stringify(n));
    }
  });

  it("are on the path of the descoberta island, open (with content)", () => {
    const path = getPath();
    const letras = path.filter((p) => p.area === "letras");
    expect(letras.map((p) => p.unitId)).toEqual(["letras-1", "letras-2", "letras-3", "letras-4"]);
    for (const p of letras) expect(p).toMatchObject({ island: "descoberta", hasContent: true });
    for (const p of path.filter((p) => p.area !== "letras")) expect(p).toMatchObject({ island: "descoberta", area: "farol" });
  });
});
