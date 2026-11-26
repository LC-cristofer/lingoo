"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Nino } from "@/art/nino/Nino";
import { poseState } from "@/art/nino/poses";
import { Sticker } from "@/art/scenes/Sticker";
import { narrator } from "@/audio/narrator";
import { useBackgroundMusic } from "@/audio/useBackgroundMusic";
import { useProfile } from "@/components/nestoy/ProfileProvider";
import { useSettings } from "@/components/nestoy/SettingsProvider";
import { StageView, useSideLayout, type StageInsets } from "@/components/nestoy/StageView";
import { CloseIcon, PlayIcon } from "@/components/trail/icons";
import { ChunkyButton } from "@/components/trail/kit/ChunkyButton";
import { useToday } from "@/components/trail/useToday";
import { useTrailProgress } from "@/components/trail/TrailProgressProvider";
import { settleArvore, settleFarol } from "@/components/island/return";
import { arvoreLevel, farolLevel, getAreaUnits, LAUNCH_STATES, wovenThreads } from "@/domain/nestoy/island-view";
import { isNight } from "@/domain/nestoy/settings";
import { getLines, getPath, getUnit } from "@/domain/trail/content";
import { daysBetween, dueCards, nextDue } from "@/domain/trail/memory";
import { emptyProgress } from "@/domain/trail/progress";
import type { ArtId, Narration } from "@/domain/trail/schema";
import { nestViewCam, type Viewport } from "@/world/camera";
import type { PlaceId } from "@/world/island";
import type { Stage } from "@/world/stage";

const EMPTY = emptyProgress();

/** Phase 1 stickers the nest still knows how to show; the earned ones come from progress.legacy. */
const LEGACY_STICKERS: Record<string, { image: string; name: (lines: ReturnType<typeof getLines>) => Narration }> = {
  "sticker-fox": { image: "/content/forest-animals/sticker-fox.svg", name: (l) => l.legacyFox },
};

type Slot = { unitId: string; number: number; title: string; sticker: { id: string; art: ArtId; name: Narration } | null };

/** One slot per unit of an area of the path, with the sticker of its challenge once it has content. */
const slotsOf = (area: "farol" | "letras"): Slot[] =>
  getPath()
    .filter((entry) => entry.area === area)
    .map((entry, index) => {
      const unit = entry.hasContent ? getUnit(entry.unitId) : null;
      const challenge = unit?.stops.find((s) => s.kind === "challenge");
      return {
        unitId: entry.unitId,
        number: index + 1,
        title: entry.title,
        sticker: challenge && challenge.kind === "challenge" && challenge.sticker ? challenge.sticker : null,
      };
    });

