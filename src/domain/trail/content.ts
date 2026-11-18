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

// The content files are static: each is validated once, on first use, and the same object is handed out after that.
let pathCache: PathUnit[] | undefined;
const unitCache = new Map<string, Unit>();
let linesCache: Lines | undefined;

export function getPath(): PathUnit[] {
  return (pathCache ??= parsePath(pathJson));
}

export function getUnit(id: string): Unit | null {
  if (!Object.hasOwn(unitFiles, id)) return null;
  let unit = unitCache.get(id);
  if (!unit) {
    unit = parseUnit(unitFiles[id]);
    unitCache.set(id, unit);
  }
  return unit;
}

export function getStop(stopId: string): { unit: Unit; stop: Stop; index: number } | null {
  const unit = getUnit(stopId.split("/")[0]);
  if (!unit) return null;
  const index = unit.stops.findIndex((s) => s.id === stopId);
  return index < 0 ? null : { unit, stop: unit.stops[index], index };
}

export function getLines(): Lines {
  return (linesCache ??= parseLines(linesJson));
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
    out.push(unit.banner, ...unit.words.map((w) => w.say), ...unit.words.map((w) => w.ask));
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
  out.push(l.memoryIntro, l.memoryAsk, l.memoryFlip, l.memoryPraise, ...l.memoryDone, l.memoryHome, l.memoryEmpty, l.memoryEmptyLater, l.memoryNone);
  out.push(...Object.values(l.stopGo));
  out.push(l.legacySection, l.legacyFox);
  out.push(l.ninoHello, l.ninoExplore, l.placeFarol, l.farolClimb, l.placeBuilding, l.farolGrew, l.nestSaved, l.goodnight, l.pauseSuggest);
  return out;
}
