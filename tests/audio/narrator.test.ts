import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNarrator } from "@/audio/narrator";
import { audioSrc } from "@/domain/trail/audio-id";

class FakeUtterance {
  lang = "";
  rate = 1;
  volume = 1;
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
    onplaying: null as (() => void) | null,
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

  it("unlock primes the engine with a silent utterance, synchronously, only once", () => {
    const speech = fakeSpeech();
    const n = createNarrator({ speech: asSpeech(speech) });
    n.unlock();
    // Synchronous: iOS Safari only lets speech start inside the user gesture.
    expect(speech.speak).toHaveBeenCalledTimes(1);
    const primer = speech.speak.mock.calls[0][0] as FakeUtterance;
    expect(primer.text).toBe("");
    expect(primer.volume).toBe(0);
    n.unlock();
    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(speech.cancel).not.toHaveBeenCalled();
  });

  it("unlock never throws (no speech, no SpeechSynthesisUtterance, speak throws)", () => {
    expect(() => createNarrator({ speech: null }).unlock()).not.toThrow();
    const throwing = { ...fakeSpeech(), speak: vi.fn(() => { throw new Error("boom"); }) };
    const n = createNarrator({ speech: asSpeech(throwing) });
    expect(() => n.unlock()).not.toThrow();
    expect(n.isUnlocked()).toBe(true);
    vi.stubGlobal("SpeechSynthesisUtterance", undefined);
    const speech = fakeSpeech();
    expect(() => createNarrator({ speech: asSpeech(speech) }).unlock()).not.toThrow();
    expect(speech.speak).not.toHaveBeenCalled();
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
    await nextTask();
    expect(spoken(speech)).toHaveLength(0);
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

  describe("playNarration and playSfx", () => {
    const seg = (lang: "pt-BR" | "en-US", text: string) => ({ lang, text });
    const three = [seg("pt-BR", "Ola"), seg("en-US", "bear"), seg("pt-BR", "Muito bem")];

    function audioFactory() {
      const made: { src: string; audio: ReturnType<typeof fakeAudio> }[] = [];
      const createAudio = ((src: string) => {
        const audio = fakeAudio();
        made.push({ src, audio });
        return audio;
      }) as unknown as (src: string) => HTMLAudioElement;
      return { made, createAudio };
    }

    it("plays segments in order, each after the previous one ends", async () => {
      const { made, createAudio } = audioFactory();
      const n = createNarrator({ speech: null, createAudio });
      n.unlock();
      const done = vi.fn();
      n.playNarration(three).then(done);
      expect(made).toHaveLength(1);
      expect(made[0].src).toBe(audioSrc(three[0]));
      expect(made[0].src).toMatch(/^\/audio\/[0-9a-f]{16}\.mp3$/);
      await nextTask();
      expect(made).toHaveLength(1);
      made[0].audio.onended!();
      await nextTask();
      expect(made).toHaveLength(2);
      expect(made[1].src).toBe(audioSrc(three[1]));
      made[1].audio.onended!();
      await nextTask();
      expect(made).toHaveLength(3);
      expect(done).not.toHaveBeenCalled();
      made[2].audio.onended!();
      await nextTask();
      expect(done).toHaveBeenCalled();
    });

    it("stop() during the first segment resolves and never starts the second", async () => {
      const { made, createAudio } = audioFactory();
      const n = createNarrator({ speech: null, createAudio });
      n.unlock();
      const p = n.playNarration(three);
      n.stop();
      await p;
      expect(made[0].audio.pause).toHaveBeenCalled();
      made[0].audio.onended?.();
      await nextTask();
      expect(made).toHaveLength(1);
    });

    it("a newer playNarration cancels the rest of the previous one", async () => {
      const { made, createAudio } = audioFactory();
      const n = createNarrator({ speech: null, createAudio });
      n.unlock();
      const first = n.playNarration(three);
      const second = n.playNarration([seg("en-US", "fox")]);
      await first;
      expect(made).toHaveLength(2);
      made[0].audio.onended?.();
      await nextTask();
      expect(made).toHaveLength(2);
      made[1].audio.onended!();
      await second;
    });

    it("resolves without playing before unlock", async () => {
      const { made, createAudio } = audioFactory();
      const n = createNarrator({ speech: null, createAudio });
      await n.playNarration(three);
      expect(made).toHaveLength(0);
    });

    it("a failed segment falls back to the browser voice in its language, then continues", async () => {
      vi.useFakeTimers();
      const ptVoice = { lang: "pt_BR" };
      const speech = fakeSpeech([{ lang: "en-US" }, ptVoice]);
      const { made, createAudio } = audioFactory();
      const n = createNarrator({ speech: asSpeech(speech), createAudio });
      n.unlock();
      const done = vi.fn();
      n.playNarration([three[1], three[2], seg("en-US", "fox")]).then(done);
      made[0].audio.onended!();
      await vi.advanceTimersByTimeAsync(0);
      expect(made).toHaveLength(2);
      made[1].audio.onerror!(); // 2nd segment (pt-BR) fails
      await vi.advanceTimersByTimeAsync(0);
      const [u] = spoken(speech);
      expect(u.lang).toBe("pt-BR");
      expect(u.text).toBe("Muito bem");
      expect(u.voice).toBe(ptVoice);
      end(speech, u);
      await vi.advanceTimersByTimeAsync(0);
      expect(made).toHaveLength(3);
      made[2].audio.onended!();
      await vi.advanceTimersByTimeAsync(0);
      expect(done).toHaveBeenCalled();
    });

    it("a fallback whose speech never ends moves on within the segment safety timeout", async () => {
      vi.useFakeTimers();
      const speech = fakeSpeech();
      const { made, createAudio } = audioFactory();
      const n = createNarrator({ speech: asSpeech(speech), createAudio });
      n.unlock();
      const done = vi.fn();
      n.playNarration([seg("en-US", "bear"), seg("en-US", "fox")]).then(done);
      made[0].audio.onerror!();
      await vi.advanceTimersByTimeAsync(3999);
      expect(made).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(2);
      expect(made).toHaveLength(2);
      expect(spoken(speech)[0].lang).toBe("en-US");
      made[1].audio.onended!();
      await vi.advanceTimersByTimeAsync(0);
      expect(done).toHaveBeenCalled();
    });

    it("a rejected audio.play() also falls back to the voice", async () => {
      const speech = fakeSpeech();
      const audio = fakeAudio(() => Promise.reject(new Error("NotAllowed")));
      const n = createNarrator({ speech: asSpeech(speech), createAudio: asCreate(audio) });
      n.unlock();
      const p = n.playNarration([seg("pt-BR", "Oi")]);
      await nextTask();
      await nextTask(); // the rejection settles first, then the deferred speak runs
      const [u] = spoken(speech);
      expect(u.lang).toBe("pt-BR");
      end(speech, u);
      await p;
    });

    it("error followed by a rejected play() falls back exactly once, then continues", async () => {
      const speech = fakeSpeech();
      let rejectPlay!: (e: Error) => void;
      const first = fakeAudio(() => new Promise<void>((_, rej) => { rejectPlay = rej; }));
      const second = fakeAudio();
      const audios = [first, second];
      const createAudio = (() => audios.shift()) as unknown as (src: string) => HTMLAudioElement;
      const n = createNarrator({ speech: asSpeech(speech), createAudio });
      n.unlock();
      const done = vi.fn();
      n.playNarration([seg("pt-BR", "Oi"), seg("en-US", "fox")]).then(done);
      first.onerror!();
      rejectPlay(new Error("NotSupported"));
      await nextTask();
      await nextTask();
      expect(spoken(speech).map((u) => u.text)).toEqual(["Oi"]);
      expect(audios).toHaveLength(1); // next segment not started yet
      end(speech, spoken(speech)[0]);
      await nextTask();
      expect(audios).toHaveLength(0);
      second.onended!();
      await nextTask();
      expect(done).toHaveBeenCalled();
      expect(spoken(speech).map((u) => u.text)).toEqual(["Oi"]);
    });

    it("audio with no sign of life for 3 s falls back to the voice", async () => {
      vi.useFakeTimers();
      const speech = fakeSpeech();
      const audio = fakeAudio(() => new Promise<void>(() => {}));
      const n = createNarrator({ speech: asSpeech(speech), createAudio: asCreate(audio) });
      n.unlock();
      void n.playNarration([seg("en-US", "bear")]);
      await vi.advanceTimersByTimeAsync(2999);
      expect(spoken(speech)).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(2);
      expect(spoken(speech).map((u) => u.text)).toEqual(["bear"]);
      expect(audio.pause).toHaveBeenCalled();
    });

    it("metadata arriving in time cancels the stall fallback", async () => {
      vi.useFakeTimers();
      const speech = fakeSpeech();
      const audio = fakeAudio();
      const n = createNarrator({ speech: asSpeech(speech), createAudio: asCreate(audio) });
      n.unlock();
      void n.playNarration([seg("en-US", "bear")]);
      audio.duration = 20;
      audio.onloadedmetadata!();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(spoken(speech)).toHaveLength(0);
      expect(audio.pause).not.toHaveBeenCalled();
    });

    it("picks a voice by lang prefix when there is no exact match", async () => {
      const pt = { lang: "pt-PT" };
      const speech = fakeSpeech([{ lang: "en-US" }, pt]);
      const audio = fakeAudio();
      const n = createNarrator({ speech: asSpeech(speech), createAudio: asCreate(audio) });
      n.unlock();
      const p = n.playNarration([seg("pt-BR", "Oi")]);
      audio.onerror!();
      await nextTask();
      const [u] = spoken(speech);
      expect(u.voice).toBe(pt);
      end(speech, u);
      await p;
    });

    it("playSfx is a no-op before unlock, then plays without cutting the voice", async () => {
      const { made, createAudio } = audioFactory();
      const speech = fakeSpeech();
      const n = createNarrator({ speech: asSpeech(speech), createAudio });
      n.playSfx("correct");
      expect(made).toHaveLength(0);
      n.unlock();
      const p = n.playNarration([three[0]]);
      n.playSfx("correct");
      expect(made.map((m) => m.src)).toEqual([audioSrc(three[0]), "/audio/sfx/correct.mp3"]);
      expect(made[1].audio.play).toHaveBeenCalled();
      expect(made[0].audio.pause).not.toHaveBeenCalled();
      expect(speech.cancel).not.toHaveBeenCalled();
      made[0].audio.onended!();
      await p;
    });

    it("playSfx ignores a rejected play()", async () => {
      const audio = fakeAudio(() => Promise.reject(new Error("NotAllowed")));
      const n = createNarrator({ speech: null, createAudio: asCreate(audio) });
      n.unlock();
      expect(() => n.playSfx("tap")).not.toThrow();
      await nextTask();
    });
  });
});
