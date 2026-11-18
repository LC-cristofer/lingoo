import { describe, expect, it } from "vitest";
import { createTimeline } from "@/world/timeline";

describe("timeline", () => {
  it("a tween reaches its target exactly at ms", () => {
    const tl = createTimeline();
    const o = { x: 0.1, y: 5 };
    let done = false;
    tl.tween(o, { x: 0.3, y: 105 }, 1000, "lin").then(() => (done = true));
    tl.step(0);
    tl.step(500);
    expect(o.y).toBeCloseTo(55, 6);
    tl.step(1000);
    expect(o.x).toBe(0.3);
    expect(o.y).toBe(105);
    return Promise.resolve().then(() => expect(done).toBe(true));
  });

  it("tweens array targets element-wise", () => {
    const tl = createTimeline();
    const o = { a: [0, 10] };
    tl.tween(o, { a: [10, 0] }, 100, "lin");
    tl.step(0);
    tl.step(50);
    expect(o.a[0]).toBeCloseTo(5, 6);
    expect(o.a[1]).toBeCloseTo(5, 6);
    tl.step(100);
    expect(o.a).toEqual([10, 0]);
  });

  it("wait resolves at the right step", async () => {
    const tl = createTimeline();
    let done = false;
    tl.wait(300).then(() => (done = true));
    tl.step(0);
    tl.step(299);
    await Promise.resolve();
    expect(done).toBe(false);
    tl.step(300);
    await Promise.resolve();
    expect(done).toBe(true);
  });

  it("delay postpones the tween and onUpdate gets the eased value", () => {
    const tl = createTimeline();
    const o = { v: 0 };
    const seen: number[] = [];
    tl.tween(o, { v: 1 }, 100, "lin", { delay: 100, onUpdate: e => seen.push(e) });
    tl.step(0);
    tl.step(99);
    expect(o.v).toBe(0);
    tl.step(150);
    expect(o.v).toBeCloseTo(0.5, 6);
    expect(seen.at(-1)).toBeCloseTo(0.5, 6);
  });

  it("cancelAll stops a running tween, its promise stays pending, and generation bumps", async () => {
    const tl = createTimeline();
    const o = { x: 0 };
    let resolved = false;
    const g0 = tl.generation();
    tl.tween(o, { x: 100 }, 1000, "lin").then(() => (resolved = true));
    tl.step(0);
    tl.step(400);
    expect(o.x).toBeCloseTo(40, 6);
    tl.cancelAll();
    expect(tl.generation()).toBe(g0 + 1);
    tl.step(800);
    tl.step(2000);
    await Promise.resolve();
    expect(o.x).toBeCloseTo(40, 6);
    expect(resolved).toBe(false);
  });

  it("back overshoots above 1 mid-way and lands on 1", () => {
    const tl = createTimeline();
    const o = { v: 0 };
    let max = 0;
    tl.tween(o, { v: 1 }, 1000, "back", { onUpdate: () => (max = Math.max(max, o.v)) });
    tl.step(0);
    for (let t = 100; t <= 1000; t += 100) tl.step(t);
    expect(max).toBeGreaterThan(1);
    expect(o.v).toBe(1);
  });

  it("now() follows the last step", () => {
    const tl = createTimeline();
    tl.step(1234);
    expect(tl.now()).toBe(1234);
  });
});
