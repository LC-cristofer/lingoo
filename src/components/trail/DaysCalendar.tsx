"use client";

import { useSyncExternalStore } from "react";
import { weekDays, type Progress } from "@/domain/trail/progress";
import { TopChips, type WeekDay } from "./kit/TopChips";

const BLANK_WEEK: WeekDay[] = Array.from({ length: 7 }, (_, i) => ({ date: `blank-${i}`, played: false, isToday: false }));

const subscribe = () => () => {};
/** Today's local date as "Y-M-D": a primitive, so the snapshot is stable between reads. */
const clientToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const serverToday = (): string | null => null;

/**
 * The chips at the top of the map and the album: stars earned (finished stops) and the week,
 * Monday first, with a sun on every day played. "Today" is only known on the client, so the
 * server render (and the hydration pass) shows a blank week and the real one follows.
 */
export function DaysCalendar({ progress, now }: { progress: Progress; now?: Date }) {
  const today = useSyncExternalStore(subscribe, clientToday, serverToday);
  let when = now ?? null;
  if (!when && today) {
    const [y, m, d] = today.split("-").map(Number);
    when = new Date(y, m, d, 12);
  }
  const week = when ? weekDays(progress, when) : BLANK_WEEK;
  return <TopChips stars={Object.keys(progress.completedStops).length} week={week} />;
}
