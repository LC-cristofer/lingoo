import { WORD_IDS, type ArtId, type Exercise, type LessonStop, type Narration, type SongStop, type StopExercise, type StoryStop, type Unit, type Word } from "@/domain/trail/schema";
import type { Bank, BankLetter, BankUnit, BankWord } from "./bank";
import {
  askPicture,
  type Ctx,
  en,
  introLetter,
  introWord,
  letterArt,
  letterScore,
  levelOptions,
  matchPictures,
  missing,
  pt,
  readTrue,
  repeatLetters,
  repeatPictures,
  shuffle,
  startsWith,
  tapLetter,
  tapWord,
  trueStarts,
  upper,
  wordEntry,
  wordScore,
  writtenArt,
} from "./templates";

// Turns the letras bank into the four units of the Árvore das Letras (letras-1 … letras-4), with the
// usual stops: song, lesson × 3, story, challenge. Pure and deterministic: the same bank always gives
// the same units (tools/content/build-letras.ts writes them to content/units).

const MAX_LESSON = 12;

type Pools = { letters: string[]; pictures: BankWord[]; written: BankWord[] };

function contextOf(bank: Bank): Ctx {
  const letters = new Map(bank.items.filter((i): i is BankLetter => i.kind === "letter").map((l) => [l.id, l]));
  const words = new Map(bank.items.filter((i): i is BankWord => i.kind === "word").map((w) => [w.id, w]));
  const get = <T>(m: Map<string, T>, id: string): T => {
    const v = m.get(id);
    if (!v) throw new Error(`letras bank: unknown item "${id}"`);
    return v;
  };
  return {
    letter: (id) => get(letters, id),
    word: (id) => get(words, id),
    mainWord: (l) => get(words, get(letters, l).words[0]),
  };
}

function poolsOf(bank: Bank, unit: BankUnit): Pools {
  const letters = bank.items.filter((i): i is BankLetter => i.kind === "letter");
  const words = bank.items.filter((i): i is BankWord => i.kind === "word");
  // The words that also have a written card (galho 4's fifteen).
  const written = words.filter((w) => (WORD_IDS as readonly string[]).includes(writtenArt(w)));
  if (unit.unit === 4) return { letters: letters.map((l) => l.id), pictures: written, written };
  const n = unit.unit;
  return {
    letters: letters.filter((l) => (n === 3 ? true : l.unit === n)).map((l) => l.id),
    pictures: words.filter((w) => (n === 3 ? w.unit <= 2 : w.unit === n)),
    written,
  };
}

/** Lesson n of a letters unit: each letter presented then asked; then the word games until 12. */
function lettersLesson(ctx: Ctx, pools: Pools, S: string[], seed: string): StopExercise[] {
  const out: StopExercise[] = [];
  S.forEach((l, i) => out.push(introLetter(ctx, l), tapLetter(l, pools.letters, `${seed}#tap${i}`)));
  const extras: StopExercise[] = [
    startsWith(ctx, S[S.length - 1], pools.pictures, `${seed}#starts`),
    matchPictures(S.map(ctx.mainWord)),
    trueStarts(ctx.mainWord(S.find((l) => ctx.mainWord(l).initial === l)!), true),
    repeatLetters(ctx, S),
  ];
  for (const e of extras) if (out.length < MAX_LESSON) out.push(e);
  return out;
}

/** Lesson of the letter-sounds unit: which picture starts with the letter, true or false, the missing letter. */
function soundsLesson(ctx: Ctx, pools: Pools, S: string[], seed: string): StopExercise[] {
  const o = shuffle(S, `${seed}#order`);
  const t = o.filter((l) => ctx.mainWord(l).initial === l);
  const lettersPool = pools.letters;
  return [
    repeatPictures(ctx, S),
    startsWith(ctx, o[0], pools.pictures, `${seed}#s0`),
    startsWith(ctx, o[1], pools.pictures, `${seed}#s1`),
    trueStarts(ctx.mainWord(t[2]), true),
    tapLetter(o[3], lettersPool, `${seed}#t3`),
    startsWith(ctx, o[4], pools.pictures, `${seed}#s4`),
    matchPictures(o.slice(5, 9).map(ctx.mainWord)),
    trueStarts(ctx.mainWord(t[6 % t.length]), false),
    startsWith(ctx, o[7], pools.pictures, `${seed}#s7`),
    missing(o.slice(0, 3), o[3], lettersPool, letterScore(o[3]), letterArt, "letra", `${seed}#m`),
    tapLetter(o[5], lettersPool, `${seed}#t5`),
  ];
}

