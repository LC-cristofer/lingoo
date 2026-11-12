import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AnswerTile } from "@/components/trail/kit/AnswerTile";
import { BottomNav } from "@/components/trail/kit/BottomNav";
import { Bubble } from "@/components/trail/kit/Bubble";
import { ChunkyButton } from "@/components/trail/kit/ChunkyButton";
import { FeedbackSheet } from "@/components/trail/kit/FeedbackSheet";
import { ForestScene } from "@/components/trail/kit/ForestScene";
import { LessonTopBar } from "@/components/trail/kit/LessonTopBar";
import { StopButton } from "@/components/trail/kit/StopButton";
import { TopChips } from "@/components/trail/kit/TopChips";
import { WoodSign } from "@/components/trail/kit/WoodSign";

describe("ChunkyButton", () => {
  it("is a button named by its label, at least 64 px, and calls onPress", async () => {
    const onPress = vi.fn();
    render(
      <ChunkyButton label="Começar" onPress={onPress}>
        Começar
      </ChunkyButton>,
    );
    const button = screen.getByRole("button", { name: "Começar" });
    expect(button.className).toContain("min-h-16");
    expect(button.className).toContain("min-w-16");
    await userEvent.click(button);
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("does not call onPress when disabled", async () => {
    const onPress = vi.fn();
    render(
      <ChunkyButton label="Nada" onPress={onPress} disabled>
        x
      </ChunkyButton>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Nada" }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("offers the four tones", () => {
    for (const tone of ["sun", "leaf", "sky", "white"] as const) {
      const { unmount } = render(
        <ChunkyButton label={tone} onPress={() => {}} tone={tone}>
          x
        </ChunkyButton>,
      );
      expect(screen.getByRole("button", { name: tone }).className).toContain(`k-btn-${tone}`);
      unmount();
    }
  });
});

describe("AnswerTile", () => {
  it("exposes data-card, data-state, the English name and lang", async () => {
    const onPress = vi.fn();
    render(<AnswerTile id="bear" label="bear" lang="en" state="idle" onPress={onPress} />);
    const tile = screen.getByRole("button", { name: "bear" });
    expect(tile).toHaveAttribute("data-card", "bear");
    expect(tile).toHaveAttribute("data-state", "idle");
    expect(tile).toHaveAttribute("lang", "en");
    expect(tile.className).toContain("min-h-[120px]");
    await userEvent.click(tile);
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("glows only in the hint state", () => {
    const { container, rerender } = render(<AnswerTile id="bird" label="bird" state="hint" onPress={() => {}} />);
    expect(container.querySelector('[data-glow="true"]')).not.toBeNull();
    for (const state of ["idle", "correct", "wrong", "dim"] as const) {
      rerender(<AnswerTile id="bird" label="bird" state={state} onPress={() => {}} />);
      expect(container.querySelector('[data-glow="true"]')).toBeNull();
    }
  });

  it("does not call onPress when disabled", async () => {
    const onPress = vi.fn();
    render(<AnswerTile id="frog" label="frog" disabled onPress={onPress} />);
    await userEvent.click(screen.getByRole("button", { name: "frog" }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("FeedbackSheet", () => {
  it("correct shows the line and the Continuar button", async () => {
    const onContinue = vi.fn();
    render(<FeedbackSheet kind="correct" line="Great!" onContinue={onContinue} />);
    expect(screen.getByRole("status")).toHaveAttribute("data-kind", "correct");
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it.each(["retry", "hint"] as const)("%s has no button", (kind) => {
    render(<FeedbackSheet kind={kind} line="Opa!" />);
    expect(screen.getByRole("status")).toHaveAttribute("data-kind", kind);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it.each(["correct", "retry", "hint"] as const)("%s uses nothing of the red family", (kind) => {
    const { container } = render(<FeedbackSheet kind={kind} line="x" onContinue={() => {}} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/red|coral/i);
  });
});

describe("StopButton", () => {
  it("sets data-kind and data-state and calls onPress", async () => {
    const onPress = vi.fn();
    render(<StopButton kind="lesson" state="current" label="Lição 2" labelSide="right" onPress={onPress} />);
    const button = screen.getByRole("button", { name: "Lição 2" });
    expect(button).toHaveAttribute("data-kind", "lesson");
    expect(button).toHaveAttribute("data-state", "current");
    expect(button).not.toHaveAttribute("aria-disabled");
    await userEvent.click(button);
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("a locked one is aria-disabled and ignores presses", async () => {
    const onPress = vi.fn();
    render(<StopButton kind="story" state="locked" label="História" labelSide="left" onPress={onPress} />);
    const button = screen.getByRole("button", { name: "História" });
    expect(button).toHaveAttribute("data-state", "locked");
    expect(button).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("BottomNav", () => {
  it("has Trilha, Memória, Álbum in order and marks the active one", () => {
    render(<BottomNav active="memoria" />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Trilha", "Memória", "Álbum"]);
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/mapa", "/memoria", "/album"]);
    expect(links.map((l) => l.getAttribute("aria-current"))).toEqual([null, "page", null]);
  });

  it("shows the memoryDue badge", () => {
    render(<BottomNav active="trilha" memoryDue={4} />);
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renders Memória disabled when memory is not enabled", async () => {
    render(<BottomNav active="trilha" memoryEnabled={false} />);
    const memory = screen.getByRole("link", { name: "Memória" });
    expect(memory).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("link", { name: "Trilha" })).not.toHaveAttribute("aria-disabled");
  });
});

describe("other pieces", () => {
  it("LessonTopBar has the exit button and a progress bar, or a title pill", async () => {
    const onExit = vi.fn();
    const { rerender } = render(<LessonTopBar ratio={0.4} onExit={onExit} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(onExit).toHaveBeenCalledOnce();
    rerender(<LessonTopBar ratio={0} onExit={onExit} title="Lição 1" />);
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.getByText("Lição 1")).toBeInTheDocument();
  });

  it("Bubble renders a replay button only with onReplay", async () => {
    const onReplay = vi.fn();
    const { rerender } = render(<Bubble>Oi</Bubble>);
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<Bubble onReplay={onReplay}>Oi</Bubble>);
    await userEvent.click(screen.getByRole("button", { name: "Ouvir de novo" }));
    expect(onReplay).toHaveBeenCalledOnce();
  });

  it("WoodSign shows the unit, the title and the progress; locked shows a lock", () => {
    const { rerender } = render(<WoodSign unitLabel="Unidade 1" title="Animais da floresta" done={2} total={6} />);
    expect(screen.getByText("Unidade 1")).toBeInTheDocument();
    expect(screen.getByText("2 de 6")).toBeInTheDocument();
    rerender(<WoodSign unitLabel="Unidade 2" title="Cores" locked />);
    expect(screen.queryByText(/ de /)).toBeNull();
  });

  it("TopChips shows the stars and the seven days", () => {
    const week = Array.from({ length: 7 }, (_, i) => ({ date: `2026-11-${String(9 + i).padStart(2, "0")}`, played: i < 3, isToday: i === 2 }));
    const { container } = render(<TopChips stars={5} week={week} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(container.querySelectorAll(".k-day")).toHaveLength(7);
    expect(container.querySelectorAll(".k-day.is-on")).toHaveLength(3);
  });

  it("ForestScene is a decorative, hidden backdrop", () => {
    const { container } = render(<ForestScene variant="lesson" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
