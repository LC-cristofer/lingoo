import { z } from "zod";

export const langSchema = z.enum(["pt-BR", "en-US"]);
const segmentSchema = z.object({
  lang: langSchema,
  text: z.string().refine((t) => t.trim().length > 0, "segment text must not be empty"),
});
const narrationSchema = z.array(segmentSchema).min(1);

export const ANIMAL_IDS = ["bear", "bird", "frog", "snake", "spider", "mouse"] as const;
export const LETTER_IDS = [
  "letter-a", "letter-b", "letter-c", "letter-d", "letter-e", "letter-f", "letter-g", "letter-h", "letter-i",
  "letter-j", "letter-k", "letter-l", "letter-m", "letter-n", "letter-o", "letter-p", "letter-q", "letter-r",
  "letter-s", "letter-t", "letter-u", "letter-v", "letter-w", "letter-x", "letter-y", "letter-z",
] as const;
/** Written-word cards: the word alone, no picture. */
export const WORD_IDS = [
  "word-cat", "word-dog", "word-sun", "word-hat", "word-bed", "word-pig", "word-box", "word-bus",
  "word-cup", "word-fox", "word-hen", "word-jam", "word-map", "word-net", "word-van",
] as const;
/** Illustrated words (each has its own drawing in src/art/words). */
export const PICTURE_IDS = [
  "apple", "ball", "cat", "dog", "egg", "fish", "goat", "hat", "igloo", "jam", "kite", "lion", "moon", "nest",
  "orange", "pig", "queen", "rain", "sun", "tree", "umbrella", "van", "web", "box", "yoyo", "zebra", "bed",
  "bus", "cup", "fox", "hen", "map", "net",
] as const;
export const artIdSchema = z.enum([...ANIMAL_IDS, ...LETTER_IDS, ...WORD_IDS, ...PICTURE_IDS]);
export const sceneIdSchema = z.enum([
  "forest-walk",
  "forest-bear",
  "forest-bird",
  "forest-pond",
  "forest-web",
  "forest-goodbye",
  "tree-room",
]);

const wordSchema = z.object({
  id: artIdSchema,
  en: z.string().min(1),
  pt: z.string().min(1),
  say: narrationSchema,
  /** The memory check question ("Qual é o bear? Toque nele!"). */
  ask: narrationSchema,
});

const exerciseSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("intro"), wordId: artIdSchema, say: narrationSchema }),
  z.object({
    kind: z.literal("listenTap"),
    prompt: narrationSchema,
    optionIds: z.array(artIdSchema).min(2).max(4),
    answerId: artIdSchema,
  }),
  z.object({
    kind: z.literal("tapRepeat"),
    prompt: narrationSchema,
    items: z.array(z.object({ wordId: artIdSchema, say: narrationSchema })).min(3).max(6),
  }),
  z.object({ kind: z.literal("trueFalse"), wordId: artIdSchema, say: narrationSchema, isTrue: z.boolean() }),
  z.object({ kind: z.literal("matchPairs"), prompt: narrationSchema, wordIds: z.array(artIdSchema).min(3).max(4) }),
  z.object({
    kind: z.literal("whatsMissing"),
    prompt: narrationSchema,
    shownIds: z.array(artIdSchema).min(1),
    missingId: artIdSchema,
    optionIds: z.array(artIdSchema).min(2),
  }),
]);

/** One slot, three variants: level n has n + 1 options and closer distractors. Only in lessons and challenges. */
const adaptiveSchema = z.object({
  kind: z.literal("adaptive"),
  levels: z.tuple([exerciseSchema, exerciseSchema, exerciseSchema]),
});
const stopExerciseSchema = z.union([exerciseSchema, adaptiveSchema]);

const stickerSchema = z.object({ id: z.string().min(1), art: artIdSchema, name: narrationSchema });

