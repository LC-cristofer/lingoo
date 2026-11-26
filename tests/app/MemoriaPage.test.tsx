import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Narration } from "@/domain/trail/schema";

const narratorMock = vi.hoisted(() => ({
  playNarration: vi.fn<(n: Narration) => Promise<void>>(() => Promise.resolve()),
  playSfx: vi.fn(),
  stop: vi.fn(),
  unlock: vi.fn(),
  isUnlocked: vi.fn(() => true),
}));
vi.mock("@/audio/narrator", () => ({ narrator: narratorMock }));

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));

const markToday = vi.fn();
const gradeCards = vi.fn();
let memory: Record<string, { box: number; due: string }> = {};
let hydrated = true;
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({
    progress: { completedStops: { "forest-animals/song": "x" }, stickers: {}, daysPlayed: [], memory },
    hydrated,
    finishStop: vi.fn(),
    markToday,
    gradeCards,
    addMemoryCards: vi.fn(),
  }),
}));

import MemoriaPage from "@/app/memoria/page";
import { getLines } from "@/domain/trail/content";

const lines = getLines();
const WORDS = ["bear", "bird", "frog", "snake", "spider", "mouse"];
const card = (word: string, due: string, box = 0) => [`forest-animals:${word}`, { box, due }] as const;
const TODAY = "2026-11-12";

const flush = async () => {
  await act(async () => {});
  await act(async () => {});
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 12, 10, 0, 0));
  for (const fn of Object.values(narratorMock)) fn.mockClear();
  markToday.mockClear();
  gradeCards.mockClear();
  push.mockClear();
  hydrated = true;
  memory = {};
});
afterEach(() => vi.useRealTimers());

