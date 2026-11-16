import type { Page } from "@playwright/test";

// A recording fake speechSynthesis, so the e2e can hear audio bugs (final review I1-I4).
// It queues utterances like a real engine, fires onend after a hold, logs speak/cancel/end,
// and drops an utterance spoken in the same task as cancel(), as Chrome and Safari do.

export type FakeOptions = { holdMs: number; holdByText?: Record<string, number> };
export type FakeWindow = Window & { __spoken: string[]; __log: string[]; __holdMs: number };

/** Runs inside the page (pass it to `page.addInitScript`): it must stay self-contained. */
export function fakeSpeechScript({ holdMs, holdByText = {} }: FakeOptions) {
  const w = window as unknown as FakeWindow;
  w.__spoken = [];
  w.__log = [];
  w.__holdMs = holdMs;

  class FakeUtterance {
    lang = "";
    rate = 1;
    volume = 1;
    voice: unknown = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public text: string) {}
  }

  const queue: FakeUtterance[] = [];
  let current: FakeUtterance | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelledThisTask = false;

  const startNext = () => {
    current = queue.shift() ?? null;
    const u = current;
    if (!u) return;
    timer = setTimeout(() => {
      if (current !== u) return;
      current = null;
      w.__log.push(`end:${u.text}`);
      u.onend?.();
      startNext();
    }, holdByText[u.text] ?? w.__holdMs);
  };

  const synth = {
    get speaking() {
      return current !== null;
    },
    get pending() {
      return queue.length > 0;
    },
    paused: false,
    getVoices: () => [],
    speak(u: FakeUtterance) {
      if (cancelledThisTask) {
        w.__log.push(`dropped:${u.text}`);
        return;
      }
      w.__log.push(`speak:${u.text}`);
      if (u.text) w.__spoken.push(u.text);
      queue.push(u);
      if (!current) startNext();
    },
    cancel() {
      w.__log.push(`cancel:${current?.text ?? ""}`);
      queue.length = 0;
      current = null;
      clearTimeout(timer);
      cancelledThisTask = true;
      queueMicrotask(() => {
        cancelledThisTask = false;
      });
    },
    pause() {},
    resume() {},
    addEventListener() {},
    removeEventListener() {},
  };

  Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, writable: true, value: FakeUtterance });
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synth });
}

export async function installFakeSpeech(page: Page, opts: Partial<FakeOptions> = {}): Promise<void> {
  await page.addInitScript(fakeSpeechScript, { holdMs: opts.holdMs ?? 50, holdByText: opts.holdByText });
}

/** Non-empty texts handed to the browser voice: empty means every line came from an mp3 file. */
export const spoken = (page: Page) => page.evaluate(() => (window as unknown as FakeWindow).__spoken);
export const log = (page: Page) => page.evaluate(() => (window as unknown as FakeWindow).__log);

/** Starts recording `/audio/*.mp3` requests; the returned function reads the paths so far. */
export function recordAudio(page: Page): () => string[] {
  const seen: string[] = [];
  page.on("request", (req) => {
    const { pathname } = new URL(req.url());
    if (pathname.startsWith("/audio/") && pathname.endsWith(".mp3")) seen.push(pathname);
  });
  return () => [...seen];
}
