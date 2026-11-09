import { act, render, renderHook, screen } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { ProgressProvider, useProgress } from "@/components/ProgressProvider";

function Probe() {
  const { progress, finishLesson } = useProgress();
  return (
    <button onClick={() => finishLesson("a", "s")}>{Object.keys(progress.completedLessons).join(",") || "none"}</button>
  );
}

describe("ProgressProvider", () => {
  beforeEach(() => localStorage.clear());
  it("finishLesson updates progress and persists", () => {
    render(<ProgressProvider><Probe /></ProgressProvider>);
    expect(screen.getByRole("button").textContent).toBe("none");
    act(() => screen.getByRole("button").click());
    expect(screen.getByRole("button").textContent).toBe("a");
    expect(JSON.parse(localStorage.getItem("lingoo:progress:v1")!).completedLessons).toHaveProperty("a");
  });
  it("throws outside the provider", () => {
    expect(() => renderHook(() => useProgress())).toThrow(/ProgressProvider/);
  });
  it("does not lose stored progress when a child finishes a lesson in its mount effect", () => {
    localStorage.setItem(
      "lingoo:progress:v1",
      JSON.stringify({ completedLessons: { old: "2026-01-01T00:00:00.000Z" }, stickers: {} }),
    );
    function Early() {
      const { progress, finishLesson } = useProgress();
      useEffect(() => finishLesson("new", "s"), [finishLesson]);
      return <p>{Object.keys(progress.completedLessons).sort().join(",")}</p>;
    }
    render(<ProgressProvider><Early /></ProgressProvider>);
    expect(screen.getByText("new,old")).toBeTruthy();
    expect(Object.keys(JSON.parse(localStorage.getItem("lingoo:progress:v1")!).completedLessons).sort()).toEqual(["new", "old"]);
  });
  it("reports hydrated only after stored progress is loaded", () => {
    const seen: boolean[] = [];
    function H() {
      seen.push(useProgress().hydrated);
      return null;
    }
    render(<ProgressProvider><H /></ProgressProvider>);
    expect(seen[0]).toBe(false);
    expect(seen[seen.length - 1]).toBe(true);
  });
});
