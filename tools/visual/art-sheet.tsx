// Character sheet: every gatinho expression and every animal (plain, glowing and at card size),
// rendered with the real components into one static HTML page.
//   npx tsx tools/visual/art-sheet.tsx
//   node tools/visual/shots.cjs tools/visual/.out/art-sheet.html docs/arte/folha-de-personagens.png
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ART_WORDS, Animal } from "@/art/Animal";
import { Cat, type CatExpression } from "@/art/Cat";
import { artIdSchema, type ArtId } from "@/domain/trail/schema";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const out = resolve(here, ".out/art-sheet.html");

const expressions: { id: CatExpression; name: string; use: string }[] = [
  { id: "idle", name: "Parado", use: "esperando, balança o rabo" },
  { id: "talking", name: "Falando", use: "durante a narração" },
  { id: "happy", name: "Feliz", use: "acertou! (pula)" },
  { id: "pointing", name: "Apontando", use: "“Qual é o bear?”" },
  { id: "helping", name: "Ajudando", use: "“Vamos tentar de novo!”" },
  { id: "listening", name: "Ouvindo", use: "“Sua vez!”" },
];

const animalNames: Record<ArtId, string> = {
  bear: "urso",
  bird: "passarinho",
  frog: "sapo",
  snake: "cobra",
  spider: "aranha",
  mouse: "ratinho",
};

const ids = artIdSchema.options;

function Cell({ children, title, note }: { children: ReactNode; title: string; note: string }) {
  return (
    <figure className="cell">
      <div className="art">{children}</div>
      <figcaption>
        <b>{title}</b>
        <small>{note}</small>
      </figcaption>
    </figure>
  );
}

function Sheet() {
  return (
    <main className="sheet">
      <h1>Lingoo · folha de personagens</h1>
      <p className="lead">
        O gatinho em 6 expressões e os 6 animais da floresta, desenhados pelos componentes reais
        (<code>src/art</code>). Animações desligadas para a foto.
      </p>

      <h2>O gatinho</h2>
      <div className="grid">
        {expressions.map((e) => (
          <Cell key={e.id} title={e.name} note={`${e.id} · ${e.use}`}>
            <Cat expression={e.id} size={180} />
          </Cell>
        ))}
      </div>

      <h2>Animais da floresta</h2>
      <div className="grid">
        {ids.map((id) => (
          <Cell key={id} title={ART_WORDS[id]} note={animalNames[id]}>
            <Animal id={id} size={200} />
          </Cell>
        ))}
      </div>

      <h2>Com brilho (dica no 2º erro)</h2>
      <div className="grid">
        {ids.map((id) => (
          <Cell key={id} title={ART_WORDS[id]} note="glow">
            <Animal id={id} size={200} glow />
          </Cell>
        ))}
      </div>

      <h2>No tamanho do cartão (120 px) e do mapa</h2>
      <div className="row">
        {ids.map((id) => (
          <div key={id} className="mini">
            <Animal id={id} size={120} />
          </div>
        ))}
        <div className="mini">
          <Cat expression="pointing" size={72} />
        </div>
        <div className="mini">
          <Cat expression="happy" size={72} />
        </div>
      </div>
    </main>
  );
}

const css = `
  body { margin: 0; background: #FFF8EC; color: #2B2D42; font-family: Nunito, system-ui, sans-serif; }
  .sheet { width: 1488px; padding: 32px; box-sizing: border-box; }
  h1 { font-family: "Baloo 2", system-ui, sans-serif; font-size: 40px; margin: 0 0 4px; }
  h2 { font-family: "Baloo 2", system-ui, sans-serif; font-size: 26px; margin: 28px 0 10px; }
  .lead { margin: 0; font-weight: 600; opacity: .75; }
  code { font-size: .9em; }
  .grid { display: grid; grid-template-columns: repeat(6, 224px); gap: 16px; }
  .cell { margin: 0; background: #fff; border-radius: 28px; padding: 14px 10px 12px; text-align: center;
          box-shadow: 0 6px 0 rgba(43,45,66,.08), 0 12px 24px rgba(43,45,66,.08); }
  .art { display: flex; justify-content: center; align-items: flex-end; height: 212px; }
  .art svg { display: block; }
  figcaption b { display: block; font-family: "Baloo 2", system-ui, sans-serif; font-size: 24px; line-height: 1.2; }
  figcaption small { display: block; font-weight: 600; opacity: .6; font-size: 14px; }
  .row { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
  .mini { background: #fff; border-radius: 20px; width: 136px; height: 136px; display: flex; align-items: center;
          justify-content: center; box-shadow: 0 4px 0 rgba(43,45,66,.08); }
`;

const artCss = readFileSync(resolve(root, "src/art/art.css"), "utf8");
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Lingoo · folha de personagens</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800&display=swap" rel="stylesheet">
<style>${css}</style>
<style>
${artCss}
</style>
</head>
<body>
${renderToStaticMarkup(<Sheet />)}
</body>
</html>
`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`wrote ${out}`);
