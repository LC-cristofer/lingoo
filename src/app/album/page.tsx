"use client";

import { useEffect, useMemo, useRef } from "react";
import { Cat } from "@/art/Cat";
import { Sticker } from "@/art/scenes/Sticker";
import { narrator } from "@/audio/narrator";
import { BottomNav } from "@/components/trail/kit/BottomNav";
import { Bubble } from "@/components/trail/kit/Bubble";
import { ForestScene } from "@/components/trail/kit/ForestScene";
import { WoodSign } from "@/components/trail/kit/WoodSign";
import { NarrationText } from "@/components/trail/NarrationText";
import { useTrailProgress } from "@/components/trail/TrailProgressProvider";
import { getLines, getPath, getUnit } from "@/domain/trail/content";
import type { LessonStop, Narration, Unit } from "@/domain/trail/schema";

type AlbumUnit = { unit: Unit; number: number; stickers: NonNullable<LessonStop["sticker"]>[] };

/** One page per unit with content: a slot for each sticker its challenges give. */
function albumUnits(): AlbumUnit[] {
  const out: AlbumUnit[] = [];
  getPath().forEach((entry, i) => {
    if (!entry.hasContent) return;
    const unit = getUnit(entry.unitId);
    if (!unit) return;
    const stickers = unit.stops.flatMap((s) => (s.kind === "challenge" && s.sticker ? [s.sticker] : []));
    out.push({ unit, number: i + 1, stickers });
  });
  return out;
}

export default function AlbumPage() {
  const { progress, hydrated } = useTrailProgress();
  const lines = useMemo(() => getLines(), []);
  const pages = useMemo(() => albumUnits(), []);
  const greeted = useRef(false);
  // Phase 1 stickers this device earned and the album knows how to show (data stays in progress.legacy).
  const legacyStickers: Record<string, { image: string; name: Narration }> = {
    "sticker-fox": { image: "/content/forest-animals/sticker-fox.svg", name: lines.legacyFox },
  };
  const legacy = Object.keys(progress.legacy?.stickers ?? {})
    .filter((id) => Object.hasOwn(legacyStickers, id))
    .map((id) => [id, legacyStickers[id]] as const);

  useEffect(() => {
    if (!hydrated || greeted.current) return;
    greeted.current = true;
    void narrator.playNarration(lines.album);
  }, [hydrated, lines.album]);

  useEffect(() => () => narrator.stop(), []);

  return (
    <main className="k-screen">
      <ForestScene variant="trail" />
      <div className="k-stage k-album">
        <div className="k-hello">
          <Bubble tail="down">
            <NarrationText narration={lines.album} />
          </Bubble>
          <span className="k-cat">
            <Cat expression="happy" size={110} />
          </span>
        </div>
        {hydrated
          ? pages.map(({ unit, number, stickers }) => {
              const earned = stickers.filter((s) => Object.hasOwn(progress.stickers, s.id)).length;
              return (
                <section key={unit.id} className="k-album-page" aria-label={unit.title}>
                  <WoodSign
                    unitLabel={`Unidade ${number}`}
                    title={unit.title}
                    done={earned}
                    total={stickers.length}
                    onPress={() => void narrator.playNarration(unit.banner)}
                  />
                  <div className="k-album-grid">
                    {stickers.map((s) => {
                      const has = Object.hasOwn(progress.stickers, s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          data-sticker={s.id}
                          data-earned={has ? "true" : "false"}
                          aria-label={has ? s.name.map((seg) => seg.text).join(" ") : "Figurinha trancada"}
                          lang={has ? "en" : undefined}
                          className="k-album-slot min-h-16 min-w-16"
                          onClick={() => {
                            if (!has) return;
                            narrator.playSfx("tap");
                            void narrator.playNarration(s.name);
                          }}
                        >
                          <Sticker art={s.art} earned={has} size={150} />
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })
          : null}
        {hydrated && legacy.length > 0 ? (
          <section className="k-album-page" aria-label="Figurinhas especiais">
            <button
              type="button"
              aria-label="Figurinhas especiais"
              className="k-star-line min-h-16"
              onClick={() => void narrator.playNarration(lines.legacySection)}
            >
              Figurinhas especiais
            </button>
            <div className="k-album-grid">
              {legacy.map(([id, sticker]) => (
                <button
                  key={id}
                  type="button"
                  data-sticker={id}
                  data-earned="true"
                  aria-label={sticker.name.map((seg) => seg.text).join(" ")}
                  lang="en"
                  className="k-album-slot k-album-legacy min-h-16 min-w-16"
                  onClick={() => {
                    narrator.playSfx("tap");
                    void narrator.playNarration(sticker.name);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- a fixed local SVG from phase 1 */}
                  <img src={sticker.image} alt="" width={150} height={150} />
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <BottomNav active="album" showMemory={false} />
    </main>
  );
}
