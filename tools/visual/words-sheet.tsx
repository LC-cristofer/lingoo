// Contact sheet of the picture words at the size children see them (96 px) and the weak ones large.
//   npx tsx tools/visual/words-sheet.tsx [out.html] [id,id,...]
//   node tools/visual/shots.cjs <out.html> <out.png> 2
import { writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Animal } from "@/art/Animal";
import { PICTURE_IDS, type ArtId } from "@/domain/trail/schema";

const out = process.argv[2] ?? "words-sheet.html";
const big = (process.argv[3] ?? "igloo,hat,yoyo,zebra").split(",") as ArtId[];
const cell = (id: ArtId, px: number) =>
  `<figure><div class="a" style="width:${px}px;height:${px}px">${renderToStaticMarkup(<Animal id={id} />)}</div><figcaption>${id}</figcaption></figure>`;
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:16px;background:#FFF1D6;font:12px sans-serif;color:#3A2618}
section{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px}
figure{margin:0;text-align:center}
.a{background:#FFF8EC;border-radius:16px;display:grid;place-items:center}
.a svg{width:100%;height:100%}
</style>
<section>${(PICTURE_IDS as readonly ArtId[]).map((id) => cell(id, 96)).join("")}</section>
<section>${big.map((id) => cell(id, 240)).join("")}</section>`;
writeFileSync(out, html);
console.log(out);
