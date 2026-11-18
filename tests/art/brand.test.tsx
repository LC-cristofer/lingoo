import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NestMark } from "@/art/brand/NestMark";
import { Wordmark } from "@/art/brand/Wordmark";

describe("brand", () => {
  it("Wordmark is an svg image named NESTOY", () => {
    render(<Wordmark className="logo" />);
    const img = screen.getByRole("img", { name: "NESTOY" });
    expect(img.tagName.toLowerCase()).toBe("svg");
    expect(img).toHaveAttribute("aria-label", "NESTOY");
    expect(img).toHaveClass("logo");
  });

  it("NestMark renders at the given size", () => {
    render(<NestMark size={72} />);
    const img = screen.getByRole("img", { name: "NESTOY" });
    expect(img.tagName.toLowerCase()).toBe("svg");
    expect(img).toHaveAttribute("width", "72");
  });
});
