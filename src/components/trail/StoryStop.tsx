"use client";

import { useEffect, useMemo, useState } from "react";
import { StoryScene } from "@/art/scenes/StoryScene";
import { narrator } from "@/audio/narrator";
import type { ArtId, StoryStop as StoryStopData, Unit } from "@/domain/trail/schema";
import { ArrowIcon, ReplayIcon } from "./icons";
import { Bubble } from "./kit/Bubble";
import { ChunkyButton } from "./kit/ChunkyButton";
import { ForestScene } from "./kit/ForestScene";
import { LessonTopBar } from "./kit/LessonTopBar";
import { NarrationText } from "./NarrationText";
import { ExerciseLoop, StopClosing, StopOpening } from "./StopFlow";
import { useTrailProgress } from "./TrailProgressProvider";

type StoryStopProps = {
  unit: Unit;
  stop: StoryStopData;
  onExit: () => void;
  /** False in review mode: nothing is saved. */
  record?: boolean;
};

type Step = "opening" | "warmup" | "pages" | "question" | "closing";

export function StoryStop({ unit, stop, onExit, record = true }: StoryStopProps) {
  const { finishStop } = useTrailProgress();
  const [step, setStep] = useState<Step>("opening");
  const [page, setPage] = useState(0);
  const [replays, setReplays] = useState(0);
  // The reading of this page (page:replay) that has ended; the buttons show when it is the current one.
  const [readKey, setReadKey] = useState("");
  const ready = readKey === `${page}:${replays}`;

  const wordIds = useMemo(
    () => [...new Set(stop.pages.flatMap((p) => p.hotspots.map((h) => h.wordId)))] as ArtId[],
    [stop.pages],
  );

  // Leaving (any way) silences the narrator.
  useEffect(() => () => narrator.stop(), []);

  // Each page is read to the child; the buttons wait until the reading is over.
  useEffect(() => {
    if (step !== "pages") return;
    let alive = true;
    void narrator.playNarration(stop.pages[page].say).then(() => {
      if (alive) setReadKey(`${page}:${replays}`);
    });
    return () => {
      alive = false;
    };
  }, [step, page, replays, stop.pages]);

  const exit = () => {
    narrator.stop();
    onExit();
  };

  if (step === "opening") {
    return (
      <StopOpening
        title={stop.title}
        opening={stop.opening}
        words={unit.words}
        wordIds={wordIds}
        onStart={() => {
          narrator.unlock();
          setStep("warmup");
        }}
        onExit={exit}
      />
    );
  }

  if (step === "warmup") {
    return (
      <ExerciseLoop
        key="warmup"
        exercises={[stop.warmup]}
        sessionId={`${stop.id}/warmup`}
        words={unit.words}
        onExit={exit}
        onFinished={() => {
          setPage(0);
          setStep("pages");
        }}
      />
    );
  }

  if (step === "question") {
    return (
      <ExerciseLoop
        key="question"
        exercises={[stop.question]}
        sessionId={`${stop.id}/question`}
        words={unit.words}
        onExit={exit}
        onFinished={() => {
          setStep("closing");
          if (record) finishStop(stop.id);
        }}
      />
    );
  }

  if (step === "closing") {
    return <StopClosing closing={stop.closing} words={unit.words} wordIds={wordIds} onContinue={onExit} />;
  }

  const current = stop.pages[page];
  const last = page === stop.pages.length - 1;
  const sayWord = (id: ArtId) => {
    narrator.playSfx("tap");
    const word = unit.words.find((w) => w.id === id);
    void narrator.playNarration(word?.say ?? [{ lang: "en-US", text: id }]);
  };
  const advance = () => {
    if (last) setStep("question");
    else setPage(page + 1);
  };

  return (
    <div className="k-screen">
      <ForestScene variant="lesson" />
      <div className="k-stage k-story">
        <LessonTopBar ratio={page / stop.pages.length} onExit={exit} title={stop.title} />
        <div className="k-book">
          <div className="k-book-frame">
            <StoryScene key={page} scene={current.scene} hotspots={current.hotspots} onHotspot={sayWord} />
          </div>
          <div className="k-dots" aria-hidden="true">
            {stop.pages.map((_, i) => (
              <i key={i} className={i === page ? "is-on" : i < page ? "is-done" : ""} />
            ))}
          </div>
        </div>
        <Bubble tail="left" className="k-flat" onReplay={() => void narrator.playNarration(current.say)}>
          <NarrationText narration={current.say} />
        </Bubble>
        <div className="k-story-controls">
          {ready ? (
            <>
              <ChunkyButton label="Repetir" tone="white" size="round" onPress={() => setReplays((n) => n + 1)}>
                <ReplayIcon size={38} />
              </ChunkyButton>
              <ChunkyButton label="Avançar" tone="sun" size="lg" onPress={advance}>
                <ArrowIcon size={34} />
              </ChunkyButton>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
