import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hook = vi.hoisted(() => ({ useBackgroundMusic: vi.fn() }));
vi.mock("@/audio/useBackgroundMusic", () => hook);
vi.mock("@/audio/narrator", () => ({
  narrator: {
    playNarration: vi.fn(() => Promise.resolve()),
    playSfx: vi.fn(),
    stop: vi.fn(),
    unlock: vi.fn(),
    isUnlocked: vi.fn(() => true),
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
let memory: Record<string, { box: number; due: string }> = {};
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({
    progress: { completedStops: { "forest-animals/song": "x" }, stickers: {}, daysPlayed: [], memory },
    hydrated: true,
    finishStop: vi.fn(),
    markToday: vi.fn(),
    gradeCards: vi.fn(),
    addMemoryCards: vi.fn(),
  }),
}));

import AlbumPage from "@/app/album/page";
import MapPage from "@/app/mapa/page";
import MemoriaPage from "@/app/memoria/page";

const calls = () => hook.useBackgroundMusic.mock.calls.map((c) => c[0]);
const flush = async () => {
  await act(async () => {});
  await act(async () => {});
};

beforeEach(() => {
  hook.useBackgroundMusic.mockClear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 12, 10, 0, 0));
  memory = { "forest-animals:bear": { box: 0, due: "2026-11-12" } };
});
afterEach(() => vi.useRealTimers());

describe("music on the screens", () => {
  it("the map plays the trail track and carries the switch", () => {
    render(<MapPage />);
    expect(calls().every((t) => t === "trail")).toBe(true);
    expect(calls().length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /^Música (ligada|desligada)$/ })).toBeInTheDocument();
  });

  it("the album plays the album track and carries the switch", () => {
    render(<AlbumPage />);
    expect(calls().every((t) => t === "album")).toBe(true);
    expect(calls().length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /^Música (ligada|desligada)$/ })).toBeInTheDocument();
  });

  it("the Memória home plays the album track and carries the switch", () => {
    render(<MemoriaPage />);
    expect(calls().at(-1)).toBe("album");
    expect(screen.getByRole("button", { name: /^Música (ligada|desligada)$/ })).toBeInTheDocument();
  });

  it("the Memória round is silent (the child must hear the words) and the music returns with the home", async () => {
    render(<MemoriaPage />);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Treinar" }));
    await flush();
    expect(screen.queryByRole("button", { name: /^Música (ligada|desligada)$/ })).not.toBeInTheDocument();
    expect(calls().at(-1)).toBeNull();
    // leave the round through its close button
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    await flush();
    expect(screen.getByRole("button", { name: "Treinar" })).toBeInTheDocument();
    expect(calls().at(-1)).toBe("album");
  });
});
