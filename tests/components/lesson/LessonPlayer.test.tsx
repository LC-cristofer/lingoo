import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { getLesson } from "@/domain/content";

const finishLesson = vi.fn();
vi.mock("@/components/ProgressProvider", () => ({ useProgress: () => ({ progress: {}, hydrated: true, finishLesson }) }));
vi.mock("@/audio/narrator", () => ({
  narrator: { play: vi.fn(() => Promise.resolve()), stop: vi.fn(), unlock: vi.fn(), isUnlocked: () => true },
}));
const fake = ({ onDone }: { onDone: () => void }) => (
  <button type="button" onClick={onDone}>
    fake-done
  </button>
);
vi.mock("@/components/games/TapGame", () => ({ TapGame: (p: { onDone: () => void }) => fake(p) }));
vi.mock("@/components/games/DragGame", () => ({ DragGame: (p: { onDone: () => void }) => fake(p) }));
vi.mock("@/components/games/RepeatGame", () => ({ RepeatGame: (p: { onDone: () => void }) => fake(p) }));

const lesson = getLesson("forest-animals")!;

async function click(name: string) {
  await act(async () => {}); // let narration promises resolve
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
}

async function playThrough() {
  await click("Avançar"); // song
  for (let i = 0; i < 4; i++) await click("Avançar"); // 4 story pages
  for (let i = 0; i < 3; i++) await click("fake-done"); // tap, drag, repeat
}

beforeEach(() => finishLesson.mockClear());

describe("LessonPlayer", () => {
  it("plays all 6 steps and finishes the lesson exactly once", async () => {
    render(<LessonPlayer lesson={lesson} onExit={vi.fn()} />);
    expect(finishLesson).not.toHaveBeenCalled();
    await playThrough();
    await act(async () => {}); // sticker narration resolves
    expect(finishLesson).toHaveBeenCalledTimes(1);
    expect(finishLesson).toHaveBeenCalledWith("forest-animals", "sticker-fox");
    expect(screen.getByRole("button", { name: "Voltar ao mapa" })).toBeInTheDocument();
  });

  it("shows 6 dots with the current one marked", async () => {
    render(<LessonPlayer lesson={lesson} onExit={vi.fn()} />);
    const dots = screen.getAllByTestId("progress-dot");
    expect(dots).toHaveLength(6);
    expect(dots[0]).toHaveAttribute("aria-current", "step");
    await click("Avançar");
    const after = screen.getAllByTestId("progress-dot");
    expect(after[1]).toHaveAttribute("aria-current", "step");
    expect(after[0]).not.toHaveAttribute("aria-current");
  });

  it("home button calls onExit", async () => {
    const onExit = vi.fn();
    render(<LessonPlayer lesson={lesson} onExit={onExit} />);
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao mapa" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("no home button during the sticker step, so a seen sticker is always recorded", async () => {
    const { narrator } = await import("@/audio/narrator");
    let endSticker: () => void = () => {};
    vi.mocked(narrator.play).mockImplementation((m) =>
      m.text === "You got a sticker!" ? new Promise<void>((r) => (endSticker = r)) : Promise.resolve(),
    );
    try {
      render(<LessonPlayer lesson={lesson} onExit={vi.fn()} />);
      await playThrough();
      await act(async () => {});
      expect(screen.getAllByTestId("progress-dot")[5]).toHaveAttribute("aria-current", "step");
      expect(screen.queryByRole("button", { name: "Voltar ao mapa" })).toBeNull();
      expect(finishLesson).not.toHaveBeenCalled();
      await act(async () => endSticker());
      expect(finishLesson).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "Voltar ao mapa" })).toBeInTheDocument();
    } finally {
      vi.mocked(narrator.play).mockImplementation(() => Promise.resolve());
    }
  });

  it("story replay button narrates again", async () => {
    const { narrator } = await import("@/audio/narrator");
    render(<LessonPlayer lesson={lesson} onExit={vi.fn()} />);
    await click("Avançar");
    await act(async () => {});
    const calls = vi.mocked(narrator.play).mock.calls.length;
    await click("Repetir");
    expect(vi.mocked(narrator.play).mock.calls.length).toBe(calls + 1);
  });
});
