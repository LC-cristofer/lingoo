// Shared colours for the picture words (bible palette) and one small helper. Light is always
// from the top-left: each material is a base, a cooler shadow and a warmer light.
export const CREAM = "#FFF8EC";
export const COCOA = "#3A2618";
export const WOOD = { base: "#C98A4B", dark: "#9C6631", light: "#E2A762", deep: "#7A4A26" };
export const LEAVES = { base: "#5DB55A", dark: "#3F8F45", light: "#86CF6B" };
export const TRUNK = { base: "#9A6A43", dark: "#7A5232" };
export const WATER = { base: "#6CCBE3", dark: "#45AECB", light: "#C2EEF7" };
export const STONE = { base: "#CBD3DC", dark: "#A1ADBB", light: "#E3E8EE" };
export const WOOL = "#F6E7CF";
export const WOOL_DARK = "#E6D0AE";
export const SUN_BASE = "#FFC93C";
export const SUN_DARK = "#F2B220";
export const CORAL = "#FF7A5C";
export const CORAL_DARK = "#E8624A";

/** A soft highlight from the top-left. */
export function Gloss({ cx, cy, rx, ry = rx * 0.6, rot = -35, o = 0.4 }: { cx: number; cy: number; rx: number; ry?: number; rot?: number; o?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" opacity={o} transform={`rotate(${rot} ${cx} ${cy})`} />;
}
