import { FAROL_LANDINGS } from "@/world/farol-interior";
import { ppu, type Cam, type Viewport } from "@/world/camera";

/** Width of the room the child sees, in world units (the approved phone framing: D 0.66 at 390 px). */
export const ROOM_SHOWN = 660;
/** Wide screens show more of the room, down to this much staircase height (world units): the stop below and the stop above stay in view. */
const STAIR_SPAN = 640;
/** The widest slice of the room a screen shows (the wall art reaches 1800 units). */
const ROOM_MAX = 1300;
/** Radius of a stop's face, in world units (see farol-interior). */
export const STOP_R = 62;
/** Where Nino stands next to a landing: towards the middle of the staircase, a little lower than the face. */
export function ninoSpot(index: number): { x: number; y: number } {
  const L = FAROL_LANDINGS[index];
  return { x: L.x + (L.x < 500 ? 110 : -110), y: L.y + 36 };
}

/**
 * The interior camera that frames landing `index`: the room keeps the same width on every upright screen (wider
 * ones, which have little height, show more of it so the neighbouring stops stay visible), the
 * landing sits 60% down the free band (so the next stops show above it) and, when a side panel covers
 * `leftReserved` px, in the middle of what is left. X leans towards the stair's axis so both neighbouring
 * landings stay in view.
 */
export function landingCam(vp: Viewport, index: number, leftReserved = 0): Cam {
  const L = FAROL_LANDINGS[Math.max(0, Math.min(FAROL_LANDINGS.length - 1, index))];
  const base = ppu({ X: 0, Y: 0, D: 1 }, vp);
  const band = Math.max(1, vp.h - vp.top - vp.bottom);
  const shown = Math.min(ROOM_MAX, Math.max(ROOM_SHOWN, (STAIR_SPAN * vp.w) / band));
  const D = (shown * base) / vp.w;
  const p = base / D;
  const tx = (leftReserved + vp.w) / 2;
  // Upright screens put the landing 60% down so the next stops show above it; wide ones (more room) 50%, so the stop below it clears the card.
  const ty = vp.top + band * (vp.w > vp.h ? 0.5 : 0.6);
  const focusX = 500 + (L.x - 500) * 0.4;
  return { X: focusX - (tx - vp.w / 2) / p, Y: L.y - 18 - (ty - vp.h / 2) / p, D };
}
