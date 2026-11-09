import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AlbumPage from "@/app/album/page";
import { narrator } from "@/audio/narrator";
import { emptyProgress, type Progress } from "@/domain/progress";

let progress: Progress = emptyProgress();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/components/ProgressProvider", () => ({
  useProgress: () => ({ progress, hydrated: true, finishLesson: vi.fn() }),
}));
vi.mock("@/audio/narrator", () => ({
  narrator: { play: vi.fn(() => Promise.resolve()), stop: vi.fn(), unlock: vi.fn(), isUnlocked: () => true },
}));

beforeEach(() => {
  progress = emptyProgress();
  vi.mocked(narrator.play).mockClear();
});

describe("AlbumPage", () => {
  it("an earned sticker says its name from the content", () => {
    progress = { completedLessons: {}, stickers: { "sticker-fox": "2026-01-01T00:00:00.000Z" } };
    render(<AlbumPage />);
    const slot = screen.getByRole("button", { name: "A fox sticker!" });
    fireEvent.click(slot);
    expect(narrator.play).toHaveBeenCalledWith({ text: "A fox sticker!" });
  });

  it("a sticker not earned yet is a silent '?'", () => {
    render(<AlbumPage />);
    fireEvent.click(screen.getByRole("button", { name: "?" }));
    expect(narrator.play).not.toHaveBeenCalled();
  });
});
