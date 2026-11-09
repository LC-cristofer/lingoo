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

/** Models the engine state: speaking while an utterance is out, idle after onend or cancel. */
function fakeSpeech(voices: { lang: string }[] = []) {
  const s = {
    speaking: false,
    pending: false,
    speak: vi.fn((u: FakeUtterance) => {
      if (u.text) s.speaking = true;
    }),
    cancel: vi.fn(() => {
      s.speaking = false;
      s.pending = false;
    }),
    getVoices: vi.fn(() => voices),
  };
  return s;
}

/** Real utterances only (the unlock primer is an empty one). */
const spoken = (speech: ReturnType<typeof fakeSpeech>) =>
  speech.speak.mock.calls.map((c) => c[0] as FakeUtterance).filter((u) => u.text !== "");

/** speak() is deferred to a later task (I4), so let it run. */
const nextTask = () => new Promise<void>((r) => setTimeout(r, 0));

function end(speech: ReturnType<typeof fakeSpeech>, u: FakeUtterance) {
  speech.speaking = false;
  u.onend!();
}

function fakeAudio(playResult: () => Promise<void> = () => Promise.resolve()) {
  const audio = {
    play: vi.fn(playResult),
    pause: vi.fn(),
    duration: NaN,
    onended: null as (() => void) | null,
    onerror: null as (() => void) | null,
    onloadedmetadata: null as (() => void) | null,
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

  it("speaks en-US at rate 0.85 without src and falls back to any en voice", async () => {
    const voice = { lang: "en-GB" };
    const speech = fakeSpeech([{ lang: "pt-BR" }, voice]);
    const n = createNarrator({ speech: asSpeech(speech) });
    n.unlock();
    const p = n.play({ text: "the bear" });
    await nextTask();
    const [u] = spoken(speech);
    expect(u.text).toBe("the bear");
    expect(u.lang).toBe("en-US");
    expect(u.rate).toBe(0.85);
    expect(u.voice).toBe(voice);
    end(speech, u);
    await p;
  });

  it("prefers an exact en-US voice over other en voices", async () => {
    const us = { lang: "en_US" }; // some Android builds use an underscore
    const speech = fakeSpeech([{ lang: "en-GB" }, { lang: "pt-BR" }, us]);
    const n = createNarrator({ speech: asSpeech(speech) });
    n.unlock();
    const p = n.play({ text: "fox" });
    await nextTask();
    const [u] = spoken(speech);
    expect(u.voice).toBe(us);
    end(speech, u);
    await p;
  });

  it("defers speak() to a later task instead of speaking right after cancel()", async () => {
    const speech = fakeSpeech();
    const n = createNarrator({ speech: asSpeech(speech) });
    n.unlock();
    void n.play({ text: "one" });
    await nextTask();
    expect(speech.speaking).toBe(true);
    void n.play({ text: "two" });
    expect(speech.cancel).toHaveBeenCalledTimes(1);
    expect(spoken(speech).map((u) => u.text)).toEqual(["one"]); // not yet: same task as cancel()
    await nextTask();
    expect(spoken(speech).map((u) => u.text)).toEqual(["one", "two"]);
  });

  it("a play interrupted before its deferred speak never speaks", async () => {
    const speech = fakeSpeech();
    const n = createNarrator({ speech: asSpeech(speech) });
    n.unlock();
    const first = n.play({ text: "one" });
    void n.play({ text: "two" });
    await first;
    await nextTask();
    expect(spoken(speech).map((u) => u.text)).toEqual(["two"]);
    const third = n.play({ text: "three" });
    n.stop();
    await third;
    await nextTask();
    expect(spoken(speech).map((u) => u.text)).toEqual(["two"]);
  });

  it("does not cancel when the engine is neither speaking nor pending", async () => {
    const speech = fakeSpeech();
    const n = createNarrator({ speech: asSpeech(speech) });
    n.unlock();
    const first = n.play({ text: "one" });
    await nextTask();
    n.stop(); // speaking: cancels
    await first;
    expect(speech.cancel).toHaveBeenCalledTimes(1);
    const second = n.play({ text: "two" });
    await nextTask();
    end(speech, spoken(speech)[1]);
    await second;
    void n.play({ text: "three" }); // engine idle again
    n.stop(); // three not spoken yet, engine idle
    expect(speech.cancel).toHaveBeenCalledTimes(1);
  });

  it("cancels while the engine is pending", async () => {
    const speech = fakeSpeech();
    const n = createNarrator({ speech: asSpeech(speech) });
    n.unlock();
    void n.play({ text: "one" });
    await nextTask();
    speech.speaking = false;
    speech.pending = true;
    n.stop();
    expect(speech.cancel).toHaveBeenCalledTimes(1);
  });

  it("a new play stops the previous one and the old promise resolves", async () => {
    const speech = fakeSpeech();
    const audio = fakeAudio();
    const n = createNarrator({ speech: asSpeech(speech), createAudio: asCreate(audio) });
    n.unlock();
    const first = n.play({ text: "one" });
    await nextTask();
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

  it("on the safety timeout resolves but does not cut the speech off", async () => {
    vi.useFakeTimers();
    const speech = fakeSpeech();
    const n = createNarrator({ speech: asSpeech(speech), timeoutMs: 1000 });
    n.unlock();
    const done = vi.fn();
    n.play({ text: "a long song" }).then(done);
    await vi.advanceTimersByTimeAsync(1001);
    expect(done).toHaveBeenCalled();
    expect(speech.speaking).toBe(true);
    expect(speech.cancel).not.toHaveBeenCalled();
  });

  it("after the safety timeout a later play() or stop() still silences it", async () => {
    vi.useFakeTimers();
    const speech = fakeSpeech();
    const n = createNarrator({ speech: asSpeech(speech), timeoutMs: 1000 });
    n.unlock();
    void n.play({ text: "one" });
    await vi.advanceTimersByTimeAsync(1001);
    void n.play({ text: "two" });
    expect(speech.cancel).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1001);
    n.stop();
    expect(speech.cancel).toHaveBeenCalledTimes(2);
  });

  it("an utterance that ended after its timeout is not cancelled by the next play", async () => {
    vi.useFakeTimers();
    const speech = fakeSpeech();
    const n = createNarrator({ speech: asSpeech(speech), timeoutMs: 1000 });
    n.unlock();
    void n.play({ text: "one" });
    await vi.advanceTimersByTimeAsync(1001);
    end(speech, spoken(speech)[0]);
    speech.speaking = true; // something else is speaking now; "one" must not cancel it
    n.stop();
    expect(speech.cancel).not.toHaveBeenCalled();
  });

  it("src audio is not cut by the word-based timeout and resolves when it ends", async () => {
    vi.useFakeTimers();
    const audio = fakeAudio();
    const n = createNarrator({ speech: null, createAudio: asCreate(audio) });
    n.unlock();
    const done = vi.fn();
    n.play({ text: "song", src: "/song.mp3" }).then(done);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(done).not.toHaveBeenCalled();
    expect(audio.pause).not.toHaveBeenCalled();
    audio.onended!();
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toHaveBeenCalled();
  });

  it("src audio falls back to its duration plus a margin, without pausing", async () => {
    vi.useFakeTimers();
    const audio = fakeAudio();
    const n = createNarrator({ speech: null, createAudio: asCreate(audio) });
    n.unlock();
    const done = vi.fn();
    n.play({ text: "song", src: "/song.mp3" }).then(done);
    audio.duration = 45;
    audio.onloadedmetadata!();
    await vi.advanceTimersByTimeAsync(45_000 + 1_999);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2);
    expect(done).toHaveBeenCalled();
    expect(audio.pause).not.toHaveBeenCalled();
  });

  it("src audio with unknown duration resolves at a 120 s cap, and a later play pauses it", async () => {
    vi.useFakeTimers();
    const audio = fakeAudio();
    const n = createNarrator({ speech: null, createAudio: asCreate(audio) });
    n.unlock();
    const done = vi.fn();
    n.play({ text: "song", src: "/song.mp3" }).then(done);
    audio.onloadedmetadata!(); // duration stays NaN
    await vi.advanceTimersByTimeAsync(119_999);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2);
    expect(done).toHaveBeenCalled();
    expect(audio.pause).not.toHaveBeenCalled();
    void n.play({ text: "bear" });
    expect(audio.pause).toHaveBeenCalledTimes(1);
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
