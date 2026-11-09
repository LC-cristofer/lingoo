import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioUnlock } from "@/audio/AudioUnlock";
import { narrator } from "@/audio/narrator";

let unlocked = false;
vi.mock("@/audio/narrator", () => ({
  narrator: {
    play: vi.fn(() => Promise.resolve()),
    stop: vi.fn(),
    unlock: vi.fn(() => {
      unlocked = true;
    }),
    isUnlocked: () => unlocked,
  },
}));

beforeEach(() => {
  unlocked = false;
  vi.mocked(narrator.unlock).mockClear();
});

describe("AudioUnlock (mounted once in the root layout)", () => {
  it("renders nothing", () => {
    const { container } = render(<AudioUnlock />);
    expect(container).toBeEmptyDOMElement();
  });

  it("unlocks on the first click anywhere, once", () => {
    render(<AudioUnlock />);
    fireEvent.click(document.body);
    fireEvent.click(document.body);
    expect(narrator.unlock).toHaveBeenCalledTimes(1);
  });

  it("unlocks on the first touchend or keydown", () => {
    const first = render(<AudioUnlock />);
    fireEvent.touchEnd(document.body);
    expect(narrator.unlock).toHaveBeenCalledTimes(1);
    first.unmount();
    unlocked = false;
    render(<AudioUnlock />);
    fireEvent.keyDown(document.body, { key: "a" });
    expect(narrator.unlock).toHaveBeenCalledTimes(2);
  });

  it("does not unlock on pointerdown, which is not a user gesture for touch (iOS)", () => {
    render(<AudioUnlock />);
    fireEvent.pointerDown(document.body, { pointerType: "touch" });
    expect(narrator.unlock).not.toHaveBeenCalled();
  });

  it("unlocks before React click handlers run (capture phase)", () => {
    const order: string[] = [];
    vi.mocked(narrator.unlock).mockImplementationOnce(() => {
      order.push("unlock");
      unlocked = true;
    });
    const { getByRole } = render(
      <>
        <AudioUnlock />
        <button type="button" onClick={() => order.push("click")}>
          go
        </button>
      </>,
    );
    fireEvent.click(getByRole("button"));
    expect(order).toEqual(["unlock", "click"]);
  });

  it("adds no listener when already unlocked", () => {
    unlocked = true;
    render(<AudioUnlock />);
    fireEvent.click(document.body);
    expect(narrator.unlock).not.toHaveBeenCalled();
  });

  it("removes its listeners on unmount", () => {
    const { unmount } = render(<AudioUnlock />);
    unmount();
    fireEvent.click(document.body);
    expect(narrator.unlock).not.toHaveBeenCalled();
  });
});
