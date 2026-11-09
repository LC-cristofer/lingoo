import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNarrator } from "@/audio/narrator";

class FakeUtterance {
  lang = "";
  rate = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

function fakeSpeech(voices: { lang: string }[] = []) {
  return {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => voices),
  };
}

function fakeAudio(playResult: () => Promise<void> = () => Promise.resolve()) {
  const audio = {
    play: vi.fn(playResult),
    pause: vi.fn(),
    onended: null as (() => void) | null,
    onerror: null as (() => void) | null,
  };
  return audio;
}

const asSpeech = (s: unknown) => s as SpeechSynthesis;
const asCreate = (a: unknown) => (() => a) as unknown as (src: string) => HTMLAudioElement;

beforeEach(() => {
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("narrator", () => {
  it("resolves without playing before unlock", async () => {
    const speech = fakeSpeech();
    const n = createNarrator({ speech: asSpeech(speech) });
    expect(n.isUnlocked()).toBe(false);
    await n.play({ text: "bear" });
    expect(speech.speak).not.toHaveBeenCalled();
    n.unlock();
    expect(n.isUnlocked()).toBe(true);
  });

  it("plays the audio file when src exists", async () => {
    const audio = fakeAudio();
    const createAudio = vi.fn(() => audio as unknown as HTMLAudioElement);
    const speech = fakeSpeech();
    const n = createNarrator({ speech: asSpeech(speech), createAudio });
    n.unlock();
    const p = n.play({ text: "bear", src: "/a.mp3" });
    expect(createAudio).toHaveBeenCalledWith("/a.mp3");
    expect(audio.play).toHaveBeenCalled();
    audio.onended!();
    await p;
    expect(speech.speak).not.toHaveBeenCalled();
  });

  it("speaks en-US at rate 0.85 without src and picks an en voice", async () => {
    const voice = { lang: "en-GB" };
    const speech = fakeSpeech([{ lang: "pt-BR" }, voice]);
    const n = createNarrator({ speech: asSpeech(speech) });
    n.unlock();
    const p = n.play({ text: "the bear" });
    const u = speech.speak.mock.calls[0][0] as FakeUtterance;
    expect(u.text).toBe("the bear");
    expect(u.lang).toBe("en-US");
    expect(u.rate).toBe(0.85);
    expect(u.voice).toBe(voice);
    u.onend!();
    await p;
  });

  it("a new play stops the previous one and the old promise resolves", async () => {
    const speech = fakeSpeech();
    const audio = fakeAudio();
    const n = createNarrator({ speech: asSpeech(speech), createAudio: asCreate(audio) });
    n.unlock();
    const first = n.play({ text: "one" });
    const second = n.play({ text: "two", src: "/b.mp3" });
    expect(speech.cancel).toHaveBeenCalled();
    await first;
    const third = n.play({ text: "three" });
    expect(audio.pause).toHaveBeenCalled();
    await second;
    n.stop();
    await third;
  });

  it("resolves with speech null and no src", async () => {
    const n = createNarrator({ speech: null });
    n.unlock();
    await n.play({ text: "bear" });
  });

  it("resolves on safety timeout when onend never fires", async () => {
    vi.useFakeTimers();
    const speech = fakeSpeech();
    const n = createNarrator({ speech: asSpeech(speech), timeoutMs: 1000 });
    n.unlock();
    const done = vi.fn();
    n.play({ text: "bear" }).then(done);
    await vi.advanceTimersByTimeAsync(999);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2);
    expect(done).toHaveBeenCalled();
  });

  it("default timeout is max(4000, 400 * words)", async () => {
    vi.useFakeTimers();
    const n = createNarrator({ speech: asSpeech(fakeSpeech()) });
    n.unlock();
    const done = vi.fn();
    n.play({ text: "bear" }).then(done);
    await vi.advanceTimersByTimeAsync(3999);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2);
    expect(done).toHaveBeenCalled();
  });

  it("resolves when audio.play() rejects (autoplay blocked)", async () => {
    const audio = fakeAudio(() => Promise.reject(new Error("NotAllowed")));
    const n = createNarrator({ speech: null, createAudio: asCreate(audio) });
    n.unlock();
    await n.play({ text: "bear", src: "/a.mp3" });
  });

  it("resolves when audio.play() throws synchronously", async () => {
    const audio = fakeAudio(() => {
      throw new Error("boom");
    });
    const n = createNarrator({ speech: null, createAudio: asCreate(audio) });
    n.unlock();
    await n.play({ text: "bear", src: "/a.mp3" });
  });
});
