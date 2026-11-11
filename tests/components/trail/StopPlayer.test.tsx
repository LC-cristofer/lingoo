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
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({ progress: { completedStops: {}, stickers: {}, daysPlayed: [] }, hydrated: true, finishStop, markToday: vi.fn() }),
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
    expect(narratorMock.playSfx).toHaveBeenCalledWith("star");
    expect(narratorMock.playNarration).toHaveBeenCalledWith([...lesson.closing, ...lines.star]);
    expect(screen.getByTestId("star")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao mapa" }));
    expect(onExit).toHaveBeenCalledTimes(1);
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
    expect(screen.queryByRole("button", { name: "Voltar ao mapa" })).not.toBeInTheDocument();
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

  describe("gatinho expression", () => {
    const expression = () => document.querySelector("[data-expression]")!.getAttribute("data-expression");
    const tapRepeatStop: LessonStop = {
      ...full,
      exercises: [full.exercises.find((e) => e.kind === "tapRepeat")!, full.exercises[0]],
    };

    it("pointing while answering, happy on correct, helping on retry and on hint", async () => {
      renderPlayer();
      await startAndFinishIntro();
      expect(expression()).toBe("pointing");
      let endRetry: () => void = () => {};
      narratorMock.playNarration.mockImplementation((n) =>
        JSON.stringify(n) === JSON.stringify(lines.retry) ? new Promise<void>((r) => (endRetry = r)) : Promise.resolve(),
      );
      fireEvent.click(card("bird"));
      await flush();
      expect(expression()).toBe("helping");
      endRetry();
      await flush();
      expect(expression()).toBe("pointing");
      fireEvent.click(card("bird"));
      await flush();
      expect(expression()).toBe("helping"); // hint
      fireEvent.click(card("bear"));
      await flush();
      expect(expression()).toBe("happy");
    });

    it("an override from the exercise applies, and is reset when the exercise changes", async () => {
      renderPlayer(tapRepeatStop);
      fireEvent.click(screen.getByRole("button", { name: "Começar" }));
      await flush();
      expect(expression()).toBe("pointing");
      const items = (tapRepeatStop.exercises[0] as Extract<LessonStop["exercises"][number], { kind: "tapRepeat" }>).items;
      fireEvent.click(document.querySelector(`button[data-card="${items[0].wordId}"]`)!);
      expect(expression()).toBe("listening");
      for (const it of items.slice(1)) fireEvent.click(document.querySelector(`button[data-card="${it.wordId}"]`)!);
      fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
      await flush();
      expect(expression()).toBe("happy");
      fireEvent.click(within(feedback()).getByRole("button", { name: "Continuar" }));
      await flush();
      expect(expression()).toBe("pointing"); // next exercise: override gone
    });
  });

  it("✕ in the middle calls onExit without finishStop", async () => {
    const { onExit } = renderPlayer();
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(finishStop).not.toHaveBeenCalled();
  });

  it("does not record anything when record is false", async () => {
    renderPlayer(lesson, { record: false });
    await startAndFinishIntro();
    fireEvent.click(card("bear"));
    await flush();
    fireEvent.click(within(feedback()).getByRole("button", { name: "Continuar" }));
    await flush();
    expect(screen.getByRole("button", { name: "Voltar ao mapa" })).toBeInTheDocument();
    expect(finishStop).not.toHaveBeenCalled();
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
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao mapa" }));
    expect(onExit).toHaveBeenCalledTimes(1);
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
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao mapa" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
