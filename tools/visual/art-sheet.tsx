// Art sheets rendered with the real components into static HTML pages:
//   - characters: every gatinho expression and every animal (plain, glowing and at card size);
//   - scenes: the forest backdrop (map), the 6 story scenes with the unit's real hotspots, the
//     chest closed and open, the stickers earned and not earned, and the stop icons.
//   npx tsx tools/visual/art-sheet.tsx
//   node tools/visual/shots.cjs tools/visual/.out/art-sheet.html docs/arte/folha-de-personagens.png
//   node tools/visual/shots.cjs tools/visual/.out/scenes-sheet.html docs/arte/folha-de-cenarios.png
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ART_WORDS, Animal } from "@/art/Animal";
import { Cat, type CatExpression } from "@/art/Cat";
import { StopIcon, type StopState } from "@/art/StopIcon";
import { Chest } from "@/art/scenes/Chest";
import { ForestBackdrop } from "@/art/scenes/ForestBackdrop";
import { Sticker } from "@/art/scenes/Sticker";
import { StoryScene } from "@/art/scenes/StoryScene";
import { getUnit } from "@/domain/trail/content";
import { artIdSchema, type ArtId, type Stop } from "@/domain/trail/schema";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const outDir = resolve(here, ".out");

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


const unit = getUnit("forest-animals");
const found = unit?.stops.find((s) => s.kind === "story");
if (!found || found.kind !== "story") throw new Error("forest-animals has no story stop");
const story = found;

const sceneNames: Record<string, string> = {
  "forest-walk": "passeio",
  "forest-bear": "o urso",
  "forest-bird": "o passarinho",
  "forest-pond": "o lago",
  "forest-web": "a teia",
  "forest-goodbye": "tchau!",
};

// The approved map's stops (arte-fonte.html), drawn by StopIcon over the map backdrop.
const mapStops: { x: number; y: number; kind: Stop["kind"]; state: StopState; label: string }[] = [
  { x: 150, y: 548, kind: "song", state: "done", label: "Música" },
  { x: 330, y: 452, kind: "lesson", state: "done", label: "Lição 1" },
  { x: 520, y: 500, kind: "lesson", state: "current", label: "Lição 2" },
  { x: 700, y: 516, kind: "lesson", state: "locked", label: "Lição 3" },
  { x: 860, y: 452, kind: "story", state: "locked", label: "História" },
  { x: 1010, y: 430, kind: "challenge", state: "locked", label: "Desafio" },
];
const PATH = "M120 560 C260 560 250 440 380 440 S560 540 690 520 S860 420 1000 430";

const kinds: { kind: Stop["kind"]; name: string }[] = [
  { kind: "song", name: "Música" },
  { kind: "lesson", name: "Lição" },
  { kind: "story", name: "História" },
  { kind: "challenge", name: "Desafio" },
];
const states: StopState[] = ["done", "current", "locked"];

