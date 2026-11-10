import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Narration } from "@/domain/trail/schema";

const playNarration = vi.fn((n: Narration) => Promise.resolve(n.length).then(() => undefined));
vi.mock("@/audio/narrator", () => ({
  narrator: { playNarration: (n: Narration) => playNarration(n), playSfx: vi.fn(), stop: vi.fn() },
}));

import { NarrationText } from "@/components/trail/NarrationText";
import { ProgressBar } from "@/components/trail/ProgressBar";
import { FeedbackBanner } from "@/components/trail/FeedbackBanner";
import { ExerciseShell } from "@/components/trail/ExerciseShell";

const prompt: Narration = [
  { lang: "pt-BR", text: "Toque no" },
  { lang: "en-US", text: "bear" },
  { lang: "pt-BR", text: "!" },
];
const line: Narration = [{ lang: "en-US", text: "Great!" }];

describe("NarrationText", () => {
  it("marks lang=en only on English segments, joined by spaces", () => {
    const { container } = render(<NarrationText narration={prompt} />);
    const en = container.querySelectorAll('[lang="en"]');
    expect(en).toHaveLength(1);
    expect(en[0].tagName).toBe("B");
    expect(en[0].textContent).toBe("bear");
    expect(container.textContent).toBe("Toque no bear !");
  });
});

describe("ProgressBar", () => {
  it("reflects the ratio", () => {
    render(<ProgressBar ratio={0.456} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "46");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });
});

describe("FeedbackBanner", () => {
  it("correct shows Continuar and calls onContinue", async () => {
    const onContinue = vi.fn();
    render(<FeedbackBanner kind="correct" line={line} onContinue={onContinue} />);
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onContinue).toHaveBeenCalledOnce();
  });
  it("retry has no button and no red classes", () => {
    const { container } = render(<FeedbackBanner kind="retry" line={line} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.innerHTML).not.toMatch(/red/i);
    expect(container.firstElementChild).toHaveAttribute("data-kind", "retry");
  });
  it("hint has no button", () => {
    render(<FeedbackBanner kind="hint" line={line} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("ExerciseShell", () => {
  it("speaker replays the prompt", async () => {
    playNarration.mockClear();
    render(
      <ExerciseShell ratio={0.5} prompt={prompt} catExpression="talking" feedback={null} onExit={() => {}}>
        <div>area</div>
      </ExerciseShell>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Ouvir de novo" }));
    expect(playNarration).toHaveBeenCalledWith(prompt);
    expect(screen.getByText("area")).toBeInTheDocument();
  });
  it("exit calls onExit", async () => {
    const onExit = vi.fn();
    render(
      <ExerciseShell ratio={0} prompt={prompt} catExpression="idle" feedback={null} onExit={onExit}>
        <div />
      </ExerciseShell>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(onExit).toHaveBeenCalledOnce();
  });
  it("renders feedback when present", () => {
    render(
      <ExerciseShell ratio={0} prompt={prompt} catExpression="happy" feedback={{ kind: "correct", line, onContinue: () => {} }} onExit={() => {}}>
        <div />
      </ExerciseShell>,
    );
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
  });
});
