import pathJson from "../../../content/path.json";
import linesJson from "../../../content/lines.json";
import forestAnimalsJson from "../../../content/units/forest-animals.json";
import {
  parseLines,
  parsePath,
  parseUnit,
  type Exercise,
  type Lines,
  type Narration,
  type PathUnit,
  type Stop,
  type Unit,
} from "./schema";

const unitFiles: Record<string, unknown> = {
  "forest-animals": forestAnimalsJson,
};

export function getPath(): PathUnit[] {
  return parsePath(pathJson);
}

export function getUnit(id: string): Unit | null {
  if (!Object.hasOwn(unitFiles, id)) return null;
  return parseUnit(unitFiles[id]);
}

export function getStop(stopId: string): { unit: Unit; stop: Stop; index: number } | null {
  const unit = getUnit(stopId.split("/")[0]);
  if (!unit) return null;
  const index = unit.stops.findIndex((s) => s.id === stopId);
  return index < 0 ? null : { unit, stop: unit.stops[index], index };
}

export function getLines(): Lines {
  return parseLines(linesJson);
}

function exerciseNarrations(ex: Exercise): Narration[] {
  switch (ex.kind) {
    case "intro":
    case "trueFalse":
      return [ex.say];
    case "listenTap":
    case "matchPairs":
    case "whatsMissing":
      return [ex.prompt];
    case "tapRepeat":
      return [ex.prompt, ...ex.items.map((i) => i.say)];
  }
}

/** Every narration in every unit plus lines.json, in a deterministic order. */
export function allNarrations(): Narration[] {
  const out: Narration[] = [];
  for (const id of Object.keys(unitFiles)) {
    const unit = getUnit(id)!;
    out.push(unit.banner, ...unit.words.map((w) => w.say));
    for (const stop of unit.stops) {
      out.push(stop.opening);
      if (stop.kind === "song") {
        out.push(...stop.lyrics.map((l) => l.say), ...stop.exercises.flatMap(exerciseNarrations));
      } else if (stop.kind === "story") {
        out.push(...exerciseNarrations(stop.warmup), ...stop.pages.map((p) => p.say), ...exerciseNarrations(stop.question));
      } else {
        out.push(...stop.exercises.flatMap(exerciseNarrations));
      }
      out.push(stop.closing);
      if (stop.kind === "challenge" && stop.sticker) out.push(stop.sticker.name);
    }
  }
  const l = getLines();
  out.push(...l.praise, l.retry, l.hint, l.star, l.chestOpen, l.chestPrompt, l.lockedStop, l.soonUnit, l.start, l.album);
  return out;
}
