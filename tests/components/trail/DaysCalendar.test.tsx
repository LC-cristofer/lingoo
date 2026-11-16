import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DaysCalendar } from "@/components/trail/DaysCalendar";
import { emptyProgress } from "@/domain/trail/progress";

describe("DaysCalendar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("moves the today marker when midnight passes with the page left open", () => {
    // Wednesday 11 Nov 2026, just before midnight.
    vi.setSystemTime(new Date(2026, 10, 11, 23, 59, 30));
    const { container } = render(<DaysCalendar progress={emptyProgress()} />);
    const todayIndex = () => [...container.querySelectorAll(".k-day")].findIndex((d) => d.classList.contains("is-today"));
    expect(todayIndex()).toBe(2); // Mon=0, Tue=1, Wed=2
    act(() => {
      vi.advanceTimersByTime(40_000);
    });
    expect(todayIndex()).toBe(3);
  });
});
