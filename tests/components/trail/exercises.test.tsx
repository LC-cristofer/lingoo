import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Exercise, Narration } from "@/domain/trail/schema";

const narratorMock = vi.hoisted(() => ({
  playNarration: vi.fn<(n: Narration) => Promise<void>>(() => Promise.resolve()),
  playSfx: vi.fn(),
  stop: vi.fn(),
}));
vi.mock("@/audio/narrator", () => ({ narrator: narratorMock }));

import { ExerciseView } from "@/components/trail/exercises/ExerciseView";
import { getUnit } from "@/domain/trail/content";
import type { Phase } from "@/domain/trail/session";

const unit = getUnit("forest-animals")!;
const words = unit.words;
const lesson1 = unit.stops[1];
const lesson3 = unit.stops[3];
if (!("exercises" in lesson1) || !("exercises" in lesson3)) throw new Error("lesson stops expected");

function find<K extends Exercise["kind"]>(list: Exercise[], kind: K, nth = 0): Extract<Exercise, { kind: K }> {
  const found = list.filter((e): e is Extract<Exercise, { kind: K }> => e.kind === kind)[nth];
  if (!found) throw new Error(`no ${kind}`);
  return found;
}

const intro = find(lesson1.exercises, "intro");
const listenTap = find(lesson1.exercises, "listenTap"); // bear vs bird, answer bear
const trueFalseFalse = find(lesson1.exercises, "trueFalse"); // frog, "This is a bird!", isTrue=false
const matchPairs = find(lesson1.exercises, "matchPairs"); // bear, bird, frog
const tapRepeat = find(lesson1.exercises, "tapRepeat"); // bear, bird, frog
const whatsMissing = find(lesson3.exercises, "whatsMissing"); // shown bear, frog, snake; missing bird

function setup(exercise: Exercise, phase: Phase = "answering") {
  const onAnswer = vi.fn();
  const onDone = vi.fn();
  const onCatExpression = vi.fn();
  const view = (p: Phase) => (
    <ExerciseView
      exercise={exercise}
      words={words}
      phase={p}
      onAnswer={onAnswer}
      onDone={onDone}
      onCatExpression={onCatExpression}
    />
  );
  const utils = render(view(phase));
  return { ...utils, onAnswer, onCatExpression, setPhase: (p: Phase) => utils.rerender(view(p)) };
}

const card = (container: HTMLElement, id: string) =>
  container.querySelector<HTMLButtonElement>(`button[data-card="${id}"]`)!;
const wordButton = (container: HTMLElement, id: string) =>
  container.querySelector<HTMLButtonElement>(`button[data-word="${id}"]`)!;
const flush = () => act(async () => {});

