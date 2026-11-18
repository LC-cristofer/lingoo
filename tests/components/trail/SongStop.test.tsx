import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Narration, SongStop as SongStopType, Unit } from "@/domain/trail/schema";

const narratorMock = vi.hoisted(() => ({
  playNarration: vi.fn<(n: Narration) => Promise<void>>(() => Promise.resolve()),
  playSfx: vi.fn(),
  stop: vi.fn(),
  unlock: vi.fn(),
  isUnlocked: vi.fn(() => true),
}));
vi.mock("@/audio/narrator", () => ({ narrator: narratorMock }));

const finishStop = vi.fn();
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({ progress: { completedStops: {}, stickers: {}, daysPlayed: [] }, hydrated: true, finishStop, markToday: vi.fn() }),
}));

import { SongStop } from "@/components/trail/SongStop";
import { getUnit } from "@/domain/trail/content";

const unit = getUnit("forest-animals") as Unit;
const song = unit.stops[0] as SongStopType;

/** A fake HTMLAudioElement: the test drives currentTime and the events. */
class FakeAudio extends EventTarget {
  currentTime = 0;
  duration = NaN;
  readyState = 4;
  paused = true;
  src: string;
  play = vi.fn(() => {
    this.paused = false;
    return Promise.resolve();
  });
  pause = vi.fn(() => {
    this.paused = true;
  });
  constructor(src: string) {
    super();
    this.src = src;
  }
  emit(name: string) {
    this.dispatchEvent(new Event(name));
  }
}

let audios: FakeAudio[] = [];
const createAudio = (src: string) => {
  const a = new FakeAudio(src);
  audios.push(a);
  return a as unknown as HTMLAudioElement;
};
const barTime = (bar: number) => ((song.introBars + bar - 1) * 4 * 60) / song.bpm;
const flush = async () => {
  await act(async () => {});
  await act(async () => {});
};
const tick = async (ms = 150) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

function renderSong(extra: { record?: boolean } = {}) {
  const onExit = vi.fn();
  render(<SongStop unit={unit} stop={song} onExit={onExit} createAudio={createAudio} {...extra} />);
  return { onExit };
}
const sing = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Cantar" }));
  await flush();
};
const currentLine = () => document.querySelector('[data-line][data-state="current"]') as HTMLElement | null;

beforeEach(() => {
  vi.useFakeTimers();
  audios = [];
  for (const fn of Object.values(narratorMock)) fn.mockClear();
  narratorMock.playNarration.mockImplementation(() => Promise.resolve());
  narratorMock.isUnlocked.mockReturnValue(true);
  finishStop.mockClear();
});
afterEach(() => vi.useRealTimers());

