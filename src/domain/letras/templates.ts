import type { ArtId, Exercise, Narration, StopExercise, Word } from "@/domain/trail/schema";
import type { BankLetter, BankWord } from "./bank";

// The activity templates of spec §5: each turns bank items into one exercise of the existing kinds.
// Nino's instruction is a pt-BR segment and what the child learns (a letter, an English word) an
// en-US segment, so every piece is voiced once and reused. Option sets come from a seed: the same
// stop always gets the same exercises.

/** Letters a child mixes up (shape or name), closest first: level 3 asks B against D and P, level 1 against S. */
export const CLOSE_LETTERS: Record<string, string[]> = {
  a: ["e", "o"], b: ["d", "p"], c: ["s", "k"], d: ["b", "p"], e: ["i", "a"], f: ["s", "v"], g: ["j", "q"],
  h: ["n", "k"], i: ["e", "j"], j: ["g", "i"], k: ["c", "q"], l: ["i", "t"], m: ["n", "w"], n: ["m", "h"],
  o: ["q", "c"], p: ["q", "b"], q: ["p", "o"], r: ["n", "p"], s: ["c", "z"], t: ["l", "f"], u: ["v", "n"],
  v: ["u", "w"], w: ["m", "v"], x: ["k", "s"], y: ["v", "i"], z: ["s", "x"],
};

// ---- seeded choice (no Math.random: the build is deterministic) ----

export function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export type Rng = () => number;

