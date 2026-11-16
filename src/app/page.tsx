"use client";

import { useRouter } from "next/navigation";
import { Animal } from "@/art/Animal";
import { Cat } from "@/art/Cat";
import { narrator } from "@/audio/narrator";
import { ChunkyButton } from "@/components/trail/kit/ChunkyButton";
import { ForestScene } from "@/components/trail/kit/ForestScene";
import { Scatter, type ScatterItem } from "@/components/trail/kit/Scatter";
import { getLines } from "@/domain/trail/content";

const TREES: ScatterItem[] = [
  { kind: "pine", x: 8, y: "43%", s: 0.8 },
  { kind: "pine", x: 20, y: "45%", s: 0.56 },
  { kind: "round", x: 90, y: "42%", s: 0.7 },
  { kind: "pine", x: 90, y: "73%", s: 1.1 },
  { kind: "round", x: 9, y: "76%", s: 0.9 },
  { kind: "flower", x: 26, y: "82%", color: "#FF8FA3" },
  { kind: "mush", x: 75, y: "85%" },
  { kind: "flower", x: 82, y: "95%", color: "#fff" },
];

const TABLET_TREES: ScatterItem[] = [
  { kind: "round", x: 55, y: "42%", s: 0.6 },
  { kind: "round", x: 93, y: "44%", s: 0.8 },
  { kind: "pine", x: 98, y: "48%", s: 0.6 },
  { kind: "pine", x: 7, y: "96%", s: 1.3 },
  { kind: "round", x: 96, y: "95%", s: 1.1 },
  { kind: "flower", x: 29, y: "91%", color: "#FF8FA3" },
  { kind: "mush", x: 62, y: "94%" },
  { kind: "flower", x: 80, y: "79%", color: "#fff" },
];

export default function Home() {
  const router = useRouter();
  const start = () => {
    narrator.unlock();
    void narrator.playNarration(getLines().start);
    router.push("/mapa");
  };
  return (
    <div className="k-screen">
      <ForestScene variant="start" />
      <Scatter items={TREES} className="k-only-phone" />
      <Scatter items={TABLET_TREES} className="k-only-tablet" />
      <main className="k-start">
        <div className="k-start-text">
          <h1 className="k-logo">Lingoo</h1>
          <p className="k-tagline">Inglês para brincar</p>
        </div>
        <div className="k-start-cast" aria-hidden="true">
          <span className="k-cast-l">
            <Animal id="bear" size={96} />
          </span>
          <Cat expression="happy" size={230} />
          <span className="k-cast-r">
            <Animal id="bird" size={84} />
          </span>
        </div>
        <div className="k-start-cta">
          <ChunkyButton label="Começar" tone="sun" size="lg" onPress={start}>
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
