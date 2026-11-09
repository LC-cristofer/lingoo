"use client";

import { useEffect, useRef, useState } from "react";
import { narrator } from "@/audio/narrator";
import { BigButton } from "@/components/BigButton";
import type { StoryStep as StoryStepData } from "@/domain/content-schema";
import { ArrowIcon, ReplayIcon } from "./icons";

type Props = { step: StoryStepData; onDone: () => void };

export function StoryStep({ step, onDone }: Props) {
  const [page, setPage] = useState(0);
  const [replays, setReplays] = useState(0);
  const [narrated, setNarrated] = useState(false);
  const doneRef = useRef(false);
  const current = step.pages[page];

  useEffect(() => {
    let alive = true;
    void narrator.play(current.narration).then(() => {
      if (alive) setNarrated(true);
    });
    return () => {
      alive = false;
      narrator.stop();
    };
  }, [current, replays]);

  function next() {
    if (page + 1 < step.pages.length) {
      setNarrated(false);
      setPage(page + 1);
    } else if (!doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={current.image} alt="" width={360} height={320} draggable={false} className="h-72 w-full max-w-sm rounded-3xl bg-cream object-contain shadow-md" />
      <div className="flex min-h-16 items-center gap-4">
        <BigButton
          label="Repetir"
          color="sky"
          onPress={() => {
            setNarrated(false);
            setReplays((n) => n + 1);
          }}
        >
          <ReplayIcon />
        </BigButton>
        {narrated && (
          <BigButton label="Avançar" color="leaf" onPress={next}>
            <ArrowIcon />
          </BigButton>
        )}
      </div>
    </div>
  );
}
