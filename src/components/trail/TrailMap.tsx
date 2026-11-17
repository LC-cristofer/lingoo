"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Animal } from "@/art/Animal";
import { Cat } from "@/art/Cat";
import { Chest } from "@/art/scenes/Chest";
import { narrator } from "@/audio/narrator";
import { getLines } from "@/domain/trail/content";
import { dueCards } from "@/domain/trail/memory";
import { stopStatus, unitStatus, type Progress, type StopStatus } from "@/domain/trail/progress";
import type { PathUnit, Stop, Unit } from "@/domain/trail/schema";
import { DaysCalendar } from "./DaysCalendar";
import { useToday } from "./useToday";
import { BottomNav } from "./kit/BottomNav";
import { SpeakerIcon } from "./icons";
import { MusicToggle } from "./kit/MusicToggle";
import { NightSky } from "./kit/NightSky";
import { StopButton } from "./kit/StopButton";
import { UnitHeader } from "./kit/UnitHeader";

type TrailMapProps = {
  path: PathUnit[];
  units: Record<string, Unit>;
  progress: Progress;
  onOpenStop: (stopId: string) => void;
};

/** Where the trail bends, in percent of the column width; it repeats down the whole world. */
const ZIGZAG = [30, 55, 71, 53, 30, 50];
/** Which side of its disc each bend writes the stop's name (as the approved picture). */
const SIDES: ("left" | "right")[] = ["right", "left", "left", "right", "right", "right"];
const FIRST_Y = 56;
const GAP = 88;
const SIGN_DROP = 140;
const AFTER_SIGN = 130;
const GHOSTS = 4;
const TAIL = 70;

type Spot =
  | { type: "stop"; key: string; x: number; y: number; stop: Stop; status: StopStatus; label: string; side: "left" | "right" }
  | { type: "ghost"; key: string; x: number; y: number; kind: Stop["kind"]; unitTitle: string }
  | { type: "sign"; key: string; y: number; unitNumber: number; title: string };

type Layout = {
  spots: Spot[];
  points: [number, number][];
  height: number;
  current: { x: number; y: number; label: string; stopId: string } | null;
  chest: { x: number; y: number } | null;
  bears: { x: number; y: number }[];
};

function labelFor(stop: Stop): string {
  return stop.kind === "story" ? "História" : stop.title;
}

function buildLayout(path: PathUnit[], units: Record<string, Unit>, progress: Progress): Layout {
  const spots: Spot[] = [];
  const points: [number, number][] = [];
  let bend = 0;
  let y = FIRST_Y;
  let current: Layout["current"] = null;
  let chest: Layout["chest"] = null;
  const bears: Layout["bears"] = [];
  path.forEach((entry, index) => {
    const unit = Object.hasOwn(units, entry.unitId) ? units[entry.unitId] : undefined;
    const real = entry.hasContent && unit !== undefined;
    if (index > 0) {
      // The sign sits on the trail, then the next stops follow.
      y += SIGN_DROP;
      spots.push({ key: `sign-${entry.unitId}`, type: "sign", y, unitNumber: index + 1, title: entry.title });
      points.push([50, y]);
      y += AFTER_SIGN;
    }
    const count = real ? unit.stops.length : GHOSTS;
    for (let i = 0; i < count; i++) {
      const x = ZIGZAG[bend % ZIGZAG.length];
      const bendSide = SIDES[bend % SIDES.length];
      bend++;
      if (real) {
        const stop = unit.stops[i];
        let status = stopStatus(unit, progress, stop.id);
        if (status !== "done" && unitStatus(path, units, progress, entry.unitId) === "locked") status = "locked";
        const label = labelFor(stop);
        // The challenge writes its name on the left so the chest can sit on the right.
        const side = stop.kind === "challenge" ? "left" : bendSide;
        spots.push({ key: stop.id, type: "stop", x, y, stop, status, label, side });
        if (status === "current") current = { x, y, label, stopId: stop.id };
        if (stop.kind === "challenge") chest = { x: x + 24, y: y - 18 };
      } else {
        spots.push({ key: `ghost-${entry.unitId}-${i}`, type: "ghost", x, y, kind: i === 0 ? "song" : "lesson", unitTitle: entry.title });
        if (i === 0) bears.push({ x: x >= 52 ? x - 26 : x + 26, y: y - 10 });
      }
      points.push([x, y]);
      if (i < count - 1) y += GAP;
    }
  });
  const last = points[points.length - 1] ?? [50, y];
  const height = y + TAIL + 40;
  points.push([last[0], y + TAIL]);
  return { spots, points, height, current, chest, bears };
}

/** A winding dirt path through the points (x in percent, y in px), as the approved mock-up. */
function trailPath(points: [number, number][]): string {
  if (points.length === 0) return "";
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const dy = (y1 - y0) / 2;
    d += ` C${x0} ${y0 + dy} ${x1} ${y1 - dy} ${x1} ${y1}`;
  }
  return d;
}

/**
 * The map: one tall trail per world. Stops zigzag down a dirt path, the current one is larger with the
 * cat beside it, and the next units follow as locked signs with grey ghost stops.
 */
