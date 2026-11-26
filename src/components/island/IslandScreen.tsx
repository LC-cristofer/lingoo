"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { NinoPose } from "@/art/nino/poses";
import { poseState } from "@/art/nino/poses";
import { ambience } from "@/audio/ambience";
import { narrator } from "@/audio/narrator";
import type { Track } from "@/audio/music";
import { useBackgroundMusic } from "@/audio/useBackgroundMusic";
import { NinoCard, type ChipTone } from "@/components/nestoy/NinoCard";
import { useSettings } from "@/components/nestoy/SettingsProvider";
import { StageView, type StageInsets } from "@/components/nestoy/StageView";
import { useTrailProgress } from "@/components/trail/TrailProgressProvider";
import { useToday } from "@/components/trail/useToday";
import { useOptionalProfile } from "@/components/nestoy/ProfileProvider";
import { suggestedStop } from "@/domain/letras/access";
import { arvoreLevel, farolLevel, getAreaUnits, lastPlayedByArea, LAUNCH_STATES, suggestedPlace, wovenThreads } from "@/domain/nestoy/island-view";
import { defaultProfile } from "@/domain/nestoy/profile";
import { isNight, openingMode, pauseDue } from "@/domain/nestoy/settings";
import { getLines, getPath } from "@/domain/trail/content";
import { dateKey, emptyProgress } from "@/domain/trail/progress";
import { focusCam, nestCloseCam, overviewCam, type Viewport } from "@/world/camera";
import { PLACE_ANCHORS, type PlaceId, type PlaceState } from "@/world/island";
import type { Stage } from "@/world/stage";
import { diveIntoArvore, diveIntoFarol, focusPlace, goToArvore, goToFarol, settle, toOverview, type LineKey, type Say, type Sfx } from "./flows";
import { Opening } from "./Opening";
import { PauseOverlay } from "./PauseOverlay";
import { playOpening, showIsland, skipOpening, wakeEarly } from "./opening";
import { playBedtime, playReturn, returnPlan, settleArvore, settleFarol, wakeToIsland } from "./return";
import { Pins, PLACE_NAMES } from "./Pins";
import { readSession, SESSION_KEY, writeSession } from "./session-guard";
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

/** The evening counts for the date it started: after midnight (until 06:00) it is still yesterday's. */
const bedtimeKey = (now: Date) => `lingoo:bedtime:${dateKey(new Date(now.getTime() - 6 * 3_600_000))}`;

type Phase = "boot" | "opening" | "return" | "island" | "night" | "sleep" | "pause";
type Act = "enter" | "enterArvore" | "pause" | "wake";
type View = { title: string; text: string; chip: string; tone: ChipTone; act?: Act };
const EXPLORE: View = { title: "Vamos explorar?", text: "Toque num lugar da ilha.", chip: "", tone: "ok" };

function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" width="30" height="30" aria-hidden="true">
      <circle cx="10" cy="10" r="4.5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M10 1.5v2.5M10 16v2.5M1.5 10H4M16 10h2.5M4 4l1.8 1.8M14.2 14.2L16 16M4 16l1.8-1.8M14.2 5.8L16 4" />
      </g>
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 20 20" width="28" height="28" aria-hidden="true">
      <rect x="5" y="4" width="3.6" height="12" rx="1.5" fill="currentColor" />
      <rect x="11.4" y="4" width="3.6" height="12" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export type IslandScreenProps = {
  /** "auto": the visit decides what opens (the opening, the return from a stop, the bedtime). "explore": straight to the island. */
  mode?: "auto" | "explore";
  /** The stop the child has just finished (`?volta=`): it opens the return when it names a finished stop of the unit. */
  volta?: string | null;
  /** True while something must come first (the cadastro): the island stays asleep and nothing opens until it turns false. */
  held?: boolean;
  /** The live stage once mounted, and null once destroyed. */
  onStage?: (stage: Stage | null) => void;
};

