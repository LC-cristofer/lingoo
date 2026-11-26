"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Nino } from "@/art/nino/Nino";
import { narrator } from "@/audio/narrator";
import { useBackgroundMusic } from "@/audio/useBackgroundMusic";
import { getLines, getPath, getUnit } from "@/domain/trail/content";
import { daysBetween, dueCards, nextDue, ROUND_LIMIT, unitOfCard, wordOfCard, type CardId } from "@/domain/trail/memory";
import type { ArtId, Narration, Unit } from "@/domain/trail/schema";
import { CloseIcon, PlayIcon } from "../icons";
import { Bubble } from "../kit/Bubble";
import { ChunkyButton } from "../kit/ChunkyButton";
import { Backdrop } from "../kit/Backdrop";
import { NarrationText } from "../NarrationText";
import { useToday } from "../useToday";
import { useTrailProgress } from "../TrailProgressProvider";
import { CardPile } from "./CardPile";
import { MemoryRound } from "./MemoryRound";


type Kind = "loading" | "none" | "due" | "empty-tomorrow" | "empty-later";

/** Every unit with content, by id: the farol's and the tree's branches (a card names its unit). */
function trainingUnits(): Map<string, Unit> {
  const out = new Map<string, Unit>();
  for (const entry of getPath()) {
    const unit = entry.hasContent ? getUnit(entry.unitId) : null;
    if (unit) out.set(unit.id, unit);
  }
  return out;
}

/** The memory training door (reached from the nest): how many cards are ready today and the big Treinar button; "×" goes back to the nest. */
export function MemoryHome() {
  const router = useRouter();
  const lines = useMemo(() => getLines(), []);
  const units = useMemo(() => trainingUnits(), []);
  const { progress, hydrated } = useTrailProgress();
  // One round trains one unit's cards (its check asks among that unit's words); the next unit's wait for the next round.
  const [round, setRound] = useState<{ unit: Unit; ids: CardId[] } | null>(null);

  const today = useToday();
  const ready = hydrated && today !== null;
  const memory = ready ? progress.memory : {};
  const cards = Object.keys(memory).filter((id) => units.has(unitOfCard(id)));
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

  if (round !== null) {
    return <MemoryRound unit={round.unit} cardIds={round.ids} record onDone={() => setRound(null)} onExit={() => setRound(null)} />;
  }
  const startRound = () => {
    const unit = due.length > 0 ? units.get(unitOfCard(due[0])) : undefined;
    if (unit) setRound({ unit, ids: due.filter((id) => unitOfCard(id) === unit.id).slice(0, ROUND_LIMIT) });
  };

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
      <Backdrop variant="sky" />
      <div className="k-mem-exit">
        <button type="button" aria-label="Voltar ao ninho" className="k-round k-round-glass" onClick={() => router.push("/ninho")}>
          <CloseIcon size={24} />
        </button>
      </div>
      <main className={`k-mtab is-${kind}`}>
        <div className="k-mtab-side">
          <h1 className="k-mtab-title">Treino de memória</h1>
          <div className={kind === "due" ? "k-guide-row" : "k-guide-col"}>
            {kind === "due" ? (
              <>
                <span className="k-cat">
                  <Nino pose="point" size={104} speaks />
                </span>
                {bubble}
              </>
            ) : (
              <>
                {bubble}
                <span className="k-cat">
                  <Nino pose="happy" size={170} speaks />
                </span>
              </>
            )}
          </div>
          {kind === "due" ? (
            <ChunkyButton label="Treinar" tone="ok" size="lg" className="k-mtab-cta" onPress={startRound}>
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
    </div>
  );
}
