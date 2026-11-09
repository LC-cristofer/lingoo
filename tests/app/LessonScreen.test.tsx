import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LessonScreen } from "@/app/licao/[lessonId]/LessonScreen";
import { narrator } from "@/audio/narrator";
import { emptyProgress } from "@/domain/progress";

const replace = vi.fn();
const push = vi.fn();
let hydrated = true;
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push }) }));
vi.mock("@/components/ProgressProvider", () => ({
  useProgress: () => ({ progress: emptyProgress(), hydrated, finishLesson: vi.fn() }),
}));
let unlocked = true;
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
const unlockedAtMount: boolean[] = [];
vi.mock("@/components/lesson/LessonPlayer", async () => {
  const { useEffect } = await import("react");
  function LessonPlayer() {
    useEffect(() => {
      unlockedAtMount.push(unlocked);
    }, []);
    return <p>player</p>;
  }
  return { LessonPlayer };
});

beforeEach(() => {
  replace.mockClear();
  vi.mocked(narrator.unlock).mockClear();
  unlockedAtMount.length = 0;
  hydrated = true;
  unlocked = true;
});

describe("LessonScreen", () => {
  it("redirects an unknown lesson to /mapa", () => {
    render(<LessonScreen lessonId="nope" />);
    expect(replace).toHaveBeenCalledWith("/mapa");
  });
  it("redirects a 'soon' lesson to /mapa", () => {
    render(<LessonScreen lessonId="hello-my-name-is" />);
    expect(replace).toHaveBeenCalledWith("/mapa");
    expect(screen.queryByText("player")).toBeNull();
  });
  it("renders the player for an open lesson without redirecting", () => {
    render(<LessonScreen lessonId="forest-animals" />);
    expect(screen.getByText("player")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
  it("opened directly with audio locked: one ▶ button, and the player mounts only after the tap", () => {
    unlocked = false;
    render(<LessonScreen lessonId="forest-animals" />);
    expect(screen.queryByText("player")).toBeNull();
    const start = screen.getByRole("button", { name: "Começar" });
    expect(screen.getAllByRole("button")).toHaveLength(1);
    fireEvent.click(start);
    expect(narrator.unlock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("player")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Começar" })).toBeNull();
    expect(unlockedAtMount).toEqual([true]); // the first step mounts already unlocked, so it is heard
  });
  it("skips the ▶ button when audio is already unlocked (came from the map)", () => {
    render(<LessonScreen lessonId="forest-animals" />);
    expect(screen.queryByRole("button", { name: "Começar" })).toBeNull();
    expect(unlockedAtMount).toEqual([true]);
  });
  it("does not show the ▶ button for a lesson that redirects", () => {
    unlocked = false;
    render(<LessonScreen lessonId="nope" />);
    expect(screen.queryByRole("button", { name: "Começar" })).toBeNull();
  });
  it("does not redirect or render before progress hydrates", () => {
    hydrated = false;
    render(<LessonScreen lessonId="nope" />);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.queryByText("player")).toBeNull();
  });
});
