import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultSettings } from "@/domain/nestoy/settings";

import { defaultProfile } from "@/domain/nestoy/profile";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
vi.mock("@/audio/narrator", () => ({
  narrator: { playNarration: vi.fn(() => Promise.resolve()), playSfx: vi.fn(), stop: vi.fn(), unlock: vi.fn(), isUnlocked: vi.fn(() => true) },
}));
vi.mock("@/audio/ambience", () => ({ ambience: { play: vi.fn(), stop: vi.fn(), current: vi.fn(() => null) } }));
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({
    progress: { completedStops: {}, stickers: {}, daysPlayed: [], memory: {}, version: 3, legacy: null },
    hydrated: true,
    finishStop: vi.fn(),
    markToday: vi.fn(),
  }),
}));
vi.mock("@/components/nestoy/ProfileProvider", () => ({
  useProfile: () => ({ profile: { ...defaultProfile(), onboarding: "done" }, hydrated: true, update: vi.fn(), setLevel: vi.fn() }),
}));
vi.mock("@/components/nestoy/SettingsProvider", () => ({
  useSettings: () => ({ settings: { ...defaultSettings(), motion: "reduzir" }, update: vi.fn(), hydrated: true }),
}));

import Home from "@/app/page";

describe("Home", () => {
  it("is the island: six places, the parents' door and no start button", () => {
    render(<Home />);
    for (const n of ["Ninho do Nino", "Farol das Línguas", "Árvore das Letras", "Torre dos Números", "Jardim das Cores", "Lago das Descobertas"]) {
      expect(screen.getByRole("button", { name: n })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Área dos responsáveis" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Jogar" })).not.toBeInTheDocument();
  });
});