/** The island home: the world stage, six place pins, the Nino card and the top bar; it also plays the opening, the return and the night. */
export function IslandScreen({ mode = "auto", volta = null, held = false, onStage }: IslandScreenProps) {
  const router = useRouter();
  const { settings, update, hydrated: settingsReady } = useSettings();
  const { progress, hydrated: progressReady } = useTrailProgress();
  const today = useToday();
  const areas = useMemo(() => getAreaUnits(), []);
  const unit = areas?.farol ?? null;
  const lines = useMemo(() => getLines(), []);
  const unitTitle = useMemo(() => getPath().find((u) => u.unitId === UNIT_ID)?.title ?? "", []);
  const profile = useOptionalProfile()?.profile ?? defaultProfile();
  const p = progressReady ? progress : EMPTY;
  const level = unit ? farolLevel(p, unit) : 1;
  const treeLevel = areas ? arvoreLevel(p, areas.letras) : 1;
  const woven = areas ? wovenThreads(p, areas) : [false, false];
  const suggestion = areas && today ? suggestedPlace(p, areas, today, lastPlayedByArea(p, areas)) : "farol";
  const suggested: PlaceId = suggestion === "arvore" ? "letras" : suggestion;
  // The card for the tree names the branch it suggests (as inside the tree).
  const branch = suggestedStop(p, profile)?.unit ?? 1;
  const branchTitle = getPath().find((u) => u.unitId === `letras-${branch}`)?.title ?? "";

  const [view, setView] = useState<View>(EXPLORE);
  const [focus, setFocus] = useState<PlaceId | null>(null);
  const [pose, setPose] = useState<NinoPose>("idle");
  const [speaks, setSpeaks] = useState(false);
  const [phase, setPhaseState] = useState<Phase>("boot");
  const [chrome, setChrome] = useState({ top: false, card: false });
  const [intro, setIntro] = useState(false); // the full opening runs: logo and "Pular"
  const [away, setAway] = useState(false);
  const [returning, setReturning] = useState<"farol" | "arvore" | null>(null); // the place the return opens on
  const [night, setNight] = useState(false);
  const [stage, setStage] = useState<Stage | null>(null);
  const [track, setTrack] = useState<Track | null>(null); // the trail music starts at arrival, never during the opening
  useBackgroundMusic(track);
  const ready = phase === "island";

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
  const phaseRef = useRef<Phase>("boot");
  const flowRef = useRef(0); // bumped by every interaction: an older flow stops touching the screen
  const veilRef = useRef<HTMLDivElement>(null);
  const zzRef = useRef<HTMLSpanElement>(null);
  const awayRef = useRef(false); // the dive is running or done: the island ignores taps
  const busyRef = useRef(false); // the bedtime or the pause suggestion is starting: no second one
  const pauseCardRef = useRef(false); // the "Que tal uma pausa?" card is up
  const pendingVolta = useRef<string | null>(null); // the stop to show the return for, until it has played
  const skipRef = useRef<() => void>(() => {});
  const tickRef = useRef<() => void>(() => {});
  const live = useRef({ settings, level, treeLevel, progress: p, volta, mode, update });
  useEffect(() => {
    live.current = { settings, level, treeLevel, progress: p, volta, mode, update };
  });
  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

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

  // The sleeping Nino's "z z z" follows the nest on screen.
  useEffect(() => {
    if (!stage) return;
    const place = () => {
      const el = zzRef.current;
      if (!el) return;
      const [x, y] = stage.screenOf(548, 770);
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    };
    place();
    return stage.onFrame(place);
  }, [stage]);

  const sfx = useMemo<Sfx>(() => (name) => narrator.playSfx(name), []);

  // ---- arrival: the opening, the return from a stop, or straight to the island ----
  useEffect(() => {
    const s = stageRef.current, vp = vpRef.current;
    if (!stage || !s || !vp || stage !== s) return;
    let cancelled = false;
    // The route may have been kept hidden: nothing of the last visit's transient UI survives an arrival.
    awayRef.current = false;
    setAway(false);
    if (veilRef.current) veilRef.current.style.opacity = "0";
    focusRef.current = null;
    setFocus(null);
    setView(EXPLORE);
    setPose("idle");
    setSpeaks(false);
    setIntro(false);
    setReturning(null);
    busyRef.current = false;
    pauseCardRef.current = false;
    idle.current = false;
    s.fx.intro.fade = 0;
    setTrack(null);

    if (!settingsReady || !progressReady || held) {
      // Waiting for the stored settings: the nest close-up, Nino asleep, nothing else yet.
      // (the screen starts in the "boot" phase with the chrome hidden, and hydration only ever flips once)
      s.moveNino("nest");
      Object.assign(s.nino.st, { x: 500, y: 1070, s: 0.56 }, poseState("sleep"));
      Object.assign(s.cam, nestCloseCam(vp));
      for (const id of Object.keys(s.fx.pins) as PlaceId[]) s.fx.pins[id] = 0;
      return;
    }

    const { settings: cfg, level: lv, treeLevel: tlv, progress: prog } = live.current;
    const now = new Date();
    // Opened after bedtime the island is simply night; the tick below puts Nino to bed once per launch of the app each evening on the routine (the guard lives in sessionStorage).
    const startNight = isNight(cfg, now);
    s.env.night = startNight ? 1 : 0;
    setNight(startNight);
    settleFarol(s, lv);
    settleArvore(s, tlv);
    ambience.play(startNight ? "night" : "day");
    if (readSession(SESSION_KEY) === null) writeSession(SESSION_KEY, String(Date.now()));

    // ?volta=<stop>: a finished stop of the unit opens the return; anything else opens to explore
    const named = live.current.volta;
    if (named) {
      pendingVolta.current = named;
      router.replace("/"); // a reload must not play it again
    }
    const plan = areas ? returnPlan(prog, areas, pendingVolta.current) : null;
    if (!plan) pendingVolta.current = null;
    let how = plan ? "return" : live.current.mode === "explore" ? "none" : openingMode(cfg, now, s.env.reduced);
    // Under reduced motion the 400 ms fade marks the day's first arrival only, not every return to the island.
    if (how === "reduced" && cfg.lastVisit === dateKey(now) && cfg.openingSeen) how = "none"; // a pending "Rever abertura" still plays
    live.current.update({ lastVisit: dateKey(now) });

    let interval: ReturnType<typeof setInterval> | undefined;
    const arrive = (keepCard: boolean) => {
      if (cancelled) return;
      pendingVolta.current = null;
      if (how === "full" || how === "reduced") live.current.update({ openingSeen: true });
      const v = vpRef.current ?? vp;
      Object.assign(s.cam, rest(v));
      idle.current = true;
      if (!keepCard) setView(EXPLORE);
      setPose("idle");
      setSpeaks(false);
      setIntro(false);
      setChrome({ top: true, card: true });
      setPhase("island");
      setTrack(startNight ? null : "trail");
      interval = setInterval(() => tickRef.current(), 30_000);
      tickRef.current();
    };

    let cardShown = false;
    // The nest card: with the spoken line when a sticker was kept, chip-only for a new thread alone.
    const showNestCard = () => {
      if (!plan || cardShown) return;
      setView({
        title: PLACE_NAMES.ninho,
        text: plan.sticker ? lines.nestSaved[0].text : "",
        chip: plan.newThread ? "Novo fio no ninho" : "Figurinha guardada",
        tone: "ok",
      });
      setChrome({ top: true, card: true });
      setPose("happy");
      cardShown = true;
    };
    const say: Say = async (key: LineKey) => {
      if (cancelled) return;
      if (key === "nestSaved") showNestCard();
      setSpeaks(true);
      await narrator.playNarration(lines[key]);
      if (!cancelled) setSpeaks(false);
    };

    if (how === "return" && plan) {
      setPhase("return");
      setReturning(plan.place);
      setChrome({ top: true, card: false });
      void playReturn(s, vp, plan, say, sfx, showNestCard).then(() => arrive(cardShown));
    } else if (how === "full" || how === "short") {
      setPhase("opening");
      setChrome({ top: false, card: false });
      setIntro(how === "full");
      skipRef.current = () => {
        if (cancelled || phaseRef.current !== "opening") return;
        narrator.stop();
        void skipOpening(s, vpRef.current ?? vp);
        arrive(false);
      };
      void playOpening(s, how, vp, say, sfx).then(() => arrive(false));
    } else if (how === "reduced") {
      // no camera, no hops: the island is there at once and a 400 ms fade clears over it
      void playOpening(s, "full", vp, say, sfx);
      arrive(false);
    } else {
      showIsland(s, vp);
      arrive(false);
    }

    return () => {
      cancelled = true;
      clearInterval(interval);
      s.tl.cancelAll();
      narrator.stop();
      ambience.stop();
    };
    // Settings and progress are read through `live`: only the stage and the hydration decide when an arrival starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, settingsReady, progressReady, held]);

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

  const restartSession = useCallback(() => writeSession(SESSION_KEY, String(Date.now())), []);

  const goOverview = useCallback(async () => {
    const s = stageRef.current, vp = vpRef.current;
    if (!s || !vp || awayRef.current || phaseRef.current !== "island" || focusRef.current === null) return;
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
    if (!s || !vp || awayRef.current || phaseRef.current !== "island") return;
    narrator.playSfx("tap");
    pendingVolta.current = null;
    if (pauseCardRef.current) {
      pauseCardRef.current = false; // the child kept playing: the next reminder counts from now
      restartSession();
    }
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
      setView({ title: PLACE_NAMES.farol, text: `Inglês · Unidade 1: ${unitTitle}`, chip: "Pronto", tone: "ok" });
      await goToFarol(s, vp);
      if (token !== flowRef.current) return;
      setPose("point");
      Object.assign(s.nino.st, poseState("point"));
      setView((v) => ({ ...v, act: "enter" }));
      await done();
      await speak(token, lines.placeFarol);
      if (token === flowRef.current) Object.assign(s.nino.st, poseState("idle"));
    } else if (id === "letras") {
      setView({ title: PLACE_NAMES.letras, text: `Inglês · Galho ${branch}: ${branchTitle}`, chip: "Pronto", tone: "ok" });
      await goToArvore(s, vp);
      if (token !== flowRef.current) return;
      setPose("point");
      Object.assign(s.nino.st, poseState("point"));
      setView((v) => ({ ...v, act: "enterArvore" }));
      await done();
      await speak(token, lines.placeArvore);
      if (token === flowRef.current) Object.assign(s.nino.st, poseState("idle"));
    } else {
      setView({ title: PLACE_NAMES[id], text: "Um lugar novo vai nascer aqui.", chip: "Em breve", tone: "futuro" });
      setPose("help");
      void speak(token, lines.soonUnit);
      await focusPlace(s, id, vp);
      await done();
    }
  }, [interrupt, lines, rest, restartSession, router, speak, unitTitle, branch, branchTitle]);

  const enterPlace = useCallback(async (place: "farol" | "arvore") => {
    const s = stageRef.current, vp = vpRef.current;
    if (!s || !vp) return;
    if (awayRef.current) return;
    awayRef.current = true;
    pendingVolta.current = null;
    const token = interrupt();
    idle.current = false;
    setAway(true);
    const fade = (v: number) => {
      if (veilRef.current) veilRef.current.style.opacity = v.toFixed(3);
    };
    await (place === "farol" ? diveIntoFarol(s, fade) : diveIntoArvore(s, fade));
    if (token !== flowRef.current) return;
    router.push(place === "farol" ? "/farol" : "/arvore");
  }, [interrupt, router]);

  // ---- the night and the pause ----
  const startBedtime = useCallback(async () => {
    const s = stageRef.current, vp = vpRef.current;
    if (!s || !vp || phaseRef.current !== "island" || busyRef.current || awayRef.current) return;
    busyRef.current = true;
    writeSession(bedtimeKey(new Date()), "1");
    const token = interrupt();
    idle.current = false;
    pauseCardRef.current = false;
    narrator.stop();
    setPhase("night");
    setNight(true);
    setPose("idle");
    setView({ title: "Hora de dormir", text: "A rotina foi combinada pelos responsáveis.", chip: live.current.settings.bedtime, tone: "noite" });
    setChrome({ top: true, card: true });
    ambience.play("night"); // crickets instead of the music
    setTrack(null);
    const say: Say = async (key) => {
      if (token !== flowRef.current) return;
      setSpeaks(true);
      await narrator.playNarration(lines[key]);
      if (token === flowRef.current) setSpeaks(false);
    };
    await playBedtime(s, vp, say, sfx);
    if (token !== flowRef.current) return;
    busyRef.current = false;
    setSpeaks(false);
    setPhase("sleep");
    setView({ title: "Hora de dormir", text: "A rotina foi combinada pelos responsáveis.", chip: live.current.settings.bedtime, tone: "noite", act: "wake" });
  }, [interrupt, lines, setPhase, sfx]);

  const wakeUp = useCallback(async () => {
    const s = stageRef.current, vp = vpRef.current;
    if (!s || !vp || phaseRef.current !== "sleep") return;
    const token = interrupt();
    setPhase("night");
    setView(EXPLORE);
    await wakeToIsland(s, vp, sfx);
    if (token !== flowRef.current) return;
    focusRef.current = null;
    idle.current = true;
    Object.assign(s.cam, overviewCam(vpRef.current ?? vp));
    setPhase("island");
  }, [interrupt, setPhase, sfx]);

  const startPause = useCallback(async () => {
    const s = stageRef.current;
    if (!s || phaseRef.current !== "island" || busyRef.current || awayRef.current || pauseCardRef.current) return;
    busyRef.current = true;
    pauseCardRef.current = true;
    const token = interrupt();
    const minutes = live.current.settings.pauseMinutes;
    setView({ title: "Que tal uma pausa?", text: "Você brincou bastante hoje.", chip: `Lembrete de ${minutes} min`, tone: "noite", act: "pause" });
    setPose("stretch");
    narrator.playSfx("stretch");
    setSpeaks(true);
    await narrator.playNarration(lines.pauseSuggest);
    busyRef.current = false;
    if (token !== flowRef.current) return;
    setSpeaks(false);
    setPose("idle");
  }, [interrupt, lines]);

  const doPause = useCallback(() => {
    if (phaseRef.current !== "island") return;
    narrator.stop();
    narrator.playSfx("tap");
    interrupt();
    pauseCardRef.current = false;
    setTrack(null);
    ambience.stop();
    setPhase("pause");
  }, [interrupt, setPhase]);

  const resume = useCallback(() => {
    restartSession();
    const dark = isNight(live.current.settings, new Date()) && live.current.settings.ambient !== "rotina";
    ambience.play(dark || stageRef.current?.env.night === 1 ? "night" : "day");
    setTrack(stageRef.current?.env.night === 1 ? null : "trail");
    setView({ title: "Oi de novo!", text: "Vamos continuar?", chip: "", tone: "ok" });
    setPose("wave");
    setPhase("island");
  }, [restartSession, setPhase]);

  // Every 30 s the island is idle: is it bedtime, or time for a break?
  useEffect(() => {
    tickRef.current = () => {
      if (phaseRef.current !== "island" || busyRef.current || awayRef.current || focusRef.current !== null) return;
      const cfg = live.current.settings, now = new Date();
      if (cfg.ambient === "rotina" && isNight(cfg, now) && readSession(bedtimeKey(now)) === null) {
        void startBedtime();
        return;
      }
      const startedAt = Number(readSession(SESSION_KEY));
      if (startedAt > 0 && !pauseCardRef.current && pauseDue(cfg, startedAt, Date.now())) void startPause();
    };
  }, [startBedtime, startPause]);

  /** A tap on the world: a place's body opens it, anything else (the sky, the sea) goes back to the whole island. */
  const tapWorld = (e: React.MouseEvent<HTMLDivElement>) => {
    const s = stageRef.current;
    if (!s || awayRef.current) return;
    if (phaseRef.current === "opening") {
      wakeEarly(s); // a tap on the sleeping Nino wakes him
      return;
    }
    if (phaseRef.current !== "island") return;
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
    else if (pauseCardRef.current) {
      pauseCardRef.current = false; // tapping the sky: keep playing
      restartSession();
      setView(EXPLORE);
    } else void goOverview();
  };

  const action =
    view.act === "enter" ? { label: "Entrar no farol", onPress: () => void enterPlace("farol") }
    : view.act === "enterArvore" ? { label: "Entrar na árvore", onPress: () => void enterPlace("arvore") }
    : view.act === "pause" ? { label: "Pausar", onPress: doPause, icon: <PauseIcon /> }
    : view.act === "wake" ? { label: "Brincar mais um pouco", onPress: () => void wakeUp(), icon: <SunIcon /> }
    : undefined;
  const glow = focus ?? suggested;
  return (
    <div
      className="nz-screen nz-island"
      data-ready={ready}
      data-away={away}
      data-focus={focus ?? "none"}
      data-phase={phase}
      data-return={returning ?? "none"}
      data-top={chrome.top}
      data-card={chrome.card}
      data-testid="island"
    >
      {/* While the break overlay is up everything behind it is inert: no focus, no taps, no reading. */}
      <div className="nz-inert-wrap" inert={phase === "pause"}>
        <StageView scene="island" states={LAUNCH_STATES} threads={woven} farolLevel={level} arvoreLevel={treeLevel} insets={insets} onStage={onStageMount} onViewport={onViewport} />
        <div className="nz-island-sky" data-testid="island-sky" onClick={tapWorld} />
        <span ref={zzRef} className="nz-zz" aria-hidden="true"><span>z</span><span>z</span><span>z</span></span>
        <Pins stage={stage} states={STATES} glow={ready ? glow : null} onPress={(id) => void pressPlace(id)} />
        <TopBar
          ref={barRef}
          night={night}
          onNest={() => { pendingVolta.current = null; router.push("/ninho"); }}
          onParents={() => { pendingVolta.current = null; restartSession(); router.push("/responsaveis"); }}
        />
        <NinoCard
          ref={cardRef}
          title={view.title}
          text={view.text}
          chip={view.chip || undefined}
          tone={view.tone}
          pose={pose}
          speaks={speaks}
          action={action}
        />
        <Opening stage={stage} active={intro} onSkip={() => skipRef.current()} />
        <div ref={veilRef} className="nz-veil" aria-hidden="true" />
      </div>
      {phase === "pause" ? <PauseOverlay onResume={resume} /> : null}
    </div>
  );
}
