import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { allNarrations } from "@/domain/trail/content";
import { normalizeText, segmentId } from "@/domain/trail/audio-id";

type Line = { id: string; lang: string; text: string };

const byId = new Map<string, Line>();
for (const narration of allNarrations()) {
  for (const seg of narration) {
    const id = segmentId(seg);
    if (!byId.has(id)) byId.set(id, { id, lang: seg.lang, text: normalizeText(seg.text) });
  }
}

const lines = [...byId.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
const out = resolve(dirname(fileURLToPath(import.meta.url)), "lines.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(lines, null, 2) + "\n");
console.log(`${lines.length} unique lines -> ${out}`);
