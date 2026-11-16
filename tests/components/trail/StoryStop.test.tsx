import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Narration, StoryStop as StoryStopType, Unit } from "@/domain/trail/schema";

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

const unit = getUnit("forest-animals") as Unit;
const story = unit.stops[4] as StoryStopType;

const flush = async () => {
  await act(async () => {});
  await act(async () => {});
};
const feedbackContinue = () => within(screen.getByTestId("feedback-area")).getByRole("button", { name: "Continuar" });

function renderStory(extra: { record?: boolean } = {}) {
  const onExit = vi.fn();
  render(<StoryStop unit={unit} stop={story} onExit={onExit} {...extra} />);
  return { onExit };
}

/** Warmup: match the four pairs (picture, then its word). */
async function doWarmup() {
  fireEvent.click(screen.getByRole("button", { name: "Começar" }));
  await flush();
  const ids = story.warmup.kind === "matchPairs" ? story.warmup.wordIds : [];
  for (const id of ids) {
    fireEvent.click(document.querySelector(`[data-card="${id}"]`)!);
    fireEvent.click(document.querySelector(`button[data-word="${id}"]`)!);
    await flush();
  }
}

beforeEach(() => {
  for (const fn of Object.values(narratorMock)) fn.mockClear();
  narratorMock.playNarration.mockImplementation(() => Promise.resolve());
  narratorMock.isUnlocked.mockReturnValue(true);
  finishStop.mockClear();
});
afterEach(() => vi.useRealTimers());

/** Waits for the page narration: the test decides when it ends. */
function holdNarration() {
  const resolvers: (() => void)[] = [];
  narratorMock.playNarration.mockImplementation(() => new Promise<void>((r) => resolvers.push(r)));
  return () => {
    resolvers.splice(0).forEach((r) => r());
  };
}
const pageDone = async () => {
  await flush();
};

describe("StoryStop", () => {
  it("says the opening and starts with the warmup exercise", async () => {
    renderStory();
    await flush();
    expect(narratorMock.playNarration).toHaveBeenCalledWith(story.opening);
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    await flush();
    expect(narratorMock.unlock).toHaveBeenCalled();
    expect(narratorMock.playNarration).toHaveBeenCalledWith((story.warmup as { prompt: Narration }).prompt);
    expect(screen.getByTestId("feedback-area")).toBeInTheDocument();
  });

  it("warmup, six pages (Avançar only after the narration), the question, the closing, finishStop once", async () => {
    renderStory();
    await doWarmup();
    fireEvent.click(feedbackContinue());
    await flush();

    for (let i = 0; i < story.pages.length; i++) {
      const page = story.pages[i];
      expect(document.querySelector(`[data-scene="${page.scene}"]`)).toBeInTheDocument();
      expect(narratorMock.playNarration).toHaveBeenLastCalledWith(page.say);
      expect(screen.getByRole("button", { name: "Avançar" })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
      await flush();
    }
    // The question: a listenTap.
    expect(finishStop).not.toHaveBeenCalled();
    if (story.question.kind !== "listenTap") throw new Error("expected listenTap");
    fireEvent.click(screen.getByRole("button", { name: story.question.answerId }));
    await flush();
    fireEvent.click(feedbackContinue());
    await flush();
    expect(finishStop).toHaveBeenCalledTimes(1);
    expect(finishStop).toHaveBeenCalledWith(story.id);
    expect(screen.getByRole("button", { name: "Voltar ao mapa" })).toBeInTheDocument();
  });

  it("shows Avançar and Repetir only when the page narration has ended", async () => {
    renderStory();
    await doWarmup();
    fireEvent.click(feedbackContinue());
    await flush();
    // Page 1 resolved at once in the default mock; hold the next one.
    const release = holdNarration();
    fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
    await flush();
    expect(narratorMock.playNarration).toHaveBeenLastCalledWith(story.pages[1].say);
    expect(screen.queryByRole("button", { name: "Avançar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Repetir" })).toBeNull();
    release();
    await pageDone();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeInTheDocument();
    narratorMock.playNarration.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Repetir" }));
    await flush();
    expect(narratorMock.playNarration).toHaveBeenCalledWith(story.pages[1].say);
  });

  it("tapping an animal says its word", async () => {
    renderStory();
    await doWarmup();
    fireEvent.click(feedbackContinue());
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
    await flush();
    narratorMock.playNarration.mockClear();
    fireEvent.click(document.querySelector('button[data-hotspot="bear"]')!);
    expect(narratorMock.playNarration).toHaveBeenCalledWith(unit.words.find((w) => w.id === "bear")!.say);
  });

  it("does not save in review mode", async () => {
    renderStory({ record: false });
    await doWarmup();
    fireEvent.click(feedbackContinue());
    await flush();
    for (let i = 0; i < story.pages.length; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
      await flush();
    }
    if (story.question.kind !== "listenTap") throw new Error("expected listenTap");
    fireEvent.click(screen.getByRole("button", { name: story.question.answerId }));
    await flush();
    fireEvent.click(feedbackContinue());
    await flush();
    expect(finishStop).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Voltar ao mapa" })).not.toBeInTheDocument();
  });

  it("stops the narration on ✕", async () => {
    const { onExit } = renderStory();
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(onExit).toHaveBeenCalled();
    expect(narratorMock.stop).toHaveBeenCalled();
  });

  it("a hotspot tap during the page narration does not unlock Avançar; the page is read again after the word", async () => {
    renderStory();
    await doWarmup();
    fireEvent.click(feedbackContinue());
    await flush();
    const pending: (() => void)[] = [];
    narratorMock.playNarration.mockImplementation((n) =>
      n === story.pages[1].say ? new Promise<void>((r) => pending.push(r)) : Promise.resolve(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Avançar" }));
    await flush();
    expect(pending).toHaveLength(1);
    narratorMock.playNarration.mockClear();
    fireEvent.click(document.querySelector('button[data-hotspot="bear"]')!);
    await flush();
    const spoken = narratorMock.playNarration.mock.calls.map((c) => c[0]);
    expect(spoken).toEqual([unit.words.find((w) => w.id === "bear")!.say, story.pages[1].say]);
    expect(pending).toHaveLength(2);
    // The interrupted first reading ends: it must not count.
    pending[0]();
    await flush();
    expect(screen.queryByRole("button", { name: "Avançar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Repetir" })).toBeNull();
    pending[1]();
    await flush();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeInTheDocument();
  });

  it("the 🔊 replay restarts the page narration and the page only counts when it ends uninterrupted", async () => {
    renderStory();
    await doWarmup();
    fireEvent.click(feedbackContinue());
    await flush();
    const pending: (() => void)[] = [];
    narratorMock.playNarration.mockImplementation((n) =>
      n === story.pages[0].say ? new Promise<void>((r) => pending.push(r)) : Promise.resolve(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Repetir" }));
    await flush();
    expect(pending).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Ouvir de novo" }));
    await flush();
    expect(pending).toHaveLength(2);
    pending[0]();
    await flush();
    expect(screen.queryByRole("button", { name: "Avançar" })).toBeNull();
    pending[1]();
    await flush();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeInTheDocument();
  });
});