const lessonStopSchema = z.object({
  kind: z.enum(["lesson", "challenge"]),
  id: z.string().min(1),
  title: z.string().min(1),
  opening: narrationSchema,
  wordIds: z.array(artIdSchema).min(1),
  exercises: z.array(stopExerciseSchema).min(1),
  closing: narrationSchema,
  sticker: stickerSchema.optional(),
});

const songStopSchema = z.object({
  kind: z.literal("song"),
  id: z.string().min(1),
  title: z.string().min(1),
  opening: narrationSchema,
  bpm: z.number().positive(),
  introBars: z.number().int().min(0),
  lyrics: z
    .array(z.object({ bar: z.number().int().min(1), say: narrationSchema, wordId: artIdSchema.optional() }))
    .min(1),
  exercises: z.array(exerciseSchema).min(1),
  closing: narrationSchema,
});

const unit01 = z.number().min(0).max(1);
const storyStopSchema = z.object({
  kind: z.literal("story"),
  id: z.string().min(1),
  title: z.string().min(1),
  opening: narrationSchema,
  warmup: exerciseSchema,
  pages: z
    .array(
      z.object({
        scene: sceneIdSchema,
        say: narrationSchema,
        hotspots: z.array(z.object({ wordId: artIdSchema, x: unit01, y: unit01 })),
      }),
    )
    .min(1),
  question: exerciseSchema,
  closing: narrationSchema,
});

const stopSchema = z.union([lessonStopSchema, songStopSchema, storyStopSchema]);

const STOP_ORDER = ["song", "lesson", "lesson", "lesson", "story", "challenge"];

export const unitSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    banner: narrationSchema,
    words: z.array(wordSchema).min(1),
    stops: z.array(stopSchema).min(1),
  })
  .superRefine((unit, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: "custom", message });
    const wordIds = new Set<string>(unit.words.map((w) => w.id));
    const known = (id: string) => {
      if (!wordIds.has(id)) issue(`unknown word id "${id}"`);
    };

    const checkExercise = (ex: z.infer<typeof stopExerciseSchema>) => {
      switch (ex.kind) {
        case "adaptive":
          ex.levels.forEach(checkExercise);
          if (new Set(ex.levels.map((l) => l.kind)).size !== 1) issue("adaptive levels must be the same kind of exercise");
          break;
        case "intro":
        case "trueFalse":
          known(ex.wordId);
          break;
        case "listenTap":
          ex.optionIds.forEach(known);
          known(ex.answerId);
          if (!ex.optionIds.includes(ex.answerId)) issue(`answerId "${ex.answerId}" is not in optionIds`);
          break;
        case "tapRepeat":
          ex.items.forEach((i) => known(i.wordId));
          break;
        case "matchPairs":
          ex.wordIds.forEach(known);
          break;
        case "whatsMissing":
          ex.shownIds.forEach(known);
          ex.optionIds.forEach(known);
          known(ex.missingId);
          if (!ex.optionIds.includes(ex.missingId)) issue(`missingId "${ex.missingId}" is not in optionIds`);
          if (ex.shownIds.includes(ex.missingId)) issue(`missingId "${ex.missingId}" is in shownIds`);
          break;
      }
    };

    const seen = new Set<string>();
    for (const stop of unit.stops) {
      if (seen.has(stop.id)) issue(`duplicate stop id "${stop.id}"`);
      seen.add(stop.id);
      if (stop.kind === "lesson" || stop.kind === "challenge") stop.wordIds.forEach(known);
      if (stop.kind === "challenge" && !stop.sticker) issue("challenge must have a sticker");
      if (stop.kind === "song") {
        stop.lyrics.forEach((l) => l.wordId && known(l.wordId));
        stop.exercises.forEach(checkExercise);
      } else if (stop.kind === "story") {
        checkExercise(stop.warmup);
        checkExercise(stop.question);
        stop.pages.forEach((p) => p.hotspots.forEach((h) => known(h.wordId)));
      } else {
        stop.exercises.forEach(checkExercise);
        if (stop.sticker) known(stop.sticker.art);
      }
    }

    if (unit.stops.map((s) => s.kind).join(",") !== STOP_ORDER.join(",")) {
      issue(`stops must be in the order ${STOP_ORDER.join(", ")}`);
    }
  });

