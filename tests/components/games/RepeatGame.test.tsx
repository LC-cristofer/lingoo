import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RepeatGame } from "@/components/games/RepeatGame";
import type { RepeatStep } from "@/domain/content-schema";
import { cards } from "./helpers";

vi.mock("@/audio/narrator", () => ({
  narrator: { play: vi.fn(() => Promise.resolve()), stop: vi.fn(), unlock: vi.fn(), isUnlocked: () => true },
}));

const step: RepeatStep = { kind: "repeat", id: "r1", cardIds: cards.map((c) => c.id) };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("RepeatGame", () => {
  it("shows the advance button only after the timer", async () => {
    render(<RepeatGame step={step} cards={cards} onDone={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "next" })).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });
    expect(screen.getByRole("button", { name: "next" })).toBeInTheDocument();
  });

  it("5 advances call onDone once", async () => {
    const onDone = vi.fn();
    render(<RepeatGame step={step} cards={cards} onDone={onDone} />);
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2600);
      });
      fireEvent.click(screen.getByRole("button", { name: "next" }));
    }
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
