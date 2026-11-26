"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Nino } from "@/art/nino/Nino";
import type { NinoPose } from "@/art/nino/poses";
import { narrator } from "@/audio/narrator";
import { useProfile } from "@/components/nestoy/ProfileProvider";
import { HoldGate } from "@/components/parents/HoldGate";
import { Backdrop } from "@/components/trail/kit/Backdrop";
import { ChunkyButton } from "@/components/trail/kit/ChunkyButton";
import { NAME_MAX, type Age, type English } from "@/domain/nestoy/profile";
import { getLines } from "@/domain/trail/content";
import "./onboarding.css";

type Step = "gate" | "name" | "age" | "english" | "done";

const AGES: { value: Age; label: string }[] = [
  { value: 4, label: "4" },
  { value: 5, label: "5" },
  { value: 6, label: "6" },
  { value: 7, label: "7" },
  { value: 8, label: "8" },
  { value: 9, label: "9+" },
];
const ENGLISH: { value: English; label: string }[] = [
  { value: "none", label: "Nenhum ainda" },
  { value: "words", label: "Conhece algumas palavras" },
  { value: "alphabet", label: "Sabe o alfabeto em inglês" },
  { value: "reads", label: "Lê palavras simples em inglês" },
];
const POSE: Record<Step, NinoPose> = { gate: "wave", name: "idle", age: "idle", english: "idle", done: "happy" };

/**
 * The cadastro, on the first opening: a cream sheet over the sky with Nino, one question per screen.
 * `existing`: the install already has progress, so it may be put off ("Agora não") once and for all.
 */
export function OnboardingScreen({ existing }: { existing: boolean }) {
  const { update } = useProfile();
  const lines = useMemo(() => getLines(), []);
  const [step, setStep] = useState<Step>("gate");
  const [name, setName] = useState("");
  const [age, setAge] = useState<Age | null>(null);
  const [english, setEnglish] = useState<English | null>(null);
  const headRef = useRef<HTMLHeadingElement>(null);

  // Every arrival (a kept-alive route shows again) starts at the gate, with Nino asking for a grown-up.
  useEffect(() => {
    void narrator.playNarration(lines.callAdult);
    return () => {
      narrator.stop();
      setStep("gate");
      setName("");
      setAge(null);
      setEnglish(null);
    };
  }, [lines]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headRef.current?.focus();
  }, [step]);

  const finish = (e: English) => {
    update({ name: name.trim().slice(0, NAME_MAX), age, english: e, onboarding: "done" });
  };

  return (
    <div className="ob-screen" data-testid="onboarding" data-step={step}>
      <Backdrop variant="sky" />
      <section className="ob-sheet" aria-label="Cadastro da criança">
        {step === "gate" ? (
          // A child who cannot read hears "Chame um adulto!" again by touching Nino (the first touch also unlocks audio).
          <button type="button" className="ob-nino ob-nino-btn" aria-label="Ouvir de novo" onClick={() => void narrator.playNarration(lines.callAdult)}>
            <Nino pose={POSE[step]} size={132} speaks />
          </button>
        ) : (
          <div className="ob-nino" aria-hidden="true">
            <Nino pose={POSE[step]} size={132} speaks={false} />
          </div>
        )}

        {step === "gate" ? (
          <>
            <h1 ref={headRef} tabIndex={-1} className="ob-title">Chame um adulto!</h1>
            <p className="ob-hint">Um adulto segura o botão por 2 segundos para fazer o cadastro.</p>
            <HoldGate onOpen={() => setStep("name")} />
          </>
        ) : null}

        {step === "name" ? (
          <>
            <h1 ref={headRef} tabIndex={-1} className="ob-title">Como a criança se chama?</h1>
            <p className="ob-hint">O nome só aparece escrito, nunca é falado. Pode pular.</p>
            <form
              className="ob-form"
              onSubmit={(e) => {
                e.preventDefault();
                setStep("age");
              }}
            >
              <input
                className="ob-input"
                type="text"
                aria-label="Nome da criança"
                maxLength={NAME_MAX}
                autoComplete="off"
                autoCapitalize="words"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
              />
              <div className="ob-row">
                <ChunkyButton label="Pular" tone="cream" size="lg" onPress={() => { setName(""); setStep("age"); }}>Pular</ChunkyButton>
                <ChunkyButton label="Seguir" tone="ok" size="lg" onPress={() => setStep("age")}>Seguir</ChunkyButton>
              </div>
            </form>
          </>
        ) : null}

        {step === "age" ? (
          <>
            <h1 ref={headRef} tabIndex={-1} className="ob-title">Quantos anos a criança tem?</h1>
            <div className="ob-ages" role="group" aria-label="Idade">
              {AGES.map((a) => (
                <ChunkyButton key={a.value} label={a.label} tone="cream" size="lg" className="ob-age" onPress={() => { setAge(a.value); setStep("english"); }}>
                  {a.label}
                </ChunkyButton>
              ))}
            </div>
          </>
        ) : null}

        {step === "english" ? (
          <>
            <h1 ref={headRef} tabIndex={-1} className="ob-title">Contato com inglês</h1>
            <p className="ob-hint">O que a criança já conhece? Isso só escolhe por onde começar.</p>
            <div className="ob-options" role="group" aria-label="Contato com inglês">
              {ENGLISH.map((o) => (
                <ChunkyButton key={o.value} label={o.label} tone="cream" size="lg" className="ob-option" onPress={() => { setEnglish(o.value); setStep("done"); }}>
                  {o.label}
                </ChunkyButton>
              ))}
            </div>
          </>
        ) : null}

        {step === "done" ? (
          <>
            <h1 ref={headRef} tabIndex={-1} className="ob-title">Tudo certo!</h1>
            <p className="ob-hint">O cadastro pode ser mudado depois na área dos responsáveis.</p>
            <ChunkyButton label="Pronto!" tone="ok" size="lg" className="ob-go" onPress={() => english && finish(english)}>Pronto!</ChunkyButton>
          </>
        ) : null}

        {existing ? (
          <button type="button" className="ob-later" onClick={() => update({ onboarding: "skipped" })}>Agora não</button>
        ) : null}
      </section>
    </div>
  );
}
