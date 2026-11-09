import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DragGame } from "@/components/games/DragGame";
import type { DragStep } from "@/domain/content-schema";
import { cards } from "./helpers";

vi.mock("@/audio/narrator", () => ({
  narrator: { play: vi.fn(() => Promise.resolve()), stop: vi.fn(), unlock: vi.fn(), isUnlocked: () => true },
}));

const step: DragStep = { kind: "drag", id: "d1", cardIds: cards.map((c) => c.id) };
const mood = (c: HTMLElement) => c.querySelector("[data-mood]")?.getAttribute("data-mood");

function dragTo(word: string, target: Element) {
  (document as unknown as { elementFromPoint: unknown }).elementFromPoint = vi.fn(() => target);
  const btn = screen.getByRole("button", { name: word });
  fireEvent.pointerDown(btn, { pointerId: 1, clientX: 5, clientY: 5 });
  fireEvent.pointerUp(btn, { pointerId: 1, clientX: 50, clientY: 50 });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("DragGame", () => {
  it("matches a word dropped on its image", () => {
    const { container } = render(<DragGame step={step} cards={cards} onDone={vi.fn()} />);
    dragTo("fox", container.querySelector('[data-drop-target="fox"]')!);
    expect(screen.queryByRole("button", { name: "fox" })).toBeNull();
    expect(container.querySelector('[data-drop-target="fox"]')).toHaveAttribute("data-matched", "true");
    expect(mood(container)).toBe("happy");
  });

  it("dragged word ignores pointer events so elementFromPoint sees the target", () => {
    render(<DragGame step={step} cards={cards} onDone={vi.fn()} />);
    (document as unknown as { elementFromPoint: unknown }).elementFromPoint = vi.fn(() => document.body);
    const btn = screen.getByRole("button", { name: "fox" });
    fireEvent.pointerDown(btn, { pointerId: 1, clientX: 5, clientY: 5 });
    expect(btn.style.pointerEvents).toBe("none");
    fireEvent.pointerUp(btn, { pointerId: 1, clientX: 5, clientY: 5 });
    expect(btn.style.pointerEvents).not.toBe("none");
  });

  it("narrates an instruction on mount", async () => {
    const { narrator } = await import("@/audio/narrator");
    render(<DragGame step={step} cards={cards} onDone={vi.fn()} />);
    expect(narrator.play).toHaveBeenCalledWith({ text: "Match the words!" });
  });

  it("the mascot stops talking once the touched word has been spoken", async () => {
    const { container } = render(<DragGame step={step} cards={cards} onDone={vi.fn()} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: "fox" }), { pointerId: 1, clientX: 5, clientY: 5 });
    expect(mood(container)).toBe("talking");
    await act(async () => {}); // the word's narration settles while the finger still holds it
    expect(mood(container)).toBe("idle");
  });

  it("a drop before the word's narration settles keeps its own mood", async () => {
    const { container } = render(<DragGame step={step} cards={cards} onDone={vi.fn()} />);
    dragTo("fox", container.querySelector('[data-drop-target="fox"]')!);
    await act(async () => {});
    expect(mood(container)).toBe("happy");
    dragTo("owl", container.querySelector('[data-drop-target="bear"]')!);
    await act(async () => {});
    expect(mood(container)).toBe("encourage");
  });

  it("dropping outside any target returns the word without an error", () => {
    const { container } = render(<DragGame step={step} cards={cards} onDone={vi.fn()} />);
    dragTo("fox", document.body);
    expect(screen.getByRole("button", { name: "fox" })).toBeInTheDocument();
    expect(mood(container)).not.toBe("encourage");
  });

  it("dropping on the wrong image encourages", () => {
    const { container } = render(<DragGame step={step} cards={cards} onDone={vi.fn()} />);
    dragTo("fox", container.querySelector('[data-drop-target="owl"]')!);
    expect(screen.getByRole("button", { name: "fox" })).toBeInTheDocument();
    expect(mood(container)).toBe("encourage");
  });

  it("calls onDone once after matching all 5", async () => {
    const onDone = vi.fn();
    const { container } = render(<DragGame step={step} cards={cards} onDone={onDone} />);
    for (const c of cards) dragTo(c.word, container.querySelector(`[data-drop-target="${c.id}"]`)!);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
