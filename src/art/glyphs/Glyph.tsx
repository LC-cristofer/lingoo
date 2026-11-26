import type { ArtId } from "@/domain/trail/schema";
import { GroundShadow } from "../shared";

// Letter and word cards: a rounded cream card with the text in Fredoka 700, drawn in the same
// 200 x 210 space as the animals (the Animal frame adds the margin). Pictures that are not drawn
// ids that fall through here use the same card with their word.

const CARD = "#FFF8EC";
const COCOA = "#3A2618";
const EDGE = "#E9D9BD";

/** Letter and word cards. Illustrated pictures are drawings, not glyphs. */
export function isGlyph(id: ArtId): boolean {
  return id.startsWith("letter-") || id.startsWith("word-");
}

/** The text a card shows: "B" for letter-b, "dog" for word-dog, the word itself for a picture. */
export function glyphText(id: ArtId): string {
  if (id.startsWith("letter-")) return id.slice(7).toUpperCase();
  if (id.startsWith("word-")) return id.slice(5);
  return id;
}

export function Glyph({ id }: { id: ArtId }) {
  const letter = id.startsWith("letter-");
  const text = glyphText(id);
  const display = letter ? `${text}${text.toLowerCase()}` : text;
  const fontSize = letter ? 94 : Math.min(72, Math.floor(168 / Math.max(text.length, 1) * 1.7));
  return (
    <g>
      <GroundShadow rx={72} />
      <rect x="10" y="18" width="180" height="176" rx="36" fill={CARD} stroke={EDGE} strokeWidth="4" />
      <text
        x="100"
        y="106"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-display), 'Fredoka', system-ui, sans-serif"
        fontWeight="700"
        fontSize={fontSize}
        fill={COCOA}
      >
        {display}
      </text>
    </g>
  );
}
