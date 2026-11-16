import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Narration } from "@/domain/trail/schema";

const narratorMock = vi.hoisted(() => ({
  playNarration: vi.fn<(n: Narration) => Promise<void>>(() => Promise.resolve()),
  playSfx: vi.fn(),
  stop: vi.fn(),
  unlock: vi.fn(),
  isUnlocked: vi.fn(() => true),
}));
vi.mock("@/audio/narrator", () => ({ narrator: narratorMock }));

const gradeCards = vi.fn();
const markToday = vi.fn();
let memory: Record<string, { box: number; due: string }> = {};
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({
    progress: { completedStops: {}, stickers: {}, daysPlayed: [], memory },
    hydrated: true,
    finishStop: vi.fn(),
    markToday,
    gradeCards,
    addMemoryCards: vi.fn(),
  }),
}));

import { FlipCard } from "@/components/trail/memory/FlipCard";
import { MemoryRound } from "@/components/trail/memory/MemoryRound";
import { getLines, getUnit } from "@/domain/trail/content";

const unit = getUnit("forest-animals")!;
const lines = getLines();
const IDS = ["forest-animals:bear", "forest-animals:bird", "forest-animals:frog"];
const word = (id: string) => unit.words.find((w) => w.id === id)!;

const flush = async () => {
  await act(async () => {});
  await act(async () => {});
};

function renderRound(extra: { record?: boolean; intro?: boolean; cardIds?: string[] } = {}) {
  const onDone = vi.fn();
  const onExit = vi.fn();
  render(<MemoryRound unit={unit} cardIds={extra.cardIds ?? IDS} record={extra.record ?? true} intro={extra.intro} onDone={onDone} onExit={onExit} />);
  return { onDone, onExit };
}

/** Flips the current card, reads its word, goes to the next one. */
async function recallAll(n = 3) {
  const seen: string[] = [];
  for (let i = 0; i < n; i++) {
    fireEvent.click(screen.getByRole("button", { name: "Virar o cartão" }));
    await flush();
    const shown = unit.words.find((w) => document.querySelector(".k-mem-card b[lang='en']")?.textContent === w.en);
    seen.push(shown!.id);
    fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    await flush();
  }
  return seen;
}

/** Which word the check is asking: the English word in the bubble ("Qual é o bear? Toque nele!"). */
function asked(): string {
  const text = document.querySelector(".k-bubble b[lang='en']")!.textContent!;
  return unit.words.find((w) => `${w.en}?` === text)!.id;
}
const tile = (id: string) => screen.getByRole("button", { name: id });
const sheet = () => screen.getByRole("status");

beforeEach(() => {
  for (const fn of Object.values(narratorMock)) fn.mockClear();
  narratorMock.isUnlocked.mockReturnValue(true);
  narratorMock.playNarration.mockImplementation(() => Promise.resolve());
  gradeCards.mockClear();
  markToday.mockClear();
  memory = Object.fromEntries(IDS.map((id) => [id, { box: 0, due: "2026-11-12" }]));
});

describe("FlipCard", () => {
  it("front: a Virar o cartão button with the picture, a ? badge and the hint; the word is not there yet", () => {
    const onFlip = vi.fn();
    render(<FlipCard word={word("bear")} flipped={false} onFlip={onFlip} hint="Toque para virar" />);
    const button = screen.getByRole("button", { name: "Virar o cartão" });
    expect(screen.getByText("?")).toBeInTheDocument();
    expect(screen.getByText("Toque para virar")).toBeInTheDocument();
    expect(screen.queryByText("bear")).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(onFlip).toHaveBeenCalledOnce();
  });

  it("back: shows the English word with lang=en and a speaker button that plays it", () => {
    render(<FlipCard word={word("bear")} flipped onFlip={() => {}} hint="Toque para virar" />);
    const en = screen.getByText("bear");
    expect(en).toHaveAttribute("lang", "en");
    fireEvent.click(screen.getByRole("button", { name: "Ouvir a palavra" }));
    expect(narratorMock.playNarration).toHaveBeenLastCalledWith(word("bear").say);
    // The front is still drawn (it turns away) but is hidden from screen readers.
    expect(screen.getByText("Toque para virar").closest("[aria-hidden='true']")).not.toBeNull();
  });
});

