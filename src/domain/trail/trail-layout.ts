/**
 * Where things sit on the trail map, in the coordinates of the approved mockups
 * (`tools/visual/mockups.tsx`): a 390 px wide column on a phone held upright, and a
 * 1024 px wide scene on a tablet on its side. Pure data, no React.
 */

export type MapForm = "phone" | "tablet";
export type Side = "left" | "right";
export type Point = [number, number];
export type Placed = { x: number; y: number; side: Side };
export type Decoration = { kind: "pine" | "round" | "mush" | "flower" | "pond"; x: number; y: number; s?: number };
export type LockedUnitPlace = { sign: { x: number; y: number; w: number }; ghosts: { x: number; y: number }[] };
export type MapLayout = {
  width: number;
  height: number;
  stops: Placed[];
  sign: { x: number; y: number; w: number };
  /** The current stop's gatinho and bubble go on the roomier side of it. */
  guideGap: number;
  stopSize: number;
  units: LockedUnitPlace[];
  /** The trail, through the stops and every ghost stop, to the bottom edge. */
  trail: Point[];
  decorations: Decoration[];
};

export const MAP_WIDTH: Record<MapForm, number> = { phone: 390, tablet: 1024 };

const POINTS: Record<MapForm, Point[]> = {
  phone: [
    [118, 236],
    [214, 324],
    [278, 412],
    [206, 500],
    [118, 588],
    [196, 676],
  ],
  tablet: [
    [540, 128],
    [680, 226],
    [774, 324],
    [670, 422],
    [540, 520],
    [650, 618],
  ],
};
const SIDES: Record<MapForm, Side[]> = {
  phone: ["right", "left", "left", "right", "right", "right"],
  tablet: ["right", "right", "right", "right", "left", "left"],
};
/** Vertical step between stops, used to continue the zigzag past the mockup's six points. */
const STEP: Record<MapForm, number> = { phone: 88, tablet: 98 };
/** The ghost stops' zigzag under a locked unit sign (x only; y follows STEP). */
const GHOST_X: Record<MapForm, number[]> = { phone: [128, 222, 284, 212], tablet: [560, 680, 760, 660] };

const DECORATIONS: Record<MapForm, Decoration[]> = {
  phone: [
    { kind: "pine", x: 26, y: 330, s: 0.62 },
    { kind: "round", x: 352, y: 322, s: 0.5 },
    { kind: "pine", x: 356, y: 470, s: 0.9 },
    { kind: "round", x: 30, y: 520, s: 0.72 },
    { kind: "pine", x: 20, y: 700, s: 1 },
    { kind: "round", x: 360, y: 660, s: 0.8 },
    { kind: "mush", x: 310, y: 560 },
    { kind: "flower", x: 60, y: 420 },
    { kind: "flower", x: 330, y: 750 },
    { kind: "mush", x: 86, y: 760 },
  ],
  tablet: [
    { kind: "pine", x: 60, y: 330, s: 0.8 },
    { kind: "pine", x: 130, y: 346, s: 0.56 },
    { kind: "round", x: 940, y: 330, s: 0.7 },
    { kind: "pine", x: 990, y: 350, s: 0.6 },
    { kind: "round", x: 930, y: 520, s: 0.95 },
    { kind: "pine", x: 410, y: 610, s: 0.9 },
    { kind: "pine", x: 60, y: 760, s: 1.25 },
    { kind: "round", x: 330, y: 760, s: 0.9 },
    { kind: "mush", x: 800, y: 560 },
    { kind: "flower", x: 380, y: 430 },
    { kind: "flower", x: 780, y: 700 },
    { kind: "mush", x: 270, y: 640 },
    { kind: "flower", x: 880, y: 740 },
    { kind: "pond", x: 210, y: 556 },
  ],
};

