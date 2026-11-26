import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LessonStop, Narration, Unit } from "@/domain/trail/schema";

const narratorMock = vi.hoisted(() => ({
  playNarration: vi.fn<(n: Narration) => Promise<void>>(() => Promise.resolve()),
  playSfx: vi.fn(),
  stop: vi.fn(),
  unlock: vi.fn(),
  isUnlocked: vi.fn(() => true),
}));
vi.mock("@/audio/narrator", () => ({ narrator: narratorMock }));

const finishStop = vi.fn();
const addMemoryCards = vi.fn();
const gradeCards = vi.fn();
let storedMemory: Record<string, { box: number; due: string }> = {};
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({
    progress: { completedStops: {}, stickers: {}, daysPlayed: [], memory: storedMemory },
    hydrated: true,
    finishStop,
    markToday: vi.fn(),
    addMemoryCards,
    gradeCards,
  }),
}));

import { ChestReward } from "@/components/trail/ChestReward";
import { StopPlayer } from "@/components/trail/StopPlayer";
import { getLines, getUnit } from "@/domain/trail/content";

const unit = getUnit("forest-animals")!;
const lines = getLines();
const full = unit.stops[1] as LessonStop;
// A short lesson: intro bear, then "which is the bear?" (bear vs bird).
const lesson: LessonStop = { ...full, exercises: full.exercises.slice(0, 2) };
const challenge: LessonStop = { ...(unit.stops[5] as LessonStop), exercises: full.exercises.slice(0, 2) };
const testUnit = unit as Unit;

const flush = async () => {
  await act(async () => {});
  await act(async () => {});
};
const feedback = () => screen.getByTestId("feedback-area");
const askedWord = () => {
  const text = document.querySelector(".k-bubble b[lang='en']")!.textContent!;
  return unit.words.find((w) => `${w.en}?` === text)!.id;
};

/** Goes through the memory round: flip every card, answer every check right, leave the summary. */
async function finishMemoryRound(cards = 3) {
  for (let i = 0; i < cards; i++) {
    fireEvent.click(screen.getByRole("button", { name: "Virar o cartão" }));
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    await flush();
  }
  for (let i = 0; i < cards; i++) {
    fireEvent.click(screen.getByRole("button", { name: askedWord() }));
    await flush();
    fireEvent.click(within(feedback()).getByRole("button", { name: "Continuar" }));
    await flush();
  }
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await flush();
}
const card = (id: string) => screen.getByRole("button", { name: id });

function renderPlayer(stop: LessonStop = lesson, extra: { record?: boolean } = {}) {
  const onExit = vi.fn();
  render(<StopPlayer unit={testUnit} stop={stop} onExit={onExit} {...extra} />);
  return { onExit };
}

async function startAndFinishIntro() {
  fireEvent.click(screen.getByRole("button", { name: "Começar" }));
  await flush();
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await flush();
  fireEvent.click(within(feedback()).getByRole("button", { name: "Continuar" }));
  await flush();
}

beforeEach(() => {
  vi.useFakeTimers();
  for (const fn of Object.values(narratorMock)) fn.mockClear();
  narratorMock.isUnlocked.mockReturnValue(true);
  narratorMock.playNarration.mockImplementation(() => Promise.resolve());
  finishStop.mockClear();
  addMemoryCards.mockClear();
  gradeCards.mockClear();
  storedMemory = {};
});
afterEach(() => vi.useRealTimers());

