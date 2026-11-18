import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
const hook = vi.hoisted(() => ({ useBackgroundMusic: vi.fn() }));
vi.mock("@/audio/useBackgroundMusic", () => hook);
vi.mock("@/audio/narrator", () => ({
  narrator: { playNarration: vi.fn(() => Promise.resolve()), playSfx: vi.fn(), stop: vi.fn(), unlock: vi.fn(), isUnlocked: () => true },
}));
let progress: Progress;
let hydrated = true;
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({ progress, hydrated, finishStop: vi.fn(), markToday: vi.fn() }),
}));
vi.mock("@/components/nestoy/SettingsProvider", () => ({
  useSettings: () => ({ settings: { ...defaultSettings(), motion: "reduzir" }, update: vi.fn(), hydrated: true }),
}));

import { NinhoScreen } from "@/components/ninho/NinhoScreen";
import { narrator } from "@/audio/narrator";
import { defaultSettings } from "@/domain/nestoy/settings";
import { getLines, getUnit } from "@/domain/trail/content";
import { emptyProgress, type Progress } from "@/domain/trail/progress";

const challenge = getUnit("forest-animals")!.stops.find((s) => s.kind === "challenge")!;
const sticker = challenge.kind === "challenge" ? challenge.sticker! : null;
const flush = async () => {
  await act(async () => {});
  await act(async () => {});
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 12, 10, 0, 0));
  progress = emptyProgress();
  hydrated = true;
  push.mockClear();
  hook.useBackgroundMusic.mockClear();
  vi.mocked(narrator.playNarration).mockClear();
  vi.mocked(narrator.stop).mockClear();
});
afterEach(() => vi.useRealTimers());

describe("NinhoScreen stickers", () => {
  it("plays the album line and the album music, and silences the line when the child leaves", () => {
    const view = render(<NinhoScreen />);
    expect(narrator.playNarration).toHaveBeenCalledWith(getLines().album);
    expect(hook.useBackgroundMusic).toHaveBeenCalledWith("album");
    vi.mocked(narrator.stop).mockClear();
    view.unmount();
    expect(narrator.stop).toHaveBeenCalled();
  });

  it("an earned sticker is coloured and says its name when tapped", () => {
    progress = { ...emptyProgress(), stickers: { "sticker-forest-bear": "2026-01-01T00:00:00.000Z" } };
    render(<NinhoScreen />);
    const slot = screen.getByRole("button", { name: "bear" });
    expect(slot.querySelector("[data-earned]")).toHaveAttribute("data-earned", "true");
    vi.mocked(narrator.playNarration).mockClear();
    fireEvent.click(slot);
    expect(narrator.playNarration).toHaveBeenCalledWith(sticker!.name);
  });

  it("a missing sticker is a silhouette with a padlock and stays silent", () => {
    render(<NinhoScreen />);
    const slot = screen.getByRole("button", { name: "bear" });
    expect(slot.querySelector("[data-earned]")).toHaveAttribute("data-earned", "false");
    expect(slot).toHaveAttribute("aria-disabled", "true");
    vi.mocked(narrator.playNarration).mockClear();
    fireEvent.click(slot);
    expect(narrator.playNarration).not.toHaveBeenCalled();
  });

  it("shows the next units as locked slots", () => {
    render(<NinhoScreen />);
    expect(screen.getByRole("img", { name: "Unidade 2, Cores" })).toBeInTheDocument();
  });

  it("keeps the phase 1 fox sticker in a special section, saying its name", () => {
    const at = "2026-11-01T12:00:00.000Z";
    progress = { ...emptyProgress(), legacy: { completedLessons: { "forest-animals": at }, stickers: { "sticker-fox": at } } };
    render(<NinhoScreen />);
    expect(screen.getByRole("region", { name: "Figurinhas especiais" })).toBeInTheDocument();
    const fox = document.querySelector('[data-sticker="sticker-fox"]') as HTMLElement;
    expect(fox).toHaveAttribute("data-earned", "true");
    expect(fox.querySelector("img")).toHaveAttribute("src", "/content/forest-animals/sticker-fox.svg");
    vi.mocked(narrator.playNarration).mockClear();
    fireEvent.click(fox);
    expect(narrator.unlock).toHaveBeenCalled();
    expect(narrator.playNarration).toHaveBeenCalledWith(getLines().legacyFox);
    fireEvent.click(screen.getByRole("button", { name: "Figurinhas especiais" }));
    expect(narrator.playNarration).toHaveBeenLastCalledWith(getLines().legacySection);
  });

  it("has no special section without phase 1 stickers, nor before the progress is loaded", () => {
    progress = { ...emptyProgress(), legacy: { completedLessons: {}, stickers: {} } };
    const view = render(<NinhoScreen />);
    expect(screen.queryByRole("region", { name: "Figurinhas especiais" })).not.toBeInTheDocument();
    view.unmount();
    hydrated = false;
    progress = { ...emptyProgress(), stickers: { "sticker-forest-bear": "x" }, legacy: { completedLessons: {}, stickers: { "sticker-fox": "2026-11-01T12:00:00.000Z" } } };
    render(<NinhoScreen />);
    expect(screen.queryByRole("region", { name: "Figurinhas especiais" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "bear" }).querySelector("[data-earned]")).toHaveAttribute("data-earned", "false");
  });
});

describe("NinhoScreen memory training", () => {
  it("with cards due shows the count and Treinar, which goes to /memoria", async () => {
    progress = { ...emptyProgress(), memory: { "forest-animals:bear": { box: 0, due: "2026-11-12" }, "forest-animals:bird": { box: 0, due: "2026-11-10" } } };
    render(<NinhoScreen />);
    await flush();
    const memory = screen.getByRole("region", { name: "Treino de memória" });
    expect(within(memory).getByText("2")).toBeInTheDocument();
    expect(within(memory).getByText("cartões prontos hoje")).toBeInTheDocument();
    expect(screen.queryByText("Tudo em dia!")).not.toBeInTheDocument();
    fireEvent.click(within(memory).getByRole("button", { name: "Treinar" }));
    expect(push).toHaveBeenCalledWith("/memoria");
  });

  it("with nothing due says Tudo em dia! and when the next training is, without Treinar", async () => {
    progress = { ...emptyProgress(), memory: { "forest-animals:bear": { box: 1, due: "2026-11-13" } } };
    render(<NinhoScreen />);
    await flush();
    expect(screen.getByText("Tudo em dia!")).toBeInTheDocument();
    expect(screen.getByText("Próximo treino: amanhã")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Treinar" })).not.toBeInTheDocument();
  });

  it("with no cards at all it is also Tudo em dia!", async () => {
    render(<NinhoScreen />);
    await flush();
    expect(screen.getByText("Tudo em dia!")).toBeInTheDocument();
    expect(screen.queryByText(/Próximo treino/)).not.toBeInTheDocument();
  });
});

describe("NinhoScreen exit", () => {
  it("the round × goes back to the island", () => {
    render(<NinhoScreen />);
    const back = screen.getByRole("button", { name: "Voltar para a ilha" });
    fireEvent.click(back);
    expect(push).toHaveBeenCalledWith("/");
  });
});
