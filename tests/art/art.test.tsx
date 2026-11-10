import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Animal } from "@/art/Animal";
import { Cat, type CatExpression } from "@/art/Cat";
import { artIdSchema, type ArtId } from "@/domain/trail/schema";

const expressions: CatExpression[] = ["idle", "talking", "happy", "pointing", "helping", "listening"];

const englishWord: Record<ArtId, string> = {
  bear: "bear",
  bird: "bird",
  frog: "frog",
  snake: "snake",
  spider: "spider",
  mouse: "mouse",
};

const ids = artIdSchema.options;

describe("Cat", () => {
  it.each(expressions)("renders the %s expression as the Gatinho image", (expression) => {
    render(<Cat expression={expression} />);
    const svg = screen.getByRole("img", { name: "Gatinho" });
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg).toHaveAttribute("data-expression", expression);
  });

  it("scales to the given size", () => {
    render(<Cat expression="idle" size={120} />);
    expect(screen.getByRole("img", { name: "Gatinho" })).toHaveAttribute("width", "120");
  });
});

describe("Animal", () => {
  it("covers every ArtId", () => {
    expect([...ids].sort()).toEqual(Object.keys(englishWord).sort());
  });

  it.each(ids)("labels %s with its English word, in English", (id) => {
    render(<Animal id={id} />);
    const svg = screen.getByRole("img", { name: englishWord[id] });
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg).toHaveAttribute("lang", "en");
    expect(svg).toHaveAttribute("data-art", id);
    expect(svg).not.toHaveAttribute("data-glow");
  });

  it.each(ids)("marks %s with data-glow when glowing", (id) => {
    render(<Animal id={id} glow />);
    expect(screen.getByRole("img", { name: englishWord[id] })).toHaveAttribute("data-glow", "true");
  });

  it.each(ids)("draws %s without any SVG text, so no letter gives the answer away", (id) => {
    for (const glow of [false, true]) {
      const { container, unmount } = render(<Animal id={id} glow={glow} />);
      expect(container.querySelectorAll("text, tspan, textPath, title, desc")).toHaveLength(0);
      expect(container.textContent).toBe("");
      unmount();
    }
  });

  it("scales to the given size", () => {
    render(<Animal id="frog" size={120} />);
    const svg = screen.getByRole("img", { name: "frog" });
    expect(svg).toHaveAttribute("width", "120");
    expect(svg).toHaveAttribute("height", "120");
  });

  it("renders on the server without hooks", () => {
    const html = renderToStaticMarkup(
      <>
        <Animal id="spider" glow />
        <Cat expression="happy" />
      </>,
    );
    expect(html).toContain('data-art="spider"');
    expect(html).toContain('data-glow="true"');
    expect(html).toContain('data-expression="happy"');
  });
});