describe("StopPlayer opening", () => {
  it("says the opening, shows the stop's word cards and starts on ▶", async () => {
    renderPlayer();
    await flush();
    expect(narratorMock.playNarration).toHaveBeenCalledWith(lesson.opening);
    for (const id of lesson.wordIds) expect(document.querySelector(`button[data-word="${id}"]`)).toBeInTheDocument();
    fireEvent.click(document.querySelector('button[data-word="bear"]')!);
    expect(narratorMock.playNarration).toHaveBeenLastCalledWith(unit.words.find((w) => w.id === "bear")!.say);
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    await flush();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("with audio locked on mount, ONE tap on ▶ unlocks and shows the first exercise", async () => {
    narratorMock.isUnlocked.mockReturnValue(false);
    renderPlayer();
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    await flush();
    expect(narratorMock.unlock).toHaveBeenCalled();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Começar" })).not.toBeInTheDocument();
  });
});

describe("StopPlayer session", () => {
  it("correct answer: praise strip with Continuar, then the next exercise", async () => {
    renderPlayer();
    await startAndFinishIntro();
    expect(card("bear")).toBeInTheDocument();
    expect(narratorMock.playSfx).toHaveBeenCalledWith("correct");
    expect(narratorMock.playNarration).toHaveBeenCalledWith(lines.praise[0]);
    fireEvent.click(card("bear"));
    await flush();
    expect(within(feedback()).getByRole("status")).toHaveAttribute("data-kind", "correct");
    expect(narratorMock.playNarration).toHaveBeenCalledWith(lines.praise[1 % lines.praise.length]);
  });

  it("reserves the strip's height with and without feedback", async () => {
    renderPlayer();
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    await flush();
    expect(feedback()).toBeInTheDocument();
    expect(within(feedback()).queryByRole("status")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await flush();
    expect(feedback()).toBeInTheDocument();
    expect(within(feedback()).getByRole("status")).toBeInTheDocument();
  });

  it("finishing shows the closing and calls finishStop once with the stop id", async () => {
    const { onExit } = renderPlayer();
    await startAndFinishIntro();
    fireEvent.click(card("bear"));
    await flush();
    expect(finishStop).not.toHaveBeenCalled();
    fireEvent.click(within(feedback()).getByRole("button", { name: "Continuar" }));
    await flush();
    expect(finishStop).toHaveBeenCalledTimes(1);
    expect(finishStop).toHaveBeenCalledWith(lesson.id);
    // The memory round comes between the last exercise and the closing.
    expect(screen.queryByTestId("star")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Virar o cartão" })).toBeInTheDocument();
    await finishMemoryRound();
    expect(narratorMock.playSfx).toHaveBeenCalledWith("star");
    expect(narratorMock.playNarration).toHaveBeenCalledWith([...lesson.closing, ...lines.star]);
    expect(screen.getByTestId("star")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao farol" }));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith("done");
    expect(finishStop).toHaveBeenCalledTimes(1);
  });

  it("an exercise that reached the hint comes back at the end", async () => {
    renderPlayer();
    await startAndFinishIntro();
    let endRetry: () => void = () => {};
    narratorMock.playNarration.mockImplementation((n) =>
      JSON.stringify(n) === JSON.stringify(lines.retry) ? new Promise<void>((r) => (endRetry = r)) : Promise.resolve(),
    );
    fireEvent.click(card("bird")); // wrong -> retry
    await flush();
    expect(within(feedback()).getByRole("status")).toHaveAttribute("data-kind", "retry");
    expect(narratorMock.playSfx).toHaveBeenCalledWith("retry");
    expect(narratorMock.playNarration).toHaveBeenCalledWith(lines.retry);
    endRetry(); // retry narration ended -> back to answering
    await flush();
    expect(within(feedback()).queryByRole("status")).not.toBeInTheDocument();
    fireEvent.click(card("bird")); // wrong again -> hint
    await flush();
    expect(within(feedback()).getByRole("status")).toHaveAttribute("data-kind", "hint");
    fireEvent.click(card("bear"));
    await flush();
    fireEvent.click(within(feedback()).getByRole("button", { name: "Continuar" }));
    await flush();
    // Not finished: the same exercise is back.
    expect(screen.queryByRole("button", { name: "Voltar ao farol" })).not.toBeInTheDocument();
    expect(finishStop).not.toHaveBeenCalled();
    fireEvent.click(card("bear"));
    await flush();
    fireEvent.click(within(feedback()).getByRole("button", { name: "Continuar" }));
    await flush();
    expect(finishStop).toHaveBeenCalledTimes(1);
  });

  it("the progress bar never goes backwards, not even right after a review is queued", async () => {
    renderPlayer();
    await startAndFinishIntro();
    const value = () => Number(screen.getByRole("progressbar").getAttribute("aria-valuenow"));
    const before = value();
    expect(before).toBe(50);
    fireEvent.click(card("bird"));
    await flush();
    expect(value()).toBeGreaterThanOrEqual(before);
    fireEvent.click(card("bird")); // 2nd wrong: the review is queued (3 items), raw ratio 1/3
    await flush();
    expect(within(feedback()).getByRole("status")).toHaveAttribute("data-kind", "hint");
    expect(value()).toBeGreaterThanOrEqual(before);
    fireEvent.click(card("bear"));
    await flush();
    fireEvent.click(within(feedback()).getByRole("button", { name: "Continuar" }));
    await flush();
    expect(value()).toBeGreaterThanOrEqual(before);
  });

  describe("Nino pose", () => {
    const expression = () => document.querySelector(".k-ask [data-pose]")!.getAttribute("data-pose");
    const tapRepeatStop: LessonStop = {
      ...full,
      exercises: [full.exercises.find((e) => e.kind === "tapRepeat")!, full.exercises[0]],
    };

    it("point while answering, happy on correct, help on retry and on hint", async () => {
      renderPlayer();
      await startAndFinishIntro();
      expect(expression()).toBe("point");
      let endRetry: () => void = () => {};
      narratorMock.playNarration.mockImplementation((n) =>
        JSON.stringify(n) === JSON.stringify(lines.retry) ? new Promise<void>((r) => (endRetry = r)) : Promise.resolve(),
      );
      fireEvent.click(card("bird"));
      await flush();
      expect(expression()).toBe("help");
      endRetry();
      await flush();
      expect(expression()).toBe("point");
      fireEvent.click(card("bird"));
      await flush();
      expect(expression()).toBe("help"); // hint
      fireEvent.click(card("bear"));
      await flush();
      expect(expression()).toBe("happy");
    });

    it("an override from the exercise applies, and is reset when the exercise changes", async () => {
      renderPlayer(tapRepeatStop);
      fireEvent.click(screen.getByRole("button", { name: "Começar" }));
      await flush();
      expect(expression()).toBe("point");
      const items = (tapRepeatStop.exercises[0] as Extract<LessonStop["exercises"][number], { kind: "tapRepeat" }>).items;
      fireEvent.click(document.querySelector(`button[data-card="${items[0].wordId}"]`)!);
      expect(expression()).toBe("listen");
      for (const it of items.slice(1)) fireEvent.click(document.querySelector(`button[data-card="${it.wordId}"]`)!);
      fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
      await flush();
      expect(expression()).toBe("happy");
      fireEvent.click(within(feedback()).getByRole("button", { name: "Continuar" }));
      await flush();
      expect(expression()).toBe("point"); // next exercise: override gone
    });
  });

  it("✕ in the middle calls onExit without finishStop", async () => {
    const { onExit } = renderPlayer();
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith("quit");
    expect(finishStop).not.toHaveBeenCalled();
  });

  it("does not record anything when record is false", async () => {
    renderPlayer(lesson, { record: false });
    await startAndFinishIntro();
    fireEvent.click(card("bear"));
    await flush();
    fireEvent.click(within(feedback()).getByRole("button", { name: "Continuar" }));
    await flush();
    await finishMemoryRound();
    // Review mode leaves to the review list, so the button does not say "mapa".
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Voltar ao farol" })).not.toBeInTheDocument();
    expect(finishStop).not.toHaveBeenCalled();
    expect(addMemoryCards).not.toHaveBeenCalled();
    expect(gradeCards).not.toHaveBeenCalled();
  });
});

describe("StopPlayer memory round", () => {
  async function finishLessonExercises(extra: { record?: boolean } = {}) {
    const view = renderPlayer(lesson, extra);
    await startAndFinishIntro();
    fireEvent.click(card("bear"));
    await flush();
    fireEvent.click(within(feedback()).getByRole("button", { name: "Continuar" }));
    await flush();
    return view;
  }

  it("a lesson adds the cards of its new words and trains them, with the intro line", async () => {
    await finishLessonExercises();
    expect(addMemoryCards).toHaveBeenCalledTimes(1);
    expect(addMemoryCards).toHaveBeenCalledWith(lesson.wordIds.map((id) => `forest-animals:${id}`));
    expect(narratorMock.playNarration).toHaveBeenCalledWith([...lines.memoryIntro, ...lines.memoryAsk, ...lines.memoryFlip]);
    expect(screen.getByText(`1 de ${lesson.wordIds.length}`)).toBeInTheDocument();
  });

  it("cards the child already has are not added again; old due ones join the round", async () => {
    storedMemory = {
      "forest-animals:bear": { box: 1, due: "2000-01-01" },
      "forest-animals:snake": { box: 0, due: "2000-01-01" },
    };
    await finishLessonExercises();
    expect(addMemoryCards).toHaveBeenCalledWith(["forest-animals:bird", "forest-animals:frog"]);
    // 2 new + the old due ones (bear, snake) = 4 cards
    expect(screen.getByText("1 de 4")).toBeInTheDocument();
  });

  it("cards that are not due today are shown as practice only and never graded", async () => {
    storedMemory = Object.fromEntries(lesson.wordIds.map((id) => [`forest-animals:${id}`, { box: 3, due: "2999-12-31" }]));
    await finishLessonExercises();
    expect(addMemoryCards).not.toHaveBeenCalled();
    await finishMemoryRound(lesson.wordIds.length);
    expect(gradeCards).not.toHaveBeenCalled();
  });

  it("replaying a lesson reviews only its own unit: another unit's due cards never fill the round", async () => {
    storedMemory = {
      ...Object.fromEntries(lesson.wordIds.map((id) => [`forest-animals:${id}`, { box: 3, due: "2999-12-31" }])),
      ...Object.fromEntries(["a", "b", "c", "d", "e", "f"].map((l) => [`letras-1:${l}`, { box: 0, due: "2000-01-01" }])),
    };
    await finishLessonExercises();
    expect(addMemoryCards).not.toHaveBeenCalled();
    // the 3 lowest-box cards of the farol, not a blank screen made of tree cards
    expect(screen.getByText(`1 de ${Math.min(3, lesson.wordIds.length)}`)).toBeInTheDocument();
  });

  it("with record=false nothing is added", async () => {
    await finishLessonExercises({ record: false });
    expect(addMemoryCards).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Virar o cartão" })).toBeInTheDocument();
  });

  it("✕ in the memory round leaves; the stop was already recorded", async () => {
    const { onExit } = await finishLessonExercises();
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(finishStop).toHaveBeenCalledTimes(1);
  });
});

async function finishChallenge(record?: boolean) {
  const r = renderPlayer(challenge, record === undefined ? {} : { record });
  await startAndFinishIntro();
  fireEvent.click(card("bear"));
  await flush();
  fireEvent.click(within(feedback()).getByRole("button", { name: "Continuar" }));
  await flush();
  return r;
}

describe("StopPlayer challenge", () => {
  it("records the stop and its sticker once, on entering the closing, before any chest tap", async () => {
    await finishChallenge();
    const sticker = challenge.sticker!;
    expect(finishStop).toHaveBeenCalledTimes(1);
    expect(finishStop).toHaveBeenCalledWith(challenge.id, sticker.id);
  });

  it("the chest is presentation only: sticker appears on tap, no further finishStop", async () => {
    const { onExit } = await finishChallenge();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" })); // closing -> chest
    await flush();
    expect(narratorMock.playNarration).toHaveBeenCalledWith(lines.chestPrompt);
    expect(document.querySelector("svg.art-sticker")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Abrir o baú" }));
    await flush();
    const sticker = challenge.sticker!;
    expect(narratorMock.playSfx).toHaveBeenCalledWith("chest");
    expect(narratorMock.playNarration).toHaveBeenCalledWith([...lines.chestOpen, ...sticker.name]);
    expect(document.querySelector("svg.art-sticker")).toBeInTheDocument();
    expect(finishStop).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao farol" }));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledWith("done");
  });

  it("with record false nothing is saved, not even when the chest opens", async () => {
    await finishChallenge(false);
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Abrir o baú" }));
    await flush();
    expect(finishStop).not.toHaveBeenCalled();
  });

  it("a challenge without a sticker still offers the way back", () => {
    const onBack = vi.fn();
    render(<ChestReward stop={{ ...challenge, sticker: undefined }} lines={lines} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao farol" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
