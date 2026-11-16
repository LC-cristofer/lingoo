import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Narration, StoryStop as StoryStopData } from "@/domain/trail/schema";

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

import { StoryStop } from "@/components/trail/StoryStop";
import { getUnit } from "@/domain/trail/content";

const unit = getUnit("forest-animals")!;
const story = unit.stops[4] as StoryStopData;

const flush = async () => {
  await act(async () => {});
  await act(async () => {});
};
const sheetContinue = () => within(screen.getByTestId("feedback-area")).getByRole("button", { name: "Continuar" });
const scene = () => document.querySelector("[data-scene]")?.getAttribute("data-scene");

function renderStory(extra: { record?: boolean } = {}) {
  const onExit = vi.fn();
  render(<StoryStop unit={unit} stop={story} onExit={onExit} {...extra} />);
  return { onExit };
}

/** Começar, then the warm-up "Ligar pares": each picture with its word. */
async function startAndWarmUp() {
  fireEvent.click(screen.getByRole("button", { name: "Começar" }));
  await flush();
  if (story.warmup.kind !== "matchPairs") throw new Error("the warm-up is a matchPairs");
  for (const id of story.warmup.wordIds) {
    fireEvent.click(document.querySelector(`button[data-card="${id}"]`)!);
    fireEvent.click(document.querySelector(`button[data-word="${id}"]`)!);
  }
  await flush();
  fireEvent.click(sheetContinue());
  await flush();
}

beforeEach(() => {
  vi.useFakeTimers();
  for (const fn of Object.values(narratorMock)) fn.mockClear();
  narratorMock.playNarration.mockImplementation(() => Promise.resolve());
  finishStop.mockClear();
});
afterEach(() => vi.useRealTimers());

describe("StoryStop", () => {
  it("shows Avançar only once the page has been told", async () => {
    let tell: () => void = () => {};
    narratorMock.playNarration.mockImplementation((n) =>
      n === story.pages[0].say ? new Promise<void>((r) => (tell = r)) : Promise.resolve(),
    );
    renderStory();
    await startAndWarmUp();
    expect(scene()).toBe(story.pages[0].scene);
    expect(narratorMock.playNarration).toHaveBeenCalledWith(story.pages[0].say);
    expect(screen.queryByRole("button", { name: "Avançar" })).not.toBeInTheDocument();
    await act(async () => tell());
    expect(screen.getByRole("button", { name: "Avançar" })).toBeInTheDocument();
  });

  it("a double tap on Avançar turns one page", async () => {
    renderStory();
    await startAndWarmUp();
    const button = screen.getByRole("button", { name: "Avançar" });
    fireEvent.click(button);
    fireEvent.click(button);
    await flush();
    expect(scene()).toBe(story.pages[1].scene);
  });

  it("Repetir tells the page again", async () => {
    renderStory();
    await startAndWarmUp();
    narratorMock.playNarration.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Repetir" }));
    expect(narratorMock.playNarration).toHaveBeenCalledWith(story.pages[0].say);
  });

  it("tapping an animal in the scene says its word", async () => {
    renderStory();
    await startAndWarmUp();
    fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
    await flush();
    const bear = unit.words.find((w) => w.id === "bear")!;
    fireEvent.click(document.querySelector('button[data-hotspot="bear"]')!);
    expect(narratorMock.playNarration).toHaveBeenLastCalledWith(bear.say);
  });

  it("goes through the pages, the question and the closing, recording the stop once", async () => {
    renderStory();
    await startAndWarmUp();
    for (let i = 0; i < story.pages.length; i++) {
      expect(scene()).toBe(story.pages[i].scene);
      fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
      await flush();
    }
    if (story.question.kind !== "listenTap") throw new Error("the question is a listenTap");
    fireEvent.click(document.querySelector(`button[data-card="${story.question.answerId}"]`)!);
    await flush();
    fireEvent.click(sheetContinue());
    await flush();
    expect(screen.getByTestId("star")).toBeInTheDocument();
    expect(finishStop).toHaveBeenCalledTimes(1);
    expect(finishStop).toHaveBeenCalledWith("forest-animals/story");
  });

  it("leaving on page 3 stops the voice and records nothing", async () => {
    const { onExit } = renderStory();
    await startAndWarmUp();
    for (let i = 0; i < 2; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
      await flush();
    }
    narratorMock.stop.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(narratorMock.stop).toHaveBeenCalled();
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(finishStop).not.toHaveBeenCalled();
  });
});
