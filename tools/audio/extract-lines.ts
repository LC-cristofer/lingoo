import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sayAs } from "@/domain/letras/say-as";
import { allNarrations } from "@/domain/trail/content";
import { normalizeText, segmentId } from "@/domain/trail/audio-id";

// `say_as`: what the TTS is sent when it differs from the text (English letters are said by their names).
type Line = { id: string; lang: string; text: string; say_as?: string };

const byId = new Map<string, Line>();
for (const narration of allNarrations()) {
  for (const seg of narration) {
    const id = segmentId(seg);
    if (byId.has(id)) continue;
    const text = normalizeText(seg.text);
    const say = seg.lang === "en-US" ? sayAs(text) : undefined;
    byId.set(id, { id, lang: seg.lang, text, ...(say ? { say_as: say } : {}) });
  }
}

const lines = [...byId.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
const out = resolve(dirname(fileURLToPath(import.meta.url)), "lines.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(lines, null, 2) + "\n");
console.log(`${lines.length} unique lines -> ${out}`);
