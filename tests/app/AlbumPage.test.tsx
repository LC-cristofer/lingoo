import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AlbumPage from "@/app/album/page";
import { narrator } from "@/audio/narrator";
import { getLines, getUnit } from "@/domain/trail/content";
import { emptyProgress, type Progress } from "@/domain/trail/progress";

let progress: Progress = emptyProgress();
let hydrated = true;
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({ progress, hydrated, finishStop: vi.fn(), markToday: vi.fn() }),
}));
vi.mock("@/audio/narrator", () => ({
  narrator: {
    playNarration: vi.fn(() => Promise.resolve()),
    playSfx: vi.fn(),
    stop: vi.fn(),
    unlock: vi.fn(),
    isUnlocked: () => true,
  },
}));

const challenge = getUnit("forest-animals")!.stops.find((s) => s.kind === "challenge")!;
const sticker = challenge.kind === "challenge" ? challenge.sticker! : null;

beforeEach(() => {
  progress = emptyProgress();
  hydrated = true;
  vi.mocked(narrator.playNarration).mockClear();
});

describe("AlbumPage", () => {
  it("plays the album line when it opens", () => {
    render(<AlbumPage />);
    expect(narrator.playNarration).toHaveBeenCalledWith(getLines().album);
  });

  it("an earned sticker is coloured and says its name when tapped", () => {
    progress = { ...emptyProgress(), stickers: { "sticker-forest-bear": "2026-01-01T00:00:00.000Z" } };
    render(<AlbumPage />);
    const slot = screen.getByRole("button", { name: "bear" });
    expect(slot.querySelector("[data-earned]")).toHaveAttribute("data-earned", "true");
    vi.mocked(narrator.playNarration).mockClear();
    fireEvent.click(slot);
    expect(narrator.playNarration).toHaveBeenCalledWith(sticker!.name);
  });

  it("a missing sticker is a silhouette with a padlock and stays silent", () => {
    render(<AlbumPage />);
    const slot = screen.getByRole("button", { name: "bear" });
    expect(slot.querySelector("[data-earned]")).toHaveAttribute("data-earned", "false");
    expect(slot).toHaveAttribute("aria-disabled", "true");
    vi.mocked(narrator.playNarration).mockClear();
    fireEvent.click(slot);
    expect(narrator.playNarration).not.toHaveBeenCalled();
  });

  it("shows a locked sign for the next units and the Álbum tab as current", () => {
    render(<AlbumPage />);
    expect(screen.getByText("Cores")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Álbum" })).toHaveAttribute("aria-current", "page");
  });

  it("shows nothing earned before the progress is loaded", () => {
    hydrated = false;
    progress = { ...emptyProgress(), stickers: { "sticker-forest-bear": "x" } };
    render(<AlbumPage />);
    expect(screen.getByRole("button", { name: "bear" }).querySelector("[data-earned]")).toHaveAttribute("data-earned", "false");
  });
});
