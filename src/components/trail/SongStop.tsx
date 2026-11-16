"use client";

import { useEffect, useMemo, useState } from "react";
import { Animal } from "@/art/Animal";
import { Cat } from "@/art/Cat";
import { narrator } from "@/audio/narrator";
import { getLines, stopWordIds } from "@/domain/trail/content";
import type { SongStop as SongStopData, Unit } from "@/domain/trail/schema";
import { currentLyricIndex } from "@/domain/trail/song";
import { ChunkyButton } from "./kit/ChunkyButton";
import { ForestScene } from "./kit/ForestScene";
import { LessonTopBar } from "./kit/LessonTopBar";
import { NarrationText } from "./NarrationText";
import { ExerciseLoop } from "./stop/ExerciseLoop";
import { StopClosing } from "./stop/StopClosing";
import { StopOpening } from "./stop/StopOpening";
import { useTrack } from "./useTrack";
import { useTrailProgress } from "./TrailProgressProvider";

type SongStopProps = {
  unit: Unit;
  stop: SongStopData;
  onExit: () => void;
  /** False in review mode: nothing is saved. */
  record?: boolean;
  /** Injectable for tests; the browser's Audio by default. */
  createAudio?: (src: string) => HTMLAudioElement;
};

type Step = "opening" | "karaoke" | "session" | "closing";

/** 🎵 The unit's chant as karaoke (line by line, with each animal), then its exercises and the star. */
export function SongStop({ unit, stop, onExit, record = true, createAudio }: SongStopProps) {
  const lines = useMemo(() => getLines(), []);
  const wordIds = useMemo(() => stopWordIds(stop), [stop]);
  const { finishStop } = useTrailProgress();
  const [step, setStep] = useState<Step>("opening");
  const track = useTrack(`/audio/song-${unit.id}.mp3`, createAudio);
  // Fallback when the file cannot play: the line being narrated, and whether all were said.
  const [spokenIndex, setSpokenIndex] = useState(-1);
  const [fallbackRun, setFallbackRun] = useState(0);
  const [fallbackDone, setFallbackDone] = useState(false);

  // Leaving the player (any way) silences the narrator; useTrack releases the music.
  useEffect(() => () => narrator.stop(), []);

  // The music failed (404, decode error, refused, stalled): the gatinho says each line instead.
  const failed = track.state === "failed";
  useEffect(() => {
    if (step !== "karaoke" || !failed) return;
    let alive = true;
    void (async () => {
      for (let i = 0; i < stop.lyrics.length; i++) {
        if (!alive) return;
        setSpokenIndex(i);
        await narrator.playNarration(stop.lyrics[i].say);
      }
      if (alive) setFallbackDone(true);
    })();
    return () => {
      alive = false;
    };
  }, [step, failed, fallbackRun, stop.lyrics]);

  const exit = () => {
    track.pause();
    narrator.stop();
    onExit();
  };

  const start = () => {
    narrator.stop();
    setStep("karaoke");
    void track.play(); // inside the tap: autoplay rules allow it
  };

  const singAgain = () => {
    if (failed) {
      setFallbackDone(false);
      setFallbackRun((n) => n + 1);
    } else {
      track.restart();
    }
  };

  const finished = () => {
    setStep("closing");
    if (record) finishStop(stop.id);
  };

  if (step === "opening") {
    return (
      <StopOpening title={stop.title} opening={stop.opening} words={unit.words} wordIds={wordIds} onStart={start} onExit={exit} />
    );
  }

  if (step === "session") {
    return (
      <ExerciseLoop exercises={stop.exercises} loopId={stop.id} words={unit.words} lines={lines} onExit={exit} onFinished={finished} />
    );
  }

  if (step === "closing") {
    return (
      <StopClosing closing={stop.closing} words={unit.words} wordIds={wordIds} lines={lines} ctaLabel="Voltar ao mapa" onCta={onExit} />
    );
  }

  const index = failed ? spokenIndex : currentLyricIndex(stop, track.time);
  const current = index >= 0 ? stop.lyrics[index] : undefined;
  const done = failed ? fallbackDone : track.state === "ended";
  const ratio = done ? 1 : (index + 1) / stop.lyrics.length;

  return (
    <div className="k-screen">
      <ForestScene variant="lesson" trees />
      <div className="k-stage">
        <LessonTopBar ratio={ratio} onExit={exit} />
        <div className="k-sing">
          <div className="k-slot k-slot-art k-sing-art">
            {current?.wordId ? <Animal id={current.wordId} size={200} /> : <Cat expression="talking" size={170} />}
          </div>
          <ol className="k-lyrics">
            {stop.lyrics.map((l, i) => (
              <li
                key={l.bar}
                data-line={i}
                data-current={i === index ? "true" : undefined}
                className={i === index ? "is-current" : i === index + 1 ? "is-next" : ""}
              >
                <NarrationText narration={l.say} />
              </li>
            ))}
          </ol>
        </div>
        <div className="k-cta k-sing-actions">
          {done ? (
            <>
              <ChunkyButton label="Cantar de novo" tone="sky" onPress={singAgain}>
                Cantar de novo
              </ChunkyButton>
              <ChunkyButton label="Continuar" tone="sun" size="lg" onPress={() => setStep("session")}>
                Continuar
              </ChunkyButton>
            </>
          ) : track.state === "playing" ? (
            <ChunkyButton label="Pausar" tone="white" onPress={track.pause}>
              Pausar
            </ChunkyButton>
          ) : track.state === "paused" ? (
            <ChunkyButton label="Tocar" tone="white" onPress={() => void track.play()}>
              Tocar
            </ChunkyButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
