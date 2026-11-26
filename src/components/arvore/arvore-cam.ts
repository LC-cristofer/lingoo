import { framingCam, STOP_R } from "@/components/farol/landing-cam";
import type { Cam, Viewport } from "@/world/camera";
import { ARVORE_LANDINGS } from "@/world/arvore-interior";

export { STOP_R };

const clamp = (i: number) => Math.max(0, Math.min(ARVORE_LANDINGS.length - 1, i));

/** The interior camera that frames platform `index` of the tree (same framing as the farol's landings). */
export function arvoreCam(vp: Viewport, index: number, leftReserved = 0): Cam {
  return framingCam(ARVORE_LANDINGS[clamp(index)], vp, leftReserved);
}

/** Where Nino stands next to a platform: towards the middle of the trunk, a little lower than the face. */
export function arvoreNinoSpot(index: number): { x: number; y: number } {
  const L = ARVORE_LANDINGS[clamp(index)];
  return { x: L.x + (L.x < 500 ? 110 : -110), y: L.y + 36 };
}
