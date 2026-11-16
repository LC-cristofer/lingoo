"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Animal } from "@/art/Animal";
import { Cat } from "@/art/Cat";
import { Chest } from "@/art/scenes/Chest";
import { narrator } from "@/audio/narrator";
import { getLines } from "@/domain/trail/content";
import { stopStatus, unitStatus, type Progress, type StopStatus } from "@/domain/trail/progress";
import type { PathUnit, Stop, Unit } from "@/domain/trail/schema";
import { DaysCalendar } from "./DaysCalendar";
import { BottomNav } from "./kit/BottomNav";
import { Bubble } from "./kit/Bubble";
import { ForestScene } from "./kit/ForestScene";
import { Scatter, type ScatterItem } from "./kit/Scatter";
import { StopButton } from "./kit/StopButton";
import { WoodSign } from "./kit/WoodSign";

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
  | { type: "ghost"; key: string; x: number; y: number; kind: Stop["kind"] }
  | { type: "sign"; key: string; y: number; unitNumber: number; title: string };

type Layout = {
  spots: Spot[];
  points: [number, number][];
  height: number;
  current: { x: number; y: number; label: string } | null;
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
        if (status === "current") current = { x, y, label };
        if (stop.kind === "challenge") chest = { x: x + 24, y: y - 18 };
      } else {
        spots.push({ key: `ghost-${entry.unitId}-${i}`, type: "ghost", x, y, kind: i === 0 ? "song" : "lesson" });
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

function sideDecor(height: number): ScatterItem[] {
  const out: ScatterItem[] = [];
  let i = 0;
  for (let y = 900; y < height + 360; y += 230, i++) {
    out.push({ kind: i % 2 ? "round" : "pine", x: i % 2 ? 91 : 6, y, s: 0.8 + (i % 3) * 0.12 });
    out.push({ kind: i % 3 === 0 ? "mush" : "flower", x: i % 2 ? 12 : 84, y: y + 90, color: i % 2 ? "#FF8FA3" : "#fff" });
    out.push({ kind: i % 2 ? "pine" : "round", x: i % 2 ? 4 : 94, y: y + 120, s: 0.7 });
  }
  return out;
}

const PHONE_DECOR: ScatterItem[] = [
  { kind: "pine", x: 7, y: 330, s: 0.62 },
  { kind: "round", x: 90, y: 322, s: 0.5 },
  { kind: "pine", x: 91, y: 470, s: 0.9 },
  { kind: "round", x: 8, y: 520, s: 0.72 },
  { kind: "pine", x: 5, y: 700, s: 1 },
  { kind: "round", x: 92, y: 660, s: 0.8 },
  { kind: "mush", x: 79, y: 560 },
  { kind: "flower", x: 15, y: 420, color: "#FF8FA3" },
  { kind: "flower", x: 85, y: 750, color: "#fff" },
  { kind: "mush", x: 22, y: 760 },
];

const TABLET_DECOR: ScatterItem[] = [
  { kind: "pine", x: 6, y: 330, s: 0.8 },
  { kind: "pine", x: 13, y: 346, s: 0.56 },
  { kind: "round", x: 92, y: 330, s: 0.7 },
  { kind: "pine", x: 97, y: 350, s: 0.6 },
  { kind: "round", x: 91, y: 520, s: 0.95 },
  { kind: "pine", x: 6, y: 760, s: 1.25 },
  { kind: "mush", x: 82, y: 560 },
  { kind: "mush", x: 26, y: 640 },
  { kind: "flower", x: 87, y: 740, color: "#FF8FA3" },
];

/**
 * The map: one tall trail per world. Stops zigzag down a dirt path, the current one is larger with the
 * cat beside it, and the next units follow as locked signs with grey ghost stops.
 */
export function TrailMap({ path, units, progress, onOpenStop }: TrailMapProps) {
  const lines = getLines();
  const rootRef = useRef<HTMLDivElement>(null);
  const [shaking, setShaking] = useState<string | null>(null);
  const layout = useMemo(() => buildLayout(path, units, progress), [path, units, progress]);
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

  const soon = () => void narrator.playNarration(lines.soonUnit);
  const decor = useMemo(() => sideDecor(layout.height), [layout.height]);
  const cat = layout.current;

  return (
    <div ref={rootRef} className="k-screen k-trailmap" data-guide={cat && cat.x < 50 ? "right" : "left"}>
      <ForestScene variant="trail" />
      <Scatter items={PHONE_DECOR} className="k-only-phone" />
      <Scatter items={TABLET_DECOR} className="k-only-tablet" />
      <Scatter items={decor} />
      <svg className="k-pond k-only-tablet" width="320" height="120" viewBox="0 0 320 120" aria-hidden="true">
        <ellipse cx="160" cy="66" rx="150" ry="48" fill="#3F9CE6" />
        <ellipse cx="160" cy="60" rx="150" ry="48" fill="#6FC0FF" />
        <ellipse cx="120" cy="46" rx="46" ry="10" fill="#fff" opacity=".35" />
      </svg>
      <span className="k-peek k-peek-frog k-only-tablet" aria-hidden="true">
        <Animal id="frog" size={76} />
      </span>
      <span className="k-peek k-peek-bear k-only-tablet" aria-hidden="true">
        <Animal id="bear" size={96} />
      </span>
      <span className="k-peek k-peek-bird" aria-hidden="true">
        <Animal id="bird" size={54} />
      </span>

      <div className="k-fixed-chips">
        <DaysCalendar progress={progress} />
      </div>

      <main className="k-trailmap-body">
        {first && firstUnit ? (
          <div className="k-trailmap-sign">
            <WoodSign
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
            <path d={trailPath(layout.points)} fill="none" stroke="#D9B873" strokeWidth="54" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <path d={trailPath(layout.points)} fill="none" stroke="#F6DDA6" strokeWidth="46" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <path d={trailPath(layout.points)} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 20" opacity=".85" vectorEffect="non-scaling-stroke" />
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
                  <WoodSign unitLabel={`Unidade ${spot.unitNumber}`} title={spot.title} locked ariaLabel={`Unidade ${spot.unitNumber}, ${spot.title}`} onPress={soon} />
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
                  <StopButton kind={spot.kind} state="locked" label="Em breve" labelSide="right" showLabel={false} onPress={soon} onLockedPress={soon} />
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
              <Bubble tail="down">
                <b>{cat.label}</b> · Vamos!
              </Bubble>
              <Cat expression="pointing" size={92} />
            </div>
          ) : null}
        </div>
      </main>

      <BottomNav active="trilha" />
    </div>
  );
}
