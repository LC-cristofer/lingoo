import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Backdrop } from "@/components/trail/kit/Backdrop";
import { AnswerTile } from "@/components/trail/kit/AnswerTile";
import { Bubble } from "@/components/trail/kit/Bubble";
import { ChunkyButton } from "@/components/trail/kit/ChunkyButton";
import { FeedbackSheet } from "@/components/trail/kit/FeedbackSheet";
import { LessonTopBar } from "@/components/trail/kit/LessonTopBar";
import { ProgressBar } from "@/components/trail/ProgressBar";

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

  it("defaults to the green ok tone and offers area (coloured by the parent) and cream (secondary); never red", () => {
    render(
      <ChunkyButton label="padrão" onPress={() => {}}>
        x
      </ChunkyButton>,
    );
    expect(screen.getByRole("button", { name: "padrão" }).className).toContain("k-btn-ok");
    for (const tone of ["ok", "area", "cream"] as const) {
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

  it.each(["idle", "correct", "wrong", "dim", "hint", "selected"] as const)("%s state is a class and a data-state", (state) => {
    render(<AnswerTile id="bird" label="bird" state={state} onPress={() => {}} />);
    const tile = screen.getByRole("button", { name: "bird" });
    expect(tile).toHaveAttribute("data-state", state);
    expect(tile).toHaveClass(`is-${state}`);
    expect(tile).toHaveClass("k-tile");
  });

  it("only the correct state carries the check badge", () => {
    const { container, rerender } = render(<AnswerTile id="bird" label="bird" state="correct" onPress={() => {}} />);
    expect(container.querySelector(".k-tile-badge")).not.toBeNull();
    rerender(<AnswerTile id="bird" label="bird" state="selected" onPress={() => {}} />);
    expect(container.querySelector(".k-tile-badge")).toBeNull();
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

  it("correct is the success sheet; retry and hint share the warm retry sheet", () => {
    const { rerender } = render(<FeedbackSheet kind="correct" line="x" onContinue={() => {}} />);
    expect(screen.getByRole("status")).toHaveClass("k-sheet", "is-correct");
    rerender(<FeedbackSheet kind="retry" line="x" />);
    expect(screen.getByRole("status")).toHaveClass("is-retry");
    rerender(<FeedbackSheet kind="hint" line="x" />);
    expect(screen.getByRole("status")).toHaveClass("is-retry");
  });

  it.each(["correct", "retry", "hint"] as const)("%s uses nothing of the red family", (kind) => {
    const { container } = render(<FeedbackSheet kind={kind} line="x" onContinue={() => {}} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/red|coral/i);
  });
});

describe("FeedbackSheet who slot", () => {
  it("shows the slot (Nino's place) instead of the round icon when given", () => {
    const { container, rerender } = render(<FeedbackSheet kind="correct" line="Isso!" who={<svg data-testid="nino" />} onContinue={() => {}} />);
    expect(screen.getByTestId("nino")).toBeInTheDocument();
    expect(container.querySelector(".k-sheet-who")).not.toBeNull();
    expect(container.querySelector(".k-sheet-icon")).toBeNull();
    rerender(<FeedbackSheet kind="correct" line="Isso!" onContinue={() => {}} />);
    expect(container.querySelector(".k-sheet-icon")).not.toBeNull();
  });
});

describe("LessonTopBar lamps", () => {
  it("draws one lamp per step up to 8, lighting the done ones, and keeps the progressbar value", () => {
    const { container } = render(<LessonTopBar ratio={0.5} steps={6} onExit={() => {}} />);
    expect(container.querySelectorAll(".k-lamps > i")).toHaveLength(6);
    expect(container.querySelectorAll(".k-lamps > i.is-on")).toHaveLength(3);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
  });

  it("takes the number of lamps from the count when no steps are given", () => {
    const { container } = render(<LessonTopBar ratio={0.4} count="2 de 5" onExit={() => {}} />);
    expect(container.querySelectorAll(".k-lamps > i")).toHaveLength(5);
    expect(container.querySelectorAll(".k-lamps > i.is-on")).toHaveLength(2);
  });

  // The lessons have 9 to 11 exercises: the approved look (at-1..3) is a bar of 6 lamps, each standing for a share of them.
  it("with more than 8 steps it is still 6 lamps, lit in proportion; with no step count it is a rope bar", () => {
    const { container, rerender } = render(<LessonTopBar ratio={0.5} steps={10} onExit={() => {}} />);
    expect(container.querySelectorAll(".k-lamps > i")).toHaveLength(6);
    expect(container.querySelectorAll(".k-lamps > i[data-on]")).toHaveLength(3);
    rerender(<LessonTopBar ratio={0.5} onExit={() => {}} />);
    expect(container.querySelector(".k-lamps")).toBeNull();
    expect(container.querySelector(".k-bar")).not.toBeNull();
  });

  it("never shows a full bar before the lesson is finished", () => {
    const { container, rerender } = render(<LessonTopBar ratio={11 / 12} steps={12} onExit={() => {}} />);
    expect(container.querySelectorAll(".k-lamps > i[data-on]")).toHaveLength(5);
    rerender(<LessonTopBar ratio={1} steps={12} onExit={() => {}} />);
    expect(container.querySelectorAll(".k-lamps > i[data-on]")).toHaveLength(6);
  });
});

describe("Backdrop", () => {
  it.each(["sky", "interior", "night", "farol"] as const)("%s is a hidden decorative layer with the grain", (variant) => {
    const { container } = render(<Backdrop variant={variant} />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveAttribute("data-variant", variant);
    expect(root).toHaveClass("k-backdrop", `is-${variant}`);
    expect(root.querySelector(".k-grain")).not.toBeNull();
  });
});

describe("Backdrop farol", () => {
  it("draws the interior once, with its own ids, blurred under the cream veil", () => {
    const { container } = render(<Backdrop variant="farol" />);
    const pic = container.querySelector("svg.k-farol-pic")!;
    expect(pic).not.toBeNull();
    expect(container.querySelector(".k-veil")).not.toBeNull();
    expect(pic.innerHTML).not.toMatch(/id="fi-|#fi-|id="lampRoom"/);
    expect(pic.innerHTML).toMatch(/id="bd-/);
  });
});

describe("LessonTopBar count", () => {
  it("shows the 'N de M' pill beside a blue bar when a count is given", () => {
    render(<LessonTopBar ratio={0.4} onExit={() => {}} count="2 de 5" />);
    expect(screen.getByText("2 de 5")).toHaveClass("k-pill");
    expect(screen.getByRole("progressbar")).toHaveClass("is-sky");
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

  it("the progress bar has a moving shine on its fill and keeps its value", () => {
    const { container } = render(<ProgressBar ratio={0.5} />);
    expect(container.querySelector(".k-bar > i .k-bar-shine")).not.toBeNull();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
  });
});
