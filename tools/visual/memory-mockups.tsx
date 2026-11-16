// Static mockups of the memory training ("Treino de memória"): the card front, the flipped card,
// the check round, the end of the round, and the Memória tab (cards ready / all done), for phone
// portrait (390×844) and tablet landscape (1024×768). Pictures for approval only.
//   npx tsx tools/visual/memory-mockups.tsx
//   node tools/visual/frames.cjs tools/visual/.out/memory-mockups.html tools/visual/.out/memory-mockups
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Animal } from "@/art/Animal";
import { Cat } from "@/art/Cat";
import type { ArtId } from "@/domain/trail/schema";
import {
  artCss,
  Bubble,
  CloseButton,
  css as baseCss,
  Device,
  fontsLink,
  LessonScene,
  outDir,
  PH,
  PW,
  Sheet,
  SpeakerButton,
  TH,
  Tile,
  TopChips,
  TrailScene,
  Trees,
  TW,
} from "./mockups";

/* ---------- pieces ---------- */

function FlipIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M4 10 a8 8 0 0 1 14 -4 l2 -2 v6 h-6 l2 -2 a5 5 0 0 0 -9 2z" fill="currentColor" />
      <path d="M20 14 a8 8 0 0 1 -14 4 l-2 2 v-6 h6 l-2 2 a5 5 0 0 0 9 -2z" fill="currentColor" />
    </svg>
  );
}

function MemoryTop({ done, total }: { done: number; total: number }) {
  return (
    <div className="lesson-top">
      <CloseButton />
      <span className="bar">
        <i style={{ width: `${(done / total) * 100}%`, background: "#4AA8F0", boxShadow: "inset 0 5px 0 #8CCBFF" }} />
      </span>
      <span className="pill pill-count">
        {done + 1} de {total}
      </span>
    </div>
  );
}

/** The big card: the picture on the front, the picture and the word on the back. */
function MemoryCard({ id, word, side, w = 290, h = 370 }: { id: ArtId; word: string; side: "front" | "back"; w?: number; h?: number }) {
  return (
    <div className="mstack" style={{ width: w, height: h }}>
      <span className="mcard is-behind is-b2" />
      <span className="mcard is-behind is-b1" />
      <div className={`mcard is-${side}`}>
        {side === "front" ? (
          <>
            <span className="mcard-q">?</span>
            <Animal id={id} size={w * 0.7} />
            <span className="mcard-hint">
              <FlipIcon />
              Toque para virar
            </span>
          </>
        ) : (
          <>
            <Animal id={id} size={w * 0.5} />
            <b className="mcard-word" lang="en">
              {word}
            </b>
            <SpeakerButton />
          </>
        )}
      </div>
    </div>
  );
}

function CardsBadge({ n }: { n: number }) {
  return <span className="tab-badge">{n}</span>;
}

/** The bottom navigation with the three tabs; `wide` is the tablet pill. */
function Nav3({ active, ready, wide }: { active: "trail" | "memory" | "album"; ready?: number; wide?: boolean }) {
  return (
    <nav className={`nav ${wide ? "is-wide is-3" : "is-3"}`}>
      <span className={`tab ${active === "trail" ? "is-active" : ""}`}>
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
          <path d="M9 28 C9 20 23 22 23 14 C23 8 14 9 14 4" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="9" cy="28" r="3.5" fill="currentColor" />
          <circle cx="14" cy="4" r="3.5" fill="currentColor" />
        </svg>
        Trilha
      </span>
      <span className={`tab ${active === "memory" ? "is-active is-sky" : ""}`}>
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
          <rect x="9" y="3" width="18" height="23" rx="4" fill="none" stroke="currentColor" strokeWidth="3.4" transform="rotate(10 18 14)" />
          <rect x="4" y="7" width="18" height="23" rx="4" fill="currentColor" />
          <path d="M10 15 a3 3 0 1 1 4 3 v2" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </svg>
        Memória
        {ready ? <CardsBadge n={ready} /> : null}
      </span>
      <span className={`tab ${active === "album" ? "is-active" : ""}`}>
        <svg viewBox="-20 -18 40 36" width="28" height="25" aria-hidden="true">
          <path d="M-17 -12 q9 -4 17 2 q8 -6 17 -2 v24 q-9 -4 -17 2 q-8 -6 -17 -2z" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M0 -10 v24" stroke="currentColor" strokeWidth="3" />
        </svg>
        Álbum
      </span>
    </nav>
  );
}

