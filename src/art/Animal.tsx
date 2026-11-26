import type { ComponentType } from "react";
import { artIdSchema, type ArtId } from "@/domain/trail/schema";
import { Bear } from "./animals/Bear";
import { Bird } from "./animals/Bird";
import { Frog } from "./animals/Frog";
import { Mouse } from "./animals/Mouse";
import { Snake } from "./animals/Snake";
import { Spider } from "./animals/Spider";
import { Apple } from "./words/Apple";
import { Ball } from "./words/Ball";
import { Cat } from "./words/Cat";
import { Dog } from "./words/Dog";
import { Egg } from "./words/Egg";
import { Fish } from "./words/Fish";
import { Goat } from "./words/Goat";
import { Hat } from "./words/Hat";
import { Igloo } from "./words/Igloo";
import { Jam } from "./words/Jam";
import { Kite } from "./words/Kite";
import { Lion } from "./words/Lion";
import { Moon } from "./words/Moon";
import { Nest } from "./words/Nest";
import { Orange } from "./words/Orange";
import { Pig } from "./words/Pig";
import { Queen } from "./words/Queen";
import { Rain } from "./words/Rain";
import { Sun } from "./words/Sun";
import { Tree } from "./words/Tree";
import { Umbrella } from "./words/Umbrella";
import { Van } from "./words/Van";
import { Web } from "./words/Web";
import { Box } from "./words/Box";
import { Yoyo } from "./words/Yoyo";
import { Zebra } from "./words/Zebra";
import { Bed } from "./words/Bed";
import { Bus } from "./words/Bus";
import { Cup } from "./words/Cup";
import { Fox } from "./words/Fox";
import { Hen } from "./words/Hen";
import { MapWord } from "./words/MapWord";
import { Net } from "./words/Net";
import { Glyph, glyphText } from "./glyphs/Glyph";
import { SUN, Sparkle } from "./shared";

// Every animal is drawn in the same 200 × 210 space (ground shadow at y = 200, as the approved
// bear). The frame adds a margin around it so the glow halo fits inside the square viewBox.
const VIEW_BOX = "-20 -12 240 240";

const DRAWINGS: Partial<Record<ArtId, ComponentType>> = {
  bear: Bear,
  bird: Bird,
  frog: Frog,
  snake: Snake,
  spider: Spider,
  mouse: Mouse,
  apple: Apple,
  ball: Ball,
  cat: Cat,
  dog: Dog,
  egg: Egg,
  fish: Fish,
  goat: Goat,
  hat: Hat,
  igloo: Igloo,
  jam: Jam,
  kite: Kite,
  lion: Lion,
  moon: Moon,
  nest: Nest,
  orange: Orange,
  pig: Pig,
  queen: Queen,
  rain: Rain,
  sun: Sun,
  tree: Tree,
  umbrella: Umbrella,
  van: Van,
  web: Web,
  box: Box,
  yoyo: Yoyo,
  zebra: Zebra,
  bed: Bed,
  bus: Bus,
  cup: Cup,
  fox: Fox,
  hen: Hen,
  map: MapWord,
  net: Net,
};

/** The English word each drawing stands for: its accessible name. */
export const ART_WORDS = Object.fromEntries(
  artIdSchema.options.map((id) => [id, DRAWINGS[id] ? id : glyphText(id)]),
) as Record<ArtId, string>;

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
  // Letter and word cards are glyph cards; every picture word has its own drawing.
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
      {Drawing ? <Drawing /> : <Glyph id={id} />}
    </svg>
  );
}
