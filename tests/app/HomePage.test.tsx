import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Narration } from "@/domain/trail/schema";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
const narratorMock = vi.hoisted(() => ({
  playNarration: vi.fn<(n: Narration) => Promise<void>>(() => Promise.resolve()),
  play: vi.fn(() => Promise.resolve()),
  playSfx: vi.fn(),
  stop: vi.fn(),
  unlock: vi.fn(),
  isUnlocked: vi.fn(() => true),
}));
vi.mock("@/audio/narrator", () => ({ narrator: narratorMock }));

import Home from "@/app/page";
import { getLines } from "@/domain/trail/content";

beforeEach(() => {
  push.mockClear();
  for (const fn of Object.values(narratorMock)) fn.mockClear();
});

describe("start screen", () => {
  it("shows the logo, the tagline and the gatinho", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "Lingoo" })).toBeInTheDocument();
    expect(screen.getByText("Inglês para brincar")).toBeInTheDocument();
  });

  it("Jogar unlocks audio, says hello and goes to the map", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Jogar" }));
    expect(narratorMock.unlock).toHaveBeenCalledTimes(1);
    expect(narratorMock.playNarration).toHaveBeenCalledWith(getLines().start);
    expect(push).toHaveBeenCalledWith("/mapa");
  });

  it("a double tap goes to the map once", () => {
    render(<Home />);
    const play = screen.getByRole("button", { name: "Jogar" });
    fireEvent.click(play);
    fireEvent.click(play);
    expect(push).toHaveBeenCalledTimes(1);
  });
});
