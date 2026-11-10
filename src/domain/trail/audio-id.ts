import type { Segment } from "./schema";

const OFFSET_BASIS = BigInt("0xcbf29ce484222325");
const PRIME = BigInt("0x100000001b3");
const MASK = BigInt("0xffffffffffffffff");

/** Text exactly as hashed (and as sent to the TTS): NFC-normalized and trimmed. */
export function normalizeText(text: string): string {
  return text.normalize("NFC").trim();
}

function fnv1a64(input: string): string {
  let hash = OFFSET_BASIS;
  for (const byte of new TextEncoder().encode(input)) {
    hash ^= BigInt(byte);
    hash = (hash * PRIME) & MASK;
  }
  return hash.toString(16).padStart(16, "0");
}

/** Stable 16-hex id of a spoken segment; names its `public/audio/{id}.mp3`. */
export function segmentId(seg: Segment): string {
  return fnv1a64(`${seg.lang}|${normalizeText(seg.text)}`);
}

export function audioSrc(seg: Segment): string {
  return `/audio/${segmentId(seg)}.mp3`;
}
