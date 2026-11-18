"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { NinoPose } from "@/art/nino/poses";
import { poseState } from "@/art/nino/poses";
import { narrator } from "@/audio/narrator";
import { useBackgroundMusic } from "@/audio/useBackgroundMusic";
import { NinoCard } from "@/components/nestoy/NinoCard";
import { StageView, useReducedMotion } from "@/components/nestoy/StageView";
import { useTrailProgress } from "@/components/trail/TrailProgressProvider";
import { CloseIcon } from "@/components/trail/icons";
import { getLines, getPath, getUnit } from "@/domain/trail/content";
import { farolLevel } from "@/domain/nestoy/island-view";
import { emptyProgress, stopStatus, type StopStatus } from "@/domain/trail/progress";
import { stopHref } from "@/domain/trail/routes";
import type { Stop } from "@/domain/trail/schema";
import type { Viewport } from "@/world/camera";
import { FAROL_LANDINGS } from "@/world/farol-interior";
import type { Stage } from "@/world/stage";
import { landingCam, ninoSpot, STOP_R } from "./landing-cam";

const UNIT_ID = "forest-animals";
const EMPTY = emptyProgress();
const CAM_MS = 1700;
const WALK_MS = 1300;
const SIDE_QUERY = "(orientation: landscape) and (max-height: 520px)";
const NINO_SCALE = 0.62;

const stopLabel = (s: Stop) => (s.kind === "story" ? "História" : s.title);

function subscribeSide(cb: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(SIDE_QUERY);
  mq.addEventListener?.("change", cb);
  return () => mq.removeEventListener?.("change", cb);
}
const sideNow = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(SIDE_QUERY).matches;

type Message = { title: string; text: string; chip: string };

