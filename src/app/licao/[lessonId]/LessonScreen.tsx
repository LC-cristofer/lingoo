"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { narrator } from "@/audio/narrator";
import { BigButton } from "@/components/BigButton";
import { Mascot } from "@/components/Mascot";
import { useProgress } from "@/components/ProgressProvider";
import { PlayIcon } from "@/components/lesson/icons";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { getLesson, getWorlds } from "@/domain/content";
import { placeStatus } from "@/domain/progress";

export function LessonScreen({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const { progress, hydrated } = useProgress();
  const [started, setStarted] = useState(false);
  const lesson = getLesson(lessonId);
  const world = getWorlds().find((w) => w.places.some((p) => p.lessonId === lessonId));
  const status = world ? placeStatus(world, progress, lessonId) : "locked";
  const allowed = lesson !== null && (status === "open" || status === "done");

  useEffect(() => {
    if (hydrated && !allowed) router.replace("/mapa");
  }, [hydrated, allowed, router]);

  if (!hydrated || !lesson || !allowed) return null;

  // Opened by URL or reload: no touch yet, so audio is locked. The first step must be heard,
  // so the player mounts only after one big ▶ tap unlocks the narrator.
  if (!started && !narrator.isUnlocked()) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-10 bg-sky/20 p-4">
        <div className="scale-150">
          <Mascot mood="happy" />
        </div>
        <BigButton
          label="Começar"
          color="leaf"
          onPress={() => {
            narrator.unlock();
            setStarted(true);
          }}
        >
          <PlayIcon />
        </BigButton>
      </main>
    );
  }
  return <LessonPlayer lesson={lesson} onExit={() => router.push("/mapa")} />;
}
