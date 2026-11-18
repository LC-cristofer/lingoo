import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(__dirname, "../../src/styles/tokens.css"), "utf8");
const globals = readFileSync(resolve(__dirname, "../../src/app/globals.css"), "utf8");

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("design tokens (bible, spec §1)", () => {
  it.each([
    ["--sky-top", "#7CC4EE"],
    ["--sky-mid", "#CDEBF8"],
    ["--sky-low", "#FFEFD9"],
    ["--night-top", "#0E1640"],
    ["--night-mid", "#1E2A6B"],
    ["--night-low", "#3A3270"],
    ["--cream", "#FFF8EC"],
    ["--paper", "#FFFDF8"],
    ["--cocoa", "#3A2618"],
    ["--cocoa-2", "#8A6A50"],
    ["--line", "rgba(58,38,24,.12)"],
    ["--edge", "rgba(58,38,24,.14)"],
    ["--area-letras", "#FF7A5C"],
    ["--area-numeros", "#F5B12E"],
    ["--area-cores", "#A57BEA"],
    ["--area-linguas", "#2E9FD8"],
    ["--area-linguas-dark", "#2384B5"],
    ["--area-mundo", "#2EB8A4"],
    ["--area-ninho", "#C98A4B"],
    ["--success", "#5DB55A"],
    ["--success-dark", "#3E8E3E"],
    ["--success-bg", "#E8F6E2"],
    ["--retry", "#F2A93B"],
    ["--retry-bg", "#FFF1DA"],
    ["--hint", "#FFC94A"],
    ["--night-ui", "#1B2259"],
    ["--r-1", "12px"],
    ["--r-2", "20px"],
    ["--r-3", "24px"],
    ["--r-4", "28px"],
    ["--r-pill", "999px"],
    ["--fs-display", "34px"],
    ["--fs-title", "22px"],
    ["--fs-sub", "19px"],
    ["--fs-body", "15px"],
    ["--fs-caption", "13px"],
    ["--t-tap", "90ms"],
    ["--t-quick", "160ms"],
    ["--t-base", "240ms"],
    ["--t-slow", "420ms"],
  ])("defines %s as %s", (name, value) => {
    expect(css).toMatch(new RegExp(`${escape(name)}:\\s*${escape(value)}\\s*;`, "i"));
  });

  it.each(["--ease-out", "--ease-spring", ...Array.from({ length: 10 }, (_, i) => `--sp-${i + 1}`)])("defines %s", (name) => {
    expect(css).toContain(`${name}:`);
  });

  it("uses Fredoka for display and Nunito for body", () => {
    expect(css).toMatch(/--font-display:\s*var\(--font-fredoka\)/);
    expect(css).toMatch(/--font-body:\s*var\(--font-nunito\)/);
  });

  it("keeps the kitten's orange out of the UI tokens", () => {
    expect(css).not.toMatch(/#FF9F43/i);
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

  it("has the grain overlay: fixed, no pointer events, multiply, .5 opacity", () => {
    const rule = /\.k-grain\s*\{([^}]*)\}/.exec(css + readFileSync(resolve(__dirname, "../../src/components/trail/kit/kit.css"), "utf8"))![1];
    expect(rule).toContain("position: fixed");
    expect(rule).toContain("pointer-events: none");
    expect(rule).toContain("mix-blend-mode: multiply");
    expect(rule).toMatch(/opacity:\s*0?\.5/);
    expect(rule).toContain("feTurbulence");
  });
});
