import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(__dirname, "../../src/styles/tokens.css"), "utf8");
const globals = readFileSync(resolve(__dirname, "../../src/app/globals.css"), "utf8");

describe("design tokens (spec §3)", () => {
  it.each([
    ["--sky-0", "#0B1030"],
    ["--sky-1", "#121A45"],
    ["--sky-2", "#221A4F"],
    ["--card", "#F4F6FF"],
    ["--text-1", "#F4F6FF"],
    ["--text-2", "#B9C2E6"],
    ["--text-3", "#7E89B8"],
    ["--ink", "#151A3A"],
    ["--accent", "#4470F4"],
    ["--current", "#FFB84A"],
    ["--success", "#34C77B"],
    ["--retry", "#FFA94D"],
    ["--hint", "#FFC93C"],
  ])("defines %s as %s", (name, value) => {
    expect(css).toMatch(new RegExp(`${name}:\\s*${value}`, "i"));
  });

  it.each(["--surface-1", "--surface-2", "--line", "--t-tap", "--t-quick", "--t-base", "--t-slow", "--ease-out", "--ease-spring", "--fs-display", "--fs-title", "--fs-body", "--sp-4", "--r-1", "--r-pill"])("defines %s", (name) => {
    expect(css).toContain(`${name}:`);
  });

  it("the retry colour is never in the red family", () => {
    const retry = /--retry:\s*#([0-9a-f]{6})/i.exec(css)![1];
    const [r, g] = [parseInt(retry.slice(0, 2), 16), parseInt(retry.slice(2, 4), 16)];
    expect(g / r).toBeGreaterThan(0.55);
  });

  it("globals.css imports the tokens before the kit", () => {
    expect(globals.indexOf("styles/tokens.css")).toBeGreaterThan(-1);
    expect(globals.indexOf("styles/tokens.css")).toBeLessThan(globals.indexOf("kit.css"));
  });
});
