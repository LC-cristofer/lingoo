import { z } from "zod";

export const langSchema = z.enum(["pt-BR", "en-US"]);
const segmentSchema = z.object({
  lang: langSchema,
  text: z.string().refine((t) => t.trim().length > 0, "segment text must not be empty"),
});
const narrationSchema = z.array(segmentSchema).min(1);

export const artIdSchema = z.enum(["bear", "bird", "frog", "snake", "spider", "mouse"]);
export const sceneIdSchema = z.enum([
  "forest-walk",
  "forest-bear",
  "forest-bird",
  "forest-pond",
  "forest-web",
  "forest-goodbye",
]);

const wordSchema = z.object({
  id: artIdSchema,
  en: z.string().min(1),
  pt: z.string().min(1),
  say: narrationSchema,
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

const stickerSchema = z.object({ id: z.string().min(1), art: artIdSchema, name: narrationSchema });

const lessonStopSchema = z.object({
  kind: z.enum(["lesson", "challenge"]),
  id: z.string().min(1),
  title: z.string().min(1),
  opening: narrationSchema,
  wordIds: z.array(artIdSchema).min(1),
  exercises: z.array(exerciseSchema).min(1),
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

    const checkExercise = (ex: z.infer<typeof exerciseSchema>) => {
      switch (ex.kind) {
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
    world: z.enum(["floresta", "vilarejo"]),
    title: z.string().min(1),
    icon: z.string().min(1),
    hasContent: z.boolean(),
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
});

export type Lang = z.infer<typeof langSchema>;
export type Segment = z.infer<typeof segmentSchema>;
export type Narration = z.infer<typeof narrationSchema>;
export type ArtId = z.infer<typeof artIdSchema>;
export type SceneId = z.infer<typeof sceneIdSchema>;
export type Word = z.infer<typeof wordSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
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
