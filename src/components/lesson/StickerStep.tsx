"use client";

import { useEffect, useRef } from "react";
import { narrator } from "@/audio/narrator";
import { Mascot } from "@/components/Mascot";
import type { StickerStep as StickerStepData } from "@/domain/content-schema";

type Props = { step: StickerStepData; onDone: () => void };

export function StickerStep({ step, onDone }: Props) {
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    let alive = true;
    void narrator.play({ text: "You got a sticker!" }).then(() => {
      if (alive) onDoneRef.current();
    });
    return () => {
      alive = false;
      narrator.stop();
    };
  }, []);

  return <StickerView image={step.image} />;
}

export function StickerView({ image }: { image: string }) {
  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" width={224} height={224} draggable={false} className="sticker-pop h-56 w-56 rounded-3xl bg-sun object-contain p-4 shadow-md" />
      <Mascot mood="happy" />
    </div>
  );
}
