import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TapGame } from "@/components/games/TapGame";
import type { TapStep } from "@/domain/content-schema";
import { cards } from "./helpers";

vi.mock("@/audio/narrator", () => ({
  narrator: { play: vi.fn(() => Promise.resolve()), stop: vi.fn(), unlock: vi.fn(), isUnlocked: () => true },
}));

const step: TapStep = {
  kind: "tap",
  id: "tap1",
  rounds: [
    { prompt: { text: "Find the bear" }, optionIds: ["bear", "fox", "owl"], answerId: "bear" },
    { prompt: { text: "Find the fox" }, optionIds: ["bear", "fox", "owl"], answerId: "fox" },
    { prompt: { text: "Find the owl" }, optionIds: ["bear", "fox", "owl"], answerId: "owl" },
  ],
};

const mood = (c: HTMLElement) => c.querySelector("[data-mood]")?.getAttribute("data-mood");

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("TapGame", () => {
  it("calls onDone once after the 3 correct answers", async () => {
    const onDone = vi.fn();
    render(<TapGame step={step} cards={cards} onDone={onDone} />);
    for (const word of ["bear", "fox", "owl"]) {
      fireEvent.click(screen.getByRole("button", { name: word }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1300);
      });
    }
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("wrong answer does not advance and the mascot encourages", async () => {
    const onDone = vi.fn();
    const { container } = render(<TapGame step={step} cards={cards} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: "fox" }));
    expect(mood(container)).toBe("encourage");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(onDone).not.toHaveBeenCalled();
    // still round 1: bear is still the answer
    fireEvent.click(screen.getByRole("button", { name: "bear" }));
    expect(mood(container)).toBe("happy");
    expect(container.textContent?.toLowerCase()).not.toContain("errado");
  });

  it("3 rapid taps on the right option advance only one round", async () => {
    const onDone = vi.fn();
    const { container } = render(<TapGame step={step} cards={cards} onDone={onDone} />);
    const bear = screen.getByRole("button", { name: "bear" });
    fireEvent.click(bear);
    fireEvent.click(bear);
    fireEvent.click(bear);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    // now in round 2 (answer fox): tapping fox is a hit, not a done
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "fox" }));
    expect(mood(container)).toBe("happy");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(onDone).not.toHaveBeenCalled(); // round 3 pending
  });
});
