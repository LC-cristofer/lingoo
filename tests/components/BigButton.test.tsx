import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BigButton } from "@/components/BigButton";

describe("BigButton", () => {
  it("exposes the label as accessible name and calls onPress once", async () => {
    const onPress = vi.fn();
    render(
      <BigButton onPress={onPress} label="Começar">
        <span>go</span>
      </BigButton>,
    );
    const button = screen.getByRole("button", { name: "Começar" });
    await userEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("has a 64px minimum touch target", () => {
    render(
      <BigButton onPress={() => {}} label="Começar">
        x
      </BigButton>,
    );
    const button = screen.getByRole("button", { name: "Começar" });
    expect(button).toHaveClass("min-h-16");
    expect(button).toHaveClass("min-w-16");
  });
});
