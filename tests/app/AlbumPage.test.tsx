import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Narration } from "@/domain/trail/schema";
import { emptyProgress, type Progress } from "@/domain/trail/progress";

let progress: Progress = emptyProgress();
let hydrated = true;
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({ progress, hydrated, finishStop: vi.fn(), markToday: vi.fn() }),
}));
const narratorMock = vi.hoisted(() => ({
  playNarration: vi.fn<(n: Narration) => Promise<void>>(() => Promise.resolve()),
  playSfx: vi.fn(),
  stop: vi.fn(),
  unlock: vi.fn(),
  isUnlocked: vi.fn(() => true),
}));
vi.mock("@/audio/narrator", () => ({ narrator: narratorMock }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import AlbumPage from "@/app/album/page";
import { getLines, getUnit } from "@/domain/trail/content";
import type { LessonStop } from "@/domain/trail/schema";

const unit = getUnit("forest-animals")!;
const sticker = (unit.stops.find((s) => s.kind === "challenge") as LessonStop).sticker!;
const slot = () => document.querySelector(`[data-sticker="${sticker.id}"]`) as HTMLElement;

beforeEach(() => {
  progress = emptyProgress();
  hydrated = true;
  for (const fn of Object.values(narratorMock)) fn.mockClear();
});

describe("/album", () => {
  it("an earned sticker shows and says its name when tapped", () => {
    progress = { ...emptyProgress(), stickers: { [sticker.id]: "2026-11-10T12:00:00.000Z" } };
    render(<AlbumPage />);
    expect(slot()).toHaveAttribute("data-earned", "true");
    narratorMock.playNarration.mockClear();
    fireEvent.click(slot());
    expect(narratorMock.playNarration).toHaveBeenCalledWith(sticker.name);
  });

  it("a sticker not earned yet is a locked silhouette and stays silent", () => {
    render(<AlbumPage />);
    expect(slot()).toHaveAttribute("data-earned", "false");
    narratorMock.playNarration.mockClear();
    fireEvent.click(slot());
    expect(narratorMock.playNarration).not.toHaveBeenCalled();
  });

  it("says what the album is once, when it opens", () => {
    render(<AlbumPage />);
    expect(narratorMock.playNarration).toHaveBeenCalledTimes(1);
    expect(narratorMock.playNarration).toHaveBeenCalledWith(getLines().album);
  });

  it("waits for saved progress before drawing the stickers", () => {
    hydrated = false;
    render(<AlbumPage />);
    expect(slot()).toBeNull();
  });

  it("has the Trilha and Álbum tabs, with Álbum active", () => {
    render(<AlbumPage />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Trilha", "Álbum"]);
    expect(links[1]).toHaveAttribute("aria-current", "page");
  });
});
