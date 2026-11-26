import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultProfile, type Profile } from "@/domain/nestoy/profile";
import type { Progress } from "@/domain/trail/progress";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("@/audio/narrator", () => ({
  narrator: { playNarration: vi.fn(() => Promise.resolve()), playSfx: vi.fn(), stop: vi.fn(), unlock: vi.fn(), isUnlocked: vi.fn(() => true) },
}));
let progress: Progress;
let profile: Profile;
vi.mock("@/components/trail/TrailProgressProvider", () => ({
  useTrailProgress: () => ({ progress, hydrated: true, finishStop: vi.fn(), markToday: vi.fn() }),
}));
vi.mock("@/components/nestoy/ProfileProvider", () => ({
  useProfile: () => ({ profile, hydrated: true, update: vi.fn(), setLevel: vi.fn() }),
}));
vi.mock("@/components/nestoy/SettingsProvider", () => ({
  useSettings: () => ({ settings: { motion: "reduzir" }, update: vi.fn(), hydrated: true }),
}));

import { ArvoreScreen } from "@/components/arvore/ArvoreScreen";
import { narrator } from "@/audio/narrator";
import { getLines } from "@/domain/trail/content";

const ALL = ["song", "lesson-1", "lesson-2", "lesson-3", "story", "challenge"];
const empty = (): Progress => ({ completedStops: {}, stickers: {}, daysPlayed: [], memory: {}, version: 3, legacy: null });
const withDone = (...ids: string[]): Progress => ({ ...empty(), completedStops: Object.fromEntries(ids.map((i) => [i, "2026-01-01T00:00:00.000Z"])) });
const prof = (english: Profile["english"]): Profile => ({ ...defaultProfile(), english, age: 5, onboarding: "done" });
const hits = () => screen.getAllByRole("button").filter((b) => b.hasAttribute("data-stop"));
const hit = (id: string) => hits().find((b) => b.getAttribute("data-stop") === id)!;
const branches = (c: HTMLElement) => [...c.querySelectorAll("#Lint .branch")];

beforeEach(() => {
  push.mockClear();
  vi.mocked(narrator.playNarration).mockClear();
  progress = empty();
  profile = prof("none");
});

describe("ArvoreScreen", () => {
  it("shows four branches, only the first open at the start", () => {
    const { container } = render(<ArvoreScreen />);
    const b = branches(container);
    expect(b).toHaveLength(4);
    expect(b.map((g) => g.getAttribute("data-open"))).toEqual(["true", "false", "false", "false"]);
  });

  it("says the arrival line once the tree is ready, with audio unlocked", async () => {
    render(<ArvoreScreen />);
    await act(async () => {});
    const lines = getLines();
    expect(narrator.playNarration).toHaveBeenCalledWith(lines.arvoreClimb, { ifIdle: true });
  });

  it("only the open branches have tappable stops; closed ones show a sprout and no lock", () => {
    const { container } = render(<ArvoreScreen />);
    expect(hits()).toHaveLength(6);
    expect(hits().every((b) => b.getAttribute("data-stop")!.startsWith("letras-1/"))).toBe(true);
    const closed = container.querySelectorAll('#Lint .stop[data-open="false"]');
    expect(closed).toHaveLength(18);
    expect(container.querySelector('#Lint .stop[data-open="false"] .stop-bud')?.getAttribute("opacity")).toBe("1");
    expect(container.querySelector('#Lint .stop[data-open="true"] .stop-bud')?.getAttribute("opacity")).toBe("0");
    expect(screen.queryByLabelText(/trancad/i)).toBeNull();
  });

  it("start 3: branches 1 to 3 are open and the suggested stop is the first of branch 3", () => {
    profile = prof("alphabet");
    const { container } = render(<ArvoreScreen />);
    expect(branches(container).map((g) => g.getAttribute("data-open"))).toEqual(["true", "true", "true", "false"]);
    expect(hits()).toHaveLength(18);
    expect(hit("letras-3/song")).toHaveAttribute("data-status", "current");
    expect(hit("letras-3/song")).toHaveAttribute("data-suggested", "true");
    expect(hit("letras-1/song")).not.toHaveAttribute("data-suggested", "true");
    expect(screen.getByTestId("nino-card")).toHaveTextContent("Galho 3");
  });

  it("a finished challenge opens the next branch", () => {
    progress = withDone(...ALL.map((s) => `letras-1/${s}`));
    const { container } = render(<ArvoreScreen />);
    expect(branches(container).map((g) => g.getAttribute("data-open"))).toEqual(["true", "true", "false", "false"]);
    expect(hit("letras-2/song")).toHaveAttribute("data-suggested", "true");
  });

  it("inside a branch the stops stay in sequence: done, current, locked", () => {
    progress = withDone("letras-1/song");
    render(<ArvoreScreen />);
    expect(hit("letras-1/song")).toHaveAttribute("data-status", "done");
    expect(hit("letras-1/lesson-1")).toHaveAttribute("data-status", "current");
    expect(hit("letras-1/lesson-2")).toHaveAttribute("data-status", "locked");
  });

  it("the current stop opens its page; a done stop can be replayed", () => {
    progress = withDone("letras-1/song");
    render(<ArvoreScreen />);
    fireEvent.click(hit("letras-1/lesson-1"));
    expect(push).toHaveBeenLastCalledWith("/parada/letras-1/lesson-1");
    fireEvent.click(hit("letras-1/song"));
    expect(push).toHaveBeenLastCalledWith("/parada/letras-1/song");
  });

  it("a locked stop only says so in the card and does not navigate", () => {
    render(<ArvoreScreen />);
    fireEvent.click(hit("letras-1/lesson-3"));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByTestId("nino-card")).toHaveTextContent("Essa parada ainda está trancada. Termine a anterior primeiro!");
  });

  it("the card names the tree and the branch, with the count of the branch following the progress", () => {
    progress = withDone("letras-1/song");
    render(<ArvoreScreen />);
    const card = screen.getByTestId("nino-card");
    expect(card).toHaveTextContent("Árvore das Letras");
    expect(card).toHaveTextContent("Galho 1: ABC: A a M");
    expect(card).toHaveTextContent("1 de 6");
  });

  it("the card's button plays the suggested stop", () => {
    progress = withDone("letras-1/song");
    render(<ArvoreScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Jogar Lição 1" }));
    expect(push).toHaveBeenCalledWith("/parada/letras-1/lesson-1");
  });

  it("the back button goes to the start page", () => {
    render(<ArvoreScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("a branch finished earlier stays open after the profile changes to an earlier start", () => {
    profile = prof("alphabet");
    progress = withDone("letras-3/song");
    const { container } = render(<ArvoreScreen />);
    expect(branches(container).map((g) => g.getAttribute("data-open"))).toEqual(["true", "true", "true", "false"]);
    profile = prof("none");
    const again = render(<ArvoreScreen />);
    const open = branches(again.container).map((g) => g.getAttribute("data-open"));
    expect(open[2]).toBe("true");
    expect(open[1]).toBe("false");
  });
});
