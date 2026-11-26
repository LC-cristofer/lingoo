import pathJson from "../../../content/path.json";
import linesJson from "../../../content/lines.json";
import forestAnimalsJson from "../../../content/units/forest-animals.json";
import letras1Json from "../../../content/units/letras-1.json";
import letras2Json from "../../../content/units/letras-2.json";
import letras3Json from "../../../content/units/letras-3.json";
import letras4Json from "../../../content/units/letras-4.json";
import {
  parseLines,
  parsePath,
  parseUnit,
  type Exercise,
  type Lines,
  type Narration,
  type PathUnit,
  type Stop,
  type StopExercise,
  type Unit,
} from "./schema";

const unitFiles: Record<string, unknown> = {
  "forest-animals": forestAnimalsJson,
  // Generated from content/areas/letras/bank.json (npm run content:letras).
  "letras-1": letras1Json,
  "letras-2": letras2Json,
  "letras-3": letras3Json,
  "letras-4": letras4Json,
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

function exerciseNarrations(ex: StopExercise): Narration[] {
  switch (ex.kind) {
    case "adaptive":
      return ex.levels.flatMap((l: Exercise) => exerciseNarrations(l));
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

/** Every narration in every unit (or in the units `include` keeps) plus lines.json, in a deterministic order. */
export function allNarrations(include: (unitId: string) => boolean = () => true): Narration[] {
  const out: Narration[] = [];
  for (const id of Object.keys(unitFiles).filter(include)) {
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
  out.push(l.ninoHello, l.ninoExplore, l.placeFarol, l.farolClimb, l.placeArvore, l.arvoreClimb, l.callAdult, l.farolGrew, l.arvoreGrew, l.nestSaved, l.goodnight, l.pauseSuggest);
  return out;
}
