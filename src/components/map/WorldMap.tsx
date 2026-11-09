"use client";

import { useEffect, useRef, useState } from "react";
import type { World } from "@/domain/content-schema";
import { placeStatus, type Progress } from "@/domain/progress";
import { Mascot } from "@/components/Mascot";
import { LockIcon, StarIcon } from "@/components/lesson/icons";

type WorldMapProps = { world: World; progress: Progress; onOpen: (lessonId: string) => void };

// Winding path, [x%, y%] per place. Portrait winds top to bottom, landscape left to right.
const PORTRAIT: Array<[number, number]> = [[30, 16], [70, 32], [30, 48], [70, 64], [30, 80], [70, 92]];
const LANDSCAPE: Array<[number, number]> = [[10, 62], [26, 38], [42, 62], [58, 38], [74, 62], [90, 38]];

const toPath = (pts: Array<[number, number]>) => pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");

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

  const count = world.places.length;
  const portrait = world.places.map((_, i) => PORTRAIT[i % PORTRAIT.length]);
  const landscape = world.places.map((_, i) => LANDSCAPE[i % LANDSCAPE.length]);
  const strokeProps = {
    fill: "none",
    stroke: "#FFC93C",
    strokeWidth: 14,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeDasharray: "2 22",
    vectorEffect: "non-scaling-stroke" as const,
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full landscape:hidden" aria-hidden="true">
        <path d={toPath(portrait.slice(0, count))} {...strokeProps} />
      </svg>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 hidden h-full w-full landscape:block" aria-hidden="true">
        <path d={toPath(landscape.slice(0, count))} {...strokeProps} />
      </svg>
      {world.places.map((place, i) => {
        const status = placeStatus(world, progress, place.lessonId);
        const enabled = status === "open" || status === "done";
        const color = status === "done" ? "bg-sun" : status === "open" ? "bg-leaf" : "bg-[#d9d6d0]";
        const style = {
          "--px": `${portrait[i][0]}%`,
          "--py": `${portrait[i][1]}%`,
          "--lx": `${landscape[i][0]}%`,
          "--ly": `${landscape[i][1]}%`,
        } as React.CSSProperties;
        return (
          <div
            key={place.lessonId}
            className="absolute left-(--px) top-(--py) -translate-x-1/2 -translate-y-1/2 landscape:left-(--lx) landscape:top-(--ly)"
            style={style}
          >
            {status === "open" && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2">
                <div className="origin-bottom scale-[0.6]">
                  <Mascot mood="idle" />
                </div>
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
                status === "open" ? "place-pulse" : ""
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
