"use client";

import { useEffect, useRef, useState } from "react";
import type { World } from "@/domain/content-schema";
import { placeStatus, type Progress } from "@/domain/progress";
import { Mascot } from "@/components/Mascot";
import { LockIcon, StarIcon } from "@/components/lesson/icons";

type WorldMapProps = { world: World; progress: Progress; onOpen: (lessonId: string) => void };

// Winding path: [x%, y%] of the map box, one per place, top to bottom.
const POINTS: Array<[number, number]> = [
  [25, 8],
  [72, 24],
  [28, 41],
  [72, 58],
  [28, 75],
  [70, 91],
];

export function WorldMap({ world, progress, onOpen }: WorldMapProps) {
  const [wobbling, setWobbling] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const wobble = (id: string) => {
    if (timer.current) clearTimeout(timer.current);
    setWobbling(id);
    timer.current = setTimeout(() => setWobbling(null), 500);
  };

  const points = world.places.map((_, i) => POINTS[i % POINTS.length]);
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x * 3} ${y * 6}`).join(" ");

  return (
    <div className="relative mx-auto h-[640px] w-full max-w-sm">
      <svg viewBox="0 0 300 600" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="none">
        <path d={path} fill="none" stroke="#FFC93C" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 22" />
      </svg>
      {world.places.map((place, i) => {
        const status = placeStatus(world, progress, place.lessonId);
        const [x, y] = points[i];
        const enabled = status === "open" || status === "done";
        const color = status === "done" ? "bg-sun" : status === "open" ? "bg-leaf" : "bg-ink/20";
        return (
          <div key={place.lessonId} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
            {status === "open" && (
              <div className="absolute right-full top-1/2 mr-1 -translate-y-1/2 scale-75">
                <Mascot mood="idle" />
              </div>
            )}
            <button
              type="button"
              aria-label={place.title}
              aria-disabled={enabled ? undefined : "true"}
              data-status={status}
              data-wobble={wobbling === place.lessonId ? "true" : undefined}
              onClick={() => (enabled ? onOpen(place.lessonId) : wobble(place.lessonId))}
              className={`${color} flex h-20 w-20 items-center justify-center rounded-full border-4 border-white text-ink shadow-md transition-transform active:scale-95 ${
                status === "open" ? "animate-pulse" : ""
              } ${wobbling === place.lessonId ? "place-wobble" : ""}`}
            >
              {status === "done" ? <StarIcon /> : status === "open" ? <span className="font-display text-3xl">{i + 1}</span> : <LockIcon />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
