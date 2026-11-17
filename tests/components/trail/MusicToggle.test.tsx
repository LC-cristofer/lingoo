import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => {
  const s = { enabled: true, listeners: new Set<() => void>() };
  return {
    s,
    music: {
      isEnabled: () => s.enabled,
      setEnabled: vi.fn((v: boolean) => {
        s.enabled = v;
        s.listeners.forEach((l) => l());
      }),
      subscribe: (l: () => void) => {
        s.listeners.add(l);
        return () => void s.listeners.delete(l);
      },
    },
  };
});
vi.mock("@/audio/music", () => ({ music: store.music }));

import { MusicToggle } from "@/components/trail/kit/MusicToggle";

beforeEach(() => {
  store.s.enabled = true;
  store.music.setEnabled.mockClear();
});

describe("MusicToggle", () => {
  it("is a pressed button named 'Música ligada' while the music is on", () => {
    render(<MusicToggle />);
    const button = screen.getByRole("button", { name: "Música ligada" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button.querySelector("svg")).toHaveAttribute("data-music", "on");
  });

  it("shows the slashed note and 'Música desligada' when it is off", () => {
    store.s.enabled = false;
    render(<MusicToggle />);
    const button = screen.getByRole("button", { name: "Música desligada" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button.querySelector("svg")).toHaveAttribute("data-music", "off");
  });

  it("flips on every tap", () => {
    render(<MusicToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Música ligada" }));
    expect(store.music.setEnabled).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole("button", { name: "Música desligada" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Música desligada" }));
    expect(store.music.setEnabled).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole("button", { name: "Música ligada" })).toBeInTheDocument();
  });

  it("is at least 64 x 64 px (class contract)", () => {
    render(<MusicToggle />);
    expect(screen.getByRole("button").className).toContain("k-music");
  });
});