describe("MemoriaPage with cards ready", () => {
  beforeEach(() => {
    memory = Object.fromEntries([card("bear", TODAY), card("bird", "2026-11-10")]);
  });

  it("shows the count of ready cards, the Treinar button and the pile; × goes back to the nest", () => {
    render(<MemoriaPage />);
    expect(screen.getByRole("heading", { name: "Treino de memória" })).toBeInTheDocument();
    expect(document.querySelector(".k-mem-count-n")).toHaveTextContent(/^2$/);
    expect(screen.getByText(/cartões prontos hoje/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Treinar" })).toBeInTheDocument();
    expect(document.querySelectorAll(".k-pile-card")).toHaveLength(2);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao ninho" }));
    expect(push).toHaveBeenCalledWith("/ninho");
  });

  it("cards of another unit wait for their own round and are not counted", () => {
    memory = Object.fromEntries([card("bear", TODAY), card("bird", TODAY), ["letras-1:letter-a", { box: 0, due: TODAY }]]);
    render(<MemoriaPage />);
    expect(document.querySelector(".k-mem-count-n")).toHaveTextContent(/^2$/);
    expect(document.querySelectorAll(".k-pile-card")).toHaveLength(2);
  });

  it("the bubble says memoryHome (shown and narrated)", async () => {
    render(<MemoriaPage />);
    await flush();
    expect(screen.getByText(lines.memoryHome[0].text)).toBeInTheDocument();
    expect(narratorMock.playNarration).toHaveBeenCalledWith(lines.memoryHome);
  });

  it("the bubble's speaker says the line again", async () => {
    render(<MemoriaPage />);
    await flush();
    narratorMock.playNarration.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Ouvir de novo" }));
    expect(narratorMock.playNarration).toHaveBeenCalledWith(lines.memoryHome);
  });

  it("one card ready is singular", () => {
    memory = Object.fromEntries([card("bear", TODAY)]);
    render(<MemoriaPage />);
    expect(document.querySelector(".k-mem-count-n")).toHaveTextContent(/^1$/);
    expect(screen.getByText(/cartão pronto hoje/)).toBeInTheDocument();
    expect(screen.queryByText(/cartões prontos/)).not.toBeInTheDocument();
  });

  it("shows the number the next round trains: at most 8, the first unit's cards only", async () => {
    memory = Object.fromEntries(
      [...WORDS.map((w) => card(w, TODAY)), card("bear", TODAY)].slice(0, 6),
    );
    // 6 real cards only exist in the unit; pad with fake ids of the same unit to pass the limit
    for (let i = 0; i < 4; i++) memory[`forest-animals:extra${i}`] = { box: 0, due: TODAY };
    render(<MemoriaPage />);
    expect(document.querySelector(".k-mem-count-n")).toHaveTextContent(/^8$/);
    fireEvent.click(screen.getByRole("button", { name: "Treinar" }));
    await flush();
    // unknown words are skipped, so the 6 real cards make the round
    expect(screen.getByText("1 de 6")).toBeInTheDocument();
  });

  it("Treinar starts the round without the lesson intro; finishing calls markToday and returns to the tab", async () => {
    render(<MemoriaPage />);
    fireEvent.click(screen.getByRole("button", { name: "Treinar" }));
    await flush();
    expect(narratorMock.playNarration).toHaveBeenCalledWith([...lines.memoryAsk, ...lines.memoryFlip]);
    for (let i = 0; i < 2; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Virar o cartão" }));
      await flush();
      fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
      await flush();
    }
    for (let i = 0; i < 2; i++) {
      const text = document.querySelector(".k-bubble b[lang='en']")!.textContent!;
      fireEvent.click(screen.getByRole("button", { name: text.replace("?", "") }));
      await flush();
      fireEvent.click(within(screen.getByRole("status")).getByRole("button", { name: "Continuar" }));
      await flush();
    }
    expect(gradeCards).toHaveBeenCalledTimes(2);
    expect(markToday).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await flush();
    expect(screen.getByRole("button", { name: "Treinar" })).toBeInTheDocument();
  });
});

describe("MemoriaPage with nothing due", () => {
  it("tomorrow: 'Tudo em dia! Amanhã tem mais cartões.' and 'Próximo treino: amanhã', no Treinar", async () => {
    memory = Object.fromEntries([card("bear", "2026-11-13", 1), card("bird", "2026-11-20", 2)]);
    render(<MemoriaPage />);
    await flush();
    expect(screen.getByText(lines.memoryEmpty[0].text)).toBeInTheDocument();
    expect(narratorMock.playNarration).toHaveBeenCalledWith(lines.memoryEmpty);
    expect(screen.getByText("Próximo treino: amanhã")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Treinar" })).not.toBeInTheDocument();
    expect(document.querySelector(".k-pile")).toHaveClass("is-faded");
  });

  it("later: the bubble stays 'Tudo em dia!' and the chip says in how many days", async () => {
    memory = Object.fromEntries([card("bear", "2026-11-17", 2)]);
    render(<MemoriaPage />);
    await flush();
    expect(screen.getByText(lines.memoryEmptyLater[0].text)).toBeInTheDocument();
    expect(narratorMock.playNarration).toHaveBeenCalledWith(lines.memoryEmptyLater);
    expect(screen.getByText("Próximo treino: em 5 dias")).toBeInTheDocument();
  });

  it("a card due after a moved-back clock is simply not due", () => {
    memory = Object.fromEntries([card("bear", "2027-01-01", 3)]);
    render(<MemoriaPage />);
    expect(screen.queryByRole("button", { name: "Treinar" })).not.toBeInTheDocument();
    expect(screen.getByText(/Próximo treino: em 50 dias/)).toBeInTheDocument();
  });
});

describe("MemoriaPage with no cards at all", () => {
  it("says to finish a lesson, with no pile and no Treinar", async () => {
    render(<MemoriaPage />);
    await flush();
    expect(screen.getByText(lines.memoryNone[0].text)).toBeInTheDocument();
    expect(narratorMock.playNarration).toHaveBeenCalledWith(lines.memoryNone);
    expect(document.querySelector(".k-pile")).toBeNull();
    expect(screen.queryByRole("button", { name: "Treinar" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Próximo treino/)).not.toBeInTheDocument();
  });

  it("says nothing before the stored progress has loaded", async () => {
    hydrated = false;
    memory = Object.fromEntries([card("bear", TODAY)]);
    render(<MemoriaPage />);
    await flush();
    expect(narratorMock.playNarration).not.toHaveBeenCalled();
    expect(screen.queryByText(lines.memoryNone[0].text)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Treinar" })).not.toBeInTheDocument();
  });

  it("has no speaker button on the 'nothing yet' bubble (as the approved picture); the line is said on arrival", async () => {
    render(<MemoriaPage />);
    await flush();
    expect(screen.queryByRole("button", { name: "Ouvir de novo" })).not.toBeInTheDocument();
  });
});

describe("MemoriaPage with the tree's cards", () => {
  it("trains letras cards too: a round keeps one unit, the letter card shows its glyph and asks among letters", async () => {
    memory = {
      "letras-1:letter-b": { box: 0, due: "2026-11-10" },
      "letras-1:letter-a": { box: 0, due: TODAY },
      "forest-animals:bear": { box: 0, due: TODAY },
    };
    render(<MemoriaPage />);
    await flush();
    expect(screen.getByText("2", { exact: true })).toBeInTheDocument(); // the count is the letters' round (the bear waits)
    fireEvent.click(screen.getByRole("button", { name: "Treinar" }));
    await flush();
    expect(screen.getByText("1 de 2")).toBeInTheDocument(); // the letters' round: the bear waits for the next one
    const front = screen.getByRole("button", { name: "Virar o cartão" });
    expect(front.querySelector('svg[aria-label="B"]')).not.toBeNull();
    fireEvent.click(front);
    fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    fireEvent.click(screen.getByRole("button", { name: "Virar o cartão" }));
    fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    await flush();
    const options = [...document.querySelectorAll("button[data-card]")].map((b) => b.getAttribute("data-card"));
    expect(options.length).toBeGreaterThanOrEqual(2);
    for (const id of options) expect(id).toMatch(/^letter-/);
  });
});
