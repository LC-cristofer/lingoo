import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Progress } from "@/domain/trail/progress";
import { defaultProfile, type Profile } from "@/domain/nestoy/profile";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(), useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
const island = vi.hoisted(() => vi.fn());
vi.mock("@/components/island/IslandScreen", () => ({
  IslandScreen: (props: { held?: boolean }) => {
    island(props);
    return <div data-testid="island" data-held={String(!!props.held)} />;
  },
}));
vi.mock("@/audio/narrator", () => ({
  narrator: { playNarration: vi.fn(() => Promise.resolve()), playSfx: vi.fn(), stop: vi.fn(), unlock: vi.fn(), isUnlocked: () => true },
}));
let profile: Profile;
let profileReady = true;
let progress: Progress;
vi.mock("@/components/nestoy/ProfileProvider", () => ({
  useProfile: () => ({ profile, hydrated: profileReady, update: vi.fn(), setLevel: vi.fn() }),
}));
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({ progress, hydrated: true }),
}));

import { IslandRoute } from "@/components/island/IslandRoute";

const empty = (): Progress => ({ completedStops: {}, stickers: {}, daysPlayed: [], memory: {}, version: 3, legacy: null });

beforeEach(() => {
  profile = defaultProfile();
  profileReady = true;
  progress = empty();
});

describe("IslandRoute", () => {
  it("a new install: the cadastro covers a held island, without Agora não", () => {
    render(<IslandRoute />);
    expect(screen.getByText("Chame um adulto!")).toBeInTheDocument();
    expect(screen.getByTestId("island")).toHaveAttribute("data-held", "true");
    expect(screen.queryByRole("button", { name: "Agora não" })).not.toBeInTheDocument();
  });

  it("an install with progress and no profile gets Agora não", () => {
    progress = { ...empty(), daysPlayed: ["2026-11-01"] };
    render(<IslandRoute />);
    expect(screen.getByRole("button", { name: "Agora não" })).toBeInTheDocument();
  });

  it("done or skipped: no cadastro, the island is free to open", () => {
    for (const onboarding of ["done", "skipped"] as const) {
      profile = { ...defaultProfile(), onboarding };
      const { unmount } = render(<IslandRoute />);
      expect(screen.queryByText("Chame um adulto!")).not.toBeInTheDocument();
      expect(screen.getByTestId("island")).toHaveAttribute("data-held", "false");
      unmount();
    }
  });

  it("before the profile is read the island waits and no cadastro flashes", () => {
    profileReady = false;
    render(<IslandRoute />);
    expect(screen.queryByText("Chame um adulto!")).not.toBeInTheDocument();
    expect(screen.getByTestId("island")).toHaveAttribute("data-held", "true");
  });
});
