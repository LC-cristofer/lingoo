#!/usr/bin/env node
// WCAG contrast of the design tokens' text pairs (src/styles/tokens.css): AA is 4.5:1 for normal text, 3:1 for large
// (>= 24 px, or >= 18.66 px bold) text and for the parts of controls and focus rings.
//   node tools/visual/contrast.cjs
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const T = { cream: "#FFF8EC", paper: "#FFFDF8", cocoa: "#3A2618", cocoa2: "#8A6A50", white: "#FFFFFF", night: "#1B2259", success: "#5DB55A", successDark: "#3E8E3E", successText: "#2E7D32", successBg: "#E8F6E2", linguas: "#2E9FD8", linguasDark: "#1D77A3", retryText: "#8A5200", retryBg: "#FFF1DA", hint: "#FFC94A", stone: "#EFE5D3" };
const PAIRS = [
  ["body text: cocoa on cream", T.cocoa, T.cream, 4.5],
  ["body text: cocoa on paper", T.cocoa, T.paper, 4.5],
  ["secondary text: cocoa-2 on cream", T.cocoa2, T.cream, 4.5],
  ["secondary text: cocoa-2 on paper", T.cocoa2, T.paper, 4.5],
  ["success text on its sheet", T.successText, T.successBg, 4.5],
  ["retry text on its sheet", T.retryText, T.retryBg, 4.5],
  ["area text (Línguas dark) on cream, selected options", T.linguasDark, T.cream, 4.5],
  ["Fechar / cocoa button: white on cocoa", T.white, T.cocoa, 4.5],
  ["night card: cream on night-ui", T.cream, T.night, 4.5],
  ["main button label: white on success (24 px bold)", T.white, T.success, 3, "kept: the approved look (spec §1, white label on the green)"],
  ["main button: white on success-dark edge", T.white, T.successDark, 3],
  ["area button label: white on Línguas", T.white, T.linguas, 3, "kept: the approved look (at-4 still, blue closing button)"],
  ["focus ring: Línguas dark on cream (non-text 3:1)", T.linguasDark, T.cream, 3],
];
let fails = 0;
for (const [name, fg, bg, min, note] of PAIRS) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok && !note) fails++;
  console.log(`${ok ? "pass" : note ? "note" : "FAIL"}  ${r.toFixed(2)}:1 (needs ${min})  ${name}${!ok && note ? `  [${note}]` : ""}`);
}
process.exit(fails ? 1 : 0);