/** The nest: Nino awake in it on top, and a cream sheet with the stickers and the memory training. */
export function NinhoScreen() {
  const router = useRouter();
  const { settings, hydrated: settingsReady } = useSettings();
  const { profile } = useProfile();
  const { progress, hydrated } = useTrailProgress();
  const childName = profile.name.trim();
  const today = useToday();
  const lines = useMemo(() => getLines(), []);
  const shown = hydrated ? progress : EMPTY;
  useBackgroundMusic("album");

  // The nest speaks once per arrival (a kept-alive page re-runs this when it shows again).
  useEffect(() => {
    void narrator.playNarration(getLines().album);
    return () => narrator.stop();
  }, []);

  // The farol's units, then the Árvore das Letras' branches in a section of their own.
  const slots = useMemo(() => slotsOf("farol"), []);
  const treeSlots = useMemo(() => slotsOf("letras"), []);
  const areas = useMemo(() => getAreaUnits(), []);
  const threads = areas ? wovenThreads(shown, areas) : 0;
  const level = areas ? farolLevel(shown, areas.farol) : 1;
  const treeLevel = areas ? arvoreLevel(shown, areas.letras) : 1;

  const legacy = Object.keys(shown.legacy?.stickers ?? {})
    .filter((id) => Object.hasOwn(LEGACY_STICKERS, id))
    .map((id) => ({ id, image: LEGACY_STICKERS[id].image, name: LEGACY_STICKERS[id].name(lines) }));

  const ready = hydrated && today !== null;
  const due = ready ? dueCards(shown.memory, today).length : 0;
  const next = ready ? nextDue(shown.memory, today) : null;
  const daysToNext = next && today ? daysBetween(today, next) : null;

  // ---- the world behind the sheet ----
  const side = useSideLayout();
  const sheetRef = useRef<HTMLElement>(null);
  const [insets, setInsets] = useState<StageInsets>({ top: 96, bottom: 400, left: 0, right: 0 });
  const measure = useCallback(() => {
    const el = sheetRef.current;
    if (!el) return;
    const k = el.getBoundingClientRect();
    if (!k.width) return; // not laid out (tests)
    const vw = window.innerWidth, vh = window.innerHeight;
    const next: StageInsets = side
      ? { top: 16, bottom: 16, left: 0, right: Math.round(vw - k.left + 8) }
      : { top: 96, bottom: Math.round(vh - k.top + 8), left: 0, right: 0 };
    setInsets((prev) => (prev.top === next.top && prev.bottom === next.bottom && prev.left === next.left && prev.right === next.right ? prev : next));
  }, [side]);
  useEffect(() => {
    measure();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (sheetRef.current) ro?.observe(sheetRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, hydrated]);

  const stageRef = useRef<Stage | null>(null);
  const vpRef = useRef<Viewport | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const onStage = useCallback((s: Stage | null) => {
    stageRef.current = s;
    setStage(s);
  }, []);
  const onViewport = useCallback((vp: Viewport) => {
    vpRef.current = vp;
    if (stageRef.current) Object.assign(stageRef.current.cam, nestViewCam(vp));
  }, []);
  // The island behind the sheet is the child's island: the farol and the tree as grown.
  useEffect(() => {
    if (!stage) return;
    settleFarol(stage, level);
    settleArvore(stage, treeLevel);
  }, [stage, level, treeLevel]);
  useEffect(() => {
    const s = stageRef.current;
    if (!stage || !s) return;
    s.moveNino("nest");
    Object.assign(s.nino.st, { x: 500, y: 1070, s: 0.56 }, poseState("idle"));
    for (const id of Object.keys(s.fx.pins) as PlaceId[]) s.fx.pins[id] = 0;
    s.env.night = settingsReady && isNight(settings, new Date()) ? 1 : 0;
    if (vpRef.current) Object.assign(s.cam, nestViewCam(vpRef.current));
  }, [stage, settings, settingsReady]);

  const allSlots = [...slots, ...treeSlots];
  const earnedCount = allSlots.filter((s) => s.sticker && Object.hasOwn(shown.stickers, s.sticker.id)).length + legacy.length;
  const totalCount = allSlots.length + legacy.length;
  const slotView = (u: Slot) => {
    const sticker = u.sticker;
    if (!sticker) {
      return (
        <span key={u.unitId} className="nn-soon" role="img" aria-label={`Unidade ${u.number}, ${u.title}`} data-soon="true">
          <LockIcon />
        </span>
      );
    }
    const earned = Object.hasOwn(shown.stickers, sticker.id);
    return (
      <button
        key={u.unitId}
        type="button"
        className="nn-sticker"
        aria-disabled={earned ? undefined : "true"}
        onClick={() => {
          if (earned) void narrator.playNarration(sticker.name);
        }}
      >
        <Sticker art={sticker.art} earned={earned} size={72} />
      </button>
    );
  };

  return (
    <div className="nz-screen nn-screen" data-testid="ninho" data-side={side}>
      <StageView scene="island" states={LAUNCH_STATES} threads={threads} farolLevel={level} arvoreLevel={treeLevel} insets={insets} onStage={onStage} onViewport={onViewport} />
      <div className="nn-top">
        <button type="button" className="k-round k-round-glass" aria-label="Voltar para a ilha" onClick={() => router.push("/")}>
          <CloseIcon size={24} />
        </button>
      </div>
      <main ref={sheetRef} className="nn-sheet">
        <h1 className="nn-name">{childName ? `Ninho de ${childName}` : "Ninho"}</h1>
        <section className="nn-part" aria-labelledby="nn-h-stickers">
          <header className="nn-head">
            <h2 id="nn-h-stickers" className="nn-title">Figurinhas</h2>
            <span className="nn-count" aria-hidden="true">{earnedCount}/{totalCount}</span>
          </header>
          <div className="nn-grid">{slots.map(slotView)}</div>
          <section className="nn-special nn-area" aria-labelledby="nn-h-arvore" data-area="letras">
            <h3 id="nn-h-arvore" className="nn-sub">Árvore das Letras</h3>
            <div className="nn-grid">{treeSlots.map(slotView)}</div>
          </section>
          {legacy.length > 0 ? (
            <section className="nn-special" aria-label="Figurinhas especiais">
              <button
                type="button"
                className="nn-special-title"
                onClick={() => {
                  narrator.unlock();
                  void narrator.playNarration(lines.legacySection);
                }}
              >
                Figurinhas especiais
              </button>
              <div className="nn-grid">
                {legacy.map(({ id, image, name }) => (
                  <button
                    key={id}
                    type="button"
                    data-sticker={id}
                    data-earned="true"
                    aria-label={name.map((seg) => seg.text).join(" ")}
                    lang="en"
                    className="nn-sticker nn-legacy"
                    onClick={() => {
                      narrator.unlock();
                      void narrator.playNarration(name);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- a fixed local SVG kept from phase 1 */}
                    <img src={image} alt="" width={64} height={64} />
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </section>

        <section className="nn-part nn-memory" aria-labelledby="nn-h-memory">
          <header className="nn-head">
            <h2 id="nn-h-memory" className="nn-title">Treino de memória</h2>
          </header>
          {due > 0 ? (
            <div className="nn-mem-row" data-state="due">
              <span className="nn-mem-n" aria-hidden="true">{due}</span>
              <span className="nn-mem-txt">{due === 1 ? "cartão pronto hoje" : "cartões prontos hoje"}</span>
              <ChunkyButton label="Treinar" tone="ok" size="md" className="nn-mem-cta" onPress={() => router.push("/memoria")}>
                Treinar
                <PlayIcon size={26} />
              </ChunkyButton>
            </div>
          ) : (
            <div className="nn-mem-row" data-state="done">
              <span className="nn-mem-nino" aria-hidden="true"><Nino pose="happy" size={64} /></span>
              <span className="nn-mem-txt">
                <b>Tudo em dia!</b>
                {daysToNext !== null && daysToNext > 0 ? <small>Próximo treino: {daysToNext === 1 ? "amanhã" : `em ${daysToNext} dias`}</small> : null}
              </span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="3" fill="var(--cocoa-2)" />
      <path d="M8 10V8a4 4 0 018 0v2" stroke="var(--cocoa-2)" strokeWidth="2.4" fill="none" />
    </svg>
  );
}
