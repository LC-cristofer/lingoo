// "Premium e contido": one restrained design system in two variants (Escuro and Claro). Plain calm
// background with a single soft light behind the current stop, neutrals + one blue accent + semantic
// green (done/correct) + warm amber (current). Pictures for approval only; no app screen imports this.
//   npx tsx tools/visual/premium-mockups.tsx
//   node tools/visual/frames.cjs tools/visual/.out/premium-mockups.html tools/visual/.out/premium-mockups 2
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CSSProperties, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Animal } from "@/art/Animal";
import { Cat } from "@/art/Cat";
import type { ArtId } from "@/domain/trail/schema";
import { artCss, fontsLink, Glyph, outDir, type Kind } from "./mockups";

type Theme = "d" | "l";
type P = [number, number];
type State = "done" | "current" | "locked";
const f = (n: number) => Math.round(n * 10) / 10;

/* ================================================================== */
/* icons (original, 24px line icons)                                   */
/* ================================================================== */

const I = {
  route: <><circle cx="6" cy="18.5" r="2.2" /><circle cx="16.5" cy="4.5" r="2.2" /><path d="M8.2 18.5 h7.3 a3.6 3.6 0 0 0 0 -7.2 h-7 a3.6 3.6 0 0 1 0 -7.2 h5.8" /></>,
  cards: <><rect x="3" y="8" width="13" height="13" rx="3.2" /><path d="M7.5 4.5 h10 a3.2 3.2 0 0 1 3.2 3.2 v9" /></>,
  book: <><path d="M3 5.8 q4.5 -1.6 9 1 q4.5 -2.6 9 -1 v12.6 q-4.5 -1.6 -9 1 q-4.5 -2.6 -9 -1z" /><path d="M12 6.8 v12.6" /></>,
  music: <><path d="M9 17.5 V5.5 l10.5 -2 v12" /><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="17" cy="15.5" r="2.5" /></>,
  tree: <><path d="M12 2.8 l5 7 h-3 l4 6 H6 l4 -6 H7z" /><path d="M12 15.8 v5" /></>,
  palette: <><path d="M12 3 a9 9 0 1 0 0 18 c1.6 0 2.2 -1.1 1.6 -2.2 s0 -2.4 1.6 -2.4 h1.9 a3.6 3.6 0 0 0 3.6 -3.6 C20.7 7 16.9 3 12 3z" /><circle cx="7.8" cy="11" r=".9" fill="currentColor" /><circle cx="10.5" cy="7.4" r=".9" fill="currentColor" /><circle cx="15" cy="7.8" r=".9" fill="currentColor" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="3" /><path d="M8 10.5 V8 a4 4 0 0 1 8 0 v2.5" /></>,
};
function Icon({ name, size = 24, sw = 2.2 }: { name: keyof typeof I; size?: number; sw?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {I[name]}
    </svg>
  );
}
const Star = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="-12 -12 24 24" width={size} height={size} aria-hidden="true">
    <defs>
      <linearGradient id="stg" x1="0" y1="-1" x2="0" y2="1">
        <stop offset="0" stopColor="#FFD477" />
        <stop offset="1" stopColor="#FFA928" />
      </linearGradient>
    </defs>
    <path d="M0 -10.5 l3.2 6.6 l7.2 1 l-5.2 5 l1.3 7.2 l-6.5 -3.4 l-6.5 3.4 l1.3 -7.2 l-5.2 -5 l7.2 -1z" fill="url(#stg)" strokeLinejoin="round" stroke="url(#stg)" strokeWidth="1.4" />
  </svg>
);

/* ================================================================== */
/* trail                                                               */
/* ================================================================== */

