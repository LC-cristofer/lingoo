import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Animal } from "@/art/Animal";
import { isGlyph } from "@/art/glyphs/Glyph";
import { PICTURE_IDS } from "@/domain/trail/schema";

const num = (v: string | null) => (v === null || v === "" ? null : Number(v));

/** Absolute x and y of every point of a path, following relative commands. */
function pathPoints(d: string): number[] {
  const out: number[] = [];
  let x = 0;
  let y = 0;
  const arity: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, q: 4, c: 6, a: 7, t: 2, s: 4, z: 0 };
  for (const [, cmd, args] of d.matchAll(/([a-zA-Z])([^a-zA-Z]*)/g)) {
    const rel = cmd === cmd.toLowerCase();
    const n = (args.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    const k = arity[cmd.toLowerCase()];
    if (!k) continue;
    for (let i = 0; i + k <= n.length; i += k) {
      const a = n.slice(i, i + k);
      const l = cmd.toLowerCase();
      if (l === "h") x = rel ? x + a[0] : a[0];
      else if (l === "v") y = rel ? y + a[0] : a[0];
      else {
        if (l === "a") a.splice(0, 5);
        for (let j = 0; j < a.length; j += 2) {
          const px = rel ? x + a[j] : a[j];
          const py = rel ? y + a[j + 1] : a[j + 1];
          out.push(px, py);
          if (j + 2 >= a.length) {
            x = px;
            y = py;
          }
        }
      }
    }
  }
  return out;
}

function coords(el: Element): number[] {
  const out: number[] = [];
  const cx = num(el.getAttribute("cx"));
  const cy = num(el.getAttribute("cy"));
  const rx = num(el.getAttribute("rx")) ?? num(el.getAttribute("r")) ?? 0;
  const ry = num(el.getAttribute("ry")) ?? num(el.getAttribute("r")) ?? 0;
  if (cx !== null) out.push(cx - rx, cx + rx);
  if (cy !== null) out.push(cy - ry, cy + ry);
  const x = num(el.getAttribute("x"));
  const y = num(el.getAttribute("y"));
  if (el.tagName === "rect") {
    if (x !== null) out.push(x, x + (num(el.getAttribute("width")) ?? 0));
    if (y !== null) out.push(y, y + (num(el.getAttribute("height")) ?? 0));
  }
  for (const a of ["x1", "x2", "y1", "y2"]) {
    const v = num(el.getAttribute(a));
    if (v !== null) out.push(v);
  }
  const d = el.getAttribute("d");
  if (d) out.push(...pathPoints(d));
  return out;
}

describe("picture words", () => {
  it.each(PICTURE_IDS)("%s is a drawing, not a glyph card", (id) => {
    const { container } = render(<Animal id={id} />);
    expect(isGlyph(id)).toBe(false);
    expect(container.querySelectorAll("text")).toHaveLength(0);
    expect(container.querySelector("svg")).toHaveAttribute("aria-label", id);
    expect(container.querySelectorAll("svg *").length).toBeGreaterThan(8);
  });

  it.each(PICTURE_IDS)("%s follows the bible: no outlined shapes, no orange, no pure red", (id) => {
    const { container } = render(<Animal id={id} />);
    const html = container.innerHTML.toUpperCase();
    expect(html).not.toContain("#FF9F43");
    expect(html).not.toContain("#FF0000");
    expect(html).not.toContain("#E53935");
    for (const el of container.querySelectorAll("[stroke]")) {
      const fill = el.getAttribute("fill");
      expect(fill === "none", `${id}: <${el.tagName}> has both a fill and a stroke`).toBe(true);
    }
  });

  it.each(PICTURE_IDS)("%s fits the 200x210 drawing space", (id) => {
    const { container } = render(<Animal id={id} />);
    for (const el of container.querySelectorAll("svg *")) {
      for (const v of coords(el)) {
        expect(v).toBeGreaterThanOrEqual(-20);
        expect(v).toBeLessThanOrEqual(240);
      }
    }
  });

  it("keeps the Nino orange out of word cards too", () => {
    for (const id of ["word-dog", "word-fox", "letter-m"] as const) {
      const { container } = render(<Animal id={id} />);
      const html = container.innerHTML.toUpperCase();
      expect(html).not.toContain("#FF9F43");
      expect(html).not.toContain("#E53935");
      expect(html).not.toContain("#FF0000");
    }
  });
});
