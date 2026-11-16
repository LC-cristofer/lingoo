import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Narration, SongStop as SongStopData } from "@/domain/trail/schema";

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

const unit = getUnit("forest-animals")!;
const song = unit.stops[0] as SongStopData;

/** A stand-in for HTMLAudioElement: the test moves time and fires the media events. */
class FakeAudio extends EventTarget {
  currentTime = 0;
  src: string;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  load = vi.fn();
  removeAttribute = vi.fn();
  constructor(src: string) {
    super();
    this.src = src;
  }
  at(t: number) {
    this.currentTime = t;
    this.dispatchEvent(new Event("timeupdate"));
  }
  fire(type: "ended" | "error" | "playing") {
    this.dispatchEvent(new Event(type));
  }
}

let audios: FakeAudio[] = [];
const createAudio = (src: string) => {
  const a = new FakeAudio(src);
  audios.push(a);
  return a as unknown as HTMLAudioElement;
};

const flush = async () => {
  await act(async () => {});
  await act(async () => {});
};
const sheetContinue = () => within(screen.getByTestId("feedback-area")).getByRole("button", { name: "Continuar" });

function renderSong(extra: { record?: boolean } = {}) {
  const onExit = vi.fn();
  render(<SongStop unit={unit} stop={song} onExit={onExit} createAudio={createAudio} {...extra} />);
  return { onExit };
}

async function startSong() {
  fireEvent.click(screen.getByRole("button", { name: "Começar" }));
  await flush();
  return audios[0];
}

async function playExercisesToClosing() {
  for (const ex of song.exercises) {
    if (ex.kind !== "listenTap") throw new Error("the song's exercises are listenTap");
    fireEvent.click(screen.getByRole("button", { name: ex.answerId }));
    await flush();
    fireEvent.click(sheetContinue());
    await flush();
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  audios = [];
  for (const fn of Object.values(narratorMock)) fn.mockClear();
  narratorMock.playNarration.mockImplementation(() => Promise.resolve());
  finishStop.mockClear();
});
afterEach(() => vi.useRealTimers());

describe("SongStop", () => {
  it("plays the unit's song file from the Começar tap", async () => {
    renderSong();
    expect(audios).toHaveLength(0); // nothing is loaded before the tap
    const audio = await startSong();
    expect(audio.src).toBe("/audio/song-forest-animals.mp3");
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it("highlights the line being sung, with its animal", async () => {
    renderSong();
    const audio = await startSong();
    act(() => audio.at(7.3));
    expect(document.querySelector('[data-line="1"]')).toHaveAttribute("data-current", "true");
    expect(document.querySelector('[data-line="0"]')).not.toHaveAttribute("data-current", "true");
    expect(screen.getByRole("img", { name: "bird" })).toBeInTheDocument();
  });

  it("when the song file fails, the lines are narrated in order and the child can go on", async () => {
    renderSong();
    const audio = await startSong();
    narratorMock.playNarration.mockClear();
    act(() => audio.fire("error"));
    await flush();
    await flush();
    const said = narratorMock.playNarration.mock.calls.map(([n]) => n);
    expect(said).toEqual(song.lyrics.map((l) => l.say));
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
  });

  it("after the song, its exercises lead to the closing and the stop is recorded once", async () => {
    renderSong();
    const audio = await startSong();
    act(() => audio.fire("ended"));
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await flush();
    await playExercisesToClosing();
    expect(screen.getByTestId("star")).toBeInTheDocument();
    expect(finishStop).toHaveBeenCalledTimes(1);
    expect(finishStop).toHaveBeenCalledWith("forest-animals/song");
  });

  it("records nothing in review mode", async () => {
    renderSong({ record: false });
    const audio = await startSong();
    act(() => audio.fire("ended"));
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    await flush();
    await playExercisesToClosing();
    expect(screen.getByTestId("star")).toBeInTheDocument();
    expect(finishStop).not.toHaveBeenCalled();
  });

  it("leaving during the song stops the music and the voice and records nothing", async () => {
    const { onExit } = renderSong();
    const audio = await startSong();
    act(() => audio.at(3));
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(audio.pause).toHaveBeenCalled();
    expect(narratorMock.stop).toHaveBeenCalled();
    expect(finishStop).not.toHaveBeenCalled();
  });

  it("can pause, resume and sing again", async () => {
    renderSong();
    const audio = await startSong();
    act(() => audio.fire("playing"));
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    expect(audio.pause).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Tocar" }));
    expect(audio.play).toHaveBeenCalledTimes(2);
    act(() => audio.fire("ended"));
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Cantar de novo" }));
    expect(audio.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalledTimes(3);
  });
});
