import { act, render, renderHook, screen } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { TrailProgressProvider, useTrailProgress } from "@/components/trail/TrailProgressProvider";

const KEY = "lingoo:progress:v2";

function Probe() {
  const { progress, finishStop, markToday } = useTrailProgress();
  return (
    <>
      <button onClick={() => finishStop("a", "s")}>{Object.keys(progress.completedStops).join(",") || "none"}</button>
      <button onClick={() => markToday()}>day</button>
      <p data-testid="days">{progress.daysPlayed.length}</p>
    </>
  );
}

describe("TrailProgressProvider", () => {
  beforeEach(() => localStorage.clear());
  it("finishStop updates progress and persists", () => {
    render(<TrailProgressProvider><Probe /></TrailProgressProvider>);
    const btn = screen.getAllByRole("button")[0];
    expect(btn.textContent).toBe("none");
    act(() => btn.click());
    expect(screen.getAllByRole("button")[0].textContent).toBe("a");
    const stored = JSON.parse(localStorage.getItem(KEY)!);
    expect(stored.completedStops).toHaveProperty("a");
    expect(stored.stickers).toHaveProperty("s");
  });
  it("markToday records the day and no stop", () => {
    render(<TrailProgressProvider><Probe /></TrailProgressProvider>);
    act(() => screen.getByText("day").click());
    expect(screen.getByTestId("days").textContent).toBe("1");
    const stored = JSON.parse(localStorage.getItem(KEY)!);
    expect(stored.completedStops).toEqual({});
    expect(stored.daysPlayed).toHaveLength(1);
  });
  it("throws outside the provider", () => {
    expect(() => renderHook(() => useTrailProgress())).toThrow(/TrailProgressProvider/);
  });
  it("does not lose stored progress when a child finishes a stop in its mount effect", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ completedStops: { old: "2026-01-01T00:00:00.000Z" }, stickers: {}, daysPlayed: [] }),
    );
    function Early() {
      const { progress, finishStop } = useTrailProgress();
      useEffect(() => finishStop("new"), [finishStop]);
      return <p>{Object.keys(progress.completedStops).sort().join(",")}</p>;
    }
    render(<TrailProgressProvider><Early /></TrailProgressProvider>);
    expect(screen.getByText("new,old")).toBeTruthy();
    expect(Object.keys(JSON.parse(localStorage.getItem(KEY)!).completedStops).sort()).toEqual(["new", "old"]);
  });
  it("reports hydrated only after load", () => {
    const seen: boolean[] = [];
    function H() {
      seen.push(useTrailProgress().hydrated);
      return null;
    }
    render(<TrailProgressProvider><H /></TrailProgressProvider>);
    expect(seen[0]).toBe(false);
    expect(seen[seen.length - 1]).toBe(true);
  });
});
