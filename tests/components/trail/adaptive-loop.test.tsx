import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultProfile, type Profile } from "@/domain/nestoy/profile";
import type { ArtId, Exercise, Narration, StopExercise } from "@/domain/trail/schema";

const narratorMock = vi.hoisted(() => ({
  playNarration: vi.fn<(n: Narration) => Promise<void>>(() => Promise.resolve()),
  playSfx: vi.fn(),
  stop: vi.fn(),
  unlock: vi.fn(),
  isUnlocked: vi.fn(() => true),
}));
vi.mock("@/audio/narrator", () => ({ narrator: narratorMock }));

const setLevel = vi.fn();
let profile: Profile = defaultProfile();
let hydrated = true;
vi.mock("@/components/nestoy/ProfileProvider", () => ({
  useOptionalProfile: () => ({ profile, hydrated, update: vi.fn(), setLevel }),
}));

import { ExerciseLoop } from "@/components/trail/StopFlow";

const LETTERS = ["a", "b", "c", "d", "e", "f"];
const art = (l: string) => `letter-${l}` as ArtId;
const words = LETTERS.map((l) => ({ id: art(l), en: l.toUpperCase(), pt: l, say: [{ lang: "en-US" as const, text: l.toUpperCase() }], ask: [{ lang: "en-US" as const, text: l.toUpperCase() }] }));

/** "Toque no X" with 2, 3 and 4 letter cards at levels 1, 2 and 3. */
function slot(answer: string): StopExercise {
  const others = LETTERS.filter((l) => l !== answer);
  const level = (n: number): Exercise => ({
    kind: "listenTap",
    prompt: [{ lang: "pt-BR", text: "Toque no" }, { lang: "en-US", text: answer.toUpperCase() }],
    optionIds: [answer, ...others.slice(0, n)].map(art),
    answerId: art(answer),
  });
  return { kind: "adaptive", levels: [level(1), level(2), level(3)] };
}

const flush = async () => {
  await act(async () => {});
  await act(async () => {});
};
const cards = () => screen.getAllByRole("button", { name: /^[A-F]$/ });
const feedback = () => screen.getByTestId("feedback-area");

async function tap(id: string) {
  fireEvent.click(screen.getByRole("button", { name: id.toUpperCase() }));
  await flush();
}
async function proceed() {
  fireEvent.click(within(feedback()).getByRole("button", { name: "Continuar" }));
  await flush();
}
/** A wrong first try, then the right card after the retry hands the exercise back. */
async function missThenRight(answer: string, wrong: string) {
  await tap(wrong);
  await flush(); // the retry line ends and the exercise is handed back
  await tap(answer);
  await proceed();
}

function renderLoop(exercises: StopExercise[], adaptive?: { unitId: string; record: boolean }) {
  const onFinished = vi.fn();
  render(<ExerciseLoop exercises={exercises} sessionId="letras-1/lesson-1" words={words} onExit={() => {}} onFinished={onFinished} adaptive={adaptive} />);
  return { onFinished };
}

beforeEach(() => {
  vi.useFakeTimers();
  for (const fn of Object.values(narratorMock)) fn.mockClear();
  narratorMock.playNarration.mockImplementation(() => Promise.resolve());
  setLevel.mockClear();
  profile = defaultProfile();
  hydrated = true;
});
afterEach(() => vi.useRealTimers());

describe("ExerciseLoop with adaptive slots", () => {
  it("starts at the unit's saved level, goes up after 3 first tries and saves the level at the end", async () => {
    profile = { ...defaultProfile(), islands: { descoberta: { letras: { levels: { "letras-1": 2 } } } } };
    const { onFinished } = renderLoop(["a", "b", "c", "d"].map(slot), { unitId: "letras-1", record: true });
    await flush();
    for (const l of ["a", "b", "c"]) {
      expect(cards()).toHaveLength(3);
      await tap(l);
      await proceed();
    }
    expect(cards()).toHaveLength(4);
    await tap("d");
    await proceed();
    expect(onFinished).toHaveBeenCalled();
    expect(setLevel).toHaveBeenCalledWith("letras-1", 3);
  });

  it("without a saved level starts from the age (7: level 2) and goes down after 2 misses", async () => {
    profile = { ...defaultProfile(), age: 7 };
    renderLoop(["a", "b", "c"].map(slot), { unitId: "letras-2", record: true });
    await flush();
    expect(cards()).toHaveLength(3);
    await missThenRight("a", "b");
    expect(cards()).toHaveLength(3);
    await missThenRight("b", "a");
    expect(cards()).toHaveLength(2);
    await tap("c");
    await proceed();
    expect(setLevel).toHaveBeenCalledWith("letras-2", 1);
  });

  it("in review mode (record false) the saved level is used but not saved again", async () => {
    profile = { ...defaultProfile(), islands: { descoberta: { letras: { levels: { "letras-1": 3 } } } } };
    renderLoop([slot("a")], { unitId: "letras-1", record: false });
    await flush();
    expect(cards()).toHaveLength(4);
    await tap("a");
    await proceed();
    expect(setLevel).not.toHaveBeenCalled();
  });

  it("a run that started before the profile was loaded does not overwrite the saved level", async () => {
    hydrated = false;
    renderLoop([slot("a")], { unitId: "letras-1", record: true });
    await flush();
    await tap("a");
    await proceed();
    expect(setLevel).not.toHaveBeenCalled();
  });

  it("shows level 1 when the loop is not told the unit", async () => {
    profile = { ...defaultProfile(), age: 8, islands: { descoberta: { letras: { levels: { "letras-1": 3 } } } } };
    renderLoop([slot("a")]);
    await flush();
    expect(cards()).toHaveLength(2);
  });
});
