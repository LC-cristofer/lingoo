"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef } from "react";
import { useOptionalProfile } from "@/components/nestoy/ProfileProvider";
import { stopExitHref, stopHomeHref } from "@/components/trail/exit-target";
import { InteriorContext, LandingContext } from "@/components/trail/kit/Backdrop";
import { SongStop } from "@/components/trail/SongStop";
import { StopPlayer, type StopExit } from "@/components/trail/StopPlayer";
import { StoryStop } from "@/components/trail/StoryStop";
import { useTrailProgress } from "@/components/trail/TrailProgressProvider";
import { unitOpen, type Branch } from "@/domain/letras/access";
import { defaultProfile } from "@/domain/nestoy/profile";
import { getStop } from "@/domain/trail/content";
import { stopStatus } from "@/domain/trail/progress";

/** The route keeps its screens alive (Activity): a fresh push into a stop must start it over, back/forward keeps its state. */
export function StopScreen({ stopId }: { stopId: string }) {
  const { bfcacheId } = useRouter();
  return (
    <Fragment key={bfcacheId}>
      <StopScreenBody stopId={stopId} />
    </Fragment>
  );
}

function StopScreenBody({ stopId }: { stopId: string }) {
  const router = useRouter();
  const review = useSearchParams().get("revisao") === "1";
  const { progress, hydrated, markToday } = useTrailProgress();
  const found = useMemo(() => getStop(stopId), [stopId]);
  const profileCtx = useOptionalProfile();
  // The Árvore das Letras' branches have their own rule (`unitOpen`); inside a branch the stops stay in sequence.
  const letras = /^letras-([1-4])$/.exec(found?.unit.id ?? "");
  const branch = letras ? (Number(letras[1]) as Branch) : null;
  const profileReady = branch === null || (profileCtx?.hydrated ?? true);
  const closed = found !== null && branch !== null && !unitOpen(progress, profileCtx?.profile ?? defaultProfile(), branch);
  const locked = found !== null && (closed || stopStatus(found.unit, progress, stopId) === "locked");
  const allowed = found !== null && (review || !locked);
  const home = stopHomeHref(stopId);
  const marked = useRef(false);
  // Whether the stop was already finished when the child came in: replaying it must not replay the reward.
  const wasDone = useRef<boolean | null>(null);
  useEffect(() => {
    if (hydrated && wasDone.current === null) wasDone.current = Object.hasOwn(progress.completedStops, stopId);
  }, [hydrated, progress, stopId]);

  useEffect(() => {
    if (hydrated && profileReady && !allowed) router.replace(home);
  }, [hydrated, profileReady, allowed, router, home]);

  useEffect(() => {
    if (hydrated && allowed && !review && !marked.current) {
      marked.current = true;
      markToday();
    }
  }, [hydrated, allowed, review, markToday]);

  if (!hydrated || !profileReady || !found || !allowed) return null;
  const { unit, stop } = found;

  // Quit goes back up the staircase; finishing goes to the start page, which will show the reward (?volta).
  const exit = (reason: StopExit) => {
    router.push(stopExitHref(stopId, reason, wasDone.current === true, review));
  };
  // The interior behind the screen (the farol's, or the tree's for a letras unit) is centred on this stop's landing.
  const inUnit = Math.max(0, unit.stops.findIndex((s) => s.id === stop.id));
  const landing = branch === null ? inUnit : (branch - 1) * 6 + inUnit;
  return (
    <InteriorContext.Provider value={branch === null ? "farol" : "arvore"}>
      <LandingContext.Provider value={landing}>
        {stop.kind === "song" ? (
          <SongStop unit={unit} stop={stop} record={!review} onExit={exit} />
        ) : stop.kind === "story" ? (
          <StoryStop unit={unit} stop={stop} record={!review} onExit={exit} />
        ) : (
          <StopPlayer unit={unit} stop={stop} record={!review} onExit={exit} />
        )}
      </LandingContext.Provider>
    </InteriorContext.Provider>
  );
}