describe("MemoryRound recall", () => {
  it("shows one card at a time with the 'N de M' count, asks how to say it and narrates the flip hint", async () => {
    renderRound();
    await flush();
    expect(screen.getByText("1 de 3")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Virar o cartão" })).toHaveLength(1);
    expect(screen.getByText(lines.memoryAsk[0].text)).toBeInTheDocument();
    expect(narratorMock.playNarration).toHaveBeenCalledWith([...lines.memoryAsk, ...lines.memoryFlip]);
    expect(screen.queryByRole("button", { name: "Próximo" })).not.toBeInTheDocument();
  });

  it("plays the lesson intro line first only when asked for", async () => {
    renderRound({ intro: true });
    await flush();
    expect(narratorMock.playNarration).toHaveBeenCalledWith([...lines.memoryIntro, ...lines.memoryAsk, ...lines.memoryFlip]);
  });

  it("flipping plays the word and shows the English word; Próximo only appears after the flip", async () => {
    renderRound();
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Virar o cartão" }));
    await flush();
    expect(narratorMock.playNarration).toHaveBeenLastCalledWith(word("bear").say);
    expect(document.querySelector(".k-mem-card b[lang='en']")).toHaveTextContent("bear");
    expect(screen.getByText("Bear!")).toHaveAttribute("lang", "en");
    expect(screen.getByRole("button", { name: "Próximo" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    await flush();
    expect(screen.getByText("2 de 3")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Próximo" })).not.toBeInTheDocument();
  });

  it("the bubble's speaker replays the question", async () => {
    renderRound();
    await flush();
    narratorMock.playNarration.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Ouvir de novo" }));
    expect(narratorMock.playNarration).toHaveBeenCalledWith(lines.memoryAsk);
  });
});

describe("MemoryRound check", () => {
  async function toCheck() {
    const view = renderRound();
    await flush();
    const recall = await recallAll();
    return { ...view, recall };
  }

  it("asks each card once, in a different order from the recall, with the ask line and 3 tiles", async () => {
    const { recall } = await toCheck();
    const order: string[] = [];
    for (let i = 0; i < 3; i++) {
      expect(screen.getByText(`${i + 1} de 3`)).toBeInTheDocument();
      const id = asked();
      order.push(id);
      expect(narratorMock.playNarration).toHaveBeenCalledWith(word(id).ask);
      expect(document.querySelectorAll("button[data-card]")).toHaveLength(3);
      fireEvent.click(tile(id));
      await flush();
      fireEvent.click(within(sheet()).getByRole("button", { name: "Continuar" }));
      await flush();
    }
    expect([...order].sort()).toEqual([...recall].sort());
    expect(order).not.toEqual(recall);
  });

  it("the right answer shows the memoryPraise sheet (not a lesson praise)", async () => {
    await toCheck();
    fireEvent.click(tile(asked()));
    await flush();
    expect(sheet()).toHaveTextContent("Yes! You remembered!");
    expect(narratorMock.playNarration).toHaveBeenCalledWith(lines.memoryPraise);
  });

  it("right on the first tap grades that card firstTry: true, as soon as it is checked", async () => {
    await toCheck();
    const id = asked();
    expect(gradeCards).not.toHaveBeenCalled();
    fireEvent.click(tile(id));
    await flush();
    expect(gradeCards).toHaveBeenCalledTimes(1);
    expect(gradeCards).toHaveBeenLastCalledWith([{ id: `forest-animals:${id}`, firstTry: true }]);
  });

  it("a wrong first tap then the right one grades firstTry: false, with the orange retry and no 'wrong' wording", async () => {
    await toCheck();
    const id = asked();
    const other = ["bear", "bird", "frog"].find((x) => x !== id)!;
    fireEvent.click(tile(other));
    expect(sheet()).toHaveAttribute("data-kind", "retry");
    expect(sheet()).toHaveTextContent("Opa! Vamos tentar de novo.");
    expect(gradeCards).toHaveBeenLastCalledWith([{ id: `forest-animals:${id}`, firstTry: false }]);
    await flush();
    fireEvent.click(tile(id));
    await flush();
    expect(sheet()).toHaveAttribute("data-kind", "correct");
    expect(gradeCards).toHaveBeenCalledTimes(1); // graded once, on the first attempt
  });

  it("a card is not asked again after a hint (no review queue in the memory check)", async () => {
    await toCheck();
    const id = asked();
    const other = ["bear", "bird", "frog"].find((x) => x !== id)!;
    fireEvent.click(tile(other));
    await flush();
    await flush();
    fireEvent.click(tile(other));
    await flush();
    expect(sheet()).toHaveAttribute("data-kind", "hint");
    fireEvent.click(tile(id));
    await flush();
    fireEvent.click(within(sheet()).getByRole("button", { name: "Continuar" }));
    await flush();
    expect(screen.getByText("2 de 3")).toBeInTheDocument();
  });

  it("leaving in the middle keeps what was graded and calls onExit", async () => {
    const { onExit } = await toCheck();
    fireEvent.click(tile(asked()));
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(onExit).toHaveBeenCalledOnce();
    expect(gradeCards).toHaveBeenCalledTimes(1);
  });
});

describe("MemoryRound summary", () => {
  async function finish(firstTryFor: (index: number) => boolean) {
    const view = renderRound();
    await flush();
    await recallAll();
    for (let i = 0; i < 3; i++) {
      const id = asked();
      if (!firstTryFor(i)) {
        fireEvent.click(tile(["bear", "bird", "frog"].find((x) => x !== id)!));
        await flush();
        await flush();
      }
      fireEvent.click(tile(id));
      await flush();
      fireEvent.click(within(sheet()).getByRole("button", { name: "Continuar" }));
      await flush();
    }
    return view;
  }

  it("says how many words were remembered on the first try, with a check on those tiles", async () => {
    const { onDone } = await finish((i) => i !== 1);
    expect(screen.getByText("Treino de memória")).toBeInTheDocument();
    expect(screen.getByText(lines.memoryDone[2][0].text)).toBeInTheDocument();
    expect(narratorMock.playNarration).toHaveBeenLastCalledWith(lines.memoryDone[2]);
    expect(document.querySelectorAll(".k-mem-tile")).toHaveLength(3);
    expect(document.querySelectorAll(".k-mem-tile .k-tile-badge")).toHaveLength(2);
    for (const w of ["bear", "bird", "frog"]) expect(screen.getByText(w)).toHaveAttribute("lang", "en");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("with none remembered the line is 'Você treinou a memória!'", async () => {
    await finish(() => false);
    expect(screen.getByText(lines.memoryDone[0][0].text)).toBeInTheDocument();
    expect(narratorMock.playNarration).toHaveBeenLastCalledWith(lines.memoryDone[0]);
    expect(document.querySelectorAll(".k-mem-tile .k-tile-badge")).toHaveLength(0);
  });

  it("finishing a round marks today on the calendar", async () => {
    await finish(() => true);
    expect(markToday).toHaveBeenCalled();
  });
});

describe("MemoryRound in review mode (record=false)", () => {
  it("works but never grades or marks the day", async () => {
    renderRound({ record: false });
    await flush();
    await recallAll();
    for (let i = 0; i < 3; i++) {
      fireEvent.click(tile(asked()));
      await flush();
      fireEvent.click(within(sheet()).getByRole("button", { name: "Continuar" }));
      await flush();
    }
    expect(screen.getByText(lines.memoryDone[3][0].text)).toBeInTheDocument();
    expect(gradeCards).not.toHaveBeenCalled();
    expect(markToday).not.toHaveBeenCalled();
  });
});
