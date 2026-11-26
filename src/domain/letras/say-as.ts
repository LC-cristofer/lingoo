import { getBank } from "./bank";

// Letters must be HEARD as English letter names ("B" -> "bee"), never as phonemes. The text of a segment (and so its
// audio id) stays as written; `sayAs` gives what the voice tooling sends to the TTS instead. The names come from the
// letras bank (tools/audio/extract-lines.ts writes them to lines.json as `say_as`), so the bank is the one source.
// The voice reads a capitalised name as the letter ("Bee"); a few names need a respelling it reads right, found by
// listening and transcribing every letter (tools/audio/README.md): a bare "A" came out "ah", "ay" came out "bye".

/** Respellings for a line that is only the letter ("A", "A?"). */
const BARE: Record<string, string> = { a: "ey", e: "EE", l: "Ell", m: "M" };
/** Respellings for a letter inside a line ("A is for apple!", "A, B, C!", "D-O-G, dog!"). */
const INLINE: Record<string, string> = { a: "Ey", e: "Ee", l: "Ell", m: "M", s: "Ess" };

/** Whole lines the voice cannot say as written: alone, "van!" comes out "then" with every seed, "van?" comes out right. */
const LINES: Record<string, string> = { "van!": "van?" };

function names(): Map<string, string> {
  const out = new Map<string, string>();
  for (const item of getBank().items) if (item.kind === "letter") out.set(item.id, item.name);
  return out;
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The spoken form of an English segment that has letters in it ("D-O-G, dog!" -> "Dee, Oh, Gee, dog!"), else undefined. */
export function sayAs(text: string): string | undefined {
  if (Object.hasOwn(LINES, text)) return LINES[text];
  const byLetter = names();
  const spoken = (l: string, table: Record<string, string>) => table[l.toLowerCase()] ?? capital(byLetter.get(l.toLowerCase()) ?? l);

  const bare = /^([A-Z])([?!.]?)$/.exec(text);
  if (bare) return `${spoken(bare[1], BARE)}${bare[2] || "."}`;

  const name = (l: string) => spoken(l, INLINE);
  // "D-O-G, dog!" -> "Dee, Oh, Gee, dog!"
  let out = text.replace(/(?<![\w-])[A-Z](?:-[A-Z])+(?![\w-])/g, (m) => m.split("-").map(name).join(", "));
  // A lone capital is a letter when it stands alone, before "is for" or "to", after "to"/"with", or before punctuation;
  // otherwise it is the word "A" or "I" ("A dog!", "I can read!").
  out = out.replace(/(?<![\w-])[A-Z](?![\w-])/g, (m, offset: number, whole: string) => {
    const rest = whole.slice(offset + 1);
    const prev = whole.slice(0, offset);
    const isLetter = /^(\s+is for\b|\s+to\b|[.,?!]|$)/.test(rest) || /\b(to|with)\s+$/.test(prev);
    return isLetter ? name(m) : m;
  });
  return out === text ? undefined : out;
}