/** Lesson of the first-words unit: each written word presented then found; then match and read. */
function wordsLesson(ctx: Ctx, pools: Pools, S: BankWord[], seed: string): StopExercise[] {
  const out: StopExercise[] = [];
  S.forEach((w, i) => out.push(introWord(w), tapWord(w, pools.written, `${seed}#tap${i}`)));
  const read = S[S.length - 1];
  const lookAlike = [...pools.written].filter((w) => w !== read).sort((a, b) => wordScore(read)(b) - wordScore(read)(a))[0];
  out.push(matchPictures(S), readTrue(read, lookAlike));
  return out.slice(0, MAX_LESSON);
}

function challengeOf(ctx: Ctx, unit: BankUnit, pools: Pools, seed: string): { exercises: StopExercise[]; wordIds: ArtId[] } {
  if (unit.mode === "words") {
    const o = shuffle(pools.written, `${seed}#order`);
    const near = (w: BankWord) => [...pools.written].filter((x) => x !== w).sort((a, b) => wordScore(w)(b) - wordScore(w)(a))[0];
    return {
      wordIds: o.slice(0, 6).map(writtenArt),
      exercises: [
        tapWord(o[0], pools.written, `${seed}#0`),
        askPicture(ctx, o[1], pools.pictures, `${seed}#1`),
        readTrue(o[2], o[2]),
        tapWord(o[3], pools.written, `${seed}#3`),
        missing(o.slice(4, 7), o[7], pools.written, wordScore(o[7]), writtenArt, "palavra", `${seed}#4`),
        matchPictures(o.slice(8, 12)),
        readTrue(o[9], near(o[9])),
        askPicture(ctx, o[10], pools.pictures, `${seed}#7`),
        tapWord(o[11], pools.written, `${seed}#8`),
      ],
    };
  }
  const o = shuffle(pools.letters, `${seed}#order`);
  const t = o.filter((l) => ctx.mainWord(l).initial === l);
  if (unit.mode === "sounds") {
    return {
      wordIds: o.slice(12, 18).map((l) => ctx.mainWord(l).art),
      exercises: [
        startsWith(ctx, o[0], pools.pictures, `${seed}#0`),
        trueStarts(ctx.mainWord(t[1]), true),
        tapLetter(o[1], pools.letters, `${seed}#2`),
        startsWith(ctx, o[2], pools.pictures, `${seed}#3`),
        missing(o.slice(3, 6), o[6], pools.letters, letterScore(o[6]), letterArt, "letra", `${seed}#4`),
        matchPictures(o.slice(7, 11).map(ctx.mainWord)),
        trueStarts(ctx.mainWord(t[8]), false),
        startsWith(ctx, o[11], pools.pictures, `${seed}#7`),
        repeatPictures(ctx, o.slice(12, 18)),
      ],
    };
  }
  return {
    wordIds: o.slice(8, 13).map(letterArt),
    exercises: [
      tapLetter(o[0], pools.letters, `${seed}#0`),
      startsWith(ctx, o[1], pools.pictures, `${seed}#1`),
      trueStarts(ctx.mainWord(t[2]), true),
      tapLetter(o[3], pools.letters, `${seed}#3`),
      matchPictures(o.slice(4, 8).map(ctx.mainWord)),
      startsWith(ctx, o[5], pools.pictures, `${seed}#5`),
      trueStarts(ctx.mainWord(t[6]), false),
      tapLetter(o[7], pools.letters, `${seed}#7`),
      repeatLetters(ctx, o.slice(8, 13)),
    ],
  };
}

/** A fixed question at level 1 (two cards): songs never move the level. */
function songQuestion(ctx: Ctx, w: BankWord, pool: BankWord[], seed: string): Exercise {
  const [ids] = levelOptions(w, pool, wordScore(w), seed);
  return { kind: "listenTap", prompt: wordEntry(ctx, w.art).ask, optionIds: ids.map((x) => x.art), answerId: w.art };
}

function lessonClosing(ctx: Ctx, unit: BankUnit, items: string[], praise: string): Narration {
  if (unit.mode === "sounds") return [en(praise), pt("Você descobriu com que letra as palavras começam!")];
  if (unit.mode === "words") return [en(praise), pt("Hoje você leu:"), en(`${items.map((id) => ctx.word(id).en).join(", ")}!`)];
  return [en(praise), pt("Hoje você aprendeu:"), en(`${items.map(upper).join(", ")}!`)];
}