export function rngFor(seed: string): Rng {
  let a = hash32(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], seed: string): T[] {
  const rng = rngFor(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Options for levels 1–3 (2, 3 and 4 cards): level 1 adds the least similar candidate, level 2 the
 * most similar plus that one, level 3 the two most similar plus that one. Ties fall in seeded order.
 */
export function levelOptions<T>(answer: T, candidates: readonly T[], score: (c: T) => number, seed: string): [T[], T[], T[]] {
  const ranked = shuffle(candidates.filter((c) => c !== answer), `${seed}:rank`)
    .map((c, i) => ({ c, s: score(c), i }))
    .sort((x, y) => y.s - x.s || x.i - y.i)
    .map((x) => x.c);
  if (ranked.length < 3) throw new Error(`not enough distractors for ${String(answer)} (${seed})`);
  const far = ranked[ranked.length - 1];
  const close = ranked.filter((c) => c !== far);
  const sets: T[][] = [[far], [close[0], far], [close[0], close[1], far]];
  return sets.map((d, i) => shuffle([answer, ...d], `${seed}:${i + 1}`)) as [T[], T[], T[]];
}

// ---- the words the units speak ----

export const pt = (text: string) => ({ lang: "pt-BR" as const, text });
export const en = (text: string) => ({ lang: "en-US" as const, text });

export const letterArt = (l: string) => `letter-${l}` as ArtId;
export const writtenArt = (w: BankWord) => `word-${w.en}` as ArtId;
export const upper = (l: string) => l.toUpperCase();

/** Everything the templates need from the bank. */
export type Ctx = {
  letter(id: string): BankLetter;
  word(id: string): BankWord;
  /** The letter's own word (its first): "B is for ball", X: "box". */
  mainWord(letter: string): BankWord;
};

/** "B is for ball!" (X: "Box ends with X!"). */
export function letterLine(ctx: Ctx, l: string): string {
  const w = ctx.mainWord(l);
  return w.initial === l ? `${upper(l)} is for ${w.en}!` : `${w.en[0].toUpperCase()}${w.en.slice(1)} ends with ${upper(l)}!`;
}

/** The unit word entry for a card: what tapping it says and how the memory training asks for it. */
export function wordEntry(ctx: Ctx, id: ArtId): Word {
  if (id.startsWith("letter-")) {
    const L = upper(id.slice(7));
    return { id, en: L, pt: `a letra ${L}`, say: [en(L)], ask: [pt("Toque no"), en(L)] };
  }
  if (id.startsWith("word-")) {
    const w = ctx.word(id.slice(5));
    return { id, en: w.en, pt: `a palavra ${w.en}`, say: [en(`${w.en}!`)], ask: [pt("Toque na palavra"), en(`${w.en}!`)] };
  }
  const w = ctx.word(id);
  const f = w.gender === "f";
  return {
    id,
    en: w.en,
    pt: `${f ? "a" : "o"} ${w.pt}`,
    say: [en(`${w.en}!`)],
    ask: [pt(f ? "Qual é a" : "Qual é o"), en(`${w.en}?`), pt(f ? "Toque nela!" : "Toque nele!")],
  };
}

const adaptive = (levels: [Exercise, Exercise, Exercise]): StopExercise => ({ kind: "adaptive", levels });

// ---- letters ----

/** apresentar-letra: "Esta é a letra B. B is for ball." */
export function introLetter(ctx: Ctx, l: string): Exercise {
  const w = ctx.mainWord(l);
  const line = w.initial === l ? `${upper(l)} is for ${w.en}.` : `${w.en[0].toUpperCase()}${w.en.slice(1)} ends with ${upper(l)}.`;
  return { kind: "intro", wordId: letterArt(l), say: [pt("Esta é a letra"), en(`${upper(l)}. ${line}`)] };
}

export const letterScore = (target: string) => (c: string) => (CLOSE_LETTERS[target].includes(c) ? 2 : 0);

/** ouvir-tocar-letra: "Toque no B" among letter cards. */
export function tapLetter(l: string, pool: readonly string[], seed: string): StopExercise {
  const sets = levelOptions(l, pool, letterScore(l), seed);
  return adaptive(sets.map((ids) => ({ kind: "listenTap", prompt: [pt("Toque no"), en(upper(l))], optionIds: ids.map(letterArt), answerId: letterArt(l) })) as [Exercise, Exercise, Exercise]);
}

/** letra-da-palavra: "Qual começa com B?" among pictures (X: "Qual termina com X?"). */
export function startsWith(ctx: Ctx, l: string, pool: readonly BankWord[], seed: string): StopExercise {
  const answer = ctx.mainWord(l);
  const ends = answer.initial !== l;
  const candidates = pool.filter((w) => w.initial !== l && !(ends && w.en.includes(l)));
  const sets = levelOptions(answer, candidates, (w) => letterScore(l)(w.initial), seed);
  const prompt: Narration = [pt(ends ? "Qual termina com" : "Qual começa com"), en(`${upper(l)}?`)];
  return adaptive(sets.map((ws) => ({ kind: "listenTap", prompt, optionIds: ws.map((w) => w.art), answerId: answer.art })) as [Exercise, Exercise, Exercise]);
}

/** verdadeiro-comeca: "ball! Começa com B? Certo ou errado?" (false: a look-alike letter). */
export function trueStarts(w: BankWord, isTrue: boolean): Exercise {
  const shown = isTrue ? w.initial : CLOSE_LETTERS[w.initial][0];
  return { kind: "trueFalse", wordId: w.art, say: [en(`${w.en}!`), pt("Começa com"), en(`${upper(shown)}?`), pt("Certo ou errado?")], isTrue };
}

/** ligar-figura-palavra: pictures and their spoken English words. */
export function matchPictures(words: readonly BankWord[]): Exercise {
  return { kind: "matchPairs", prompt: [pt("Ligue cada figura à palavra!")], wordIds: words.slice(0, 4).map((w) => w.art) };
}

/** Tap each letter and repeat: "B is for ball!". */
export function repeatLetters(ctx: Ctx, letters: readonly string[]): Exercise {
  return {
    kind: "tapRepeat",
    prompt: [pt("Toque em cada letra e repita comigo!")],
    items: letters.slice(0, 6).map((l) => ({ wordId: letterArt(l), say: [en(letterLine(ctx, l))] })),
  };
}

/** Tap each picture and repeat: "B is for ball!". */
export function repeatPictures(ctx: Ctx, letters: readonly string[]): Exercise {
  return {
    kind: "tapRepeat",
    prompt: [pt("Toque em cada figura e repita comigo!")],
    items: letters.slice(0, 6).map((l) => ({ wordId: ctx.mainWord(l).art, say: [en(letterLine(ctx, l))] })),
  };
}

/** letra-que-falta: look at the cards, one hides, which one went missing? */
export function missing<T>(
  shown: readonly T[],
  hidden: T,
  pool: readonly T[],
  score: (c: T) => number,
  art: (c: T) => ArtId,
  what: "letra" | "palavra",
  seed: string,
): StopExercise {
  const sets = levelOptions(hidden, pool.filter((c) => !shown.includes(c)), score, seed);
  const prompt: Narration = [pt(what === "letra" ? "Uma letra se escondeu! Qual sumiu?" : "Uma palavra se escondeu! Qual sumiu?")];
  return adaptive(sets.map((ids) => ({ kind: "whatsMissing", prompt, shownIds: shown.map(art), missingId: art(hidden), optionIds: ids.map(art) })) as [Exercise, Exercise, Exercise]);
}

// ---- written words ----

/** How alike two short words look: same letter in the same place counts double ("cat"/"hat"). */
export function wordScore(a: BankWord) {
  return (b: BankWord) => {
    let s = 0;
    for (let i = 0; i < b.en.length; i++) {
      if (a.en[i] === b.en[i]) s += 2;
      else if (a.en.includes(b.en[i])) s += 1;
    }
    return s;
  };
}

/** "Esta palavra é cat!" on the written card. */
export function introWord(w: BankWord): Exercise {
  return { kind: "intro", wordId: writtenArt(w), say: [pt("Esta palavra é"), en(`${w.en}!`)] };
}

/** ouvir-tocar-palavra: "Toque na palavra cat!" among written cards. */
export function tapWord(w: BankWord, pool: readonly BankWord[], seed: string): StopExercise {
  const sets = levelOptions(w, pool, wordScore(w), seed);
  return adaptive(sets.map((ws) => ({ kind: "listenTap", prompt: [pt("Toque na palavra"), en(`${w.en}!`)], optionIds: ws.map(writtenArt), answerId: writtenArt(w) })) as [Exercise, Exercise, Exercise]);
}

/** ler-palavra: the written card, and Nino says a word: "Aqui está escrito dog? Certo ou errado?" */
export function readTrue(w: BankWord, said: BankWord): Exercise {
  return { kind: "trueFalse", wordId: writtenArt(w), say: [pt("Aqui está escrito"), en(`${said.en}?`), pt("Certo ou errado?")], isTrue: said.id === w.id };
}

/** "Qual é o cat? Toque nele!" among pictures. */
export function askPicture(ctx: Ctx, w: BankWord, pool: readonly BankWord[], seed: string): StopExercise {
  const sets = levelOptions(w, pool, wordScore(w), seed);
  const prompt = wordEntry(ctx, w.art).ask;
  return adaptive(sets.map((ws) => ({ kind: "listenTap", prompt, optionIds: ws.map((x) => x.art), answerId: w.art })) as [Exercise, Exercise, Exercise]);
}
