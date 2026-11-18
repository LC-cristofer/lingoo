import { act, fireEvent, render, screen } from "@testing-library/react";
import { Activity, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HoldGate } from "@/components/parents/HoldGate";

const hold = () => screen.getByRole("button", { name: "Segure para entrar" });
const tick = (ms: number) =>
  act(async () => {
    vi.advanceTimersByTime(ms);
  });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("HoldGate: keyboard", () => {
  it("opens after holding Space for 2 s and not before", async () => {
    const onOpen = vi.fn();
    render(<HoldGate onOpen={onOpen} />);
    fireEvent.keyDown(hold(), { key: " " });
    expect(hold()).toHaveAttribute("data-holding", "true");
    await tick(1900);
    expect(onOpen).not.toHaveBeenCalled();
    await tick(200);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(hold()).toHaveAttribute("data-holding", "false");
  });

  it("Enter works the same and a key repeat does not restart the hold", async () => {
    const onOpen = vi.fn();
    render(<HoldGate onOpen={onOpen} />);
    fireEvent.keyDown(hold(), { key: "Enter" });
    await tick(1000);
    fireEvent.keyDown(hold(), { key: "Enter", repeat: true });
    await tick(1100);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("releasing the key early starts over", async () => {
    const onOpen = vi.fn();
    render(<HoldGate onOpen={onOpen} />);
    fireEvent.keyDown(hold(), { key: " " });
    await tick(800);
    fireEvent.keyUp(hold(), { key: " " });
    expect(hold()).toHaveAttribute("data-holding", "false");
    await tick(3000);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("other keys do nothing", async () => {
    const onOpen = vi.fn();
    render(<HoldGate onOpen={onOpen} />);
    fireEvent.keyDown(hold(), { key: "a" });
    expect(hold()).toHaveAttribute("data-holding", "false");
    await tick(3000);
    expect(onOpen).not.toHaveBeenCalled();
  });
});

describe("HoldGate: losing the button", () => {
  it("losing focus (blur) cancels the hold", async () => {
    const onOpen = vi.fn();
    render(<HoldGate onOpen={onOpen} />);
    fireEvent.keyDown(hold(), { key: " " });
    await tick(1000);
    fireEvent.blur(hold());
    expect(hold()).toHaveAttribute("data-holding", "false");
    await tick(3000);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("a pointer that slides off the button (leave, cancel) cancels the hold", async () => {
    const onOpen = vi.fn();
    render(<HoldGate onOpen={onOpen} />);
    fireEvent.pointerDown(hold());
    await tick(1000);
    fireEvent.pointerLeave(hold());
    await tick(3000);
    fireEvent.pointerDown(hold());
    await tick(1000);
    fireEvent.pointerCancel(hold());
    await tick(3000);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("a secondary mouse button does not start a hold", async () => {
    const onOpen = vi.fn();
    render(<HoldGate onOpen={onOpen} />);
    fireEvent.pointerDown(hold(), { button: 2 });
    expect(hold()).toHaveAttribute("data-holding", "false");
    await tick(3000);
    expect(onOpen).not.toHaveBeenCalled();
  });
});

describe("HoldGate: kept-alive routes", () => {
  function Host({ onOpen }: { onOpen: () => void }) {
    const [visible, setVisible] = useState(true);
    return (
      <>
        <button type="button" onClick={() => setVisible((v) => !v)}>toggle</button>
        <Activity mode={visible ? "visible" : "hidden"}>
          <HoldGate onOpen={onOpen} />
        </Activity>
      </>
    );
  }

  it("a hold in progress does not survive the page being hidden: no opening while away, a full 2 s on return", async () => {
    const onOpen = vi.fn();
    render(<Host onOpen={onOpen} />);
    fireEvent.pointerDown(hold());
    await tick(1500);
    fireEvent.click(screen.getByText("toggle")); // hidden: effects clean up
    await tick(3000);
    expect(onOpen).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("toggle")); // shown again
    expect(hold()).toHaveAttribute("data-holding", "false");
    fireEvent.pointerDown(hold());
    await tick(1500);
    expect(onOpen).not.toHaveBeenCalled();
    await tick(600);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
