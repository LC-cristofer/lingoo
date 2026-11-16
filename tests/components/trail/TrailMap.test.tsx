import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Narration } from "@/domain/trail/schema";
import { emptyProgress, type Progress } from "@/domain/trail/progress";

const narratorMock = vi.hoisted(() => ({
  playNarration: vi.fn<(n: Narration) => Promise<void>>(() => Promise.resolve()),
  playSfx: vi.fn(),
  stop: vi.fn(),
  unlock: vi.fn(),
  isUnlocked: vi.fn(() => true),
}));
vi.mock("@/audio/narrator", () => ({ narrator: narratorMock }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { TrailMap } from "@/components/trail/TrailMap";
import { getLines, getPath, getUnit } from "@/domain/trail/content";

const path = getPath();
const unit = getUnit("forest-animals")!;
const units = { [unit.id]: unit };
const lines = getLines();
const LABELS = ["Música", "Lição 1", "Lição 2", "Lição 3", "História", "Desafio"];

function renderMap(progress: Progress, onOpenStop = vi.fn()) {
  render(<TrailMap path={path} units={units} progress={progress} onOpenStop={onOpenStop} form="phone" />);
  return { onOpenStop };
}
const withDone = (...slugs: string[]): Progress => ({
  ...emptyProgress(),
  completedStops: Object.fromEntries(slugs.map((s) => [`forest-animals/${s}`, "2026-11-10T12:00:00.000Z"])),
});

beforeEach(() => {
  for (const fn of Object.values(narratorMock)) fn.mockClear();
});

describe("TrailMap", () => {
  it("with no progress, Música is the current stop and the other five are locked", () => {
    renderMap(emptyProgress());
    const stops = LABELS.map((l) => screen.getByRole("button", { name: l }));
    expect(stops[0]).toHaveAttribute("data-state", "current");
    for (const s of stops.slice(1)) expect(s).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText(/Vamos!/)).toBeInTheDocument();
  });

  it("after the song, Música is done, Lição 1 is current, the sign says 1 de 6 and there is one star", () => {
    renderMap(withDone("song"));
    expect(screen.getByRole("button", { name: "Música" })).toHaveAttribute("data-state", "done");
    expect(screen.getByRole("button", { name: "Lição 1" })).toHaveAttribute("data-state", "current");
    expect(screen.getByText("1 de 6")).toBeInTheDocument();
    expect(screen.getByLabelText("1 estrelas")).toBeInTheDocument();
  });

  it("tapping a locked stop says it is locked and does not open it", () => {
    const { onOpenStop } = renderMap(emptyProgress());
    fireEvent.click(screen.getByRole("button", { name: "Lição 2" }));
    expect(narratorMock.playNarration).toHaveBeenCalledWith(lines.lockedStop);
    expect(onOpenStop).not.toHaveBeenCalled();
  });

  it("a double tap on the current stop opens it once", () => {
    const { onOpenStop } = renderMap(withDone("song"));
    const current = screen.getByRole("button", { name: "Lição 1" });
    fireEvent.click(current);
    fireEvent.click(current);
    expect(onOpenStop).toHaveBeenCalledTimes(1);
    expect(onOpenStop).toHaveBeenCalledWith("forest-animals/lesson-1");
  });

  it("a done stop can be played again", () => {
    const { onOpenStop } = renderMap(withDone("song"));
    fireEvent.click(screen.getByRole("button", { name: "Música" }));
    expect(onOpenStop).toHaveBeenCalledWith("forest-animals/song");
  });

  it("the unit sign says the unit's name; a coming unit says it is coming", () => {
    renderMap(emptyProgress());
    fireEvent.click(screen.getByRole("button", { name: /Unidade 1/ }));
    expect(narratorMock.playNarration).toHaveBeenLastCalledWith(unit.banner);
    fireEvent.click(screen.getByRole("button", { name: /Unidade 2/ }));
    expect(narratorMock.playNarration).toHaveBeenLastCalledWith(lines.soonUnit);
    expect(screen.getAllByRole("button", { name: /Unidade \d/ })).toHaveLength(path.length);
  });

  it("marks the days played this week", () => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const { container } = render(
      <TrailMap path={path} units={units} progress={{ ...emptyProgress(), daysPlayed: [today] }} onOpenStop={vi.fn()} form="tablet" />,
    );
    expect(container.querySelector(".k-day.is-today.is-on")).not.toBeNull();
  });

  it("has the Trilha and Álbum tabs and no Memória", () => {
    renderMap(emptyProgress());
    expect(screen.getAllByRole("link").map((l) => l.textContent)).toEqual(["Trilha", "Álbum"]);
  });
});
