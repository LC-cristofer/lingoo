"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef } from "react";
import { Animal } from "@/art/Animal";
import { Cat } from "@/art/Cat";
import { narrator } from "@/audio/narrator";
import { PlayIcon } from "@/components/trail/icons";
import { ChunkyButton } from "@/components/trail/kit/ChunkyButton";
import { ForestScene } from "@/components/trail/kit/ForestScene";
import { Decorations } from "@/components/trail/Decorations";
import { useMapForm } from "@/components/trail/useMapForm";
import { getLines } from "@/domain/trail/content";
import { SCREEN_SIZE, START_DECORATIONS } from "@/domain/trail/trail-layout";

export default function Home() {
  const router = useRouter();
  const lines = useMemo(() => getLines(), []);
  const going = useRef(false);
  const form = useMapForm();
  const tablet = form === "tablet";

  const play = () => {
    if (going.current) return;
    going.current = true;
    narrator.unlock();
    void narrator.playNarration(lines.start);
    router.push("/mapa");
  };

  return (
    <main className="k-screen">
      <ForestScene variant="start" />
      <div className="k-decos" aria-hidden="true">
        <Decorations items={START_DECORATIONS[form]} width={SCREEN_SIZE[form].w} height={SCREEN_SIZE[form].h} />
      </div>
      <div className="k-start">
        <div className="k-start-text">
          <h1 className="k-logo">Lingoo</h1>
          <p className="k-tagline">Inglês para brincar</p>
          <ChunkyButton label="Jogar" tone="sun" size="lg" className="k-start-play" onPress={play}>
            Jogar
            <PlayIcon size={28} />
          </ChunkyButton>
        </div>
        <div className="k-start-cast" aria-hidden="true">
          <span className="k-cast-l">
            <Animal id="bear" size={tablet ? 130 : 96} />
          </span>
          <Cat expression="happy" size={tablet ? 300 : 230} />
          <span className="k-cast-r">
            <Animal id="bird" size={tablet ? 110 : 84} />
          </span>
        </div>
      </div>
    </main>
  );
}
