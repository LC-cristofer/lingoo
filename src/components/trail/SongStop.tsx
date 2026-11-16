"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animal } from "@/art/Animal";
import { Cat } from "@/art/Cat";
import { narrator } from "@/audio/narrator";
import type { ArtId, SongStop as SongStopData, Unit } from "@/domain/trail/schema";
import { PauseIcon, PlayIcon } from "./icons";
import { Bubble } from "./kit/Bubble";
import { ChunkyButton } from "./kit/ChunkyButton";
import { ForestScene } from "./kit/ForestScene";
import { LessonTopBar } from "./kit/LessonTopBar";
import { NarrationText } from "./NarrationText";
import { ExerciseLoop, StopClosing, StopOpening } from "./StopFlow";
import { useTrailProgress } from "./TrailProgressProvider";

type SongStopProps = {
  unit: Unit;
  stop: SongStopData;
  onExit: () => void;
  /** False in review mode: nothing is saved. */
  record?: boolean;
  /** Injectable so tests can fake currentTime, play, pause and the events. */
  createAudio?: (src: string) => HTMLAudioElement;
};

type Step = "opening" | "singing" | "session" | "closing";

const POLL_MS = 100;

/** When a lyric line starts: `introBars` empty bars, then 4 beats per bar. */
export function lineStart(stop: SongStopData, bar: number): number {
  return ((stop.introBars + bar - 1) * 4 * 60) / stop.bpm;
}

function rewind(audio: HTMLAudioElement) {
  audio.currentTime = 0;
}

