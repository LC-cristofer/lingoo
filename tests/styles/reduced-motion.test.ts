import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname, "../../src");
const PREFIX = ':root[data-motion="reduzir"]';

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? cssFiles(p) : p.endsWith(".css") ? [p] : [];
  });
}

/** The selectors of every rule inside every `@media (prefers-reduced-motion: reduce)` block of a stylesheet. */
function reducedSelectors(css: string): string[] {
  const out: string[] = [];
  const open = "@media (prefers-reduced-motion: reduce)";
  let from = 0;
  for (;;) {
    const at = css.indexOf(open, from);
    if (at < 0) return out;
    let i = css.indexOf("{", at) + 1;
    let depth = 1;
    const start = i;
    while (depth > 0 && i < css.length) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    const body = css.slice(start, i - 1);
    for (const m of body.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
      for (const sel of m[1].split(/,(?![^(]*\))/)) out.push(sel.trim());
    }
    from = i;
  }
}

describe('"Reduzir movimento" covers what the system preference covers', () => {
  const files = cssFiles(SRC).filter((f) => readFileSync(f, "utf8").includes("prefers-reduced-motion: reduce)"));
  it("finds the stylesheets", () => expect(files.length).toBeGreaterThan(3));
  it.each(files.map((f) => [f.replace(SRC, "src"), f]))("%s has a data-motion twin for every reduced-motion selector", (_n, f) => {
    const css = readFileSync(f, "utf8");
    const twins = css.split("\n").filter((l) => l.startsWith(PREFIX)).join("\n");
    for (const sel of reducedSelectors(css)) expect(twins, `missing twin for ${sel}`).toContain(sel);
  });
});
