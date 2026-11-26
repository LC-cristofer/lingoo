import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ArtId } from "@/domain/trail/schema";

vi.mock("@/audio/narrator", () => ({ narrator: { playNarration: vi.fn(() => Promise.resolve()), playSfx: vi.fn(), stop: vi.fn(), isUnlocked: vi.fn(() => true) } }));

import { WordCards } from "@/components/trail/StopFlow";

const ids = (n: number) => "abcdef".slice(0, n).split("").map((l) => `letter-${l}` as ArtId);
const grid = (n: number) => render(<WordCards words={[]} ids={ids(n)} />).container.querySelector(".k-tiles")!;

// The start / back button must stay on the screen: more words than fit in two big rows are shown smaller.
describe("WordCards layout", () => {
  it("three and six words stay in a dense block of three", () => {
    expect(grid(3)).toHaveClass("is-dense");
    expect(grid(6)).toHaveClass("is-dense");
  });
  it("four words are small tiles", () => {
    expect(grid(4)).toHaveClass("is-small");
  });
  it("five words are two rows of three", () => {
    expect(grid(5)).toHaveClass("is-dense");
  });
});
