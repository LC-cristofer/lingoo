"use client";

import { useEffect, useMemo, useState } from "react";
import { Cat } from "@/art/Cat";
import { narrator } from "@/audio/narrator";
import { useBackgroundMusic } from "@/audio/useBackgroundMusic";
import { getLines, getPath, getUnit } from "@/domain/trail/content";
import { daysBetween, dueCards, nextDue, ROUND_LIMIT, unitOfCard, wordOfCard, type CardId } from "@/domain/trail/memory";
import type { ArtId, Narration, Unit } from "@/domain/trail/schema";
import { DaysCalendar } from "../DaysCalendar";
import { PlayIcon } from "../icons";
import { BottomNav } from "../kit/BottomNav";
import { Bubble } from "../kit/Bubble";
import { ChunkyButton } from "../kit/ChunkyButton";
import { ForestScene } from "../kit/ForestScene";
import { MusicToggle } from "../kit/MusicToggle";
import { Scatter, type ScatterItem } from "../kit/Scatter";
import { NarrationText } from "../NarrationText";
import { useToday } from "../useToday";
import { useTrailProgress } from "../TrailProgressProvider";
import { CardPile } from "./CardPile";
import { MemoryRound } from "./MemoryRound";

const PHONE_DECOR: ScatterItem[] = [
  { kind: "pine", x: 7, y: 360, s: 0.7 },
  { kind: "round", x: 92, y: 350, s: 0.6 },
  { kind: "pine", x: 90, y: 640, s: 1 },
  { kind: "round", x: 8, y: 660, s: 0.85 },
  { kind: "flower", x: 23, y: 720, color: "#FF8FA3" },
  { kind: "mush", x: 77, y: 730 },
];
const TABLET_DECOR: ScatterItem[] = [
  { kind: "pine", x: 6, y: 340, s: 0.8 },
  { kind: "round", x: 93, y: 340, s: 0.8 },
  { kind: "pine", x: 7, y: 740, s: 1.3 },
  { kind: "round", x: 96, y: 730, s: 1.1 },
  { kind: "flower", x: 29, y: 700, color: "#FF8FA3" },
  { kind: "mush", x: 72, y: 720 },
];

type Kind = "loading" | "none" | "due" | "empty-tomorrow" | "empty-later";

/** The first unit that has content: the one the cards belong to (one unit exists for now). */
function trainingUnit(): Unit | null {
  const entry = getPath().find((u) => u.hasContent);
  return entry ? getUnit(entry.unitId) : null;
}

/** The Memória tab: how many cards are ready today and the big Treinar button. */
export function MemoryHome() {
  const lines = useMemo(() => getLines(), []);
  const unit = useMemo(() => trainingUnit(), []);
  const { progress, hydrated } = useTrailProgress();
  const [round, setRound] = useState<CardId[] | null>(null);

  const today = useToday();
  const ready = hydrated && today !== null;
  const memory = ready ? progress.memory : {};
  const cards = Object.keys(memory).filter((id) => !unit || unitOfCard(id) === unit.id);
  const due = ready ? dueCards(memory, today).filter((id) => cards.includes(id)) : [];
  const next = ready ? nextDue(memory, today) : null;
  const daysToNext = next && today ? daysBetween(today, next) : null;

  let kind: Kind = "loading";
  if (ready) {
    if (cards.length === 0) kind = "none";
    else if (due.length > 0) kind = "due";
    else kind = daysToNext === 1 ? "empty-tomorrow" : "empty-later";
  }
  const line: Narration | null =
    kind === "due"
      ? lines.memoryHome
      : kind === "none"
        ? lines.memoryNone
        : kind === "empty-tomorrow"
          ? lines.memoryEmpty
          : kind === "empty-later"
            ? lines.memoryEmptyLater
            : null;

  // Say the line once per state, only when the page is showing (a running round has its own voice).
  const speaking = round === null ? kind : "loading";
  useEffect(() => {
    if (speaking === "loading") return;
    const l =
      speaking === "due" ? lines.memoryHome : speaking === "none" ? lines.memoryNone : speaking === "empty-tomorrow" ? lines.memoryEmpty : lines.memoryEmptyLater;
    void narrator.playNarration(l);
  }, [speaking, lines]);

  useEffect(() => () => narrator.stop(), []);

  // The round is an exercise (the child must hear the English words): music only on the home.
  useBackgroundMusic(round === null ? "album" : null);

  if (round !== null && unit) {
    return <MemoryRound unit={unit} cardIds={round} record onDone={() => setRound(null)} onExit={() => setRound(null)} />;
  }

  const pictureIds = (kind === "due" ? due : cards).map((id) => wordOfCard(id) as ArtId);
  const faded = kind !== "due";
  const nextLabel = daysToNext === 1 ? "amanhã" : `em ${daysToNext} dias`;
  const replay = () => line && void narrator.playNarration(line);
  const bubble = line ? (
    <Bubble tail={kind === "due" ? "left" : "down"} onReplay={kind === "due" ? replay : undefined}>
      <NarrationText narration={line} />
    </Bubble>
  ) : null;

  return (
    <div className="k-screen">
      <ForestScene variant="start" />
      <Scatter items={PHONE_DECOR} className="k-only-phone" />
      <Scatter items={TABLET_DECOR} className="k-only-tablet" />
      <div className="k-fixed-chips">
        <DaysCalendar progress={hydrated ? progress : { ...progress, completedStops: {}, daysPlayed: [] }} />
        <MusicToggle />
      </div>
      <main className={`k-mtab is-${kind}`}>
        <div className="k-mtab-side">
          <h1 className="k-mtab-title">Treino de memória</h1>
          <div className={kind === "due" ? "k-guide-row" : "k-guide-col"}>
            {kind === "due" ? (
              <>
                <span className="k-cat">
                  <Cat expression="pointing" size={104} />
                </span>
                {bubble}
              </>
            ) : (
              <>
                {bubble}
                <span className="k-cat">
                  <Cat expression="happy" size={170} />
                </span>
              </>
            )}
          </div>
          {kind === "due" ? (
            <ChunkyButton label="Treinar" tone="sun" size="lg" className="k-mtab-cta" onPress={() => setRound(due.slice(0, ROUND_LIMIT))}>
              Treinar
              <PlayIcon size={28} />
            </ChunkyButton>
          ) : null}
        </div>
        <div className="k-mtab-side is-pile">
          {kind !== "none" && kind !== "loading" ? <CardPile ids={pictureIds} faded={faded} /> : null}
          {kind === "due" ? (
            <p className="k-mem-count">
              <b className="k-mem-count-n">{due.length}</b> {due.length === 1 ? "cartão pronto hoje" : "cartões prontos hoje"}
            </p>
          ) : null}
          {kind === "empty-tomorrow" || kind === "empty-later" ? <span className="k-soon">Próximo treino: {nextLabel}</span> : null}
        </div>
      </main>
      <BottomNav active="memoria" memoryDue={due.length} />
    </div>
  );
}
