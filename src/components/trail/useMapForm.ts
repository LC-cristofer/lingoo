"use client";

import { useEffect, useState } from "react";
import type { MapForm } from "@/domain/trail/trail-layout";

/** The same breakpoint as the kit's tablet rules in kit.css. */
export const TABLET_QUERY = "(min-width: 900px) and (orientation: landscape)";

/** "tablet" on a wide landscape screen, "phone" otherwise (and during SSR). */
export function useMapForm(): MapForm {
  const [form, setForm] = useState<MapForm>("phone");
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(TABLET_QUERY);
    const update = () => setForm(mq.matches ? "tablet" : "phone");
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return form;
}