export function SongStop({ unit, stop, onExit, record = true, createAudio = (src) => new Audio(src) }: SongStopProps) {
  const { finishStop } = useTrailProgress();
  const [step, setStep] = useState<Step>("opening");
  const [current, setCurrent] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const detachRef = useRef<() => void>(() => {});
  const speechToken = useRef(0);
  const currentRef = useRef(-1);
  const speechMode = useRef(false);

  const starts = useMemo(() => stop.lyrics.map((l) => lineStart(stop, l.bar)), [stop]);
  const wordIds = useMemo(() => [...new Set(stop.lyrics.flatMap((l) => (l.wordId ? [l.wordId] : [])))] as ArtId[], [stop]);

  const show = useCallback((i: number) => {
    currentRef.current = i;
    setCurrent(i);
  }, []);

  /** Silences everything: the file, the voice and any running line-by-line fallback. */
  const silence = useCallback(() => {
    speechToken.current += 1;
    detachRef.current();
    detachRef.current = () => {};
    audioRef.current?.pause();
    narrator.stop();
  }, []);

  useEffect(() => silence, [silence]);

  /** The music failed: the gatinho speaks each line in turn, highlighting it, and never gets stuck. */
  const speakLines = useCallback(
    async (from: number) => {
      speechMode.current = true;
      detachRef.current();
      detachRef.current = () => {};
      audioRef.current?.pause();
      const token = ++speechToken.current;
      setEnded(false);
      setPlaying(true);
      for (let i = from; i < stop.lyrics.length; i++) {
        show(i);
        await narrator.playNarration(stop.lyrics[i].say);
        if (token !== speechToken.current) return;
      }
      setPlaying(false);
      setEnded(true);
    },
    [stop.lyrics, show],
  );

  const playAudio = useCallback(
    (audio: HTMLAudioElement) => {
      setPlaying(true);
      try {
        const result = audio.play();
        if (result && typeof result.catch === "function") {
          result.catch(() => {
            if (audioRef.current === audio) void speakLines(Math.max(0, currentRef.current));
          });
        }
      } catch {
        void speakLines(Math.max(0, currentRef.current));
      }
    },
    [speakLines],
  );

  const sync = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let i = -1;
    for (let k = 0; k < starts.length; k++) if (starts[k] <= audio.currentTime) i = k;
    if (i !== currentRef.current) show(i);
  }, [starts, show]);

  const startSong = () => {
    narrator.unlock();
    silence();
    speechMode.current = false;
    setStep("singing");
    setEnded(false);
    show(-1);
    const audio = audioRef.current ?? createAudio(`/audio/song-${unit.id}.mp3`);
    audioRef.current = audio;
    rewind(audio);
    const onEnded = () => {
      detachRef.current();
      detachRef.current = () => {};
      setPlaying(false);
      setEnded(true);
    };
    const onError = () => void speakLines(Math.max(0, currentRef.current));
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    const poll = setInterval(sync, POLL_MS);
    detachRef.current = () => {
      clearInterval(poll);
      audio.removeEventListener("timeupdate", sync);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
    playAudio(audio);
  };

  const togglePlay = () => {
    if (speechMode.current) {
      if (playing) {
        speechToken.current += 1;
        narrator.stop();
        setPlaying(false);
      } else {
        void speakLines(Math.max(0, currentRef.current));
      }
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      playAudio(audio);
    }
  };

  const singAgain = () => {
    if (speechMode.current) {
      void speakLines(0);
      return;
    }
    startSong();
  };

  const exit = () => {
    silence();
    onExit();
  };

  if (step === "opening") {
    return (
      <StopOpening
        title={stop.title}
        opening={stop.opening}
        words={unit.words}
        wordIds={wordIds}
        startLabel="Cantar"
        onStart={startSong}
        onExit={exit}
      />
    );
  }

  if (step === "closing") {
    return <StopClosing closing={stop.closing} words={unit.words} wordIds={wordIds} onContinue={onExit} />;
  }

  if (step === "session") {
    return (
      <ExerciseLoop
        exercises={stop.exercises}
        sessionId={stop.id}
        words={unit.words}
        onExit={exit}
        onFinished={() => {
          setStep("closing");
          if (record) finishStop(stop.id);
        }}
      />
    );
  }

  const line = current >= 0 ? stop.lyrics[current] : null;
  const prev = current > 0 ? current - 1 : -1;
  const nextIdx = current + 1 < stop.lyrics.length ? current + 1 : -1;
  const faded = (i: number, state: "prev" | "next") =>
    i >= 0 ? (
      <p data-line={i} data-state={state} lang="en" className="k-lyric">
        <NarrationText narration={stop.lyrics[i].say} tone="plain" />
      </p>
    ) : (
      <p className="k-lyric" aria-hidden="true">
        &nbsp;
      </p>
    );

  return (
    <div className="k-screen">
      <ForestScene variant="lesson" trees />
      <div className="k-stage k-song">
        <LessonTopBar ratio={0} onExit={exit} title={stop.title} />
        <div className="k-song-card">
          {line?.wordId ? (
            <Animal id={line.wordId} size={220} />
          ) : (
            <span className="k-song-cat">
              <Cat expression={playing ? "talking" : "happy"} size={190} />
            </span>
          )}
          {line?.wordId ? (
            <span className="k-song-mini">
              <Cat expression={playing ? "talking" : "happy"} size={84} />
            </span>
          ) : null}
        </div>
        <div className="k-lyrics">
          {faded(prev, "prev")}
          <div data-line={current >= 0 ? current : undefined} data-state={current >= 0 ? "current" : "idle"} className="k-lyric-now">
            <Bubble tail="down">
              {line ? <NarrationText narration={line.say} /> : <span aria-hidden="true">♪ ♪ ♪</span>}
            </Bubble>
          </div>
          {faded(nextIdx, "next")}
        </div>
        <div className="k-song-controls">
          {ended ? (
            <>
              <ChunkyButton label="Cantar de novo" tone="white" onPress={singAgain}>
                Cantar de novo
              </ChunkyButton>
              <ChunkyButton
                label="Continuar"
                tone="sun"
                size="lg"
                onPress={() => {
                  silence();
                  setStep("session");
                }}
              >
                Continuar
              </ChunkyButton>
            </>
          ) : (
            <ChunkyButton label={playing ? "Pausar" : "Tocar"} tone="sun" size="round" onPress={togglePlay}>
              {playing ? <PauseIcon size={40} /> : <PlayIcon size={40} />}
            </ChunkyButton>
          )}
        </div>
      </div>
    </div>
  );
}
