import { z } from "zod";
import bankJson from "../../../content/areas/letras/bank.json";
import { artIdSchema, langSchema } from "@/domain/trail/schema";

// The activity bank of an area (today: the Árvore das Letras). Items are the letters and words the
// child learns; `units` holds the hand-written parts of each galho (song, story, lesson grouping,
// openings). The builder (build.ts) turns it into ordinary units.

const text = z.string().refine((t) => t.trim().length > 0, "text must not be empty");
const unitNo = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
/** Reserved: the 1-3 mark of an item. The adaptive level does not read it yet (it picks options and look-alikes instead). */
const difficulty = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const letterId = z.string().regex(/^[a-z]$/);

const letterSchema = z.object({
  kind: z.literal("letter"),
  id: letterId,
  unit: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  difficulty,
  /** The English letter name, as it is said ("bee"). */
  name: text,
  /** Words for this letter, the first one is its word ("B is for ball"). */
  words: z.array(z.string().min(1)).min(1),
});

const wordSchema = z.object({
  kind: z.literal("word"),
  id: z.string().min(1),
  en: text,
  /** The Portuguese noun, without article (for the adults; never narrated). */
  pt: text,
  /** Gender of the Portuguese noun: Nino asks "Qual é o …" or "Qual é a …". */
  gender: z.enum(["m", "f"]),
  art: artIdSchema,
  initial: letterId,
  unit: unitNo,
  difficulty,
});

const itemSchema = z.discriminatedUnion("kind", [letterSchema, wordSchema]);

const segment = z.object({ lang: langSchema, text });
const hotspot = z.object({ wordId: z.string().min(1), x: z.number().min(0).max(1), y: z.number().min(0).max(1) });

const unitSchema = z.object({
  unit: unitNo,
  /** letters: learn letter names; sounds: which letter a word starts with; words: read short words. */
  mode: z.enum(["letters", "sounds", "words"]),
  title: text,
  icon: text,
  banner: z.array(segment).min(1),
  lessons: z
    .array(z.object({ items: z.array(z.string().min(1)).min(3), opening: text, praise: text }))
    .length(3),
  song: z.object({
    opening: text,
    closing: text,
    bpm: z.number().positive(),
    introBars: z.number().int().min(0),
    lyrics: z.array(z.object({ bar: z.number().int().min(1), en: text, wordId: z.string().min(1).optional() })).min(3),
  }),
  story: z.object({
    title: text,
    pages: z.array(z.object({ pt: text, en: text, hotspots: z.array(hotspot) })).length(3),
    question: z.object({ pt: text, optionIds: z.array(z.string().min(1)).length(2), answerId: z.string().min(1) }),
  }),
  challengeClosing: text,
  sticker: z.object({ art: artIdSchema, en: text }),
});

export const bankSchema = z
  .object({
    area: z.literal("letras"),
    items: z.array(itemSchema).min(1),
    units: z.array(unitSchema).length(4),
  })
  .superRefine((bank, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: "custom", message });
    const letters = bank.items.filter((i) => i.kind === "letter");
    const words = new Map(bank.items.filter((i) => i.kind === "word").map((w) => [w.id, w]));
    const ids = bank.items.map((i) => `${i.kind}:${i.id}`);
    if (new Set(ids).size !== ids.length) issue("duplicate item id");
    if (letters.map((l) => l.id).join("") !== "abcdefghijklmnopqrstuvwxyz") issue("letters must be a to z, in order");
    for (const l of letters) {
      for (const w of l.words) {
        const word = words.get(w);
        if (!word) issue(`letter "${l.id}": unknown word "${w}"`);
        else if (word.initial !== l.id && !word.en.endsWith(l.id)) issue(`letter "${l.id}": "${w}" neither starts nor ends with it`);
      }
    }
    for (const w of words.values()) if (!w.en.startsWith(w.initial)) issue(`word "${w.id}" does not start with "${w.initial}"`);
    const known = (id: string) => words.has(id) || letters.some((l) => l.id === id);
    for (const u of bank.units) {
      if (u.unit !== bank.units.indexOf(u) + 1) issue(`units must be in order 1 to 4`);
      u.lessons.forEach((lesson) => lesson.items.forEach((id) => known(id) || issue(`unit ${u.unit}: unknown lesson item "${id}"`)));
      u.song.lyrics.forEach((l) => l.wordId && !words.has(l.wordId) && issue(`unit ${u.unit}: unknown song word "${l.wordId}"`));
      u.story.pages.forEach((p) => p.hotspots.forEach((h) => words.has(h.wordId) || issue(`unit ${u.unit}: unknown story word "${h.wordId}"`)));
      const q = u.story.question;
      q.optionIds.forEach((id) => words.has(id) || issue(`unit ${u.unit}: unknown question word "${id}"`));
      if (!q.optionIds.includes(q.answerId)) issue(`unit ${u.unit}: question answer is not an option`);
    }
  });

export type Bank = z.infer<typeof bankSchema>;
export type BankItem = Bank["items"][number];
export type BankLetter = Extract<BankItem, { kind: "letter" }>;
export type BankWord = Extract<BankItem, { kind: "word" }>;
export type BankUnit = Bank["units"][number];

export function parseBank(data: unknown): Bank {
  return bankSchema.parse(data);
}

let cache: Bank | undefined;

/** The letras bank, validated once. */
export function getBank(): Bank {
  return (cache ??= parseBank(bankJson));
}
