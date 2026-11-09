import { act, render, renderHook, screen } from "@testing-library/react";
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
});
