import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ART_WORDS, Animal } from "@/art/Animal";
import { isGlyph } from "@/art/glyphs/Glyph";
import { PICTURE_IDS, artIdSchema } from "@/domain/trail/schema";

describe("letter and word cards", () => {
  it("draws a letter card with both cases", () => {
    const { container } = render(<Animal id="letter-b" />);
    const svg = screen.getByRole("img", { name: "B" });
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg).toHaveAttribute("lang", "en");
    const text = container.querySelector("text")!;
    expect(text.textContent).toContain("B");
    expect(text.textContent).toContain("b");
  });

  it("draws a word card in lower case", () => {
    const { container } = render(<Animal id="word-dog" />);
    expect(screen.getByRole("img", { name: "dog" })).toBeInTheDocument();
    expect(container.querySelector("text")!.textContent).toBe("dog");
  });

  it("uses cocoa text on a cream card, never the Nino orange", () => {
    const { container } = render(<Animal id="letter-b" />);
    expect(container.querySelector("text")).toHaveAttribute("fill", "#3A2618");
    expect(container.innerHTML).toContain('fill="#FFF8EC"');
    expect(container.innerHTML.toUpperCase()).not.toContain("#FF9F43");
  });

  it("knows which ids are glyphs", () => {
    expect(isGlyph("letter-a")).toBe(true);
    expect(isGlyph("word-cat")).toBe(true);
    expect(isGlyph("bear")).toBe(false);
  });

  it("registers 26 letters and a name for every id", () => {
    expect(artIdSchema.options.filter((id) => id.startsWith("letter-"))).toHaveLength(26);
    for (const id of artIdSchema.options) expect(ART_WORDS[id]).toBeTruthy();
    expect(ART_WORDS["letter-q"]).toBe("Q");
    expect(ART_WORDS["word-van"]).toBe("van");
  });

  it.each(PICTURE_IDS)("picture %s renders with its word", (id) => {
    render(<Animal id={id} />);
    expect(screen.getByRole("img", { name: id })).toHaveAttribute("data-art", id);
  });
});
