"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { TrailMap } from "@/components/trail/TrailMap";
import { useTrailProgress } from "@/components/trail/TrailProgressProvider";
import { getPath, getUnit } from "@/domain/trail/content";
import { emptyProgress } from "@/domain/trail/progress";
import { stopHref } from "@/domain/trail/routes";
import type { Unit } from "@/domain/trail/schema";

const EMPTY = emptyProgress();

export default function MapPage() {
  const router = useRouter();
  const { progress, hydrated } = useTrailProgress();
  // One trail per world: this page shows the first world (the forest).
  const { path, units } = useMemo(() => {
    const all = getPath();
    const world = all[0]?.world;
    const inWorld = all.filter((u) => u.world === world);
    const units: Record<string, Unit> = {};
    for (const u of inWorld) {
      const unit = u.hasContent ? getUnit(u.unitId) : null;
      if (unit) units[u.unitId] = unit;
    }
    return { path: inWorld, units };
  }, []);
  return <TrailMap path={path} units={units} progress={hydrated ? progress : EMPTY} onOpenStop={(id) => router.push(stopHref(id))} />;
}
