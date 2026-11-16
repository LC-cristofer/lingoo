"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { TrailMap } from "@/components/trail/TrailMap";
import { useTrailProgress } from "@/components/trail/TrailProgressProvider";
import { getPath, getUnit } from "@/domain/trail/content";
import { stopHref } from "@/domain/trail/routes";
import type { Unit } from "@/domain/trail/schema";

export default function MapPage() {
  const router = useRouter();
  const { progress, hydrated } = useTrailProgress();
  const path = useMemo(() => getPath(), []);
  const units = useMemo(() => {
    const out: Record<string, Unit> = {};
    for (const u of path) {
      if (!u.hasContent) continue;
      const unit = getUnit(u.unitId);
      if (unit) out[u.unitId] = unit;
    }
    return out;
  }, [path]);

  // Draw the map once saved progress is known, so the stops never flash locked first.
  if (!hydrated) return <main className="k-screen" aria-busy="true" />;
  return (
    <main>
      <TrailMap path={path} units={units} progress={progress} onOpenStop={(id) => router.push(stopHref(id))} />
    </main>
  );
}
