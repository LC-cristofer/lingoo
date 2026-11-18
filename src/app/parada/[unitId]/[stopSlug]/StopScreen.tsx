"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { SongStop } from "@/components/trail/SongStop";
import { StopPlayer, type StopExit } from "@/components/trail/StopPlayer";
import { StoryStop } from "@/components/trail/StoryStop";
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
  const marked = useRef(false);

  useEffect(() => {
    if (hydrated && !allowed) router.replace("/farol");
  }, [hydrated, allowed, router]);

  useEffect(() => {
    if (hydrated && allowed && !review && !marked.current) {
      marked.current = true;
      markToday();
    }
  }, [hydrated, allowed, review, markToday]);

  if (!hydrated || !found || !allowed) return null;
  const { unit, stop } = found;

  // Quit goes back up the staircase; finishing goes to the start page, which will show the reward (?volta).
  const exit = (reason: StopExit) => {
    if (review) router.push("/revisao");
    else router.push(reason === "done" ? `/?volta=${encodeURIComponent(stopId)}` : "/farol");
  };
  if (stop.kind === "song") return <SongStop unit={unit} stop={stop} record={!review} onExit={exit} />;
  if (stop.kind === "story") return <StoryStop unit={unit} stop={stop} record={!review} onExit={exit} />;
  return <StopPlayer unit={unit} stop={stop} record={!review} onExit={exit} />;
}
