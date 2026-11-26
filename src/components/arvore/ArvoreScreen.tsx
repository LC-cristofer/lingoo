"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { NinoPose } from "@/art/nino/poses";
import { poseState } from "@/art/nino/poses";
import { narrator } from "@/audio/narrator";
import { useBackgroundMusic } from "@/audio/useBackgroundMusic";
import { NinoCard } from "@/components/nestoy/NinoCard";
import { useProfile } from "@/components/nestoy/ProfileProvider";
import { StageView, useReducedMotion } from "@/components/nestoy/StageView";
import { useTrailProgress } from "@/components/trail/TrailProgressProvider";
import { CloseIcon } from "@/components/trail/icons";
import { BRANCHES, branchUnitId, suggestedStop, unitOpen } from "@/domain/letras/access";
import { getLines, getPath, getUnit } from "@/domain/trail/content";
import { emptyProgress, stopStatus } from "@/domain/trail/progress";
import { stopHref } from "@/domain/trail/routes";
import type { Stop } from "@/domain/trail/schema";
import type { Viewport } from "@/world/camera";
import { ARVORE_LANDINGS } from "@/world/arvore-interior";
import type { Stage } from "@/world/stage";
import { arvoreCam, arvoreNinoSpot, STOP_R } from "./arvore-cam";

const EMPTY = emptyProgress();
const CAM_MS = 1700;
const WALK_MS = 1100;
const SIDE_QUERY = "(orientation: landscape) and (max-height: 520px)";
const NINO_SCALE = 0.62;
/** The entry starts this many platforms below the suggested one and climbs the last stretch. */
const CLIMB_FROM = 2;

type Status = "done" | "current" | "locked" | "closed";

const stopLabel = (s: Stop) => (s.kind === "story" ? "História" : s.title);

function subscribeSide(cb: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(SIDE_QUERY);
  mq.addEventListener?.("change", cb);
  return () => mq.removeEventListener?.("change", cb);
}
const sideNow = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(SIDE_QUERY).matches;

/** A line that replaces the card's own text for a moment; the chip always follows the progress. */
type Message = { title: string; text: string };

/** How much of the letter nest glows: nothing finished, one branch, two or three, or all four. */
const nestLevel = (finished: number): 1 | 2 | 3 | 4 => (finished >= 4 ? 4 : finished >= 2 ? 3 : finished >= 1 ? 2 : 1);

