import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DaysCalendar } from "@/components/trail/DaysCalendar";
import { TrailMap } from "@/components/trail/TrailMap";
import { getLines, getPath, getUnit } from "@/domain/trail/content";
import { emptyProgress, type Progress } from "@/domain/trail/progress";

vi.mock("@/audio/narrator", () => ({
  narrator: {
    playNarration: vi.fn(() => Promise.resolve()),
    playSfx: vi.fn(),
    stop: vi.fn(),
    unlock: vi.fn(),
    isUnlocked: () => true,
  },
}));
import { narrator } from "@/audio/narrator";

const path = getPath();
const units = { "forest-animals": getUnit("forest-animals")! };
const lines = getLines();
const LABELS = ["Música", "Lição 1", "Lição 2", "Lição 3", "História", "Desafio"];

function renderMap(progress: Progress, onOpenStop = vi.fn()) {
  render(<TrailMap path={path} units={units} progress={progress} onOpenStop={onOpenStop} />);
  return onOpenStop;
}

beforeEach(() => {
  vi.mocked(narrator.playNarration).mockClear();
});

describe("TrailMap", () => {
  it("with empty progress only the song is open; the other five stops are locked", () => {
    renderMap(emptyProgress());
    expect(screen.getByRole("button", { name: "Música" })).not.toHaveAttribute("aria-disabled");
    for (const label of LABELS.slice(1)) {
      expect(screen.getByRole("button", { name: label })).toHaveAttribute("aria-disabled", "true");
    }
  });

  it("after the song is done, it is done and Lição 1 is the current stop with the cat bubble", () => {
    renderMap({ ...emptyProgress(), completedStops: { "forest-animals/song": "2026-01-01T00:00:00.000Z" } });
    expect(screen.getByRole("button", { name: "Música" })).toHaveAttribute("data-state", "done");
    expect(screen.getByRole("button", { name: "Lição 1" })).toHaveAttribute("data-state", "current");
    expect(screen.getByText(/Vamos!/)).toBeInTheDocument();
  });

  it("opens the tapped open stop, done ones included", () => {
    const onOpenStop = renderMap({ ...emptyProgress(), completedStops: { "forest-animals/song": "2026-01-01T00:00:00.000Z" } });
    fireEvent.click(screen.getByRole("button", { name: "Lição 1" }));
    expect(onOpenStop).toHaveBeenLastCalledWith("forest-animals/lesson-1");
    fireEvent.click(screen.getByRole("button", { name: "Música" }));
    expect(onOpenStop).toHaveBeenLastCalledWith("forest-animals/song");
  });

  it("tapping a locked stop plays the locked line and does not navigate", () => {
    const onOpenStop = renderMap(emptyProgress());
    fireEvent.click(screen.getByRole("button", { name: "Lição 3" }));
    expect(narrator.playNarration).toHaveBeenCalledWith(lines.lockedStop);
    expect(onOpenStop).not.toHaveBeenCalled();
  });

  it("the unit sign shows the progress and plays the banner", () => {
    renderMap({ ...emptyProgress(), completedStops: { "forest-animals/song": "x", "forest-animals/lesson-1": "x" } });
    const sign = screen.getByRole("button", { name: "Unidade 1, Animais da floresta" });
    expect(sign).toHaveTextContent("2 de 6");
    fireEvent.click(sign);
    expect(narrator.playNarration).toHaveBeenCalledWith(units["forest-animals"].banner);
  });

  it("the next units follow as locked signs with ghost stops that say 'soon'", () => {
    renderMap(emptyProgress());
    const soon = path.filter((u) => !u.hasContent);
    expect(soon.length).toBeGreaterThan(0);
    const sign = screen.getByRole("button", { name: `Unidade 2, ${soon[0].title}` });
    fireEvent.click(sign);
    expect(narrator.playNarration).toHaveBeenLastCalledWith(lines.soonUnit);
    const ghosts = screen.getAllByRole("button", { name: "Em breve" });
    expect(ghosts).toHaveLength(soon.length * 4);
    fireEvent.click(ghosts[0]);
    expect(narrator.playNarration).toHaveBeenLastCalledWith(lines.soonUnit);
  });

  it("shows the star count from the finished stops", () => {
    renderMap({ ...emptyProgress(), completedStops: { "forest-animals/song": "x", "forest-animals/lesson-1": "x" } });
    expect(screen.getByLabelText("2 estrelas")).toBeInTheDocument();
  });

  it("has the Trilha, Memória and Álbum tabs", () => {
    renderMap(emptyProgress());
    const nav = screen.getByRole("navigation", { name: "Navegação" });
    expect(within(nav).getAllByRole("link").map((l) => l.textContent)).toEqual(["Trilha", "Memória", "Álbum"]);
  });
});

describe("DaysCalendar", () => {
  it("marks the days played in the current week and highlights today", () => {
    const now = new Date(2026, 10, 12, 10, 0, 0); // Thursday 12 Nov 2026
    const progress: Progress = { ...emptyProgress(), daysPlayed: ["2026-11-09", "2026-11-11", "2026-11-12", "2026-11-02"] };
    const { container } = render(<DaysCalendar progress={progress} now={now} />);
    const days = Array.from(container.querySelectorAll(".k-day"));
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.classList.contains("is-on"))).toEqual([true, false, true, true, false, false, false]);
    expect(days.map((d) => d.classList.contains("is-today"))).toEqual([false, false, false, true, false, false, false]);
  });
});
