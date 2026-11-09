import { z } from "zod";

const mediaSchema = z.object({ text: z.string().min(1), src: z.string().optional() });

const cardSchema = z.object({
  id: z.string().min(1),
  word: z.string().min(1),
  image: z.string().min(1),
  audio: mediaSchema,
});

const stepSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("song"), id: z.string().min(1), image: z.string(), audio: mediaSchema }),
  z.object({
    kind: z.literal("story"),
    id: z.string().min(1),
    pages: z.array(z.object({ image: z.string(), narration: mediaSchema })).min(1),
  }),
  z.object({
    kind: z.literal("tap"),
    id: z.string().min(1),
    rounds: z
      .array(
        z.object({
          prompt: mediaSchema,
          optionIds: z.array(z.string()).min(2),
          answerId: z.string(),
        }),
      )
      .min(1),
  }),
  z.object({ kind: z.literal("drag"), id: z.string().min(1), cardIds: z.array(z.string()).min(1) }),
  z.object({ kind: z.literal("repeat"), id: z.string().min(1), cardIds: z.array(z.string()).min(1) }),
  z.object({
    kind: z.literal("sticker"),
    id: z.string().min(1),
    stickerId: z.string(),
    image: z.string(),
    /** Said when the child taps the sticker in the album, e.g. "A fox sticker!". */
    name: mediaSchema,
  }),
]);

export const lessonSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    cards: z.array(cardSchema).min(1),
    steps: z.array(stepSchema).min(1),
  })
  .superRefine((lesson, ctx) => {
    const cardIds = new Set(lesson.cards.map((c) => c.id));
    const issue = (message: string) => ctx.addIssue({ code: "custom", message });
    const checkCard = (id: string) => {
      if (!cardIds.has(id)) issue(`unknown card id "${id}"`);
    };

    const seen = new Set<string>();
    for (const step of lesson.steps) {
      if (seen.has(step.id)) issue(`duplicate step id "${step.id}"`);
      seen.add(step.id);
      if (step.kind === "tap") {
        for (const round of step.rounds) {
          if (!round.optionIds.includes(round.answerId)) {
            issue(`answerId "${round.answerId}" is not in optionIds`);
          }
          round.optionIds.forEach(checkCard);
        }
      } else if (step.kind === "drag" || step.kind === "repeat") {
        step.cardIds.forEach(checkCard);
      }
    }
    if (lesson.steps.filter((s) => s.kind === "sticker").length !== 1) {
      issue("lesson must have exactly one sticker step");
    }
    if (lesson.steps[lesson.steps.length - 1].kind !== "sticker") {
      issue("lesson must end with the sticker step");
    }
  });

export const worldsSchema = z.array(
  z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    places: z.array(
      z.object({ lessonId: z.string().min(1), title: z.string().min(1), hasContent: z.boolean() }),
    ),
  }),
);

export type Media = z.infer<typeof mediaSchema>;
export type Card = z.infer<typeof cardSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type World = z.infer<typeof worldsSchema>[number];
export type Place = World["places"][number];

export type SongStep = Extract<Step, { kind: "song" }>;
export type StoryStep = Extract<Step, { kind: "story" }>;
export type TapStep = Extract<Step, { kind: "tap" }>;
export type DragStep = Extract<Step, { kind: "drag" }>;
export type RepeatStep = Extract<Step, { kind: "repeat" }>;
export type StickerStep = Extract<Step, { kind: "sticker" }>;

export function parseLesson(data: unknown): Lesson {
  return lessonSchema.parse(data);
}

export function parseWorlds(data: unknown): World[] {
  return worldsSchema.parse(data);
}