export function TrailMap({ path, units, progress, onOpenStop }: TrailMapProps) {
  const lines = getLines();
  const today = useToday();
  const rootRef = useRef<HTMLDivElement>(null);
  const [shaking, setShaking] = useState<string | null>(null);
  const layout = useMemo(() => buildLayout(path, units, progress), [path, units, progress]);
  const cat = layout.current;
  const first = path[0];
  const firstUnit = first && Object.hasOwn(units, first.unitId) ? units[first.unitId] : undefined;
  const firstDone = firstUnit ? firstUnit.stops.filter((s) => Object.hasOwn(progress.completedStops, s.id)).length : 0;
  const currentLabel = layout.current?.label ?? null;

  // On open, bring the current stop into view.
  useEffect(() => {
    rootRef.current?.querySelector('[data-state="current"]')?.scrollIntoView?.({ block: "center" });
  }, [currentLabel]);

  useEffect(() => {
    if (!shaking) return;
    const t = setTimeout(() => setShaking(null), 500);
    return () => clearTimeout(t);
  }, [shaking]);

  // The cat's bubble is on-screen text, so it is narrated: once when the map opens (a no-op before the
  // first touch, and it never cuts off the greeting or the closing still playing) and again whenever its
  // speaker button is tapped.
  const goLine = cat ? lines.stopGo[cat.stopId.split("/").pop() ?? ""] : undefined;
  useEffect(() => {
    if (goLine && narrator.isUnlocked()) void narrator.playNarration(goLine, { ifIdle: true });
  }, [goLine]);
  const sayGo = () => {
    narrator.unlock();
    if (goLine) void narrator.playNarration(goLine);
  };

  const soon = () => void narrator.playNarration(lines.soonUnit);

  return (
    <div ref={rootRef} className="k-screen k-trailmap" data-guide={cat && cat.x < 50 ? "right" : "left"}>
      <NightSky variant="map" />

      <div className="k-fixed-chips">
        <DaysCalendar progress={progress} />
        <MusicToggle />
      </div>

      <main className="k-trailmap-body">
        {first && firstUnit ? (
          <div className="k-trailmap-sign">
            <UnitHeader
              unitLabel="Unidade 1"
              title={first.title}
              done={firstDone}
              total={firstUnit.stops.length}
              ariaLabel={`Unidade 1, ${first.title}`}
              onPress={() => void narrator.playNarration(firstUnit.banner)}
            />
          </div>
        ) : null}

        <div className="k-trail" style={{ height: layout.height }}>
          <svg className="k-trail-path" viewBox={`0 0 100 ${layout.height}`} preserveAspectRatio="none" width="100%" height={layout.height} aria-hidden="true">
            <path d={trailPath(layout.points)} fill="none" className="k-trail-dots" strokeWidth="5" strokeLinecap="round" strokeDasharray="0 14" vectorEffect="non-scaling-stroke" />
          </svg>

          {layout.chest ? (
            <span className="k-trail-at k-trail-chest" style={{ left: `${layout.chest.x}%`, top: layout.chest.y }} aria-hidden="true">
              <Chest open={false} size={84} />
            </span>
          ) : null}
          {layout.bears.map((b, i) => (
            <span key={i} className="k-trail-at" style={{ left: `${b.x}%`, top: b.y }} aria-hidden="true">
              <Animal id={i % 2 ? "mouse" : "bear"} size={70} />
            </span>
          ))}

          {layout.spots.map((spot) => {
            if (spot.type === "sign") {
              return (
                <div key={spot.key} className="k-trail-sign" style={{ top: spot.y }}>
                  <UnitHeader unitLabel={`Unidade ${spot.unitNumber}`} title={spot.title} locked ariaLabel={`Unidade ${spot.unitNumber}, ${spot.title}`} onPress={soon} />
                </div>
              );
            }
            const size = spot.type === "stop" && spot.status === "current" ? 90 : 76;
            const shake = spot.type === "stop" && shaking === spot.key ? "is-shake" : "";
            return (
              <div key={spot.key} className={`k-trail-stop ${shake}`} style={{ left: `${spot.x}%`, top: spot.y, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}>
                {spot.type === "stop" ? (
                  <StopButton
                    kind={spot.stop.kind}
                    state={spot.status}
                    label={spot.label}
                    labelSide={spot.side}
                    onPress={() => onOpenStop(spot.stop.id)}
                    onLockedPress={() => {
                      setShaking(spot.key);
                      void narrator.playNarration(lines.lockedStop);
                    }}
                  />
                ) : (
                  <StopButton kind={spot.kind} state="locked" label={`Em breve, ${spot.unitTitle}`} labelSide="right" showLabel={false} onPress={soon} onLockedPress={soon} />
                )}
              </div>
            );
          })}

          {cat ? (
            <div
              className="k-guide"
              data-edge={cat.x >= 50 ? "left" : "right"}
              style={{
                top: cat.y - (cat.x >= 50 ? 28 : 40),
                ["--g-phone" as string]: "2%",
                // On a tablet the cat stands just right of the stop, clear of the next ones.
                ["--g-tablet" as string]: cat.x >= 50 ? `calc(${cat.x}% + 56px)` : "72%",
              }}
            >
              {/* The whole bubble is the replay button (a 64 px target) with a small speaker inside, so it
                  stays as narrow as the approved picture and the cat never lands on the next stops. */}
              <button type="button" aria-label="Ouvir de novo" className="k-guide-say" onClick={sayGo} disabled={!goLine}>
                <span className="k-bubble k-tail-down">
                  <span className="k-bubble-text">
                    <b>{cat.label}</b> · Vamos! <span className="k-guide-speaker" aria-hidden="true"><SpeakerIcon size={18} /></span>
                  </span>
                </span>
              </button>
              <Cat expression="pointing" size={92} />
            </div>
          ) : null}
        </div>
      </main>

      <BottomNav active="trilha" memoryDue={today ? dueCards(progress.memory, today).length : 0} />
    </div>
  );
}