function smooth(pts: P[]): string {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

function Trail({ pts, doneTo, w, h }: { pts: P[]; doneTo: number; w: number; h: number }) {
  return (
    <svg className="layer" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <path d={smooth(pts.slice(doneTo))} className="tr-todo" />
      <path d={smooth(pts.slice(0, doneTo + 1))} className="tr-done" />
    </svg>
  );
}

const ChestGlyph = () => (
  <g>
    <path d="M-16 -2 v-7 a16 9 0 0 1 32 0 v7z" fill="#fff" />
    <rect x="-16" y="-2" width="32" height="17" rx="3.5" fill="#fff" />
    <rect x="-3.2" y="-9" width="6.4" height="13" rx="2" className="chest-band" />
  </g>
);

function Stop({ x, y, kind, state, size = 68, label, side = "right", chest }: { x: number; y: number; kind: Kind; state: State; size?: number; label?: string; side?: "left" | "right"; chest?: boolean }) {
  return (
    <div className={`stop is-${state}`} style={{ left: x - size / 2, top: y - size / 2, width: size, height: size }}>
      {state === "current" && (
        <>
          <span className="stop-ring r1" />
          <span className="stop-ring r2" />
        </>
      )}
      <span className="stop-disc">
        <svg viewBox="-22 -22 44 44" width={size * 0.58} height={size * 0.58} aria-hidden="true" className={`gl gl-${state}`}>
          {state === "done" ? <path d="M-11 0 l8 8 l14 -16" stroke="#fff" strokeWidth="5.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /> : chest ? <ChestGlyph /> : <Glyph kind={kind} locked={state === "locked"} />}
        </svg>
      </span>
      {label && <span className={`stop-label is-${side}`}>{label}</span>}
    </div>
  );
}

/* ================================================================== */
/* chrome: top bar, unit header, nav, bubble                           */
/* ================================================================== */

function TopBar({ days = 3, stars = 2, top = 14, side = 16 }: { days?: number; stars?: number; top?: number; side?: number }) {
  return (
    <div className="topbar" style={{ top, left: side, right: side }}>
      <span className="days">
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <span key={i} className={`day ${i < days ? "is-on" : i === days ? "is-today" : ""}`}>
            <i>
              {i < days && (
                <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
                  <path d="M2.5 6.3 l2.4 2.4 l4.6 -5.2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </i>
            <em>{d}</em>
          </span>
        ))}
      </span>
      <span className="topbar-r">
        <span className="pill-star">
          <Star />
          <b>{stars}</b>
        </span>
        <span className="icon-btn" aria-label="Música ligada">
          <Icon name="music" size={22} />
        </span>
      </span>
    </div>
  );
}

function UnitHeader({ n, title, icon, done, total, locked, style }: { n: number; title: string; icon: keyof typeof I; done?: number; total?: number; locked?: boolean; style: CSSProperties }) {
  return (
    <div className={`uh ${locked ? "is-locked" : ""}`} style={style}>
      <span className="uh-chip">
        <Icon name={icon} size={22} />
      </span>
      <span className="uh-text">
        <small>Unidade {n}</small>
        <strong>{title}</strong>
      </span>
      {locked ? (
        <span className="uh-lock">
          <Icon name="lock" size={18} />
        </span>
      ) : (
        <span className="uh-prog">
          <em>
            {done}/{total}
          </em>
          <span className="uh-bar">
            <i style={{ width: `${((done ?? 0) / (total ?? 1)) * 100}%` }} />
          </span>
        </span>
      )}
      <span className="uh-line" />
    </div>
  );
}

function Nav({ wide, active = 0 }: { wide?: boolean; active?: number }) {
  const tabs: { n: string; i: keyof typeof I }[] = [
    { n: "Trilha", i: "route" },
    { n: "Memória", i: "cards" },
    { n: "Álbum", i: "book" },
  ];
  return (
    <nav className={`nav ${wide ? "is-wide" : ""}`}>
      {tabs.map((t, i) => (
        <span key={t.n} className={`tab ${i === active ? "is-active" : ""}`}>
          <Icon name={t.i} size={24} />
          <b>{t.n}</b>
        </span>
      ))}
    </nav>
  );
}

function Bubble({ children, tail = "left", style }: { children: ReactNode; tail?: "left" | "down"; style?: CSSProperties }) {
  return (
    <div className={`bub tail-${tail}`} style={style}>
      {children}
    </div>
  );
}

function Speaker() {
  return (
    <span className="speaker">
      <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
        <path d="M5 12 h6 l8 -6 v20 l-8 -6 h-6z" fill="#fff" />
        <path d="M23 11 q4 5 0 10" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/* ================================================================== */
/* devices                                                             */
/* ================================================================== */

const PW = 390;
const PH = 844;
const TW = 1024;
const TH = 768;

function Dev({ kind, theme, title, note, children, glow }: { kind: "phone" | "tablet"; theme: Theme; title: string; note: string; children: ReactNode; glow?: P }) {
  const style = glow ? ({ "--gx": `${glow[0]}px`, "--gy": `${glow[1]}px` } as CSSProperties) : undefined;
  return (
    <figure className={`dev is-${kind}`}>
      <div className={`scr t-${theme}`} style={style}>
        {children}
      </div>
      <figcaption>
        <b>{title}</b>
        <span>{note}</span>
      </figcaption>
    </figure>
  );
}

/* ---------- phone map ---------- */

const STOPS: { kind: Kind; label: string }[] = [
  { kind: "song", label: "Música" },
  { kind: "lesson", label: "Lição 1" },
  { kind: "lesson", label: "Lição 2" },
  { kind: "lesson", label: "Lição 3" },
  { kind: "story", label: "História" },
  { kind: "challenge", label: "Desafio" },
];
const st = (i: number): State => (i < 2 ? "done" : i === 2 ? "current" : "locked");

const P_PTS: P[] = [
  [108, 196],
  [214, 268],
  [280, 340],
  [206, 412],
  [120, 484],
  [200, 556],
  [280, 626],
  [236, 678],
];
const P_SIDE: ("left" | "right")[] = ["right", "right", "right", "right", "right", "right"];

function PhoneMap({ theme }: { theme: Theme }) {
  return (
    <Dev kind="phone" theme={theme} glow={[280, 340]} title={theme === "d" ? "Escuro: mapa" : "Claro: mapa"} note="O brilho atrás da parada atual respira devagar (4 s). O mapa rola com mola suave e as paradas feitas acendem em verde ao concluir.">
      <Trail pts={P_PTS} doneTo={2} w={PW} h={PH} />
      <UnitHeader n={1} title="Animais da floresta" icon="tree" done={2} total={6} style={{ left: 16, right: 16, top: 72 }} />
      {STOPS.map((s, i) => (
        <Stop key={i} x={P_PTS[i][0]} y={P_PTS[i][1]} kind={s.kind} state={st(i)} label={st(i) === "current" ? undefined : s.label} side={P_SIDE[i]} />
      ))}
      <Stop x={P_PTS[6][0]} y={P_PTS[6][1]} kind="lesson" state="locked" chest label="Baú" side="left" size={64} />
      <div className="guide" style={{ left: 22, top: 238 }}>
        <Bubble tail="down">Vamos, lição 2!</Bubble>
        <span style={{ marginLeft: 22 }}><Cat expression="talking" size={104} /></span>
        <span className="ground" />
      </div>
      <UnitHeader n={2} title="Cores" icon="palette" locked style={{ left: 16, right: 16, top: 686 }} />
      <TopBar />
      <Nav />
    </Dev>
  );
}

/* ---------- phone lesson ---------- */

function CloseBtn() {
  return (
    <span className="icon-btn is-close">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function LessonTile({ id, size, state }: { id: ArtId; size: number; state?: "correct" | "dim" }) {
  return (
    <div className={`ltile ${state ? `is-${state}` : ""}`} style={{ width: size, height: size }}>
      <Animal id={id} size={size * 0.76} />
      {state === "correct" && (
        <span className="ltile-badge">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M5.5 12.5 l4.2 4.2 L18.5 7.5" stroke="#fff" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </div>
  );
}

function PhoneLesson({ theme, correct }: { theme: Theme; correct?: boolean }) {
  const ids: ArtId[] = ["bird", "bear", "frog", "mouse"];
  return (
    <Dev
      kind="phone"
      theme={theme}
      glow={[195, 470]}
      title={`${theme === "d" ? "Escuro" : "Claro"}: ${correct ? "acertou" : "exercício"}`}
      note={correct ? "A folha de resposta sobe com mola (240 ms), o visto do cartão salta uma vez e o gatinho comemora." : "Os cartões afundam 3 px ao toque; a barra de progresso desliza ao avançar."}
    >
      <div className="lesson">
        <div className="lesson-top">
          <CloseBtn />
          <span className="bar">
            <i style={{ width: correct ? "40%" : "30%" }} />
          </span>
        </div>
        <div className="ask">
          <span className="ask-cat">
            <Cat expression={correct ? "happy" : "pointing"} size={118} />
          </span>
          <Bubble>
            <span className="bub-text">
              Qual é o <b lang="en">bear</b>? Toque nele!
            </span>
            <Speaker />
          </Bubble>
        </div>
        <div className="ltiles">
          {ids.map((id) => (
            <LessonTile key={id} id={id} size={164} state={correct ? (id === "bear" ? "correct" : "dim") : undefined} />
          ))}
        </div>
      </div>
      {correct && (
        <>
          <div className="scrim" />
          <div className="rsheet">
            <div className="rsheet-head">
              <span className="rsheet-ic">
                <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                  <path d="M5.5 12.5 l4.2 4.2 L18.5 7.5" stroke="currentColor" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="rsheet-t">
                <strong lang="en">Yes! That&apos;s great!</strong>
                <small>Bear quer dizer urso.</small>
              </span>
            </div>
            <span className="cta is-green">Continuar</span>
          </div>
        </>
      )}
    </Dev>
  );
}

/* ---------- phone start ---------- */

function PhoneStart({ theme }: { theme: Theme }) {
  return (
    <Dev kind="phone" theme={theme} glow={[195, 520]} title={`${theme === "d" ? "Escuro" : "Claro"}: início`} note="O gatinho respira (escala 1,5 %) e o brilho atrás dele pulsa junto. O botão Jogar afunda ao toque e a próxima tela entra deslizando.">
      <div className="start">
        <span className="icon-btn is-corner">
          <Icon name="music" size={22} />
        </span>
        <h1 className="mark">Fofi</h1>
        <p className="tag">Inglês para brincar</p>
        <div className="start-cat">
          <Cat expression="happy" size={236} />
          <span className="ground is-big" />
        </div>
        <span className="cta is-accent is-big">
          Jogar
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <path d="M8 5 L19 12 L8 19Z" fill="currentColor" />
          </svg>
        </span>
      </div>
    </Dev>
  );
}

/* ---------- tablet map ---------- */

const T_PTS: P[] = [
  [500, 118],
  [596, 202],
  [682, 286],
  [590, 370],
  [506, 454],
  [592, 538],
  [680, 616],
];

function TabletMap({ theme }: { theme: Theme }) {
  return (
    <Dev kind="tablet" theme={theme} glow={[748, 286]} title={`${theme === "d" ? "Escuro" : "Claro"}: mapa no tablet`} note="Mesma trilha, mais respiro: cabeçalho da unidade à esquerda, trilha ao centro e o gatinho ao lado da parada atual. Rolagem com mola suave.">
      <Trail pts={T_PTS} doneTo={2} w={TW} h={TH} />
      <UnitHeader n={1} title="Animais da floresta" icon="tree" done={2} total={6} style={{ left: 44, top: 104, width: 340 }} />
      {STOPS.map((s, i) => (
        <Stop key={i} x={T_PTS[i][0]} y={T_PTS[i][1]} size={84} kind={s.kind} state={st(i)} label={st(i) === "current" ? undefined : s.label} side={i === 4 ? "left" : "right"} />
      ))}
      <Stop x={T_PTS[6][0]} y={T_PTS[6][1]} size={72} kind="lesson" state="locked" chest label="Baú" side="right" />
      <div className="guide" style={{ left: 750, top: 160 }}>
        <Bubble tail="down">Vamos, lição 2!</Bubble>
        <Cat expression="talking" size={112} />
        <span className="ground" />
      </div>
      <UnitHeader n={2} title="Cores" icon="palette" locked style={{ left: 44, top: 600, width: 340 }} />
      <TopBar top={22} side={32} />
      <Nav wide />
    </Dev>
  );
}

/* ================================================================== */
/* side panels                                                         */
/* ================================================================== */

function Legend() {
  const row = (theme: Theme, name: string) => (
    <div className={`lg t-${theme}`}>
      <b className="lg-name">{name}</b>
      <div className="lg-row">
        {(
          [
            ["Feito", "done", "lesson", false],
            ["Atual", "current", "lesson", false],
            ["Bloqueado", "locked", "story", false],
            ["Baú", "locked", "lesson", true],
          ] as [string, State, Kind, boolean][]
        ).map(([l, s, k, c]) => (
          <span key={l} className="lg-item">
            <span className="lg-stop">
              <Stop x={42} y={42} size={68} kind={k} state={s} chest={c} />
            </span>
            <em>{l}</em>
          </span>
        ))}
      </div>
    </div>
  );
  return (
    <aside className="panel">
      <h3>Estados da parada</h3>
      <p>Redonda e grande (68 px, alvo de toque maior que 64), com brilho no topo e sombra suave. Feito vira verde com visto, atual é âmbar com anel de luz, bloqueado fica neutro. O tipo da parada (música, lição, história, desafio) aparece no ícone e no nome ao lado.</p>
      {row("d", "Escuro")}
      {row("l", "Claro")}
    </aside>
  );
}

function Palette() {
  const sw = (c: string, n: string, dark?: boolean) => (
    <span className="sw" key={n}>
      <i style={{ background: c, boxShadow: dark ? "inset 0 0 0 1px rgba(255,255,255,.14)" : "inset 0 0 0 1px rgba(20,30,80,.12)" }} />
      <em>
        {n}
        <small>{c}</small>
      </em>
    </span>
  );
  return (
    <aside className="panel is-wide">
      <h3>Orçamento de cor</h3>
      <p>
        Acento escolhido: <b>azul cobalto</b> (#4470F4 no escuro, #3A63F0 no claro). O gatinho já é laranja e o âmbar é a cor de &ldquo;agora&rdquo;; um acento laranja competiria com os dois e deixaria tudo quente demais. O azul fica só na barra de progresso, no botão Jogar, na aba ativa e no fio da unidade, e faz o laranja do gatinho saltar. Sem cor por unidade: a unidade se reconhece pelo ícone e pelo título.
      </p>
      <div className="sw-row">
        <div>
          <b>Escuro</b>
          <div className="sws">
            {sw("#121735", "Base", true)}
            {sw("#1A2148", "Base 2", true)}
            {sw("#4470F4", "Acento", true)}
            {sw("#FFB84A", "Atual", true)}
            {sw("#34C77B", "Feito", true)}
            {sw("#F4F6FF", "Texto", true)}
          </div>
        </div>
        <div>
          <b>Claro</b>
          <div className="sws">
            {sw("#F6F7FB", "Base")}
            {sw("#FFFFFF", "Cartão")}
            {sw("#3A63F0", "Acento")}
            {sw("#FFB84A", "Atual")}
            {sw("#1FA463", "Feito")}
            {sw("#151A3A", "Texto")}
          </div>
        </div>
      </div>
      <p className="type">
        <span className="t1">Baloo 2 800</span> para títulos e números, <span className="t2">Nunito 800</span> para apoio. Toque mínimo 64 px, cartões a partir de 160 px, texto com contraste AA.
      </p>
    </aside>
  );
}

/* ================================================================== */
/* page                                                                */
/* ================================================================== */

function Page() {
  return (
    <main>
      <section data-sheet="17-premium-celular-mapa">
        <h2>Premium contido: o mapa no celular</h2>
        <div className="row">
          <PhoneMap theme="d" />
          <PhoneMap theme="l" />
          <Legend />
        </div>
      </section>

      <section data-sheet="18-premium-celular-licao">
        <h2>Premium contido: a lição no celular</h2>
        <div className="row">
          <PhoneLesson theme="d" />
          <PhoneLesson theme="d" correct />
          <PhoneLesson theme="l" />
          <PhoneLesson theme="l" correct />
        </div>
      </section>

      <section data-sheet="19-premium-inicio-tablet">
        <h2>Premium contido: início e tablet</h2>
        <div className="row">
          <PhoneStart theme="d" />
          <PhoneStart theme="l" />
          <TabletMap theme="d" />
        </div>
        <div className="row r2">
          <TabletMap theme="l" />
          <Palette />
        </div>
      </section>
    </main>
  );
}

const css = `
*{box-sizing:border-box}
body{margin:0;background:#E8EBF2;font-family:Nunito,system-ui,sans-serif;color:#151A3A}
main{padding:36px;display:flex;flex-direction:column;gap:48px;width:max-content}
section{padding:28px 32px 36px;background:#E8EBF2;width:max-content}
h2{font-family:"Baloo 2";font-weight:800;font-size:34px;margin:0 0 22px;color:#151A3A}
.row{display:flex;gap:36px;align-items:flex-start}
.row.r2{margin-top:40px}
.dev{margin:0;flex:none}
.dev figcaption{display:flex;flex-direction:column;gap:4px;margin-top:16px;max-width:410px}
.dev.is-tablet figcaption{max-width:720px}
.dev figcaption b{font-family:"Baloo 2";font-weight:800;font-size:19px;color:#151A3A}
.dev figcaption span{font-weight:700;font-size:15px;line-height:1.4;color:#4A5172}
.scr{position:relative;overflow:hidden;border:10px solid #0A0D20;box-shadow:0 24px 50px rgba(20,30,80,.22)}
.is-phone .scr{width:410px;height:864px;border-radius:50px}
.is-tablet .scr{width:1044px;height:788px;border-radius:36px}
.layer{position:absolute;inset:0;display:block}

/* ---- tokens ---- */
.t-d{--bg0:#121735;--bg1:#1A2148;--text:#F4F6FF;--muted:#A5AED8;--line:rgba(255,255,255,.1);--glass:rgba(255,255,255,.06);
 --accent:#4470F4;--accent-t:#9DB5FF;--accent-soft:rgba(110,145,255,.2);--amber:#FFB84A;--green:#34C77B;--green-t:#4FE08E;
 --card:#F3F5FF;--card-line:rgba(255,255,255,.7);--card-sh:0 14px 30px rgba(3,6,28,.45);
 --nav:rgba(28,35,76,.86);--nav-sh:0 18px 40px rgba(3,6,28,.5);--lock-a:#303A6E;--lock-b:#272F5E;--lock-ic:#8E99CF;--lock-hi:rgba(255,255,255,.1);--stop-sh:0 10px 20px rgba(3,6,28,.45);
 --trail:rgba(165,174,216,.42);--sheet:#1F2859;--sheet-sh:0 -20px 50px rgba(3,6,28,.55);--bub-sh:0 8px 20px rgba(3,6,28,.4);
 background:radial-gradient(420px 360px at var(--gx,50%) var(--gy,40%),rgba(255,184,74,.17),transparent 70%),radial-gradient(560px 280px at 50% -60px,rgba(68,112,244,.2),transparent 70%),linear-gradient(180deg,var(--bg0),var(--bg1));color:var(--text)}
.t-l{--bg0:#F8F9FD;--bg1:#EFF1F8;--text:#151A3A;--muted:#5B6488;--line:#E1E5EF;--glass:#fff;
 --accent:#3A63F0;--accent-t:#3A63F0;--accent-soft:rgba(58,99,240,.1);--amber:#FFB84A;--green:#1FA463;--green-t:#12794A;
 --card:#fff;--card-line:#E6E9F2;--card-sh:0 12px 28px rgba(40,55,120,.13);
 --nav:rgba(255,255,255,.92);--nav-sh:0 14px 34px rgba(40,55,120,.16);--lock-a:#EDEFF6;--lock-b:#E2E6F0;--lock-ic:#6F7898;--lock-hi:#fff;--stop-sh:0 8px 16px rgba(40,55,120,.15);
 --trail:rgba(110,120,160,.4);--sheet:#fff;--sheet-sh:0 -16px 44px rgba(40,55,120,.2);--bub-sh:0 8px 20px rgba(40,55,120,.14);
 background:radial-gradient(420px 360px at var(--gx,50%) var(--gy,40%),rgba(255,184,74,.26),transparent 70%),radial-gradient(560px 280px at 50% -60px,rgba(58,99,240,.07),transparent 70%),linear-gradient(180deg,var(--bg0),var(--bg1));color:var(--text)}

/* ---- trail ---- */
.tr-todo{fill:none;stroke:var(--trail);stroke-width:5;stroke-linecap:round;stroke-dasharray:0 13}
.tr-done{fill:none;stroke:var(--green);stroke-width:5;stroke-linecap:round;opacity:.7}

/* ---- stops ---- */
.stop{position:absolute}
.stop-disc{position:absolute;inset:0;border-radius:50%;display:grid;place-items:center}
.stop.is-done .stop-disc{background:linear-gradient(180deg,#4BDA92,#28B16C);box-shadow:inset 0 2px 0 rgba(255,255,255,.45),inset 0 -5px 0 rgba(0,70,35,.2),var(--stop-sh)}
.stop.is-current .stop-disc{background:linear-gradient(180deg,#FFD07A,#FFA826);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),inset 0 -5px 0 rgba(150,70,0,.22),0 10px 24px rgba(255,150,20,.38)}
.stop.is-locked .stop-disc{background:linear-gradient(180deg,var(--lock-a),var(--lock-b));box-shadow:inset 0 2px 0 var(--lock-hi),var(--stop-sh)}
.stop-ring{position:absolute;border-radius:50%;pointer-events:none;animation:breathe 4s ease-in-out infinite}
.stop-ring.r1{inset:-9px;border:2px solid rgba(255,184,74,.55);background:rgba(255,184,74,.1)}
.stop-ring.r2{inset:-20px;border:1.5px solid rgba(255,184,74,.28);animation-delay:.4s}
@keyframes breathe{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.07);opacity:.7}}
@media (prefers-reduced-motion:reduce){.stop-ring{animation:none}}
.gl-current [fill="#fff"]{fill:#3B2300}.gl-current [stroke="#fff"]{stroke:#3B2300}.gl-current [stroke="#4AA8F0"]{stroke:#FFB84A}
.gl-locked [fill="#fff"]{fill:var(--lock-ic)}.gl-locked [stroke="#fff"]{stroke:var(--lock-ic)}.gl-locked [stroke="#4AA8F0"]{stroke:var(--lock-b)}
.gl-locked .chest-band{fill:var(--amber)}
.stop-label{position:absolute;top:50%;transform:translateY(-50%);white-space:nowrap;font-family:"Baloo 2";font-weight:700;font-size:16px;line-height:1;color:var(--muted)}
.stop.is-done .stop-label{color:var(--text)}
.stop-label.is-right{left:calc(100% + 14px)}
.stop-label.is-left{right:calc(100% + 14px)}

/* ---- guide ---- */
.guide{position:absolute;display:flex;flex-direction:column;align-items:flex-start;gap:12px}
.guide .bub{align-self:flex-start}
.ground{display:block;width:70px;height:12px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.35),transparent);margin:-12px 0 0 8px}
.t-l .ground{background:radial-gradient(closest-side,rgba(40,55,120,.25),transparent)}
.ground.is-big{width:190px;height:24px;margin:-22px auto 0}
.bub{position:relative;background:#fff;color:#151A3A;border-radius:18px;padding:11px 15px 9px;font-family:"Baloo 2";font-weight:700;font-size:18px;line-height:1.15;box-shadow:var(--bub-sh);display:flex;align-items:center;gap:10px;white-space:nowrap}
.bub.tail-down::after{content:"";position:absolute;left:26px;bottom:-8px;border:9px solid transparent;border-top-color:#fff;border-bottom:0}
.bub.tail-left::before{content:"";position:absolute;left:-9px;top:50%;margin-top:-9px;border:9px solid transparent;border-right-color:#fff;border-left:0}
.bub b{color:#3A63F0;font-weight:800}
.speaker{flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--accent);box-shadow:inset 0 1.5px 0 rgba(255,255,255,.35)}
.t-d .speaker{background:#4470F4}

/* ---- top bar ---- */
.topbar{position:absolute;display:flex;align-items:center;justify-content:space-between;z-index:5}
.topbar-r{display:flex;align-items:center;gap:10px}
.days{display:inline-flex;gap:6px;padding:7px 11px 5px;border-radius:18px;background:var(--glass);border:1px solid var(--line)}
.t-l .days,.t-l .pill-star,.t-l .icon-btn{box-shadow:0 4px 12px rgba(40,55,120,.07)}
.day{display:flex;flex-direction:column;align-items:center;gap:3px}
.day i{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:rgba(150,160,205,.2);color:#3B2300}
.t-l .day i{background:#E7EAF3}
.day.is-on i{background:linear-gradient(180deg,#FFD07A,#FFA826)}
.day.is-today i{background:transparent;box-shadow:inset 0 0 0 2px var(--amber)}
.day em{font-style:normal;font-weight:800;font-size:11px;line-height:1;color:var(--muted)}
.pill-star{display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 14px 0 11px;border-radius:20px;background:var(--glass);border:1px solid var(--line)}
.pill-star b{font-family:"Baloo 2";font-weight:800;font-size:19px;line-height:1;padding-top:2px}
.icon-btn{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--glass);border:1px solid var(--line);color:var(--accent-t)}
.icon-btn.is-close{width:48px;height:48px;color:var(--muted)}
.icon-btn.is-corner{position:absolute;right:20px;top:20px}

/* ---- unit header ---- */
.uh{position:absolute;display:flex;align-items:center;gap:12px;padding-bottom:12px}
.uh-chip{flex:none;width:44px;height:44px;border-radius:15px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent-t)}
.uh-text{flex:1;min-width:0}
.uh-text small{display:block;font-weight:800;font-size:13px;line-height:1.1;color:var(--muted)}
.uh-text strong{display:block;font-family:"Baloo 2";font-weight:800;font-size:23px;line-height:1.05;margin-top:1px}
.uh-prog{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.uh-prog em{font-style:normal;font-family:"Baloo 2";font-weight:800;font-size:15px;line-height:1;color:var(--muted)}
.uh-bar{display:block;width:62px;height:5px;border-radius:3px;background:var(--line);overflow:hidden}
.uh-bar i{display:block;height:100%;border-radius:3px;background:var(--accent)}
.uh-lock{color:var(--muted);display:grid;place-items:center;width:36px;height:36px}
.uh-line{position:absolute;left:0;right:0;bottom:0;height:2px;border-radius:1px;background:linear-gradient(90deg,var(--accent) 0,var(--accent) 64px,var(--line) 64px)}
.uh.is-locked{opacity:.62}
.uh.is-locked .uh-chip{background:var(--glass);color:var(--muted)}
.uh.is-locked .uh-line{background:var(--line)}

/* ---- nav ---- */
.nav{position:absolute;left:14px;right:14px;bottom:14px;display:flex;gap:4px;padding:6px;border-radius:30px;background:var(--nav);border:1px solid var(--line);box-shadow:var(--nav-sh);backdrop-filter:blur(14px)}
.nav.is-wide{left:50%;right:auto;transform:translateX(-50%);width:440px;bottom:22px}
.tab{flex:1;height:64px;border-radius:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:var(--muted)}
.tab b{font-family:"Baloo 2";font-weight:700;font-size:13.5px;line-height:1}
.tab.is-active{background:var(--accent-soft);color:var(--accent-t)}
.tab.is-active b{font-weight:800}

/* ---- buttons ---- */
.cta{display:flex;align-items:center;justify-content:center;gap:10px;height:68px;border-radius:24px;font-family:"Baloo 2";font-weight:800;font-size:25px;line-height:1;padding-top:3px}
.cta.is-green{background:linear-gradient(180deg,#4FE08E,#2CBB72);color:#06301B;box-shadow:inset 0 2px 0 rgba(255,255,255,.45),inset 0 -4px 0 rgba(0,80,40,.18),0 10px 22px rgba(30,170,100,.35)}
.cta.is-accent{background:linear-gradient(180deg,#5A82FF,#3D69F2);color:#fff;box-shadow:inset 0 2px 0 rgba(255,255,255,.35),inset 0 -5px 0 rgba(10,30,120,.25),0 14px 30px rgba(55,95,240,.45)}
.t-l .cta.is-accent{background:linear-gradient(180deg,#4E78FA,#3359E6)}
.cta.is-big{height:78px;border-radius:28px;font-size:30px}

/* ---- lesson ---- */
.lesson{position:absolute;inset:0;padding:16px 18px 0;display:flex;flex-direction:column}
.lesson-top{display:flex;align-items:center;gap:12px}
.bar{flex:1;height:14px;border-radius:7px;background:var(--glass);border:1px solid var(--line);overflow:hidden;display:block}
.t-l .bar{background:#E3E7F1;border-color:transparent}
.bar i{display:block;height:100%;border-radius:7px;background:linear-gradient(90deg,#4470F4,#6B92FF);box-shadow:inset 0 2px 0 rgba(255,255,255,.3)}
.ask{display:flex;align-items:center;gap:14px;margin-top:40px}
.ask-cat{flex:none;margin-right:2px}
.ask .bub{flex:1;white-space:normal;padding:13px 14px 11px 16px;font-size:20px;line-height:1.2}
.bub-text{flex:1}
.ltiles{display:grid;grid-template-columns:repeat(2,164px);gap:18px;justify-content:center;margin-top:52px}
.ltile{position:relative;display:grid;place-items:center;border-radius:30px;background:var(--card);border:1px solid var(--card-line);box-shadow:inset 0 2px 0 rgba(255,255,255,.9),var(--card-sh)}
.ltile.is-correct{box-shadow:0 0 0 4px var(--green),0 0 34px rgba(52,199,123,.45),var(--card-sh);background:#EAFBF2}
.ltile.is-dim{opacity:.38;box-shadow:none}
.ltile-badge{position:absolute;right:-9px;top:-9px;width:38px;height:38px;border-radius:50%;background:#26B26A;border:3px solid var(--bg1);display:grid;place-items:center}
.scrim{position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(5,8,30,.35))}
.t-l .scrim{background:linear-gradient(180deg,transparent 40%,rgba(40,55,120,.14))}
.rsheet{position:absolute;left:0;right:0;bottom:0;padding:26px 20px 34px;border-radius:32px 32px 0 0;background:var(--sheet);box-shadow:var(--sheet-sh);border-top:1px solid var(--line);display:flex;flex-direction:column;gap:22px}
.rsheet::before{content:"";position:absolute;left:50%;top:9px;width:40px;height:4px;margin-left:-20px;border-radius:2px;background:var(--line)}
.rsheet-head{display:flex;align-items:center;gap:14px;margin-top:6px}
.rsheet-ic{flex:none;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#4FE08E,#2CBB72);color:#06301B}
.rsheet-t strong{display:block;font-family:"Baloo 2";font-weight:800;font-size:28px;line-height:1.05;color:var(--green-t)}
.rsheet-t small{display:block;font-weight:700;font-size:16px;margin-top:3px;color:var(--muted)}

/* ---- start ---- */
.start{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:150px 24px 44px}
.mark{margin:0;font-family:"Baloo 2";font-weight:800;font-size:120px;line-height:.9;letter-spacing:-2px;color:var(--text)}
.tag{margin:12px 0 0;font-weight:800;font-size:20px;color:var(--muted)}
.start-cat{margin-top:auto;margin-bottom:46px;display:flex;flex-direction:column}
.start .cta{width:100%}

/* ---- panels ---- */
.panel{width:440px;flex:none;padding:26px 28px 28px;border-radius:28px;background:#fff;box-shadow:0 14px 34px rgba(40,55,120,.1)}
.panel h3{margin:0 0 8px;font-family:"Baloo 2";font-weight:800;font-size:24px}
.panel p{margin:0 0 18px;font-weight:700;font-size:15.5px;line-height:1.5;color:#3C4468}
.panel.is-wide{width:880px;margin-top:0}
.lg{border-radius:22px;padding:16px 16px 10px;margin-top:14px;border:1px solid rgba(20,30,80,.08)}
.lg-name{display:block;font-family:"Baloo 2";font-weight:800;font-size:16px;margin-bottom:6px}
.lg-row{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
.lg-item{display:flex;flex-direction:column;align-items:center}
.lg-stop{position:relative;display:block;width:84px;height:84px}
.lg-stop .stop{transform:translate(0,0)}
.lg-item em{font-style:normal;font-weight:800;font-size:13px;color:var(--muted);margin-top:4px;margin-bottom:6px}
.sw-row{display:flex;gap:32px;margin-bottom:6px}
.sw-row>div>b{display:block;font-family:"Baloo 2";font-weight:800;font-size:16px;margin-bottom:10px}
.sws{display:flex;gap:8px}
.sw{display:flex;flex-direction:column;gap:7px;width:58px}
.sw i{display:block;height:48px;border-radius:14px}
.sw em{font-style:normal;font-weight:800;font-size:12.5px;line-height:1.25;color:#151A3A}
.sw small{display:block;font-weight:700;font-size:11px;color:#5B6488}
.panel .type{margin:14px 0 0}
.t1{font-family:"Baloo 2";font-weight:800}
.t2{font-family:Nunito;font-weight:800}
`;

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
${fontsLink}
<style>${artCss}</style><style>${css}</style></head>
<body>${renderToStaticMarkup(<Page />)}</body></html>`;

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "premium-mockups.html"), html);
console.log(`wrote ${resolve(outDir, "premium-mockups.html")}`);
void PH;
void TW;
void TH;