/** The inside of the Farol das Línguas: the spiral staircase is the unit's trail, one landing per stop. */
export function FarolScreen() {
  const router = useRouter();
  useBackgroundMusic("trail");
  const reduced = useReducedMotion();
  const { progress, hydrated } = useTrailProgress();
  const unit = useMemo(() => getUnit(UNIT_ID), []);
  const unitTitle = useMemo(() => getPath().find((u) => u.unitId === UNIT_ID)?.title ?? "", []);
  const lines = useMemo(() => getLines(), []);
  const p = hydrated ? progress : EMPTY;

  const stops = unit?.stops ?? [];
  const statuses: StopStatus[] = stops.map((s) => (unit ? stopStatus(unit, p, s.id) : "locked"));
  const doneCount = statuses.filter((s) => s === "done").length;
  const currentIndex = Math.max(0, statuses.indexOf("current") === -1 ? stops.length - 1 : statuses.indexOf("current"));
  const level = unit ? farolLevel(p, unit) : 1;

  const intro: Message = { title: "Farol das Línguas", text: `Unidade 1: ${unitTitle}`, chip: `${doneCount} de ${stops.length}` };
  const [message, setMessage] = useState<Message | null>(null);
  const [pose, setPose] = useState<NinoPose>("idle");
  const [ready, setReady] = useState(false);

  // ---- layout: the card's height and the side mode decide what the camera must keep free ----
  const side = useSyncExternalStore(subscribeSide, sideNow, () => false);
  const cardRef = useRef<HTMLElement>(null);
  const [cardH, setCardH] = useState(108);
  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setCardH(Math.round(el.getBoundingClientRect().height) || 108));
    ro.observe(el);
    return () => ro.disconnect();
  }, [hydrated]);
  const insets = side ? { top: 16, bottom: 16 } : { top: 100, bottom: cardH + 18 + 16 };

  // ---- the world ----
  const rootRef = useRef<HTMLDivElement>(null);
  const hitRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stageRef = useRef<Stage | null>(null);
  const vpRef = useRef<Viewport | null>(null);
  const readyRef = useRef(false);
  const voiced = useRef(false);
  const [stage, setStage] = useState<Stage | null>(null);
  // Latest values for the entry flow, which runs once per stage.
  const live = useRef({ currentIndex, side, reduced, statuses, intro, lines });
  useEffect(() => {
    live.current = { currentIndex, side, reduced, statuses, intro, lines };
  });

  const target = useCallback((vp: Viewport) => {
    const left = live.current.side ? Math.min(360, vp.w * 0.44) + 24 : 0;
    return landingCam(vp, live.current.currentIndex, left);
  }, []);

  const onStage = useCallback((s: Stage | null) => {
    stageRef.current = s;
    setStage(s);
  }, []);
  const onViewport = useCallback((vp: Viewport) => {
    vpRef.current = vp;
    const s = stageRef.current;
    if (s && readyRef.current) Object.assign(s.cam, target(vp));
  }, [target]);

  // Stops' look in the art (done badge, halo on the current one, dimmed locked ones).
  useEffect(() => {
    const groups = rootRef.current?.querySelectorAll("#Lint .stop");
    if (!stage || !groups) return;
    const cur = statuses.indexOf("current");
    const upto = cur === -1 ? stops.length : cur;
    groups.forEach((g, i) => {
      g.querySelector(".stop-done")?.setAttribute("opacity", i < upto ? "1" : "0");
      g.querySelector(".stop-halo")?.setAttribute("opacity", i === cur ? "1" : "0");
      g.querySelector(".stop-icon")?.setAttribute("opacity", i <= upto ? "1" : "0.35");
      g.querySelector(".stop-face")?.setAttribute("fill", i <= upto ? "#FFF8EC" : "#E3DACB");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, statuses.join(",")]);

  // The hit discs follow the landings as the camera moves (transform only).
  useEffect(() => {
    if (!stage) return;
    const place = () => {
      FAROL_LANDINGS.forEach((L, i) => {
        const b = hitRefs.current[i];
        if (!b) return;
        const [sx, sy] = stage.screenOf(L.x, L.y - 18);
        const k = Math.max(64 / (2 * STOP_R), (stage.screenOf(L.x + STOP_R, L.y - 18)[0] - sx) / STOP_R);
        b.style.transform = `translate(${(sx - STOP_R).toFixed(1)}px, ${(sy - STOP_R).toFixed(1)}px) scale(${k.toFixed(3)})`;
      });
    };
    place();
    return stage.onFrame(place);
  }, [stage]);

  // The entry: from the door up to the current landing, Nino walking, then the card and the voice.
  useEffect(() => {
    if (!stage) return;
    const vp = vpRef.current;
    if (!vp) return;
    const st = stage.nino.st;
    const spot = ninoSpot(live.current.currentIndex);
    const faceSpot = () => { st.facing = FAROL_LANDINGS[live.current.currentIndex].x > spot.x ? 1 : -1; };
    let cancelled = false;
    const finish = async () => {
      if (cancelled) return;
      readyRef.current = true;
      setReady(true);
      setMessage(live.current.intro);
      if (!voiced.current && narrator.isUnlocked()) {
        voiced.current = true;
        setPose("point");
        Object.assign(st, poseState("point"));
        await narrator.playNarration(live.current.lines.farolClimb, { ifIdle: true });
        if (cancelled) return;
      }
      setPose("idle");
      Object.assign(st, poseState("idle"));
    };
    if (live.current.reduced) {
      Object.assign(stage.cam, target(vp));
      Object.assign(st, { x: spot.x, y: spot.y, s: NINO_SCALE, walk: 0, alpha: 1 });
      faceSpot();
      void finish();
    } else {
      void (async () => {
        const camGo = stage.tl.tween(stage.cam, { X: target(vp).X, Y: target(vp).Y, D: target(vp).D }, CAM_MS, "cam");
        await stage.tl.wait(500);
        if (cancelled) return;
        st.walk = 1;
        faceSpot();
        await stage.tl.tween(st, { x: spot.x, y: spot.y }, WALK_MS, "io", { onUpdate: () => { st.walkPhase = stage.tl.now() / 70; } });
        st.walk = 0;
        await camGo;
        if (cancelled) return;
        if (vpRef.current) Object.assign(stage.cam, target(vpRef.current));
        await finish();
      })();
    }
    return () => {
      cancelled = true;
      st.walk = 0;
      readyRef.current = false;
      setReady(false);
    };
  }, [stage, target]);

  // ---- taps ----
  const open = (i: number) => {
    narrator.playSfx("tap");
    router.push(stopHref(stops[i].id));
  };
  const pressStop = (i: number) => {
    if (statuses[i] !== "locked") return open(i);
    setMessage({ title: stopLabel(stops[i]), text: "Primeiro a parada que está brilhando!", chip: intro.chip });
    setPose("help");
    void narrator.playNarration(lines.lockedStop);
  };

  const shown = message ?? intro;
  const cur = statuses[currentIndex] !== "done" && stops[currentIndex] ? currentIndex : -1;
  return (
    <div ref={rootRef} className="nz-screen" data-ready={ready} data-testid="farol">
      {hydrated ? (
        <>
          <StageView scene="farol" farolLevel={level} insets={insets} onStage={onStage} onViewport={onViewport} />
          <div className="nz-hits">
            {stops.map((s, i) => (
              <button
                key={s.id}
                ref={(el) => { hitRefs.current[i] = el; }}
                type="button"
                className="nz-hit"
                aria-label={stopLabel(s)}
                data-status={statuses[i]}
                data-stop={s.id}
                onClick={() => pressStop(i)}
              />
            ))}
          </div>
        </>
      ) : null}
      <button type="button" aria-label="Voltar" className="k-round k-round-glass nz-back min-h-16 min-w-16" onClick={() => router.push("/")}>
        <CloseIcon size={30} />
      </button>
      <NinoCard
        ref={cardRef}
        title={shown.title}
        text={shown.text}
        chip={shown.chip}
        tone="ok"
        pose={pose}
        speaks
        action={cur >= 0 ? { label: `Jogar ${stopLabel(stops[cur])}`, onPress: () => open(cur) } : undefined}
      />
    </div>
  );
}

