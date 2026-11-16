"use client";

import { useEffect, useMemo, useState } from "react";
import { StoryScene } from "@/art/scenes/StoryScene";
import { narrator } from "@/audio/narrator";
import { getLines, stopWordIds } from "@/domain/trail/content";
import type { ArtId, StoryStop as StoryStopData, Unit } from "@/domain/trail/schema";
import { sayFor } from "./exercises/shared";
import { Bubble } from "./kit/Bubble";
import { ChunkyButton } from "./kit/ChunkyButton";
import { ForestScene } from "./kit/ForestScene";
import { LessonTopBar } from "./kit/LessonTopBar";
import { NarrationText } from "./NarrationText";
import { ExerciseLoop } from "./stop/ExerciseLoop";
import { StopClosing } from "./stop/StopClosing";
import { StopOpening } from "./stop/StopOpening";
import { useTrailProgress } from "./TrailProgressProvider";

type StoryStopProps = {
  unit: Unit;
  stop: StoryStopData;
  onExit: () => void;
  /** False in review mode: nothing is saved. */
  record?: boolean;
};

type Step = "opening" | "warmup" | "pages" | "question" | "closing";

/** 📖 Warm-up game, the narrated pages with tappable animals, one question, then the star. */
export function StoryStop({ unit, stop, onExit, record = true }: StoryStopProps) {
  const lines = useMemo(() => getLines(), []);
  const wordIds = useMemo(() => stopWordIds(stop), [stop]);
  const { finishStop } = useTrailProgress();
  const [step, setStep] = useState<Step>("opening");
  const [pageIndex, setPageIndex] = useState(0);
  // The page index whose narration has finished: "Avançar" waits for it.
  const [toldPage, setToldPage] = useState(-1);

  // Leaving the player (any way) silences the narrator.
  useEffect(() => () => narrator.stop(), []);

  const page = stop.pages[pageIndex];

  // Each page is told on entry.
  useEffect(() => {
    if (step !== "pages") return;
    let alive = true;
    void narrator.playNarration(stop.pages[pageIndex].say).then(() => {
      if (alive) setToldPage(pageIndex);
    });
    return () => {
      alive = false;
    };
  }, [step, pageIndex, stop.pages]);

  const exit = () => {
    narrator.stop();
    onExit();
  };

  const advance = () => {
    // Guarded on the page this button belongs to, so a double tap turns one page only.
    const from = pageIndex;
    if (from === stop.pages.length - 1) {
      setStep((s) => (s === "pages" ? "question" : s));
      return;
    }
    setPageIndex((p) => (p === from ? p + 1 : p));
  };

  const repeat = () => {
    void narrator.playNarration(page.say);
  };

  const hotspot = (id: ArtId) => {
    narrator.playSfx("tap");
    void narrator.playNarration(sayFor(unit.words, id));
  };

  const finished = () => {
    setStep("closing");
    if (record) finishStop(stop.id);
  };

  if (step === "opening") {
    return (
      <StopOpening
        title={stop.title}
        opening={stop.opening}
        words={unit.words}
        wordIds={wordIds}
        onStart={() => setStep("warmup")}
        onExit={exit}
      />
    );
  }

  if (step === "warmup") {
    return (
      <ExerciseLoop
        exercises={[stop.warmup]}
        loopId={`${stop.id}:warmup`}
        words={unit.words}
        lines={lines}
        onExit={exit}
        onFinished={() => setStep("pages")}
      />
    );
  }

  if (step === "question") {
    return (
      <ExerciseLoop
        exercises={[stop.question]}
        loopId={`${stop.id}:question`}
        words={unit.words}
        lines={lines}
        onExit={exit}
        onFinished={finished}
      />
    );
  }

  if (step === "closing") {
    return (
      <StopClosing closing={stop.closing} words={unit.words} wordIds={wordIds} lines={lines} ctaLabel="Voltar ao mapa" onCta={onExit} />
    );
  }

  const told = toldPage === pageIndex;
  return (
    <div className="k-screen">
      <ForestScene variant="lesson" />
      <div className="k-stage">
        <LessonTopBar ratio={(pageIndex + 1) / stop.pages.length} onExit={exit} />
        <div className="k-story">
          <div className="k-story-scene">
            <StoryScene scene={page.scene} hotspots={page.hotspots} onHotspot={hotspot} />
          </div>
          <Bubble>
            <NarrationText narration={page.say} />
          </Bubble>
        </div>
        <div className="k-cta k-story-actions">
          <ChunkyButton label="Repetir" tone="white" onPress={repeat}>
            Repetir
          </ChunkyButton>
          {told ? (
            <ChunkyButton label="Avançar" tone="sun" size="lg" onPress={advance}>
              Avançar
            </ChunkyButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
