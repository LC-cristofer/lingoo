"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { BigButton } from "@/components/BigButton";
import { StopPlayer } from "@/components/trail/StopPlayer";
import { useTrailProgress } from "@/components/trail/TrailProgressProvider";
import { getStop } from "@/domain/trail/content";
import { stopStatus } from "@/domain/trail/progress";

export function StopScreen({ stopId }: { stopId: string }) {
  const router = useRouter();
  const review = useSearchParams().get("revisao") === "1";
  const { progress, hydrated, markToday } = useTrailProgress();
  const found = useMemo(() => getStop(stopId), [stopId]);
  const locked = found !== null && stopStatus(found.unit, progress, stopId) === "locked";
  const allowed = found !== null && (review || !locked);
  const back = review ? "/revisao" : "/mapa";
  const marked = useRef(false);

  useEffect(() => {
    if (hydrated && !allowed) router.replace("/mapa");
  }, [hydrated, allowed, router]);

  useEffect(() => {
    if (hydrated && allowed && !review && !marked.current) {
      marked.current = true;
      markToday();
    }
  }, [hydrated, allowed, review, markToday]);

  if (!hydrated || !found || !allowed) return null;
  const { unit, stop } = found;

  if (stop.kind === "song" || stop.kind === "story") {
    // Task 12 replaces this placeholder with the song and story players.
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-cream p-4 text-ink">
        <p className="font-display text-3xl font-bold">Em construção</p>
        <BigButton label="Voltar" color="leaf" onPress={() => router.push(back)}>
          <span aria-hidden="true" className="font-display text-2xl font-bold">
            Voltar
          </span>
        </BigButton>
      </main>
    );
  }
  return <StopPlayer unit={unit} stop={stop} record={!review} onExit={() => router.push(back)} />;
}
