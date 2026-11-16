import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToday } from "@/components/trail/useToday";

function Today() {
  return <p data-testid="today">{useToday() ?? "none"}</p>;
}

describe("useToday", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("re-reads the day when the local midnight passes with the page left open", () => {
    vi.setSystemTime(new Date(2026, 10, 12, 23, 59, 30));
    render(<Today />);
    expect(screen.getByTestId("today")).toHaveTextContent("2026-11-12");
    act(() => {
      vi.advanceTimersByTime(40_000); // past midnight + 1 s
    });
    expect(screen.getByTestId("today")).toHaveTextContent("2026-11-13");
  });

  it("re-reads the day when the tab becomes visible again", () => {
    vi.setSystemTime(new Date(2026, 10, 12, 10, 0, 0));
    render(<Today />);
    expect(screen.getByTestId("today")).toHaveTextContent("2026-11-12");
    vi.setSystemTime(new Date(2026, 10, 14, 8, 0, 0));
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(screen.getByTestId("today")).toHaveTextContent("2026-11-14");
  });

  it("cleans up its timer and listener on unmount", () => {
    vi.setSystemTime(new Date(2026, 10, 12, 10, 0, 0));
    const remove = vi.spyOn(document, "removeEventListener");
    const view = render(<Today />);
    view.unmount();
    expect(remove).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
  });
});
