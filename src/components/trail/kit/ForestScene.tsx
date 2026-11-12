import type { ReactNode } from "react";
import { Flower, Mushroom, Pine, RoundTree } from "@/art/scenes/ForestBackdrop";

type Variant = "trail" | "lesson" | "start";

/** A little drawing anchored at a percentage point of the scene (its origin is the anchor). */
function Spot({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <svg className="k-deco" style={{ left: `${x}%`, top: `${y}%` }} width="1" height="1" overflow="visible" aria-hidden="true">
      {children}
    </svg>
  );
}

function Clouds() {
  return (
    <g fill="#fff" opacity=".95">
      <ellipse cx="70" cy="150" rx="46" ry="16" />
      <ellipse cx="92" cy="138" rx="26" ry="18" />
      <ellipse cx="240" cy="118" rx="38" ry="13" />
      <ellipse cx="258" cy="108" rx="22" ry="15" />
    </g>
  );
}

/** Sky and three hills; the 390 × `h` box is stretched over the scene (shapes only, no text). */
function Hills({ g, h, clouds }: { g: number; h: number; clouds?: boolean }) {
  return (
    <>
      <rect width="390" height={h} fill="#8FD0FF" />
      <rect width="390" height={h * 0.2} fill="#7CC6FF" />
      {clouds ? <Clouds /> : null}
      <path d={`M0 ${g} Q97 ${g - 54} 195 ${g - 14} T390 ${g - 30} V${h} H0Z`} fill="#A6DDA3" />
      <path d={`M0 ${g + 40} Q117 ${g} 234 ${g + 34} T390 ${g + 22} V${h} H0Z`} fill="#7FCF85" />
      <path d={`M0 ${g + 84} Q156 ${g + 58} 273 ${g + 80} T390 ${g + 70} V${h} H0Z`} fill="#5CC46B" />
    </>
  );
}

/**
 * The illustrated forest backdrop (version A). It is absolutely positioned and fills its parent
 * (which must be `position: relative` or similar); the trail variant repeats the meadow, so it fits
 * a map of any height.
 */
export function ForestScene({ variant, trees = false }: { variant: Variant; trees?: boolean }) {
  if (variant === "lesson") {
    return (
      <div className="k-scene" aria-hidden="true">
        <svg viewBox="0 0 390 844" preserveAspectRatio="none" className="k-scene-layer">
          <Hills g={371} h={844} />
          <ellipse cx="78" cy="692" rx="132" ry="44" fill="#52B861" />
          <ellipse cx="328" cy="785" rx="117" ry="40" fill="#68CE77" />
        </svg>
        <Spot x={8} y={86}>
          <Flower x={0} y={0} color="#FF8FA3" />
        </Spot>
        <Spot x={16} y={93}>
          <Flower x={0} y={0} color="#fff" />
        </Spot>
        <Spot x={90} y={84}>
          <Mushroom x={0} y={0} />
        </Spot>
        <Spot x={80} y={95}>
          <Flower x={0} y={0} color="#fff" />
        </Spot>
        <Spot x={30} y={97}>
          <Mushroom x={0} y={0} />
        </Spot>
        {trees ? (
          <>
            <Spot x={7} y={47}>
              <Pine x={0} y={0} s={0.7} />
            </Spot>
            <Spot x={93} y={46}>
              <RoundTree x={0} y={0} s={0.6} />
            </Spot>
          </>
        ) : null}
      </div>
    );
  }
  // "trail" and "start": sky and hills on top, then a meadow that repeats down to any height.
  return (
    <div className={`k-scene is-${variant}`} aria-hidden="true">
      <svg viewBox="0 0 390 460" preserveAspectRatio="none" className="k-scene-top">
        <Hills g={250} h={460} clouds={variant === "trail"} />
      </svg>
      <svg className="k-scene-meadow" width="100%" height="100%">
        <defs>
          <pattern id={`k-meadow-${variant}`} width="390" height="300" patternUnits="userSpaceOnUse">
            <ellipse cx="86" cy="60" rx="133" ry="46" fill="#52B861" />
            <ellipse cx="304" cy="130" rx="117" ry="38" fill="#68CE77" />
            <ellipse cx="312" cy="210" rx="133" ry="46" fill="#52B861" />
            <ellipse cx="78" cy="280" rx="117" ry="38" fill="#68CE77" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#k-meadow-${variant})`} />
      </svg>
    </div>
  );
}
