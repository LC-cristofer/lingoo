/* Parallax camera: one {X, Y, D} drives every layer; `D` is the visible-width factor
   (smaller = closer). Layers offset D by LAYER_K so far ones zoom faster, near ones slower. */

export type Cam = { X: number; Y: number; D: number };
/** top/bottom are the UI insets in px (what the overview must leave free); left/right are the side panels' (0 when absent). */
export type Viewport = { w: number; h: number; top: number; bottom: number; left?: number; right?: number };

export const LAYER_K = { far: 2, mid: 0.8, island: 0, near: -0.12 } as const;

const base = (vp: Viewport) => (vp.w > vp.h ? Math.min(vp.w, vp.h * 0.75) : vp.w) / 1000;

/** Screen pixels per world unit of the island layer. */
export function ppu(cam: Cam, vp: Viewport): number { return base(vp) / cam.D; }

export function layerViewBox(cam: Cam, k: number, vp: Viewport): [number, number, number, number] | null {
  const d = cam.D + k;
  if (d <= 0.02) return null;
  const p = base(vp) * ((1 + k) / d), w = vp.w / p, h = vp.h / p;
  return [cam.X - w / 2, cam.Y - h / 2, w, h];
}

export function toScreen(cam: Cam, x: number, y: number, vp: Viewport): [number, number] {
  const p = ppu(cam, vp);
  return [(x - cam.X) * p + vp.w / 2, (y - cam.Y) * p + vp.h / 2];
}

/** Whole island (x 60–940, y 540–1880) between the UI insets, 12 px side margins. */
export function overviewCam(vp: Viewport): Cam {
  const l = vp.left ?? 0, r = vp.right ?? 0;
  const availW = Math.max(60, vp.w - 24 - l - r), availH = Math.max(60, vp.h - vp.top - vp.bottom);
  const pMax = Math.min(availW / 880, availH / 1340);
  const D = base(vp) / pMax;
  const p = base(vp) / D;
  const shift = (vp.top + (vp.h - vp.bottom)) / 2 - vp.h / 2; // px the free band's centre sits below the screen centre
  const shiftX = (l + (vp.w - r)) / 2 - vp.w / 2; // px the free band's centre sits right of the screen centre
  return { X: 500 - shiftX / p, Y: 1210 - shift / p, D };
}

/** Nest centre (500, 850) sits at 63% of the height. */
export function nestCloseCam(vp: Viewport): Cam {
  const D = 0.22;
  return { X: 500, Y: 850 - (0.13 * vp.h) / (base(vp) / D), D };
}

/** The nest close-up between the UI insets: its centre (500, 850) sits at the centre of the free band, and the nest with Nino (about 300 x 220 world units) always fits it. */
export function nestViewCam(vp: Viewport): Cam {
  const l = vp.left ?? 0, r = vp.right ?? 0;
  const availW = Math.max(60, vp.w - 24 - l - r), availH = Math.max(60, vp.h - vp.top - vp.bottom);
  const pMax = base(vp) / 0.22;
  const p = Math.min(pMax, availW / 300, availH / 220);
  const D = base(vp) / p;
  const shiftY = (vp.top + (vp.h - vp.bottom)) / 2 - vp.h / 2;
  const shiftX = (l + (vp.w - r)) / 2 - vp.w / 2;
  return { X: 500 - shiftX / p, Y: 850 - shiftY / p, D };
}

/* eslint-disable @typescript-eslint/no-unused-vars -- vp kept for a uniform camera signature */
export function farolCloseCam(_vp: Viewport): Cam { return { X: 790, Y: 1080, D: 0.36 }; }

/** Zoomed on a place: the approved phone framing, shifted sideways when a panel covers the left or right edge. */
export function focusCam(a: { x: number; y: number }, vp: Viewport): Cam {
  const cam = { X: 500 + (a.x - 500) * 0.7, Y: a.y + 230, D: 0.55 };
  const shiftX = ((vp.left ?? 0) - (vp.right ?? 0)) / 2;
  return shiftX ? { ...cam, X: cam.X - shiftX / ppu(cam, vp) } : cam;
}

/* eslint-enable @typescript-eslint/no-unused-vars */
const soft = (t: number) => 1 - Math.pow(1 - t, 4);

export function lerpCam(a: Cam, b: Cam, e: number): Cam {
  const lf = Math.log(a.D), lt = Math.log(b.D), ey = soft(Math.min(1, e * 1.15));
  return {
    D: Math.exp(lf + (lt - lf) * e),
    X: a.X + (b.X - a.X) * ey,
    Y: a.Y + (b.Y - a.Y) * ey - Math.sin(e * Math.PI) * 60,
  };
}
