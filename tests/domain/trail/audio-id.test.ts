import { describe, expect, it } from "vitest";
import { audioSrc, segmentId } from "@/domain/trail/audio-id";

function referenceFnv1a64(input: string): string {
  let h = BigInt("0xcbf29ce484222325");
  for (const b of new TextEncoder().encode(input)) {
    h ^= BigInt(b);
    h = (h * BigInt("0x100000001b3")) & BigInt("0xffffffffffffffff");
  }
  return h.toString(16).padStart(16, "0");
}

describe("segmentId", () => {
  it("is stable and language-sensitive", () => {
    const a = segmentId({ lang: "en-US", text: "bear!" });
    expect(segmentId({ lang: "en-US", text: "bear!" })).toBe(a);
    expect(segmentId({ lang: "pt-BR", text: "bear!" })).not.toBe(a);
  });

  it("ignores surrounding spaces and Unicode normalization form", () => {
    const base = segmentId({ lang: "pt-BR", text: "é" });
    expect(segmentId({ lang: "pt-BR", text: "  é \n" })).toBe(base);
    expect(segmentId({ lang: "pt-BR", text: "é" })).toBe(base);
  });

  it("is 16 lowercase hex chars", () => {
    expect(segmentId({ lang: "en-US", text: "x" })).toMatch(/^[0-9a-f]{16}$/);
  });

  it("pins the FNV-1a 64 algorithm", () => {
    expect(segmentId({ lang: "pt-BR", text: "Opa! Vamos tentar de novo." })).toBe(
      referenceFnv1a64("pt-BR|Opa! Vamos tentar de novo."),
    );
  });
});

describe("audioSrc", () => {
  it("points at the mp3 named by the id", () => {
    const seg = { lang: "en-US" as const, text: "bear!" };
    expect(audioSrc(seg)).toBe(`/audio/${segmentId(seg)}.mp3`);
  });
});
