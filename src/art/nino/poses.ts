import type { Arm, NinoState } from "./rig";

/** Arm table of the approved prototype (shoulder x, y, quadratic control and end offsets). */
export const ARM = {
  downL: [64, 158, -6, 18, 4, 28], downR: [136, 158, 6, 18, -4, 28],
  upL: [62, 152, -34, -10, -44, -42], upR: [138, 152, 34, -10, 44, -42],
  stretchL: [62, 148, -22, -26, -12, -76], stretchR: [138, 148, 22, -26, 12, -76],
  pointR: [136, 150, 30, -6, 52, -18], helpR: [136, 156, 22, -6, 26, -34],
  waveR: [138, 150, 30, -14, 40, -50], restL: [66, 160, -8, 14, 2, 26],
} as const satisfies Record<string, Arm>;

export type NinoPose = "sleep" | "idle" | "happy" | "point" | "help" | "wave" | "stretch" | "listen";
export type NinoReaction = "correct" | "retry" | "hint" | "celebrate" | "tap" | "greet" | "locked";

const arm = (a: Arm): Arm => [...a];

/** The state fields a pose sets; the rest (position, scale, walking) are left to the caller. */
export function poseState(p: NinoPose): Partial<NinoState> {
  switch (p) {
    case "sleep":
      return { eyes: "closed", mouth: "smile", head: 9, headY: 0, earL: 0, armL: arm(ARM.downL), armR: arm(ARM.downR), pawL: 0, pawR: 0, breathe: 2.2, sy: 1, sx: 1, lookX: 0, lookY: 0 };
    case "idle":
      return { eyes: "open", mouth: "smile", head: 0, headY: 0, earL: 0, armL: arm(ARM.downL), armR: arm(ARM.downR), pawL: 0, pawR: 0, breathe: 1, sy: 1, sx: 1, lookX: 0, lookY: 0 };
    case "happy":
      return { eyes: "happy", mouth: "big", head: 0, headY: 0, earL: 0, armL: arm(ARM.upL), armR: arm(ARM.upR), pawL: 1, pawR: 1, breathe: 1, sy: 1, sx: 1, lookX: 0, lookY: 0 };
    case "point":
      return { eyes: "open", mouth: "smile", head: 0, headY: 0, earL: 0, armL: arm(ARM.downL), armR: arm(ARM.pointR), pawL: 0, pawR: 1, breathe: 1, sy: 1, sx: 1, lookX: 4, lookY: 0 };
    case "help":
      return { eyes: "open", mouth: "soft", head: -6, headY: 0, earL: 0, armL: arm(ARM.downL), armR: arm(ARM.helpR), pawL: 0, pawR: 1, breathe: 1, sy: 1, sx: 1, lookX: 0, lookY: 0 };
    case "wave":
      return { eyes: "open", mouth: "big", head: 4, headY: 0, earL: 0, armL: arm(ARM.downL), armR: arm(ARM.waveR), pawL: 0, pawR: 1, breathe: 1, sy: 1, sx: 1, lookX: 0, lookY: 0 };
    case "stretch":
      return { eyes: "happy", mouth: "yawn", head: 0, headY: 0, earL: 0, armL: arm(ARM.stretchL), armR: arm(ARM.stretchR), pawL: 1, pawR: 1, breathe: 1, sy: 1.08, sx: 0.95, lookX: 0, lookY: 0 };
    case "listen":
      // The "listening" expression of Cat.tsx: the left ear tilts and the eyes look up towards it.
      return { eyes: "open", mouth: "smile", head: 0, headY: 0, earL: -20, armL: arm(ARM.downL), armR: arm(ARM.downR), pawL: 0, pawR: 0, breathe: 1, sy: 1, sx: 1, lookX: -3, lookY: -6 };
  }
}

/** The pose a reaction borrows while it lasts, and the extra motion it adds (see Nino.tsx). */
export const REACTION_POSE: Record<NinoReaction, NinoPose> = {
  correct: "happy",
  celebrate: "happy",
  retry: "help",
  hint: "point",
  greet: "wave",
  tap: "idle",
  locked: "idle",
};
