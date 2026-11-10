import type { CSSProperties, ReactNode } from "react";
import { ART_WORDS, Animal } from "../Animal";
import { Cat, type CatExpression } from "../Cat";
import type { ArtId, SceneId } from "@/domain/trail/schema";
import { ForestBackdrop } from "./ForestBackdrop";
import { Branch, Cheese, Pond, WEB_VIEW, Web } from "./props";

// A story page: the soft forest, the gatinho, the scene's props and one tappable animal per
// hotspot. Positions are fractions of the scene box (0–1), measured to the centre of each figure.
// The scene fills its container; give the container a size (the sheet uses 16:10).

export type Hotspot = { wordId: ArtId; x: number; y: number };

type Place = { x: number; y: number };
type CatPlacement = Place & { expression: CatExpression; walking?: boolean };

const CAT_PLACES: Record<SceneId, CatPlacement> = {
  "forest-walk": { x: 0.5, y: 0.6, expression: "idle", walking: true },
  "forest-bear": { x: 0.24, y: 0.63, expression: "pointing" },
  "forest-bird": { x: 0.24, y: 0.63, expression: "pointing" },
  "forest-pond": { x: 0.13, y: 0.62, expression: "pointing" },
  "forest-web": { x: 0.13, y: 0.64, expression: "pointing" },
  "forest-goodbye": { x: 0.51, y: 0.5, expression: "happy" },
};

const CAT_WIDTH = "max(88px, 19%)";
const ANIMAL_WIDTH = "max(96px, 22%)";
const HOTSPOT_MIN = "88px";

const pct = (n: number) => `${+(n * 100).toFixed(2)}%`;

/** Puts the point (anchorX, anchorY) of the element (fractions of its own box) at `at`. */
function placed({ x, y }: Place, width: string, z: number, anchorX = 0.5, anchorY = 0.5): CSSProperties {
  return {
    position: "absolute",
    left: pct(x),
    top: pct(y),
    width,
    transform: `translate(${pct(-anchorX)}, ${pct(-anchorY)})`,
    zIndex: z,
  };
}

/** Characters lower in the scene stand in front of the ones behind them. */
const depth = (y: number) => 10 + Math.round(y * 100);

type PropProps = { name: string; at: Place; width: string; anchorX?: number; anchorY?: number; children: ReactNode };

function Prop({ name, at, width, anchorX, anchorY, children }: PropProps) {
  return (
    <div data-prop={name} aria-hidden="true" style={placed(at, width, 2, anchorX, anchorY)}>
      {children}
    </div>
  );
}

function Props({ scene, hotspots }: { scene: SceneId; hotspots: Hotspot[] }) {
  const find = (id: ArtId) => hotspots.find((h) => h.wordId === id);
  if (scene === "forest-bird") {
    // The bird perches on a branch that reaches in from the right edge, just under its feet
    // (the feet sit about 13% of the scene height below the centre of a 22%-wide animal).
    const bird = find("bird") ?? { x: 0.62, y: 0.28 };
    const left = bird.x - 0.09;
    return (
      <Prop name="branch" at={{ x: left, y: bird.y + 0.135 }} width={pct(1.02 - left)} anchorX={0} anchorY={64 / 120}>
        <Branch />
      </Prop>
    );
  }
  if (scene === "forest-pond") {
    return (
      <Prop name="pond" at={{ x: 0.58, y: 0.8 }} width="66%">
        <Pond />
      </Prop>
    );
  }
  if (scene === "forest-web") {
    // The web hangs behind the spider and the cheese sits by the mouse, wherever they are.
    const spider = find("spider") ?? { x: 0.3, y: 0.3 };
    const mouse = find("mouse") ?? { x: 0.7, y: 0.75 };
    return (
      <>
        <Prop
          name="web"
          at={{ x: spider.x, y: spider.y - 0.02 }}
          width="27%"
          anchorY={(WEB_VIEW.centre - WEB_VIEW.top) / WEB_VIEW.height}
        >
          <Web />
        </Prop>
        <Prop name="cheese" at={{ x: mouse.x - 0.12, y: mouse.y + 0.11 }} width="10%">
          <Cheese />
        </Prop>
      </>
    );
  }
  return null;
}

export function StoryScene({
  scene,
  hotspots,
  onHotspot,
  glowId,
}: {
  scene: SceneId;
  hotspots: Hotspot[];
  onHotspot: (wordId: ArtId) => void;
  glowId?: ArtId;
}) {
  const cat = CAT_PLACES[scene];
  return (
    <div data-scene={scene} className="art-scene" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <ForestBackdrop variant="story" />
      <Props scene={scene} hotspots={hotspots} />
      <div aria-hidden="true" className={cat.walking ? "art-scene-cat art-walk" : "art-scene-cat"} style={placed(cat, CAT_WIDTH, depth(cat.y))}>
        <Cat expression={cat.expression} />
      </div>
      {hotspots.map((h) => (
        <button
          key={h.wordId}
          type="button"
          className="art-hotspot"
          aria-label={ART_WORDS[h.wordId]}
          lang="en"
          data-hotspot={h.wordId}
          onClick={() => onHotspot(h.wordId)}
          style={{ ...placed(h, ANIMAL_WIDTH, depth(h.y)), minWidth: HOTSPOT_MIN, minHeight: HOTSPOT_MIN }}
        >
          <span aria-hidden="true">
            <Animal id={h.wordId} glow={glowId === h.wordId} />
          </span>
        </button>
      ))}
    </div>
  );
}
