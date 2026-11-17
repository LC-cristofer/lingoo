"use client";

import { useEffect, useMemo } from "react";
import { narrator } from "@/audio/narrator";
import { useBackgroundMusic } from "@/audio/useBackgroundMusic";
import { Sticker } from "@/art/scenes/Sticker";
import { DaysCalendar } from "@/components/trail/DaysCalendar";
import { useToday } from "@/components/trail/useToday";
import { useTrailProgress } from "@/components/trail/TrailProgressProvider";
import { BottomNav } from "@/components/trail/kit/BottomNav";
import { MusicToggle } from "@/components/trail/kit/MusicToggle";
import { NightSky } from "@/components/trail/kit/NightSky";
import { UnitHeader } from "@/components/trail/kit/UnitHeader";
import { getLines, getPath, getUnit } from "@/domain/trail/content";
import { dueCards } from "@/domain/trail/memory";
import { emptyProgress } from "@/domain/trail/progress";
import type { ArtId, Narration } from "@/domain/trail/schema";

const EMPTY = emptyProgress();

/** Phase 1 stickers the album still knows how to show; the earned ones come from progress.legacy. */
const LEGACY_STICKERS: Record<string, { image: string; name: (lines: ReturnType<typeof getLines>) => Narration }> = {
  "sticker-fox": { image: "/content/forest-animals/sticker-fox.svg", name: (l) => l.legacyFox },
};

type AlbumUnit = { unitId: string; number: number; title: string; sticker: { id: string; art: ArtId; name: Narration } | null };

export default function AlbumPage() {
  useBackgroundMusic("album");
  const { progress, hydrated } = useTrailProgress();
  const shown = hydrated ? progress : EMPTY;
  const today = useToday();
  const lines = useMemo(() => getLines(), []);
  const legacy = Object.keys(shown.legacy?.stickers ?? {})
    .filter((id) => Object.hasOwn(LEGACY_STICKERS, id))
    .map((id) => ({ id, image: LEGACY_STICKERS[id].image, name: LEGACY_STICKERS[id].name(lines) }));

  useEffect(() => {
    void narrator.playNarration(getLines().album);
    return () => narrator.stop();
  }, []);

  const { withContent, soon } = useMemo(() => {
    const withContent: AlbumUnit[] = [];
    const soon: AlbumUnit[] = [];
    getPath().forEach((entry, index) => {
      const unit = entry.hasContent ? getUnit(entry.unitId) : null;
      if (!unit) {
        soon.push({ unitId: entry.unitId, number: index + 1, title: entry.title, sticker: null });
        return;
      }
      const challenge = unit.stops.find((s) => s.kind === "challenge");
      withContent.push({
        unitId: entry.unitId,
        number: index + 1,
        title: entry.title,
        sticker: challenge && challenge.kind === "challenge" && challenge.sticker ? challenge.sticker : null,
      });
    });
    return { withContent, soon };
  }, []);

  return (
    <div className="k-screen">
      <NightSky variant="map" />
      <div className="k-fixed-chips">
        <DaysCalendar progress={shown} />
        <MusicToggle />
      </div>
      <main className="k-album">
        {withContent.map((u) => {
          const earned = u.sticker ? Object.hasOwn(shown.stickers, u.sticker.id) : false;
          const sticker = u.sticker;
          return (
            <section key={u.unitId} className="k-album-unit" aria-label={`Unidade ${u.number}, ${u.title}`}>
              <div className="k-album-sign">
                <UnitHeader unitLabel={`Unidade ${u.number}`} title={u.title} done={earned ? 1 : 0} total={1} />
              </div>
              {sticker ? (
                <button
                  type="button"
                  className="k-album-sticker"
                  aria-disabled={earned ? undefined : "true"}
                  onClick={() => {
                    if (earned) void narrator.playNarration(sticker.name);
                  }}
                >
                  <Sticker art={sticker.art} earned={earned} size={200} />
                </button>
              ) : null}
            </section>
          );
        })}
        {legacy.length > 0 ? (
          <section className="k-album-unit k-album-legacy" aria-label="Figurinhas especiais">
            <button
              type="button"
              className="k-pill k-album-legacy-title"
              onClick={() => {
                narrator.unlock();
                void narrator.playNarration(lines.legacySection);
              }}
            >
              Figurinhas especiais
            </button>
            <div className="k-album-legacy-grid">
              {legacy.map(({ id, image, name }) => (
                <button
                  key={id}
                  type="button"
                  data-sticker={id}
                  data-earned="true"
                  aria-label={name.map((seg) => seg.text).join(" ")}
                  lang="en"
                  className="k-album-sticker"
                  onClick={() => {
                    narrator.unlock();
                    void narrator.playNarration(name);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- a fixed local SVG kept from phase 1 */}
                  <img src={image} alt="" width={160} height={160} />
                </button>
              ))}
            </div>
          </section>
        ) : null}
        {soon.length > 0 ? (
          <div className="k-album-soon">
            {soon.map((u) => (
              <UnitHeader key={u.unitId} unitLabel={`Unidade ${u.number}`} title={u.title} locked />
            ))}
          </div>
        ) : null}
      </main>
      <BottomNav active="album" memoryDue={today ? dueCards(shown.memory, today).length : 0} />
    </div>
  );
}
