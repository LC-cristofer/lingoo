import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getBank } from "@/domain/letras/bank";
import { buildLetrasUnits } from "@/domain/letras/build";
import { sayAs } from "@/domain/letras/say-as";
import { segmentId } from "@/domain/trail/audio-id";
import { allNarrations } from "@/domain/trail/content";
import type { Exercise, Narration, StopExercise, Unit } from "@/domain/trail/schema";
import lines from "../../../tools/audio/lines.json";

const AUDIO = join(__dirname, "../../../public/audio");
const MIN_BYTES = 2048;
const UNIT_IDS = ["letras-1", "letras-2", "letras-3", "letras-4"];

function sizeOf(file: string): number {
  return existsSync(file) ? statSync(file).size : 0;
}

/** Every narration a unit can ever play: all adaptive levels, every stop, the word cards. Built from the bank, not from the JSON. */
function everyNarration(unit: Unit): Narration[] {
  const ex = (e: StopExercise | Exercise): Narration[] => {
    switch (e.kind) {
      case "adaptive":
        return e.levels.flatMap(ex);
      case "intro":
      case "trueFalse":
        return [e.say];
      case "tapRepeat":
        return [e.prompt, ...e.items.map((i) => i.say)];
      default:
        return [e.prompt];
    }
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

describe("letras audio", () => {
  it("every segment of every narration of letras-1..4 has a voice file", () => {
    const segments = allNarrations((id) => UNIT_IDS.includes(id)).flat();
    expect(segments.length).toBeGreaterThan(200);
    const missing = [...new Map(segments.map((s) => [segmentId(s), s])).entries()]
      .filter(([id]) => sizeOf(join(AUDIO, `${id}.mp3`)) <= MIN_BYTES)
      .map(([id, s]) => `${id} (${s.lang}) ${s.text}`);
    expect(missing).toEqual([]);
  });

  it("no unrecorded combination can be drawn: every segment the bank can generate, at every adaptive level, has a voice file", () => {
    const built = buildLetrasUnits(getBank());
    expect(built.map((u) => u.id)).toEqual(UNIT_IDS);
    const segments = built.flatMap(everyNarration).flat();
    const missing = [...new Map(segments.map((s) => [segmentId(s), s])).entries()]
      .filter(([id]) => sizeOf(join(AUDIO, `${id}.mp3`)) <= MIN_BYTES)
      .map(([id, s]) => `${id} (${s.lang}) ${s.text}`);
    expect(missing).toEqual([]);
  });

  it("the four songs exist", () => {
    for (const id of UNIT_IDS) expect(sizeOf(join(AUDIO, `song-${id}.mp3`)), id).toBeGreaterThan(MIN_BYTES);
  });

  it("lines.json lists every letras segment, with letters said by their English names", () => {
    const byId = new Map(lines.map((l) => [l.id, l as { text: string; say_as?: string }]));
    const segments = allNarrations((id) => UNIT_IDS.includes(id)).flat();
    for (const seg of segments) expect(byId.has(segmentId(seg)), seg.text).toBe(true);
    const say = (text: string) => byId.get(segmentId({ lang: "en-US", text }))?.say_as;
    expect(say("B")).toBe("Bee.");
    expect(say("V?")).toBe("Vee?");
    expect(say("W")).toBe("Double-u.");
    expect(say("B is for ball!")).toBe("Bee is for ball!");
    expect(say("D-O-G, dog!")).toBe("Dee, Oh, Gee, dog!");
    expect(say("A dog and a fox!")).toBeUndefined();
    expect(say("I can read! I can read!")).toBeUndefined();
  });
});

describe("sayAs", () => {
  it("says every bare letter, whatever its punctuation, and keeps its punctuation", () => {
    for (const item of getBank().items) {
      if (item.kind !== "letter") continue;
      const upper = item.id.toUpperCase();
      for (const [text, punct] of [[upper, "."], [`${upper}?`, "?"], [`${upper}!`, "!"]]) {
        const said = sayAs(text);
        expect(said, text).toBeDefined();
        expect(said!.endsWith(punct), text).toBe(true);
      }
    }
  });

  it("uses the bank's English name for the letters the voice reads right", () => {
    expect(sayAs("B")).toBe("Bee.");
    expect(sayAs("H?")).toBe("Aitch?");
    expect(sayAs("Box ends with X!")).toBe("Box ends with Ex!");
    expect(sayAs("A to M!")).toBe("Ey to M!");
    expect(sayAs("van!")).toBe("van?");
    expect(sayAs("S is for sun!")).toBe("Ess, is for sun!"); // "Ess is" runs together as "this"
  });

  it("leaves the words A and I and plain sentences alone", () => {
    expect(sayAs("A kite sticker!")).toBeUndefined();
    expect(sayAs("Now I know")).toBeUndefined();
    expect(sayAs("Great job!")).toBeUndefined();
  });
});
