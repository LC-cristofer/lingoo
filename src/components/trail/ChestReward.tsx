"use client";

import { useEffect, useState } from "react";
import { Chest } from "@/art/scenes/Chest";
import { Sticker } from "@/art/scenes/Sticker";
import { narrator } from "@/audio/narrator";
import type { Lines, LessonStop } from "@/domain/trail/schema";
import { ChunkyButton } from "./kit/ChunkyButton";
import { ForestScene } from "./kit/ForestScene";
import { NarrationText } from "./NarrationText";

type ChestRewardProps = {
  stop: LessonStop;
  lines: Lines;
  onBack: () => void;
};

/** The challenge's prize, presentation only (the sticker is recorded on entering the closing). */
export function ChestReward({ stop, lines, onBack }: ChestRewardProps) {
  const [open, setOpen] = useState(false);
  const sticker = stop.sticker;

  useEffect(() => {
    void narrator.playNarration(lines.chestPrompt);
    return () => narrator.stop();
  }, [lines.chestPrompt]);

  if (!sticker) {
    return (
      <div className="k-screen">
        <ForestScene variant="lesson" />
        <div className="k-stage justify-center">
          <ChunkyButton label="Voltar ao mapa" tone="sun" size="lg" onPress={onBack}>
            Voltar ao mapa
          </ChunkyButton>
        </div>
      </div>
    );
  }

  const openChest = () => {
    if (open) return;
    setOpen(true);
    narrator.playSfx("chest");
    void narrator.playNarration([...lines.chestOpen, ...sticker.name]);
  };

  return (
    <div className="k-screen">
      <ForestScene variant="lesson" trees />
      <div className="k-stage">
        <p className="k-star-line" style={{ marginTop: 24 }}>
          <NarrationText narration={open ? [...lines.chestOpen, ...sticker.name] : lines.chestPrompt} />
        </p>
        <div className="k-prize" style={{ flex: 1, flexWrap: "wrap" }}>
          <button
            type="button"
            aria-label="Abrir o baú"
            disabled={open}
            onClick={openChest}
            className="k-prize-open min-h-16 min-w-16"
          >
            <Chest open={open} size={open ? 240 : 300} />
          </button>
          {open ? <Sticker art={sticker.art} earned size={200} /> : null}
        </div>
        <div className="k-cta min-h-16" style={{ display: "flex", justifyContent: "center" }}>
          {open ? (
            <ChunkyButton label="Voltar ao mapa" tone="sun" size="lg" onPress={onBack} className="w-full">
              Voltar ao mapa
            </ChunkyButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
