"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { NinoPose } from "@/art/nino/poses";
import { poseState } from "@/art/nino/poses";
import { ambience } from "@/audio/ambience";
import { narrator } from "@/audio/narrator";
import { useBackgroundMusic } from "@/audio/useBackgroundMusic";
import { NinoCard, type ChipTone } from "@/components/nestoy/NinoCard";
import { useSettings } from "@/components/nestoy/SettingsProvider";
import { StageView, type StageInsets } from "@/components/nestoy/StageView";
import { useTrailProgress } from "@/components/trail/TrailProgressProvider";
import { useToday } from "@/components/trail/useToday";
import { farolLevel, LAUNCH_STATES, nestThreads, suggestedPlace } from "@/domain/nestoy/island-view";
import { isNight } from "@/domain/nestoy/settings";
import { getLines, getPath, getUnit } from "@/domain/trail/content";
import { emptyProgress } from "@/domain/trail/progress";
import { focusCam, overviewCam, type Viewport } from "@/world/camera";
import { PLACE_ANCHORS, type PlaceId, type PlaceState } from "@/world/island";
import type { Stage } from "@/world/stage";
import { diveIntoFarol, focusPlace, goToFarol, NEST_FRONT, NINO_ISLAND_SCALE, settle, toOverview } from "./flows";
import { Pins, PLACE_NAMES } from "./Pins";
import { TopBar } from "./TopBar";

const UNIT_ID = "forest-animals";
const EMPTY = emptyProgress();
const SIDE_QUERY = "(orientation: landscape) and (max-height: 520px)";
const STATES: Record<PlaceId, PlaceState> = { ninho: "pronto", farol: "pronto", ...LAUNCH_STATES };
/** Where a place's body sits relative to its pin anchor (world units) and how far a tap still counts. */
const BODY: Record<PlaceId, { dx: number; dy: number; r: number }> = {
  ninho: { dx: 0, dy: 70, r: 130 },
  farol: { dx: -8, dy: 190, r: 150 },
  letras: { dx: 0, dy: 110, r: 130 },
  numeros: { dx: 0, dy: 110, r: 110 },
  cores: { dx: 0, dy: 90, r: 120 },
  lago: { dx: 0, dy: 20, r: 130 },
};

function subscribeSide(cb: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(SIDE_QUERY);
  mq.addEventListener?.("change", cb);
  return () => mq.removeEventListener?.("change", cb);
}
const sideNow = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(SIDE_QUERY).matches;

type View = { title: string; text: string; chip: string; tone: ChipTone; enter: boolean };
const EXPLORE: View = { title: "Vamos explorar?", text: "Toque num lugar da ilha.", chip: "", tone: "ok", enter: false };

export type IslandScreenProps = {
  /** Task 8 adds the opening and the return; for now the island always arrives ready to explore. */
  mode: "explore";
  /** The live stage once mounted, and null once destroyed. */
  onStage?: (stage: Stage | null) => void;
};