export const pathSchema = z.array(
  z.object({
    unitId: z.string().min(1),
    /** The farol's map world (its units only; the tree's branches have none). */
    world: z.enum(["floresta", "vilarejo"]).optional(),
    title: z.string().min(1),
    icon: z.string().min(1),
    hasContent: z.boolean(),
    /** The island and the area (place on it) the unit belongs to; the stop ids do not carry them. */
    island: z.enum(["descoberta"]).default("descoberta"),
    area: z.enum(["farol", "letras"]).default("farol"),
  }),
);

export const linesSchema = z.object({
  praise: z.array(narrationSchema).min(1),
  retry: narrationSchema,
  hint: narrationSchema,
  star: narrationSchema,
  chestOpen: narrationSchema,
  chestPrompt: narrationSchema,
  lockedStop: narrationSchema,
  soonUnit: narrationSchema,
  start: narrationSchema,
  album: narrationSchema,
  memoryIntro: narrationSchema,
  memoryAsk: narrationSchema,
  memoryFlip: narrationSchema,
  memoryPraise: narrationSchema,
  /** Index = how many words were remembered (0..8). */
  memoryDone: z.array(narrationSchema).length(9),
  memoryHome: narrationSchema,
  memoryEmpty: narrationSchema,
  memoryEmptyLater: narrationSchema,
  memoryNone: narrationSchema,
  /** The map cat's "Vamos!" bubble, keyed by the stop's last id segment (song, lesson-1, story, challenge...). */
  stopGo: z.record(z.string(), narrationSchema),
  /** The album section that keeps phase 1 stickers. */
  legacySection: narrationSchema,
  /** The name of the phase 1 fox sticker, kept in the album for children who earned it. */
  legacyFox: narrationSchema,
  ninoHello: narrationSchema,
  ninoExplore: narrationSchema,
  placeFarol: narrationSchema,
  farolClimb: narrationSchema,
  placeArvore: narrationSchema,
  arvoreClimb: narrationSchema,
  placeBuilding: narrationSchema,
  /** The cadastro's gate: the child asks a grown-up to hold the button. */
  callAdult: narrationSchema,
  farolGrew: narrationSchema,
  arvoreGrew: narrationSchema,
  nestSaved: narrationSchema,
  goodnight: narrationSchema,
  pauseSuggest: narrationSchema,
});

export type Lang = z.infer<typeof langSchema>;
export type Segment = z.infer<typeof segmentSchema>;
export type Narration = z.infer<typeof narrationSchema>;
export type ArtId = z.infer<typeof artIdSchema>;
export type SceneId = z.infer<typeof sceneIdSchema>;
export type Word = z.infer<typeof wordSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type AdaptiveExercise = z.infer<typeof adaptiveSchema>;
/** What a lesson or challenge holds: an exercise, or an adaptive slot resolved with the child's level. */
export type StopExercise = z.infer<typeof stopExerciseSchema>;
export type LessonStop = z.infer<typeof lessonStopSchema>;
export type SongStop = z.infer<typeof songStopSchema>;
export type StoryStop = z.infer<typeof storyStopSchema>;
export type Stop = z.infer<typeof stopSchema>;
export type Unit = z.infer<typeof unitSchema>;
export type PathUnit = z.infer<typeof pathSchema>[number];
export type Lines = z.infer<typeof linesSchema>;

export function parseUnit(data: unknown): Unit {
  return unitSchema.parse(data);
}
export function parsePath(data: unknown): PathUnit[] {
  return pathSchema.parse(data);
}
export function parseLines(data: unknown): Lines {
  return linesSchema.parse(data);
}
