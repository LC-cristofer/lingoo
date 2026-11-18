"use client";

import { useRouter } from "next/navigation";
import { Animal } from "@/art/Animal";
import { Wordmark } from "@/art/brand/Wordmark";
import { Nino } from "@/art/nino/Nino";
import { narrator } from "@/audio/narrator";
import { ChunkyButton } from "@/components/trail/kit/ChunkyButton";
import { Backdrop } from "@/components/trail/kit/Backdrop";
import { getLines } from "@/domain/trail/content";

export default function Home() {
  const router = useRouter();
  const start = () => {
    narrator.unlock();
    void narrator.playNarration(getLines().start);
    router.push("/mapa");
  };
  return (
    <div className="k-screen">
      <Backdrop variant="sky" />
      <main className="k-start">
        <div className="k-start-text">
          <h1 className="k-logo">
            <Wordmark className="k-wordmark" />
          </h1>
          <p className="k-tagline">Um ninho de descobertas</p>
        </div>
        <div className="k-start-cast" aria-hidden="true">
          <span className="k-cast-l">
            <Animal id="bear" size={96} />
          </span>
          <Nino pose="wave" size={230} />
          <span className="k-cast-r">
            <Animal id="bird" size={84} />
          </span>
        </div>
        <div className="k-start-cta">
          <ChunkyButton label="Jogar" tone="ok" size="lg" onPress={start}>
            Jogar
            <PlayArrow />
          </ChunkyButton>
        </div>
      </main>
    </div>
  );
}

function PlayArrow() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path d="M7 4 L20 12 L7 20Z" fill="currentColor" />
    </svg>
  );
}