/** The start screen's trees and flowers, in the 390×844 / 1024×768 mockup frames. */
export const START_DECORATIONS: Record<MapForm, Decoration[]> = {
  phone: [
    { kind: "pine", x: 30, y: 360, s: 0.8 },
    { kind: "pine", x: 78, y: 380, s: 0.56 },
    { kind: "round", x: 350, y: 356, s: 0.7 },
    { kind: "pine", x: 350, y: 620, s: 1.1 },
    { kind: "round", x: 34, y: 640, s: 0.9 },
    { kind: "flower", x: 100, y: 690 },
    { kind: "mush", x: 292, y: 720 },
    { kind: "flower", x: 320, y: 800 },
  ],
  tablet: [
    { kind: "round", x: 560, y: 322, s: 0.6 },
    { kind: "round", x: 950, y: 340, s: 0.8 },
    { kind: "pine", x: 1004, y: 366, s: 0.6 },
    { kind: "pine", x: 70, y: 740, s: 1.3 },
    { kind: "round", x: 980, y: 730, s: 1.1 },
    { kind: "flower", x: 300, y: 700 },
    { kind: "mush", x: 740, y: 720 },
    { kind: "flower", x: 820, y: 610 },
  ],
};
export const SCREEN_SIZE: Record<MapForm, { w: number; h: number }> = { phone: { w: 390, h: 844 }, tablet: { w: 1024, h: 768 } };

/** The first unit's stops: the mockup's points, then the zigzag continued if a unit has more. */
export function stopPositions(form: MapForm, count: number): Placed[] {
  const pts = POINTS[form];
  const sides = SIDES[form];
  return Array.from({ length: count }, (_, i) => {
    if (i < pts.length) return { x: pts[i][0], y: pts[i][1], side: sides[i] };
    const [x, y] = pts[i % pts.length];
    const extra = Math.floor(i / pts.length) * pts.length * STEP[form];
    return { x, y: y + extra, side: sides[i % sides.length] };
  });
}

/** The whole map for the first unit (`stopCount` stops) followed by `lockedUnits` locked units. */
export function mapLayout(form: MapForm, lockedUnits: number, stopCount = 6): MapLayout {
  const width = MAP_WIDTH[form];
  const step = STEP[form];
  const stops = stopPositions(form, stopCount);
  const last = stops[stops.length - 1];
  const signW = form === "phone" ? 290 : 300;
  const units: LockedUnitPlace[] = [];
  // Phone: centred under the trail. Tablet: the first sign sits bottom-right, as in the mockup.
  let y = form === "phone" ? last.y + step + 30 : last.y + 46;
  for (let u = 0; u < lockedUnits; u++) {
    const signX = form === "phone" ? Math.round((width - signW) / 2) : width - signW - 30;
    const sign = { x: signX, y, w: signW };
    const ghosts = GHOST_X[form].map((x, i) => ({ x, y: y + 130 + i * step }));
    units.push({ sign, ghosts });
    y = ghosts[ghosts.length - 1].y + step + 30;
  }
  const height = Math.max(form === "phone" ? 844 : 768, y + (form === "phone" ? 60 : 40));
  const trail: Point[] = [
    ...stops.map((s): Point => [s.x, s.y]),
    ...units.flatMap((u): Point[] => [[u.sign.x + u.sign.w / 2, u.sign.y + 40], ...u.ghosts.map((g): Point => [g.x, g.y])]),
  ];
  return {
    width,
    height,
    stops,
    sign: form === "phone" ? { x: 20, y: 66, w: 350 } : { x: 28, y: 84, w: 380 },
    guideGap: form === "phone" ? 0 : 60,
    stopSize: form === "phone" ? 76 : 84,
    units,
    trail,
    decorations: DECORATIONS[form],
  };
}

/** A smooth S-curve through the points (vertical tangents), optionally running on to `extendTo`. */
export function trailPath(points: Point[], extendTo?: number): string {
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const dy = (y1 - y0) / 2;
    d += ` C${x0} ${y0 + dy} ${x1} ${y1 - dy} ${x1} ${y1}`;
  }
  if (extendTo !== undefined) {
    const [x, y] = points[points.length - 1];
    d += ` C${x} ${y + 50} ${x + 30} ${extendTo - 40} ${x + 30} ${extendTo}`;
  }
  return d;
}