function ScenesSheet() {
  return (
    <main className="sheet">
      <h1>Lingoo · folha de cenários</h1>
      <p className="lead">
        A floresta, as 6 cenas da história (com os hotspots reais da unidade), o baú, as figurinhas e
        os ícones das paradas, desenhados pelos componentes reais (<code>src/art</code>). Animações
        desligadas para a foto.
      </p>

      <h2>Mapa · ForestBackdrop variant=&quot;map&quot; + StopIcon</h2>
      <div className="map">
        <ForestBackdrop variant="map" />
        <svg viewBox="0 0 1136 640" className="overlay" aria-hidden="true">
          <path d={PATH} fill="none" stroke="#F6DDA6" strokeWidth="44" strokeLinecap="round" />
          <path d={PATH} fill="none" stroke="#fff" strokeWidth="5" strokeDasharray="2 18" strokeLinecap="round" opacity=".8" />
        </svg>
        {mapStops.map((st) => (
          <div key={st.label} className="stop" style={{ left: `${(st.x / 1136) * 100}%`, top: `${(st.y / 640) * 100}%` }}>
            <StopIcon kind={st.kind} state={st.state} />
            <span>{st.label}</span>
          </div>
        ))}
        <div className="map-cat">
          <Cat expression="pointing" size={92} />
        </div>
      </div>

      <h2>História · StoryScene (16:10)</h2>
      <div className="scenes">
        {story.pages.map((page, i) => (
          <figure key={i} className="scene-cell">
            <div className="scene">
              <StoryScene scene={page.scene} hotspots={page.hotspots} onHotspot={() => {}} glowId={i === 4 ? "mouse" : undefined} />
            </div>
            <figcaption>
              <b>
                {i + 1}. {sceneNames[page.scene]}
              </b>
              <small>
                {page.scene}
                {page.hotspots.length ? ` · ${page.hotspots.map((h) => h.wordId).join(", ")}` : " · sem hotspots"}
                {i === 4 ? " · mouse com glow" : ""}
              </small>
            </figcaption>
          </figure>
        ))}
      </div>

      <h2>Baú e figurinhas</h2>
      <div className="row">
        <Cell title="Baú fechado" note="open=false">
          <Chest open={false} size={210} />
        </Cell>
        <Cell title="Baú aberto" note="open=true">
          <Chest open size={210} />
        </Cell>
      </div>
      <div className="grid stickers">
        {ids.map((id) => (
          <Cell key={id} title={ART_WORDS[id]} note="ganhou">
            <Sticker art={id} earned size={170} />
          </Cell>
        ))}
        {ids.map((id) => (
          <Cell key={`${id}-locked`} title={ART_WORDS[id]} note="ainda não">
            <Sticker art={id} earned={false} size={170} />
          </Cell>
        ))}
      </div>

      <h2>Ícones das paradas · StopIcon (4 tipos × 3 estados)</h2>
      <div className="stops">
        <div />
        {states.map((st) => (
          <b key={st}>{st}</b>
        ))}
        {kinds.map((k) => (
          <Row key={k.kind} name={k.name} kind={k.kind} />
        ))}
      </div>
    </main>
  );
}

function Row({ name, kind }: { name: string; kind: Stop["kind"] }) {
  return (
    <>
      <b>
        {name}
        <small>{kind}</small>
      </b>
      {states.map((st) => (
        <div key={st} className="stop-cell">
          <StopIcon kind={kind} state={st} />
        </div>
      ))}
    </>
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
  .map { position: relative; width: 1136px; height: 640px; border-radius: 32px; overflow: hidden;
         box-shadow: 0 6px 0 rgba(43,45,66,.08); }
  .overlay { position: absolute; inset: 0; width: 100%; height: 100%; }
  .stop { position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; }
  .stop svg { display: block; }
  .stop span { margin-top: -8px; background: rgba(255,255,255,.92); border-radius: 14px; padding: 2px 14px;
               font-weight: 800; font-size: 16px; }
  .map-cat { position: absolute; left: 560px; top: 396px; }
  .scenes { display: grid; grid-template-columns: repeat(2, 704px); gap: 16px; }
  .scene-cell { margin: 0; background: #fff; border-radius: 28px; padding: 10px 10px 8px; box-shadow: 0 6px 0 rgba(43,45,66,.08); }
  .scene { position: relative; width: 684px; height: 427.5px; border-radius: 20px; overflow: hidden; }
  .scene-cell figcaption { padding: 6px 8px 0; }
  .scene-cell figcaption b { font-size: 22px; }
  .stickers { margin-top: 16px; }
  .stops { display: grid; grid-template-columns: 160px repeat(3, 180px); gap: 12px; align-items: center; }
  .stops > b { font-family: "Baloo 2", system-ui, sans-serif; font-size: 22px; text-align: center; }
  .stops > b small { display: block; font-family: Nunito, system-ui, sans-serif; font-size: 14px; opacity: .6; }
  .stop-cell { background: #A6DDA3; border-radius: 24px; height: 150px; display: flex; align-items: center; justify-content: center; }
`;

const artCss = readFileSync(resolve(root, "src/art/art.css"), "utf8");
const page = (title: string, body: ReactNode) => `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800&display=swap" rel="stylesheet">
<style>${css}</style>
<style>
${artCss}
</style>
</head>
<body>
${renderToStaticMarkup(body)}
</body>
</html>
`;

mkdirSync(outDir, { recursive: true });
for (const [file, title, body] of [
  ["art-sheet.html", "Lingoo · folha de personagens", <Sheet key="characters" />],
  ["scenes-sheet.html", "Lingoo · folha de cenários", <ScenesSheet key="scenes" />],
] as const) {
  const out = resolve(outDir, file);
  writeFileSync(out, page(title, body));
  console.log(`wrote ${out}`);
}