describe("SongStop", () => {
  it("says the opening, then plays the unit's song when ▶ is tapped", async () => {
    renderSong();
    await flush();
    expect(narratorMock.playNarration).toHaveBeenCalledWith(song.opening);
    expect(audios).toHaveLength(0);
    await sing();
    expect(narratorMock.unlock).toHaveBeenCalled();
    expect(audios).toHaveLength(1);
    expect(audios[0].src).toBe(`/audio/song-${unit.id}.mp3`);
    expect(audios[0].play).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Pausar" })).toBeInTheDocument();
  });

  it("highlights the line that matches the audio time, with its animal", async () => {
    renderSong();
    await sing();
    audios[0].currentTime = barTime(1) + 0.1;
    await tick();
    expect(currentLine()).toHaveTextContent("It's a bear!");
    expect(within(currentLine()!).queryByText(/bird/)).toBeNull();
    expect(document.querySelector('svg[data-art="bear"]')).toBeInTheDocument();
    audios[0].currentTime = barTime(3) + 0.1;
    await tick();
    expect(currentLine()).toHaveTextContent("It's a bird!");
    expect(document.querySelector('svg[data-art="bird"]')).toBeInTheDocument();
    expect(document.querySelector('svg[data-art="bear"]')).toBeNull();
  });

  it("shows the Nino on the last line and while it sings", async () => {
    renderSong();
    await sing();
    audios[0].currentTime = barTime(13) + 0.1;
    await tick();
    expect(currentLine()).toHaveTextContent("Animals, animals, in the forest!");
    expect(document.querySelector('svg[data-pose="happy"]')).toBeInTheDocument();
  });

  it("pauses and plays again", async () => {
    renderSong();
    await sing();
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    expect(audios[0].pause).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Tocar" }));
    expect(audios[0].play).toHaveBeenCalledTimes(2);
  });

  it("falls back to speaking each line in order when the audio errors", async () => {
    renderSong();
    await sing();
    narratorMock.playNarration.mockClear();
    act(() => audios[0].emit("error"));
    await flush();
    const spoken = narratorMock.playNarration.mock.calls.map((c) => c[0]);
    expect(spoken).toEqual(song.lyrics.map((l) => l.say));
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
  });

  it("falls back when play() is rejected", async () => {
    const rejecting = (src: string) => {
      const a = new FakeAudio(src);
      a.play = vi.fn(() => Promise.reject(new Error("blocked")));
      audios.push(a);
      return a as unknown as HTMLAudioElement;
    };
    render(<SongStop unit={unit} stop={song} onExit={vi.fn()} createAudio={rejecting} />);
    await sing();
    await flush();
    expect(narratorMock.playNarration).toHaveBeenCalledWith(song.lyrics[0].say);
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
  });

  describe("a song that never finishes by itself", () => {
    const continuar = () => screen.queryByRole("button", { name: "Continuar" });

    it("ends 3 s after its duration when `ended` never fires, so Continuar appears", async () => {
      renderSong();
      await sing();
      audios[0].duration = 20;
      act(() => audios[0].emit("loadedmetadata"));
      await tick(20_000 + 2_900);
      expect(continuar()).toBeNull();
      await tick(200);
      expect(continuar()).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cantar de novo" })).toBeInTheDocument();
    });

    it("pausing stops the safety timer, and resuming arms it for what is left", async () => {
      renderSong();
      await sing();
      audios[0].duration = 20;
      act(() => audios[0].emit("loadedmetadata"));
      await tick(5_000);
      audios[0].currentTime = 5;
      fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
      await tick(60_000);
      expect(continuar()).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Tocar" }));
      await tick(15_000 + 2_900);
      expect(continuar()).toBeNull();
      await tick(200);
      expect(continuar()).toBeInTheDocument();
    });

    it("a file that stalls or waits for more than 3 s falls back to the gatinho's voice", async () => {
      renderSong();
      await sing();
      narratorMock.playNarration.mockClear();
      act(() => audios[0].emit("waiting"));
      await tick(2_900);
      expect(narratorMock.playNarration).not.toHaveBeenCalled();
      await tick(200);
      await flush();
      expect(audios[0].pause).toHaveBeenCalled();
      expect(narratorMock.playNarration.mock.calls.map((c) => c[0])).toEqual(song.lyrics.map((l) => l.say));
      expect(continuar()).toBeInTheDocument();
    });

    it("`stalled` counts the same, and speaking resumes from the current line", async () => {
      renderSong();
      await sing();
      audios[0].currentTime = barTime(3) + 0.1;
      await tick();
      narratorMock.playNarration.mockClear();
      act(() => audios[0].emit("stalled"));
      await tick(3_100);
      await flush();
      const spoken = narratorMock.playNarration.mock.calls.map((c) => c[0]);
      expect(spoken[0]).toEqual(song.lyrics.find((l) => l.bar === 3)!.say);
    });

    it("a stall that recovers within 3 s keeps the song playing", async () => {
      renderSong();
      await sing();
      narratorMock.playNarration.mockClear();
      act(() => audios[0].emit("waiting"));
      await tick(2_000);
      act(() => audios[0].emit("playing"));
      await tick(5_000);
      expect(narratorMock.playNarration).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Pausar" })).toBeInTheDocument();
    });

    it("a file with nothing buffered and no events at all falls back after 3 s", async () => {
      const unloaded = (src: string) => {
        const a = new FakeAudio(src);
        a.readyState = 0;
        audios.push(a);
        return a as unknown as HTMLAudioElement;
      };
      render(<SongStop unit={unit} stop={song} onExit={vi.fn()} createAudio={unloaded} />);
      await sing();
      narratorMock.playNarration.mockClear();
      await tick(3_100);
      await flush();
      expect(narratorMock.playNarration).toHaveBeenCalledWith(song.lyrics[0].say);
    });

    it("leaves no timer behind on unmount", async () => {
      const view = render(<SongStop unit={unit} stop={song} onExit={vi.fn()} createAudio={createAudio} />);
      await sing();
      audios[audios.length - 1].duration = 20;
      act(() => audios[audios.length - 1].emit("loadedmetadata"));
      act(() => audios[audios.length - 1].emit("waiting"));
      view.unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  it("offers 'Cantar de novo' at the end, which restarts the song", async () => {
    renderSong();
    await sing();
    act(() => audios[0].emit("ended"));
    await flush();
    expect(screen.queryByRole("button", { name: "Pausar" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cantar de novo" }));
    expect(audios[0].currentTime).toBe(0);
    expect(audios[0].play).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Pausar" })).toBeInTheDocument();
  });

  it("after the song: the three exercises, then the closing with finishStop once", async () => {
    renderSong();
    await sing();
    act(() => audios[0].emit("ended"));
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await flush();
    expect(audios[0].pause).toHaveBeenCalled();
    for (const ex of song.exercises) {
      if (ex.kind !== "listenTap") throw new Error("expected listenTap");
      fireEvent.click(screen.getByRole("button", { name: ex.answerId }));
      await flush();
      fireEvent.click(within(screen.getByTestId("feedback-area")).getByRole("button", { name: "Continuar" }));
      await flush();
    }
    expect(finishStop).toHaveBeenCalledTimes(1);
    expect(finishStop).toHaveBeenCalledWith(song.id);
    expect(screen.getByRole("button", { name: "Voltar ao mapa" })).toBeInTheDocument();
    expect(narratorMock.playSfx).toHaveBeenCalledWith("star");
  });

  it("does not save in review mode", async () => {
    renderSong({ record: false });
    await sing();
    act(() => audios[0].emit("ended"));
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await flush();
    for (const ex of song.exercises) {
      if (ex.kind !== "listenTap") throw new Error("expected listenTap");
      fireEvent.click(screen.getByRole("button", { name: ex.answerId }));
      await flush();
      fireEvent.click(within(screen.getByTestId("feedback-area")).getByRole("button", { name: "Continuar" }));
      await flush();
    }
    expect(finishStop).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Voltar ao mapa" })).not.toBeInTheDocument();
  });

  it("stops the audio on ✕ and on unmount", async () => {
    const { onExit } = renderSong();
    await sing();
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(onExit).toHaveBeenCalled();
    expect(audios[0].pause).toHaveBeenCalled();
  });

  describe("a play() that fails after the child left or paused", () => {
    /** An audio whose play() stays pending until the test rejects it. */
    function deferredAudio() {
      let reject: (e: Error) => void = () => {};
      const make = (src: string) => {
        const a = new FakeAudio(src);
        a.play = vi.fn(
          () =>
            new Promise<void>((_, rej) => {
              reject = rej;
            }),
        );
        audios.push(a);
        return a as unknown as HTMLAudioElement;
      };
      return { make, reject: () => reject(new DOMException("aborted", "AbortError")) };
    }
    const lineCalls = () =>
      narratorMock.playNarration.mock.calls.filter((c) => song.lyrics.some((l) => l.say === c[0]));

    it("does not speak the lyrics after ✕", async () => {
      const d = deferredAudio();
      const onExit = vi.fn();
      render(<SongStop unit={unit} stop={song} onExit={onExit} createAudio={d.make} />);
      await sing();
      fireEvent.click(screen.getByRole("button", { name: "Sair" }));
      d.reject();
      await flush();
      expect(lineCalls()).toHaveLength(0);
    });

    it("does not speak the lyrics after unmount", async () => {
      const d = deferredAudio();
      const view = render(<SongStop unit={unit} stop={song} onExit={vi.fn()} createAudio={d.make} />);
      await sing();
      view.unmount();
      d.reject();
      await flush();
      expect(lineCalls()).toHaveLength(0);
    });

    it("does not speak the lyrics after a user Pause", async () => {
      const d = deferredAudio();
      render(<SongStop unit={unit} stop={song} onExit={vi.fn()} createAudio={d.make} />);
      await sing();
      fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
      d.reject();
      await flush();
      expect(lineCalls()).toHaveLength(0);
      expect(screen.getByRole("button", { name: "Tocar" })).toBeInTheDocument();
    });
  });

  it("on unmount: pauses the audio and ignores late events", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const view = render(<SongStop unit={unit} stop={song} onExit={vi.fn()} createAudio={createAudio} />);
    await sing();
    view.unmount();
    expect(audios[0].pause).toHaveBeenCalled();
    audios[0].currentTime = barTime(3);
    audios[0].emit("timeupdate");
    audios[0].emit("ended");
    audios[0].emit("error");
    await tick(300);
    expect(errors).not.toHaveBeenCalled();
    expect(narratorMock.playNarration).not.toHaveBeenCalledWith(song.lyrics[0].say);
    errors.mockRestore();
  });
});
