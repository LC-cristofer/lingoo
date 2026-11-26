"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { poseState } from "@/art/nino/poses";
import { ambience } from "@/audio/ambience";
import { music } from "@/audio/music";
import { useProfile } from "@/components/nestoy/ProfileProvider";
import { useSettings } from "@/components/nestoy/SettingsProvider";
import { StageView } from "@/components/nestoy/StageView";
import { CloseIcon } from "@/components/trail/icons";
import { NAME_MAX, type Age, type English } from "@/domain/nestoy/profile";
import { isNight, type Settings } from "@/domain/nestoy/settings";
import { overviewCam, type Viewport } from "@/world/camera";
import type { PlaceId } from "@/world/island";
import type { Stage } from "@/world/stage";
import { HoldGate } from "./HoldGate";

type Option<T> = { value: T; label: string };

function Segment<T extends string | number | boolean | null>({ label, value, options, onChange, hint }: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="np-field">
      <span id={id} className="np-label">{label}</span>
      <div role="group" aria-labelledby={id} className="np-seg">
        {options.map((o) => (
          <button key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
      {hint ? <p className="np-hint">{hint}</p> : null}
    </div>
  );
}

/** The parents' area: a held button opens a sheet over the dimmed island with the routine and the preferences. */
export function ParentsScreen() {
  const router = useRouter();
  const { settings, update, hydrated } = useSettings();
  const { profile, update: updateProfile } = useProfile();
  const nameId = useId();
  const [opened, setOpened] = useState(false);
  // A kept-alive page that is hidden runs this cleanup: the gate is closed again on the next arrival.
  useEffect(() => () => setOpened(false), []);
  const musicOn = useSyncExternalStore(music.subscribe, music.isEnabled, () => true);

  const stageRef = useRef<Stage | null>(null);
  const vpRef = useRef<Viewport | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const onStage = useCallback((s: Stage | null) => {
    stageRef.current = s;
    setStage(s);
  }, []);
  const onViewport = useCallback((vp: Viewport) => {
    vpRef.current = vp;
    if (stageRef.current) Object.assign(stageRef.current.cam, overviewCam(vp));
  }, []);
  useEffect(() => {
    const s = stageRef.current;
    if (!stage || !s) return;
    s.moveNino("nest");
    Object.assign(s.nino.st, { x: 500, y: 1070, s: 0.56 }, poseState("idle"));
    for (const id of Object.keys(s.fx.pins) as PlaceId[]) s.fx.pins[id] = 0;
    s.env.night = hydrated && isNight(settings, new Date()) ? 1 : 0;
    if (vpRef.current) Object.assign(s.cam, overviewCam(vpRef.current));
  }, [stage, settings, hydrated]);

  // A cue while the sheet still has options below the fold (the last rows hide under the Fechar footer on a phone).
  const sheetRef = useRef<HTMLElement>(null);
  const [more, setMore] = useState(false);
  const checkMore = useCallback(() => {
    const el = sheetRef.current;
    setMore(!!el && el.scrollHeight - el.scrollTop - el.clientHeight > 24);
  }, []);
  useEffect(() => {
    if (!opened) return;
    checkMore();
    window.addEventListener("resize", checkMore);
    return () => window.removeEventListener("resize", checkMore);
  }, [opened, checkMore, settings.ambient]);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => update({ [key]: value } as Partial<Settings>);
  const close = () => router.push("/");

  return (
    <div className="nz-screen np-screen" data-testid="parents" data-open={opened}>
      <StageView scene="island" farolLevel={1} insets={{ top: 0, bottom: 0 }} onStage={onStage} onViewport={onViewport} />
      <div className="np-dim" aria-hidden="true" />
      {!opened ? (
        <section className="np-gate" aria-label="Área dos responsáveis">
          <h1 className="np-title">Área dos responsáveis</h1>
          <p className="np-hint">Para adultos. Segure o botão por 2 segundos.</p>
          <HoldGate onOpen={() => setOpened(true)} />
          <button type="button" className="np-back" aria-label="Voltar para a ilha" onClick={close}>
            <CloseIcon size={24} />
          </button>
        </section>
      ) : (
        <section ref={sheetRef} className="np-sheet" aria-label="Área dos responsáveis" onScroll={checkMore}>
          <h1 className="np-title">Área dos responsáveis</h1>

          <section className="np-child" aria-labelledby="np-child-h">
            <h2 id="np-child-h" className="np-sub">Criança</h2>
            <div className="np-field">
              <label htmlFor={nameId} className="np-label">Nome</label>
              <input
                id={nameId}
                className="np-text"
                type="text"
                maxLength={NAME_MAX}
                autoComplete="off"
                value={profile.name}
                onChange={(e) => updateProfile({ name: e.target.value.slice(0, NAME_MAX) })}
              />
              <p className="np-hint">Só aparece escrito, no ninho e aqui.</p>
            </div>
            <Segment<Age | null>
              label="Idade"
              value={profile.age}
              options={[4, 5, 6, 7, 8, 9].map((a) => ({ value: a as Age, label: a === 9 ? "9+" : String(a) }))}
              onChange={(v) => updateProfile({ age: v })}
            />
            <Segment<English | null>
              label="Contato com inglês"
              value={profile.english}
              options={[
                { value: "none", label: "Nenhum ainda" },
                { value: "words", label: "Conhece algumas palavras" },
                { value: "alphabet", label: "Sabe o alfabeto em inglês" },
                { value: "reads", label: "Lê palavras simples em inglês" },
              ]}
              onChange={(v) => updateProfile({ english: v })}
              hint="Muda só por onde a árvore sugere começar. O que a criança já fez continua."
            />
          </section>

          <Segment
            label="Ambiente da ilha"
            value={settings.ambient}
            options={[
              { value: "dia", label: "Sempre dia" },
              { value: "rotina", label: "Seguir a rotina" },
              { value: "noite", label: "Noite" },
            ]}
            onChange={(v) => set("ambient", v)}
            hint="Na rotina, a ilha anoitece no horário que vocês escolherem (ex.: 19:30). O relógio do aparelho sozinho não decide nada."
          />
          {settings.ambient === "rotina" ? (
            <label className="np-time">
              <span className="np-label">Horário de dormir</span>
              <input
                type="time"
                value={settings.bedtime}
                onChange={(e) => {
                  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(e.target.value)) set("bedtime", e.target.value);
                }}
              />
            </label>
          ) : null}

          <Segment
            label="Lembrete de pausa"
            value={settings.pauseMinutes}
            options={[
              { value: 0, label: "Desligado" },
              { value: 15, label: "15 min" },
              { value: 20, label: "20 min" },
              { value: 30, label: "30 min" },
            ]}
            onChange={(v) => set("pauseMinutes", v)}
            hint="O Nino sugere a pausa com carinho. A criança pode continuar."
          />

          <Segment
            label="Abertura"
            value={settings.opening}
            options={[
              { value: "auto", label: "Completa só na 1ª vez" },
              { value: "curta", label: "Sempre curta" },
            ]}
            onChange={(v) => set("opening", v)}
          />
          <button
            type="button"
            className="np-action"
            onClick={() => {
              update({ openingSeen: false, opening: "auto" });
              router.push("/");
            }}
          >
            Rever abertura
          </button>

          <Segment
            label="Movimento"
            value={settings.motion}
            options={[
              { value: "auto", label: "Seguir o aparelho" },
              { value: "reduzir", label: "Reduzir movimento" },
            ]}
            onChange={(v) => set("motion", v)}
          />

          <Segment
            label="Música"
            value={musicOn}
            options={[
              { value: true, label: "Ligada" },
              { value: false, label: "Desligada" },
            ]}
            onChange={(on) => {
              music.setEnabled(on);
              if (!on) ambience.stop();
            }}
            hint="Desligada, a ilha fica também sem o som de ambiente."
          />

          <div className="np-foot">
            {more ? <span className="np-more" aria-hidden="true" data-testid="more-cue">Mais opções abaixo ↓</span> : null}
            <button type="button" className="np-close" onClick={close}>Fechar</button>
          </div>
        </section>
      )}
    </div>
  );
}
