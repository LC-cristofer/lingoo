import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const narratorMock = vi.hoisted(() => ({ unlock: vi.fn(), playNarration: vi.fn(() => Promise.resolve()) }));
vi.mock("@/audio/narrator", () => ({ narrator: narratorMock }));

import Home from "@/app/page";

describe("Home", () => {
  it("has one button whose accessible name is its visible text, Jogar", () => {
    render(<Home />);
    const button = screen.getByRole("button", { name: "Jogar" });
    expect(button).toHaveTextContent("Jogar");
    expect(screen.queryByRole("button", { name: "Começar" })).not.toBeInTheDocument();
  });

  it("unlocks audio, narrates and goes to the map", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Jogar" }));
    expect(narratorMock.unlock).toHaveBeenCalled();
    expect(narratorMock.playNarration).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/mapa");
  });
});
