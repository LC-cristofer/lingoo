import { act, fireEvent, render, screen } from "@testing-library/react";
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
let progress: Progress = { completedStops: {}, stickers: {}, daysPlayed: [], memory: {}, version: 3, legacy: null };
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({ progress, hydrated, markToday, finishStop }),
}));
const seenRecord = vi.hoisted(() => [] as (boolean | undefined)[]);
const seenExit = vi.hoisted(() => ({ current: null as null | ((reason: "done" | "quit") => void) }));
vi.mock("@/components/trail/StopPlayer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/trail/StopPlayer")>();
  return {
    StopPlayer: (props: ComponentProps<typeof actual.StopPlayer>) => {
      seenRecord.push(props.record);
      seenExit.current = props.onExit;
      return <actual.StopPlayer {...props} />;
    },
  };
});
vi.mock("@/audio/narrator", () => ({
  narrator: {
    playNarration: vi.fn(() => Promise.resolve()),
    playSfx: vi.fn(),
    stop: vi.fn(),
    unlock: vi.fn(),
    isUnlocked: () => true,
  },
}));

import type { ComponentProps } from "react";
import { StopScreen } from "@/app/parada/[unitId]/[stopSlug]/StopScreen";
import { stopHref } from "@/domain/trail/routes";

const DONE: Progress = {
  completedStops: { "forest-animals/song": "2026-01-01T00:00:00.000Z" },
  stickers: {},
  daysPlayed: [],
  memory: {},
  version: 3,
  legacy: null,
};

beforeEach(() => {
  replace.mockClear();
  push.mockClear();
  markToday.mockClear();
  finishStop.mockClear();
  hydrated = true;
  search = "";
  progress = { completedStops: {}, stickers: {}, daysPlayed: [], memory: {}, version: 3, legacy: null };
});

describe("stopHref", () => {
  it("keeps the slash in the stop id", () => {
    expect(stopHref("forest-animals/lesson-1")).toBe("/parada/forest-animals/lesson-1");
  });
});

describe("StopScreen", () => {
  it("sends a locked stop to /farol, but only after hydration", () => {
    hydrated = false;
    const { rerender } = render(<StopScreen stopId="forest-animals/lesson-1" />);
    expect(replace).not.toHaveBeenCalled();
    hydrated = true;
    rerender(<StopScreen stopId="forest-animals/lesson-1" />);
    expect(replace).toHaveBeenCalledWith("/farol");
    expect(screen.queryByRole("button", { name: "Começar" })).not.toBeInTheDocument();
  });

  it("sends an unknown stop to /farol", () => {
    render(<StopScreen stopId="nope/nothing" />);
    expect(replace).toHaveBeenCalledWith("/farol");
  });

  it("renders an open stop and marks today", () => {
    progress = DONE;
    render(<StopScreen stopId="forest-animals/lesson-1" />);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Começar" })).toBeInTheDocument();
    expect(markToday).toHaveBeenCalledTimes(1);
  });

  it("plays the song and the story with their own players", () => {
    const { unmount } = render(<StopScreen stopId="forest-animals/song" />);
    expect(screen.getByRole("button", { name: "Cantar" })).toBeInTheDocument();
    unmount();
    search = "revisao=1";
    render(<StopScreen stopId="forest-animals/story" />);
    expect(screen.getByRole("button", { name: "Começar" })).toBeInTheDocument();
  });

  it("review mode renders a locked stop without marking the day", () => {
    search = "revisao=1";
    render(<StopScreen stopId="forest-animals/lesson-1" />);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Começar" })).toBeInTheDocument();
    expect(markToday).not.toHaveBeenCalled();
  });

  it("review mode: the player gets record=false (so finishing saves nothing) and the exit goes to /revisao", () => {
    search = "revisao=1";
    render(<StopScreen stopId="forest-animals/challenge" />);
    expect(seenRecord.at(-1)).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(push).toHaveBeenCalledWith("/revisao");
    expect(finishStop).not.toHaveBeenCalled();
  });

  it("normal mode: the player records; ✕ goes back to the farol", () => {
    progress = DONE;
    render(<StopScreen stopId="forest-animals/lesson-1" />);
    expect(seenRecord.at(-1)).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(push).toHaveBeenCalledWith("/farol");
  });

  it("finishing a stop goes to the start page with ?volta=<stop id>", () => {
    progress = DONE;
    render(<StopScreen stopId="forest-animals/lesson-1" />);
    act(() => seenExit.current!("done"));
    expect(push).toHaveBeenCalledWith("/?volta=forest-animals%2Flesson-1");
  });

  it("review mode: finishing also goes back to /revisao", () => {
    search = "revisao=1";
    render(<StopScreen stopId="forest-animals/lesson-1" />);
    act(() => seenExit.current!("done"));
    expect(push).toHaveBeenCalledWith("/revisao");
  });
  it("a stop in a closed branch of the tree goes back to /arvore, not to the farol", () => {
    render(<StopScreen stopId="letras-2/song" />);
    expect(replace).toHaveBeenCalledWith("/arvore");
  });

  it("a locked stop inside an open branch goes to /arvore too", () => {
    render(<StopScreen stopId="letras-1/lesson-1" />);
    expect(replace).toHaveBeenCalledWith("/arvore");
  });

  it("an open letras stop renders, and quitting goes back up the tree", () => {
    progress = { ...DONE, completedStops: { "letras-1/song": "2026-01-01T00:00:00.000Z" } };
    render(<StopScreen stopId="letras-1/lesson-1" />);
    expect(replace).not.toHaveBeenCalled();
    act(() => seenExit.current!("quit"));
    expect(push).toHaveBeenCalledWith("/arvore");
  });

  it("the next branch opens once the challenge of the one before is done", () => {
    progress = { ...DONE, completedStops: { "letras-1/challenge": "2026-01-01T00:00:00.000Z" } };
    render(<StopScreen stopId="letras-2/song" />);
    expect(replace).not.toHaveBeenCalled();
  });
});
