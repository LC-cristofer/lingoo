import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/audio/narrator", () => ({
  narrator: { playNarration: vi.fn(() => Promise.resolve()), playSfx: vi.fn(), stop: vi.fn(), unlock: vi.fn(), isUnlocked: () => true },
}));
const update = vi.fn();
vi.mock("@/components/nestoy/ProfileProvider", () => ({
  useProfile: () => ({ profile: { ...defaultProfile() }, hydrated: true, update, setLevel: vi.fn() }),
}));

import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { narrator } from "@/audio/narrator";
import { defaultProfile } from "@/domain/nestoy/profile";
import { getLines } from "@/domain/trail/content";

const hold = () => screen.getByRole("button", { name: "Segure para entrar" });
async function pass() {
  fireEvent.pointerDown(hold());
  await act(async () => {
    vi.advanceTimersByTime(2000);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  update.mockClear();
  vi.mocked(narrator.playNarration).mockClear();
});
afterEach(() => vi.useRealTimers());

describe("OnboardingScreen", () => {
  it('opens with "Chame um adulto!" (spoken) and the held button, nothing else', () => {
    render(<OnboardingScreen existing={false} />);
    expect(screen.getByText("Chame um adulto!")).toBeInTheDocument();
    expect(narrator.playNarration).toHaveBeenCalledWith(getLines().callAdult);
    expect(hold()).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agora não" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nome da criança")).not.toBeInTheDocument();
  });

  it("walks name, age, English contact and Pronto!, saving done", async () => {
    render(<OnboardingScreen existing={false} />);
    await pass();
    fireEvent.change(screen.getByLabelText("Nome da criança"), { target: { value: "Ana" } });
    fireEvent.click(screen.getByRole("button", { name: "Seguir" }));
    for (const age of ["4", "5", "6", "7", "8", "9+"]) expect(screen.getByRole("button", { name: age })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "7" }));
    for (const l of ["Nenhum ainda", "Conhece algumas palavras", "Sabe o alfabeto em inglês", "Lê palavras simples em inglês"]) {
      expect(screen.getByRole("button", { name: l })).toBeInTheDocument();
    }
    expect(screen.getByText("Contato com inglês")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Lê palavras simples em inglês" }));
    expect(update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Pronto!" }));
    expect(update).toHaveBeenCalledWith({ name: "Ana", age: 7, english: "reads", onboarding: "done" });
  });

  it('"9+" is saved as age 9', async () => {
    render(<OnboardingScreen existing={false} />);
    await pass();
    fireEvent.click(screen.getByRole("button", { name: "Pular" }));
    fireEvent.click(screen.getByRole("button", { name: "9+" }));
    fireEvent.click(screen.getByRole("button", { name: "Nenhum ainda" }));
    fireEvent.click(screen.getByRole("button", { name: "Pronto!" }));
    expect(update).toHaveBeenCalledWith({ name: "", age: 9, english: "none", onboarding: "done" });
  });

  it("the name can be skipped, the age and the English contact cannot", async () => {
    render(<OnboardingScreen existing={false} />);
    await pass();
    fireEvent.click(screen.getByRole("button", { name: "Pular" }));
    expect(screen.queryByRole("button", { name: "Pular" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agora não" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pronto!" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    expect(screen.queryByRole("button", { name: "Pronto!" })).not.toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it("the name field takes at most 20 characters", async () => {
    render(<OnboardingScreen existing={false} />);
    await pass();
    expect((screen.getByLabelText("Nome da criança") as HTMLInputElement).maxLength).toBe(20);
  });

  it('an existing install has "Agora não", which saves skipped', async () => {
    render(<OnboardingScreen existing />);
    fireEvent.click(screen.getByRole("button", { name: "Agora não" }));
    expect(update).toHaveBeenCalledWith({ onboarding: "skipped" });
  });

  it("an early release of the hold does not open the questions", async () => {
    render(<OnboardingScreen existing={false} />);
    fireEvent.pointerDown(hold());
    await act(async () => {
      vi.advanceTimersByTime(800);
    });
    fireEvent.pointerUp(hold());
    expect(screen.queryByLabelText("Nome da criança")).not.toBeInTheDocument();
  });

  it("goes back to the gate on a new arrival (the route was kept hidden)", async () => {
    const view = render(<OnboardingScreen existing={false} />);
    await pass();
    expect(screen.getByLabelText("Nome da criança")).toBeInTheDocument();
    view.unmount();
    render(<OnboardingScreen existing={false} />);
    expect(hold()).toBeInTheDocument();
  });
});
