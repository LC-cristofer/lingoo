import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LessonScreen } from "@/app/licao/[lessonId]/LessonScreen";
import { emptyProgress } from "@/domain/progress";

const replace = vi.fn();
const push = vi.fn();
let hydrated = true;
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push }) }));
vi.mock("@/components/ProgressProvider", () => ({
  useProgress: () => ({ progress: emptyProgress(), hydrated, finishLesson: vi.fn() }),
}));
vi.mock("@/components/lesson/LessonPlayer", () => ({ LessonPlayer: () => <p>player</p> }));

beforeEach(() => {
  replace.mockClear();
  hydrated = true;
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
  it("does not redirect or render before progress hydrates", () => {
    hydrated = false;
    render(<LessonScreen lessonId="nope" />);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.queryByText("player")).toBeNull();
  });
});
