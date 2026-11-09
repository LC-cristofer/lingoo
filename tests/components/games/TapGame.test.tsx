import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { narrator } from "@/audio/narrator";
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

const played = () => vi.mocked(narrator.play).mock.calls.map(([m]) => m.text);

/** Like the real narrator: a new play interrupts the previous one, whose promise then resolves. */
function interruptingNarrator() {
  let interrupt: (() => void) | null = null;
  vi.mocked(narrator.play).mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        interrupt?.();
        interrupt = resolve;
      }),
  );
  return () => interrupt?.(); // ends the current line
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(narrator.play).mockClear();
  vi.mocked(narrator.play).mockImplementation(() => Promise.resolve());
});
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

  it("wrong then a quick right: 'Great job!' is not cut by a replay of the answered prompt", async () => {
    interruptingNarrator();
    render(<TapGame step={step} cards={cards} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "fox" })); // wrong: "Let's try again!"
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    fireEvent.click(screen.getByRole("button", { name: "bear" })); // right, interrupts the encouragement
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500); // still before the 1200 ms release
    });
    expect(played().at(-1)).toBe("Great job!");
    expect(played().filter((t) => t === "Find the bear")).toHaveLength(1); // only on mount
  });

  it("two quick wrong taps repeat the prompt once, after the last encouragement", async () => {
    const endLine = interruptingNarrator();
    render(<TapGame step={step} cards={cards} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "fox" }));
    fireEvent.click(screen.getByRole("button", { name: "owl" }));
    await act(async () => {
      endLine(); // the second "Let's try again!" ends
    });
    expect(played()).toEqual(["Find the bear", "Let's try again!", "Let's try again!", "Find the bear"]);
  });

  it("after a wrong answer the prompt is repeated once the encouragement ends", async () => {
    const endLine = interruptingNarrator();
    render(<TapGame step={step} cards={cards} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "fox" }));
    await act(async () => {
      endLine();
    });
    expect(played()).toEqual(["Find the bear", "Let's try again!", "Find the bear"]);
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