/** A fanned pile of picture cards, used on the Memória tab. */
function CardPile({ ids, size, faded }: { ids: ArtId[]; size: number; faded?: boolean }) {
  const rot = [-12, 8, -2];
  return (
    <div className={`pile ${faded ? "is-faded" : ""}`} style={{ width: size * 1.7, height: size * 1.25 }}>
      {ids.map((id, i) => (
        <span key={id} className="pile-card" style={{ width: size, height: size * 1.2, left: `${i * 30}%`, transform: `translateX(-${i * 18}%) rotate(${rot[i]}deg)`, zIndex: i }}>
          <Animal id={id} size={size * 0.78} />
        </span>
      ))}
    </div>
  );
}

const Play = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
    <path d="M7 4 L20 12 L7 20Z" fill="currentColor" />
  </svg>
);

/* ---------- phone screens ---------- */

function PhoneFront() {
  return (
    <>
      <LessonScene w={PW} h={PH} variant="forest" />
      <div className="lesson">
        <MemoryTop done={0} total={5} />
        <div className="ask">
          <Cat expression="listening" size={112} />
          <Bubble>
            <span className="bubble-text">Como se fala em inglês?</span>
            <SpeakerButton />
          </Bubble>
        </div>
        <div className="mcenter">
          <MemoryCard id="bear" word="bear" side="front" />
        </div>
      </div>
    </>
  );
}

function PhoneBack() {
  return (
    <>
      <LessonScene w={PW} h={PH} variant="forest" />
      <div className="lesson">
        <MemoryTop done={0} total={5} />
        <div className="ask">
          <Cat expression="happy" size={112} />
          <Bubble>
            <span className="bubble-text">
              <b lang="en">Bear!</b>
            </span>
            <SpeakerButton />
          </Bubble>
        </div>
        <div className="mcenter">
          <MemoryCard id="bear" word="bear" side="back" />
        </div>
        <span className="btn is-sun is-big">
          Próximo
          <Play />
        </span>
      </div>
    </>
  );
}

function PhoneCheck() {
  const tiles: ArtId[] = ["frog", "spider", "bear", "snake"];
  return (
    <>
      <LessonScene w={PW} h={PH} variant="forest" />
      <div className="lesson">
        <MemoryTop done={3} total={5} />
        <div className="ask">
          <Cat expression="happy" size={112} />
          <Bubble>
            <span className="bubble-text">
              Qual é o <b lang="en">bear</b>? Toque nele!
            </span>
            <SpeakerButton />
          </Bubble>
        </div>
        <div className="tiles is-2">
          {tiles.map((id) => (
            <Tile key={id} id={id} size={166} state={id === "bear" ? "correct" : "dim"} />
          ))}
        </div>
      </div>
      <Sheet kind="correct" button="Continuar">
        <b lang="en">Yes! You remembered!</b>
      </Sheet>
    </>
  );
}

function PhoneEnd() {
  const ids: ArtId[] = ["bear", "bird", "frog"];
  return (
    <>
      <LessonScene w={PW} h={PH} variant="forest" />
      <div className="lesson">
        <div className="lesson-top">
          <CloseButton />
          <span className="pill">Treino de memória</span>
        </div>
        <div className="hello">
          <Bubble tail="down">Você lembrou de 3 palavras!</Bubble>
          <Cat expression="happy" size={176} />
        </div>
        <div className="words">
          {ids.map((id) => (
            <div key={id} className="word">
              <Tile id={id} size={104} state="correct" />
              <b lang="en">{id}</b>
            </div>
          ))}
        </div>
        <span className="btn is-sun is-big">
          Continuar
          <Play />
        </span>
      </div>
    </>
  );
}

function ForestTab({ w, h }: { w: number; h: number }) {
  return (
    <>
      <TrailScene w={w} h={h} sun={false} clouds={false} />
      <Trees
        w={w}
        h={h}
        items={[
          ["pine", 26, 360, 0.7],
          ["round", 360, 350, 0.6],
          ["pine", 352, 640, 1],
          ["round", 30, 660, 0.85],
          ["flower", 90, 720],
          ["mush", 300, 730],
        ]}
      />
    </>
  );
}

