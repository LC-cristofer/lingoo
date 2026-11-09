import type { Card } from "@/domain/content-schema";

export const cards: Card[] = ["bear", "fox", "owl", "rabbit", "frog"].map((w) => ({
  id: w,
  word: w,
  image: `/content/forest-animals/${w}.svg`,
  audio: { text: w },
}));