/** The inside of the Árvore das Letras: four branches spiral up the hollow trunk, one platform per stop. */
export function ArvoreScreen() {
  const router = useRouter();
  useBackgroundMusic("trail");
  const reduced = useReducedMotion();
  const { progress, hydrated: progressHydrated } = useTrailProgress();
  const { profile, hydrated: profileHydrated } = useProfile();
  const hydrated = progressHydrated && profileHydrated;
  const p = hydrated ? progress : EMPTY;
  const lines = useMemo(() => getLines(), []);
  const path = useMemo(() => getPath(), []);

  const units = useMemo(() => BRANCHES.map((n) => getUnit(branchUnitId(n))), []);
  const stops = useMemo(() => units.flatMap((u) => u?.stops ?? []), [units]);
  const open = BRANCHES.map((n) => unitOpen(p, profile, n));
  const statuses: Status[] = ARVORE_LANDINGS.map((L, i) => {
    const unit = units[L.unit - 1];
    if (!open[L.unit - 1] || !unit || !stops[i]) return "closed";
    return stopStatus(unit, p, stops[i].id);
  });
  const doneIn = (n: number) => statuses.filter((s, i) => ARVORE_LANDINGS[i].unit === n && s === "done").length;
  const finished = BRANCHES.filter((n) => doneIn(n) === 6).length;

  const suggested = suggestedStop(p, profile);
  const suggestedIndex = suggested ? (suggested.unit - 1) * 6 + suggested.stop : -1;
  const suggestedBranch = suggested?.unit ?? 0;
  // The camera rests on the suggested stop; with the whole tree done, on the last platform.
  const focusIndex = suggestedIndex >= 0 ? suggestedIndex : ARVORE_LANDINGS.length - 1;
  const focusBranch = ARVORE_LANDINGS[focusIndex].unit;
  const branchTitle = path.find((u) => u.unitId === branchUnitId(focusBranch))?.title ?? "";

  const intro: Message = { title: "Árvore das Letras", text: `Galho ${focusBranch}: ${branchTitle}` };
  const chip = `${doneIn(focusBranch)} de 6`;
  const [message, setMessage] = useState<Message | null>(null);
  const [pose, setPose] = useState<NinoPose>("idle");
  const [ready, setReady] = useState(false);
  const [camSet, setCamSet] = useState(false);

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
  const climbing = useRef(false); // the arrival line is playing: leaving or tapping cuts it
  const [stage, setStage] = useState<Stage | null>(null);
  // Latest values for the entry flow, which runs once per stage.
  const live = useRef({ focusIndex, side, reduced, lines });
  useEffect(() => {
    live.current = { focusIndex, side, reduced, lines };
  });

  const target = useCallback((vp: Viewport, index = live.current.focusIndex) => {
    const left = live.current.side ? Math.min(360, vp.w * 0.44) + 24 : 0;
    return arvoreCam(vp, index, left);
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

  // The look of the art: branch emblems (lush leaves or a bud), platforms (done badge, halo on the suggested one, a sprout on closed ones).
  const statusKey = statuses.join(",");
  const openKey = open.join(",");
  useEffect(() => {
    const root = rootRef.current;
    if (!stage || !root) return;
    const st = statusKey.split(",") as Status[];
    const isOpenBranch = openKey.split(",").map((v) => v === "true");
    root.querySelectorAll("#Lint .branch").forEach((g, i) => {
      const isOpen = isOpenBranch[i];
      g.setAttribute("data-open", String(isOpen));
      g.querySelector(".branch-open")?.setAttribute("opacity", isOpen ? "1" : "0");
      g.querySelector(".branch-bud")?.setAttribute("opacity", isOpen ? "0" : "1");
      g.querySelector(".branch-glow")?.setAttribute("opacity", suggestedBranch === i + 1 ? "0.9" : "0");
    });
    root.querySelectorAll("#Lint .stop").forEach((g, i) => {
      const status = st[i];
      const isOpen = status !== "closed";
      g.setAttribute("data-open", String(isOpen));
      g.setAttribute("data-status", status);
      g.querySelector(".stop-done")?.setAttribute("opacity", status === "done" ? "1" : "0");
      g.querySelector(".stop-halo")?.setAttribute("opacity", i === suggestedIndex ? "1" : "0");
      g.querySelector(".stop-bud")?.setAttribute("opacity", isOpen ? "0" : "1");
      g.querySelector(".stop-icon")?.setAttribute("opacity", !isOpen ? "0" : status === "locked" ? "0.35" : "1");
      g.querySelector(".stop-face")?.setAttribute("fill", !isOpen ? "#E3B57F" : status === "locked" ? "#E3DACB" : "#FFF8EC");
    });
  }, [stage, statusKey, suggestedIndex, suggestedBranch, openKey]);

  // The hit discs follow the platforms as the camera moves (transform only).
  useEffect(() => {
    if (!stage) return;
    const place = () => {
      ARVORE_LANDINGS.forEach((L, i) => {
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

  // The entry: the camera and Nino climb the last platforms up to the suggested one, then the card shows.
  useEffect(() => {
    const sg = stageRef.current;
    const vp = vpRef.current;
    if (!stage || !sg || !vp) return;
    const st = sg.nino.st;
    const goal = live.current.focusIndex;
    const from = Math.max(0, goal - CLIMB_FROM);
    const spot = arvoreNinoSpot(goal);
    const faceSpot = () => { st.facing = ARVORE_LANDINGS[goal].x > spot.x ? 1 : -1; };
    let cancelled = false;
    let raf = 0;
    const finish = async () => {
      if (cancelled) return;
      readyRef.current = true;
      setReady(true);
      setMessage(null); // the card shows the tree's live progress
      if (!voiced.current && narrator.isUnlocked()) {
        voiced.current = true;
        setPose("point");
        Object.assign(st, poseState("point"));
        climbing.current = true;
        await narrator.playNarration(live.current.lines.arvoreClimb, { ifIdle: true });
        climbing.current = false;
        if (cancelled) return;
      }
      setPose("idle");
      Object.assign(st, poseState("idle"));
    };
    const showCamera = () => {
      // one frame with the camera in place before the picture is revealed
      raf = requestAnimationFrame(() => { if (!cancelled) setCamSet(true); });
    };
    if (live.current.reduced) {
      Object.assign(sg.cam, target(vp));
      Object.assign(st, { x: spot.x, y: spot.y, s: NINO_SCALE, walk: 0, alpha: 1 });
      faceSpot();
      showCamera();
      void finish();
    } else {
      Object.assign(sg.cam, target(vp, from));
      const start = from === 0 ? { x: sg.nino.st.x, y: sg.nino.st.y } : arvoreNinoSpot(from);
      Object.assign(st, { x: start.x, y: start.y, s: NINO_SCALE, alpha: 1 });
      showCamera();
      void (async () => {
        const go = target(vp);
        const camGo = sg.tl.tween(sg.cam, { X: go.X, Y: go.Y, D: go.D }, CAM_MS, "cam");
        await sg.tl.wait(400);
        if (cancelled) return;
        st.walk = 1;
        faceSpot();
        await sg.tl.tween(st, { x: spot.x, y: spot.y }, WALK_MS, "io", { onUpdate: () => { st.walkPhase = sg.tl.now() / 70; } });
        st.walk = 0;
        await camGo;
        if (cancelled) return;
        if (vpRef.current) Object.assign(sg.cam, target(vpRef.current));
        await finish();
      })();
    }
    return () => {
      cancelled = true;
      if (climbing.current) {
        climbing.current = false;
        narrator.stop();
      }
      cancelAnimationFrame(raf);
      st.walk = 0;
      readyRef.current = false;
      setReady(false);
      setCamSet(false);
    };
  }, [stage, target]);

  // ---- taps ----
  const openStop = (i: number) => {
    if (climbing.current) {
      climbing.current = false;
      narrator.stop();
    }
    narrator.playSfx("tap");
    router.push(stopHref(stops[i].id));
  };
  const pressStop = (i: number) => {
    if (statuses[i] === "closed") return;
    if (statuses[i] !== "locked") return openStop(i);
    setMessage({ title: stopLabel(stops[i]), text: lines.lockedStop.map((seg) => seg.text).join(" ") });
    setPose("help");
    void narrator.playNarration(lines.lockedStop);
  };

  const shown = { ...(message ?? intro), chip };
  return (
    <div ref={rootRef} className="nz-screen av-screen" data-ready={ready} data-camera={camSet ? "set" : undefined} data-testid="arvore">
      {hydrated ? (
        <>
          <StageView scene="arvore" farolLevel={nestLevel(finished)} insets={insets} onStage={onStage} onViewport={onViewport} />
          <div className="nz-hits">
            {ARVORE_LANDINGS.map((L, i) =>
              statuses[i] === "closed" || !stops[i] ? null : (
                <button
                  key={stops[i].id}
                  ref={(el) => { hitRefs.current[i] = el; }}
                  type="button"
                  className="nz-hit"
                  aria-label={`${stopLabel(stops[i])}, galho ${L.unit}`}
                  data-status={statuses[i]}
                  data-stop={stops[i].id}
                  data-suggested={i === suggestedIndex ? "true" : undefined}
                  onClick={() => pressStop(i)}
                />
              ),
            )}
          </div>
        </>
      ) : null}
      <button type="button" aria-label="Voltar" className="k-round k-round-glass nz-back min-h-16 min-w-16" onClick={() => { climbing.current = false; narrator.stop(); router.push("/"); }}>
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
        action={suggestedIndex >= 0 ? { label: `Jogar ${stopLabel(stops[suggestedIndex])}`, onPress: () => openStop(suggestedIndex) } : undefined}
      />
    </div>
  );
}
