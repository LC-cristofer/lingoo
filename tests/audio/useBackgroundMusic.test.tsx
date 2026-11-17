import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBackgroundMusic } from "@/audio/useBackgroundMusic";
import type { Track } from "@/audio/music";

const musicMock = vi.hoisted(() => ({ play: vi.fn(), stop: vi.fn() }));
vi.mock("@/audio/music", () => ({ music: musicMock }));

function Probe({ track }: { track: Track | null }) {
  useBackgroundMusic(track);
  return null;
}

beforeEach(() => {
  musicMock.play.mockClear();
  musicMock.stop.mockClear();
});

describe("useBackgroundMusic", () => {
  it("asks for the track when the screen shows and lets go when it leaves", () => {
    const view = render(<Probe track="trail" />);
    expect(musicMock.play).toHaveBeenCalledWith("trail");
    view.unmount();
    expect(musicMock.stop).toHaveBeenCalled();
  });

  it("null asks for nothing", () => {
    render(<Probe track={null} />);
    expect(musicMock.play).not.toHaveBeenCalled();
  });

  it("changing to null lets go, and back to a track asks again", () => {
    const view = render(<Probe track="album" />);
    musicMock.stop.mockClear();
    view.rerender(<Probe track={null} />);
    expect(musicMock.stop).toHaveBeenCalled();
    view.rerender(<Probe track="album" />);
    expect(musicMock.play).toHaveBeenCalledTimes(2);
  });
});
