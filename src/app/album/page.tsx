"use client";

import { useRouter } from "next/navigation";
import { narrator } from "@/audio/narrator";
import { BigButton } from "@/components/BigButton";
import { ArrowIcon } from "@/components/lesson/icons";
import { useProgress } from "@/components/ProgressProvider";
import { getLesson, getWorlds } from "@/domain/content";
import type { Media } from "@/domain/content-schema";

type AlbumSticker = { id: string; image: string; name: Media };

function allStickers(): AlbumSticker[] {
  const out: AlbumSticker[] = [];
  for (const world of getWorlds()) {
    for (const place of world.places) {
      if (!place.hasContent) continue;
      const step = getLesson(place.lessonId)?.steps.find((s) => s.kind === "sticker");
      if (step && step.kind === "sticker") {
        out.push({ id: step.stickerId, image: step.image, name: step.name });
      }
    }
  }
  return out;
}

export default function AlbumPage() {
  const router = useRouter();
  const { progress, hydrated } = useProgress();
  const stickers = allStickers();
  return (
    <main className="flex flex-1 flex-col gap-6 p-4">
      <div className="-scale-x-100 self-start">
        <BigButton label="Voltar" color="sky" onPress={() => router.push("/mapa")}>
          <ArrowIcon />
        </BigButton>
      </div>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stickers.map((s) => {
          const earned = hydrated && Object.hasOwn(progress.stickers, s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-label={earned ? s.name.text : "?"}
                data-earned={earned ? "true" : "false"}
                onClick={() => earned && void narrator.play(s.name)}
                className="flex aspect-square w-full items-center justify-center rounded-3xl bg-white p-4 shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt=""
                  className="h-full w-full object-contain"
                  style={earned ? undefined : { filter: "grayscale(1) brightness(0.6)", opacity: 0.4 }}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
