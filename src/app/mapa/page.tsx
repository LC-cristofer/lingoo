"use client";

import { useRouter } from "next/navigation";
import { BigButton } from "@/components/BigButton";
import { WorldMap } from "@/components/map/WorldMap";
import { useUnlockOnTouch } from "@/components/map/useUnlockOnTouch";
import { BookIcon } from "@/components/lesson/icons";
import { useProgress } from "@/components/ProgressProvider";
import { getWorlds } from "@/domain/content";
import { emptyProgress } from "@/domain/progress";

export default function MapPage() {
  const router = useRouter();
  const { progress, hydrated } = useProgress();
  useUnlockOnTouch();
  const world = getWorlds()[0];
  return (
    <main className="relative flex-1 p-4">
      <div className="absolute right-4 top-4 z-10">
        <BigButton label="Álbum" color="coral" onPress={() => router.push("/album")}>
          <BookIcon />
        </BigButton>
      </div>
      <WorldMap
        world={world}
        progress={hydrated ? progress : emptyProgress()}
        onOpen={(id) => router.push(`/licao/${id}`)}
      />
    </main>
  );
}
