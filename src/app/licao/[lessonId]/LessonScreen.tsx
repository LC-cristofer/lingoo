"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProgress } from "@/components/ProgressProvider";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { getLesson, getWorlds } from "@/domain/content";
import { placeStatus } from "@/domain/progress";

export function LessonScreen({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const { progress, hydrated } = useProgress();
  const lesson = getLesson(lessonId);
  const world = getWorlds().find((w) => w.places.some((p) => p.lessonId === lessonId));
  const status = world ? placeStatus(world, progress, lessonId) : "locked";
  const allowed = lesson !== null && (status === "open" || status === "done");

  useEffect(() => {
    if (hydrated && !allowed) router.replace("/mapa");
  }, [hydrated, allowed, router]);

  if (!hydrated || !lesson || !allowed) return null;
  return <LessonPlayer lesson={lesson} onExit={() => router.push("/mapa")} />;
}
