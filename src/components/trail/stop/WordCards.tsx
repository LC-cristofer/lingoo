"use client";

import { ART_WORDS } from "@/art/Animal";
import { narrator } from "@/audio/narrator";
import type { ArtId, Word } from "@/domain/trail/schema";
import { AnswerTile, TileGrid } from "../kit/AnswerTile";

/** The stop's words as tiles with the English word under each (tap to hear it). */
export function WordCards({ words, ids }: { words: Word[]; ids: ArtId[] }) {
  return (
    <div className="k-words">
      <TileGrid dense={ids.length % 3 === 0} six={ids.length === 6}>
        {ids.map((id) => {
          const word = words.find((w) => w.id === id);
          return (
            <div key={id} className="k-word">
              <AnswerTile
                id={id}
                label={ART_WORDS[id]}
                lang="en"
                data={{ "data-word": id }}
                onPress={() => {
                  narrator.playSfx("tap");
                  void narrator.playNarration(word?.say ?? [{ lang: "en-US", text: ART_WORDS[id] }]);
                }}
              />
              <b lang="en" className="k-word-en">
                {word?.en ?? ART_WORDS[id]}
              </b>
            </div>
          );
        })}
      </TileGrid>
    </div>
  );
}
