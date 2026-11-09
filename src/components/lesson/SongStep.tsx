"use client";

import { useEffect, useRef, useState } from "react";
import { narrator } from "@/audio/narrator";
import { BigButton } from "@/components/BigButton";
import { Mascot } from "@/components/Mascot";
import type { SongStep as SongStepData } from "@/domain/content-schema";
import { ArrowIcon } from "./icons";

type Props = { step: SongStepData; onDone: () => void };

export function SongStep({ step, onDone }: Props) {
  const [played, setPlayed] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    let alive = true;
    void narrator.play(step.audio).then(() => {
      if (alive) setPlayed(true);
    });
    return () => {
      alive = false;
      narrator.stop();
    };
  }, [step.audio]);

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={step.image} alt="" width={320} height={240} draggable={false} className="h-60 w-80 max-w-full rounded-3xl bg-cream object-contain shadow-md" />
      <Mascot mood={played ? "idle" : "talking"} />
      <div className="min-h-16">
        {played && (
          <BigButton
            label="Avançar"
            color="leaf"
            onPress={() => {
              if (doneRef.current) return;
              doneRef.current = true;
              onDone();
            }}
          >
            <ArrowIcon />
          </BigButton>
        )}
      </div>
    </div>
  );
}