/** The island home: the world stage, six place pins, the Nino card and the top bar. */
export function IslandScreen({ onStage }: IslandScreenProps) {
  const router = useRouter();
  useBackgroundMusic("trail");
  const { settings, hydrated: settingsReady } = useSettings();
  const { progress, hydrated: progressReady } = useTrailProgress();
  const today = useToday();
  const unit = useMemo(() => getUnit(UNIT_ID), []);
  const lines = useMemo(() => getLines(), []);
  const unitTitle = useMemo(() => getPath().find((u) => u.unitId === UNIT_ID)?.title ?? "", []);
  const p = progressReady ? progress : EMPTY;
  const level = unit ? farolLevel(p, unit) : 1;
  const threads = unit ? nestThreads(p, unit) : 0;
  const suggested: PlaceId = unit && today ? suggestedPlace(p, unit, today) : "farol";

  const [view, setView] = useState<View>(EXPLORE);
  const [focus, setFocus] = useState<PlaceId | null>(null);
  const [pose, setPose] = useState<NinoPose>("idle");
  const [speaks, setSpeaks] = useState(false);
  const [ready, setReady] = useState(false);
  const [away, setAway] = useState(false);
  const [night, setNight] = useState(false);
  const [stage, setStage] = useState<Stage | null>(null);

  // ---- layout: what the top bar and the card cover decides where the camera frames the island ----
  const side = useSyncExternalStore(subscribeSide, sideNow, () => false);
  const barRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [insets, setInsets] = useState<StageInsets>({ top: 96, bottom: 150, left: 0, right: 0 });
  const measure = useCallback(() => {
    const bar = barRef.current, card = cardRef.current;
    if (!bar || !card) return;
    const b = bar.getBoundingClientRect(), k = card.getBoundingClientRect();
    if (!k.width || !b.width) return; // not laid out (tests)
    const vw = window.innerWidth, vh = window.innerHeight;
    const next: StageInsets = side
      ? { top: 48, bottom: 16, left: Math.round(k.right + 8), right: Math.round(vw - b.left + 8) }
      : { top: Math.round(b.bottom + 8), bottom: Math.round(vh - k.top + 12), left: 0, right: 0 };
    setInsets((prev) => (prev.top === next.top && prev.bottom === next.bottom && prev.left === next.left && prev.right === next.right ? prev : next));
  }, [side]);
  useEffect(() => {
    measure();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (barRef.current) ro?.observe(barRef.current);
    if (cardRef.current) ro?.observe(cardRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, settingsReady, progressReady]);

  // ---- the world ----
  const stageRef = useRef<Stage | null>(null);
  const vpRef = useRef<Viewport | null>(null);
  const focusRef = useRef<PlaceId | null>(null);
  const flowRef = useRef(0); // bumped by every interaction: an older flow stops touching the screen
  const veilRef = useRef<HTMLDivElement>(null);
  const awayRef = useRef(false); // the dive is running or done: the island ignores taps
  const live = useRef({ settings, level });
  useEffect(() => {
    live.current = { settings, level };
  });

  /** Where the camera rests for the current focus, with the latest insets. */
  const rest = useCallback((vp: Viewport) => (focusRef.current ? focusCam(PLACE_ANCHORS[focusRef.current], vp) : overviewCam(vp)), []);
  const idle = useRef(true);

  const onStageMount = useCallback((s: Stage | null) => {
    stageRef.current = s;
    setStage(s);
    onStage?.(s);
  }, [onStage]);
  const onViewport = useCallback((vp: Viewport) => {
    vpRef.current = vp;
    const s = stageRef.current;
    if (s && idle.current) Object.assign(s.cam, rest(vp));
  }, [rest]);

  // Arrival (until Task 8's opening): Nino stands in front of the nest, the whole island in view, the ambient set.
  useEffect(() => {
    const vp = vpRef.current, s = stageRef.current;
    if (!stage || !s || !vp) return;
    const night = isNight(live.current.settings, new Date());
    s.env.night = night ? 1 : 0;
    s.env.farolLevel = live.current.level;
    setNight(night);
    ambience.play(night ? "night" : "day");
    s.moveNino("actors");
    Object.assign(s.nino.st, { x: NEST_FRONT.x, y: NEST_FRONT.y, s: NINO_ISLAND_SCALE, walk: 0, alpha: 1, facing: 1 });
    Object.assign(s.cam, overviewCam(vp));
    focusRef.current = null;
    idle.current = true;
    // coming back from the farol (the route was kept hidden): the UI is back, the veil is gone
    awayRef.current = false;
    setAway(false);
    if (veilRef.current) veilRef.current.style.opacity = "0";
    setReady(true);
    return () => {
      setReady(false);
      ambience.stop();
    };
  }, [stage]);

  // ---- interactions ----
  /** Cancels whatever flow is running: its promises never resolve, so the screen restores what it touched. */
  const interrupt = useCallback((): number => {
    const s = stageRef.current;
    if (s) {
      s.tl.cancelAll();
      settle(s);
      Object.assign(s.nino.st, poseState("idle"));
    }
    setPose("idle");
    setSpeaks(false);
    return ++flowRef.current;
  }, []);

  const speak = useCallback(async (token: number, line: Parameters<typeof narrator.playNarration>[0], to: NinoPose = "idle") => {
    setSpeaks(true);
    await narrator.playNarration(line);
    if (token !== flowRef.current) return;
    setSpeaks(false);
    setPose(to);
  }, []);

  const goOverview = useCallback(async () => {
    const s = stageRef.current, vp = vpRef.current;
    if (!s || !vp || awayRef.current || focusRef.current === null) return;
    const token = interrupt();
    focusRef.current = null;
    setFocus(null);
    setView(EXPLORE);
    idle.current = false;
    await toOverview(s, vp);
    if (token !== flowRef.current) return;
    idle.current = true;
    if (vpRef.current) Object.assign(s.cam, overviewCam(vpRef.current));
  }, [interrupt]);

  const pressPlace = useCallback(async (id: PlaceId) => {
    const s = stageRef.current, vp = vpRef.current;
    if (!s || !vp || awayRef.current) return;
    narrator.playSfx("tap");
    if (id === "ninho") {
      router.push("/ninho");
      return;
    }
    if (focusRef.current === id) return; // already there: do not re-walk
    const token = interrupt();
    focusRef.current = id;
    setFocus(id);
    idle.current = false;
    const done = async () => {
      if (token !== flowRef.current) return;
      idle.current = true;
      if (vpRef.current) Object.assign(s.cam, rest(vpRef.current));
    };
    if (id === "farol") {
      setView({ title: PLACE_NAMES.farol, text: `Inglês · Unidade 1: ${unitTitle}`, chip: "Pronto", tone: "ok", enter: false });
      await goToFarol(s, vp);
      if (token !== flowRef.current) return;
      setPose("point");
      Object.assign(s.nino.st, poseState("point"));
      setView((v) => ({ ...v, enter: true }));
      await done();
      await speak(token, lines.placeFarol);
      if (token === flowRef.current) Object.assign(s.nino.st, poseState("idle"));
    } else if (id === "letras") {
      setView({ title: PLACE_NAMES.letras, text: "Os construtores estão trabalhando aqui.", chip: "Em construção", tone: "obra", enter: false });
      setPose("help");
      void speak(token, lines.placeBuilding);
      await focusPlace(s, id, vp);
      await done();
    } else {
      setView({ title: PLACE_NAMES[id], text: "Um lugar novo vai nascer aqui.", chip: "Em breve", tone: "futuro", enter: false });
      setPose("help");
      void speak(token, lines.soonUnit);
      await focusPlace(s, id, vp);
      await done();
    }
  }, [interrupt, lines, rest, router, speak, unitTitle]);

  const enterFarol = useCallback(async () => {
    const s = stageRef.current, vp = vpRef.current;
    if (!s || !vp) return;
    if (awayRef.current) return;
    awayRef.current = true;
    const token = interrupt();
    idle.current = false;
    setAway(true);
    await diveIntoFarol(s, (v) => {
      if (veilRef.current) veilRef.current.style.opacity = v.toFixed(3);
    });
    if (token !== flowRef.current) return;
    router.push("/farol");
  }, [interrupt, router]);

  /** A tap on the world: a place's body opens it, anything else (the sky, the sea) goes back to the whole island. */
  const tapWorld = (e: React.MouseEvent<HTMLDivElement>) => {
    const s = stageRef.current;
    if (!s || !ready || awayRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const k = s.screenOf(1, 0)[0] - s.screenOf(0, 0)[0]; // px per world unit
    let best: PlaceId | null = null, bestD = Infinity;
    (Object.keys(BODY) as PlaceId[]).forEach((id) => {
      const a = PLACE_ANCHORS[id], b = BODY[id];
      const [sx, sy] = s.screenOf(a.x + b.dx, a.y + b.dy);
      const d = Math.hypot(x - sx, y - sy);
      if (d <= b.r * k && d < bestD) { best = id; bestD = d; }
    });
    if (best) void pressPlace(best);
    else void goOverview();
  };

  const glow = focus ?? suggested;
  return (
    <div className="nz-screen nz-island" data-ready={ready} data-away={away} data-focus={focus ?? "none"} data-testid="island">
      {settingsReady && progressReady ? (
        <StageView scene="island" states={LAUNCH_STATES} threads={threads} farolLevel={level} insets={insets} onStage={onStageMount} onViewport={onViewport} />
      ) : null}
      <div className="nz-island-sky" data-testid="island-sky" onClick={tapWorld} />
      <Pins stage={stage} states={STATES} glow={ready ? glow : null} onPress={(id) => void pressPlace(id)} />
      <TopBar ref={barRef} night={night} onNest={() => router.push("/ninho")} onParents={() => router.push("/responsaveis")} />
      <NinoCard
        ref={cardRef}
        title={view.title}
        text={view.text}
        chip={view.chip || undefined}
        tone={view.tone}
        pose={pose}
        speaks={speaks}
        action={view.enter ? { label: "Entrar no farol", onPress: () => void enterFarol() } : undefined}
      />
      <div ref={veilRef} className="nz-veil" aria-hidden="true" />
    </div>
  );
}
