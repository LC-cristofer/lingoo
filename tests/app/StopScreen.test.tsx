import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Progress } from "@/domain/trail/progress";

const replace = vi.fn();
const push = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
  useSearchParams: () => new URLSearchParams(search),
}));

const markToday = vi.fn();
const finishStop = vi.fn();
let hydrated = true;
let progress: Progress = { completedStops: {}, stickers: {}, daysPlayed: [] };
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({ progress, hydrated, markToday, finishStop }),
}));
vi.mock("@/audio/narrator", () => ({
  narrator: {
    playNarration: vi.fn(() => Promise.resolve()),
    playSfx: vi.fn(),
    stop: vi.fn(),
    unlock: vi.fn(),
    isUnlocked: () => true,
  },
}));

import { StopScreen } from "@/app/parada/[unitId]/[stopSlug]/StopScreen";
import { stopHref } from "@/domain/trail/routes";

const DONE: Progress = {
  completedStops: { "forest-animals/song": "2026-01-01T00:00:00.000Z" },
  stickers: {},
  daysPlayed: [],
};

beforeEach(() => {
  replace.mockClear();
  push.mockClear();
  markToday.mockClear();
  finishStop.mockClear();
  hydrated = true;
  search = "";
  progress = { completedStops: {}, stickers: {}, daysPlayed: [] };
});

describe("stopHref", () => {
  it("keeps the slash in the stop id", () => {
    expect(stopHref("forest-animals/lesson-1")).toBe("/parada/forest-animals/lesson-1");
  });
});

describe("StopScreen", () => {
  it("sends a locked stop to /mapa, but only after hydration", () => {
    hydrated = false;
    const { rerender } = render(<StopScreen stopId="forest-animals/lesson-1" />);
    expect(replace).not.toHaveBeenCalled();
    hydrated = true;
    rerender(<StopScreen stopId="forest-animals/lesson-1" />);
    expect(replace).toHaveBeenCalledWith("/mapa");
    expect(screen.queryByRole("button", { name: "Começar" })).not.toBeInTheDocument();
  });

  it("sends an unknown stop to /mapa", () => {
    render(<StopScreen stopId="nope/nothing" />);
    expect(replace).toHaveBeenCalledWith("/mapa");
  });

  it("renders an open stop and marks today", () => {
    progress = DONE;
    render(<StopScreen stopId="forest-animals/lesson-1" />);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Começar" })).toBeInTheDocument();
    expect(markToday).toHaveBeenCalledTimes(1);
  });

  it("shows a placeholder for a song until Task 12", () => {
    render(<StopScreen stopId="forest-animals/song" />);
    expect(screen.getByText("Em construção")).toBeInTheDocument();
  });

  it("review mode renders a locked stop without marking the day", () => {
    search = "revisao=1";
    render(<StopScreen stopId="forest-animals/lesson-1" />);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Começar" })).toBeInTheDocument();
    expect(markToday).not.toHaveBeenCalled();
  });
});
