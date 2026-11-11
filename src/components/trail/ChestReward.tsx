"use client";

import { useEffect, useState } from "react";
import { Chest } from "@/art/scenes/Chest";
import { Sticker } from "@/art/scenes/Sticker";
import { narrator } from "@/audio/narrator";
import { BigButton } from "@/components/BigButton";
import type { Lines, LessonStop } from "@/domain/trail/schema";
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
      <div className="flex min-h-dvh flex-col items-center justify-center bg-cream p-4 text-ink">
        <BigButton label="Voltar ao mapa" color="leaf" onPress={onBack}>
          <span aria-hidden="true" className="font-display text-2xl font-bold">
            Voltar ao mapa
          </span>
        </BigButton>
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
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-cream p-4 text-ink">
      <p className="text-center font-display text-3xl font-bold">
        <NarrationText narration={open ? [...lines.chestOpen, ...sticker.name] : lines.chestPrompt} />
      </p>
      <div className="relative flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="Abrir o baú"
          disabled={open}
          onClick={openChest}
          className="min-h-16 min-w-16 rounded-3xl p-2 active:scale-95 disabled:active:scale-100"
        >
          <Chest open={open} size={220} />
        </button>
        {open ? <Sticker art={sticker.art} earned size={160} /> : null}
      </div>
      <div className="min-h-16">
        {open ? (
          <BigButton label="Voltar ao mapa" color="leaf" onPress={onBack}>
            <span aria-hidden="true" className="font-display text-2xl font-bold">
              Voltar ao mapa
            </span>
          </BigButton>
        ) : null}
      </div>
    </div>
  );
}
