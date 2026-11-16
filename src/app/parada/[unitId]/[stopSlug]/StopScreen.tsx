"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { SongStop } from "@/components/trail/SongStop";
import { StoryStop } from "@/components/trail/StoryStop";
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

  const exit = () => router.push(back);
  if (stop.kind === "song") return <SongStop unit={unit} stop={stop} record={!review} onExit={exit} />;
  if (stop.kind === "story") return <StoryStop unit={unit} stop={stop} record={!review} onExit={exit} />;
  return <StopPlayer unit={unit} stop={stop} record={!review} onExit={exit} />;
}
