import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LessonStop, Narration } from "@/domain/trail/schema";

const narratorMock = vi.hoisted(() => ({
  playNarration: vi.fn<(n: Narration) => Promise<void>>(() => Promise.resolve()),
  playSfx: vi.fn(),
  stop: vi.fn(),
  unlock: vi.fn(),
  isUnlocked: vi.fn(() => true),
}));
vi.mock("@/audio/narrator", () => ({ narrator: narratorMock }));

import { ExerciseLoop } from "@/components/trail/stop/ExerciseLoop";
import { getLines, getUnit } from "@/domain/trail/content";

const unit = getUnit("forest-animals")!;
const lines = getLines();
// Lesson 1 starts with: intro bear, then "which is the bear?" (bear vs bird).
const exercises = (unit.stops[1] as LessonStop).exercises.slice(0, 2);

const flush = async () => {
  await act(async () => {});
  await act(async () => {});
};
const sheetContinue = () => within(screen.getByTestId("feedback-area")).getByRole("button", { name: "Continuar" });

function renderLoop() {
  const onFinished = vi.fn();
  const onExit = vi.fn();
  render(
    <ExerciseLoop exercises={exercises} loopId="test" words={unit.words} lines={lines} onExit={onExit} onFinished={onFinished} />,
  );
  return { onFinished, onExit };
}

async function passIntro() {
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await flush();
  fireEvent.click(sheetContinue());
  await flush();
}

beforeEach(() => {
  vi.useFakeTimers();
  for (const fn of Object.values(narratorMock)) fn.mockClear();
  narratorMock.playNarration.mockImplementation(() => Promise.resolve());
});
afterEach(() => vi.useRealTimers());

describe("ExerciseLoop", () => {
  it("calls onFinished once after the last exercise", async () => {
    const { onFinished } = renderLoop();
    await flush();
    await passIntro();
    expect(onFinished).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "bear" }));
    await flush();
    fireEvent.click(sheetContinue());
    await flush();
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it("a double tap on the last Continuar still finishes once", async () => {
    const { onFinished } = renderLoop();
    await flush();
    await passIntro();
    fireEvent.click(screen.getByRole("button", { name: "bear" }));
    await flush();
    const button = sheetContinue();
    fireEvent.click(button);
    fireEvent.click(button);
    await flush();
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it("an exercise answered wrong twice comes back once before finishing", async () => {
    const { onFinished } = renderLoop();
    await flush();
    await passIntro();

    fireEvent.click(screen.getByRole("button", { name: "bird" }));
    await flush(); // retry: "Opa!" plays, then the exercise is handed back
    expect(narratorMock.playNarration).toHaveBeenCalledWith(lines.retry);
    fireEvent.click(screen.getByRole("button", { name: "bird" }));
    await flush();
    expect(screen.getByRole("button", { name: "bear" })).toHaveAttribute("data-state", "hint");
    fireEvent.click(screen.getByRole("button", { name: "bear" }));
    await flush();
    fireEvent.click(sheetContinue());
    await flush();
    expect(onFinished).not.toHaveBeenCalled();

    // The review: the same question again.
    fireEvent.click(screen.getByRole("button", { name: "bear" }));
    await flush();
    fireEvent.click(sheetContinue());
    await flush();
    expect(onFinished).toHaveBeenCalledTimes(1);
  });
});
