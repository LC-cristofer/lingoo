"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animal } from "@/art/Animal";
import { Cat } from "@/art/Cat";
import { Chest } from "@/art/scenes/Chest";
import { narrator } from "@/audio/narrator";
import { getLines } from "@/domain/trail/content";
import { stopStatus, weekDays, type Progress } from "@/domain/trail/progress";
import type { ArtId, PathUnit, Stop, Unit } from "@/domain/trail/schema";
import { mapLayout, trailPath, type MapForm } from "@/domain/trail/trail-layout";
import { Decorations } from "./Decorations";
import { BottomNav } from "./kit/BottomNav";
import { Bubble } from "./kit/Bubble";
import { ForestScene } from "./kit/ForestScene";
import { StopButton } from "./kit/StopButton";
import { TopChips } from "./kit/TopChips";
import { WoodSign } from "./kit/WoodSign";
import { useMapForm } from "./useMapForm";

type TrailMapProps = {
  path: PathUnit[];
  units: Record<string, Unit>;
  progress: Progress;
  onOpenStop: (stopId: string) => void;
  /** Forces the layout (tests); otherwise it follows the screen. */
  form?: MapForm;
};

const KIND_LABEL: Record<Stop["kind"], string> = { song: "Música", lesson: "Lição", story: "História", challenge: "Desafio" };
const SHAKE_MS = 400;

/** "Música", "Lição 1", "Lição 2", …: lessons are numbered in trail order. */
function stopLabels(unit: Unit): string[] {
  let lesson = 0;
  return unit.stops.map((s) => (s.kind === "lesson" ? `${KIND_LABEL.lesson} ${++lesson}` : KIND_LABEL[s.kind]));
}

/** Animals peeking from the forest, as in the approved mockups (decoration only). */
const PEEKS: Record<MapForm, { id: ArtId; x: number; y: number; size: number }[]> = {
  phone: [{ id: "bird", x: 306, y: 232, size: 54 }],
  tablet: [
    { id: "frog", x: 178, y: 486, size: 76 },
    { id: "bear", x: 296, y: 360, size: 96 },
    { id: "bird", x: 380, y: 236, size: 60 },
  ],
};

function pct(x: number, width: number): string {
  return `${(x / width) * 100}%`;
}

function Placed({ x, y, width, className = "", children }: { x: number; y: number; width: number; className?: string; children: ReactNode }) {
  return (
    <div className={`k-placed ${className}`} style={{ left: pct(x, width), top: y }}>
      {children}
    </div>
  );
}

