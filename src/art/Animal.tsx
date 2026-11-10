import type { ComponentType } from "react";
import type { ArtId } from "@/domain/trail/schema";
import { Bear } from "./animals/Bear";
import { Bird } from "./animals/Bird";
import { Frog } from "./animals/Frog";
import { Mouse } from "./animals/Mouse";
import { Snake } from "./animals/Snake";
import { Spider } from "./animals/Spider";
import { SUN, Sparkle } from "./shared";

// Every animal is drawn in the same 200 × 210 space (ground shadow at y = 200, as the approved
// bear). The frame adds a margin around it so the glow halo fits inside the square viewBox.
const VIEW_BOX = "-20 -12 240 240";

const DRAWINGS: Record<ArtId, ComponentType> = {
  bear: Bear,
  bird: Bird,
  frog: Frog,
  snake: Snake,
  spider: Spider,
  mouse: Mouse,
};

/** The English word each drawing stands for: its accessible name. */
export const ART_WORDS: Record<ArtId, string> = {
  bear: "bear",
  bird: "bird",
  frog: "frog",
  snake: "snake",
  spider: "spider",
  mouse: "mouse",
};

function Glow() {
  return (
    <g aria-hidden="true">
      <g className="art-glow-halo">
        <circle cx="100" cy="108" r="114" fill={SUN} opacity=".16" />
        <circle cx="100" cy="108" r="96" fill={SUN} opacity=".22" />
        <circle cx="100" cy="108" r="78" fill={SUN} opacity=".3" />
      </g>
      <Sparkle className="art-glow-sparkle" x={0} y={18} r={13} />
      <Sparkle className="art-glow-sparkle" x={200} y={8} r={16} />
      <Sparkle className="art-glow-sparkle" x={208} y={140} r={10} />
      <Sparkle className="art-glow-sparkle" x={-8} y={150} r={9} />
    </g>
  );
}

export function Animal({ id, size = 200, glow = false }: { id: ArtId; size?: number; glow?: boolean }) {
  const Drawing = DRAWINGS[id];
  return (
    <svg
      viewBox={VIEW_BOX}
      width={size}
      height={size}
      role="img"
      aria-label={ART_WORDS[id]}
      lang="en"
      data-art={id}
      data-glow={glow ? "true" : undefined}
      className="art-animal"
    >
      {glow ? <Glow /> : null}
      <Drawing />
    </svg>
  );
}