function PhoneTab() {
  return (
    <>
      <ForestTab w={PW} h={PH} />
      <TopChips stars={2} days={3} />
      <div className="mtab">
        <h1 className="mtab-title">Treino de memória</h1>
        <div className="guide-row">
          <Cat expression="pointing" size={104} />
          <Bubble>
            <span className="bubble-text">Tem cartões para treinar!</span>
            <SpeakerButton />
          </Bubble>
        </div>
        <CardPile ids={["frog", "bird", "bear"]} size={120} />
        <p className="mtab-count">
          <b>5</b> cartões prontos hoje
        </p>
        <span className="btn is-sun is-big">
          Treinar
          <Play />
        </span>
      </div>
      <Nav3 active="memory" ready={5} />
    </>
  );
}

function PhoneTabEmpty() {
  return (
    <>
      <ForestTab w={PW} h={PH} />
      <TopChips stars={2} days={3} />
      <div className="mtab">
        <h1 className="mtab-title">Treino de memória</h1>
        <div className="guide-col">
          <Bubble tail="down">Tudo em dia! Amanhã tem mais cartões.</Bubble>
          <Cat expression="happy" size={170} />
        </div>
        <CardPile ids={["frog", "bird", "bear"]} size={96} faded />
        <span className="soon">Próximo treino: amanhã</span>
      </div>
      <Nav3 active="memory" />
    </>
  );
}

/* ---------- tablet screens ---------- */

function TabletFront() {
  return (
    <>
      <LessonScene w={TW} h={TH} variant="forest" />
      <div className="lesson is-tablet">
        <MemoryTop done={0} total={5} />
        <div className="mwide">
          <div className="mwide-ask">
            <Cat expression="listening" size={190} />
            <Bubble tail="down">
              <span className="bubble-text">Como se fala em inglês?</span>
            </Bubble>
            <SpeakerButton />
          </div>
          <MemoryCard id="bear" word="bear" side="front" w={330} h={420} />
        </div>
      </div>
    </>
  );
}

function TabletTab() {
  return (
    <>
      <TrailScene w={TW} h={TH} clouds={false} />
      <Trees
        w={TW}
        h={TH}
        items={[
          ["pine", 60, 340, 0.8],
          ["round", 950, 340, 0.8],
          ["pine", 70, 740, 1.3],
          ["round", 980, 730, 1.1],
          ["flower", 300, 700],
          ["mush", 740, 720],
        ]}
      />
      <TopChips stars={2} days={3} />
      <div className="mtab is-tablet">
        <div className="mtab-side">
          <h1 className="mtab-title">Treino de memória</h1>
          <div className="guide-row">
            <Cat expression="pointing" size={130} />
            <Bubble>
              <span className="bubble-text">Tem cartões para treinar!</span>
              <SpeakerButton />
            </Bubble>
          </div>
          <span className="btn is-sun is-big">
            Treinar
            <Play />
          </span>
        </div>
        <div className="mtab-side is-pile">
          <CardPile ids={["frog", "bird", "bear"]} size={150} />
          <p className="mtab-count">
            <b>5</b> cartões prontos hoje
          </p>
        </div>
      </div>
      <Nav3 active="memory" ready={5} wide />
    </>
  );
}

/* ---------- page ---------- */

function Row({ children }: { children: ReactNode }) {
  return <div className="row">{children}</div>;
}

function Page() {
  return (
    <main>
      <section data-sheet="6-celular-memoria-cartao">
        <h2>Treino de memória: lembrar e virar o cartão</h2>
        <Row>
          <Device kind="phone" name="1. A figura: como se fala?">
            <PhoneFront />
          </Device>
          <Device kind="phone" name="2. Virou: a palavra e a voz">
            <PhoneBack />
          </Device>
          <Device kind="phone" name="3. O app confere">
            <PhoneCheck />
          </Device>
          <Device kind="phone" name="4. Fim do treino">
            <PhoneEnd />
          </Device>
        </Row>
      </section>
      <section data-sheet="7-celular-memoria-aba">
        <h2>A aba Memória</h2>
        <Row>
          <Device kind="phone" name="Cartões prontos hoje">
            <PhoneTab />
          </Device>
          <Device kind="phone" name="Tudo em dia">
            <PhoneTabEmpty />
          </Device>
        </Row>
      </section>
      <section data-sheet="8-tablet-memoria">
        <h2>Tablet deitado: cartão e aba Memória</h2>
        <Row>
          <Device kind="tablet" name="O cartão">
            <TabletFront />
          </Device>
          <Device kind="tablet" name="A aba Memória">
            <TabletTab />
          </Device>
        </Row>
      </section>
    </main>
  );
}