function buildUnit(bank: Bank, ctx: Ctx, unit: BankUnit): Unit {
  const id = `letras-${unit.unit}`;
  const pools = poolsOf(bank, unit);

  const lyricWords = unit.song.lyrics.flatMap((l) => (l.wordId ? [ctx.word(l.wordId)] : []));
  const song: SongStop = {
    kind: "song",
    id: `${id}/song`,
    title: "Música",
    opening: [pt(unit.song.opening)],
    bpm: unit.song.bpm,
    introBars: unit.song.introBars,
    lyrics: unit.song.lyrics.map((l) => ({ bar: l.bar, say: [en(l.en)], ...(l.wordId ? { wordId: ctx.word(l.wordId).art } : {}) })),
    exercises: lyricWords.slice(0, 3).map((w, i) => songQuestion(ctx, w, pools.pictures, `${id}/song#${i}`)),
    closing: [en("Great job!"), pt(unit.song.closing)],
  };

  const lessons: LessonStop[] = unit.lessons.map((lesson, i) => {
    const stopId = `${id}/lesson-${i + 1}`;
    let exercises: StopExercise[];
    let wordIds: ArtId[];
    if (unit.mode === "words") {
      const S = lesson.items.map(ctx.word);
      exercises = wordsLesson(ctx, pools, S, stopId);
      wordIds = S.map(writtenArt);
    } else if (unit.mode === "sounds") {
      exercises = soundsLesson(ctx, pools, lesson.items, stopId);
      wordIds = lesson.items.slice(0, 6).map((l) => ctx.mainWord(l).art);
    } else {
      exercises = lettersLesson(ctx, pools, lesson.items, stopId);
      wordIds = lesson.items.map(letterArt);
    }
    return {
      kind: "lesson",
      id: stopId,
      title: `Lição ${i + 1}`,
      opening: [pt(lesson.opening)],
      wordIds,
      exercises,
      closing: lessonClosing(ctx, unit, lesson.items, lesson.praise),
    };
  });

  const storyWords = [...new Set(unit.story.pages.flatMap((p) => p.hotspots.map((h) => h.wordId)))].map(ctx.word);
  const q = unit.story.question;
  const story: StoryStop = {
    kind: "story",
    id: `${id}/story`,
    title: unit.story.title,
    opening: [pt("Hora da história! Primeiro, vamos lembrar as figuras.")],
    warmup: matchPictures(storyWords),
    pages: unit.story.pages.map((p) => ({
      scene: "tree-room",
      say: [pt(p.pt), en(p.en)],
      hotspots: p.hotspots.map((h) => ({ wordId: ctx.word(h.wordId).art, x: h.x, y: h.y })),
    })),
    question: { kind: "listenTap", prompt: [pt(q.pt)], optionIds: q.optionIds.map((w) => ctx.word(w).art), answerId: ctx.word(q.answerId).art },
    closing: [en("Well done!"), pt("Você ouviu uma história em inglês!")],
  };

  const ch = challengeOf(ctx, unit, pools, `${id}/challenge`);
  const challenge: LessonStop = {
    kind: "challenge",
    id: `${id}/challenge`,
    title: "Desafio",
    opening: [pt("É hora do desafio! Mostre tudo o que você aprendeu!")],
    wordIds: ch.wordIds,
    exercises: ch.exercises,
    closing: [en("Great job!"), pt(unit.challengeClosing)],
    sticker: { id: `sticker-letras-${unit.sticker.art}`, art: unit.sticker.art, name: [en(unit.sticker.en)] },
  };

  const stops = [song, ...lessons, story, challenge];
  return { id, title: unit.title, banner: unit.banner, words: wordsOf(bank, ctx, stops), stops };
}

/** A word entry for every card the stops show, in a fixed order: letters, pictures, written words. */
function wordsOf(bank: Bank, ctx: Ctx, stops: Unit["stops"]): Word[] {
  const used = new Set<string>();
  const add = (id: string) => used.add(id);
  const visit = (e: StopExercise) => {
    switch (e.kind) {
      case "adaptive":
        e.levels.forEach(visit);
        break;
      case "intro":
      case "trueFalse":
        add(e.wordId);
        break;
      case "listenTap":
        e.optionIds.forEach(add);
        break;
      case "tapRepeat":
        e.items.forEach((i) => add(i.wordId));
        break;
      case "matchPairs":
        e.wordIds.forEach(add);
        break;
      case "whatsMissing":
        [...e.shownIds, ...e.optionIds].forEach(add);
        break;
    }
  };
  for (const s of stops) {
    if (s.kind === "song") {
      s.lyrics.forEach((l) => l.wordId && add(l.wordId));
      s.exercises.forEach(visit);
    } else if (s.kind === "story") {
      [s.warmup, s.question].forEach(visit);
      s.pages.forEach((p) => p.hotspots.forEach((h) => add(h.wordId)));
    } else {
      s.wordIds.forEach(add);
      s.exercises.forEach(visit);
      if (s.sticker) add(s.sticker.art);
    }
  }
  const letters = bank.items.filter((i) => i.kind === "letter").map((l) => letterArt(l.id));
  const words = bank.items.filter((i): i is BankWord => i.kind === "word");
  const order = [...letters, ...words.map((w) => w.art), ...words.map(writtenArt)];
  return order.filter((id) => used.has(id)).map((id) => wordEntry(ctx, id));
}

export function buildLetrasUnits(bank: Bank): Unit[] {
  const ctx = contextOf(bank);
  return bank.units.map((u) => buildUnit(bank, ctx, u));
}