beforeEach(() => {
  vi.useFakeTimers();
  narratorMock.playNarration.mockClear();
  narratorMock.playNarration.mockImplementation(() => Promise.resolve());
  narratorMock.playSfx.mockClear();
  narratorMock.stop.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("ListenTap", () => {
  it("plays the prompt on mount", async () => {
    setup(listenTap);
    await flush();
    expect(narratorMock.playNarration).toHaveBeenCalledWith(listenTap.prompt);
  });

  it("right card → onAnswer(true), with tap sfx and the word spoken", async () => {
    const { container, onAnswer } = setup(listenTap);
    await flush();
    fireEvent.click(card(container, listenTap.answerId));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true);
    expect(narratorMock.playSfx).toHaveBeenCalledWith("tap");
    expect(narratorMock.playNarration).toHaveBeenLastCalledWith(words.find((w) => w.id === "bear")!.say);
  });

  it("wrong card → onAnswer(false)", async () => {
    const { container, onAnswer } = setup(listenTap);
    await flush();
    fireEvent.click(card(container, "bird"));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("cards have no visible text and an English accessible name", async () => {
    const { container } = setup(listenTap);
    await flush();
    const bear = card(container, "bear");
    expect(bear.textContent).toBe("");
    expect(bear).toHaveAttribute("aria-label", "bear");
    expect(bear).toHaveAttribute("lang", "en");
  });

  it("Review Focus 2: after a right tap and phase → correct, another tap does not call onAnswer", async () => {
    const { container, onAnswer, setPhase } = setup(listenTap);
    await flush();
    fireEvent.click(card(container, "bear"));
    fireEvent.click(card(container, "bird")); // rapid second tap before the parent re-renders
    setPhase("correct");
    fireEvent.click(card(container, "bird"));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true);
    expect(card(container, "bird")).toBeDisabled();
  });

  it("taps count again once the phase returns to answering", async () => {
    const { container, onAnswer, setPhase } = setup(listenTap);
    await flush();
    fireEvent.click(card(container, "bird"));
    setPhase("retry");
    setPhase("answering");
    fireEvent.click(card(container, "bear"));
    expect(onAnswer.mock.calls).toEqual([[false], [true]]);
  });

  it('phase="hint" puts data-glow on the answer only', async () => {
    const { container } = setup(listenTap, "hint");
    await flush();
    expect(card(container, "bear").querySelector('[data-glow="true"]')).not.toBeNull();
    expect(card(container, "bird").querySelector('[data-glow="true"]')).toBeNull();
    expect(card(container, "bear")).toBeEnabled();
  });

  it('phase="hint": a wrong tap does not lock the cards, the right tap still reports true', async () => {
    const { container, onAnswer } = setup(listenTap, "hint");
    await flush();
    fireEvent.click(card(container, "bird"));
    fireEvent.click(card(container, "bear"));
    expect(onAnswer).toHaveBeenLastCalledWith(true);
  });

  it("stops the narration on unmount", async () => {
    const { unmount } = setup(listenTap);
    await flush();
    unmount();
    expect(narratorMock.stop).toHaveBeenCalled();
  });
});

describe("TrueFalse", () => {
  it("shows the animal and plays say on mount", async () => {
    const { container } = setup(trueFalseFalse);
    await flush();
    expect(container.querySelector('[data-art="frog"]')).not.toBeNull();
    expect(narratorMock.playNarration).toHaveBeenCalledWith(trueFalseFalse.say);
  });

  it("with isTrue=false, 👎 → onAnswer(true)", async () => {
    const { onAnswer } = setup(trueFalseFalse);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Errado" }));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("with isTrue=false, 👍 → onAnswer(false)", async () => {
    const { onAnswer } = setup(trueFalseFalse);
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Certo" }));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("thumb buttons are at least 96 px", async () => {
    setup(trueFalseFalse);
    await flush();
    expect(screen.getByRole("button", { name: "Certo" }).className).toMatch(/min-h-\[96px\]/);
  });

  it('phase="hint": wrong thumb then right thumb → onAnswer(true)', async () => {
    const { onAnswer } = setup(trueFalseFalse, "hint");
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Certo" }));
    fireEvent.click(screen.getByRole("button", { name: "Errado" }));
    expect(onAnswer).toHaveBeenLastCalledWith(true);
  });

  it("hint highlights the correct thumb", async () => {
    setup(trueFalseFalse, "hint");
    await flush();
    expect(screen.getByRole("button", { name: "Errado" })).toHaveAttribute("data-glow", "true");
    expect(screen.getByRole("button", { name: "Certo" })).not.toHaveAttribute("data-glow");
  });
});

describe("MatchPairs", () => {
  it("shuffles the images (not in word order) and shows each English word on its button", async () => {
    const { container } = setup(matchPairs);
    await flush();
    const artOrder = [...container.querySelectorAll("button[data-card]")].map((b) => b.getAttribute("data-card"));
    expect([...artOrder].sort()).toEqual([...matchPairs.wordIds].sort());
    expect(artOrder).not.toEqual(matchPairs.wordIds);
    const bear = wordButton(container, "bear");
    expect(bear).toHaveTextContent("bear");
    expect(bear.querySelector('[lang="en"]')).not.toBeNull();
  });

  it("tapping a word button speaks the word", async () => {
    const { container } = setup(matchPairs);
    await flush();
    fireEvent.click(wordButton(container, "bird"));
    expect(narratorMock.playNarration).toHaveBeenLastCalledWith(words.find((w) => w.id === "bird")!.say);
    expect(narratorMock.playSfx).toHaveBeenCalledWith("tap");
  });

  it("a wrong pair → onAnswer(false) once and shakes; the 3 right pairs → onAnswer(true) once", async () => {
    const { container, onAnswer, setPhase } = setup(matchPairs);
    await flush();
    fireEvent.click(card(container, "bear"));
    fireEvent.click(wordButton(container, "bird"));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false);
    expect(card(container, "bear")).toHaveAttribute("data-shake", "true");
    expect(wordButton(container, "bird")).toHaveAttribute("data-shake", "true");
    act(() => vi.advanceTimersByTime(400));
    expect(card(container, "bear")).not.toHaveAttribute("data-shake");

    setPhase("retry");
    setPhase("answering");
    for (const id of ["bear", "bird"]) {
      fireEvent.click(card(container, id));
      fireEvent.click(wordButton(container, id));
      expect(card(container, id)).toHaveAttribute("data-matched", "true");
      expect(wordButton(container, id)).toHaveAttribute("data-matched", "true");
    }
    expect(onAnswer).toHaveBeenCalledTimes(1);
    fireEvent.click(wordButton(container, "frog"));
    fireEvent.click(card(container, "frog"));
    expect(onAnswer.mock.calls).toEqual([[false], [true]]);
  });

  it('phase="hint": a mismatch does not lock; the glowing pair matches and the flow completes', async () => {
    const { container, onAnswer } = setup(matchPairs, "hint");
    await flush();
    fireEvent.click(card(container, "bear"));
    fireEvent.click(wordButton(container, "frog"));
    expect(onAnswer).toHaveBeenLastCalledWith(false);
    for (const id of ["bear", "bird", "frog"]) {
      fireEvent.click(card(container, id));
      fireEvent.click(wordButton(container, id));
      expect(card(container, id)).toHaveAttribute("data-matched", "true");
    }
    expect(onAnswer).toHaveBeenLastCalledWith(true);
    expect(onAnswer.mock.calls.filter(([c]) => c === true)).toHaveLength(1);
  });

  it("hint glows the next unmatched image and its word", async () => {
    const { container } = setup(matchPairs, "hint");
    await flush();
    expect(card(container, "bear").querySelector('[data-glow="true"]')).not.toBeNull();
    expect(wordButton(container, "bear")).toHaveAttribute("data-glow", "true");
    expect(card(container, "bird").querySelector('[data-glow="true"]')).toBeNull();
  });
});

describe("WhatsMissing", () => {
  const shownRow = (container: HTMLElement) => container.querySelector('[data-row="shown"]')!;
  const visibleShown = (container: HTMLElement) =>
    [...shownRow(container).querySelectorAll("[data-slot]")]
      .filter((s) => s.getAttribute("data-hidden") !== "true")
      .map((s) => s.getAttribute("data-slot"));

  it("before 2 s the 4 cards are visible; after it the missing one is not; choosing it → true", async () => {
    const { container, onAnswer } = setup(whatsMissing);
    await flush();
    expect(visibleShown(container).sort()).toEqual([...whatsMissing.shownIds, whatsMissing.missingId].sort());
    expect(container.querySelector('[data-row="options"]')).toBeNull();
    act(() => vi.advanceTimersByTime(1999));
    expect(visibleShown(container)).toContain("bird");

    act(() => vi.advanceTimersByTime(1));
    expect(visibleShown(container)).not.toContain("bird");
    expect(container.querySelector('[data-bush="true"]')).not.toBeNull();

    act(() => vi.advanceTimersByTime(2000));
    expect(visibleShown(container).sort()).toEqual([...whatsMissing.shownIds].sort());
    const options = container.querySelector('[data-row="options"]')!;
    expect(options.querySelectorAll("button[data-card]")).toHaveLength(whatsMissing.optionIds.length);

    fireEvent.click(card(container, "bird"));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true);
    expect(visibleShown(container)).toContain("bird");
  });

  it("a wrong choice → onAnswer(false), and each choice speaks its name", async () => {
    const { container, onAnswer } = setup(whatsMissing);
    await flush();
    act(() => vi.advanceTimersByTime(5000));
    fireEvent.click(card(container, "mouse"));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false);
    expect(narratorMock.playNarration).toHaveBeenLastCalledWith(words.find((w) => w.id === "mouse")!.say);
    expect(visibleShown(container)).not.toContain("bird");
  });

  it("clears its timers on unmount", async () => {
    const { unmount } = setup(whatsMissing);
    await flush();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("TapRepeat", () => {
  it('"Continuar" only appears after the 3 taps, and calls onAnswer(true)', async () => {
    const { container, onAnswer } = setup(tapRepeat);
    await flush();
    for (const [i, item] of tapRepeat.items.entries()) {
      expect(screen.queryByRole("button", { name: "Continuar" })).toBeNull();
      fireEvent.click(card(container, item.wordId));
      expect(narratorMock.playNarration).toHaveBeenLastCalledWith(item.say);
      if (i === 0) fireEvent.click(card(container, item.wordId)); // repeat tap does not count twice
    }
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('hides its own "Continuar" once the phase is no longer answering (the strip has one)', async () => {
    const { container, setPhase } = setup(tapRepeat);
    await flush();
    for (const item of tapRepeat.items) fireEvent.click(card(container, item.wordId));
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
    setPhase("correct");
    expect(screen.queryByRole("button", { name: "Continuar" })).not.toBeInTheDocument();
  });

  it("each tap sets the cat to listening for 1.5 s, then pointing", async () => {
    const { container, onCatExpression } = setup(tapRepeat);
    await flush();
    fireEvent.click(card(container, "bear"));
    expect(onCatExpression).toHaveBeenLastCalledWith("listening");
    act(() => vi.advanceTimersByTime(1499));
    expect(onCatExpression).not.toHaveBeenCalledWith("pointing");
    act(() => vi.advanceTimersByTime(1));
    expect(onCatExpression).toHaveBeenLastCalledWith("pointing");
  });

  it("does not play the prompt itself", async () => {
    setup(tapRepeat);
    await flush();
    expect(narratorMock.playNarration).not.toHaveBeenCalled();
  });
});

describe("Intro", () => {
  it("shows the big animal and the English word, and the button appears after playNarration resolves", async () => {
    let resolve!: () => void;
    narratorMock.playNarration.mockImplementationOnce(() => new Promise<void>((r) => (resolve = r)));
    const { container, onAnswer } = setup(intro);
    await flush();
    expect(narratorMock.playNarration).toHaveBeenCalledWith(intro.say);
    const art = container.querySelector('[data-art="bear"]')!;
    expect(Number(art.getAttribute("width"))).toBeGreaterThanOrEqual(240);
    const word = container.querySelector('p [lang="en"]')!;
    expect(word.textContent).toBe("bear");
    expect(screen.queryByRole("button", { name: "Continuar" })).toBeNull();

    await act(async () => resolve());
    const button = screen.getByRole("button", { name: "Continuar" });
    expect(button).toHaveTextContent("Já repeti!");
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('hides "Já repeti!" once the phase is no longer answering', async () => {
    const { setPhase } = setup(intro);
    await flush();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
    setPhase("correct");
    expect(screen.queryByRole("button", { name: "Continuar" })).not.toBeInTheDocument();
  });

  it("ignores the narration ending after unmount and stops it", async () => {
    let resolve!: () => void;
    narratorMock.playNarration.mockImplementationOnce(() => new Promise<void>((r) => (resolve = r)));
    const { unmount } = setup(intro);
    await flush();
    unmount();
    expect(narratorMock.stop).toHaveBeenCalled();
    await act(async () => resolve());
  });
});
