/* Deterministic clock for the stage: tweens and waits advance only when `step(t)` is called.
   Ported from tools/visual/ilha/src/app.js. */

export type Ease = "lin" | "io" | "out" | "in" | "sine" | "back" | "soft" | "cam";

export const EASE: Record<Ease, (t: number) => number> = {
  lin: t => t,
  io: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  back: t => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  soft: t => 1 - Math.pow(1 - t, 4),
  cam: t => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
};

export type Timeline = {
  now(): number;
  step(t: number): void;
  tween<T extends object>(
    obj: T,
    to: Partial<Record<keyof T, number | number[]>>,
    ms: number,
    ease?: Ease,
    opts?: { delay?: number; onUpdate?: (e: number) => void },
  ): Promise<void>;
  wait(ms: number): Promise<void>;
  cancelAll(): void;
  generation(): number;
};

type Bag = Record<string, number | number[]>;
type Tween = {
  obj: Bag; to: Bag; from: Bag | null; dur: number; ease: (t: number) => number;
  start: number; res: () => void; upd?: (e: number) => void;
};
type Waiter = { at: number; res: () => void };

export function createTimeline(): Timeline {
  let now = 0, gen = 0;
  let tweens: Tween[] = [];
  let waiters: Waiter[] = [];

  function step(t: number) {
    now = t;
    const due: Waiter[] = [];
    waiters = waiters.filter(w => (t >= w.at ? (due.push(w), false) : true));
    due.forEach(w => w.res());
    const finished: Tween[] = [];
    tweens = tweens.filter(tw => {
      if (t < tw.start) return true;
      if (!tw.from) {
        tw.from = {};
        for (const k in tw.to) { const v = tw.obj[k]; tw.from[k] = Array.isArray(v) ? v.slice() : v; }
      }
      const p = Math.min(1, (t - tw.start) / tw.dur), e = p >= 1 ? 1 : tw.ease(p);
      for (const k in tw.to) {
        const a = tw.from[k], b = tw.to[k];
        if (Array.isArray(b)) {
          const af = a as number[];
          tw.obj[k] = p >= 1 ? b.slice() : b.map((v, i) => af[i] + (v - af[i]) * e);
        } else {
          const af = a as number;
          tw.obj[k] = p >= 1 ? b : af + (b - af) * e;
        }
      }
      tw.upd?.(e);
      if (p >= 1) { finished.push(tw); return false; }
      return true;
    });
    finished.forEach(tw => tw.res());
  }

  return {
    now: () => now,
    step,
    tween(obj, to, ms, ease = "io", opts = {}) {
      return new Promise<void>(res => {
        tweens.push({
          obj: obj as unknown as Bag, to: to as Bag, from: null, dur: Math.max(1, ms), ease: EASE[ease],
          start: now + (opts.delay ?? 0), res, upd: opts.onUpdate,
        });
      });
    },
    wait: ms => new Promise<void>(res => { waiters.push({ at: now + ms, res }); }),
    cancelAll() { gen++; tweens = []; waiters = []; },
    generation: () => gen,
  };
}
