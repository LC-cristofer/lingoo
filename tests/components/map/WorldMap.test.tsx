import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WorldMap } from "@/components/map/WorldMap";
import { getWorlds } from "@/domain/content";
import { emptyProgress } from "@/domain/progress";

const world = getWorlds()[0];
const titles = world.places.map((p) => p.title);

describe("WorldMap", () => {
  it("opens the first place and keeps the others locked", () => {
    const onOpen = vi.fn();
    render(<WorldMap world={world} progress={emptyProgress()} onOpen={onOpen} />);
    const first = screen.getByRole("button", { name: titles[0] });
    expect(first).not.toHaveAttribute("aria-disabled", "true");
    fireEvent.click(first);
    expect(onOpen).toHaveBeenCalledWith("forest-animals");
    onOpen.mockClear();
    for (const title of titles.slice(1)) {
      const btn = screen.getByRole("button", { name: title });
      expect(btn).toHaveAttribute("aria-disabled", "true");
      fireEvent.click(btn);
    }
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("shows a star on a completed place", () => {
    const progress = { completedLessons: { "forest-animals": "2026-01-01T00:00:00.000Z" }, stickers: {} };
    render(<WorldMap world={world} progress={progress} onOpen={() => {}} />);
    expect(screen.getByRole("button", { name: titles[0] })).toHaveAttribute("data-status", "done");
  });
});
