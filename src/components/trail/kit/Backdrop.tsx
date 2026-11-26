"use client";

import { createContext, useContext } from "react";
import { ARVORE_HEIGHT, ARVORE_LANDINGS, buildArvoreInterior } from "@/world/arvore-interior";
import { FAROL_LANDINGS, buildFarolInterior } from "@/world/farol-interior";

export type BackdropVariant = "sky" | "interior" | "night" | "farol" | "arvore";

/** Which landing the screen is "standing" on (an index into FAROL_LANDINGS, or into ARVORE_LANDINGS inside the tree): set by the stop screen. */
export const LandingContext = createContext<number | null>(null);

/** Which interior the stop screens behind "farol" backdrops show: the stop screen of a letras unit says "arvore". */
export const InteriorContext = createContext<"farol" | "arvore">("farol");

const DEFAULT_LANDING = 2;
/** The interior is 1000 wide; the view shows a 1400-tall slice of it, centred on the landing and kept inside the wall. */
const VIEW_H = 1400;
const WORLD_H = 2700;

let interiorMarkup: string | null = null;
/** The interior picture, built once. Its ids are renamed or dropped so they never clash with the farol stage's (that one may be hidden). */
function interior(): string {
  interiorMarkup ??= buildFarolInterior()
    .replace(/ id="(?!fi-)[^"]*"/g, "")
    .replaceAll('id="fi-', 'id="bd-')
    .replaceAll("url(#fi-", "url(#bd-");
  return interiorMarkup;
}

let arvoreMarkup: string | null = null;
/** The tree's interior, built once, with its own `bt-` ids (the farol's picture may be on the page too). */
function arvore(): string {
  arvoreMarkup ??= buildArvoreInterior()
    .replace(/ id="(?!ai-)[^"]*"/g, "")
    .replaceAll('id="ai-', 'id="bt-')
    .replaceAll("url(#ai-", "url(#bt-");
  return arvoreMarkup;
}

function ArvorePicture({ landing }: { landing: number }) {
  const L = ARVORE_LANDINGS[Math.max(0, Math.min(ARVORE_LANDINGS.length - 1, landing))];
  const top = Math.max(0, Math.min(ARVORE_HEIGHT - VIEW_H, L.y - VIEW_H / 2));
  return (
    <>
      <svg className="k-farol-pic" viewBox={`0 ${top} 1000 ${VIEW_H}`} preserveAspectRatio="xMidYMid slice" focusable="false" dangerouslySetInnerHTML={{ __html: arvore() }} />
      <i className="k-veil" />
    </>
  );
}

function FarolPicture({ landing }: { landing: number }) {
  const L = FAROL_LANDINGS[Math.max(0, Math.min(FAROL_LANDINGS.length - 1, landing))];
  const top = Math.max(0, Math.min(WORLD_H - VIEW_H, L.y - VIEW_H / 2));
  return (
    <>
      <svg className="k-farol-pic" viewBox={`0 ${top} 1000 ${VIEW_H}`} preserveAspectRatio="xMidYMid slice" focusable="false" dangerouslySetInnerHTML={{ __html: interior() }} />
      <i className="k-veil" />
    </>
  );
}

/**
 * The full-bleed background of a screen, behind everything, with the paper grain over it.
 * sky: the day sky (map, start, memory home). interior: a warm stone wall with a soft vignette.
 * night: the night gradient. farol: the farol's interior, still, blurred and veiled in cream, centred on the stop's landing
 * (inside the Árvore das Letras' stops, the same slot shows the tree's trunk instead; "arvore" asks for it outright).
 * Decorative: hidden from screen readers, never takes a tap.
 */
export function Backdrop({ variant = "sky" }: { variant?: BackdropVariant }) {
  const landing = useContext(LandingContext);
  const interiorOf = useContext(InteriorContext);
  const tree = variant === "arvore" || (variant === "farol" && interiorOf === "arvore");
  return (
    <div className={`k-backdrop is-${tree ? "arvore" : variant}`} data-variant={tree ? "arvore" : variant} aria-hidden="true">
      {tree ? <ArvorePicture landing={landing ?? 0} /> : variant === "farol" ? <FarolPicture landing={landing ?? DEFAULT_LANDING} /> : null}
      <i className="k-grain" />
    </div>
  );
}