const css = `
.pill-count{font-size:18px;padding:7px 13px 5px}
.mcenter{display:flex;justify-content:center;margin-top:10px}
.mstack{position:relative}
.mcard{position:absolute;inset:0;border-radius:36px;background:#fff;border:6px solid #E1E7EF;box-shadow:0 10px 0 #C5CFDC;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
.mcard.is-behind{background:#F4F7FB}
.mcard.is-b1{transform:rotate(4deg) translate(10px,6px)}
.mcard.is-b2{transform:rotate(-5deg) translate(-10px,10px);opacity:.8}
.mcard.is-front{background:#fff}
.mcard.is-back{background:#EAF5FF;border-color:#4AA8F0;box-shadow:0 10px 0 #2C82CC}
.mcard-q{position:absolute;top:14px;right:16px;width:46px;height:46px;border-radius:50%;background:#4AA8F0;color:#fff;font-family:"Baloo 2";font-weight:800;font-size:32px;line-height:50px;text-align:center;box-shadow:0 4px 0 #2C82CC}
.mcard-hint{display:inline-flex;align-items:center;gap:8px;color:#2C82CC;font-family:"Baloo 2";font-weight:800;font-size:20px;background:#EAF5FF;border-radius:16px;padding:6px 14px 4px}
.mcard-word{font-family:"Baloo 2";font-weight:800;font-size:62px;line-height:.9;color:#2C82CC}
.nav.is-3{padding:0 10px;justify-content:space-between}
.nav.is-3 .tab{font-size:18px;gap:6px;padding:9px 12px;position:relative}
.nav.is-3.is-wide{width:520px;padding:0 14px}
.tab.is-sky{background:#4AA8F0;box-shadow:0 5px 0 #2C82CC}
.tab-badge{position:absolute;top:-8px;right:-6px;min-width:26px;height:26px;border-radius:13px;background:#FF7A6B;color:#fff;font-family:Nunito;font-weight:900;font-size:15px;line-height:22px;text-align:center;border:3px solid #FFF8EC}
.mtab{position:absolute;inset:0;padding:74px 20px 100px;display:flex;flex-direction:column;align-items:center;gap:14px}
.mtab-title{margin:0;font-family:"Baloo 2";font-weight:800;font-size:38px;line-height:1;color:#fff;text-shadow:0 3px 0 #2C82CC, 0 7px 0 rgba(31,60,40,.2)}
.guide-row{display:flex;align-items:center;gap:10px;width:100%}
.guide-row .bubble{flex:1}
.guide-col{display:flex;flex-direction:column;align-items:center;gap:4px;margin-top:6px}
.guide-col .bubble{font-size:22px;max-width:320px}
.pile{position:relative;margin-top:8px}
.pile-card{position:absolute;top:0;background:#fff;border-radius:26px;border:5px solid #E1E7EF;box-shadow:0 8px 0 #C5CFDC;display:grid;place-items:center}
.pile.is-faded{opacity:.55;filter:saturate(.6)}
.mtab-count{margin:6px 0 0;font-family:"Baloo 2";font-weight:800;font-size:24px;background:#fff;border-radius:18px;padding:8px 18px 6px;box-shadow:0 4px 0 rgba(31,60,40,.18)}
.mtab-count b{color:#2C82CC;font-size:30px}
.mtab > .btn{width:100%;margin-top:auto}
.soon{margin-top:auto;font-family:"Baloo 2";font-weight:800;font-size:22px;color:#5E6475;background:rgba(255,255,255,.85);border-radius:18px;padding:10px 20px 8px}
.mtab.is-tablet{flex-direction:row;justify-content:center;align-items:center;gap:60px;padding:70px 60px 110px}
.mtab-side{display:flex;flex-direction:column;align-items:flex-start;gap:24px;width:420px}
.mtab-side .mtab-title{font-size:54px}
.mtab-side .bubble{font-size:26px}
.mtab-side .btn{min-width:300px}
.mtab-side.is-pile{align-items:center;width:auto}
.mwide{display:flex;align-items:center;justify-content:center;gap:70px;margin-top:20px}
.mwide-ask{display:flex;flex-direction:column;align-items:center;gap:14px;width:300px}
.mwide-ask .bubble.tail-down{font-size:28px;padding:14px 20px}
`;

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
${fontsLink}
<style>${artCss}</style><style>${baseCss}${css}</style></head>
<body>${renderToStaticMarkup(<Page />)}</body></html>`;

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "memory-mockups.html"), html);
console.log(`wrote ${resolve(outDir, "memory-mockups.html")}`);
