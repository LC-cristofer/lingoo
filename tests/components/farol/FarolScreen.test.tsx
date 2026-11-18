import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Progress } from "@/domain/trail/progress";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("@/audio/narrator", () => ({
  narrator: { playNarration: vi.fn(() => Promise.resolve()), playSfx: vi.fn(), stop: vi.fn(), unlock: vi.fn(), isUnlocked: vi.fn(() => true) },
}));
let progress: Progress;
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({ progress, hydrated: true, finishStop: vi.fn(), markToday: vi.fn() }),
}));
// Reduced motion: no camera travel, so the stops are tappable at once.
vi.mock("@/components/nestoy/SettingsProvider", () => ({
  useSettings: () => ({ settings: { motion: "reduzir" }, update: vi.fn(), hydrated: true }),
}));

import { FarolScreen } from "@/components/farol/FarolScreen";
import { narrator } from "@/audio/narrator";
import { getLines } from "@/domain/trail/content";

const LABELS = ["Música", "Lição 1", "Lição 2", "Lição 3", "História", "Desafio"];
const empty = (): Progress => ({ completedStops: {}, stickers: {}, daysPlayed: [], memory: {}, version: 3, legacy: null });
const withSong = (): Progress => ({ ...empty(), completedStops: { "forest-animals/song": "2026-01-01T00:00:00.000Z" } });
const stop = (label: string) => screen.getByRole("button", { name: label });

beforeEach(() => {
  push.mockClear();
  vi.mocked(narrator.playNarration).mockClear();
  progress = withSong();
});

describe("FarolScreen", () => {
  it("shows the six stops of the unit, labelled by title", () => {
    render(<FarolScreen />);
    for (const l of LABELS) expect(stop(l)).toBeInTheDocument();
    expect(screen.getAllByRole("button").filter((b) => b.hasAttribute("data-status"))).toHaveLength(6);
  });

  it("with the song done: Música done, Lição 1 current, the rest locked", () => {
    render(<FarolScreen />);
    expect(stop("Música")).toHaveAttribute("data-status", "done");
    expect(stop("Lição 1")).toHaveAttribute("data-status", "current");
    for (const l of ["Lição 2", "Lição 3", "História", "Desafio"]) expect(stop(l)).toHaveAttribute("data-status", "locked");
  });

  it("the card names the farol and the unit, with the count", () => {
    render(<FarolScreen />);
    const card = screen.getByTestId("nino-card");
    expect(card).toHaveTextContent("Farol das Línguas");
    expect(card).toHaveTextContent("Unidade 1: Animais da floresta");
    expect(card).toHaveTextContent("1 de 6");
  });

  it("the count in the card follows the progress, even after a locked tap changed its line", () => {
    const { rerender } = render(<FarolScreen />);
    fireEvent.click(stop("Lição 3"));
    expect(screen.getByTestId("nino-card")).toHaveTextContent("1 de 6");
    progress = { ...withSong(), completedStops: { ...withSong().completedStops, "forest-animals/lesson-1": "2026-01-01T00:00:00.000Z" } };
    rerender(<FarolScreen />);
    expect(screen.getByTestId("nino-card")).toHaveTextContent("2 de 6");
  });

  it("the current stop opens its page", () => {
    render(<FarolScreen />);
    fireEvent.click(stop("Lição 1"));
    expect(push).toHaveBeenCalledWith("/parada/forest-animals/lesson-1");
  });

  it("a done stop can be played again", () => {
    render(<FarolScreen />);
    fireEvent.click(stop("Música"));
    expect(push).toHaveBeenCalledWith("/parada/forest-animals/song");
  });

  it("a locked stop only says so, in the card, and does not navigate", () => {
    render(<FarolScreen />);
    fireEvent.click(stop("Lição 3"));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByTestId("nino-card")).toHaveTextContent("Essa parada ainda está trancada. Termine a anterior primeiro!");
    expect(narrator.playNarration).toHaveBeenCalledWith(getLines().lockedStop);
  });

  it("the back button goes to the start page", () => {
    render(<FarolScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("says the climb line once per visit", async () => {
    const { rerender } = render(<FarolScreen />);
    await act(async () => {});
    rerender(<FarolScreen />);
    const climb = vi.mocked(narrator.playNarration).mock.calls.filter(([n]) => n === getLines().farolClimb);
    expect(climb).toHaveLength(1);
  });

  it("with nothing done, the first stop is the current one", () => {
    progress = empty();
    render(<FarolScreen />);
    expect(stop("Música")).toHaveAttribute("data-status", "current");
    expect(screen.getByTestId("nino-card")).toHaveTextContent("0 de 6");
  });

  it("with the whole unit done, every stop is done and the card celebrates the lamp", () => {
    progress = { ...empty(), completedStops: Object.fromEntries(["song", "lesson-1", "lesson-2", "lesson-3", "story", "challenge"].map((s) => [`forest-animals/${s}`, "2026-01-01T00:00:00.000Z"])) };
    render(<FarolScreen />);
    for (const l of LABELS) expect(stop(l)).toHaveAttribute("data-status", "done");
    expect(screen.getByTestId("nino-card")).toHaveTextContent("6 de 6");
  });
});
