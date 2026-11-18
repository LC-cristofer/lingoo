import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
const update = vi.fn();
let settings: Settings;
vi.mock("@/components/nestoy/SettingsProvider", () => ({
  useSettings: () => ({ settings, update, hydrated: true }),
}));
const ambience = vi.hoisted(() => ({ play: vi.fn(), stop: vi.fn(), current: vi.fn(() => null) }));
vi.mock("@/audio/ambience", () => ({ ambience }));
const musicMock = vi.hoisted(() => {
  let on = true;
  const listeners = new Set<() => void>();
  return {
    isEnabled: () => on,
    setEnabled: vi.fn((v: boolean) => {
      on = v;
      listeners.forEach((l) => l());
    }),
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    reset: () => {
      on = true;
    },
  };
});
vi.mock("@/audio/music", () => ({ music: musicMock }));

import { ParentsScreen } from "@/components/parents/ParentsScreen";
import { defaultSettings, type Settings } from "@/domain/nestoy/settings";

const hold = () => screen.getByRole("button", { name: "Segure para entrar" });
async function openGate() {
  fireEvent.pointerDown(hold());
  await act(async () => {
    vi.advanceTimersByTime(2000);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  settings = { ...defaultSettings(), motion: "reduzir" };
  update.mockClear();
  push.mockClear();
  ambience.stop.mockClear();
  musicMock.setEnabled.mockClear();
  musicMock.reset();
});
afterEach(() => vi.useRealTimers());

describe("the parents' gate", () => {
  it("starts closed: only the held button, no preferences", () => {
    render(<ParentsScreen />);
    expect(hold()).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Noite" })).not.toBeInTheDocument();
  });

  it("does not open on a 500 ms press and starts over after letting go", async () => {
    render(<ParentsScreen />);
    fireEvent.pointerDown(hold());
    expect(hold()).toHaveAttribute("data-holding", "true");
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(hold());
    expect(hold()).toHaveAttribute("data-holding", "false");
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByRole("button", { name: "Noite" })).not.toBeInTheDocument();
    // a second, full hold still needs its own 2 s
    fireEvent.pointerDown(hold());
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByRole("button", { name: "Noite" })).not.toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole("button", { name: "Noite" })).toBeInTheDocument();
  });

  it("sliding off the button cancels the hold", async () => {
    render(<ParentsScreen />);
    fireEvent.pointerDown(hold());
    fireEvent.pointerLeave(hold());
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.queryByRole("button", { name: "Noite" })).not.toBeInTheDocument();
  });

  it("opens after 2000 ms", async () => {
    render(<ParentsScreen />);
    await openGate();
    expect(screen.getByRole("button", { name: "Noite" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Segure para entrar" })).not.toBeInTheDocument();
  });

  it("the round × leaves for the island without opening", () => {
    render(<ParentsScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Voltar para a ilha" }));
    expect(push).toHaveBeenCalledWith("/");
  });
});

describe("the parents' preferences", () => {
  it("choosing Noite saves ambient noite", async () => {
    render(<ParentsScreen />);
    await openGate();
    fireEvent.click(screen.getByRole("button", { name: "Noite" }));
    expect(update).toHaveBeenCalledWith({ ambient: "noite" });
  });

  it("marks the current choices as pressed", async () => {
    settings = { ...settings, ambient: "rotina", pauseMinutes: 20 };
    render(<ParentsScreen />);
    await openGate();
    expect(screen.getByRole("button", { name: "Seguir a rotina" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Sempre dia" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "20 min" })).toHaveAttribute("aria-pressed", "true");
  });

  it("the bedtime field only shows with Seguir a rotina and saves a valid time", async () => {
    const view = render(<ParentsScreen />);
    await openGate();
    expect(screen.queryByLabelText("Horário de dormir")).not.toBeInTheDocument();
    view.unmount();
    settings = { ...settings, ambient: "rotina" };
    render(<ParentsScreen />);
    await openGate();
    const input = screen.getByLabelText("Horário de dormir");
    expect(input).toHaveAttribute("type", "time");
    expect(input).toHaveValue("19:30");
    fireEvent.change(input, { target: { value: "20:15" } });
    expect(update).toHaveBeenCalledWith({ bedtime: "20:15" });
  });

  it("saves the pause, the opening and the movement choices", async () => {
    render(<ParentsScreen />);
    await openGate();
    fireEvent.click(screen.getByRole("button", { name: "30 min" }));
    expect(update).toHaveBeenLastCalledWith({ pauseMinutes: 30 });
    fireEvent.click(screen.getByRole("button", { name: "Sempre curta" }));
    expect(update).toHaveBeenLastCalledWith({ opening: "curta" });
    fireEvent.click(screen.getByRole("button", { name: "Reduzir movimento" }));
    expect(update).toHaveBeenLastCalledWith({ motion: "reduzir" });
  });

  it("Rever abertura saves openingSeen false and goes to the island", async () => {
    render(<ParentsScreen />);
    await openGate();
    fireEvent.click(screen.getByRole("button", { name: "Rever abertura" }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ openingSeen: false }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("turning the music off stops the ambience too", async () => {
    render(<ParentsScreen />);
    await openGate();
    expect(screen.getByRole("button", { name: "Ligada" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Desligada" }));
    expect(musicMock.setEnabled).toHaveBeenCalledWith(false);
    expect(ambience.stop).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Desligada" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Ligada" }));
    expect(musicMock.setEnabled).toHaveBeenLastCalledWith(true);
  });

  it("Fechar goes to the island", async () => {
    render(<ParentsScreen />);
    await openGate();
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(push).toHaveBeenCalledWith("/");
  });
});