/** The trail map: the first unit's stops on a winding dirt path, then the units still to come. */
export function TrailMap({ path, units, progress, onOpenStop, form: forced }: TrailMapProps) {
  const detected = useMapForm();
  const form = forced ?? detected;
  const lines = useMemo(() => getLines(), []);
  const first = path.find((u) => u.hasContent && Object.hasOwn(units, u.unitId));
  const unit = first ? units[first.unitId] : undefined;
  const others = path.filter((u) => u !== first);
  const layout = mapLayout(form, others.length, unit?.stops.length ?? 0);
  const opened = useRef(false);
  const [shaking, setShaking] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Open on the current stop.
  useEffect(() => {
    const current = mapRef.current?.querySelector<HTMLElement>('[data-state="current"]');
    if (current && typeof current.scrollIntoView === "function") current.scrollIntoView({ block: "center" });
  }, [form]);

  useEffect(() => {
    if (shaking === null) return;
    const id = setTimeout(() => setShaking(null), SHAKE_MS);
    return () => clearTimeout(id);
  }, [shaking]);

  if (!unit) return null;

  const labels = stopLabels(unit);
  const statuses = unit.stops.map((s) => stopStatus(unit, progress, s.id));
  const done = statuses.filter((s) => s === "done").length;
  const stars = Object.keys(progress.completedStops).filter((id) => unit.stops.some((s) => s.id === id)).length;
  const currentIndex = statuses.indexOf("current");
  const unitDone = done === unit.stops.length;
  const W = layout.width;

  const open = (stopId: string) => {
    if (opened.current) return;
    opened.current = true;
    narrator.playSfx("tap");
    onOpenStop(stopId);
  };
  const locked = (stopId: string) => {
    setShaking(stopId);
    void narrator.playNarration(lines.lockedStop);
  };

  const current = currentIndex >= 0 ? layout.stops[currentIndex] : undefined;
  const challengeIndex = unit.stops.findIndex((s) => s.kind === "challenge");
  const chestAt = challengeIndex >= 0 ? layout.stops[challengeIndex] : undefined;
  const guideLeft = current ? (form === "tablet" ? current.x / W < 0.8 : current.x / W < 0.5) : true;

  return (
    <div className={`k-map-page is-${form}`} style={{ minHeight: layout.height }}>
      <ForestScene variant="trail" />
      <div ref={mapRef} className="k-map" style={{ height: layout.height, maxWidth: form === "tablet" ? undefined : 560 }}>
        <svg className="k-map-layer" viewBox={`0 0 ${W} ${layout.height}`} preserveAspectRatio="none" aria-hidden="true">
          {(() => {
            const d = trailPath(layout.trail, layout.height);
            return (
              <>
                <path d={d} fill="none" stroke="#D9B873" strokeWidth="54" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <path d={d} fill="none" stroke="#F6DDA6" strokeWidth="46" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <path d={d} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 20" opacity=".85" vectorEffect="non-scaling-stroke" />
              </>
            );
          })()}
        </svg>
        <Decorations items={layout.decorations} width={W} />
        {PEEKS[form].map((p) => (
          <Placed key={p.id} x={p.x} y={p.y} width={W} className="k-peek">
            <span aria-hidden="true">
              <Animal id={p.id} size={p.size} />
            </span>
          </Placed>
        ))}

        <div className="k-map-sign" style={{ left: layout.sign.x, top: layout.sign.y, width: `min(${layout.sign.w}px, calc(100% - 40px))` }}>
          <WoodSign
            unitLabel={`Unidade ${path.indexOf(first!) + 1}`}
            title={unit.title}
            done={done}
            total={unit.stops.length}
            onPress={() => void narrator.playNarration(unit.banner)}
          />
        </div>

        {unit.stops.map((stop, i) => {
          const at = layout.stops[i];
          const state = statuses[i];
          return (
            <Placed key={stop.id} x={at.x} y={at.y} width={W}>
              <div className={shaking === stop.id ? "card-shake" : undefined} data-shake={shaking === stop.id ? "true" : undefined}>
                <StopButton
                  kind={stop.kind}
                  state={state}
                  label={labels[i]}
                  labelSide={at.side}
                  size={layout.stopSize}
                  onPress={() => open(stop.id)}
                  onLockedPress={() => locked(stop.id)}
                />
              </div>
            </Placed>
          );
        })}

        {chestAt ? (
          <Placed x={chestAt.side === "right" ? chestAt.x - 74 : chestAt.x + 74} y={chestAt.side === "right" ? chestAt.y - 4 : chestAt.y - 44} width={W} className="k-peek">
            <span aria-hidden="true">
              <Chest open={unitDone} size={84} />
            </span>
          </Placed>
        ) : null}

        {current ? (
          <div
            className={`k-guide ${guideLeft ? "is-right-of" : "is-left-of"}`}
            style={{ top: current.y, left: pct(current.x, W) }}
            aria-hidden="true"
          >
            <Bubble tail="down">
              <b>{labels[currentIndex]}</b> · Vamos!
            </Bubble>
            <Cat expression="pointing" size={form === "tablet" ? 120 : 92} />
          </div>
        ) : null}

        {others.map((u, i) => {
          const place = layout.units[i];
          return (
            <div key={u.unitId}>
              <div className="k-map-sign" style={{ left: place.sign.x, top: place.sign.y, width: `min(${place.sign.w}px, calc(100% - 40px))` }}>
                <WoodSign
                  unitLabel={`Unidade ${path.indexOf(u) + 1}`}
                  title={u.title}
                  locked
                  onPress={() => void narrator.playNarration(lines.soonUnit)}
                />
              </div>
              {place.ghosts.map((g, j) => (
                <Placed key={j} x={g.x} y={g.y} width={W} className="k-ghost">
                  <span className="k-stop" aria-hidden="true" style={{ width: 70, height: 70 }}>
                    <span className="k-stop-disc" style={{ background: "#D5D9E0", boxShadow: "0 9px 0 #AEB4BF" }} />
                  </span>
                </Placed>
              ))}
            </div>
          );
        })}
      </div>
      <div className="k-map-top">
        <TopChips stars={stars} week={weekDays(progress, new Date())} />
      </div>
      <BottomNav active="trilha" showMemory={false} />
    </div>
  );
}
